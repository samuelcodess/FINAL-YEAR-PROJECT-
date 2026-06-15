import { ApiError } from "../utils/ApiError";

export type EvaluationSubmissionInput = {
  employeeId: number;
  evaluationDate: string;
  remarks: string;
  periodStartDate: string;
  periodEndDate: string;
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

  if (!input.periodStartDate || !isValidDate(input.periodStartDate)) {
    throw new ApiError(400, "A valid period start date is required.");
  }

  if (!input.periodEndDate || !isValidDate(input.periodEndDate)) {
    throw new ApiError(400, "A valid period end date is required.");
  }

  const periodStartTime = new Date(input.periodStartDate).getTime();
  const periodEndTime = new Date(input.periodEndDate).getTime();
  const evaluationTime = new Date(input.evaluationDate).getTime();

  if (periodStartTime > periodEndTime) {
    throw new ApiError(400, "The period start date must be on or before the period end date.");
  }

  if (periodEndTime > evaluationTime) {
    throw new ApiError(400, "The evaluation date must be on or after the period end date.");
  }

  return {
    employeeId: Number(input.employeeId),
    evaluationDate: input.evaluationDate,
    remarks: input.remarks?.trim() ?? "",
    periodStartDate: input.periodStartDate,
    periodEndDate: input.periodEndDate
  };
}
