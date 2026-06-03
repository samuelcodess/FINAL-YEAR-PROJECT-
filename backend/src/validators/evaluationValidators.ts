import { ApiError } from "../utils/ApiError";

export type EvaluationSubmissionInput = {
  employeeId: number;
  evaluationDate: string;
  remarks: string;
  details: Array<{ kpiId: number; score: number }>;
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

  if (!Array.isArray(input.details) || input.details.length === 0) {
    throw new ApiError(400, "At least one KPI score is required.");
  }

  const seen = new Set<number>();
  const details = input.details.map((detail) => {
    const kpiId = Number(detail.kpiId);
    const score = Number(detail.score);

    if (!kpiId || kpiId < 1) {
      throw new ApiError(400, "Each KPI entry must include a valid KPI id.");
    }

    if (seen.has(kpiId)) {
      throw new ApiError(400, "Each KPI can only appear once in an evaluation.");
    }

    if (Number.isNaN(score) || score < 0 || score > 100) {
      throw new ApiError(400, "KPI scores must be between 0 and 100.");
    }

    seen.add(kpiId);

    return {
      kpiId,
      score
    };
  });

  return {
    employeeId: Number(input.employeeId),
    evaluationDate: input.evaluationDate,
    remarks: input.remarks?.trim() ?? "",
    details
  };
}
