import { Dispatch, SetStateAction } from "react";
import { Send } from "lucide-react";
import { quickPrompts } from "../constants";

interface ChatInputProps {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  isLoading: boolean;
  bootstrapping: boolean;
  messagesCount: number;
  handleSend: () => Promise<void>;
}

export function ChatInput({
  input,
  setInput,
  isLoading,
  bootstrapping,
  messagesCount,
  handleSend,
}: ChatInputProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="bg-[#151823] px-4 pb-5 pt-2">
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative rounded-lg bg-[#1C1F2B]">
          {/* Suggestion Chips */}
          {messagesCount < 3 && (
            <div className="flex gap-2 p-2 overflow-x-auto pb-0 border-b border-[#2A2E3F]/50">
              {quickPrompts.map((prompt) => (
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
              placeholder="Message #companion-chat"
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
  );
}
