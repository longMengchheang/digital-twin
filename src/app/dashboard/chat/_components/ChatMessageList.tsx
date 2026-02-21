import { RefObject } from "react";
import { Sparkles, User } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  bootstrapping: boolean;
  hasMoreMessages: boolean;
  loadingMore: boolean;
  activeChatId: string | null;
  loadMoreMessages: () => Promise<void>;
  messagesEndRef: RefObject<HTMLDivElement>;
  scrollContainerRef: RefObject<HTMLDivElement>;
}

export function ChatMessageList({
  messages,
  isLoading,
  bootstrapping,
  hasMoreMessages,
  loadingMore,
  activeChatId,
  loadMoreMessages,
  messagesEndRef,
  scrollContainerRef,
}: ChatMessageListProps) {
  return (
    <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6 scroll-smooth bg-bg-panel">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {hasMoreMessages && !bootstrapping && (
          <button
            onClick={() => void loadMoreMessages()}
            disabled={loadingMore}
            className="mx-auto text-xs font-medium text-text-muted hover:text-text-primary hover:underline"
          >
            {loadingMore ? "Loading..." : "Load Older Messages"}
          </button>
        )}

        {bootstrapping ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-20 opacity-50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary/30 border-t-accent-primary" />
          </div>
        ) : messages.length <= 1 && !activeChatId ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in relative z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary shadow-inner border border-accent-primary/20">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Welcome to the Link.
            </h2>
            <p className="mt-2 text-sm font-medium text-text-secondary max-w-sm">
              I am your digital twin. I&apos;m ready to sync.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={[
                "flex gap-4 group",
                message.sender === "user" ? "flex-row-reverse" : "flex-row",
              ].join(" ")}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                  message.sender === "ai" 
                    ? "bg-accent-primary border-accent-primary shadow-[0_0_10px_rgba(139,92,246,0.3)]" 
                    : "bg-bg-card border-border/60 shadow-sm"
                }`}
              >
                {message.sender === "ai" ? (
                  <Sparkles className="h-4 w-4 text-white" />
                ) : (
                  <User className="h-4 w-4 text-text-secondary" />
                )}
              </div>

              <div
                className={`flex max-w-[80%] flex-col ${
                  message.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-bold text-text-primary">
                    {message.sender === "ai" ? "Digital Twin" : "You"}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className={`text-[0.93rem] leading-relaxed text-[#D1D5DB]`}>
                  {message.text}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-4 animate-fade-in">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border bg-accent-primary border-accent-primary shadow-[0_0_10px_rgba(139,92,246,0.3)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-bold text-text-primary">
                  Digital Twin
                </span>
                <span className="text-[10px] text-text-muted">typing...</span>
              </div>
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-primary animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-accent-primary animate-pulse delay-75" />
                <span className="h-1.5 w-1.5 rounded-full bg-accent-primary animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
