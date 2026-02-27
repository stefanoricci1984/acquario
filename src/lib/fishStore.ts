import { supabase, isSupabaseConfigured } from "./supabase";

export interface Fish {
  id: string;
  name: string;
  imageData: string;
  likes: number;
  dislikes: number;
  createdAt: number;
  swimDuration: number;
  swimDelay: number;
  bobDelay: number;
  yPosition: number;
}

const STORAGE_KEY = "aquarium-fish";
const SEASON_END_KEY = "aquarium-season-end";
export const SEASON_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1 settimana

type FishRow = {
  id: string;
  name: string;
  image_data: string;
  likes: number;
  dislikes: number;
  created_at: number;
  swim_duration: number;
  swim_delay: number;
  bob_delay: number;
  y_position: number;
};

function rowToFish(r: FishRow): Fish {
  return {
    id: r.id,
    name: r.name,
    imageData: r.image_data,
    likes: r.likes,
    dislikes: r.dislikes,
    createdAt: r.created_at,
    swimDuration: r.swim_duration,
    swimDelay: r.swim_delay,
    bobDelay: r.bob_delay,
    yPosition: r.y_position,
  };
}

function fishToRow(f: Fish): FishRow {
  return {
    id: f.id,
    name: f.name,
    image_data: f.imageData,
    likes: f.likes,
    dislikes: f.dislikes,
    created_at: f.createdAt,
    swim_duration: f.swimDuration,
    swim_delay: f.swimDelay,
    bob_delay: f.bobDelay,
    y_position: f.yPosition,
  };
}

// --- Season (sync per countdown; lettura/scrittura via Supabase o localStorage) ---

export function getSeasonEnd(): number | null {
  if (isSupabaseConfigured()) return null; // Supabase: si legge async in getSeasonEndAsync
  try {
    const raw = localStorage.getItem(SEASON_END_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

export function setSeasonEnd(timestamp: number): void {
  if (!isSupabaseConfigured()) {
    localStorage.setItem(SEASON_END_KEY, String(timestamp));
  }
}

export async function getSeasonEndAsync(): Promise<number | null> {
  if (supabase) {
    const { data } = await supabase.from("app_config").select("value").eq("key", SEASON_END_KEY).maybeSingle();
    if (data?.value) return parseInt(data.value, 10);
    return null;
  }
  return Promise.resolve(getSeasonEnd());
}

export async function setSeasonEndAsync(timestamp: number): Promise<void> {
  if (supabase) {
    await supabase.from("app_config").upsert({ key: SEASON_END_KEY, value: String(timestamp) }, { onConflict: "key" });
    return;
  }
  setSeasonEnd(timestamp);
  return Promise.resolve();
}

/** Restituisce la fine stagione; se non esiste o era impostata con altra durata, imposta now + SEASON_DURATION_MS. */
export async function getOrCreateSeasonEndAsync(): Promise<number> {
  const now = Date.now();
  const existing = await getSeasonEndAsync();
  const remaining = existing != null ? existing - now : 0;
  if (existing != null && remaining > 0 && remaining <= SEASON_DURATION_MS * 1.1) return existing;
  const end = now + SEASON_DURATION_MS;
  await setSeasonEndAsync(end);
  return end;
}

/** Versione sync solo per localStorage (usata dal tick quando non c'è Supabase). */
export function getOrCreateSeasonEnd(): number {
  const now = Date.now();
  const existing = getSeasonEnd();
  const remaining = existing != null ? existing - now : 0;
  if (existing != null && remaining > 0 && remaining <= SEASON_DURATION_MS * 1.1) return existing;
  const end = now + SEASON_DURATION_MS;
  setSeasonEnd(end);
  return end;
}

// --- Fish ---

export async function getFish(): Promise<Fish[]> {
  if (supabase) {
    const { data, error } = await supabase.from("fish").select("*").order("created_at", { ascending: true });
    if (error) {
      console.error("getFish:", error);
      return [];
    }
    return (data ?? []).map(rowToFish);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Per compatibilità sync (localStorage only): ritorna [] se Supabase è attivo. */
export function getFishSync(): Fish[] {
  if (isSupabaseConfigured()) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveFish(fish: Fish): Promise<void> {
  if (supabase) {
    await supabase.from("fish").insert(fishToRow(fish));
    return;
  }
  const all = getFishSync();
  all.push(fish);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export async function updateFishVotes(id: string, likes: number, dislikes: number): Promise<void> {
  if (supabase) {
    await supabase.from("fish").update({ likes, dislikes }).eq("id", id);
    return;
  }
  const all = getFishSync();
  const idx = all.findIndex((f) => f.id === id);
  if (idx !== -1) {
    all[idx].likes = likes;
    all[idx].dislikes = dislikes;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

/** Fine stagione: restano solo i primi 3; like e dislike azzerati. */
export async function endSeasonKeepTop3(): Promise<Fish[]> {
  const all = await getFish();
  const sorted = [...all].sort((a, b) => b.likes - b.dislikes - (a.likes - a.dislikes));
  const keep = sorted.slice(0, 3).map((f) => ({ ...f, likes: 0, dislikes: 0 }));

  if (supabase) {
    const keepIds = new Set(keep.map((f) => f.id));
    const toRemove = sorted.filter((f) => !keepIds.has(f.id)).map((f) => f.id);
    if (toRemove.length > 0) await supabase.from("fish").delete().in("id", toRemove);
    for (const f of keep) {
      await supabase.from("fish").update({ likes: 0, dislikes: 0 }).eq("id", f.id);
    }
    const newEnd = Date.now() + SEASON_DURATION_MS;
    await setSeasonEndAsync(newEnd);
    return keep;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(keep));
  const newEnd = Date.now() + SEASON_DURATION_MS;
  setSeasonEnd(newEnd);
  return keep;
}

export function createFish(name: string, imageData: string): Fish {
  return {
    id: crypto.randomUUID(),
    name,
    imageData,
    likes: 0,
    dislikes: 0,
    createdAt: Date.now(),
    swimDuration: 12 + Math.random() * 16,
    swimDelay: Math.random() * -20,
    bobDelay: Math.random() * -3,
    yPosition: 18 + Math.random() * 40,
  };
}
