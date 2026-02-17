import { ChatSummary } from "../types";

interface ChatHistoryListProps {
  historyChats: ChatSummary[];
  activeChatId: string | null;
  historyLoadingId: string | null;
  openHistoryChat: (chatId: string) => void;
}

export function ChatHistoryList({
  historyChats,
  activeChatId,
  historyLoadingId,
  openHistoryChat,
}: ChatHistoryListProps) {
  if (!historyChats.length) {
    return (
      <p className="py-2 text-center text-xs text-text-muted">No history yet.</p>
    );
  }

  return (
    <div className="space-y-0.5">
      {historyChats.map((chat) => (
        <button
          key={chat.id}
          type="button"
          onClick={() => {
            void openHistoryChat(chat.id);
          }}
          className={[
            "w-full rounded px-2 py-1.5 text-left transition-all",
            chat.id === activeChatId
              ? "bg-border text-text-primary"
              : "hover:bg-border/50 text-text-secondary",
          ].join(" ")}
          disabled={historyLoadingId === chat.id}
        >
          <p className="truncate text-xs font-medium">{chat.title}</p>
        </button>
      ))}
    </div>
  );
}
