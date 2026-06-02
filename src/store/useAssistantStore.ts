import { create } from "zustand";
import { ChatMessage } from "../types";
import { streamAssistantResponse } from "../api/clients";

export interface AssistantState {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
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
  sendMessage: async (text) => {
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

    const conversationHistory = get().messages
      .filter(m => m.id !== assistantId)
      .map(m => ({ role: m.role, content: m.content }));

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
      });

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
