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
    <div className="bg-bg-panel px-4 pb-5 pt-2">
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative rounded-lg bg-bg-card">
          {/* Suggestion Chips */}
          {messagesCount < 3 && (
            <div className="flex gap-2 p-2 overflow-x-auto pb-0 border-b border-border/50">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium text-accent-primary hover:bg-accent-primary/10 hover:underline transition-colors"
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
              className="min-h-11 max-h-35 flex-1 resize-none bg-transparent px-4 py-3 text-[0.93rem] text-text-primary placeholder:text-text-muted outline-none"
              rows={1}
            />

            {input.trim() && (
              <button
                type="button"
                onClick={() => {
                  void handleSend();
                }}
                disabled={isLoading || bootstrapping}
                className="mr-2 mb-2 p-2 text-accent-primary hover:text-white hover:bg-accent-primary rounded transition-all"
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
