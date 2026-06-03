type CompletionDecision = "in_progress" | "completed" | "follow_up_required";
type SubmissionStatus = "submitted" | "approved" | "needs_revision";

export function getPathwayStageSummary(input: {
  moduleCount: number;
  completedModuleIndexes: number[];
  finalAssignmentStatus?: SubmissionStatus | null;
  completionDecision?: CompletionDecision | null;
}) {
  const approvedModules = new Set(input.completedModuleIndexes).size;

  if (input.completionDecision === "completed") {
    return {
      label: "Pathway completed",
      detail: "The pathway has been approved by HR and marked complete.",
      tone: "success" as const
    };
  }

  if (input.completionDecision === "follow_up_required") {
    return {
      label: "Follow-up required",
      detail: "The employee finished the pathway but still needs targeted follow-up support.",
      tone: "warning" as const
    };
  }

  if (input.finalAssignmentStatus === "submitted") {
    return {
      label: "Awaiting final review",
      detail: "The final assignment is in HR review and the pathway is close to closure.",
      tone: "info" as const
    };
  }

  if (input.finalAssignmentStatus === "needs_revision") {
    return {
      label: "Final revision stage",
      detail: "The employee has reached the final assignment stage but needs to improve the evidence submitted.",
      tone: "warning" as const
    };
  }

  if (approvedModules >= input.moduleCount && input.moduleCount > 0) {
    return {
      label: "Ready for final assignment",
      detail: "All modules have been approved. The next step is to submit the final pathway assignment.",
      tone: "info" as const
    };
  }

  if (approvedModules > 0) {
    return {
      label: "Building momentum",
      detail: `${approvedModules} of ${input.moduleCount} modules have been approved. Keep converting practice into evidence.`,
      tone: "info" as const
    };
  }

  return {
    label: "Getting started",
    detail: "The pathway has been assigned, but no module has been approved yet.",
    tone: "muted" as const
  };
}

export function getNextPathwayAction(input: {
  moduleCount: number;
  completedModuleIndexes: number[];
  finalAssignmentStatus?: SubmissionStatus | null;
  completionDecision?: CompletionDecision | null;
}) {
  const approvedModules = new Set(input.completedModuleIndexes);

  if (input.completionDecision === "completed") {
    return "Review the outcome with HR and connect the pathway to the next evaluation cycle.";
  }

  if (input.completionDecision === "follow_up_required") {
    return "Agree the next intervention with HR and focus on the remaining gap before the next review.";
  }

  if (input.finalAssignmentStatus === "submitted") {
    return "Wait for HR review on the final assignment and be ready to clarify evidence if asked.";
  }

  if (input.finalAssignmentStatus === "needs_revision") {
    return "Revise the final assignment using the AI and HR feedback, then resubmit a stronger evidence pack.";
  }

  if (approvedModules.size >= input.moduleCount && input.moduleCount > 0) {
    return "Prepare and submit the final assignment with practical examples, results, and supporting evidence.";
  }

  for (let index = 0; index < input.moduleCount; index += 1) {
    if (!approvedModules.has(index)) {
      return `Complete Module ${index + 1}, apply it in practice, and submit evidence for review.`;
    }
  }

  return "Continue working through the pathway with HR follow-up.";
}

export function getImpactLabel(improvementDelta: number | null | undefined) {
  if (improvementDelta === null || improvementDelta === undefined) {
    return "Impact not measured yet";
  }

  if (improvementDelta > 0) {
    return `Performance improved by +${improvementDelta}`;
  }

  if (improvementDelta < 0) {
    return `Performance dropped by ${improvementDelta}`;
  }

  return "Performance stayed stable after the pathway";
}
