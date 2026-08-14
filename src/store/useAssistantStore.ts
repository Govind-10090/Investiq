import { create } from "zustand";
import { ChatMessage } from "../types";
import { streamAssistantResponse } from "../api/clients";
import { PortfolioHolding, Asset } from "../types";

export interface AssistantContext {
  holdings: PortfolioHolding[];
  assets: Asset[];
}

export interface AssistantState {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string, context?: AssistantContext) => Promise<void>;
  clearChat: () => void;
}

function buildSystemPrompt(context?: AssistantContext): string {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  let prompt = `You are InvestIQ AI, an expert Indian financial co-pilot embedded in the InvestIQ investment analytics platform. 
You help users with portfolio analysis, stock/crypto/forex market insights, backtesting strategies, and financial planning advice for the Indian market (NSE/BSE, NIFTY, SENSEX, crypto in USD, and INR forex pairs).
Current Date & Time (IST): ${now}
Always be concise, data-driven, and use Indian financial context (₹ for INR, Cr for crores, L for lakhs). Format responses with markdown — use **bold** for key metrics, bullet lists for multi-point answers, and numbered lists for steps.`;

  if (context && context.holdings.length > 0) {
    const totalValue = context.holdings.reduce((s, h) => s + h.value, 0);
    const totalPnl = context.holdings.reduce((s, h) => s + ((h.currentPrice - h.avgPrice) * h.shares), 0);
    const pnlPct = totalValue > 0 ? ((totalPnl / (totalValue - totalPnl)) * 100).toFixed(2) : "0.00";

    const holdingLines = context.holdings.map(h => {
      const pnl = ((h.currentPrice - h.avgPrice) * h.shares);
      const pnlP = h.avgPrice > 0 ? (((h.currentPrice - h.avgPrice) / h.avgPrice) * 100).toFixed(2) : "0.00";
      return `  • ${h.symbol} (${h.name}) — ${h.shares} shares @ avg ₹${h.avgPrice.toFixed(2)}, current ₹${h.currentPrice.toFixed(2)}, value ₹${h.value.toLocaleString("en-IN")}, P&L: ${pnl >= 0 ? "+" : ""}₹${pnl.toFixed(2)} (${pnlP}%)`;
    }).join("\n");

    prompt += `\n\n## User's Live Portfolio (${context.holdings.length} holdings):
Total Value: ₹${totalValue.toLocaleString("en-IN")}  |  Total P&L: ${totalPnl >= 0 ? "+" : ""}₹${totalPnl.toFixed(2)} (${pnlPct}%)
${holdingLines}`;
  } else if (context) {
    prompt += `\n\nThe user has no holdings in their portfolio yet.`;
  }

  if (context && context.assets.length > 0) {
    const topAssets = context.assets.slice(0, 12);
    const assetLines = topAssets.map(a =>
      `  • ${a.symbol} (${a.type}): ₹${a.price.toLocaleString("en-IN")} | ${a.change >= 0 ? "+" : ""}${a.change.toFixed(2)}%`
    ).join("\n");
    prompt += `\n\n## Live Market Snapshot (top assets):
${assetLines}`;
  }

  prompt += `\n\nAlways use the portfolio and market data above when answering questions about the user's specific holdings or current prices. If data is not available, say so clearly.`;
  return prompt;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am InvestIQ AI, your intelligent financial co-pilot. I can evaluate your portfolio allocations, analyze stocks/crypto indicators, generate strategies, or summarize market news. What would you like to review today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ],
  isStreaming: false,
  sendMessage: async (text, context) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const assistantId = `msg-assistant-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    };

    set({ 
      messages: [...get().messages, userMsg, initialAssistantMsg],
      isStreaming: true
    });

    // Build conversation history — prepend system prompt as a system message
    const systemPrompt = buildSystemPrompt(context);
    const conversationHistory = [
      { role: "system", content: systemPrompt },
      ...get().messages
        .filter(m => m.id !== assistantId && m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: text }
    ];

    try {
      await streamAssistantResponse(conversationHistory, (chunk) => {
        set((state) => ({
          messages: state.messages.map(m => {
            if (m.id === assistantId) {
              return { ...m, content: m.content + chunk };
            }
            return m;
          })
        }));
      }, context);

      set((state) => ({
        isStreaming: false,
        messages: state.messages.map(m => {
          if (m.id === assistantId) {
            return { ...m, isStreaming: false };
          }
          return m;
        })
      }));
    } catch (e) {
      set((state) => ({
        isStreaming: false,
        messages: state.messages.map(m => {
          if (m.id === assistantId) {
            return { 
              ...m, 
              content: "I ran into an issue connecting to the AI models. Please ensure your VITE_OPENAI_API_KEY is configured correctly.", 
              isStreaming: false 
            };
          }
          return m;
        })
      }));
    }
  },
  clearChat: () => set({
    messages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared! How can I assist you with your investments?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  })
}));
