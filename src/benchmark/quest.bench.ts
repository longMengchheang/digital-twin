import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Quest from '../lib/models/Quest';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

describe('Quest Fetch Benchmark', () => {
  let mongoServer: MongoMemoryServer;
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    // Start in-memory mongo server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Seed data
    userId = new mongoose.Types.ObjectId();
    const quests = [];
    const count = 10000;

    // Create large ratings array to simulate data bloat
    const largeRatings = Array(100).fill(5);

    // Create 10 batches of 1000
    for (let i = 0; i < count; i++) {
      quests.push({
        userId,
        goal: `Quest ${i}`,
        duration: 'daily',
        progress: Math.floor(Math.random() * 100),
        completed: Math.random() > 0.5,
        date: new Date(Date.now() - Math.random() * 10000000), // Random date in past
        ratings: largeRatings // 100 numbers per quest
      });
    }
    await Quest.insertMany(quests);
    console.log(`Seeded ${count} quests with large ratings.`);
  }, 30000); // 30s timeout for seeding

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('Benchmark: Unbounded Fetch (Baseline)', async () => {
    const start = performance.now();
    const quests = await Quest.find({ userId })
      .sort({ date: -1 })
      .lean();

    const mapped = quests.map((quest) => ({
      ...quest,
      _id: String(quest._id),
      progress: quest.progress ?? quest.ratings?.[0] ?? 0,
    }));

    const end = performance.now();
    console.log(`[Baseline] 10k quests (full fetch): ${(end - start).toFixed(2)}ms`);
    expect(mapped.length).toBe(10000);
  });

  test('Benchmark: Optimized (Limit + Projection)', async () => {
      const limit = 1000;
      const start = performance.now();
      const quests = await Quest.find({ userId })
        .sort({ date: -1 })
        .select({
            goal: 1,
            duration: 1,
            progress: 1,
            completed: 1,
            date: 1,
            completedDate: 1,
            ratings: { $slice: 1 } // Only fetch first rating
        })
        .limit(limit)
        .lean();

      const mapped = quests.map((quest) => ({
        ...quest,
        _id: String(quest._id),
        progress: quest.progress ?? quest.ratings?.[0] ?? 0,
      }));

      const end = performance.now();
      console.log(`[Optimized] 1k quests + Projection: ${(end - start).toFixed(2)}ms`);
      expect(mapped.length).toBe(limit);

      // Verify projection worked
      expect(mapped[0].goal).toBeDefined(); // Ensure other fields are returned
      expect(mapped[0].duration).toBeDefined();

      // Verify ratings slice
      if (mapped[0].ratings) {
          expect(mapped[0].ratings.length).toBeLessThanOrEqual(1);
      }
    });
});
