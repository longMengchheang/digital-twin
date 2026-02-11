import { clamp } from './math';

export const CHAT_SIGNAL_TYPES = [
  'stress',
  'focus',
  'motivation',
  'fatigue',
  'anxiety',
  'productivity',
  'confidence',
  'procrastination',
  'mindfulness',
  'breathing',
] as const;

export type ChatSignalType = (typeof CHAT_SIGNAL_TYPES)[number];

export interface ExtractedChatSignal {
  signalType: ChatSignalType;
  intensity: number;
  confidence: number;
}

type SignalAliasMap = Record<string, ChatSignalType>;

const SIGNAL_ALIASES: SignalAliasMap = {
  stress: 'stress',
  stressed: 'stress',
  focus: 'focus',
  focused: 'focus',
  concentration: 'focus',
  motivation: 'motivation',
  motivated: 'motivation',
  fatigue: 'fatigue',
  tired: 'fatigue',
  anxiety: 'anxiety',
  anxious: 'anxiety',
  productivity: 'productivity',
  productive: 'productivity',
  confidence: 'confidence',
  confident: 'confidence',
  procrastination: 'procrastination',
  procrastinating: 'procrastination',
  mindfulness: 'mindfulness',
  mindful: 'mindfulness',
  breathing: 'breathing',
  breath: 'breathing',
};

export function normalizeSignalType(value: unknown): ChatSignalType | null {
  const key = String(value || '').trim().toLowerCase();
  if (!key) {
    return null;
  }

  if ((CHAT_SIGNAL_TYPES as readonly string[]).includes(key)) {
    return key as ChatSignalType;
  }

  return SIGNAL_ALIASES[key] || null;
}

function parseSignalArray(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }

  if (input && typeof input === 'object') {
    const objectInput = input as Record<string, unknown>;
    if (Array.isArray(objectInput.signals)) {
      return objectInput.signals;
    }
    if (Array.isArray(objectInput.data)) {
      return objectInput.data;
    }
  }

  return [];
}

export function sanitizeExtractedSignals(input: unknown): ExtractedChatSignal[] {
  const rows = parseSignalArray(input);
  const byType = new Map<ChatSignalType, ExtractedChatSignal>();

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      continue;
    }

    const objectRow = row as Record<string, unknown>;
    const signalType = normalizeSignalType(objectRow.signal_type ?? objectRow.signalType ?? objectRow.type);
    if (!signalType) {
      continue;
    }

    const intensityValue = Number(objectRow.intensity ?? objectRow.strength ?? 3);
    const confidenceValue = Number(objectRow.confidence ?? objectRow.score ?? 0.7);

    const normalizedSignal: ExtractedChatSignal = {
      signalType,
      intensity: Math.round(clamp(Number.isFinite(intensityValue) ? intensityValue : 3, 1, 5)),
      confidence: Number(clamp(Number.isFinite(confidenceValue) ? confidenceValue : 0.7, 0, 1).toFixed(3)),
    };

    const existing = byType.get(signalType);
    if (!existing) {
      byType.set(signalType, normalizedSignal);
      continue;
    }

    const replace =
      normalizedSignal.confidence > existing.confidence ||
      (normalizedSignal.confidence === existing.confidence && normalizedSignal.intensity > existing.intensity);

    if (replace) {
      byType.set(signalType, normalizedSignal);
    }
  }

  return Array.from(byType.values());
}

export function parseSignalResponseText(rawText: string): ExtractedChatSignal[] {
  const trimmed = String(rawText || '').trim();
  if (!trimmed) {
    return [];
  }

  const normalized = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const attempts: string[] = [normalized];
  const arrayStart = normalized.indexOf('[');
  const arrayEnd = normalized.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    attempts.push(normalized.slice(arrayStart, arrayEnd + 1));
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      const sanitized = sanitizeExtractedSignals(parsed);
      if (sanitized.length) {
        return sanitized;
      }
    } catch {
      // Keep trying.
    }
  }

  return [];
}

export interface InsightSignalCounts {
  stress: number;
  focus: number;
  motivation: number;
  breathing: number;
  reflection: number;
  exercise: number;
  fatigue: number;
}

export function createInsightSignalCounts(): InsightSignalCounts {
  return {
    stress: 0,
    focus: 0,
    motivation: 0,
    breathing: 0,
    reflection: 0,
    exercise: 0,
    fatigue: 0,
  };
}
