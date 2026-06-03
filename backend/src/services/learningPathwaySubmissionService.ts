import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { withTransaction } from "../database/transaction";
import { getLearningPathwayRubric } from "../data/learningPathwayCatalog";
import { createActivityLog } from "../repositories/activityLogRepository";
import { findEmployeeById, findEmployeeByUserId } from "../repositories/employeeRepository";
import {
  createLearningPathwaySubmission,
  findLearningPathwaySubmissionById,
  listLearningPathwaySubmissions
} from "../repositories/learningPathwaySubmissionRepository";
import {
  createLearningPathwaySubmissionReview,
  listLearningPathwaySubmissionReviews
} from "../repositories/learningPathwaySubmissionReviewRepository";
import {
  createSubmissionAttachment,
  listSubmissionAttachments
} from "../repositories/submissionAttachmentRepository";
import {
  markLearningPathwayModuleComplete,
  removeLearningPathwayModuleCompletion
} from "../repositories/learningPathwayProgressRepository";
import { updateLearningPathwaySubmissionReview } from "../repositories/learningPathwaySubmissionRepository";
import type {
  AuthenticatedUser,
  LearningPathwayAiRecommendation,
  LearningPathwaySubmissionStatus,
  LearningPathwaySubmissionType
} from "../types/domain";
import { ApiError } from "../utils/ApiError";

const uploadDirectory = path.join(process.cwd(), "uploads", "learning-pathways");
const allowedAttachmentMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "image/png",
  "image/jpeg"
]);

function normalizeText(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function countWords(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function evaluateSubmission(input: {
  resourceId: string;
  submissionType: LearningPathwaySubmissionType;
  moduleIndex: number | null;
  submissionText: string;
}) {
  const rubric = getLearningPathwayRubric(input.resourceId);

  if (!rubric) {
    throw new ApiError(404, "Learning pathway rubric was not found.");
  }

  const lowerText = input.submissionText.toLowerCase();
  const wordCount = countWords(input.submissionText);
  const moduleRubric =
    input.submissionType === "module" && input.moduleIndex !== null
      ? rubric.moduleRubrics[input.moduleIndex] ?? null
      : null;
  const keywords =
    input.submissionType === "final_assignment"
      ? rubric.finalAssignmentKeywords
      : moduleRubric?.keywords ?? [];
  const matchedKeywords = keywords.filter((keyword) => lowerText.includes(keyword.toLowerCase()));
  const keywordCoverage =
    keywords.length === 0 ? 0 : matchedKeywords.length / keywords.length;
  const structureSignals = ["because", "therefore", "plan", "review", "improve", "action", "result"];
  const structureMatches = structureSignals.filter((signal) => lowerText.includes(signal)).length;

  const lengthScore = Math.min(wordCount / Math.max(rubric.minimumWordCount, 1), 1) * 35;
  const keywordScore = Math.min(keywordCoverage, 1) * 45;
  const structureScore = Math.min(structureMatches / 4, 1) * 20;
  const aiScore = Math.round((lengthScore + keywordScore + structureScore) * 100) / 100;

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (wordCount >= rubric.minimumWordCount) {
    strengths.push("Submission length is sufficient for review.");
  } else {
    improvements.push(`Add more detail. The submission currently has ${wordCount} words and should be at least ${rubric.minimumWordCount}.`);
  }

  if (matchedKeywords.length >= Math.max(2, Math.ceil(keywords.length / 2))) {
    strengths.push("The response addresses important pathway concepts.");
  } else if (keywords.length > 0) {
    improvements.push("Reference more of the pathway concepts directly and explain how they apply.");
  }

  if (structureMatches >= 2) {
    strengths.push("The response shows a practical action-oriented structure.");
  } else {
    improvements.push("Make the response more action-oriented by describing what will be done, reviewed, or improved.");
  }

  const aiRecommendation: LearningPathwayAiRecommendation =
    aiScore >= 65 ? "ready_for_review" : "needs_revision";
  const aiFeedback =
    aiRecommendation === "ready_for_review"
      ? `AI review suggests this submission is strong enough for HR review with a score of ${aiScore}.`
      : `AI review suggests revision before approval. Current score is ${aiScore}. Expand the explanation and show clearer evidence of understanding.`;

  return {
    aiScore,
    aiFeedback,
    aiStrengths: strengths.join(" "),
    aiImprovements: improvements.join(" "),
    aiRecommendation
  };
}

async function resolveEmployeeForLearning(actor: AuthenticatedUser, employeeId?: number) {
  if (actor.role === "employee") {
    const employee = await findEmployeeByUserId(actor.id);

    if (!employee) {
      throw new ApiError(404, "Employee profile not found for the signed-in user.");
    }

    if (employeeId && employeeId !== employee.id) {
      throw new ApiError(403, "Employees can only manage their own learning pathways.");
    }

    return employee;
  }

  const requestedId = Number(employeeId);

  if (!requestedId) {
    throw new ApiError(400, "Employee selection is required.");
  }

  const employee = await findEmployeeById(requestedId);

  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  return employee;
}

async function buildSubmissionResponse(rows: Awaited<ReturnType<typeof listLearningPathwaySubmissions>>) {
  const reviewRows = await listLearningPathwaySubmissionReviews(rows.map((row) => row.id));
  const attachmentRows = await listSubmissionAttachments(rows.map((row) => row.id));
  const reviewMap = new Map<number, typeof reviewRows>();
  const attachmentMap = new Map<number, typeof attachmentRows>();

  for (const review of reviewRows) {
    const current = reviewMap.get(review.submissionId) ?? [];
    current.push(review);
    reviewMap.set(review.submissionId, current);
  }

  for (const attachment of attachmentRows) {
    const current = attachmentMap.get(attachment.submissionId) ?? [];
    current.push(attachment);
    attachmentMap.set(attachment.submissionId, current);
  }

  const latestModuleSubmissions = new Map<number, (typeof rows)[number]>();
  let finalAssignmentSubmission: (typeof rows)[number] | null = null;

  for (const row of rows) {
    if (row.submissionType === "final_assignment") {
      if (!finalAssignmentSubmission) {
        finalAssignmentSubmission = row;
      }
      continue;
    }

    if (row.moduleIndex !== null && !latestModuleSubmissions.has(row.moduleIndex)) {
      latestModuleSubmissions.set(row.moduleIndex, row);
    }
  }

  const withHistory = rows.map((row) => ({
    ...row,
    reviewHistory: reviewMap.get(row.id) ?? [],
    attachments: attachmentMap.get(row.id) ?? []
  }));

  return {
    moduleSubmissions: [...latestModuleSubmissions.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([, value]) => withHistory.find((row) => row.id === value.id)!)
      .filter(Boolean),
    finalAssignmentSubmission:
      finalAssignmentSubmission === null
        ? null
        : withHistory.find((row) => row.id === finalAssignmentSubmission.id) ?? null
  };
}

export async function getLearningPathwaySubmissionsForPathway(
  actor: AuthenticatedUser,
  input: {
    employeeId?: number;
    resourceId?: string;
  }
) {
  const resourceId = normalizeText(input.resourceId);

  if (!resourceId) {
    throw new ApiError(400, "Resource ID is required.");
  }

  const employee = await resolveEmployeeForLearning(actor, input.employeeId);
  const rows = await listLearningPathwaySubmissions({
    employeeId: employee.id,
    resourceId
  });

  return {
    employeeId: employee.id,
    resourceId,
    ...(await buildSubmissionResponse(rows))
  };
}

export async function submitLearningPathwayEvidence(
  actor: AuthenticatedUser,
  input: {
    employeeId?: number;
    resourceId?: string;
    submissionType?: LearningPathwaySubmissionType;
    moduleIndex?: number | null;
    submissionText?: string;
    attachment?: {
      fileName?: string;
      mimeType?: string;
      contentBase64?: string;
    } | null;
  }
) {
  if (actor.role !== "employee") {
    throw new ApiError(403, "Only employees can submit pathway evidence.");
  }

  const resourceId = normalizeText(input.resourceId);
  const submissionText = normalizeText(input.submissionText);
  const submissionType = input.submissionType ?? "module";
  let moduleIndex: number | null = null;

  if (!resourceId) {
    throw new ApiError(400, "Resource ID is required.");
  }

  if (!submissionText) {
    throw new ApiError(400, "Submission text is required.");
  }

  if (submissionType === "module") {
    const parsedModuleIndex = Number(input.moduleIndex);

    if (!Number.isInteger(parsedModuleIndex) || parsedModuleIndex < 0) {
      throw new ApiError(400, "A valid module index is required.");
    }

    moduleIndex = parsedModuleIndex;
  }

  const employee = await resolveEmployeeForLearning(actor, input.employeeId);
  const rubric = getLearningPathwayRubric(resourceId);

  if (!rubric) {
    throw new ApiError(404, "Learning pathway rubric was not found.");
  }

  if (submissionType === "module" && moduleIndex !== null && moduleIndex >= rubric.moduleCount) {
    throw new ApiError(400, "Module index is outside the pathway range.");
  }

  const grading = evaluateSubmission({
    resourceId,
    submissionType,
    moduleIndex,
    submissionText
  });
  const moduleNumberForLog = submissionType === "module" && moduleIndex !== null ? moduleIndex + 1 : null;

  let attachmentPayload: {
    originalName: string;
    storedName: string;
    mimeType: string;
    fileSize: number;
    fileUrl: string;
    buffer: Buffer;
  } | null = null;

  if (input.attachment?.contentBase64 && input.attachment.fileName && input.attachment.mimeType) {
    if (!allowedAttachmentMimeTypes.has(input.attachment.mimeType)) {
      throw new ApiError(400, "Attachment type is not supported.");
    }

    const buffer = Buffer.from(input.attachment.contentBase64, "base64");

    if (buffer.byteLength > 5 * 1024 * 1024) {
      throw new ApiError(400, "Attachment size must not exceed 5 MB.");
    }

    const safeFileName = input.attachment.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const storedName = `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;
    attachmentPayload = {
      originalName: input.attachment.fileName,
      storedName,
      mimeType: input.attachment.mimeType,
      fileSize: buffer.byteLength,
      fileUrl: `/uploads/learning-pathways/${storedName}`,
      buffer
    };
  }

  await withTransaction(async (connection) => {
    const submissionId = await createLearningPathwaySubmission(connection, {
      employeeId: employee.id,
      resourceId,
      submissionType,
      moduleIndex,
      submissionText,
      aiScore: grading.aiScore,
      aiFeedback: grading.aiFeedback,
      aiStrengths: grading.aiStrengths,
      aiImprovements: grading.aiImprovements,
      aiRecommendation: grading.aiRecommendation
    });

    if (attachmentPayload) {
      await mkdir(uploadDirectory, { recursive: true });
      await writeFile(path.join(uploadDirectory, attachmentPayload.storedName), attachmentPayload.buffer);

      await createSubmissionAttachment(connection, {
        submissionId,
        originalName: attachmentPayload.originalName,
        storedName: attachmentPayload.storedName,
        mimeType: attachmentPayload.mimeType,
        fileSize: attachmentPayload.fileSize,
        fileUrl: attachmentPayload.fileUrl
      });
    }

    if (submissionType === "module" && moduleIndex !== null) {
      await removeLearningPathwayModuleCompletion(connection, {
        employeeId: employee.id,
        resourceId,
        moduleIndex
      });
    }

    await createActivityLog(connection, {
      userId: actor.id,
      action: `Submitted ${moduleNumberForLog ? `module ${moduleNumberForLog}` : "final assignment"} evidence for ${resourceId}${attachmentPayload ? " with attachment" : ""}.`
    });
  });

  return getLearningPathwaySubmissionsForPathway(actor, {
    employeeId: employee.id,
    resourceId
  });
}

export async function reviewLearningPathwaySubmission(
  actor: AuthenticatedUser,
  submissionId: number,
  input: {
    status?: LearningPathwaySubmissionStatus;
    reviewComment?: string;
  }
) {
  if (actor.role !== "hr_manager") {
    throw new ApiError(403, "Only HR managers can review pathway submissions.");
  }

  const submission = await findLearningPathwaySubmissionById(submissionId);

  if (!submission) {
    throw new ApiError(404, "Learning pathway submission not found.");
  }

  const status = input.status;
  const reviewComment = normalizeText(input.reviewComment);

  if (status !== "approved" && status !== "needs_revision") {
    throw new ApiError(400, "Review status must be approved or needs_revision.");
  }

  await withTransaction(async (connection) => {
    await updateLearningPathwaySubmissionReview(connection, {
      submissionId,
      status,
      reviewComment,
      reviewedBy: actor.id
    });

    await createLearningPathwaySubmissionReview(connection, {
      submissionId,
      reviewerId: actor.id,
      status,
      comment: reviewComment
    });

    if (submission.submissionType === "module" && submission.moduleIndex !== null) {
      if (status === "approved") {
        await markLearningPathwayModuleComplete(connection, {
          employeeId: submission.employeeId,
          resourceId: submission.resourceId,
          moduleIndex: submission.moduleIndex
        });
      } else {
        await removeLearningPathwayModuleCompletion(connection, {
          employeeId: submission.employeeId,
          resourceId: submission.resourceId,
          moduleIndex: submission.moduleIndex
        });
      }
    }

    await createActivityLog(connection, {
      userId: actor.id,
      action: `${status === "approved" ? "Approved" : "Requested revision for"} learning pathway submission ${submissionId}.`
    });
  });

  return getLearningPathwaySubmissionsForPathway(actor, {
    employeeId: submission.employeeId,
    resourceId: submission.resourceId
  });
}
