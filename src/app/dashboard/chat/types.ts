export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export interface ServerMessage {
  id?: string;
  role: "user" | "ai" | "system";
  content: string;
  timestamp: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messageCount: number;
}
