import type {
  EvaluationDetailInput,
  EvaluationRecord,
  FocusArea,
  KpiRecord,
  LearningMaterial,
  PerformanceLevel,
  RecommendationType,
  Trend
} from "../types/domain";
import {
  calculateSuggestedDueDate,
  ensureLearningPathwayAssignments,
  getConfiguredDefaultPathwayDeadlineDays,
  listAssignmentMetadataForMaterials
} from "./learningPathwayAssignmentService";
import { listLearningPathwayProgress } from "../repositories/learningPathwayProgressRepository";
import { listLatestLearningPathwaySubmissionSummaries } from "../repositories/learningPathwaySubmissionRepository";
import { listRecommendationsForRole } from "../repositories/recommendationRepository";

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

const recommendationMaterialLibrary: Record<
  RecommendationType,
  Array<Omit<LearningMaterial, "id" | "resourceId" | "resourceUrl">>
> = {
  promotion: [
    {
      title: "Leadership readiness checklist",
      description: "A practical checklist covering delegation, decision-making, and strategic ownership before role advancement.",
      format: "Checklist",
      targetArea: "Career growth",
      estimatedDuration: "20 minutes",
      actionType: "Review and self-assess"
    }
  ],
  leadership: [
    {
      title: "Team leadership starter guide",
      description: "A short guide on coaching colleagues, managing responsibilities, and leading meetings effectively.",
      format: "Guide",
      targetArea: "Leadership",
      estimatedDuration: "35 minutes",
      actionType: "Read and apply"
    }
  ],
  bonus: [
    {
      title: "High performance recognition brief",
      description: "A summary that explains how high-impact contributors can sustain strong performance and prepare for broader responsibilities.",
      format: "Brief",
      targetArea: "Performance maintenance",
      estimatedDuration: "15 minutes",
      actionType: "Review"
    }
  ],
  advanced_responsibility: [
    {
      title: "Stretch assignment planning worksheet",
      description: "A worksheet for preparing employees for more advanced assignments while maintaining delivery quality.",
      format: "Worksheet",
      targetArea: "Responsibility growth",
      estimatedDuration: "25 minutes",
      actionType: "Complete with supervisor"
    }
  ],
  training: [
    {
      title: "Targeted improvement plan template",
      description: "A structured template for defining weak areas, training goals, checkpoints, and expected outcomes.",
      format: "Template",
      targetArea: "Training",
      estimatedDuration: "30 minutes",
      actionType: "Fill in with manager"
    }
  ],
  skill_development: [
    {
      title: "Skill development action tracker",
      description: "A personal tracker for setting milestones, practice activities, and evidence of improvement over time.",
      format: "Tracker",
      targetArea: "Skill development",
      estimatedDuration: "20 minutes",
      actionType: "Track progress weekly"
    }
  ],
  performance_improvement_plan: [
    {
      title: "Performance recovery plan",
      description: "A structured plan outlining immediate support actions, measurable targets, and a short review cycle.",
      format: "Action plan",
      targetArea: "Performance recovery",
      estimatedDuration: "40 minutes",
      actionType: "Complete with HR and manager"
    }
  ],
  recognition: [
    {
      title: "Recognition and growth reflection sheet",
      description: "A reflection sheet to help strong performers capture what is working and identify their next growth target.",
      format: "Reflection sheet",
      targetArea: "Recognition",
      estimatedDuration: "15 minutes",
      actionType: "Reflect and document"
    }
  ],
  warning: [
    {
      title: "Support intervention checklist",
      description: "A checklist for early intervention, follow-up conversations, and performance support actions.",
      format: "Checklist",
      targetArea: "Intervention",
      estimatedDuration: "20 minutes",
      actionType: "Review with supervisor"
    }
  ]
};

const kpiMaterialLibrary: Record<
  string,
  Array<Omit<LearningMaterial, "id" | "resourceId" | "resourceUrl">>
> = {
  productivity: [
    {
      title: "Personal productivity playbook",
      description: "A focused material pack on task prioritization, time blocking, and reducing work bottlenecks.",
      format: "Playbook",
      targetArea: "Productivity",
      estimatedDuration: "45 minutes",
      actionType: "Study and practice"
    }
  ],
  "quality of work": [
    {
      title: "Quality assurance checklist",
      description: "A practical checklist for reducing errors, reviewing outputs, and improving work accuracy before submission.",
      format: "Checklist",
      targetArea: "Quality of Work",
      estimatedDuration: "25 minutes",
      actionType: "Use before submission"
    }
  ],
  communication: [
    {
      title: "Workplace communication guide",
      description: "A short guide on clarity, response etiquette, stakeholder updates, and collaborative communication.",
      format: "Guide",
      targetArea: "Communication",
      estimatedDuration: "30 minutes",
      actionType: "Read and practice"
    }
  ],
  initiative: [
    {
      title: "Proactive problem-solving workbook",
      description: "A workbook designed to help employees identify issues early, suggest solutions, and take ownership appropriately.",
      format: "Workbook",
      targetArea: "Initiative",
      estimatedDuration: "35 minutes",
      actionType: "Complete exercises"
    }
  ],
  "target achievement": [
    {
      title: "Goal execution planner",
      description: "A planning tool for breaking targets into milestones, tracking completion, and staying aligned with expectations.",
      format: "Planner",
      targetArea: "Target Achievement",
      estimatedDuration: "30 minutes",
      actionType: "Plan weekly goals"
    }
  ]
};

export function calculateWeightedScore(details: EvaluationDetailInput[], availableKpis: KpiRecord[]) {
  const total = details.reduce((sum, detail) => {
    const kpi = availableKpis.find((item) => item.id === detail.kpiId);
    if (!kpi) {
      return sum;
    }

    return sum + (detail.score / 100) * kpi.weightPercentage;
  }, 0);

  return roundScore(total);
}

export function identifyFocusAreas(details: EvaluationDetailInput[], availableKpis: KpiRecord[]): FocusArea[] {
  return details
    .map((detail) => {
      const kpi = availableKpis.find((item) => item.id === detail.kpiId);

      if (!kpi) {
        return null;
      }

      return {
        kpiName: kpi.kpiName,
        score: Number(detail.score)
      };
    })
    .filter((item): item is FocusArea => item !== null)
    .filter((item) => item.score < 70)
    .sort((left, right) => left.score - right.score)
    .slice(0, 3);
}

export function classifyPerformance(score: number): PerformanceLevel {
  if (score >= 90) {
    return "excellent";
  }

  if (score >= 75) {
    return "very_good";
  }

  if (score >= 60) {
    return "good";
  }

  if (score >= 50) {
    return "average";
  }

  return "poor";
}

export function detectTrend(previousScores: number[], currentScore: number): Trend {
  if (previousScores.length === 0) {
    return "stable";
  }

  const lastScore = previousScores[previousScores.length - 1];
  const delta = currentScore - lastScore;

  if (delta >= 3) {
    return "improving";
  }

  if (delta <= -3) {
    return "declining";
  }

  return "stable";
}

export function hasThreeConsecutiveDeclines(history: number[], currentScore: number) {
  const scores = [...history, currentScore];
  if (scores.length < 4) {
    return false;
  }

  const recent = scores.slice(-4);
  return recent[0] > recent[1] && recent[1] > recent[2] && recent[2] > recent[3];
}

export function hasConsistentImprovement(history: number[], currentScore: number) {
  const scores = [...history, currentScore];
  if (scores.length < 3) {
    return false;
  }

  const recent = scores.slice(-3);
  return recent[0] < recent[1] && recent[1] < recent[2];
}

export function generateRecommendationTypes(
  score: number,
  history: number[]
): RecommendationType[] {
  const types: RecommendationType[] = [];

  if (score >= 90) {
    types.push("promotion", "leadership");
  } else if (score >= 75) {
    types.push("bonus", "advanced_responsibility");
  } else if (score >= 60) {
    types.push("training", "skill_development");
  } else {
    types.push("performance_improvement_plan");
  }

  if (hasThreeConsecutiveDeclines(history, score)) {
    types.push("warning");
  }

  if (hasConsistentImprovement(history, score)) {
    types.push("recognition");
  }

  return [...new Set(types)];
}

export function buildRecommendationExplanation(
  types: RecommendationType[],
  score: number,
  performanceLevel: PerformanceLevel,
  trend: Trend,
  focusAreas: FocusArea[] = []
) {
  const focusAreaText =
    focusAreas.length > 0
      ? ` Focus areas needing improvement: ${focusAreas
          .map((item) => `${item.kpiName} (${item.score})`)
          .join(", ")}.`
      : "";

  return `Recommendation generated because the employee scored ${score}, which falls in the ${performanceLevel.replace("_", " ")} band, and the recent trend is ${trend}. Recommended actions: ${types.join(", ")}.${focusAreaText}`;
}

export function summarizeEvaluationOutcome(evaluation: EvaluationRecord) {
  return `${evaluation.performanceLevel.replace("_", " ")} performance with a total score of ${evaluation.totalScore} and a ${evaluation.trend} trend.`;
}

export function buildSupportMaterials(
  recommendationTypes: RecommendationType[],
  focusAreas: FocusArea[]
): LearningMaterial[] {
  const materials: LearningMaterial[] = [];

  for (const type of recommendationTypes) {
    for (const resource of recommendationMaterialLibrary[type] ?? []) {
      const resourceId = `type-${type}-${resource.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      materials.push({
        id: resourceId,
        resourceId,
        resourceUrl: `/resources/${resourceId}`,
        ...resource
      });
    }
  }

  for (const focusArea of focusAreas) {
    for (const resource of kpiMaterialLibrary[focusArea.kpiName.toLowerCase()] ?? []) {
      const resourceId = `kpi-${focusArea.kpiName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${resource.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`;
      materials.push({
        id: resourceId,
        resourceId,
        resourceUrl: `/resources/${resourceId}`,
        ...resource
      });
    }
  }

  const unique = new Map<string, LearningMaterial>();

  for (const material of materials) {
    if (!unique.has(material.id)) {
      unique.set(material.id, material);
    }
  }

  return [...unique.values()];
}

export async function listRecommendationsWithMaterials(input: {
  role: string;
  employeeId?: number | null;
}) {
  const recommendations = await listRecommendationsForRole(input);

  const employeeIds = [...new Set(recommendations.map((item) => Number(item.employeeId)))];
  const recommendationMaterials = recommendations.map((item) => {
    const recommendationType = item.recommendationType as RecommendationType;
    const focusAreas = item.focusAreas ?? [];

    return {
      recommendationId: item.id,
      employeeId: Number(item.employeeId),
      evaluationId: item.evaluationId,
      materials: buildSupportMaterials([recommendationType], focusAreas)
    };
  });
  const materials = recommendationMaterials.flatMap((item) =>
    item.materials.map((material) => ({
      employeeId: Number(item.employeeId),
      evaluationId: item.evaluationId,
      material
    }))
  );
  const defaultDeadlineDays = await getConfiguredDefaultPathwayDeadlineDays();
  const resourceIds = [...new Set(materials.map((item) => item.material.resourceId))];
  let assignmentMap = await listAssignmentMetadataForMaterials({
    employeeIds,
    resourceIds
  });

  const missingAssignments = materials.filter(
    (item) => !assignmentMap.has(`${item.employeeId}:${item.material.resourceId}`)
  );

  if (missingAssignments.length > 0) {
    await ensureLearningPathwayAssignments(
      missingAssignments.map((item) => ({
        employeeId: item.employeeId,
        resourceId: item.material.resourceId,
        sourceEvaluationId: item.evaluationId ?? null,
        dueDate: calculateSuggestedDueDate(item.material, defaultDeadlineDays)
      }))
    );

    assignmentMap = await listAssignmentMetadataForMaterials({
      employeeIds,
      resourceIds
    });
  }

  const progressRows = await listLearningPathwayProgress({
    employeeIds,
    resourceIds
  });
  const latestSubmissionRows = await listLatestLearningPathwaySubmissionSummaries({
    employeeIds,
    resourceIds
  });
  const progressMap = new Map<string, number[]>();
  const latestSubmissionMap = new Map<string, (typeof latestSubmissionRows)[number]>();

  for (const row of progressRows) {
    const key = `${row.employeeId}:${row.resourceId}`;
    const current = progressMap.get(key) ?? [];
    current.push(Number(row.moduleIndex));
    progressMap.set(key, current);
  }

  for (const row of latestSubmissionRows) {
    latestSubmissionMap.set(`${row.employeeId}:${row.resourceId}`, row);
  }

  return recommendations.map((item) => {
    const employeeId = Number(item.employeeId);
    const materialSet =
      recommendationMaterials.find((entry) => entry.recommendationId === item.id)?.materials ?? [];

    return {
      ...item,
      materials: materialSet.map((material) => ({
        ...material,
        latestAiScore: latestSubmissionMap.get(`${employeeId}:${material.resourceId}`)?.aiScore ?? null,
        latestAiRecommendation:
          latestSubmissionMap.get(`${employeeId}:${material.resourceId}`)?.aiRecommendation ?? null,
        latestSubmissionStatus:
          latestSubmissionMap.get(`${employeeId}:${material.resourceId}`)?.status ?? null,
        latestSubmissionUpdatedAt:
          latestSubmissionMap.get(`${employeeId}:${material.resourceId}`)?.updatedAt ?? null,
        completedModuleIndexes: progressMap.get(`${employeeId}:${material.resourceId}`) ?? [],
        assignmentId: assignmentMap.get(`${employeeId}:${material.resourceId}`)?.id ?? null,
        assignedAt: assignmentMap.get(`${employeeId}:${material.resourceId}`)?.assignedAt ?? null,
        dueDate: assignmentMap.get(`${employeeId}:${material.resourceId}`)?.dueDate ?? null,
        completionDecision:
          assignmentMap.get(`${employeeId}:${material.resourceId}`)?.completionDecision ?? "in_progress",
        decisionComment: assignmentMap.get(`${employeeId}:${material.resourceId}`)?.decisionComment ?? null,
        decidedAt: assignmentMap.get(`${employeeId}:${material.resourceId}`)?.decidedAt ?? null,
        completedAt: assignmentMap.get(`${employeeId}:${material.resourceId}`)?.completedAt ?? null,
        improvementDelta: assignmentMap.get(`${employeeId}:${material.resourceId}`)?.improvementDelta ?? null,
        baselineScore: assignmentMap.get(`${employeeId}:${material.resourceId}`)?.baselineScore ?? null,
        followUpScore: assignmentMap.get(`${employeeId}:${material.resourceId}`)?.followUpScore ?? null
      }))
    };
  });
}
