import { listActivityLogs as listActivityLogRows } from "../repositories/activityLogRepository";

export async function listActivityLogs(input: {
  page?: number;
  pageSize?: number;
  q?: string;
}) {
  const page = Math.max(Number(input.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(input.pageSize ?? 10), 1), 50);

  return listActivityLogRows({
    page,
    pageSize,
    q: input.q
  });
}
