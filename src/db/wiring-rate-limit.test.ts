import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { initTestDb, closeDb } from './connection.js';
import { runMigrations } from './migrations/index.js';
import { consumeWiringQuota } from './wiring-rate-limit.js';

describe('consumeWiringQuota', () => {
  beforeEach(async () => {
    const db = await initTestDb();
    await runMigrations(db);
  });
  afterEach(async () => {
    await closeDb();
  });

  it('allows up to the cap, then refuses', async () => {
    const t = new Date('2026-10-17T12:00:00.000Z');
    for (let i = 0; i < 3; i++) expect(await consumeWiringQuota('w1', 3, t)).toBe(true);
    expect(await consumeWiringQuota('w1', 3, t)).toBe(false);
  });

  it('frees budget as hits age out of the hour', async () => {
    const t = new Date('2026-10-17T12:00:00.000Z');
    await consumeWiringQuota('w1', 1, t);
    expect(await consumeWiringQuota('w1', 1, new Date(t.getTime() + 30 * 60_000))).toBe(false);
    expect(await consumeWiringQuota('w1', 1, new Date(t.getTime() + 61 * 60_000))).toBe(true);
  });

  it('is per wiring and null means unlimited', async () => {
    const t = new Date('2026-10-17T12:00:00.000Z');
    expect(await consumeWiringQuota('a', 1, t)).toBe(true);
    expect(await consumeWiringQuota('b', 1, t)).toBe(true);
    for (let i = 0; i < 20; i++) expect(await consumeWiringQuota('c', null, t)).toBe(true);
  });
});
