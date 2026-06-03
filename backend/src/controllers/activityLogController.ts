import type { Request, Response } from "express";

import { listActivityLogs } from "../services/activityLogService";
import { asyncHandler } from "../utils/asyncHandler";

export const listActivityLogsController = asyncHandler(async (request: Request, response: Response) => {
  response.json(
    await listActivityLogs({
      page: Number(request.query.page ?? 1),
      pageSize: Number(request.query.pageSize ?? 10),
      q: typeof request.query.q === "string" ? request.query.q : undefined
    })
  );
});
