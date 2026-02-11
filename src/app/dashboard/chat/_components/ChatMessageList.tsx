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
}: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth bg-[#151823]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {hasMoreMessages && !bootstrapping && (
          <button
            onClick={() => void loadMoreMessages()}
            disabled={loadingMore}
            className="mx-auto text-xs font-medium text-[#6B7280] hover:text-[#E5E7EB] hover:underline"
          >
            {loadingMore ? "Loading..." : "Load Older Messages"}
          </button>
        )}

        {bootstrapping ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-20 opacity-50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6]" />
          </div>
        ) : messages.length <= 1 && !activeChatId ? (
          // Empty state greeting
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="mb-4 rounded-full bg-[#1C1F2B] p-4 text-[#8B5CF6]">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-[#E5E7EB]">
              Welcome to the Link.
            </h2>
            <p className="mt-1 text-sm text-[#9CA3AF] max-w-xs">
              I am your digital twin. I'm ready to sync.
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
                className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  message.sender === "ai" ? "bg-[#8B5CF6]" : "bg-[#2A2E3F]"
                }`}
              >
                {message.sender === "ai" ? (
                  <Sparkles className="h-4 w-4 text-white" />
                ) : (
                  <User className="h-4 w-4 text-[#9CA3AF]" />
                )}
              </div>

              <div
                className={`flex max-w-[80%] flex-col ${
                  message.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-bold text-[#E5E7EB]">
                    {message.sender === "ai" ? "Digital Twin" : "You"}
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
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
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#8B5CF6]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-bold text-[#E5E7EB]">
                  Digital Twin
                </span>
                <span className="text-[10px] text-[#6B7280]">typing...</span>
              </div>
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] animate-pulse delay-75" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
