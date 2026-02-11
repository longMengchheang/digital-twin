import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import ChatMessage from '../src/lib/models/ChatMessage';

async function runBenchmark() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);

  const chatId = 'new-chat-id';
  const userId = 'user-123';

  console.log('Starting benchmark for unnecessary history query...');
  const iterations = 500;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    await ChatMessage.find({ chatId, userId })
      .select('role content')
      .sort({ createdAt: -1 })
      .limit(24)
      .lean();
  }

  const end = performance.now();
  const totalTime = end - start;
  const avgTime = totalTime / iterations;

  console.log(`Total time for ${iterations} empty queries: ${totalTime.toFixed(2)}ms`);
  console.log(`Average time per query (potential saving): ${avgTime.toFixed(4)}ms`);

  await mongoose.disconnect();
  await mongoServer.stop();
}

runBenchmark().catch(console.error);
