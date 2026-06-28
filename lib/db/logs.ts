import { eq, desc } from 'drizzle-orm';
import { db } from './index';
import { errorLogs, publishingLogs } from './schema';

/** Best-effort error logging — never throws, so it can't mask the original error. */
export async function logError(
  scope: string,
  message: string,
  context?: Record<string, unknown>,
  igAccountId?: string,
): Promise<void> {
  try {
    await db.insert(errorLogs).values({
      scope,
      igAccountId: igAccountId ?? null,
      message,
      context: context ?? null,
    });
  } catch (e) {
    console.error('[logError] failed to persist error log:', e);
  }
}

/** Append an immutable publishing-log entry. Best-effort. */
export async function logPublish(
  igAccountId: string,
  queueItemId: string | null,
  action: string,
  status: string,
  summary?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(publishingLogs).values({
      igAccountId,
      queueItemId,
      action,
      status,
      responseSummary: summary ?? null,
    });
  } catch (e) {
    console.error('[logPublish] failed to persist publishing log:', e);
  }
}

export async function getPublishingLogs(igAccountId: string, limit = 50) {
  return db
    .select()
    .from(publishingLogs)
    .where(eq(publishingLogs.igAccountId, igAccountId))
    .orderBy(desc(publishingLogs.at))
    .limit(limit);
}

export async function getErrorLogsForAccount(igAccountId: string, limit = 50) {
  return db
    .select()
    .from(errorLogs)
    .where(eq(errorLogs.igAccountId, igAccountId))
    .orderBy(desc(errorLogs.at))
    .limit(limit);
}
