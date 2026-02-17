import mongoose from 'mongoose';
import UserEvent, { IUserEvent } from './models/UserEvent';
import UserInsightState from './models/UserInsightState';
import dbConnect from './db';

// Category classifications for productivity calculation
const PRODUCTIVE_CATEGORIES = [
  'work',
  'study',
  'exercise',
  'health',
  'learning',
  'reading',
  'coding',
  'writing',
  'project',
  'career',
  'finance',
  'planning',
];

const ENTERTAINMENT_CATEGORIES = [
  'entertainment',
  'gaming',
  'social media',
  'streaming',
  'youtube',
  'netflix',
  'movies',
  'tv',
  'music',
  'browsing',
  'leisure',
];

export interface InsightData {
  topInterest: string;
  productivityScore: number;
  entertainmentRatio: number;
  trend: 'rising' | 'stable' | 'dropping';
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

/**
 * Get events from last N days for a user
 */
async function getRecentEvents(userId: string, days: number): Promise<IUserEvent[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0);

  const events = await UserEvent.find({
    userId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: cutoffDate },
  })
    .sort({ createdAt: 1 })
    .lean();

  return events as IUserEvent[];
}

/**
 * Calculate productivity score from events
 * - quest_completed = +1
 * - log_added with productive category = +0.5
 * - log_added with entertainment category = -0.5
 */
function calculateProductivityScore(events: IUserEvent[]): number {
  let score = 0;

  for (const event of events) {
    if (event.type === 'quest_completed') {
      score += 1;
    } else if (event.type === 'log_added') {
      const category = (event.metadata?.category || '').toLowerCase();
      if (PRODUCTIVE_CATEGORIES.some((c) => category.includes(c))) {
        score += 0.5;
      } else if (ENTERTAINMENT_CATEGORIES.some((c) => category.includes(c))) {
        score -= 0.5;
      }
    }
  }

  // Normalize to 0-100 scale
  // Assuming max reasonable score of 50 for normalization
  const normalizedScore = Math.max(0, Math.min(100, (score / 50) * 100));
  return Math.round(normalizedScore * 10) / 10;
}

/**
 * Calculate entertainment ratio (entertainment_time / total_time)
 */
function calculateEntertainmentRatio(events: IUserEvent[]): number {
  let entertainmentTime = 0;
  let totalTime = 0;

  for (const event of events) {
    const duration = event.metadata?.duration || 0;
    if (duration > 0) {
      totalTime += duration;
      const category = (event.metadata?.category || '').toLowerCase();
      if (ENTERTAINMENT_CATEGORIES.some((c) => category.includes(c))) {
        entertainmentTime += duration;
      }
    }
  }

  if (totalTime === 0) {
    return 0;
  }

  return Math.round((entertainmentTime / totalTime) * 100) / 100;
}

/**
 * Find most frequent interest from events
 */
function findTopInterest(events: IUserEvent[]): string {
  const interestCounts: Record<string, number> = {};

  for (const event of events) {
    // Collect interests from category and topic
    const interests: string[] = [];
    if (event.metadata?.category) {
      interests.push(event.metadata.category);
    }
    if (event.metadata?.topic) {
      interests.push(event.metadata.topic);
    }

    for (const interest of interests) {
      const normalized = interest.toLowerCase().trim();
      if (normalized) {
        interestCounts[normalized] = (interestCounts[normalized] || 0) + 1;
      }
    }
  }

  // Find the most frequent interest
  let topInterest = '';
  let maxCount = 0;

  for (const [interest, count] of Object.entries(interestCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topInterest = interest;
    }
  }

  // Capitalize first letter for display
  return topInterest ? topInterest.charAt(0).toUpperCase() + topInterest.slice(1) : 'General';
}

/**
 * Calculate productivity score for a specific day
 */
function calculateDailyProductivityScore(events: IUserEvent[], date: Date): number {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const dayEvents = events.filter((e) => {
    const eventDate = new Date(e.createdAt);
    return eventDate >= startOfDay && eventDate <= endOfDay;
  });

  return calculateProductivityScore(dayEvents);
}

/**
 * Determine trend direction by comparing last 2 days' productivity scores
 */
function calculateTrend(events: IUserEvent[]): 'rising' | 'stable' | 'dropping' {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayScore = calculateDailyProductivityScore(events, today);
  const yesterdayScore = calculateDailyProductivityScore(events, yesterday);

  // Handle edge cases
  if (yesterdayScore === 0) {
    if (todayScore > 0) {
      return 'rising';
    }
    return 'stable';
  }

  const changeRatio = (todayScore - yesterdayScore) / yesterdayScore;

  if (changeRatio >= 0.2) {
    return 'rising';
  } else if (changeRatio <= -0.2) {
    return 'dropping';
  }

  return 'stable';
}

/**
 * Generate reflection using Gemini AI
 */
async function generateReflection(insights: InsightData): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return 'Your twin is waiting for more daily signals before sharing a full reflection.';
  }

  const prompt = `Generate a 3-sentence daily reflection based on:
- Top interest: ${insights.topInterest}
- Productivity score: ${insights.productivityScore}/100
- Entertainment ratio: ${Math.round(insights.entertainmentRatio * 100)}%
- Trend: ${insights.trend}

Keep it encouraging and personal. Be specific about their interests and progress.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: 'You are a supportive digital twin that provides personalized daily reflections. Keep responses to exactly 3 sentences. Be encouraging but honest.',
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return "Your twin is processing today's pattern. Reflection will appear shortly.";
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('\n')
      .trim();

    return text || "Your twin is still tracing today's pattern. Add a little more activity to sharpen the reflection.";
  } catch (error) {
    console.error('Failed to generate reflection:', error);
    return "Your twin couldn't complete today's reflection yet. Check back after your next activity.";
  }
}

/**
 * Main function: Update user insight state
 * 1. Fetch last 7 days of events
 * 2. Compute insights (top interest, productivity score, entertainment ratio, trend)
 * 3. Generate AI reflection
 * 4. Save/update UserInsightState
 */
export async function updateUserInsight(userId: string): Promise<InsightData | null> {
  await dbConnect();

  try {
    // Step 1: Fetch last 7 days of events
    const events = await getRecentEvents(userId, 7);

    // Step 2: Compute insights
    const topInterest = findTopInterest(events);
    const productivityScore = calculateProductivityScore(events);
    const entertainmentRatio = calculateEntertainmentRatio(events);
    const trend = calculateTrend(events);

    const insights: InsightData = {
      topInterest,
      productivityScore,
      entertainmentRatio,
      trend,
    };

    // Step 3: Generate reflection using AI
    const reflection = await generateReflection(insights);

    // Step 4: Save/update UserInsightState
    await UserInsightState.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        $set: {
          topInterest,
          productivityScore,
          entertainmentRatio,
          currentTrend: trend,
          lastReflection: reflection,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return insights;
  } catch (error) {
    console.error('Failed to update user insight:', error);
    return null;
  }
}

// Export helper functions for testing and external use
export {
  getRecentEvents,
  calculateProductivityScore,
  calculateEntertainmentRatio,
  findTopInterest,
  calculateTrend,
  generateReflection,
};
