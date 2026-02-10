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
      <p className="py-2 text-center text-xs text-[#6B7280]">No history yet.</p>
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
              ? "bg-[#2A2E3F] text-[#E5E7EB]"
              : "hover:bg-[#2A2E3F]/50 text-[#9CA3AF]",
          ].join(" ")}
          disabled={historyLoadingId === chat.id}
        >
          <p className="truncate text-xs font-medium">{chat.title}</p>
        </button>
      ))}
    </div>
  );
}
