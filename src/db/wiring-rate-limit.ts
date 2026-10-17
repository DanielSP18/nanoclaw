import { getDb } from './connection.js';

const WINDOW_MS = 60 * 60 * 1000;

/**
 * Try to spend one engaged message from a wiring's hourly budget (sliding
 * window). Returns false, recording nothing, once `maxPerHour` hits already
 * fall inside the last hour. A null/undefined cap means unlimited.
 */
export async function consumeWiringQuota(
  wiringId: string,
  maxPerHour: number | null | undefined,
  now: Date = new Date(),
): Promise<boolean> {
  if (maxPerHour === null || maxPerHour === undefined) return true;
  const db = getDb();
  const cutoff = new Date(now.getTime() - WINDOW_MS).toISOString();
  return db.transaction(async () => {
    await db.run('DELETE FROM wiring_engage_hits WHERE wiring_id = ? AND hit_at <= ?', wiringId, cutoff);
    const row = await db.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM wiring_engage_hits WHERE wiring_id = ?',
      wiringId,
    );
    if ((row?.n ?? 0) >= maxPerHour) return false;
    await db.run('INSERT INTO wiring_engage_hits (wiring_id, hit_at) VALUES (?, ?)', wiringId, now.toISOString());
    return true;
  });
}
