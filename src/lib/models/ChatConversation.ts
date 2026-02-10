import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IChatConversation extends Document {
  userId: string;
  title: string;
  lastMessagePreview: string;
  messageCount: number;
  updatedAt: Date;
  createdAt: Date;
}

const chatConversationSchema = new Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, trim: true },
    lastMessagePreview: { type: String, trim: true },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for querying conversations by user, sorted by most recently updated
chatConversationSchema.index({ userId: 1, updatedAt: -1 });

const ChatConversation: Model<IChatConversation> =
  mongoose.models.ChatConversation || mongoose.model<IChatConversation>('ChatConversation', chatConversationSchema);

export default ChatConversation;
