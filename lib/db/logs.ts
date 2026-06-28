import { db } from './index';
import { errorLogs } from './schema';

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
