import type { Karakter, Checkpoint } from './types';
import { DEFAULT_SESSION } from './types';
import { MAX_CHECKPOINTS } from '../ui-constants';

/** Fields excluded from snapshot — these are runtime/meta, not character state. */
const EXCLUDED_KEYS: (keyof Karakter)[] = ['uid', 'id_leíró', 'session', 'checkpoints', 'mentés_dátum', 'schema_version'];

/** Generate 8-char random id. */
function nanoid8(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

/** Create a snapshot from the current karakter state (excluding runtime fields). */
export function createSnapshot(karakter: Karakter): Partial<Karakter> {
  const snapshot: Record<string, unknown> = {};
  for (const key of Object.keys(karakter) as (keyof Karakter)[]) {
    if (EXCLUDED_KEYS.includes(key)) continue;
    snapshot[key] = structuredClone(karakter[key]);
  }
  return snapshot as Partial<Karakter>;
}

/** Create a new checkpoint from the current karakter state. Returns updated checkpoints array (sorted by date, newest first). */
export function createCheckpoint(karakter: Karakter, név: string): Checkpoint[] {
  const cp: Checkpoint = {
    id: nanoid8(),
    név: név.slice(0, 20),
    dátum: new Date().toISOString(),
    snapshot: createSnapshot(karakter),
  };
  const updated = [cp, ...karakter.checkpoints].slice(0, MAX_CHECKPOINTS);
  return updated;
}

/** Restore a checkpoint — returns the new karakter state with session reset.
 *  Checkpoints array is preserved (caller decides what to do with it). */
export function restoreFromCheckpoint(karakter: Karakter, checkpointId: string, newCheckpoints: Checkpoint[]): Karakter {
  const cp = karakter.checkpoints.find(c => c.id === checkpointId);
  if (!cp) return karakter;
  return {
    ...karakter,
    ...cp.snapshot,
    uid: karakter.uid,
    id_leíró: karakter.id_leíró,
    schema_version: karakter.schema_version,
    session: { ...DEFAULT_SESSION },
    checkpoints: newCheckpoints,
    mentés_dátum: karakter.mentés_dátum,
  };
}

/** Restore mode: truncate — remove all checkpoints after the selected one. */
export function restoreTruncate(karakter: Karakter, checkpointId: string): Karakter {
  const idx = karakter.checkpoints.findIndex(c => c.id === checkpointId);
  if (idx < 0) return karakter;
  // Keep only this checkpoint and all older (= higher index, since sorted newest-first)
  const newCheckpoints = karakter.checkpoints.slice(idx);
  return restoreFromCheckpoint(karakter, checkpointId, newCheckpoints);
}

/** Restore mode: append — duplicate the checkpoint snapshot as a new latest entry. */
export function restoreAppend(karakter: Karakter, checkpointId: string): Karakter {
  const cp = karakter.checkpoints.find(c => c.id === checkpointId);
  if (!cp) return karakter;
  // Create a new checkpoint entry (copy of the selected) at the front
  const newCp: Checkpoint = {
    id: nanoid8(),
    név: `← ${cp.név}`.slice(0, 20),
    dátum: new Date().toISOString(),
    snapshot: structuredClone(cp.snapshot),
  };
  const newCheckpoints = [newCp, ...karakter.checkpoints].slice(0, MAX_CHECKPOINTS);
  return restoreFromCheckpoint(karakter, checkpointId, newCheckpoints);
}

/** Delete a checkpoint by id. Returns updated checkpoints array. */
export function deleteCheckpoint(checkpoints: Checkpoint[], id: string): Checkpoint[] {
  return checkpoints.filter(c => c.id !== id);
}

/** Auto-save checkpoint name. */
export function autoCheckpointName(): string {
  return `${new Date().toISOString().slice(0, 10)} auto mentés`;
}
