import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Fish as FishIcon, ThumbsUp, ThumbsDown, Trophy, Pencil, Crown } from "lucide-react";
import { toast } from "sonner";
import {
  getFish,
  updateFishVotes,
  getOrCreateSeasonEndAsync,
  endSeasonKeepTop3,
  type Fish,
} from "@/lib/fishStore";
import {
  getCooldownRemainingMs,
  setVoteCooldown,
  VOTE_COOLDOWN_MS,
} from "@/lib/voteCooldown";

const Bubble: React.FC<{ delay: number; left: number; duration: number; size: number }> = ({
  delay, left, duration, size,
}) => (
  <div
    className="absolute bottom-0 rounded-full bg-white/25 animate-bubble"
    style={{
      left: `${left}%`,
      width: size,
      height: size,
      "--bubble-delay": `${delay}s`,
      "--bubble-duration": `${duration}s`,
    } as React.CSSProperties}
  />
);

/* Palette colori per piante acquatiche (base, medio, punta + stroke) */
const PLANT_COLORS = [
  { base: "hsl(165, 45%, 22%)", mid: "hsl(160, 50%, 30%)", tip: "hsl(155, 55%, 40%)", stroke: "hsl(165, 40%, 18%)" },
  { base: "hsl(150, 40%, 28%)", mid: "hsl(148, 45%, 36%)", tip: "hsl(145, 50%, 46%)", stroke: "hsl(150, 35%, 22%)" },
  { base: "hsl(175, 50%, 24%)", mid: "hsl(172, 52%, 34%)", tip: "hsl(168, 55%, 44%)", stroke: "hsl(175, 45%, 20%)" },
  { base: "hsl(95, 35%, 26%)", mid: "hsl(92, 40%, 34%)", tip: "hsl(88, 45%, 44%)", stroke: "hsl(98, 30%, 20%)" },
  { base: "hsl(158, 55%, 20%)", mid: "hsl(155, 58%, 28%)", tip: "hsl(152, 60%, 38%)", stroke: "hsl(160, 50%, 16%)" },
  { base: "hsl(140, 38%, 30%)", mid: "hsl(138, 42%, 38%)", tip: "hsl(135, 48%, 48%)", stroke: "hsl(142, 35%, 24%)" },
  { base: "hsl(180, 42%, 26%)", mid: "hsl(178, 48%, 35%)", tip: "hsl(175, 52%, 45%)", stroke: "hsl(182, 38%, 22%)" },
  { base: "hsl(72, 32%, 28%)", mid: "hsl(70, 38%, 36%)", tip: "hsl(68, 42%, 46%)", stroke: "hsl(75, 28%, 22%)" },
] as const;

/* Palette colori coralli (arancio, rosa, rosso, viola, beige) */
const CORAL_COLORS = [
  { main: "hsl(15, 75%, 55%)", dark: "hsl(15, 70%, 40%)", light: "hsl(18, 80%, 68%)" },
  { main: "hsl(350, 65%, 58%)", dark: "hsl(350, 60%, 42%)", light: "hsl(352, 75%, 72%)" },
  { main: "hsl(330, 60%, 55%)", dark: "hsl(330, 55%, 40%)", light: "hsl(332, 70%, 68%)" },
  { main: "hsl(280, 45%, 52%)", dark: "hsl(280, 50%, 38%)", light: "hsl(278, 55%, 65%)" },
  { main: "hsl(25, 60%, 50%)", dark: "hsl(25, 55%, 36%)", light: "hsl(27, 70%, 62%)" },
  { main: "hsl(0, 55%, 52%)", dark: "hsl(0, 60%, 38%)", light: "hsl(2, 65%, 65%)" },
] as const;

/* Coralli e formazioni tipo barriera in fondo all'acquario */
const Corals: React.FC = () => {
  const items = useMemo(
    () => [
      { id: "c1", left: "3%", width: 55, height: 70, type: "branching", colorIdx: 0 },
      { id: "c2", left: "11%", width: 45, height: 55, type: "fan", colorIdx: 1 },
      { id: "c3", left: "19%", width: 60, height: 65, type: "cabbage", colorIdx: 2 },
      { id: "c4", left: "30%", width: 50, height: 58, type: "branching", colorIdx: 3 },
      { id: "c5", left: "38%", width: 48, height: 52, type: "fan", colorIdx: 4 },
      { id: "c6", left: "46%", width: 62, height: 72, type: "cabbage", colorIdx: 5 },
      { id: "c7", left: "55%", width: 52, height: 60, type: "branching", colorIdx: 0 },
      { id: "c8", left: "64%", width: 44, height: 50, type: "fan", colorIdx: 1 },
      { id: "c9", left: "72%", width: 58, height: 68, type: "cabbage", colorIdx: 2 },
      { id: "c10", left: "82%", width: 50, height: 56, type: "branching", colorIdx: 4 },
      { id: "c11", left: "90%", width: 46, height: 54, type: "fan", colorIdx: 5 },
      { id: "c12", left: "96%", width: 42, height: 48, type: "cabbage", colorIdx: 3 },
    ],
    []
  );
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[28%] min-h-[120px] pointer-events-none z-0">
      {items.map((item) => {
        const c = CORAL_COLORS[item.colorIdx % CORAL_COLORS.length];
        const gId = `coral-grad-${item.id}`;
        if (item.type === "branching") {
          return (
            <div
              key={item.id}
              className="absolute bottom-0 drop-shadow-md"
              style={{ left: item.left, width: item.width, height: item.height }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
                <defs>
                  <linearGradient id={gId} x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor={c.dark} />
                    <stop offset="60%" stopColor={c.main} />
                    <stop offset="100%" stopColor={c.light} />
                  </linearGradient>
                </defs>
                <path fill={`url(#${gId})`} stroke={c.dark} strokeWidth="1" strokeLinejoin="round" d="M 50 100 L 48 60 L 30 35 L 35 15 M 50 100 L 52 55 L 70 30 L 65 12 M 50 100 L 50 70 L 50 45 L 48 25" />
              </svg>
            </div>
          );
        }
        if (item.type === "fan") {
          return (
            <div
              key={item.id}
              className="absolute bottom-0 drop-shadow-md"
              style={{ left: item.left, width: item.width, height: item.height }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
                <defs>
                  <linearGradient id={gId} x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={c.dark} />
                    <stop offset="50%" stopColor={c.main} />
                    <stop offset="100%" stopColor={c.light} />
                  </linearGradient>
                </defs>
                <path fill={`url(#${gId})`} stroke={c.dark} strokeWidth="1.2" strokeLinejoin="round" d="M 50 100 Q 15 70 20 40 Q 25 15 50 5 Q 75 15 80 40 Q 85 70 50 100" />
                <path fill="none" stroke={c.dark} strokeWidth="0.8" opacity="0.7" d="M 50 100 Q 35 75 38 50 M 50 100 Q 50 60 50 30 M 50 100 Q 65 75 62 50" />
              </svg>
            </div>
          );
        }
        return (
          <div
            key={item.id}
            className="absolute bottom-0 drop-shadow-md"
            style={{ left: item.left, width: item.width, height: item.height }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
              <defs>
                <linearGradient id={gId} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={c.dark} />
                  <stop offset="50%" stopColor={c.main} />
                  <stop offset="100%" stopColor={c.light} />
                </linearGradient>
              </defs>
              <ellipse cx="50" cy="75" rx="42" ry="22" fill={`url(#${gId})`} stroke={c.dark} strokeWidth="1" />
              <ellipse cx="50" cy="58" rx="35" ry="18" fill={c.main} fillOpacity="0.9" stroke={c.dark} strokeWidth="0.8" />
              <ellipse cx="50" cy="42" rx="28" ry="14" fill={c.light} fillOpacity="0.85" stroke={c.dark} strokeWidth="0.6" />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

/* Piante acquatiche in fondo all'acquario: più piante, altezze e colori variati */
const AquaticPlants: React.FC = () => {
  const plants = useMemo(
    () => [
      { id: 1, left: "0%", width: 36, height: 165, delay: 0, duration: 4, colorIdx: 0 },
      { id: 2, left: "4%", width: 24, height: 75, delay: 0.8, duration: 5.2, colorIdx: 1 },
      { id: 3, left: "8%", width: 32, height: 130, delay: 0.3, duration: 4.5, colorIdx: 2 },
      { id: 4, left: "14%", width: 28, height: 95, delay: 1.2, duration: 5.5, colorIdx: 3 },
      { id: 5, left: "20%", width: 40, height: 155, delay: 0.5, duration: 4.2, colorIdx: 4 },
      { id: 6, left: "26%", width: 22, height: 68, delay: 1, duration: 5, colorIdx: 5 },
      { id: 7, left: "31%", width: 34, height: 118, delay: 0.2, duration: 4.8, colorIdx: 6 },
      { id: 8, left: "36%", width: 38, height: 142, delay: 0.6, duration: 5.2, colorIdx: 7 },
      { id: 9, left: "42%", width: 26, height: 82, delay: 1.1, duration: 4.6, colorIdx: 0 },
      { id: 10, left: "48%", width: 42, height: 172, delay: 0.4, duration: 4.4, colorIdx: 1 },
      { id: 11, left: "54%", width: 30, height: 105, delay: 0.9, duration: 5.3, colorIdx: 2 },
      { id: 12, left: "60%", width: 36, height: 138, delay: 0.1, duration: 4.7, colorIdx: 3 },
      { id: 13, left: "66%", width: 20, height: 62, delay: 1.3, duration: 5.1, colorIdx: 4 },
      { id: 14, left: "71%", width: 34, height: 125, delay: 0.7, duration: 4.9, colorIdx: 5 },
      { id: 15, left: "76%", width: 28, height: 88, delay: 0.2, duration: 5.4, colorIdx: 6 },
      { id: 16, left: "82%", width: 40, height: 148, delay: 0.5, duration: 4.3, colorIdx: 7 },
      { id: 17, left: "88%", width: 24, height: 78, delay: 1, duration: 5.6, colorIdx: 0 },
      { id: 18, left: "93%", width: 32, height: 112, delay: 0.3, duration: 4.6, colorIdx: 1 },
      { id: 19, left: "2%", width: 28, height: 98, delay: 0.5, duration: 5.1, colorIdx: 2 },
      { id: 20, left: "17%", width: 30, height: 85, delay: 1.2, duration: 4.4, colorIdx: 3 },
      { id: 21, left: "44%", width: 22, height: 72, delay: 0.8, duration: 5.3, colorIdx: 4 },
      { id: 22, left: "69%", width: 36, height: 132, delay: 0.1, duration: 4.5, colorIdx: 5 },
      { id: 23, left: "79%", width: 26, height: 92, delay: 0.9, duration: 5.2, colorIdx: 6 },
      { id: 24, left: "98%", width: 30, height: 78, delay: 0.4, duration: 4.9, colorIdx: 7 },
      { id: 25, left: "1%", width: 22, height: 88, delay: 0.6, duration: 5, colorIdx: 0 },
      { id: 26, left: "6%", width: 34, height: 145, delay: 1.1, duration: 4.3, colorIdx: 1 },
      { id: 27, left: "10%", width: 26, height: 70, delay: 0.2, duration: 5.4, colorIdx: 2 },
      { id: 28, left: "16%", width: 38, height: 128, delay: 0.9, duration: 4.7, colorIdx: 3 },
      { id: 29, left: "23%", width: 24, height: 82, delay: 0.4, duration: 5.2, colorIdx: 4 },
      { id: 30, left: "29%", width: 32, height: 115, delay: 1.3, duration: 4.5, colorIdx: 5 },
      { id: 31, left: "34%", width: 28, height: 95, delay: 0.7, duration: 5.1, colorIdx: 6 },
      { id: 32, left: "39%", width: 36, height: 158, delay: 0.1, duration: 4.8, colorIdx: 7 },
      { id: 33, left: "45%", width: 20, height: 65, delay: 1, duration: 5.5, colorIdx: 0 },
      { id: 34, left: "50%", width: 30, height: 108, delay: 0.5, duration: 4.6, colorIdx: 1 },
      { id: 35, left: "56%", width: 40, height: 162, delay: 0.8, duration: 4.4, colorIdx: 2 },
      { id: 36, left: "62%", width: 26, height: 78, delay: 0.3, duration: 5.3, colorIdx: 3 },
      { id: 37, left: "67%", width: 34, height: 122, delay: 1.2, duration: 4.9, colorIdx: 4 },
      { id: 38, left: "73%", width: 28, height: 92, delay: 0.6, duration: 5, colorIdx: 5 },
      { id: 39, left: "78%", width: 38, height: 135, delay: 0.9, duration: 4.7, colorIdx: 6 },
      { id: 40, left: "84%", width: 24, height: 72, delay: 0.2, duration: 5.2, colorIdx: 7 },
      { id: 41, left: "89%", width: 32, height: 118, delay: 1.1, duration: 4.5, colorIdx: 0 },
      { id: 42, left: "95%", width: 36, height: 152, delay: 0.4, duration: 4.9, colorIdx: 1 },
      { id: 43, left: "7%", width: 30, height: 102, delay: 1, duration: 5.1, colorIdx: 2 },
      { id: 44, left: "52%", width: 24, height: 68, delay: 0.7, duration: 5.4, colorIdx: 3 },
    ],
    []
  );
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[40%] min-h-[180px] pointer-events-none z-0">
      {plants.map((p) => {
        const c = PLANT_COLORS[p.colorIdx % PLANT_COLORS.length];
        return (
          <div
            key={p.id}
            className="absolute bottom-0 animate-plant-sway"
            style={{
              left: p.left,
              width: p.width,
              height: p.height,
              transformOrigin: "bottom center",
              ["--plant-delay" as string]: `${p.delay}s`,
              ["--plant-duration" as string]: `${p.duration}s`,
            } as React.CSSProperties}
          >
            <svg
              viewBox="0 0 100 200"
              className="w-full h-full drop-shadow-lg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`plant-fill-${p.id}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={c.base} stopOpacity="0.95" />
                  <stop offset="50%" stopColor={c.mid} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={c.tip} stopOpacity="0.85" />
                </linearGradient>
              </defs>
              <path
                d="M 50 200 Q 30 160 45 120 Q 25 80 50 50 Q 35 25 50 0"
                fill={`url(#plant-fill-${p.id})`}
                stroke={c.stroke}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M 50 200 Q 70 155 55 110 Q 75 70 50 40 Q 65 15 50 0"
                fill={`url(#plant-fill-${p.id})`}
                fillOpacity="0.7"
                stroke={c.stroke}
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

const SWIM_SPEED_MULTIPLIER = 2; /* >1 = più lento */

/* Fascia verticale pesci: non troppo in alto (corona visibile), non sotto le piante */
const MIN_FISH_Y_PERCENT = 18;
const MAX_FISH_Y_PERCENT = 58;

/* Scala: +1% per like, -1% per dislike; mai sotto la dimensione originale (1) */
const SIZE_PER_VOTE = 0.01;

function fishScale(likes: number, dislikes: number): number {
  const net = likes - dislikes;
  return Math.max(1, 1 + net * SIZE_PER_VOTE);
}

type CrownType = "gold" | "silver" | "bronze";

const CROWN_CLASSES: Record<CrownType, string> = {
  gold: "text-yellow-400 drop-shadow-md fill-yellow-400/90 stroke-amber-700",
  silver: "text-gray-300 drop-shadow-md fill-gray-300/90 stroke-gray-500",
  bronze: "text-amber-600 drop-shadow-md fill-amber-600/90 stroke-amber-800",
};

const SwimmingFish: React.FC<{
  fish: Fish;
  onClick: () => void;
  crownType: CrownType | null;
}> = ({ fish, onClick, crownType }) => {
  const scale = fishScale(fish.likes, fish.dislikes);
  const topPercent = Math.max(MIN_FISH_Y_PERCENT, Math.min(fish.yPosition, MAX_FISH_Y_PERCENT));
  return (
    <div
      className="absolute cursor-pointer animate-swim"
      style={{
        top: `${topPercent}%`,
        "--swim-duration": `${fish.swimDuration * SWIM_SPEED_MULTIPLIER}s`,
        "--swim-delay": `${fish.swimDelay}s`,
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div
        className="animate-bob"
        style={{ "--bob-delay": `${fish.bobDelay}s` } as React.CSSProperties}
      >
        <div
          className="inline-block transition-transform duration-300 ease-out"
          style={{ transform: `scale(${scale})` }}
        >
          <div className="relative inline-block">
          {crownType && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <Crown className={`w-6 h-6 ${CROWN_CLASSES[crownType]}`} />
            </div>
          )}
          <img
            src={fish.imageData}
            alt={fish.name}
            className="w-20 h-16 object-contain drop-shadow-lg hover:scale-110 transition-transform"
            draggable={false}
          />
          <p className="text-[10px] text-white/80 text-center font-medium truncate max-w-20">
            {fish.name}
          </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0g 00h 00m";
  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return `${d}g ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

const AquariumPage: React.FC = () => {
  const navigate = useNavigate();
  const [allFish, setAllFish] = useState<Fish[]>([]);
  const [selected, setSelected] = useState<Fish | null>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seasonEndTs, setSeasonEndTs] = useState<number>(0);
  const [countdownMs, setCountdownMs] = useState<number>(0);

  const refreshFish = useCallback(async () => {
    const list = await getFish();
    setAllFish(list);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [list, end] = await Promise.all([getFish(), getOrCreateSeasonEndAsync()]);
      if (!cancelled) {
        setAllFish(list);
        setSeasonEndTs(end);
        setCountdownMs(Math.max(0, end - Date.now()));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  /* Aggiorna i pesci quando si torna sulla scheda (es. dopo aver aggiunto un pesce in un altro tab) */
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshFish();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refreshFish]);

  /* Polling: aggiorna la lista pesci ogni 20s mentre la scheda è visibile */
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refreshFish();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (seasonEndTs === 0) return;
    const tick = async () => {
      const now = Date.now();
      const remaining = seasonEndTs - now;
      if (remaining <= 0) {
        const kept = await endSeasonKeepTop3();
        setAllFish(kept);
        const newEnd = await getOrCreateSeasonEndAsync();
        setSeasonEndTs(newEnd);
        setCountdownMs(Math.max(0, newEnd - Date.now()));
        return;
      }
      setCountdownMs(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [seasonEndTs]);

  const bubbles = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        delay: Math.random() * 12,
        left: Math.random() * 100,
        duration: 5 + Math.random() * 10,
        size: 3 + Math.random() * 14,
      })),
    []
  );

  const ranked = useMemo(
    () => [...allFish].sort((a, b) => b.likes - b.dislikes - (a.likes - a.dislikes)),
    [allFish]
  );

  /* In classifica solo i pesci con punteggio >= 1 */
  const rankedInClassifica = useMemo(
    () => ranked.filter((f) => f.likes - f.dislikes >= 1),
    [ranked]
  );

  /* Punteggi distinti (solo >= 1) in ordine per posizione e corone */
  const distinctScores = useMemo(() => {
    const scores = [...new Set(rankedInClassifica.map((f) => f.likes - f.dislikes))].sort((a, b) => b - a);
    return scores;
  }, [rankedInClassifica]);

  /* Stessa corona per stesso punteggio: oro per 1° punteggio, argento per 2°, rame per 3° (solo in classifica) */
  const crownByFishId = useMemo((): Record<string, CrownType> => {
    const map: Record<string, CrownType> = {};
    rankedInClassifica.forEach((f) => {
      const score = f.likes - f.dislikes;
      const tierIndex = distinctScores.indexOf(score);
      if (tierIndex === 0) map[f.id] = "gold";
      else if (tierIndex === 1) map[f.id] = "silver";
      else if (tierIndex === 2) map[f.id] = "bronze";
    });
    return map;
  }, [rankedInClassifica, distinctScores]);

  /* Punteggi distinti di tutti i pesci (per la posizione 1°, 2°, 3°, 4°, ...) */
  const distinctScoresAll = useMemo(() => {
    const scores = [...new Set(ranked.map((f) => f.likes - f.dislikes))].sort((a, b) => b - a);
    return scores;
  }, [ranked]);

  /* Posizione in classifica per tutti i pesci: stesso punteggio = stesso posto */
  const positionByFishId = useMemo((): Record<string, number> => {
    const map: Record<string, number> = {};
    ranked.forEach((f) => {
      const score = f.likes - f.dislikes;
      map[f.id] = distinctScoresAll.indexOf(score) + 1;
    });
    return map;
  }, [ranked, distinctScoresAll]);

  const [cooldownRemainingMs, setCooldownRemainingMs] = useState<number>(0);

  useEffect(() => {
    if (!selected) return;
    const update = () => setCooldownRemainingMs(getCooldownRemainingMs(selected.id));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [selected?.id]);

  const vote = (id: string, type: "like" | "dislike") => {
    const remaining = getCooldownRemainingMs(id);
    if (remaining > 0) {
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      toast.warning(
        "È permesso un solo like o dislike ogni 5 minuti. Potrai votare di nuovo tra " +
          `${m}:${String(s).padStart(2, "0")}`
      );
      return;
    }
    setVoteCooldown(id);
    setAllFish((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const updated = {
          ...f,
          likes: type === "like" ? f.likes + 1 : f.likes,
          dislikes: type === "dislike" ? f.dislikes + 1 : f.dislikes,
        };
        void updateFishVotes(id, updated.likes, updated.dislikes);
        return updated;
      })
    );
    setSelected((prev) =>
      prev?.id === id
        ? {
            ...prev,
            likes: type === "like" ? prev.likes + 1 : prev.likes,
            dislikes: type === "dislike" ? prev.dislikes + 1 : prev.dislikes,
          }
        : prev
    );
    setCooldownRemainingMs(VOTE_COOLDOWN_MS);
  };

  const formatCooldown = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-2 flex items-center justify-between bg-black/30 backdrop-blur-sm z-20 relative">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <FishIcon className="w-5 h-5" /> Acquario
          <span className="text-sm font-normal text-white/70">({allFish.length} pesci)</span>
        </h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-white border-white/30 bg-white/10 hover:bg-white/20"
            onClick={() => setShowRanking(!showRanking)}
          >
            <Trophy className="w-4 h-4 mr-1" /> Classifica
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate("/")}
          >
            <Pencil className="w-4 h-4 mr-1" /> Disegna
          </Button>
        </div>
      </header>

      {/* Ocean */}
      <div className="flex-1 relative ocean-gradient overflow-hidden">
        {/* Coralli in basso (dietro le piante) */}
        <Corals />
        {/* Piante acquatiche in basso */}
        <AquaticPlants />

        {/* Bolle che salgono */}
        {bubbles.map((b) => (
          <Bubble key={b.id} {...b} />
        ))}

        {/* Fish */}
        {allFish.map((fish) => (
          <SwimmingFish
            key={fish.id}
            fish={fish}
            onClick={() => setSelected(fish)}
            crownType={crownByFishId[fish.id] ?? null}
          />
        ))}

        {/* Loading / Empty state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <p className="text-white/80">Caricamento...</p>
          </div>
        )}
        {!loading && allFish.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/70 space-y-3">
              <FishIcon className="w-16 h-16 mx-auto opacity-50" />
              <p className="text-xl font-medium">L'acquario è vuoto!</p>
              <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground">
                Disegna il primo pesce
              </Button>
            </div>
          </div>
        )}

        {/* Ranking panel */}
        {showRanking && (
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-black/50 backdrop-blur-md z-10 overflow-y-auto p-4">
            <h2 className="text-white font-bold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Classifica
            </h2>
            <div className="mb-3 px-2 py-1.5 rounded-lg bg-white/10 text-center">
              <p className="text-white/70 text-xs uppercase tracking-wide">Fine settimana tra</p>
              <p className="text-white font-bold text-lg tabular-nums">{formatCountdown(countdownMs)}</p>
              <p className="text-white/50 text-xs mt-0.5">Rimangono i primi 3</p>
            </div>
            {ranked.length === 0 && (
              <p className="text-white/50 text-sm">Nessun pesce ancora</p>
            )}
            {ranked.map((fish) => {
              const pos = positionByFishId[fish.id] ?? 0;
              const score = fish.likes - fish.dislikes;
              const hasMedaglia = score >= 1;
              return (
              <div
                key={fish.id}
                className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-white/10 cursor-pointer hover:bg-white/20 transition"
                onClick={() => setSelected(fish)}
              >
                <span className="text-lg font-bold text-white/80 w-6">
                  {hasMedaglia && pos === 1 ? "🥇" : hasMedaglia && pos === 2 ? "🥈" : hasMedaglia && pos === 3 ? "🥉" : `${pos}`}
                </span>
                <img src={fish.imageData} className="w-10 h-8 object-contain" alt={fish.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{fish.name}</p>
                  <p className="text-white/60 text-xs">
                    👍 {fish.likes} · 👎 {fish.dislikes}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Fish detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col items-center gap-4">
              <img
                src={selected.imageData}
                alt={selected.name}
                className="w-40 h-32 object-contain rounded-lg bg-muted p-2"
              />
              {cooldownRemainingMs > 0 ? (
                <div className="text-center space-y-2 w-full rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    È permesso un solo like o dislike ogni 5 minuti.
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Potrai votare di nuovo tra <span className="font-mono font-bold tabular-nums">{formatCooldown(cooldownRemainingMs)}</span>
                  </p>
                </div>
              ) : null}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  disabled={cooldownRemainingMs > 0}
                  onClick={() => vote(selected.id, "like")}
                >
                  <ThumbsUp className="w-5 h-5 text-green-500" />
                  <span className="font-bold">{selected.likes}</span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  disabled={cooldownRemainingMs > 0}
                  onClick={() => vote(selected.id, "dislike")}
                >
                  <ThumbsDown className="w-5 h-5 text-red-500" />
                  <span className="font-bold">{selected.dislikes}</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Punteggio: {selected.likes - selected.dislikes}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AquariumPage;
