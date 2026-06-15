import { ApiError } from "../utils/ApiError";

export type EvaluationSubmissionInput = {
  employeeId: number;
  evaluationDate: string;
  remarks: string;
  evidence: string;
};

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export function validateEvaluationSubmissionInput(
  input: Partial<EvaluationSubmissionInput>
): EvaluationSubmissionInput {
  if (!input.employeeId || input.employeeId < 1) {
    throw new ApiError(400, "A valid employee is required.");
  }

  if (!input.evaluationDate || !isValidDate(input.evaluationDate)) {
    throw new ApiError(400, "A valid evaluation date is required.");
  }

  if (typeof input.evidence !== "string" || input.evidence.trim().length < 40) {
    throw new ApiError(400, "Evaluation evidence must be at least 40 characters long.");
  }

  return {
    employeeId: Number(input.employeeId),
    evaluationDate: input.evaluationDate,
    remarks: input.remarks?.trim() ?? "",
    evidence: input.evidence.trim()
  };
}
