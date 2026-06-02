import { useState, useRef, useEffect } from "react";
import { MessageSquareText, Send, Trash, Sparkles, Brain, Check, RefreshCw, X } from "lucide-react";
import { useAssistantStore } from "../../store";

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const { messages, isStreaming, sendMessage, clearChat } = useAssistantStore();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isStreaming) return;

    const query = inputText.trim();
    setInputText("");
    await sendMessage(query);
  };

  const handleSuggestionClick = async (promptText: string) => {
    if (isStreaming) return;
    await sendMessage(promptText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#0c0c11] border-l border-border/50 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
      
      {/* Header info */}
      <div className="p-4 border-b border-border/40 bg-[#0f0f14] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <Brain className="size-4.5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">InvestIQ AI Co-pilot</h3>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="size-3" /> Live streaming
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={clearChat}
            className="p-1.5 hover:bg-[#161622] rounded text-muted-foreground hover:text-red-400 transition-colors"
            title="Clear Chat Logs"
          >
            <Trash className="size-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#161622] rounded text-muted-foreground hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Suggestion Prompt Cards (Shown when chat is thin) */}
      {messages.length <= 1 && (
        <div className="p-4 bg-[#16161e]/40 border-b border-border/20 space-y-2 shrink-0">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Quick Suggestions:</span>
          <div className="grid grid-cols-1 gap-1.5">
            <button 
              onClick={() => handleSuggestionClick("Review my portfolio risk allocation and health score")}
              className="text-left p-2 rounded-lg bg-[#16161e] border border-border/30 hover:border-emerald-500/35 text-[11px] text-white transition-all hover:bg-[#20202b]"
            >
              📊 Review my portfolio risk allocation
            </button>
            <button 
              onClick={() => handleSuggestionClick("Suggest a profitable backtesting strategy for Bitcoin")}
              className="text-left p-2 rounded-lg bg-[#16161e] border border-border/30 hover:border-emerald-500/35 text-[11px] text-white transition-all hover:bg-[#20202b]"
            >
              ⚙️ Suggest a backtesting strategy
            </button>
            <button 
              onClick={() => handleSuggestionClick("Summarize the latest market news and index trends")}
              className="text-left p-2 rounded-lg bg-[#16161e] border border-border/30 hover:border-emerald-500/35 text-[11px] text-white transition-all hover:bg-[#20202b]"
            >
              📰 Summarize recent market news
            </button>
          </div>
        </div>
      )}

      {/* Messages Logs Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0a0a0f] scrollbar-thin">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                isUser 
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" 
                  : "bg-[#111116] border border-border/40 text-muted-foreground"
              }`}>
                <span className="text-[9px] font-bold block mb-1 uppercase tracking-wider text-muted-foreground/60">
                  {isUser ? "You" : "InvestIQ AI"} • {m.timestamp}
                </span>
                <p className="whitespace-pre-line text-white font-medium">{m.content}</p>
                
                {m.isStreaming && (
                  <span className="inline-flex gap-1.5 items-center mt-2 text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                    <RefreshCw className="size-2.5 animate-spin" /> Stream compiling...
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Text Form Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border/45 bg-[#0f0f14] flex gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AI co-pilot about allocations, signals..."
          className="flex-1 h-9 px-3 bg-[#16161e] border border-border/45 rounded-lg text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={isStreaming || !inputText.trim()}
          className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors"
        >
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  );
}
