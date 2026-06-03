import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { PageHeader } from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import {
  getResourceCompletionPercentage,
  getResourceDocument,
  getResourceExternalLinks,
  getResourceGoalCards,
  getResourceMilestones
} from "../../data/resourceLibrary";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";
import {
  getImpactLabel,
  getNextPathwayAction,
  getPathwayStageSummary
} from "../../lib/learningPathwayInsights";

type ProgressResponse = {
  employeeId: number;
  resourceId: string;
  completedModuleIndexes: number[];
};

type SubmissionStatus = "submitted" | "approved" | "needs_revision";
type SubmissionType = "module" | "final_assignment";
type CompletionDecision = "in_progress" | "completed" | "follow_up_required";

type ReviewHistoryRecord = {
  id: number;
  submissionId: number;
  reviewerId: number;
  reviewerName: string;
  status: "approved" | "needs_revision";
  comment: string | null;
  createdAt: string;
};

type SubmissionRecord = {
  id: number;
  employeeId: number;
  employeeName: string;
  resourceId: string;
  submissionType: SubmissionType;
  moduleIndex: number | null;
  submissionText: string;
  aiScore: number;
  aiFeedback: string;
  aiStrengths: string;
  aiImprovements: string;
  aiRecommendation: "ready_for_review" | "needs_revision";
  status: SubmissionStatus;
  reviewComment: string | null;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reviewHistory: ReviewHistoryRecord[];
  attachments: Array<{
    id: number;
    submissionId: number;
    originalName: string;
    storedName: string;
    mimeType: string;
    fileSize: number;
    fileUrl: string;
    uploadedAt: string;
  }>;
};

type SubmissionResponse = {
  employeeId: number;
  resourceId: string;
  moduleSubmissions: SubmissionRecord[];
  finalAssignmentSubmission: SubmissionRecord | null;
};

type AssignmentRecord = {
  id: number;
  employeeId: number;
  employeeName: string;
  resourceId: string;
  sourceEvaluationId: number | null;
  assignedBy: number | null;
  assignedByName: string | null;
  assignedAt: string;
  dueDate: string | null;
  completionDecision: CompletionDecision;
  decisionComment: string | null;
  decidedBy: number | null;
  decidedByName: string | null;
  decidedAt: string | null;
  completedAt: string | null;
  baselineScore: number | null;
  followUpScore: number | null;
  improvementDelta: number | null;
};

type AssignmentResponse = {
  employeeId: number;
  resourceId: string;
  assignment: AssignmentRecord | null;
};

type JourneyEvent = {
  id: string;
  title: string;
  detail: string;
  when: string;
  tone: "brand" | "emerald" | "amber" | "sky" | "slate";
};

function getStatusTone(status: SubmissionStatus) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "needs_revision":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function getStatusLabel(status: SubmissionStatus) {
  switch (status) {
    case "approved":
      return "Approved";
    case "needs_revision":
      return "Needs revision";
    default:
      return "Awaiting HR review";
  }
}

function getDecisionLabel(decision: CompletionDecision) {
  switch (decision) {
    case "completed":
      return "Completed";
    case "follow_up_required":
      return "Follow-up required";
    default:
      return "In progress";
  }
}

function getDecisionTone(decision: CompletionDecision) {
  switch (decision) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "follow_up_required":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getJourneyToneClasses(tone: JourneyEvent["tone"]) {
  switch (tone) {
    case "brand":
      return "border-brand-100 bg-brand-50/70 text-brand-700";
    case "emerald":
      return "border-emerald-100 bg-emerald-50/70 text-emerald-700";
    case "amber":
      return "border-amber-100 bg-amber-50/70 text-amber-700";
    case "sky":
      return "border-sky-100 bg-sky-50/70 text-sky-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function buildJourneyEvents(input: {
  assignment: AssignmentRecord | null;
  moduleSubmissions: SubmissionRecord[];
  finalAssignmentSubmission: SubmissionRecord | null;
}) {
  const events: JourneyEvent[] = [];

  if (input.assignment?.assignedAt) {
    events.push({
      id: "assigned",
      title: "Pathway assigned",
      detail: input.assignment.assignedByName
        ? `Assigned by ${input.assignment.assignedByName}.`
        : "The learning pathway was issued to address a performance need.",
      when: input.assignment.assignedAt,
      tone: "brand"
    });
  }

  for (const submission of input.moduleSubmissions) {
    if (submission.moduleIndex === null) {
      continue;
    }

    events.push({
      id: `module-${submission.id}`,
      title: `Module ${submission.moduleIndex + 1} evidence ${submission.status === "approved" ? "approved" : submission.status === "needs_revision" ? "returned for revision" : "submitted"}`,
      detail:
        submission.status === "approved"
          ? "The module now counts toward verified pathway progress."
          : submission.status === "needs_revision"
            ? "More evidence or clearer practical application is needed."
            : "AI review is complete and the submission is waiting for HR review.",
      when: submission.reviewedAt ?? submission.updatedAt,
      tone:
        submission.status === "approved"
          ? "emerald"
          : submission.status === "needs_revision"
            ? "amber"
            : "sky"
    });
  }

  if (input.finalAssignmentSubmission) {
    events.push({
      id: `final-${input.finalAssignmentSubmission.id}`,
      title:
        input.finalAssignmentSubmission.status === "approved"
          ? "Final assignment approved"
          : input.finalAssignmentSubmission.status === "needs_revision"
            ? "Final assignment needs revision"
            : "Final assignment submitted",
      detail:
        input.finalAssignmentSubmission.status === "approved"
          ? "The employee has demonstrated the pathway at assignment level."
          : input.finalAssignmentSubmission.status === "needs_revision"
            ? "The final pathway evidence needs improvement before closure."
            : "The employee has moved from module practice into final proof of learning.",
      when: input.finalAssignmentSubmission.reviewedAt ?? input.finalAssignmentSubmission.updatedAt,
      tone:
        input.finalAssignmentSubmission.status === "approved"
          ? "emerald"
          : input.finalAssignmentSubmission.status === "needs_revision"
            ? "amber"
            : "sky"
    });
  }

  if (input.assignment?.decidedAt) {
    events.push({
      id: `decision-${input.assignment.id}`,
      title: `HR marked pathway ${getDecisionLabel(input.assignment.completionDecision).toLowerCase()}`,
      detail: input.assignment.decisionComment || "A final HR pathway decision was recorded.",
      when: input.assignment.decidedAt,
      tone:
        input.assignment.completionDecision === "completed"
          ? "emerald"
          : input.assignment.completionDecision === "follow_up_required"
            ? "amber"
            : "slate"
    });
  }

  return events.sort((left, right) => right.when.localeCompare(left.when));
}

function renderReviewSummary(submission: SubmissionRecord) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTone(
              submission.status
            )}`}
          >
            {getStatusLabel(submission.status)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            AI score {submission.aiScore}
          </span>
        </div>
        <p className="text-xs text-slate-500">Submitted {submission.updatedAt}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{submission.submissionText}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">AI summary</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{submission.aiFeedback}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Strengths</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {submission.aiStrengths || "No strengths were highlighted yet."}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Improve next</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {submission.aiImprovements || "No major improvements were flagged."}
          </p>
        </div>
      </div>
      {submission.attachments.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Attachments</p>
          <div className="mt-3 space-y-2">
            {submission.attachments.map((attachment) => (
              <a
                className="inline-flex text-sm font-medium text-brand-700"
                href={`http://127.0.0.1:4002${attachment.fileUrl}`}
                key={attachment.id}
                rel="noreferrer"
                target="_blank"
              >
                {attachment.originalName} ({Math.ceil(attachment.fileSize / 1024)} KB)
              </a>
            ))}
          </div>
        </div>
      ) : null}
      {submission.reviewHistory.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">HR comment history</p>
          <div className="mt-3 space-y-3">
            {submission.reviewHistory.map((review) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3" key={review.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTone(
                      review.status
                    )}`}
                  >
                    {getStatusLabel(review.status)}
                  </span>
                  <p className="text-xs text-slate-500">
                    {review.reviewerName} on {review.createdAt}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {review.comment || "No written comment was added for this review."}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ResourceDetailPage() {
  const { resourceId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const resource = getResourceDocument(resourceId);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse | null>(null);
  const [assignment, setAssignment] = useState<AssignmentRecord | null>(null);
  const [error, setError] = useState("");
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<number | null>(null);
  const [moduleDrafts, setModuleDrafts] = useState<Record<number, string>>({});
  const [moduleAttachmentDrafts, setModuleAttachmentDrafts] = useState<Record<number, File | null>>({});
  const [finalAssignmentDraft, setFinalAssignmentDraft] = useState("");
  const [finalAttachmentDraft, setFinalAttachmentDraft] = useState<File | null>(null);
  const [reviewComments, setReviewComments] = useState<Record<number, string>>({});
  const [dueDateDraft, setDueDateDraft] = useState("");
  const [decisionDraft, setDecisionDraft] = useState<CompletionDecision>("in_progress");
  const [decisionCommentDraft, setDecisionCommentDraft] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);

  const employeeId = useMemo(() => {
    const fromQuery = Number(searchParams.get("employeeId") ?? "");

    if (fromQuery) {
      return fromQuery;
    }

    return session?.employeeProfile?.id ?? null;
  }, [searchParams, session]);

  const canSubmitEvidence = session?.user.role === "employee";
  const canReviewEvidence = session?.user.role === "hr_manager";
  const isReadOnlyObserver = session?.user.role === "admin";
  const externalLinks = getResourceExternalLinks(resourceId);
  const goalCards = getResourceGoalCards(resourceId);
  const milestoneCards = getResourceMilestones(resourceId);

  const completedModuleIndexes = progress?.completedModuleIndexes ?? [];
  const completionPercentage = getResourceCompletionPercentage(resourceId, completedModuleIndexes);
  const finalAssignmentSubmission = submissions?.finalAssignmentSubmission ?? null;
  const pendingReviewCount =
    (submissions?.moduleSubmissions.filter((item) => item.status === "submitted").length ?? 0) +
    (finalAssignmentSubmission?.status === "submitted" ? 1 : 0);
  const isPathwayCompleted = assignment?.completionDecision === "completed";

  const moduleSubmissionMap = useMemo(() => {
    const map = new Map<number, SubmissionRecord>();

    for (const submission of submissions?.moduleSubmissions ?? []) {
      if (submission.moduleIndex !== null) {
        map.set(submission.moduleIndex, submission);
      }
    }

    return map;
  }, [submissions]);

  const stageSummary = getPathwayStageSummary({
    moduleCount: resource?.modules.length ?? 0,
    completedModuleIndexes,
    finalAssignmentStatus: finalAssignmentSubmission?.status ?? null,
    completionDecision: assignment?.completionDecision ?? null
  });

  const nextAction = getNextPathwayAction({
    moduleCount: resource?.modules.length ?? 0,
    completedModuleIndexes,
    finalAssignmentStatus: finalAssignmentSubmission?.status ?? null,
    completionDecision: assignment?.completionDecision ?? null
  });

  const journeyEvents = useMemo(
    () =>
      buildJourneyEvents({
        assignment,
        moduleSubmissions: submissions?.moduleSubmissions ?? [],
        finalAssignmentSubmission
      }),
    [assignment, finalAssignmentSubmission, submissions]
  );

  async function loadPathwayState() {
    if (!resource || !employeeId) {
      return;
    }

    try {
      setError("");
      const [progressResponse, submissionResponse, assignmentResponse] = await Promise.all([
        api.get<ProgressResponse>("/learning-pathways/progress", {
          params: {
            employeeId,
            resourceId
          }
        }),
        api.get<SubmissionResponse>("/learning-pathways/submissions", {
          params: {
            employeeId,
            resourceId
          }
        }),
        api.get<AssignmentResponse>("/learning-pathways/assignments", {
          params: {
            employeeId,
            resourceId
          }
        })
      ]);

      setProgress(progressResponse.data);
      setSubmissions(submissionResponse.data);
      setAssignment(assignmentResponse.data.assignment);
      setDueDateDraft(assignmentResponse.data.assignment?.dueDate ?? "");
      setDecisionDraft(assignmentResponse.data.assignment?.completionDecision ?? "in_progress");
      setDecisionCommentDraft(assignmentResponse.data.assignment?.decisionComment ?? "");
      setReviewComments((current) => {
        const next = { ...current };

        for (const submission of submissionResponse.data.moduleSubmissions) {
          next[submission.id] = current[submission.id] ?? "";
        }

        if (submissionResponse.data.finalAssignmentSubmission) {
          const finalSubmission = submissionResponse.data.finalAssignmentSubmission;
          next[finalSubmission.id] = current[finalSubmission.id] ?? "";
        }

        return next;
      });
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load pathway progress and submissions."));
    }
  }

  useEffect(() => {
    void loadPathwayState();
  }, [employeeId, resource, resourceId]);

  async function submitEvidence(
    submissionType: SubmissionType,
    submissionText: string,
    moduleIndex?: number,
    attachmentFile?: File | null
  ) {
    if (!employeeId) {
      setError("Employee progress target is missing for this pathway.");
      return;
    }

    const key = submissionType === "module" ? `module-${moduleIndex}` : "final-assignment";
    setSubmittingKey(key);
    setError("");

    try {
      let attachment:
        | {
            fileName: string;
            mimeType: string;
            contentBase64: string;
          }
        | undefined;

      if (attachmentFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const value = String(reader.result ?? "");
            const [, contentBase64 = ""] = value.split(",");
            resolve(contentBase64);
          };
          reader.onerror = () => reject(new Error("Unable to read the selected file."));
          reader.readAsDataURL(attachmentFile);
        });

        attachment = {
          fileName: attachmentFile.name,
          mimeType: attachmentFile.type || "application/octet-stream",
          contentBase64: base64
        };
      }

      await api.post("/learning-pathways/submissions", {
        employeeId,
        resourceId,
        submissionType,
        moduleIndex: submissionType === "module" ? moduleIndex : null,
        submissionText,
        attachment
      });

      if (submissionType === "module" && typeof moduleIndex === "number") {
        setModuleDrafts((current) => ({
          ...current,
          [moduleIndex]: ""
        }));
        setModuleAttachmentDrafts((current) => ({
          ...current,
          [moduleIndex]: null
        }));
      } else {
        setFinalAssignmentDraft("");
        setFinalAttachmentDraft(null);
      }

      await loadPathwayState();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to submit evidence for AI review."));
    } finally {
      setSubmittingKey(null);
    }
  }

  async function handleModuleSubmit(event: FormEvent<HTMLFormElement>, moduleIndex: number) {
    event.preventDefault();
    const text = moduleDrafts[moduleIndex]?.trim() ?? "";

    if (!text) {
      setError(`Add evidence for module ${moduleIndex + 1} before submitting.`);
      return;
    }

    await submitEvidence("module", text, moduleIndex, moduleAttachmentDrafts[moduleIndex]);
  }

  async function handleFinalAssignmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = finalAssignmentDraft.trim();

    if (!text) {
      setError("Add the final assignment response before submitting.");
      return;
    }

    await submitEvidence("final_assignment", text, undefined, finalAttachmentDraft);
  }

  async function handleReview(submissionId: number, status: "approved" | "needs_revision") {
    setReviewingSubmissionId(submissionId);
    setError("");

    try {
      await api.put(`/learning-pathways/submissions/${submissionId}/review`, {
        status,
        reviewComment: reviewComments[submissionId] ?? ""
      });
      setReviewComments((current) => ({
        ...current,
        [submissionId]: ""
      }));
      await loadPathwayState();
    } catch (reviewError) {
      setError(getApiErrorMessage(reviewError, "Unable to save the HR review."));
    } finally {
      setReviewingSubmissionId(null);
    }
  }

  async function handleAssignmentSave() {
    if (!assignment) {
      return;
    }

    setSavingAssignment(true);
    setError("");

    try {
      const response = await api.put<AssignmentResponse>(`/learning-pathways/assignments/${assignment.id}`, {
        dueDate: dueDateDraft || null,
        completionDecision: decisionDraft,
        decisionComment: decisionCommentDraft
      });
      setAssignment(response.data.assignment);
      setDueDateDraft(response.data.assignment?.dueDate ?? "");
      setDecisionDraft(response.data.assignment?.completionDecision ?? "in_progress");
      setDecisionCommentDraft(response.data.assignment?.decisionComment ?? "");
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Unable to update pathway deadline or decision."));
    } finally {
      setSavingAssignment(false);
    }
  }

  if (!resource) {
    return (
      <div>
        <PageHeader
          eyebrow="Learning pathway"
          title="Learning pathway not found"
          description="The support pathway you tried to open is not available right now."
        />
        <div className="panel p-6">
          <p className="text-sm leading-6 text-slate-600">
            Go back to the recommendation area and open another learning pathway.
          </p>
          <Link className="btn-primary mt-6 inline-flex" to="/recommendations">
            Back to recommendations
          </Link>
        </div>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div>
        <PageHeader
          eyebrow="Learning pathway"
          title={resource.title}
          description="This pathway needs an employee context before progress, submissions, and reviews can be shown."
        />
        <div className="panel p-6">
          <p className="text-sm leading-6 text-slate-600">
            Open the pathway from the recommendations area so the system knows which employee record to attach to this
            learning workflow.
          </p>
          <Link className="btn-primary mt-6 inline-flex" to="/recommendations">
            Back to recommendations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Learning pathway" title={resource.title} description={resource.summary} />

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Approved progress</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Progress only moves forward after evidence is submitted, AI-reviewed, and approved by HR.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Completion</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{completionPercentage}%</p>
            </div>
          </div>
          <div className="mt-5 h-3 rounded-full bg-slate-200">
            <div
              className="h-3 rounded-full bg-brand-600 transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Approved modules</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {completedModuleIndexes.length}/{resource.modules.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pending reviews</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{pendingReviewCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Assigned</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{assignment?.assignedAt ?? "Pending sync"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Deadline</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{assignment?.dueDate ?? "Not set"}</p>
            </div>
          </div>
          {assignment ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getDecisionTone(
                  assignment.completionDecision
                )}`}
              >
                {getDecisionLabel(assignment.completionDecision)}
              </span>
              {assignment.completedAt ? (
                <span className="text-xs font-medium text-slate-500">Completed on {assignment.completedAt}</span>
              ) : null}
              {assignment.improvementDelta !== null ? (
                <span className="text-xs font-medium text-slate-500">
                  Score change after pathway: {assignment.improvementDelta > 0 ? "+" : ""}
                  {assignment.improvementDelta}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Current stage</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{stageSummary.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{stageSummary.detail}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Next best action</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{nextAction}</p>
            </div>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Pathway overview</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Format</dt>
              <dd className="font-semibold text-slate-950">{resource.format}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Target area</dt>
              <dd className="font-semibold text-slate-950">{resource.targetArea}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Estimated time</dt>
              <dd className="font-semibold text-slate-950">{resource.estimatedDuration}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Difficulty</dt>
              <dd className="font-semibold text-slate-950">{resource.difficulty}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-6 text-slate-600">{resource.recommendedFor}</p>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Impact snapshot</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{getImpactLabel(assignment?.improvementDelta)}</p>
            {assignment?.baselineScore !== null || assignment?.followUpScore !== null ? (
              <p className="mt-2 text-xs text-slate-500">
                Baseline: {assignment?.baselineScore ?? "N/A"} | Follow-up: {assignment?.followUpScore ?? "N/A"}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Why this pathway matters</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{resource.whyItMatters}</p>
          </article>

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Development goals</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              These are the outcomes this pathway is trying to build, not just the content it wants the employee to
              read.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {goalCards.map((goal) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4" key={goal.title}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">{goal.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{goal.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Learning objectives</h2>
            <div className="mt-4 space-y-3">
              {resource.learningObjectives.map((objective, index) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4" key={objective}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                    Objective {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{objective}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Milestone plan</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The pathway now acts like a guided improvement journey with explicit stages from diagnosis to proof of
              improvement.
            </p>
            <div className="mt-5 space-y-4">
              {milestoneCards.map((milestone, index) => (
                <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4" key={milestone.title}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{milestone.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Course modules</h2>
            <div className="mt-5 space-y-5">
              {resource.modules.map((module, index) => {
                const isCompleted = completedModuleIndexes.includes(index);
                const latestSubmission = moduleSubmissionMap.get(index) ?? null;
                const reviewValue = latestSubmission ? reviewComments[latestSubmission.id] ?? "" : "";

                return (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5" key={module.title}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                          Module {index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-slate-950">{module.title}</h3>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                          isCompleted
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : latestSubmission
                              ? getStatusTone(latestSubmission.status)
                              : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        {isCompleted
                          ? "Approved complete"
                          : latestSubmission
                            ? getStatusLabel(latestSubmission.status)
                            : "Awaiting submission"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{module.objective}</p>

                    <div className="mt-4 space-y-3">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div className="rounded-2xl bg-slate-50 px-4 py-3" key={lesson}>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Lesson {lessonIndex + 1}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{lesson}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          Practice task
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{module.practiceTask}</p>
                      </div>
                      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                          Checkpoint
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{module.checkpoint}</p>
                      </div>
                    </div>

                    {latestSubmission ? renderReviewSummary(latestSubmission) : null}

                    {canSubmitEvidence ? (
                      <form className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={(event) => void handleModuleSubmit(event, index)}>
                        <p className="text-sm font-semibold text-slate-950">Submit evidence for AI grading</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Describe what you completed, what you learned, and the practical evidence that shows this
                          module was applied.
                        </p>
                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          {[
                            "What action did you take after studying this module?",
                            "What evidence or example proves you applied it at work?",
                            "What changed in the quality, speed, or clarity of your work?",
                            "What still needs improvement before the next review?"
                          ].map((prompt) => (
                            <div className="rounded-2xl border border-slate-200 bg-white p-3" key={prompt}>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Evidence prompt
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{prompt}</p>
                            </div>
                          ))}
                        </div>
                        <textarea
                          className="input mt-4 min-h-32"
                          placeholder="Example: I rewrote two update messages, documented the change in clarity, and used the pathway checklist during a team handoff..."
                          value={moduleDrafts[index] ?? ""}
                          onChange={(event) =>
                            setModuleDrafts((current) => ({
                              ...current,
                              [index]: event.target.value
                            }))
                          }
                        />
                        <label className="mt-4 block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            Upload supporting file
                          </span>
                          <input
                            className="input"
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                            onChange={(event) =>
                              setModuleAttachmentDrafts((current) => ({
                                ...current,
                                [index]: event.target.files?.[0] ?? null
                              }))
                            }
                          />
                        </label>
                        {moduleAttachmentDrafts[index] ? (
                          <p className="mt-2 text-xs text-slate-500">
                            Selected: {moduleAttachmentDrafts[index]?.name}
                          </p>
                        ) : null}
                        <button
                          className="btn-primary mt-4"
                          disabled={submittingKey === `module-${index}`}
                          type="submit"
                        >
                          {submittingKey === `module-${index}`
                            ? "Submitting for AI review..."
                            : latestSubmission
                              ? "Resubmit module evidence"
                              : "Submit module evidence"}
                        </button>
                      </form>
                    ) : null}

                    {canReviewEvidence && latestSubmission ? (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-sm font-semibold text-slate-950">HR review</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Approve the module only when the evidence is strong enough to count toward pathway progress.
                        </p>
                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          {[
                            "Understanding: does the employee show clear grasp of the module objective?",
                            "Application: is there practical evidence, not just description?",
                            "Impact: does the evidence suggest better workplace behavior or output?",
                            "Coaching need: what should the employee fix before the next stage?"
                          ].map((criterion) => (
                            <div className="rounded-2xl border border-slate-200 bg-white p-3" key={criterion}>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Review lens
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{criterion}</p>
                            </div>
                          ))}
                        </div>
                        <textarea
                          className="input mt-4 min-h-24"
                          placeholder="Add a short HR review note or revision instruction"
                          value={reviewValue}
                          onChange={(event) =>
                            setReviewComments((current) => ({
                              ...current,
                              [latestSubmission.id]: event.target.value
                            }))
                          }
                        />
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            className="btn-primary"
                            disabled={reviewingSubmissionId === latestSubmission.id}
                            onClick={() => void handleReview(latestSubmission.id, "approved")}
                            type="button"
                          >
                            {reviewingSubmissionId === latestSubmission.id ? "Saving..." : "Approve module"}
                          </button>
                          <button
                            className="btn-secondary"
                            disabled={reviewingSubmissionId === latestSubmission.id}
                            onClick={() => void handleReview(latestSubmission.id, "needs_revision")}
                            type="button"
                          >
                            Request revision
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {isReadOnlyObserver && !latestSubmission ? (
                      <p className="mt-4 text-sm text-slate-500">
                        No evidence has been submitted for this module yet.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="space-y-6">
          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Final assignment</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">{resource.finalAssignment}</p>

            {finalAssignmentSubmission ? renderReviewSummary(finalAssignmentSubmission) : null}

            {canSubmitEvidence ? (
              <form className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={(event) => void handleFinalAssignmentSubmit(event)}>
                <p className="text-sm font-semibold text-slate-950">Submit the final assignment</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This is the main evidence pack for the pathway. Summarize your work, your results, and what changed
                  in practice.
                </p>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {[
                    "State the original weakness or gap this pathway was meant to address.",
                    "Describe the actions, practice tasks, or changes you carried out.",
                    "Show the evidence that performance behavior improved.",
                    "Explain what support or follow-up you still need from HR or your manager."
                  ].map((prompt) => (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3" key={prompt}>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Final assignment guide
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{prompt}</p>
                    </div>
                  ))}
                </div>
                <textarea
                  className="input mt-4 min-h-40"
                  placeholder="Summarize the assignment, the actions you took, what evidence you collected, and the result you achieved."
                  value={finalAssignmentDraft}
                  onChange={(event) => setFinalAssignmentDraft(event.target.value)}
                />
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Upload supporting file</span>
                  <input
                    className="input"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    onChange={(event) => setFinalAttachmentDraft(event.target.files?.[0] ?? null)}
                  />
                </label>
                {finalAttachmentDraft ? (
                  <p className="mt-2 text-xs text-slate-500">Selected: {finalAttachmentDraft.name}</p>
                ) : null}
                <button
                  className="btn-primary mt-4"
                  disabled={submittingKey === "final-assignment"}
                  type="submit"
                >
                  {submittingKey === "final-assignment"
                    ? "Submitting for AI review..."
                    : finalAssignmentSubmission
                      ? "Resubmit final assignment"
                      : "Submit final assignment"}
                </button>
              </form>
            ) : null}

            {canReviewEvidence && finalAssignmentSubmission ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-950">HR review</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Approve the final assignment when the employee has shown clear understanding and practical evidence.
                </p>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {[
                    "Did the employee show a clear before-and-after story?",
                    "Is the final evidence aligned with the KPI gap or recommendation that triggered the pathway?",
                    "Has the employee shown application, not just awareness?",
                    "What should happen next: close, continue coaching, or assign follow-up?"
                  ].map((criterion) => (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3" key={criterion}>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Final review lens
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{criterion}</p>
                    </div>
                  ))}
                </div>
                <textarea
                  className="input mt-4 min-h-24"
                  placeholder="Add a short HR review note or revision instruction"
                  value={reviewComments[finalAssignmentSubmission.id] ?? ""}
                  onChange={(event) =>
                    setReviewComments((current) => ({
                      ...current,
                      [finalAssignmentSubmission.id]: event.target.value
                    }))
                  }
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="btn-primary"
                    disabled={reviewingSubmissionId === finalAssignmentSubmission.id}
                    onClick={() => void handleReview(finalAssignmentSubmission.id, "approved")}
                    type="button"
                  >
                    {reviewingSubmissionId === finalAssignmentSubmission.id ? "Saving..." : "Approve assignment"}
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={reviewingSubmissionId === finalAssignmentSubmission.id}
                    onClick={() => void handleReview(finalAssignmentSubmission.id, "needs_revision")}
                    type="button"
                  >
                    Request revision
                  </button>
                </div>
              </div>
            ) : null}
          </article>

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Deadline and completion decision</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Keep the pathway anchored with a clear deadline and a final HR outcome once the assignment has been fully
              reviewed.
            </p>
            {assignment ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Assigned date</span>
                    <input className="input" disabled value={assignment.assignedAt} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Deadline</span>
                    <input
                      className="input"
                      disabled={!canReviewEvidence}
                      type="date"
                      value={dueDateDraft}
                      onChange={(event) => setDueDateDraft(event.target.value)}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Final pathway decision</span>
                  <select
                    className="input"
                    disabled={!canReviewEvidence}
                    value={decisionDraft}
                    onChange={(event) => setDecisionDraft(event.target.value as CompletionDecision)}
                  >
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="follow_up_required">Follow-up required</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Decision comment</span>
                  <textarea
                    className="input min-h-28"
                    disabled={!canReviewEvidence}
                    placeholder="Record the final HR decision, remaining gaps, or follow-up expectation."
                    value={decisionCommentDraft}
                    onChange={(event) => setDecisionCommentDraft(event.target.value)}
                  />
                </label>
                {assignment.improvementDelta !== null ? (
                  <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                      Evaluation impact
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Baseline score: {assignment.baselineScore ?? "N/A"} | Latest follow-up score:{" "}
                      {assignment.followUpScore ?? "N/A"} | Change:{" "}
                      {assignment.improvementDelta > 0 ? "+" : ""}
                      {assignment.improvementDelta}
                    </p>
                  </div>
                ) : null}
                {assignment.decidedAt ? (
                  <p className="text-xs text-slate-500">
                    Last decision recorded on {assignment.decidedAt}
                    {assignment.decidedByName ? ` by ${assignment.decidedByName}` : ""}.
                  </p>
                ) : null}
                {canReviewEvidence ? (
                  <button className="btn-primary" disabled={savingAssignment} onClick={() => void handleAssignmentSave()} type="button">
                    {savingAssignment ? "Saving decision..." : "Save deadline and decision"}
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                The pathway assignment is still being prepared from the employee recommendation record.
              </p>
            )}
          </article>

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Development journey timeline</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              This timeline shows how the employee moved from assignment to evidence, review, and pathway outcome.
            </p>
            {journeyEvents.length > 0 ? (
              <div className="mt-5 space-y-4">
                {journeyEvents.map((event, index) => (
                  <div className="flex gap-4" key={event.id}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${getJourneyToneClasses(
                          event.tone
                        )}`}
                      >
                        {journeyEvents.length - index}
                      </div>
                      {index < journeyEvents.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
                    </div>
                    <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-slate-950">{event.title}</p>
                        <p className="text-xs text-slate-500">{event.when}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{event.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                The journey timeline will fill in as the employee submits evidence and HR records progress decisions.
              </p>
            )}
          </article>

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Success indicators</h2>
            <div className="mt-4 space-y-3">
              {resource.successIndicators.map((indicator) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-4" key={indicator}>
                  <p className="text-sm leading-6 text-slate-700">{indicator}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">External learning resources</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Use these curated external courses and learning libraries when the employee needs a deeper structured
              resource beyond the in-app pathway.
            </p>
            <div className="mt-4 space-y-3">
              {externalLinks.map((link) => (
                <a
                  className="block rounded-2xl border border-slate-200 bg-white p-4"
                  href={link.url}
                  key={`${link.provider}-${link.title}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <p className="text-sm font-semibold text-slate-950">{link.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {link.provider} · {link.type}
                  </p>
                </a>
              ))}
            </div>
          </article>

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Manager follow-up</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">{resource.managerFollowUp}</p>
            <p className="mt-4 text-sm text-slate-500">
              {canSubmitEvidence
                ? "Your pathway progress advances only after HR approves the evidence you submit."
                : canReviewEvidence
                  ? "Use the AI score as a first-pass indicator, then apply HR judgment before approving progress or closing the pathway."
                  : "This role can monitor progress, AI feedback, HR comment history, and final pathway decisions in view-only mode."}
            </p>
            <Link className="btn-primary mt-6 inline-flex" to="/recommendations">
              Back to recommendations
            </Link>
          </article>
        </section>
      </div>
    </div>
  );
}
