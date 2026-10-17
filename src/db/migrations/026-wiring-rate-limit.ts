import type { Migration } from './index.js';

/**
 * Per-wiring hourly cap on messages that engage the agent.
 *
 * `max_per_hour` NULL = unlimited (no backfill, existing wirings unchanged).
 * `wiring_engage_hits` is the sliding-window ledger the router consults
 * before delivering an engaged message (src/db/wiring-rate-limit.ts).
 */
export const migration026: Migration = {
  version: 26,
  name: 'wiring-rate-limit',
  async up(db) {
    await db.exec(`ALTER TABLE messaging_group_agents ADD COLUMN max_per_hour INTEGER;`);
    await db.exec(`
      CREATE TABLE wiring_engage_hits (
        wiring_id TEXT NOT NULL,
        hit_at    TEXT NOT NULL
      );
      CREATE INDEX idx_wiring_engage_hits ON wiring_engage_hits (wiring_id, hit_at);
    `);
  },
};
