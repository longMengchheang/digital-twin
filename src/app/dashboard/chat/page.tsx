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
    <div className="mx-auto flex h-[calc(100vh-5.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-bg-panel shadow-lg animate-fade-in relative">
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
        <div className="bg-status-error/10 px-6 py-2 text-center text-xs font-medium text-status-error border-b border-status-error/20">
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
