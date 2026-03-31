/**
 * Client-safe stub — all PPTX generation runs in /api/export (server-side).
 * This file exists only so any stale Turbopack module-graph references resolve
 * without error. The actual download logic lives in score-report.tsx via fetch.
 */
export async function exportToPptx(_result: unknown): Promise<void> {
  throw new Error("Call /api/export directly — do not import this module.");
}
