import mongoose, { Document, Model } from 'mongoose';

export interface IUserInsightState extends Document {
  userId: mongoose.Types.ObjectId;
  topInterest: string;
  productivityScore: number;
  entertainmentRatio: number;
  currentTrend: 'rising' | 'stable' | 'dropping';
  lastReflection: string;
  updatedAt: Date;
}

const userInsightStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    topInterest: {
      type: String,
      default: '',
      trim: true,
    },
    productivityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    entertainmentRatio: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    currentTrend: {
      type: String,
      enum: ['rising', 'stable', 'dropping'],
      default: 'stable',
    },
    lastReflection: {
      type: String,
      default: '',
      trim: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Handle hot reloading in development
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.UserInsightState;
}

const UserInsightState: Model<IUserInsightState> =
  mongoose.models.UserInsightState ||
  mongoose.model<IUserInsightState>('UserInsightState', userInsightStateSchema);

export default UserInsightState;
