import { Dispatch, RefObject, SetStateAction } from "react";
import { Hash, History, Plus } from "lucide-react";
import { ChatSummary } from "../types";
import { ChatHistoryList } from "./ChatHistoryList";

interface ChatHeaderProps {
  historyPanelRef: RefObject<HTMLDivElement>;
  historyPanelOpen: boolean;
  setHistoryPanelOpen: Dispatch<SetStateAction<boolean>>;
  startNewSession: () => void;
  historyChats: ChatSummary[];
  activeChatId: string | null;
  historyLoadingId: string | null;
  openHistoryChat: (chatId: string) => Promise<void>;
}

export function ChatHeader({
  historyPanelRef,
  historyPanelOpen,
  setHistoryPanelOpen,
  startNewSession,
  historyChats,
  activeChatId,
  historyLoadingId,
  openHistoryChat,
}: ChatHeaderProps) {
  return (
    <header className="relative flex items-center justify-between gap-3 border-b border-bg-sidebar bg-bg-panel px-5 py-3.5">
      <div className="flex items-center gap-3">
        <Hash className="h-5 w-5 text-text-secondary" />
        <div>
          <h1 className="text-sm font-bold text-text-primary">companion-chat</h1>
          <p className="text-xs text-text-muted">Private channel</p>
        </div>
      </div>

      <div ref={historyPanelRef} className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={() => startNewSession()}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-border text-text-secondary transition-colors"
          title="New Chat"
        >
          <Plus className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setHistoryPanelOpen((value) => !value)}
          className="flex h-8 items-center gap-2 rounded hover:bg-border px-2 text-xs font-semibold text-text-secondary transition-colors"
        >
          <History className="h-4 w-4" />
        </button>

        {historyPanelOpen && (
          <div className="absolute right-0 top-10 z-20 max-h-80 w-64 overflow-y-auto rounded-lg border border-bg-sidebar bg-bg-card p-2 shadow-2xl">
            <ChatHistoryList
              historyChats={historyChats}
              activeChatId={activeChatId}
              historyLoadingId={historyLoadingId}
              openHistoryChat={openHistoryChat}
            />
          </div>
        )}
      </div>
    </header>
  );
}
