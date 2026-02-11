import { ChatMessage, ServerMessage } from "./types";

export function toUiMessage(message: ServerMessage, fallbackId: string): ChatMessage | null {
  if (message.role !== "user" && message.role !== "ai") {
    return null;
  }

  return {
    id: message.id || fallbackId,
    text: String(message.content || ""),
    sender: message.role,
    timestamp: new Date(message.timestamp || Date.now()),
  };
}
