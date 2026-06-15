import { env } from "../config/env";
import type { KpiRecord } from "../types/domain";
import type { TaskEvaluationEvidence } from "./taskEvaluationEvidenceService";

type RemoteEvaluationDetail = {
  kpi_id: number;
  score: number;
  rationale: string;
};

type RemoteEvaluationResponse = {
  overall_score: number;
  summary: string;
  strengths: string[];
  risks: string[];
  kpi_scores: RemoteEvaluationDetail[];
};

export type AiEvaluationDetail = {
  kpiId: number;
  score: number;
  rationale: string;
};

export type AiEvaluationResult = {
  overallScore: number;
  summary: string;
  strengths: string[];
  risks: string[];
  details: AiEvaluationDetail[];
  source: "remote_ai_service" | "local_fallback";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundScore(value: number) {
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

function buildKeywords(kpi: KpiRecord) {
  return [...tokenize(kpi.kpiName), ...tokenize(kpi.description)].filter(
    (value, index, collection) => collection.indexOf(value) === index
  );
}

function buildLocalRationale(
  kpi: KpiRecord,
  score: number,
  metrics: {
    completionRate: number;
    approvalRate: number;
    onTimeRate: number | null;
    revisionRate: number;
  },
  keywordMatches: number
) {
  if (score >= 80) {
    return `${kpi.kpiName} scored strongly because objective task outcomes were healthy${metrics.onTimeRate === null ? "" : `, timeliness was ${metrics.onTimeRate}%`} and the evidence aligned clearly with this KPI.`;
  }

  if (score < 65) {
    return `${kpi.kpiName} needs attention because task outcomes showed weaker delivery patterns${metrics.onTimeRate === null ? "" : `, including timeliness at ${metrics.onTimeRate}%`} and the review trail contained limited strong evidence for this KPI.`;
  }

  return `${kpi.kpiName} received a moderate score because the employee showed mixed objective results across completion, approval, and revision signals, with ${keywordMatches} strong evidence matches for this KPI.`;
}

function runLocalEvaluation(input: {
  employeeName: string;
  remarks: string;
  kpis: KpiRecord[];
  taskEvidence: TaskEvaluationEvidence;
}): AiEvaluationResult {
  const mergedText = `${input.taskEvidence.summary}\n${input.taskEvidence.taskHighlights.join("\n")}\n${input.remarks}`.trim();
  const tokens = tokenize(mergedText);
  const positiveSignals = [
    "achieved",
    "improved",
    "delivered",
    "completed",
    "supported",
    "efficient",
    "reliable",
    "proactive",
    "clear",
    "accurate",
    "timely",
    "collaborative",
    "consistent",
    "quality",
    "initiative",
    "resolved",
    "exceeded",
    "organized"
  ];
  const negativeSignals = [
    "late",
    "delay",
    "missed",
    "error",
    "errors",
    "incomplete",
    "unclear",
    "complaint",
    "slow",
    "issue",
    "issues",
    "failed",
    "needs",
    "revision",
    "poor",
    "absent",
    "weak"
  ];
  const evidenceLengthBonus = clamp(tokens.length / 120, 0, 1) * 6;
  const globalMetrics = input.taskEvidence.metrics;
  const details = input.kpis.map((kpi) => {
    const matchedSummary =
      input.taskEvidence.kpiSummaries.find((summary) => summary.kpiId === kpi.id) ??
      input.taskEvidence.kpiSummaries.find(
        (summary) => summary.kpiName?.toLowerCase() === kpi.kpiName.toLowerCase()
      ) ??
      null;
    const metrics = matchedSummary?.metrics ?? globalMetrics;
    const evidenceText = `${matchedSummary?.evidenceText ?? ""}\n${input.taskEvidence.summary}`.trim();
    const evidenceTokens = tokenize(evidenceText);
    const keywords = buildKeywords(kpi);
    const keywordMatches = countMatches(evidenceTokens, keywords);
    const positiveMatches = countMatches(evidenceTokens, positiveSignals);
    const negativeMatches = countMatches(evidenceTokens, negativeSignals);
    const specificityBoost = Math.min(keywordMatches, 5) * 3;
    const textQualityScore = clamp(55 + positiveMatches * 4 - negativeMatches * 5 + specificityBoost + evidenceLengthBonus, 35, 95);
    const objectiveCompletion = metrics.completionRate;
    const objectiveApproval = metrics.approvalRate;
    const objectiveTimeliness = metrics.onTimeRate ?? 65;
    const objectiveRevisionInverse = 100 - metrics.revisionRate;
    const objectiveSubmissionRichness = clamp(metrics.averageSubmissionWords / 2.2 + Math.min(metrics.attachmentCount, 6) * 4, 35, 100);
    const lowerName = kpi.kpiName.toLowerCase();
    let score = 0;

    if (lowerName.includes("time") || lowerName.includes("deadline")) {
      score = objectiveTimeliness * 0.55 + objectiveCompletion * 0.2 + objectiveApproval * 0.15 + textQualityScore * 0.1;
    } else if (lowerName.includes("quality")) {
      score = textQualityScore * 0.35 + objectiveApproval * 0.3 + objectiveRevisionInverse * 0.2 + objectiveSubmissionRichness * 0.15;
    } else if (lowerName.includes("product")) {
      score = objectiveCompletion * 0.35 + objectiveTimeliness * 0.25 + objectiveApproval * 0.2 + textQualityScore * 0.2;
    } else if (lowerName.includes("target")) {
      score = objectiveCompletion * 0.4 + objectiveApproval * 0.25 + objectiveTimeliness * 0.2 + textQualityScore * 0.15;
    } else if (lowerName.includes("commun")) {
      score = textQualityScore * 0.4 + objectiveSubmissionRichness * 0.25 + objectiveApproval * 0.2 + objectiveTimeliness * 0.15;
    } else if (lowerName.includes("initiative")) {
      score = textQualityScore * 0.35 + objectiveCompletion * 0.25 + objectiveTimeliness * 0.2 + objectiveSubmissionRichness * 0.2;
    } else {
      score = objectiveCompletion * 0.3 + objectiveApproval * 0.25 + objectiveTimeliness * 0.2 + textQualityScore * 0.25;
    }

    return {
      kpiId: kpi.id,
      score: roundScore(clamp(score, 35, 98)),
      rationale: buildLocalRationale(kpi, score, metrics, keywordMatches)
    };
  });

  const overallScore = roundScore(
    details.reduce((sum, detail) => {
      const kpi = input.kpis.find((item) => item.id === detail.kpiId);
      return sum + (detail.score / 100) * Number(kpi?.weightPercentage ?? 0);
    }, 0)
  );

  const sorted = [...details].sort((left, right) => right.score - left.score);
  const strengths = sorted.slice(0, 2).map((detail) => {
    const kpi = input.kpis.find((item) => item.id === detail.kpiId);
    return kpi?.kpiName ?? "Unknown KPI";
  });
  const risks = [...details]
    .sort((left, right) => left.score - right.score)
    .slice(0, 2)
    .map((detail) => {
      const kpi = input.kpis.find((item) => item.id === detail.kpiId);
      return kpi?.kpiName ?? "Unknown KPI";
    });

  return {
    overallScore,
    summary: `AI evaluation reviewed task delivery data for ${input.employeeName} between ${input.taskEvidence.periodStartDate} and ${input.taskEvidence.periodEndDate}. ${input.taskEvidence.metrics.totalTasks} tasks were analyzed, producing an estimated overall score of ${overallScore}. Stronger evidence appeared around ${strengths.join(" and ") || "the main KPIs"}, while ${risks.join(" and ") || "some KPI areas"} may need closer review.`,
    strengths,
    risks,
    details,
    source: "local_fallback"
  };
}

function isRemoteEvaluationResponse(value: unknown): value is RemoteEvaluationResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RemoteEvaluationResponse>;
  return (
    typeof candidate.overall_score === "number" &&
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.kpi_scores)
  );
}

export async function generateAiEvaluation(input: {
  employeeName: string;
  remarks: string;
  kpis: KpiRecord[];
  taskEvidence: TaskEvaluationEvidence;
}): Promise<AiEvaluationResult> {
  if (env.aiServiceUrl) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), env.aiServiceTimeoutMs);

      const response = await fetch(`${env.aiServiceUrl}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          employee_name: input.employeeName,
          remarks: input.remarks,
          evaluation_period: {
            start_date: input.taskEvidence.periodStartDate,
            end_date: input.taskEvidence.periodEndDate
          },
          overall_metrics: input.taskEvidence.metrics,
          task_highlights: input.taskEvidence.taskHighlights,
          kpi_evidence: input.taskEvidence.kpiSummaries.map((summary) => ({
            kpi_id: summary.kpiId,
            kpi_name: summary.kpiName,
            metrics: summary.metrics,
            evidence_text: summary.evidenceText
          })),
          kpis: input.kpis.map((kpi) => ({
            id: kpi.id,
            kpi_name: kpi.kpiName,
            weight_percentage: Number(kpi.weightPercentage),
            description: kpi.description ?? ""
          }))
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const body: unknown = await response.json();

        if (isRemoteEvaluationResponse(body)) {
          return {
            overallScore: roundScore(body.overall_score),
            summary: body.summary,
            strengths: Array.isArray(body.strengths) ? body.strengths : [],
            risks: Array.isArray(body.risks) ? body.risks : [],
            details: body.kpi_scores.map((detail) => ({
              kpiId: Number(detail.kpi_id),
              score: roundScore(Number(detail.score)),
              rationale: String(detail.rationale ?? "")
            })),
            source: "remote_ai_service"
          };
        }
      }
    } catch {
      // Fall back to the local evaluator when the AI service is unavailable.
    }
  }

  return runLocalEvaluation(input);
}
