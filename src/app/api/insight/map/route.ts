import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { normalizeSignalType } from '@/lib/chat-signals';
import { clamp } from '@/lib/math';
import ChatSignal from '@/lib/models/ChatSignal';
import CheckIn from '@/lib/models/CheckIn';
import Quest from '@/lib/models/Quest';
import User from '@/lib/models/User';
import { generateInsightMap } from '@/lib/insight-map';

export const dynamic = 'force-dynamic';

type NodeType = 'Mood' | 'Signal' | 'Habit' | 'Routine' | 'Quest';
type NodeState = 'low' | 'medium' | 'high';
type EdgeStrength = 'weak' | 'medium' | 'strong';
type Polarity = 'negative' | 'positive';

type InsightNode = {
  id: string;
  label: string;
  type: NodeType;
  color: string;
  state: NodeState;
  score: number;
  occurrences: number;
  summary: string;
  details: string[];
  suggestion: string;
};

type InsightEdge = {
  id: string;
  source: string;
  target: string;
  strength: EdgeStrength;
  score: number;
  reason: string;
};

type UnifiedSignal = {
  signalType: string;
  intensity: number;
  confidence: number;
  source: string;
  createdAt: Date;
};

type SignalMeta = {
  label: string;
  nodeType: Exclude<NodeType, 'Mood' | 'Quest'>;
  polarity: Polarity;
  mood: 'low' | 'high';
  suggestion: string;
};

type SignalStats = {
  signalType: string;
  label: string;
  nodeType: Exclude<NodeType, 'Mood' | 'Quest'>;
  polarity: Polarity;
  suggestion: string;
  recentAvg: number;
  trendAvg: number;
  blendedAvg: number;
  currentWeekAvg: number;
  previousWeekAvg: number;
  delta: number;
  strength: number;
  dominantScore: number;
  occ24: number;
  occ7: number;
  occPrev7: number;
  sourceCounts7: Record<string, number>;
  highDays7: Set<string>;
};

const DAY_MS = 86400000;
const DECAY_FACTOR = 4.5;

const SIGNAL_META: Record<string, SignalMeta> = {
  stress: { label: 'Stress', nodeType: 'Signal', polarity: 'negative', mood: 'low', suggestion: 'Try a 5-minute breathing reset before high-load tasks.' },
  anxiety: { label: 'Anxiety', nodeType: 'Signal', polarity: 'negative', mood: 'low', suggestion: 'Add one grounding note and one slow breathing cycle.' },
  fatigue: { label: 'Fatigue', nodeType: 'Signal', polarity: 'negative', mood: 'low', suggestion: 'Protect sleep consistency and reduce late-day cognitive load.' },
  procrastination: { label: 'Procrastination', nodeType: 'Signal', polarity: 'negative', mood: 'low', suggestion: 'Use a 10-minute starter task to break inertia.' },
  focus: { label: 'Focus Routine', nodeType: 'Routine', polarity: 'positive', mood: 'high', suggestion: 'Protect one uninterrupted deep-work block daily.' },
  productivity: { label: 'Productivity', nodeType: 'Routine', polarity: 'positive', mood: 'high', suggestion: 'Batch similar tasks to keep momentum high.' },
  motivation: { label: 'Motivation', nodeType: 'Routine', polarity: 'positive', mood: 'high', suggestion: 'Convert motivation into one concrete next action.' },
  confidence: { label: 'Confidence', nodeType: 'Habit', polarity: 'positive', mood: 'high', suggestion: 'Record one daily win to reinforce progress.' },
  breathing: { label: 'Breathing Habit', nodeType: 'Habit', polarity: 'positive', mood: 'high', suggestion: 'Continue short breathing sessions around stress spikes.' },
  mindfulness: { label: 'Mindfulness', nodeType: 'Habit', polarity: 'positive', mood: 'high', suggestion: 'Add one short evening reflection.' },
};

const SOURCE_WEIGHT: Record<string, number> = {
  chat: 0.6,
  companion: 0.6,
  daily_pulse: 1.0,
  quest_create: 0.8,
  quest_progress: 0.7,
  quest_completion: 0.9,
  quest_log: 0.8,
};

const SOURCE_LABEL: Record<string, string> = {
  chat: 'Companion',
  companion: 'Companion',
  daily_pulse: 'Daily Pulse',
  quest_create: 'Quest Create',
  quest_progress: 'Quest Progress',
  quest_completion: 'Quest Completion',
  quest_log: 'Quest Log',
};

const NODE_PALETTE: Record<NodeType, Record<NodeState, string>> = {
  Mood: { low: '#fca5a5', medium: '#f59e0b', high: '#34d399' },
  Signal: { low: '#fdba74', medium: '#fb923c', high: '#f97316' },
  Habit: { low: '#9ae6b4', medium: '#34d399', high: '#10b981' },
  Routine: { low: '#93c5fd', medium: '#60a5fa', high: '#3b82f6' },
  Quest: { low: '#c4b5fd', medium: '#a78bfa', high: '#8b5cf6' },
};

const clamp100 = (v: number) => clamp(Math.round(v), 0, 100);
const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
const startDay = (d: Date) => { const n = new Date(d); n.setHours(0, 0, 0, 0); return n; };
const shiftDays = (d: Date, days: number) => { const n = new Date(d); n.setDate(n.getDate() + days); return n; };
const toDayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const state = (score: number): NodeState => (score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low');
const edgeStrength = (weight: number): EdgeStrength => (weight >= 70 ? 'strong' : weight >= 40 ? 'medium' : 'weak');
const interSize = (a: Set<string>, b: Set<string>) => { let n = 0; a.forEach((v) => { if (b.has(v)) n += 1; }); return n; };

function sourceWeight(source: string): number { return SOURCE_WEIGHT[source] ?? 0.65; }
function decay(createdAt: Date, now: Date): number { return Math.exp(-Math.max(0, (now.getTime() - createdAt.getTime()) / DAY_MS) / DECAY_FACTOR); }

function weightedAvg(rows: UnifiedSignal[], now: Date, useDecay: boolean): number {
  let sum = 0;
  let weight = 0;
  for (const r of rows) {
    const w = sourceWeight(r.source) * Math.max(0.35, clamp(r.confidence, 0, 1)) * (useDecay ? decay(r.createdAt, now) : 1);
    sum += r.intensity * w;
    weight += w;
  }
  return weight > 0 ? sum / weight : 0;
}

function highDays(rows: UnifiedSignal[], now: Date): Set<string> {
  const bucket = new Map<string, { sum: number; w: number }>();
  for (const r of rows) {
    const k = toDayKey(r.createdAt);
    const w = sourceWeight(r.source) * Math.max(0.35, clamp(r.confidence, 0, 1)) * decay(r.createdAt, now);
    const prev = bucket.get(k) || { sum: 0, w: 0 };
    prev.sum += r.intensity * w;
    prev.w += w;
    bucket.set(k, prev);
  }
  const out = new Set<string>();
  bucket.forEach((v, k) => {
    if (v.w > 0 && v.sum / v.w >= 3) {
      out.add(k);
    }
  });
  return out;
}

function sourceBreakdown(map: Record<string, number>): string {
  const entries = Object.entries(map).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  return entries.length ? entries.map(([s, c]) => `${SOURCE_LABEL[s] || s}: ${c}`).join(', ') : 'No source breakdown available.';
}

function connectionWeight(support: number, sourceDays: number, targetDays: number): number {
  const sourceCoverage = support / Math.max(1, sourceDays);
  const targetCoverage = support / Math.max(1, targetDays);
  const recurrence = support / 7;
  return clamp100(support * 22 + sourceCoverage * 30 + targetCoverage * 18 + recurrence * 30);
}

function mapUpdate(
  prevNodes: Array<{ nodeKey: string; label: string; strength: number; occurrences: number }>,
  prevEdges: Array<{ fromNodeKey: string; toNodeKey: string; weight: number }>,
  nextNodes: InsightNode[],
  nextEdges: InsightEdge[],
) {
  if (!prevNodes.length && !prevEdges.length) {
    return { changed: true, changeType: 'initialized' as const, message: 'Behavior map created from your recent activity.' };
  }
  const prevNode = new Map(prevNodes.map((n) => [n.nodeKey, n]));
  const prevEdge = new Map(prevEdges.map((e) => [`${e.fromNodeKey}->${e.toNodeKey}`, e]));
  const addedNode = nextNodes.find((n) => !prevNode.has(n.id));
  if (addedNode) return { changed: true, changeType: 'new_pattern' as const, message: `New pattern detected: ${addedNode.label}.` };
  const shifted = nextNodes.find((n) => { const p = prevNode.get(n.id); return p ? Math.abs(p.strength - n.score) >= 10 || Math.abs(p.occurrences - n.occurrences) >= 3 : false; });
  const prevTop = [...prevEdges].sort((a, b) => b.weight - a.weight)[0];
  const nextTop = [...nextEdges].sort((a, b) => b.score - a.score)[0];
  const prevTopKey = prevTop ? `${prevTop.fromNodeKey}->${prevTop.toNodeKey}` : '';
  const nextTopKey = nextTop ? `${nextTop.source}->${nextTop.target}` : '';
  if (nextTop && nextTopKey !== prevTopKey) return { changed: true, changeType: 'connection_shift' as const, message: 'New primary connection detected.' };
  const addedEdge = nextEdges.find((e) => !prevEdge.has(`${e.source}->${e.target}`));
  if (addedEdge) return { changed: true, changeType: 'new_pattern' as const, message: 'New connection detected in your behavior web.' };
  if (shifted) return { changed: true, changeType: 'rebalanced' as const, message: 'Your behavior map updated based on recent activity.' };
  return { changed: false, changeType: 'stable' as const, message: 'No major behavior pattern shift detected since last update.' };
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const authUser = verifyToken(req);
    if (!authUser) {
      return NextResponse.json({ msg: 'No token, authorization denied.' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const start30d = new Date(today);
    start30d.setDate(today.getDate() - 29);

    const [user, checkInsRaw, questsRaw, chatRaw] = await Promise.all([
      User.findById(authUser.id).select('level').lean(),
      CheckIn.find({ userId: authUser.id, date: { $gte: start30d } }).sort({ date: -1 }).lean(),
      Quest.find({ userId: authUser.id }).sort({ date: -1 }).limit(120).lean(),
      ChatSignal.find({ userId: authUser.id, createdAt: { $gte: start30d } })
        .select('signalType intensity confidence createdAt')
        .sort({ createdAt: -1 })
        .limit(1600)
        .lean(),
    ]);
    
    // Mock missing data
    const featureRaw: any[] = [];

    if (!user) {
      return NextResponse.json({ msg: 'User not found.' }, { status: 404 });
    }

    const insightMap = generateInsightMap(
      user,
      checkInsRaw,
      questsRaw,
      chatRaw,
      featureRaw,
      now
    );

    return NextResponse.json(insightMap);
  } catch (error) {
    console.error('Insight map error:', error);
    return NextResponse.json({ msg: 'Server error.' }, { status: 500 });
  }
}
