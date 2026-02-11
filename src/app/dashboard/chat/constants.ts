import { ChatMessage } from "./types";

export const ACTIVE_CHAT_STORAGE_KEY = "digital_twin_active_chat_id";

export const quickPrompts = [
  "Reflect on this week",
  "I feel stressed",
  "Help me focus",
  "My energy is low",
];

export const introMessage: ChatMessage = {
  id: "intro",
  text: "Hello. I'm active and listening. What's on your mind?",
  sender: "ai",
  timestamp: new Date(),
};
