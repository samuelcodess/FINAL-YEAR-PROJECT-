import { env } from "../config/env";
import type { KpiRecord } from "../types/domain";

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

function buildLocalRationale(kpi: KpiRecord, score: number, positiveMatches: number, negativeMatches: number) {
  if (positiveMatches > negativeMatches && score >= 75) {
    return `${kpi.kpiName} scored well because the submitted evidence included several positive signals related to ${kpi.kpiName.toLowerCase()}.`;
  }

  if (negativeMatches > positiveMatches && score < 65) {
    return `${kpi.kpiName} needs attention because the submitted evidence included risk signals that suggest weaker delivery in this area.`;
  }

  return `${kpi.kpiName} received a moderate score because the evidence was only partially specific for this KPI and would benefit from clearer measurable examples.`;
}

function runLocalEvaluation(input: {
  employeeName: string;
  evidence: string;
  remarks: string;
  kpis: KpiRecord[];
}): AiEvaluationResult {
  const mergedText = `${input.evidence}\n${input.remarks}`.trim();
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
  const evidenceLengthBonus = clamp(tokens.length / 45, 0, 1) * 8;
  const details = input.kpis.map((kpi) => {
    const keywords = buildKeywords(kpi);
    const keywordMatches = countMatches(tokens, keywords);
    const positiveMatches = countMatches(tokens, positiveSignals);
    const negativeMatches = countMatches(tokens, negativeSignals);
    const specificityBoost = Math.min(keywordMatches, 4) * 4;
    const score = clamp(
      58 + evidenceLengthBonus + specificityBoost + positiveMatches * 3 - negativeMatches * 4,
      35,
      98
    );

    return {
      kpiId: kpi.id,
      score: roundScore(score),
      rationale: buildLocalRationale(kpi, score, positiveMatches, negativeMatches)
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
    summary: `AI evaluation reviewed the submitted evidence for ${input.employeeName} and estimated an overall score of ${overallScore}. Stronger evidence appeared around ${strengths.join(" and ") || "the main KPIs"}, while ${risks.join(" and ") || "some KPI areas"} may need closer review.`,
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
  evidence: string;
  remarks: string;
  kpis: KpiRecord[];
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
          evidence: input.evidence,
          remarks: input.remarks,
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
