import { describe, expect, test } from 'bun:test';
import { generateInsightMap } from './insight-map';

describe('generateInsightMap', () => {
  const now = new Date('2023-10-27T12:00:00Z');
  const user = { level: 5 };

  test('returns basic structure with mood node', () => {
    const result = generateInsightMap(user, [], [], [], [], now);
    expect(result.center.label).toBe('You');
    expect(result.nodes.length).toBeGreaterThan(0);
    const moodNode = result.nodes.find(n => n.id === 'node-mood');
    expect(moodNode).toBeDefined();
    expect(moodNode?.type).toBe('Mood');
  });

  test('calculates mood correctly from check-ins', () => {
    const checkIns = [
      { date: new Date('2023-10-27'), percentage: 80, ratings: [4, 4, 4, 4, 4] }, // Today
      { date: new Date('2023-10-26'), percentage: 60, ratings: [3, 3, 3, 3, 3] }, // Yesterday
    ];
    const result = generateInsightMap(user, checkIns, [], [], [], now);
    const moodNode = result.nodes.find(n => n.id === 'node-mood');
    expect(moodNode?.score).toBeGreaterThan(60);
    expect(result.dataWindow.signals7d).toBe(0);
  });

  test('includes quest node when active quest exists', () => {
    const quests = [
      { date: new Date('2023-10-25'), goal: 'Conquer the world', completed: false, progress: 50 },
    ];
    const result = generateInsightMap(user, [], quests, [], [], now);
    const questNode = result.nodes.find(n => n.id === 'quest-active');
    expect(questNode).toBeDefined();
    expect(questNode?.label).toBe('Conquer the world');
    expect(questNode?.score).toBeGreaterThan(0);
  });

  test('processes chat signals and creates signal nodes', () => {
    const chatSignals = [
      { signalType: 'stress', intensity: 4, confidence: 0.9, createdAt: new Date('2023-10-27T10:00:00Z') },
      { signalType: 'stress', intensity: 3, confidence: 0.8, createdAt: new Date('2023-10-26T10:00:00Z') },
      { signalType: 'focus', intensity: 5, confidence: 0.9, createdAt: new Date('2023-10-27T11:00:00Z') },
    ];
    const result = generateInsightMap(user, [], [], chatSignals, [], now);

    const stressNode = result.nodes.find(n => n.id === 'signal-stress');
    expect(stressNode).toBeDefined();
    expect(stressNode?.occurrences).toBe(2);

    const focusNode = result.nodes.find(n => n.id === 'signal-focus');
    expect(focusNode).toBeDefined();
    expect(focusNode?.occurrences).toBe(1);

    expect(result.dataWindow.signals7d).toBe(3);
  });

  test('generates edges between connected signals', () => {
    const checkIns = [
      { date: new Date('2023-10-27'), percentage: 90, ratings: [5,5,5,5,5], dayKey: '2023-10-27' },
    ];

    const chatSignals = [
      { signalType: 'focus', intensity: 5, confidence: 1, createdAt: new Date('2023-10-27T10:00:00Z') },
      { signalType: 'focus', intensity: 5, confidence: 1, createdAt: new Date('2023-10-27T11:00:00Z') },
      { signalType: 'focus', intensity: 5, confidence: 1, createdAt: new Date('2023-10-27T12:00:00Z') },
    ];

    const result = generateInsightMap(user, checkIns, [], chatSignals, [], now);

    const edge = result.edges.find(e => e.source === 'signal-focus' && e.target === 'node-mood');

    expect(result.nodes.find(n => n.id === 'signal-focus')).toBeDefined();
    expect(result.nodes.find(n => n.id === 'node-mood')).toBeDefined();

    expect(edge).toBeDefined();
    expect(edge?.reason).toContain('co-occurred with higher mood');
  });
});
