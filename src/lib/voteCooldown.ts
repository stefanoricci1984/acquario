/** Un solo like o dislike per pesce ogni 5 minuti (per utente/dispositivo via localStorage). */

const STORAGE_KEY = "aquarium-vote-cooldowns";
export const VOTE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minuti

type CooldownEntry = { timestamp: number };

function getCooldowns(): Record<string, CooldownEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCooldowns(data: Record<string, CooldownEntry>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Restituisce i millisecondi rimanenti di cooldown per questo pesce (0 se può votare). */
export function getCooldownRemainingMs(fishId: string): number {
  const all = getCooldowns();
  const entry = all[fishId];
  if (!entry) return 0;
  const elapsed = Date.now() - entry.timestamp;
  if (elapsed >= VOTE_COOLDOWN_MS) return 0;
  return VOTE_COOLDOWN_MS - elapsed;
}

/** Registra che l'utente ha appena votato per questo pesce. */
export function setVoteCooldown(fishId: string): void {
  const all = getCooldowns();
  all[fishId] = { timestamp: Date.now() };
  setCooldowns(all);
}

/** Ritorna true se l'utente può votare per questo pesce. */
export function canVote(fishId: string): boolean {
  return getCooldownRemainingMs(fishId) === 0;
}
