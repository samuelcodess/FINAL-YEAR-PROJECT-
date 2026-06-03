import type { Request, Response } from "express";

import { buildExcelReport, buildPdfReport, getReportSummary } from "../services/reportService";
import { asyncHandler } from "../utils/asyncHandler";

export const reportsSummaryController = asyncHandler(async (_request: Request, response: Response) => {
  response.json(await getReportSummary());
});

export const exportPdfReportController = asyncHandler(async (_request: Request, response: Response) => {
  const buffer = await buildPdfReport();
  response.setHeader("Content-Type", "application/pdf");
  response.setHeader("Content-Disposition", 'attachment; filename="performai-report.pdf"');
  response.send(buffer);
});

export const exportExcelReportController = asyncHandler(async (_request: Request, response: Response) => {
  const buffer = await buildExcelReport();
  response.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  response.setHeader("Content-Disposition", 'attachment; filename="performai-report.xlsx"');
  response.send(Buffer.from(buffer));
});
