import type { TaskRow } from "../repositories/taskRepository";

export type TaskAutoEvaluationResult = {
  aiScore: number;
  aiFeedback: string;
  aiStrengths: string;
  aiImprovements: string;
  aiRecommendation: "ready_for_review" | "needs_revision";
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

function countMatches(tokens: string[], keywords: string[]) {
  const unique = new Set(tokens);
  return keywords.reduce((count, keyword) => count + (unique.has(keyword) ? 1 : 0), 0);
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function evaluateTaskSubmission(input: {
  task: TaskRow;
  submissionNote: string;
  submittedAt: string;
  attachmentCount: number;
}): TaskAutoEvaluationResult {
  const tokens = tokenize(
    `${input.task.title}\n${input.task.description}\n${input.task.linkedKpiName ?? ""}\n${input.submissionNote}`
  );
  const wordCount = input.submissionNote
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean).length;
  const positiveSignals = [
    "completed",
    "delivered",
    "resolved",
    "improved",
    "analyzed",
    "organized",
    "documented",
    "submitted",
    "reviewed",
    "achieved",
    "updated"
  ];
  const taskKeywords = tokenize(
    `${input.task.title} ${input.task.description} ${input.task.linkedKpiName ?? ""}`
  );
  const keywordMatches = countMatches(tokens, taskKeywords);
  const positiveMatches = countMatches(tokens, positiveSignals);
  const dueDate = parseDate(input.task.dueDate ? `${input.task.dueDate}T23:59:59` : null);
  const submittedAt = parseDate(input.submittedAt);
  const isOnTime =
    dueDate && submittedAt ? submittedAt.getTime() <= dueDate.getTime() : null;
  const timelinessScore = isOnTime === null ? 70 : isOnTime ? 100 : 45;
  const noteDepthScore = clamp((wordCount / 80) * 100, 30, 100);
  const evidenceScore = clamp(45 + Math.min(input.attachmentCount, 3) * 18, 45, 100);
  const relevanceScore = clamp(45 + Math.min(keywordMatches, 10) * 5, 45, 95);
  const clarityScore = clamp(50 + Math.min(positiveMatches, 5) * 9, 50, 95);
  const aiScore = round(
    timelinessScore * 0.25 +
      noteDepthScore * 0.25 +
      evidenceScore * 0.2 +
      relevanceScore * 0.15 +
      clarityScore * 0.15
  );

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (isOnTime === true) {
    strengths.push("Work was submitted on time.");
  } else if (isOnTime === false) {
    improvements.push("Submit before the deadline to strengthen the timeliness signal.");
  }

  if (wordCount >= 60) {
    strengths.push("Submission note includes useful detail about the completed work.");
  } else {
    improvements.push("Add more detail to explain what was done, what changed, and the outcome.");
  }

  if (input.attachmentCount > 0) {
    strengths.push("Supporting evidence was attached to the submission.");
  } else {
    improvements.push("Attach supporting evidence where possible to strengthen quality review.");
  }

  if (keywordMatches >= 4) {
    strengths.push("Submission content aligns well with the assigned task and KPI focus.");
  } else {
    improvements.push("Describe the work in terms that clearly connect it to the assigned task and KPI.");
  }

  const aiRecommendation = aiScore >= 70 ? "ready_for_review" : "needs_revision";
  const aiFeedback =
    aiRecommendation === "ready_for_review"
      ? `AI pre-review scored this submission at ${aiScore}. The work appears strong enough for manager review based on timeliness, submission detail, and supporting evidence.`
      : `AI pre-review scored this submission at ${aiScore}. The work likely needs revision before approval because the system found gaps in evidence, detail, or task alignment.`;

  return {
    aiScore,
    aiFeedback,
    aiStrengths: strengths.join(" "),
    aiImprovements: improvements.join(" "),
    aiRecommendation
  };
}
