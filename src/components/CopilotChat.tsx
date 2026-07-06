import { useState, useRef, useEffect } from "react";
import { ArrowUp, Bot, Loader2, RefreshCw, Send, Sparkles, User, AlertCircle } from "lucide-react";
import { ChatMessage, District, Incident } from "../types";

interface CopilotChatProps {
  districts: District[];
  incidents: Incident[];
}

export default function CopilotChat({ districts, incidents }: CopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "model",
      text: "Hello Operator. I am your Smart City AI Copilot (UrbanMind OS). I have direct read access to Metropolis Prime's real-time traffic and AQI sensors. How can I help you analyze, plan, or dispatch operations today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickStartPrompts = [
    "Draft a full smart city executive report.",
    "Explain traffic bottlenecks and active accidents.",
    "Why is AQI rising in the Industrial District?",
    "Suggest routing solutions for Downtown."
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      // Map current messages to history format
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          chatHistory
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to contact Gemini Core.");
      }

      const data = await res.json();

      const copilotMsg: ChatMessage = {
        id: `copilot-${Date.now()}`,
        role: "model",
        text: data.reply,
        timestamp: new Date().toISOString(),
        sources: data.sources
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPromptClick = (prompt: string) => {
    if (isTyping) return;
    handleSendMessage(prompt);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl flex flex-col h-[550px] shadow-xl overflow-hidden backdrop-blur-sm hover:border-slate-700/50 transition-all duration-300">
      {/* Chat Header */}
      <div className="bg-slate-900/60 border-b border-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              Gemini AI Copilot
              <span className="flex items-center gap-0.5 text-[9px] bg-sky-500/10 text-sky-400 border border-sky-400/20 px-1 py-0.5 rounded uppercase font-semibold">
                <Sparkles className="h-2 w-2" /> Connected
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Ask about sensor metrics, reports, or emergency response
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setMessages([
              {
                id: "msg-welcome",
                role: "model",
                text: "Session re-initialized. Ready to process telemetry queries.",
                timestamp: new Date().toISOString()
              }
            ]);
            setError(null);
          }}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Reset Session"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
              {/* Bot Avatar */}
              {!isUser && (
                <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs ${
                  isUser
                    ? "bg-slate-900 border border-slate-800 text-slate-100"
                    : "bg-slate-950 border border-slate-900/60 text-slate-200"
                }`}
              >
                {/* Text Body */}
                <div className="prose prose-invert max-w-none font-sans leading-relaxed whitespace-pre-wrap">
                  {m.text}
                </div>

                {/* Grounded Sources */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                    <span className="font-bold text-slate-400">Search References:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {m.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 hover:border-sky-500/30 px-2 py-0.5 rounded transition-all truncate max-w-[150px]"
                        >
                          {s.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[9px] text-slate-600 font-mono text-right mt-1.5">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 text-sky-400 animate-spin" />
              <span className="font-mono text-[11px] text-slate-500">Copilot analyzing telemetry...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-start gap-2 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Execution Interrupted</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-slate-900/60 bg-slate-950 flex gap-2 overflow-x-auto scrollbar-none shrink-0 select-none">
        {quickStartPrompts.map((p, idx) => (
          <button
            key={idx}
            disabled={isTyping}
            onClick={() => handleQuickPromptClick(p)}
            className="shrink-0 text-[10px] font-mono border border-slate-900 hover:border-sky-500/30 bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-sky-400 rounded-full px-3 py-1 transition-all disabled:opacity-50 disabled:hover:bg-slate-900/40 disabled:hover:text-slate-400"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Container */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="p-3 bg-slate-900/40 border-t border-slate-900 flex gap-2 shrink-0"
      >
        <input
          type="text"
          disabled={isTyping}
          placeholder="Query city database, request solutions, or type message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-900 focus:border-sky-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isTyping || !input.trim()}
          className="bg-sky-600 hover:bg-sky-500 text-slate-100 border border-sky-500 shadow-md shadow-sky-950/20 px-3 py-2 rounded-lg font-mono font-bold flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
