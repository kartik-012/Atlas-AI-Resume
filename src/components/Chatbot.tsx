/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, Compass, X, Trash2, Send, Check, Copy, 
  FileText, ArrowDown, ArrowUp, Volume2, VolumeX, 
  Maximize2, Minimize2, Minus, Sparkles, User, Bot, ExternalLink
} from "lucide-react";

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
  isEmbedded?: boolean;
}

// Markdown formatting helper with high readability and syntax styling
function MarkdownContent({ 
  content, 
  isDarkMode = true, 
  chatSize = "normal" 
}: { 
  content: string; 
  isDarkMode?: boolean; 
  chatSize?: "compact" | "normal" | "wide";
}) {
  const [copiedBlockIdx, setCopiedBlockIdx] = useState<number | null>(null);

  const handleCopyCode = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBlockIdx(idx);
    setTimeout(() => setCopiedBlockIdx(null), 2000);
  };

  const isCompact = chatSize === "compact";
  const isWide = chatSize === "wide";

  const textSizeClass = isCompact ? "text-[12px]" : isWide ? "text-[13.5px]" : "text-[13px]";
  const codeTextSizeClass = isCompact ? "text-[11px]" : "text-[12px]";

  // Split content by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-2 ${textSizeClass} leading-[1.7] font-sans select-text ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
      {parts.map((part, index) => {
        // Render Code Block
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "code";
          const codeText = match ? match[2].trim() : part.slice(3, -3).trim();

          return (
            <div 
              key={index} 
              className={`rounded-xl border my-2.5 overflow-hidden shadow-md ${
                isDarkMode ? "bg-[#090D16] border-cyan-500/20" : "bg-slate-900 text-slate-100 border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 text-[11px] font-mono font-semibold bg-white/5 text-slate-400">
                <span className="uppercase tracking-wider text-cyan-400">{lang || "CODE"}</span>
                <button
                  onClick={() => handleCopyCode(codeText, index)}
                  className="flex items-center space-x-1 text-slate-400 hover:text-white transition px-2 py-0.5 rounded hover:bg-white/10"
                >
                  {copiedBlockIdx === index ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedBlockIdx === index ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className={`p-3 ${codeTextSizeClass} font-mono overflow-x-auto leading-relaxed text-cyan-300`}>
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
            const bodies = rows.slice(2);

            return (
              <div key={index} className={`overflow-x-auto my-2.5 border rounded-xl shadow-sm ${isDarkMode ? "border-cyan-500/20 bg-slate-950/60" : "border-slate-200 bg-white"}`}>
                <table className={`min-w-full divide-y ${codeTextSizeClass} ${isDarkMode ? "divide-white/10" : "divide-slate-200"}`}>
                  <thead className={isDarkMode ? "bg-cyan-950/30" : "bg-slate-50"}>
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className={`px-3 py-2 text-left font-bold uppercase tracking-wider text-[11px] ${isDarkMode ? "text-cyan-300" : "text-slate-700"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-white/5" : "divide-slate-100"}`}>
                    {bodies.map((row, rIdx) => (
                      <tr key={rIdx} className={isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-50/80"}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className={`px-3 py-2 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
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
          <div key={index} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const parsedLine = line.trim();

              // Empty lines
              if (!parsedLine) return <div key={lIdx} className="h-1" />;

              // H3 Headers
              if (parsedLine.startsWith("### ")) {
                return (
                  <h4 
                    key={lIdx} 
                    className={`${isCompact ? "text-[12.5px]" : "text-[14px]"} font-bold tracking-tight mt-3 mb-1.5 text-[#4FC0D0] flex items-center gap-1.5`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#4FC0D0] shrink-0" />
                    <span>{parsedLine.slice(4)}</span>
                  </h4>
                );
              }

              // H2 Headers
              if (parsedLine.startsWith("## ")) {
                return (
                  <h3 
                    key={lIdx} 
                    className={`${isCompact ? "text-[13.5px]" : "text-[15px]"} font-bold mt-3.5 mb-2 text-[#4FC0D0] border-b pb-1 ${isDarkMode ? "border-cyan-500/20" : "border-slate-200"}`}
                  >
                    {parsedLine.slice(3)}
                  </h3>
                );
              }

              // Lists bullet items (• or - or *)
              if (parsedLine.startsWith("- ") || parsedLine.startsWith("* ") || parsedLine.startsWith("• ")) {
                const bulletContent = parsedLine.startsWith("• ") ? parsedLine.slice(2) : parsedLine.slice(2);
                return (
                  <div key={lIdx} className="flex items-start space-x-2 pl-1 my-0.5">
                    <span className="text-[#4FC0D0] font-bold text-[14px] leading-tight shrink-0">•</span>
                    <span className={`${textSizeClass} ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                      {renderInlineStyles(bulletContent, isDarkMode, isCompact, isWide)}
                    </span>
                  </div>
                );
              }

              // Numbered lists items
              if (/^\d+\.\s/.test(parsedLine)) {
                const match = parsedLine.match(/^(\d+)\.\s(.*)/);
                return (
                  <div key={lIdx} className="flex items-start space-x-2 pl-1 my-1">
                    <span className="text-[#4FC0D0] font-bold font-mono text-[12px] bg-cyan-950/40 border border-cyan-500/30 rounded px-1.5 py-0.2 shrink-0 mt-0.5">
                      {match?.[1]}
                    </span>
                    <span className={`${textSizeClass} ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                      {renderInlineStyles(match?.[2] || "", isDarkMode, isCompact, isWide)}
                    </span>
                  </div>
                );
              }

              // Normal styled line
              return (
                <p key={lIdx} className={`${textSizeClass} leading-[1.7] ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                  {renderInlineStyles(line, isDarkMode, isCompact, isWide)}
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
function renderInlineStyles(text: string, isDarkMode: boolean, isCompact: boolean, isWide: boolean) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
  return parts.map((part, idx) => {
    // Bold matches
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Code ticks matches
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code 
          key={idx} 
          className={`font-mono text-[11.5px] px-1.5 py-0.5 rounded border ${
            isDarkMode 
              ? "bg-[#090D16] text-[#4FC0D0] border-cyan-500/30" 
              : "bg-slate-100 text-[#1B6B93] border-slate-200 font-semibold"
          }`}
        >
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
            className={`inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 transition ${
              isDarkMode ? "text-[#4FC0D0] hover:text-cyan-300" : "text-[#1B6B93] hover:text-cyan-700"
            }`}
          >
            <span>{match[1]}</span>
            <ExternalLink className="h-2.5 w-2.5 inline" />
          </a>
        );
      }
    }
    return part;
  });
}

// Window sizing maps
const sizeClasses = {
  compact: {
    window: "h-[490px] w-[90vw] sm:w-[350px] rounded-2xl",
    container: "p-3 space-y-3",
    bubble: "rounded-2xl px-3 py-2 text-[12px]",
    inputBox: "p-2.5",
    inputArea: "py-1.5 pl-3 pr-9 text-[12px] min-h-[38px] max-h-24",
    suggestedBox: "px-3 py-2 gap-1.5 max-h-24",
    suggestedBtn: "text-[11px] px-2.5 py-1 rounded-lg",
  },
  normal: {
    window: "h-[560px] sm:h-[590px] w-[92vw] sm:w-[385px] rounded-2xl",
    container: "p-3.5 space-y-3.5",
    bubble: "rounded-2xl px-3.5 py-2.5 text-[12.5px]",
    inputBox: "p-3",
    inputArea: "py-2 pl-3.5 pr-10 text-[12.5px] min-h-[42px] max-h-28",
    suggestedBox: "px-3.5 py-2 gap-1.5 max-h-28",
    suggestedBtn: "text-[11px] px-2.5 py-1 rounded-xl",
  },
  wide: {
    window: "h-[600px] sm:h-[630px] w-[94vw] sm:w-[430px] rounded-2xl",
    container: "p-4 space-y-4",
    bubble: "rounded-2xl px-4 py-3 text-[13px]",
    inputBox: "p-3.5",
    inputArea: "py-2 pl-3.5 pr-11 text-[13px] min-h-[44px] max-h-32",
    suggestedBox: "px-4 py-2.5 gap-1.5 max-h-32",
    suggestedBtn: "text-[11.5px] px-3 py-1.5 rounded-xl",
  }
};

const WELCOME_MESSAGE_CONTENT = `👋 Hello! I'm Atlas AI.

I'm a Retrieval-Augmented Generation (RAG) powered AI assistant trained on Kartik Raikar's verified resume, AI projects, certifications, portfolio, and technical experience.

I can instantly answer recruiter questions using grounded information instead of generic AI responses.

Feel free to ask about:

• AI Engineering experience
• Projects & architecture
• Technical skills
• Certifications
• Internship readiness
• Interview questions
• Career achievements

How can I help you today?`;

const RECRUITER_SUGGESTED_PROMPTS = [
  "💼 Why should I hire Kartik?",
  "🚀 Tell me about AtlasOS.",
  "🤖 Explain all AI projects.",
  "📜 Show all certifications.",
  "🧠 What LLM technologies has he worked with?",
  "💻 What programming languages and frameworks does he know?",
  "🎯 Ask Kartik an interview question.",
  "📄 Summarize Kartik's resume.",
  "☁️ Explain his cloud and deployment experience.",
  "🏆 What makes him different from other candidates?"
];

export default function Chatbot({
  isOpen,
  setIsOpen,
  initialQuery,
  clearInitialQuery,
  onTrackAction,
  isDarkMode = true,
  isEmbedded = false
}: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: WELCOME_MESSAGE_CONTENT,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [inputQuery, setInputQuery] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showScrollDown, setShowScrollDown] = useState<boolean>(false);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const [chatSize, setChatSize] = useState<"compact" | "normal" | "wide">("normal");
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [activeResponseId, setActiveResponseId] = useState<string | null>(null);

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(RECRUITER_SUGGESTED_PROMPTS);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef<boolean>(false);

  // Smooth scroll to top of latest assistant response so the recruiter can read from the start
  const scrollToTopOfLatestAnswer = () => {
    if (latestMessageRef.current && chatContainerRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Scroll to absolute bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
      userScrolledUpRef.current = false;
      setShowScrollDown(false);
    }
  };

  // Handle scroll events to detect if user has scrolled away from bottom/top
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollDown(isFarFromBottom);
    setShowScrollToTop(scrollTop > 200);

    // If user manually scrolls up while streaming, do NOT snap them to bottom
    if (isFarFromBottom) {
      userScrolledUpRef.current = true;
    } else {
      userScrolledUpRef.current = false;
    }
  };

  // Text-to-Speech (TTS) handler for listening to candidate pitch
  const handleSpeak = (text: string, msgId: string) => {
    if (!("speechSynthesis" in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/[*#`_~]/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/[•\-\d+\.]/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
    onTrackAction("speech_synthesis_play", { msgId });
  };

  // Copy full message content
  const handleCopyMessage = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Handle external launch triggers (from project cards, navbar, etc.)
  useEffect(() => {
    if (isOpen && initialQuery) {
      handleSendMessage(initialQuery);
      if (clearInitialQuery) clearInitialQuery();
    }
  }, [isOpen, initialQuery]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Submit message and stream response
  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Cancel speech if running
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);

    setInputQuery("");
    setIsTyping(true);
    userScrolledUpRef.current = false;
    onTrackAction("question", { query: trimmed });

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. User Message
    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content: trimmed,
      timestamp
    };

    // 2. Assistant Message Placeholder
    const assistantMsgId = `assistant-${Date.now()}`;
    setActiveResponseId(assistantMsgId);
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp,
      isStreaming: true,
      confidence: 0,
      citations: []
    };

    setMessages(prev => [...prev, userMsg, initialAssistantMsg]);

    // Smoothly scroll down so the new question and assistant bubble appear at the top of the reading area
    setTimeout(() => {
      if (latestMessageRef.current) {
        latestMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);

    try {
      const history = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, messages: history })
      });

      if (!response.ok) throw new Error("HTTP connection failed");
      if (!response.body) throw new Error("No readable body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aggregatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        const lines = chunkText.split("\n").filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.chunk) {
                aggregatedText += data.chunk;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: aggregatedText }
                      : m
                  )
                );

                // If the user hasn't scrolled up, gently keep the message positioned comfortably
                if (!userScrolledUpRef.current && chatContainerRef.current) {
                  // Do not aggressively jerk scrollbar to bottom; keep reading flow natural
                }
              }

              if (data.done) {
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
                content: `*(A communication error occurred with the Atlas AI server. Please verify that the server is online).*`,
                isStreaming: false
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  // Dynamically update suggested follow-up questions based on query context
  const updateSuggestions = (query: string) => {
    const qLower = query.toLowerCase();
    if (qLower.includes("project") || qLower.includes("atlas") || qLower.includes("debate") || qLower.includes("numpygpt") || qLower.includes("catalyst")) {
      setSuggestedQuestions([
        "How does AtlasOS resolve contradictions?",
        "How did he build the 3D Debate Arena?",
        "Explain NumPyGPT from scratch",
        "Why hire Kartik?"
      ]);
    } else if (qLower.includes("hire") || qLower.includes("why") || qLower.includes("interview") || qLower.includes("challenge")) {
      setSuggestedQuestions([
        "Tell me about a technical challenge",
        "How does he mitigate hallucinations?",
        "Tell me about his 13 certifications",
        "How to schedule an interview?"
      ]);
    } else if (qLower.includes("skill") || qLower.includes("tech") || qLower.includes("stack") || qLower.includes("database")) {
      setSuggestedQuestions([
        "How does AtlasOS use PostgreSQL RLS?",
        "Explain NumPyGPT attention mechanism",
        "Tell me about his education & 8.5 CGPA",
        "How to schedule an interview?"
      ]);
    } else if (qLower.includes("cert") || qLower.includes("oracle") || qLower.includes("aws") || qLower.includes("azure")) {
      setSuggestedQuestions([
        "Explain his Oracle AI certifications",
        "What are his data analytics credentials?",
        "Why hire Kartik?",
        "How to contact him?"
      ]);
    } else {
      setSuggestedQuestions([
        "Why hire Kartik?",
        "How does AtlasOS work?",
        "Explain NumPyGPT from scratch",
        "How to schedule an interview?"
      ]);
    }
  };

  // Clear chat session
  const handleClearChat = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: WELCOME_MESSAGE_CONTENT,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setSuggestedQuestions(RECRUITER_SUGGESTED_PROMPTS);
    onTrackAction("clear_chat");
  };

  return (
    <>
      {/* ─── 1. MINIMIZED FLOATING ACTION BUTTON (BOTTOM RIGHT WIDGET) ─── */}
      {!isOpen && !isEmbedded && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Helpful callout badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg border backdrop-blur-md cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 ${
            isDarkMode 
              ? "bg-[#0B1120]/90 border-cyan-500/30 text-cyan-300 shadow-cyan-950/50" 
              : "bg-white/95 border-slate-200 text-slate-700 shadow-slate-200/80"
          }`}
          onClick={() => {
            setIsOpen(true);
            onTrackAction("chatbot_open_callout");
          }}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#4FC0D0]" />
            <span>Ask Kartik's AI Rep</span>
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              onTrackAction("chatbot_open");
            }}
            className="flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B6B93] to-[#4FC0D0] shadow-2xl shadow-[#1B6B93]/40 hover:scale-110 active:scale-95 transition-all duration-300 group border border-cyan-400/40 relative"
            id="chatbot-trigger"
            title="Open Atlas AI Candidate Assistant"
          >
            <div className="absolute inset-0 rounded-2xl bg-[#4FC0D0]/20 animate-ping duration-1000" />
            <MessageSquare className="h-6 w-6 text-white group-hover:rotate-6 transition-transform" />
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 border-2 border-[#0B1120] shadow-md">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </button>
        </div>
      )}

      {/* ─── 2. EXPANDED CHATBOT WINDOW (BOTTOM RIGHT REAL WEBSITE CHATBOT) ─── */}
      {isOpen && (() => {
        const s = sizeClasses[chatSize];
        const containerClasses = isEmbedded
          ? "flex flex-col h-full w-full border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 backdrop-blur-2xl"
          : `fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex flex-col border shadow-2xl overflow-hidden transition-all duration-300 backdrop-blur-2xl animate-in fade-in-50 slide-in-from-bottom-6 ${s.window}`;

        return (
          <div
            className={`${containerClasses} ${
              isDarkMode 
                ? "bg-[#0B1120]/95 border-cyan-500/25 text-white shadow-cyan-950/40" 
                : "bg-white/95 border-slate-200 text-slate-900 shadow-2xl"
            }`}
            id={isEmbedded ? "chatbot-embedded" : "chatbot-window"}
          >
            {/* Top Glowing Header Accent Bar */}
            <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-[#1B6B93] via-[#4FC0D0] to-[#A2D2DF]" />

            {/* ─── Chat Panel Header ─── */}
            <div className={`flex items-center justify-between border-b select-none px-3.5 py-2.5 ${
              isDarkMode 
                ? "bg-gradient-to-r from-[#1B6B93]/15 via-[#0B1120] to-[#0B1120] border-cyan-500/20" 
                : "bg-gradient-to-r from-slate-50 to-white border-slate-200"
            }`}>
              {/* Left Identity Info */}
              <div className="flex items-center space-x-2">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#1B6B93] to-[#4FC0D0] shadow-md shadow-[#1B6B93]/30 shrink-0">
                  <Compass className="h-4 w-4 text-white" />
                  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-[#0B1120]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-[13px] text-white tracking-tight">Atlas AI</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[8.5px] font-bold uppercase tracking-wider text-emerald-400">
                      <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                      Candidate Rep
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span 
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 cursor-help hover:bg-emerald-500/20 transition group"
                      title="Responses are generated only from verified resume knowledge using Retrieval-Augmented Generation (RAG)."
                    >
                      <span className="font-bold text-[9.5px]">✓</span>
                      <span>RAG Powered</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Actions (Sizing, Reset, Minimize, Close) */}
              <div className="flex items-center space-x-1">
                {/* Sizing switchers */}
                <div className={`flex items-center rounded-lg border p-0.5 mr-0.5 ${isDarkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-100"}`}>
                  <button
                    onClick={() => setChatSize("compact")}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold transition ${
                      chatSize === "compact"
                        ? "bg-[#1B6B93] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Compact"
                  >
                    S
                  </button>
                  <button
                    onClick={() => setChatSize("normal")}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold transition ${
                      chatSize === "normal"
                        ? "bg-[#1B6B93] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Standard"
                  >
                    M
                  </button>
                  <button
                    onClick={() => setChatSize("wide")}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold transition ${
                      chatSize === "wide"
                        ? "bg-[#1B6B93] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Wide"
                  >
                    L
                  </button>
                </div>

                {/* Clear Chat */}
                <button
                  onClick={handleClearChat}
                  className="p-1 rounded-lg text-slate-400 hover:bg-white/10 hover:text-red-400 transition"
                  title="Clear Chat History"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Minimize Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
                  title="Minimize Assistant"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
                  title="Close Assistant"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* ─── Message Stream Area ─── */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className={`flex-1 overflow-y-auto custom-scrollbar ${s.container} ${
                isDarkMode ? "bg-[#090D16]/70" : "bg-slate-50/50"
              }`}
            >
              {messages.map((m, idx) => {
                const isLatestAssistant = m.role === "assistant" && idx === messages.length - 1;
                const isSpeaking = speakingMessageId === m.id;
                const isCopied = copiedMessageId === m.id;

                return (
                  <div
                    key={m.id}
                    ref={isLatestAssistant ? latestMessageRef : undefined}
                    className={`flex flex-col max-w-[92%] ${
                      m.role === "user" ? "ml-auto items-end" : "mr-auto items-start animate-in fade-in-30"
                    }`}
                  >
                    {/* Role Header Badge */}
                    <div className="flex items-center space-x-1.5 mb-1 px-1">
                      {m.role === "user" ? (
                        <>
                          <span className="text-[10px] font-semibold text-indigo-300">You / Interviewer</span>
                          <User className="h-3 w-3 text-indigo-400" />
                        </>
                      ) : (
                        <>
                          <Bot className="h-3 w-3 text-[#4FC0D0]" />
                          <span className="text-[10px] font-bold text-[#4FC0D0]">Atlas AI</span>
                          <span className="text-[9.5px] text-slate-500">• {m.timestamp}</span>
                        </>
                      )}
                    </div>

                    {/* Message Bubble Card */}
                    <div
                      className={`relative border shadow-md transition-all ${s.bubble} ${
                        m.role === "user"
                          ? isDarkMode
                            ? "bg-gradient-to-r from-blue-700/35 to-indigo-700/35 border-blue-500/30 text-white rounded-tr-sm"
                            : "bg-blue-600 text-white border-blue-600 rounded-tr-sm shadow-blue-500/10"
                          : isDarkMode
                            ? "bg-[#111827]/90 border-cyan-500/20 text-slate-100 rounded-tl-sm backdrop-blur-md"
                            : "bg-white border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {/* Left vertical highlight strip for assistant */}
                      {m.role === "assistant" && (
                        <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-gradient-to-b from-[#4FC0D0] to-[#1B6B93]" />
                      )}

                      {/* Content */}
                      {m.role === "assistant" ? (
                        <div>
                          <MarkdownContent content={m.content} isDarkMode={isDarkMode} chatSize={chatSize} />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap select-text leading-relaxed font-sans">{m.content}</p>
                      )}

                      {/* Assistant Bottom Utility Bar (Copy, TTS Listen, Relevance) */}
                      {m.role === "assistant" && !m.isStreaming && m.id !== "welcome" && (
                        <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[10.5px] ${
                          isDarkMode ? "border-white/10 text-slate-400" : "border-slate-100 text-slate-500"
                        }`}>
                          <div className="flex items-center space-x-2">
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyMessage(m.content, m.id)}
                              className="flex items-center space-x-1 hover:text-white transition px-2 py-0.5 rounded hover:bg-white/5"
                              title="Copy full response"
                            >
                              {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              <span>{isCopied ? "Copied" : "Copy"}</span>
                            </button>

                            {/* Listen / Speak Button */}
                            <button
                              onClick={() => handleSpeak(m.content, m.id)}
                              className={`flex items-center space-x-1 transition px-2 py-0.5 rounded hover:bg-white/5 ${
                                isSpeaking ? "text-[#4FC0D0] font-bold animate-pulse" : "hover:text-white"
                              }`}
                              title={isSpeaking ? "Stop Speaking" : "Listen to Response"}
                            >
                              {isSpeaking ? <VolumeX className="h-3 w-3 text-[#4FC0D0]" /> : <Volume2 className="h-3 w-3" />}
                              <span>{isSpeaking ? "Pause" : "Listen"}</span>
                            </button>
                          </div>

                          {/* Relevance badge */}
                          {m.confidence && m.confidence > 0 && (
                            <span className="inline-flex items-center gap-1 rounded bg-cyan-950/60 border border-cyan-500/25 px-1.5 py-0.5 font-mono text-[9.5px] text-[#4FC0D0]">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                              {m.confidence}% Grounded
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming / Typing Indicator */}
              {isTyping && (
                <div className="flex flex-col mr-auto items-start max-w-[85%] pl-1">
                  <div className={`relative overflow-hidden border ${s.bubble} ${
                    isDarkMode 
                      ? "bg-[#111827]/90 border-cyan-500/20 text-slate-300 shadow-md" 
                      : "bg-white border-slate-200 text-slate-700 shadow-sm"
                  }`}>
                    <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#4FC0D0]" />
                    <div className="flex items-center space-x-2 py-1 px-1">
                      <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 rounded-full bg-[#4FC0D0] animate-bounce" />
                        <span className="h-2 w-2 rounded-full bg-[#1B6B93] animate-bounce [animation-delay:0.2s]" />
                        <span className="h-2 w-2 rounded-full bg-[#A2D2DF] animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">Atlas AI is formulating answer...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Scroll Helpers (Top / Bottom) ─── */}
            <div className="relative">
              {showScrollDown && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-2 right-4 z-20 flex items-center space-x-1 rounded-full px-3 py-1 text-[11px] font-semibold transition shadow-xl border bg-[#0B1120] border-cyan-500/40 text-cyan-300 hover:bg-[#1B6B93] hover:text-white"
                  title="Scroll to bottom"
                >
                  <span>Jump to Latest</span>
                  <ArrowDown className="h-3 w-3" />
                </button>
              )}
              {showScrollToTop && (
                <button
                  onClick={scrollToTopOfLatestAnswer}
                  className="absolute bottom-2 left-4 z-20 flex items-center space-x-1 rounded-full px-3 py-1 text-[11px] font-semibold transition shadow-xl border bg-[#0B1120] border-cyan-500/40 text-cyan-300 hover:bg-[#1B6B93] hover:text-white"
                  title="Scroll to top of answer"
                >
                  <ArrowUp className="h-3 w-3" />
                  <span>Top of Answer</span>
                </button>
              )}
            </div>

            {/* ─── Suggested Follow-Up Questions ─── */}
            <div className={`border-t flex flex-wrap select-none shrink-0 overflow-y-auto custom-scrollbar ${s.suggestedBox} ${
              isDarkMode ? "border-cyan-500/15 bg-[#080C14]/90" : "border-slate-200 bg-slate-50/90"
            }`}>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={isTyping}
                  className={`font-semibold border transition text-left leading-tight truncate max-w-full disabled:opacity-40 shadow-sm ${s.suggestedBtn} ${
                    isDarkMode 
                      ? "border-cyan-500/20 hover:border-cyan-400/60 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-200 hover:text-white" 
                      : "border-slate-200 hover:border-cyan-500/40 bg-white hover:bg-cyan-50/50 text-slate-700 hover:text-cyan-900"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* ─── Trust Indicator (Above Input Box) ─── */}
            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 border-t select-none transition-colors ${
              isDarkMode 
                ? "bg-[#080D1A]/90 border-cyan-500/15 text-slate-300" 
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}>
              <span className="text-emerald-400 font-bold text-[11px] leading-none">✓</span>
              <span className="text-[10px] sm:text-[10.5px] font-medium tracking-tight leading-none">
                Responses are grounded only in verified resume data.
              </span>
            </div>

            {/* ─── Input Box ─── */}
            <div className={`border-t shrink-0 ${s.inputBox} ${
              isDarkMode ? "border-cyan-500/20 bg-[#0B1120]" : "border-slate-200 bg-white"
            }`}>
              <div className={`relative flex items-center border rounded-2xl focus-within:ring-2 focus-within:ring-[#4FC0D0]/50 transition-all ${
                isDarkMode ? "bg-[#121827] border-cyan-500/25" : "bg-slate-50 border-slate-200"
              }`}>
                <textarea
                  rows={1}
                  placeholder="Ask anything about Kartik's engineering, projects, or interview Q&A..."
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-[#1B6B93] to-[#4FC0D0] text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition shadow-md shadow-[#1B6B93]/30"
                  title="Send message (Enter)"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Bottom Keyboard Hint & Branding */}
              <div className="flex items-center justify-between select-none mt-2 px-1 text-[10px] text-slate-500 font-medium">
                <span>Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline</span>
                <span className="flex items-center space-x-1 font-mono text-[9.5px] text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>RAG Engine Active</span>
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
