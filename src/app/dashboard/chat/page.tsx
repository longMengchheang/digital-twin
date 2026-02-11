"use client";

import { useChat } from "./useChat";
import { ChatHeader } from "./_components/ChatHeader";
import { ChatMessageList } from "./_components/ChatMessageList";
import { ChatInput } from "./_components/ChatInput";

export default function CompanionPage() {
  const {
    messages,
    historyChats,
    activeChatId,
    historyPanelOpen,
    setHistoryPanelOpen,
    historyLoadingId,
    input,
    setInput,
    isLoading,
    bootstrapping,
    errorMessage,
    hasMoreMessages,
    loadingMore,
    messagesEndRef,
    historyPanelRef,
    startNewSession,
    openHistoryChat,
    loadMoreMessages,
    handleSend,
  } = useChat();

  return (
    <div className="mx-auto flex h-[calc(100vh-5.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#2A2E3F] bg-[#151823] shadow-lg animate-fade-in relative">
      <ChatHeader
        historyPanelRef={historyPanelRef}
        historyPanelOpen={historyPanelOpen}
        setHistoryPanelOpen={setHistoryPanelOpen}
        startNewSession={startNewSession}
        historyChats={historyChats}
        activeChatId={activeChatId}
        historyLoadingId={historyLoadingId}
        openHistoryChat={openHistoryChat}
      />

      {errorMessage && (
        <div className="bg-[#F87171]/10 px-6 py-2 text-center text-xs font-medium text-[#F87171] border-b border-[#F87171]/20">
          {errorMessage}
        </div>
      )}

      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        bootstrapping={bootstrapping}
        hasMoreMessages={hasMoreMessages}
        loadingMore={loadingMore}
        activeChatId={activeChatId}
        loadMoreMessages={loadMoreMessages}
        messagesEndRef={messagesEndRef}
      />

      <ChatInput
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        bootstrapping={bootstrapping}
        messagesCount={messages.length}
        handleSend={handleSend}
      />
    </div>
  );
}
