"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Clock3, Hash, History, MessageCircle, Plus, Send, Sparkles, User } from "lucide-react";
import { CHAT_CONSTANTS } from "@/lib/constants";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ServerMessage {
  id?: string;
  role: "user" | "ai" | "system";
  content: string;
  timestamp: string;
}

interface ChatSummary {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messageCount: number;
}

const ACTIVE_CHAT_STORAGE_KEY = "digital_twin_active_chat_id";

const introMessage: ChatMessage = {
  id: "intro",
  text: CHAT_CONSTANTS.INTRO_MESSAGE,
  sender: "ai",
  timestamp: new Date(),
};

function toUiMessage(message: ServerMessage, fallbackId: string): ChatMessage | null {
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

function formatHistoryTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CompanionPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyChats, setHistoryChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottomRef = useRef(true);

  useEffect(() => {
    void initializeChatPage();
  }, []);

  useEffect(() => {
    if (shouldScrollToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      shouldScrollToBottomRef.current = true;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!historyPanelOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!historyPanelRef.current) return;
      if (!historyPanelRef.current.contains(event.target as Node)) {
        setHistoryPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [historyPanelOpen]);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const startNewSession = (clearInput = true) => {
    sessionStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
    setActiveChatId(null);
    setMessages([introMessage]);
    if (clearInput) {
      setInput("");
    }
    setErrorMessage("");
    setHistoryPanelOpen(false);
  };

  const fetchHistoryChats = async (headers: Record<string, string>) => {
    const response = await axios.get("/api/chat/history", { headers });
    const rawChats = Array.isArray(response.data?.chats) ? (response.data.chats as ChatSummary[]) : [];
    setHistoryChats(rawChats);
    return rawChats;
  };

  const loadConversationById = async (chatId: string, headers: Record<string, string>) => {
    const response = await axios.get("/api/chat/history", {
      headers,
      params: { chatId },
    });

    const rawMessages = Array.isArray(response.data?.messages) ? (response.data.messages as ServerMessage[]) : [];
    const pagination = response.data?.pagination || {};

    setHasMoreMessages(!!pagination.hasMore);
    setNextCursor(pagination.nextCursor || null);

    const parsedMessages = rawMessages
      .map((message, index) => toUiMessage(message, `history-${index}`))
      .filter((message): message is ChatMessage => Boolean(message));

    setMessages(parsedMessages.length ? parsedMessages : [introMessage]);
    setActiveChatId(chatId);
    sessionStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, chatId);
    shouldScrollToBottomRef.current = true;
  };

  const loadMoreMessages = async () => {
    if (!nextCursor || loadingMore || !activeChatId) return;

    const headers = authHeaders();
    if (!headers) return;

    setLoadingMore(true);
    try {
      const response = await axios.get("/api/chat/history", {
        headers,
        params: { chatId: activeChatId, cursor: nextCursor },
      });

      const rawMessages = Array.isArray(response.data?.messages) ? (response.data.messages as ServerMessage[]) : [];
      const pagination = response.data?.pagination || {};

      setHasMoreMessages(!!pagination.hasMore);
      setNextCursor(pagination.nextCursor || null);

      const parsedMessages = rawMessages
        .map((message, index) => toUiMessage(message, `history-more-${Date.now()}-${index}`))
        .filter((message): message is ChatMessage => Boolean(message));

      if (parsedMessages.length > 0) {
        shouldScrollToBottomRef.current = false;
        setMessages((prev) => [...parsedMessages, ...prev]);
      }
    } catch (error) {
      console.error("Failed to load more messages", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const initializeChatPage = async () => {
    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    try {
      await fetchHistoryChats(headers);

      const storedActiveChatId = sessionStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
      if (storedActiveChatId) {
        try {
          await loadConversationById(storedActiveChatId, headers);
        } catch {
          startNewSession(false);
        }
      } else {
        startNewSession(false);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/");
        return;
      }

      startNewSession(false);
      setErrorMessage(CHAT_CONSTANTS.ERROR_LOAD_HISTORY);
    } finally {
      setBootstrapping(false);
    }
  };

  const openHistoryChat = async (chatId: string) => {
    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    setHistoryLoadingId(chatId);
    try {
      await loadConversationById(chatId, headers);
      setErrorMessage("");
      setHistoryPanelOpen(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/");
        return;
      }

      setErrorMessage(CHAT_CONSTANTS.ERROR_OPEN_CONVERSATION);
    } finally {
      setHistoryLoadingId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const headers = authHeaders();
    if (!headers) {
      router.push("/");
      return;
    }

    const outgoingText = input.trim();
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      text: outgoingText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(
        "/api/chat/send",
        { message: outgoingText, chatId: activeChatId },
        { headers },
      );

      const reply = String(response.data?.reply || "").trim();
      const resolvedChatId = String(response.data?.chatId || "").trim();
      if (!reply) {
        throw new Error(CHAT_CONSTANTS.ERROR_EMPTY_RESPONSE);
      }

      if (resolvedChatId && resolvedChatId !== activeChatId) {
        setActiveChatId(resolvedChatId);
        sessionStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, resolvedChatId);
      }

      const aiMessage: ChatMessage = {
        id: `${Date.now()}-ai`,
        text: reply,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((current) => [...current, aiMessage]);
      await fetchHistoryChats(headers);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/");
        return;
      }

      const serverMessage =
        axios.isAxiosError(error) && typeof error.response?.data?.msg === "string"
          ? error.response.data.msg
          : CHAT_CONSTANTS.ERROR_SEND_FAILED;
      setErrorMessage(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-5.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#2A2E3F] bg-[#151823] shadow-lg animate-fade-in relative">
      
      {/* Header */}
      <header className="relative flex items-center justify-between gap-3 border-b border-[#0B0D14] bg-[#151823] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Hash className="h-5 w-5 text-[#9CA3AF]" />
          <div>
            <h1 className="text-sm font-bold text-[#E5E7EB]">{CHAT_CONSTANTS.HEADER_TITLE}</h1>
            <p className="text-xs text-[#6B7280]">{CHAT_CONSTANTS.HEADER_SUBTITLE}</p>
          </div>
        </div>

        <div ref={historyPanelRef} className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => startNewSession()}
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-[#2A2E3F] text-[#9CA3AF] transition-colors"
            title={CHAT_CONSTANTS.NEW_CHAT_TOOLTIP}
          >
            <Plus className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setHistoryPanelOpen((value) => !value)}
            className="flex h-8 items-center gap-2 rounded hover:bg-[#2A2E3F] px-2 text-xs font-semibold text-[#9CA3AF] transition-colors"
          >
            <History className="h-4 w-4" />
          </button>

          {historyPanelOpen && (
            <div className="absolute right-0 top-10 z-20 max-h-80 w-64 overflow-y-auto rounded-lg border border-[#0B0D14] bg-[#1C1F2B] p-2 shadow-2xl">
              {historyChats.length ? (
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
              ) : (
                <p className="py-2 text-center text-xs text-[#6B7280]">{CHAT_CONSTANTS.NO_HISTORY}</p>
              )}
            </div>
          )}
        </div>
      </header>

      {errorMessage && (
        <div className="bg-[#F87171]/10 px-6 py-2 text-center text-xs font-medium text-[#F87171] border-b border-[#F87171]/20">
          {errorMessage}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth bg-[#151823]">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {hasMoreMessages && !bootstrapping && (
            <button
              onClick={() => void loadMoreMessages()}
              disabled={loadingMore}
              className="mx-auto text-xs font-medium text-[#6B7280] hover:text-[#E5E7EB] hover:underline"
            >
              {loadingMore ? CHAT_CONSTANTS.LOADING : CHAT_CONSTANTS.LOAD_OLDER_MESSAGES}
            </button>
          )}

          {bootstrapping ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-20 opacity-50">
               <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6]" />
            </div>
          ) : (
             messages.length <= 1 && !activeChatId ? (
                // Empty state greeting
                <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                    <div className="mb-4 rounded-full bg-[#1C1F2B] p-4 text-[#8B5CF6]">
                        <Sparkles className="h-8 w-8" />
                    </div>
                    <h2 className="text-lg font-bold text-[#E5E7EB]">{CHAT_CONSTANTS.WELCOME_TITLE}</h2>
                    <p className="mt-1 text-sm text-[#9CA3AF] max-w-xs">
                        {CHAT_CONSTANTS.WELCOME_SUBTITLE}
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
                      <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${message.sender === "ai" ? "bg-[#8B5CF6]" : "bg-[#2A2E3F]"}`}>
                        {message.sender === "ai" ? <Sparkles className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-[#9CA3AF]" />}
                      </div>

                      <div className={`flex max-w-[80%] flex-col ${message.sender === "user" ? "items-end" : "items-start"}`}>
                        <div className="flex items-baseline gap-2 mb-1">
                             <span className="text-sm font-bold text-[#E5E7EB]">
                                 {message.sender === "ai" ? CHAT_CONSTANTS.AI_NAME : CHAT_CONSTANTS.USER_NAME}
                             </span>
                             <span className="text-[10px] text-[#6B7280]">
                                 {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                             </span>
                        </div>
                        <div className={`text-[0.93rem] leading-relaxed text-[#D1D5DB]`}>
                            {message.text}
                        </div>
                      </div>
                    </div>
                  ))
             )
          )}

          {isLoading && (
            <div className="flex gap-4 animate-fade-in">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#8B5CF6]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                 <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-bold text-[#E5E7EB]">{CHAT_CONSTANTS.AI_NAME}</span>
                      <span className="text-[10px] text-[#6B7280]">{CHAT_CONSTANTS.TYPING}</span>
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

      {/* Input Area */}
      <div className="bg-[#151823] px-4 pb-5 pt-2">
        <div className="mx-auto w-full max-w-3xl">
           <div className="relative rounded-lg bg-[#1C1F2B]">
             {/* Suggestion Chips */}
             {messages.length < 3 && (
                <div className="flex gap-2 p-2 overflow-x-auto pb-0 border-b border-[#2A2E3F]/50">
                    {CHAT_CONSTANTS.QUICK_PROMPTS.map((prompt) => (
                    <button
                        key={prompt}
                        type="button"
                        onClick={() => setInput(prompt)}
                        className="whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:underline transition-colors"
                    >
                        {prompt}
                    </button>
                    ))}
                </div>
             )}

            <div className="flex items-end">
                <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={CHAT_CONSTANTS.INPUT_PLACEHOLDER}
                className="min-h-[44px] max-h-[140px] flex-1 resize-none bg-transparent px-4 py-3 text-[0.93rem] text-[#E5E7EB] placeholder:text-[#6B7280] outline-none"
                rows={1}
                />
                
                {input.trim() && (
                    <button
                        type="button"
                        onClick={() => {
                            void handleSend();
                        }}
                        disabled={isLoading || bootstrapping}
                        className="mr-2 mb-2 p-2 text-[#8B5CF6] hover:text-white hover:bg-[#8B5CF6] rounded transition-all"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
