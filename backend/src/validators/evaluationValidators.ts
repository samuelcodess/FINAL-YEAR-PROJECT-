import { ApiError } from "../utils/ApiError";

export type EvaluationSubmissionInput = {
  employeeId: number;
  evaluationDate: string;
  remarks: string;
  periodStartDate: string;
  periodEndDate: string;
};

function normalizeDateInput(value: string) {
  const trimmed = value.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const candidate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

    if (
      candidate.getUTCFullYear() === Number(year) &&
      candidate.getUTCMonth() + 1 === Number(month) &&
      candidate.getUTCDate() === Number(day)
    ) {
      return `${year}-${month}-${day}`;
    }

    return null;
  }

  const slashMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const candidate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

    if (
      candidate.getUTCFullYear() === Number(year) &&
      candidate.getUTCMonth() + 1 === Number(month) &&
      candidate.getUTCDate() === Number(day)
    ) {
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

export function validateEvaluationSubmissionInput(
  input: Partial<EvaluationSubmissionInput>
): EvaluationSubmissionInput {
  if (!input.employeeId || input.employeeId < 1) {
    throw new ApiError(400, "A valid employee is required.");
  }

  const evaluationDate = input.evaluationDate ? normalizeDateInput(input.evaluationDate) : null;
  const periodStartDate = input.periodStartDate ? normalizeDateInput(input.periodStartDate) : null;
  const periodEndDate = input.periodEndDate ? normalizeDateInput(input.periodEndDate) : null;

  if (!evaluationDate) {
    throw new ApiError(400, "A valid evaluation date is required.");
  }

  if (!periodStartDate) {
    throw new ApiError(400, "A valid period start date is required.");
  }

  if (!periodEndDate) {
    throw new ApiError(400, "A valid period end date is required.");
  }

  if (periodStartDate > periodEndDate) {
    throw new ApiError(400, "The period start date must be on or before the period end date.");
  }

  if (periodEndDate > evaluationDate) {
    throw new ApiError(400, "The evaluation date must be on or after the period end date.");
  }

  return {
    employeeId: Number(input.employeeId),
    evaluationDate,
    remarks: input.remarks?.trim() ?? "",
    periodStartDate,
    periodEndDate
  };
}
