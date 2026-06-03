import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

import { getAdminMetrics, getDepartmentBreakdown, getScoreDistribution } from "../repositories/analyticsRepository";
import { listEvaluationsForRole } from "../repositories/evaluationRepository";

function buildPdfBuffer(write: (doc: typeof PDFDocument.prototype) => void) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50 });

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    write(doc);
    doc.end();
  });
}

export async function getReportSummary() {
  const metrics = await getAdminMetrics();
  const departmentBreakdown = await getDepartmentBreakdown() as Array<{
    departmentName: string;
    employeeCount: number;
  }>;

  return {
    generatedAt: new Date().toISOString(),
    departmentCount: metrics.totalDepartments,
    evaluationCount: metrics.totalEvaluations,
    userCount: metrics.totalUsers,
    employeeCount: metrics.totalEmployees,
    departmentBreakdown,
    note: "Download PDF or Excel exports for a defense-ready report pack."
  };
}

export async function buildPdfReport() {
  const summary = await getReportSummary();
  const scores = await getScoreDistribution();

  return buildPdfBuffer((doc) => {
    doc.fontSize(20).text("PerformAI Hub Report Summary");
    doc.moveDown();
    doc.fontSize(11).text(`Generated: ${summary.generatedAt}`);
    doc.text(`Departments: ${summary.departmentCount}`);
    doc.text(`Employees: ${summary.employeeCount}`);
    doc.text(`Users: ${summary.userCount}`);
    doc.text(`Evaluations: ${summary.evaluationCount}`);
    doc.moveDown();
    doc.fontSize(14).text("Department Breakdown");
    summary.departmentBreakdown.forEach((item) => {
      doc.fontSize(11).text(`- ${item.departmentName}: ${item.employeeCount} employees`);
    });
    doc.moveDown();
    doc.fontSize(14).text("Performance Distribution");
    scores.forEach((item) => {
      doc.fontSize(11).text(`- ${item.performanceLevel}: ${item.total}`);
    });
  });
}

export async function buildExcelReport() {
  const workbook = new ExcelJS.Workbook();
  const summary = await getReportSummary();
  const scores = await getScoreDistribution();
  const evaluations = await listEvaluationsForRole({
    role: "admin",
    userId: 0,
    employeeId: null
  });

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.addRows([
    ["Generated At", summary.generatedAt],
    ["Departments", summary.departmentCount],
    ["Employees", summary.employeeCount],
    ["Users", summary.userCount],
    ["Evaluations", summary.evaluationCount]
  ]);

  const departmentSheet = workbook.addWorksheet("Departments");
  departmentSheet.columns = [
    { header: "Department", key: "departmentName", width: 28 },
    { header: "Employees", key: "employeeCount", width: 14 }
  ];
  departmentSheet.addRows(summary.departmentBreakdown);

  const scoreSheet = workbook.addWorksheet("Distribution");
  scoreSheet.columns = [
    { header: "Performance Level", key: "performanceLevel", width: 20 },
    { header: "Total", key: "total", width: 12 }
  ];
  scoreSheet.addRows(scores);

  const evaluationSheet = workbook.addWorksheet("Evaluations");
  evaluationSheet.columns = [
    { header: "Employee", key: "employeeName", width: 24 },
    { header: "Department", key: "departmentName", width: 20 },
    { header: "Date", key: "evaluationDate", width: 14 },
    { header: "Score", key: "totalScore", width: 12 },
    { header: "Level", key: "performanceLevel", width: 18 },
    { header: "Trend", key: "trend", width: 14 }
  ];
  evaluationSheet.addRows(evaluations);

  return workbook.xlsx.writeBuffer();
}
