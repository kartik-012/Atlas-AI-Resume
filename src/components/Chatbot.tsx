/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Compass, X, Trash2, Send, ChevronRight, Check, Copy, AlertCircle, FileText, ArrowDown, Minus, Square } from "lucide-react";
import { resumeData } from "../data/resumeData";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  confidence?: number;
  citations?: { title: string; chunkTitle: string; score: number }[];
  isStreaming?: boolean;
}

interface ChatbotProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialQuery?: string;
  clearInitialQuery?: () => void;
  onTrackAction: (event: string, meta?: any) => void;
  isDarkMode?: boolean;
}

// Custom high-fidelity inline Markdown + Syntax Highlighter component
function MarkdownContent({ content, isDarkMode = true, chatSize = "normal" }: { content: string; isDarkMode?: boolean; chatSize?: "compact" | "normal" }) {
  const [copiedBlockIdx, setCopiedBlockIdx] = useState<number | null>(null);

  const handleCopyCode = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBlockIdx(idx);
    setTimeout(() => setCopiedBlockIdx(null), 2000);
  };

  // Split content by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  const isCompact = chatSize === "compact";
  const isLarge = false;

  const textSizeClass = isCompact ? "text-xxs" : "text-xs";
  const codeTextSizeClass = isCompact ? "text-3xs" : "text-xxs";

  return (
    <div className={`space-y-1.5 ${textSizeClass} leading-relaxed font-sans select-text ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
      {parts.map((part, index) => {
        // Render Code Block
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "code";
          const codeText = match ? match[2].trim() : part.slice(3, -3).trim();

          return (
            <div key={index} className={`rounded-lg border my-2 overflow-hidden ${isDarkMode ? "bg-black border-white/10" : "bg-slate-50 border-slate-200"}`}>
              <div className={`flex items-center justify-between px-2.5 py-1 border-b text-3xs font-semibold ${isDarkMode ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
                <span className="uppercase tracking-wider">{lang || "CODE"}</span>
                <button
                  onClick={() => handleCopyCode(codeText, index)}
                  className={`flex items-center space-x-1 transition ${isDarkMode ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-800"}`}
                >
                  {copiedBlockIdx === index ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
                  <span>{copiedBlockIdx === index ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className={`p-2.5 ${codeTextSizeClass} font-mono overflow-x-auto leading-normal ${isDarkMode ? "text-indigo-300" : "text-indigo-700"}`}>
                <code>{codeText}</code>
              </pre>
            </div>
          );
        }

        // Parse tables
        if (part.includes("|") && part.split("\n").some(line => line.trim().startsWith("|"))) {
          const lines = part.split("\n").filter(line => line.trim());
          const rows = lines.map(line => line.split("|").map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1));
          
          if (rows.length >= 2) {
            const headers = rows[0];
            const bodies = rows.slice(2); // Skip separator row

            return (
              <div key={index} className={`overflow-x-auto my-2 border rounded-lg ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
                <table className={`min-w-full divide-y ${codeTextSizeClass} ${isDarkMode ? "divide-white/10 bg-black/60" : "divide-slate-200 bg-white"}`}>
                  <thead className={isDarkMode ? "bg-white/5" : "bg-slate-50"}>
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className={`px-2 py-1.5 text-left font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-white/10" : "divide-slate-200"}`}>
                    {bodies.map((row, rIdx) => (
                      <tr key={rIdx} className={isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-50"}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className={`px-2 py-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Text lines, headers, lists, bold formatting
        const lines = part.split("\n");
            return (
              <div key={index} className="space-y-1">
                {lines.map((line, lIdx) => {
                  let parsedLine = line.trim();

                  // Empty lines
                  if (!parsedLine) return <div key={lIdx} className="h-1" />;

                  // H3 Headers
                  if (parsedLine.startsWith("### ")) {
                    return (
                      <h4 key={lIdx} className={`${isCompact ? "text-xxs" : isLarge ? "text-sm" : "text-xs"} font-black uppercase tracking-wide mt-2 mb-1 text-indigo-500`}>
                        {parsedLine.slice(4)}
                      </h4>
                    );
                  }

                  // H2 Headers
                  if (parsedLine.startsWith("## ")) {
                    return (
                      <h3 key={lIdx} className={`${isCompact ? "text-xs" : isLarge ? "text-base" : "text-sm"} font-black mt-3 mb-1 text-indigo-500 border-b pb-0.5 ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
                        {parsedLine.slice(3)}
                      </h3>
                    );
                  }

                  // Lists bullet items
                  if (parsedLine.startsWith("- ") || parsedLine.startsWith("* ")) {
                    return (
                      <div key={lIdx} className="flex items-start space-x-1.5 pl-1.5">
                        <span className="text-indigo-500 mt-0.5 shrink-0 text-3xs">•</span>
                        <span className={`${textSizeClass} ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{renderInlineStyles(parsedLine.slice(2), isDarkMode, isCompact, isLarge)}</span>
                      </div>
                    );
                  }

                  // Numbered lists items
                  if (/^\d+\.\s/.test(parsedLine)) {
                    const match = parsedLine.match(/^(\d+)\.\s(.*)/);
                    return (
                      <div key={lIdx} className="flex items-start space-x-1.5 pl-1.5">
                        <span className="text-indigo-500 font-bold mt-0.5 shrink-0 text-3xs">{match?.[1]}.</span>
                        <span className={`${textSizeClass} ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{renderInlineStyles(match?.[2] || "", isDarkMode, isCompact, isLarge)}</span>
                      </div>
                    );
                  }

                  // Normal styled line
                  return (
                    <p key={lIdx} className={`${textSizeClass} text-justify leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      {renderInlineStyles(line, isDarkMode, isCompact, isLarge)}
                    </p>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    }

    // Inline format renderer helper (bold, links, code snippets)
    function renderInlineStyles(text: string, isDarkMode: boolean, isCompact: boolean, isLarge: boolean) {
      // Regex mapping for markdown formats
      const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
      return parts.map((part, idx) => {
        // Bold matches
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={idx} className={`font-extrabold ${isCompact ? "text-xxs" : isLarge ? "text-sm" : "text-xs"} ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        // Code ticks matches
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={idx} className={`font-mono ${isCompact ? "text-3xs" : isLarge ? "text-xs" : "text-xxs"} px-1.5 py-0.5 rounded border ${isDarkMode ? "bg-slate-900 text-indigo-400 border-white/5" : "bg-slate-100 text-indigo-700 border-slate-200"}`}>
              {part.slice(1, -1)}
            </code>
          );
        }
        // Links matches
        if (part.startsWith("[") && part.includes("](")) {
          const match = part.match(/\[(.*?)\]\((.*?)\)/);
          if (match) {
            return (
              <a
                key={idx}
                href={match[2]}
                target="_blank"
                rel="noreferrer"
                className={`font-semibold hover:underline ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
              >
                {match[1]}
              </a>
            );
          }
        }
        return part;
      });
    }

const sizeClasses = {
  compact: {
    window: "h-[480px] sm:h-[540px] w-[88vw] sm:w-[350px] text-xxs rounded-xl",
    container: "px-3 py-3 space-y-3",
    bubble: "rounded-lg px-3 py-2 shadow-sm text-xxs",
    bubblePl: "pl-4.5",
    inputBox: "p-3",
    inputWrapper: "p-1 rounded-lg",
    inputArea: "py-1 pl-2 pr-8 text-xxs max-h-20",
    sendBtn: "right-2 h-6.5 w-6.5 rounded-md",
    sendIcon: "h-3 w-3",
    suggestedBox: "px-3 py-1.5 gap-1 max-h-24",
    suggestedBtn: "text-3xs px-2 py-1 rounded-md",
    infoText: "text-[9px] mt-1.5",
    avatarClass: "h-7.5 w-7.5 rounded-lg",
    avatarIconClass: "h-3.5 w-3.5",
    headerPad: "px-3 py-2",
    headerTitle: "text-[11px]",
    headerStatus: "text-[8px]",
    headerSub: "text-[9px]",
  },
  normal: {
    window: "h-[560px] sm:h-[620px] w-[90vw] sm:w-[385px] text-xs rounded-2xl",
    container: "px-4 py-4 space-y-4",
    bubble: "rounded-xl px-3.5 py-2.5 shadow-sm text-xs",
    bubblePl: "pl-5.5",
    inputBox: "p-4",
    inputWrapper: "p-1.5 rounded-xl",
    inputArea: "py-1.5 pl-2.5 pr-10 text-xs max-h-24",
    sendBtn: "right-2.5 h-7.5 w-7.5 rounded-lg",
    sendIcon: "h-3.5 w-3.5",
    suggestedBox: "px-4 py-2 gap-1.5 max-h-32",
    suggestedBtn: "text-xxs px-2.5 py-1.5 rounded-lg",
    infoText: "text-[10px] mt-2",
    avatarClass: "h-9 w-9 rounded-xl",
    avatarIconClass: "h-4.5 w-4.5",
    headerPad: "px-4 py-3",
    headerTitle: "text-xs",
    headerStatus: "text-4xs",
    headerSub: "text-xxs",
  },
};

export default function Chatbot({
  isOpen,
  setIsOpen,
  initialQuery,
  clearInitialQuery,
  onTrackAction,
  isDarkMode = true
}: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello 👋\n\nI'm **Atlas AI**.\n\nI've been trained on Kartik's resume, projects, technical skills, certifications, achievements and portfolio documents.\n\nAsk me anything about him, or trigger the micro-indexing card elements below!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [inputQuery, setInputQuery] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showScrollDown, setShowScrollDown] = useState<boolean>(false);
  const [chatSize, setChatSize] = useState<"compact" | "normal">("normal");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "Who is Kartik?",
    "Explain his projects",
    "Why hire Kartik?",
    "What is his tech stack?"
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto Scroll handling
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle external launch triggers
  useEffect(() => {
    if (isOpen && initialQuery) {
      handleSendMessage(initialQuery);
      if (clearInitialQuery) clearInitialQuery();
    }
  }, [isOpen, initialQuery]);

  // Floating window slide-in timer (800ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Auto open after 800ms if not explicitly closed or opened
      if (!isOpen && messages.length === 1) {
        setIsOpen(true);
        onTrackAction("chatbot_auto_open");
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Monitor scroll height
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 120);
  };

  // Submit messages
  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setInputQuery("");
    setIsTyping(true);
    onTrackAction("question", { query: trimmed });

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. User Message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp
    };

    setMessages(prev => [...prev, userMsg]);

    // Create a temporary message placeholder for the streaming answer
    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp,
      isStreaming: true,
      confidence: 0,
      citations: []
    };

    setMessages(prev => [...prev, initialAssistantMsg]);

    try {
      // Build previous context history
      const history = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      // Hit our Express full-stack streaming endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, messages: history })
      });

      if (!response.ok) {
        throw new Error("HTTP connection failed");
      }

      if (!response.body) {
        throw new Error("No readable body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aggregatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        // SSE messages look like: "data: {...}\n\n"
        const lines = chunkText.split("\n").filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.chunk) {
                aggregatedText += data.chunk;
                // Update streaming message content in real-time
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: aggregatedText }
                      : m
                  )
                );
              }

              if (data.done) {
                // Final stream configurations
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          isStreaming: false,
                          confidence: data.confidence,
                          citations: data.citations
                        }
                      : m
                  )
                );

                // Update follow-up suggested questions dynamically based on queries
                updateSuggestions(trimmed);
              }
            } catch (err) {
              console.warn("Failed to parse stream JSON line", line, err);
            }
          }
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch stream details from server", e);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `*(A communication error occurred with the Atlas AI server. Verify that the server is online or check your connection).*`,
                isStreaming: false
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  // Logic to dynamically generate suggested follow-up questions
  const updateSuggestions = (query: string) => {
    const qLower = query.toLowerCase();
    if (qLower.includes("project") || qLower.includes("debate") || qLower.includes("numpygpt")) {
      setSuggestedQuestions([
        "Explain his RAG Hallucination auditor",
        "Why hire Kartik?",
        "What are his certifications?",
        "What databases does he use?"
      ]);
    } else if (qLower.includes("hire") || qLower.includes("why")) {
      setSuggestedQuestions([
        "Show his projects list",
        "What coding profiles does he have?",
        "What is his backend experience?",
        "How can I contact him?"
      ]);
    } else if (qLower.includes("skill") || qLower.includes("tech") || qLower.includes("languages")) {
      setSuggestedQuestions([
        "Explain NumPyGPT project",
        "Explain Misinformation Family Tree project",
        "Tell me about his education",
        "Why hire Kartik?"
      ]);
    } else {
      setSuggestedQuestions([
        "Explain his projects",
        "Why hire Kartik?",
        "What are his achievements?",
        "How to contact him?"
      ]);
    }
  };

  // Clear chat session
  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Session cleared. What else would you like to know about Kartik's portfolios or experience?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setSuggestedQuestions([
      "Who is Kartik?",
      "Explain his projects",
      "Why hire Kartik?",
      "What is his tech stack?"
    ]);
    onTrackAction("clear_chat");
  };

  return (
    <>
      {/* 1. MINIMIZED FLOATING ACTION BUTTON */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            onTrackAction("chatbot_open");
          }}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1B6B93] to-[#4FC0D0] shadow-xl shadow-[#1B6B93]/30 hover:scale-110 active:scale-95 transition-all duration-300 animate-pulse group border border-white/10"
          id="chatbot-trigger"
        >
          <div className="absolute inset-0 rounded-full bg-[#1B6B93]/10 animate-ping group-hover:duration-1000" />
          <MessageSquare className="h-6 w-6 text-white group-hover:rotate-6 transition-transform" />
          <div className="absolute -top-1.5 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border border-slate-900 shadow">
            <Compass className="h-2.5 w-2.5 text-white animate-spin" />
          </div>
        </button>
      )}

      {/* 2. CHATBOT EXPANDED WINDOW */}
      {isOpen && (() => {
        const s = sizeClasses[chatSize];
        return (
          <div
            className={`fixed bottom-5 right-5 z-50 flex flex-col border shadow-2xl overflow-hidden transition-all duration-300 backdrop-blur-xl animate-in fade-in-50 slide-in-from-bottom-12 ${s.window} ${
              isDarkMode 
                ? "bg-[#0D0D11]/90 border-white/10 text-white" 
                : "bg-white/95 border-slate-200 text-slate-900 shadow-2xl"
            }`}
            id="chatbot-window"
          >
            <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #1B6B93 0%, #4FC0D0 35%, #A2D2DF 65%, #1B6B93 100%)' }} />

            {/* Chat Panel Header */}
            <div className={`flex items-center justify-between border-b select-none ${s.headerPad} ${
              isDarkMode 
                ? "bg-gradient-to-r from-[#1B6B93]/10 to-transparent border-white/10" 
                : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`relative flex items-center justify-center bg-gradient-to-br from-[#1B6B93] to-[#4FC0D0] shrink-0 ${s.avatarClass}`}>
                  <Compass className={`${s.avatarIconClass} text-white`} />
                  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border-2 border-[#0D0D11]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className={`font-bold truncate ${s.headerTitle} ${isDarkMode ? "text-white" : "text-slate-900"}`}>Atlas AI</span>
                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className={`font-bold text-emerald-400 tracking-wider uppercase ${s.headerStatus}`}>Online</span>
                  </div>
                  <p className={`font-semibold leading-none mt-0.5 truncate ${s.headerSub} ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    Ask about Kartik's resume
                  </p>
                </div>
              </div>

              {/* Header Tools */}
              <div className="flex items-center space-x-0.5">
                {/* Size Toggle */}
                <div className={`flex items-center rounded-lg border mr-1 ${isDarkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-100"}`}>
                  {([
                    { key: "compact" as const, icon: Minus, title: "Compact" },
                    { key: "normal" as const, icon: Square, title: "Normal" },
                  ]).map(({ key, icon: SizeIcon, title }) => (
                    <button
                      key={key}
                      onClick={() => setChatSize(key)}
                      className={`p-1 rounded-md transition ${
                        chatSize === key
                          ? isDarkMode
                            ? "bg-[#1B6B93]/30 text-[#4FC0D0]"
                            : "bg-white text-[#1B6B93] shadow-sm"
                          : isDarkMode
                            ? "text-slate-500 hover:text-slate-300"
                            : "text-slate-400 hover:text-slate-600"
                      }`}
                      title={title}
                    >
                      <SizeIcon className="h-3 w-3" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleClearChat}
                  className={`p-1.5 rounded-lg transition ${
                    isDarkMode 
                      ? "text-slate-400 hover:bg-white/5 hover:text-red-400" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-red-600"
                  }`}
                  title="Clear Chat Session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-lg transition ${
                    isDarkMode 
                      ? "text-slate-400 hover:bg-white/5 hover:text-white" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                  title="Close Assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Conversation list area */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className={`flex-1 overflow-y-auto custom-scrollbar ${s.container} ${
                isDarkMode ? "bg-slate-950/20" : "bg-slate-50/50"
              }`}
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[88%] ${
                    m.role === "user" ? "ml-auto items-end" : "mr-auto items-start animate-in fade-in-30"
                  }`}
                >
                  {/* Bubble content */}
                  <div
                    className={`border relative overflow-hidden ${s.bubble} ${
                      m.role === "user"
                        ? isDarkMode
                          ? "bg-indigo-600/20 border-indigo-500/30 text-white rounded-tr-none"
                          : "bg-indigo-50 border-indigo-100 text-indigo-950 rounded-tr-none"
                        : isDarkMode
                          ? `bg-white/5 border-white/10 text-slate-200 rounded-tl-none ${s.bubblePl}`
                          : `bg-white border border-slate-200/85 text-slate-800 rounded-tl-none shadow-sm ${s.bubblePl}`
                    }`}
                  >
                    {m.role === "assistant" && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    )}
                    {m.role === "assistant" ? (
                      <MarkdownContent content={m.content} isDarkMode={isDarkMode} chatSize={chatSize} />
                    ) : (
                      <p className="whitespace-pre-wrap select-text">{m.content}</p>
                    )}
                  </div>

                  {/* Sub-label Metadata */}
                  <div className={`flex items-center space-x-2 mt-1 px-1 text-3xs font-semibold select-none ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}>
                    <span>{m.timestamp}</span>
                    {m.role === "assistant" && m.confidence && m.confidence > 0 && (
                      <>
                        <span>•</span>
                        <span className={`px-1 rounded border ${
                          isDarkMode 
                            ? "text-indigo-400/95 bg-indigo-500/5 border-indigo-500/15" 
                            : "text-indigo-600 bg-indigo-50/50 border-indigo-100"
                        }`}>
                          Relevance: {m.confidence}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Citations Footer */}
                  {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 px-1">
                      {m.citations.map((cit, cIdx) => (
                        <span
                          key={cIdx}
                          className={`flex items-center space-x-1 rounded px-1.5 py-0.5 text-4xs font-semibold border transition ${
                            isDarkMode 
                              ? "bg-white/5 text-slate-400 border-white/5 hover:text-white" 
                              : "bg-slate-100 text-slate-600 border-slate-200/60 hover:text-slate-800 hover:bg-slate-200/50"
                          }`}
                          title={`Chunk match: ${cit.chunkTitle} (Overlap: ${cit.score}%)`}
                        >
                          <FileText className="h-2.5 w-2.5 text-indigo-400" />
                          <span>{cit.title}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking Indicator */}
              {isTyping && (
                <div className="flex flex-col mr-auto items-start max-w-[80%] pl-1">
                  <div className={`relative overflow-hidden border ${s.bubble} ${
                    isDarkMode 
                      ? `bg-white/5 border border-white/10 text-slate-300 ${s.bubblePl}` 
                      : `bg-white border border-slate-200/85 text-slate-700 shadow-sm ${s.bubblePl}`
                  }`}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <div className="flex items-center space-x-1.5 py-1 px-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                  <span className={`text-4xs font-bold uppercase tracking-widest mt-1 ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}>
                    thinking...
                  </span>
                </div>
              )}
            </div>

            {/* Scroll Down Floating Indicator */}
            {showScrollDown && (
              <button
                onClick={scrollToBottom}
                className={`absolute rounded-full p-2 transition shadow-lg animate-bounce border ${
                  chatSize === "compact" ? "bottom-24 right-3" : chatSize === "large" ? "bottom-36 right-5" : "bottom-28 right-4"
                } ${
                  isDarkMode 
                    ? "bg-black border-white/10 text-slate-400 hover:text-white" 
                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
                }`}
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            )}

            {/* Quick Questions and Suggested Footer */}
            <div className={`border-t flex flex-wrap select-none shrink-0 overflow-y-auto custom-scrollbar ${s.suggestedBox} ${
              isDarkMode ? "border-white/5 bg-black/40" : "border-slate-150 bg-slate-50/80"
            }`}>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={isTyping}
                  className={`font-semibold border transition text-left leading-tight truncate max-w-full disabled:opacity-40 ${s.suggestedBtn} ${
                    isDarkMode 
                      ? "border-white/10 hover:border-indigo-500/40 bg-white/5 hover:bg-indigo-600/20 text-slate-400 hover:text-white" 
                      : "border-slate-200 hover:border-indigo-400/50 bg-white hover:bg-indigo-50/50 text-slate-600 hover:text-indigo-900"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input control box */}
            <div className={`border-t shrink-0 ${s.inputBox} ${
              isDarkMode ? "border-white/10 bg-black/40 backdrop-blur-md" : "border-slate-200 bg-white/80 backdrop-blur-md"
            }`}>
              <div className={`relative flex items-center border focus-within:ring-1 focus-within:ring-indigo-500 shadow-inner group ${s.inputWrapper} ${
                isDarkMode ? "bg-[#16161D] border-white/10" : "bg-slate-50 border-slate-200"
              }`}>
                <textarea
                  rows={1}
                  placeholder="Ask anything about Kartik..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputQuery);
                    }
                  }}
                  className={`flex-1 bg-transparent border-0 outline-none focus:ring-0 resize-none custom-scrollbar ${s.inputArea} ${
                    isDarkMode ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"
                  }`}
                />
                <button
                  onClick={() => handleSendMessage(inputQuery)}
                  disabled={!inputQuery.trim() || isTyping}
                  className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-500 transition shadow hover:scale-105 active:scale-95 ${s.sendBtn}`}
                >
                  <Send className={s.sendIcon} />
                </button>
              </div>
              <div className={`flex items-center justify-between select-none ${s.infoText}`}>
                <p className={`font-semibold tracking-wide ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}>
                  Enter to send • Shift+Enter for newline
                </p>
                <span className={`flex items-center space-x-1 font-mono font-bold tracking-wider ${
                  isDarkMode ? "text-slate-600" : "text-slate-400"
                }`}>
                  <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Gemini</span>
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
