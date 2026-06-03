import { withTransaction } from "../database/transaction";
import { createActivityLog } from "../repositories/activityLogRepository";
import {
  createKpi,
  findKpiByName,
  deleteKpi,
  findKpiById,
  getTotalKpiWeight,
  listKpis,
  updateKpi
} from "../repositories/kpiRepository";
import type { AuthenticatedUser } from "../types/domain";
import { ApiError } from "../utils/ApiError";

type KpiPayload = {
  kpiName?: string;
  weightPercentage?: number;
  description?: string;
};

function validateKpiPayload(payload: KpiPayload) {
  const kpiName = payload.kpiName?.trim() ?? "";
  const description = payload.description?.trim() ?? "";
  const weightPercentage = Number(payload.weightPercentage);

  if (!kpiName) {
    throw new ApiError(400, "KPI name is required.");
  }

  if (Number.isNaN(weightPercentage) || weightPercentage <= 0) {
    throw new ApiError(400, "Weight percentage must be greater than zero.");
  }

  return {
    kpiName,
    description,
    weightPercentage
  };
}

async function validateWeightBudget(nextWeight: number, currentWeight = 0) {
  const total = await getTotalKpiWeight();
  const adjusted = Number((total - currentWeight + nextWeight).toFixed(2));

  if (adjusted > 100) {
    throw new ApiError(400, "Total KPI weight cannot exceed 100%.");
  }
}

export async function getKpis() {
  return listKpis();
}

export async function createKpiRecord(payload: KpiPayload, user: AuthenticatedUser) {
  const validated = validateKpiPayload(payload);
  const existing = await findKpiByName(validated.kpiName);

  if (existing) {
    throw new ApiError(409, "A KPI with this name already exists.");
  }

  await validateWeightBudget(validated.weightPercentage);

  const kpiId = await withTransaction(async (connection) => {
    const id = await createKpi(connection, validated);
    await createActivityLog(connection, {
      userId: user.id,
      action: `Created KPI "${validated.kpiName}" with ${validated.weightPercentage}% weight.`
    });
    return id;
  });

  return findKpiById(kpiId);
}

export async function updateKpiRecord(kpiId: number, payload: KpiPayload, user: AuthenticatedUser) {
  const existing = await findKpiById(kpiId);

  if (!existing) {
    throw new ApiError(404, "KPI not found.");
  }

  const validated = validateKpiPayload(payload);
  const duplicate = await findKpiByName(validated.kpiName);

  if (duplicate && duplicate.id !== kpiId) {
    throw new ApiError(409, "A KPI with this name already exists.");
  }

  await validateWeightBudget(validated.weightPercentage, Number(existing.weightPercentage));

  await withTransaction(async (connection) => {
    await updateKpi(connection, kpiId, validated);
    await createActivityLog(connection, {
      userId: user.id,
      action: `Updated KPI "${existing.kpiName}".`
    });
  });

  return findKpiById(kpiId);
}

export async function deleteKpiRecord(kpiId: number, user: AuthenticatedUser) {
  const existing = await findKpiById(kpiId);

  if (!existing) {
    throw new ApiError(404, "KPI not found.");
  }

  await withTransaction(async (connection) => {
    await deleteKpi(connection, kpiId);
    await createActivityLog(connection, {
      userId: user.id,
      action: `Deleted KPI "${existing.kpiName}".`
    });
  });
}
