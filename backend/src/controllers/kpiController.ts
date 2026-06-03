import type { Request, Response } from "express";

import { createKpiRecord, deleteKpiRecord, getKpis, updateKpiRecord } from "../services/kpiService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const listKpisController = asyncHandler(async (_request: Request, response: Response) => {
  response.json(await getKpis());
});

export const createKpiController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.status(201).json(await createKpiRecord(request.body, request.user));
});

export const updateKpiController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const kpiId = Number(request.params.kpiId);
  response.json(await updateKpiRecord(kpiId, request.body, request.user));
});

export const deleteKpiController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const kpiId = Number(request.params.kpiId);
  await deleteKpiRecord(kpiId, request.user);
  response.status(204).send();
});
