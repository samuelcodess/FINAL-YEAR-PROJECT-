type LearningPathwayRubric = {
  resourceId: string;
  moduleCount: number;
  moduleRubrics: Array<{
    focus: string;
    keywords: string[];
  }>;
  finalAssignmentKeywords: string[];
  minimumWordCount: number;
};

function buildRubric(
  resourceId: string,
  moduleCount: number,
  moduleRubrics: Array<{ focus: string; keywords: string[] }>,
  finalAssignmentKeywords: string[],
  minimumWordCount = 40
): LearningPathwayRubric {
  return {
    resourceId,
    moduleCount,
    moduleRubrics,
    finalAssignmentKeywords,
    minimumWordCount
  };
}

export const learningPathwayCatalog: Record<string, LearningPathwayRubric> = {
  "type-promotion-leadership-readiness-checklist": buildRubric(
    "type-promotion-leadership-readiness-checklist",
    3,
    [
      { focus: "promotion readiness", keywords: ["contribution", "impact", "ownership", "results"] },
      { focus: "leadership behavior", keywords: ["mentoring", "delegation", "support", "accountability"] },
      { focus: "growth preparation", keywords: ["promotion", "gap", "growth", "next step"] }
    ],
    ["promotion", "leadership", "evidence", "growth", "readiness"]
  ),
  "type-leadership-team-leadership-starter-guide": buildRubric(
    "type-leadership-team-leadership-starter-guide",
    3,
    [
      { focus: "leadership transition", keywords: ["coordination", "ownership", "team", "direction"] },
      { focus: "communication", keywords: ["expectation", "feedback", "follow-up", "clarity"] },
      { focus: "team routines", keywords: ["meeting", "check-in", "action", "blocker"] }
    ],
    ["leadership", "team", "coordination", "support", "communication"]
  ),
  "type-bonus-high-performance-recognition-brief": buildRubric(
    "type-bonus-high-performance-recognition-brief",
    3,
    [
      { focus: "strength review", keywords: ["strength", "habit", "success", "result"] },
      { focus: "consistency", keywords: ["routine", "maintain", "quality", "consistency"] },
      { focus: "stretch growth", keywords: ["stretch", "target", "growth", "future"] }
    ],
    ["performance", "strength", "consistency", "growth", "goal"]
  ),
  "type-advanced_responsibility-stretch-assignment-planning-worksheet": buildRubric(
    "type-advanced_responsibility-stretch-assignment-planning-worksheet",
    3,
    [
      { focus: "assignment clarity", keywords: ["assignment", "outcome", "expectation", "responsibility"] },
      { focus: "milestones", keywords: ["milestone", "timeline", "support", "review"] },
      { focus: "reflection", keywords: ["learning", "result", "challenge", "improve"] }
    ],
    ["assignment", "milestone", "support", "review", "learning"]
  ),
  "type-training-targeted-improvement-plan-template": buildRubric(
    "type-training-targeted-improvement-plan-template",
    3,
    [
      { focus: "diagnosis", keywords: ["weak area", "score", "problem", "kpi"] },
      { focus: "training plan", keywords: ["goal", "action", "timeline", "improve"] },
      { focus: "tracking", keywords: ["evidence", "review", "progress", "result"] }
    ],
    ["improvement", "goal", "action", "evidence", "review"]
  ),
  "type-skill_development-skill-development-action-tracker": buildRubric(
    "type-skill_development-skill-development-action-tracker",
    3,
    [
      { focus: "skill target", keywords: ["skill", "target", "gap", "improve"] },
      { focus: "practice cycle", keywords: ["practice", "weekly", "routine", "feedback"] },
      { focus: "measurement", keywords: ["evidence", "progress", "result", "development"] }
    ],
    ["skill", "practice", "progress", "evidence", "development"]
  ),
  "type-performance_improvement_plan-performance-recovery-plan": buildRubric(
    "type-performance_improvement_plan-performance-recovery-plan",
    3,
    [
      { focus: "performance diagnosis", keywords: ["gap", "performance", "issue", "cause"] },
      { focus: "recovery plan", keywords: ["target", "support", "timeline", "recovery"] },
      { focus: "evidence", keywords: ["progress", "review", "improvement", "evidence"] }
    ],
    ["performance", "recovery", "support", "target", "evidence"]
  ),
  "type-recognition-recognition-and-growth-reflection-sheet": buildRubric(
    "type-recognition-recognition-and-growth-reflection-sheet",
    3,
    [
      { focus: "strengths", keywords: ["strength", "success", "habit", "performance"] },
      { focus: "sustain", keywords: ["maintain", "routine", "consistency", "protect"] },
      { focus: "next goal", keywords: ["goal", "growth", "next", "development"] }
    ],
    ["strength", "goal", "growth", "performance", "reflection"]
  ),
  "type-warning-support-intervention-checklist": buildRubric(
    "type-warning-support-intervention-checklist",
    3,
    [
      { focus: "decline pattern", keywords: ["decline", "trend", "evaluation", "pattern"] },
      { focus: "causes", keywords: ["cause", "support", "issue", "discussion"] },
      { focus: "intervention", keywords: ["action", "review", "checkpoint", "plan"] }
    ],
    ["decline", "support", "action", "review", "intervention"]
  ),
  "kpi-productivity-personal-productivity-playbook": buildRubric(
    "kpi-productivity-personal-productivity-playbook",
    3,
    [
      { focus: "blockers", keywords: ["blocker", "interruption", "time", "priority"] },
      { focus: "planning", keywords: ["plan", "priority", "schedule", "task"] },
      { focus: "execution", keywords: ["focus", "output", "review", "complete"] }
    ],
    ["productivity", "priority", "time", "output", "improve"]
  ),
  "kpi-quality-of-work-quality-assurance-checklist": buildRubric(
    "kpi-quality-of-work-quality-assurance-checklist",
    3,
    [
      { focus: "expectations", keywords: ["quality", "standard", "error", "complete"] },
      { focus: "review routine", keywords: ["check", "review", "accuracy", "submission"] },
      { focus: "defect prevention", keywords: ["mistake", "prevent", "defect", "improve"] }
    ],
    ["quality", "accuracy", "review", "error", "improve"]
  ),
  "kpi-communication-workplace-communication-guide": buildRubric(
    "kpi-communication-workplace-communication-guide",
    3,
    [
      { focus: "clarity", keywords: ["clear", "message", "update", "context"] },
      { focus: "follow-up", keywords: ["deadline", "next step", "follow-up", "response"] },
      { focus: "collaboration", keywords: ["meeting", "action item", "owner", "handoff"] }
    ],
    ["communication", "clarity", "update", "collaboration", "action"]
  ),
  "kpi-initiative-proactive-problem-solving-workbook": buildRubric(
    "kpi-initiative-proactive-problem-solving-workbook",
    3,
    [
      { focus: "issue spotting", keywords: ["issue", "early", "problem", "risk"] },
      { focus: "solutions", keywords: ["solution", "option", "action", "improve"] },
      { focus: "initiative", keywords: ["ownership", "proactive", "result", "response"] }
    ],
    ["initiative", "solution", "ownership", "problem", "action"]
  ),
  "kpi-target-achievement-goal-execution-planner": buildRubric(
    "kpi-target-achievement-goal-execution-planner",
    3,
    [
      { focus: "milestones", keywords: ["target", "milestone", "goal", "deadline"] },
      { focus: "tracking", keywords: ["track", "weekly", "progress", "review"] },
      { focus: "recovery", keywords: ["risk", "delay", "adjust", "complete"] }
    ],
    ["target", "milestone", "progress", "goal", "execution"]
  )
};

export function getLearningPathwayRubric(resourceId: string) {
  return learningPathwayCatalog[resourceId] ?? null;
}
