/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { Compass, Navigation, Milestone, MessageSquare, Activity, Layers, Flag, Globe, Github, Linkedin, ExternalLink, Sparkles, Send, Upload, RefreshCw, Trash2, Mail, Phone, MapPin, Check, Copy } from "lucide-react";
import { resumeData, Project, Certification } from "../data/resumeData";


interface DashboardProps {
  onAskAIAboutProject: (projectTitle: string) => void;
  onTrackAction: (event: string, meta?: any) => void;
}

interface AnalyticsData {
  visits: number;
  questionsAsked: number;
  timeSpent: number;
  projectsOpened: number;
  resumeDownloads: number;
  dailyVisits: { date: string; count: number }[];
  popularQueries: { query: string; count: number }[];
}

export default function Dashboard({ onAskAIAboutProject, onTrackAction }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"projects" | "certificates" | "skills" | "analytics" | "admin" | "contact">("projects");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Admin states
  const [adminTitle, setAdminTitle] = useState<string>("");
  const [adminSource, setAdminSource] = useState<string>("Resume_Extra.pdf");
  const [adminContent, setAdminContent] = useState<string>("");
  const [adminStatus, setAdminStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });
  const [rebuilding, setRebuilding] = useState<boolean>(false);

  // New RAG index studio full-stack states
  const [chunks, setChunks] = useState<{ id: string; title: string; source: string; length: number; hasEmbedding: boolean }[]>([]);
  const [loadingChunks, setLoadingChunks] = useState<boolean>(false);
  const [testQuery, setTestQuery] = useState<string>("");
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ title: string; source: string; content: string; score: number }[] | null>(null);
  const [indexingLogs, setIndexingLogs] = useState<string[]>([]);

  // New animated skills core states
  const [skillsLoaded, setSkillsLoaded] = useState<boolean>(false);
  const [typingText, setTypingText] = useState<string>("");
  const [phraseIndex, setPhraseIndex] = useState<number>(0);
  const [certFilter, setCertFilter] = useState<"all" | "ai" | "cloud" | "data" | "security" | "dev">("all");

  const typingPhrases = [
    "Compiling matrix: Python, FastAPI, React, Node.js, and Vector Databases...",
    "NumPyGPT Core: Multi-layer perceptron layers and backprop built 100% manually.",
    "RAG Vector Indices: Direct cosine similarity lookup across custom embedded chunks.",
    "Debate Arena: Multi-agent structured arguments powered by autonomous personas.",
    "Factual Hallucination Auditor: Mitigating claims drift using Sentence Transformers."
  ];

  // Retrieve indexed chunks
  const fetchChunks = async () => {
    setLoadingChunks(true);
    try {
      const res = await fetch("/api/admin/chunks");
      if (res.ok) {
        const data = await res.json();
        setChunks(data.chunks || []);
      }
    } catch (err) {
      console.error("Failed to load chunks", err);
    } finally {
      setLoadingChunks(false);
    }
  };

  // Run dynamic testing query against the index
  const handleTestQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setTesting(true);
    try {
      const res = await fetch("/api/admin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data.results || []);
        onTrackAction("test_rag_search", { query: testQuery });
      }
    } catch (err) {
      console.error("Playground query failed", err);
    } finally {
      setTesting(false);
    }
  };

  // Delete a specific chunk
  const handleDeleteChunk = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/chunks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAdminStatus({ type: "success", message: "RAG document chunk successfully deleted from index!" });
        fetchChunks();
        fetchAnalytics();
        onTrackAction("delete_chunk", { id });
      } else {
        setAdminStatus({ type: "error", message: "Failed to delete indexed chunk." });
      }
    } catch (err) {
      setAdminStatus({ type: "error", message: "Network connection error on deletion." });
    }
  };

  // Trigger simulated developer logs during indexing/reset
  const streamIndexingLogs = (mode: "reset" | "upload") => {
    const logs = mode === "reset" ? [
      "[INFO] Reverting database to standard portfolio configuration...",
      "[INFO] Loading Resume_Core.pdf from server workspace directory...",
      "[EMBED] Chunking 1,420 words into 6 highly distinct operational files...",
      "[EMBED] Synchronizing vocabulary dictionaries and calculating similarity matrices...",
      "[SYS] Clean RAG vector space loaded successfully! [OK]"
    ] : [
      `[INFO] Parsing and validating custom document chunk: "${adminTitle}"...`,
      `[INFO] Target citation source: "${adminSource}" validated.`,
      "[EMBED] Transforming text slice into 384-dimensional array...",
      "[EMBED] In-memory local cosine index successfully updated.",
      "[SYS] Dynamic index compiled! Custom chunk is now active."
    ];

    setIndexingLogs([]);
    logs.forEach((log, index) => {
      setTimeout(() => {
        setIndexingLogs(prev => [...prev, log]);
      }, (index + 1) * 350);
    });
  };

  // Load analytics from backend API
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error("Failed to load analytics data", e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    if (activeTab === "admin") {
      fetchChunks();
      setIndexingLogs([]);
    }
    if (activeTab === "skills") {
      setSkillsLoaded(false);
      const timer = setTimeout(() => setSkillsLoaded(true), 150);
      return () => clearTimeout(timer);
    }
    onTrackAction("tab_view", { tab: activeTab });
  }, [activeTab]);

  // Infinite typing effect loop
  useEffect(() => {
    if (activeTab === "skills") {
      let activePhrase = typingPhrases[phraseIndex];
      let charIdx = 0;
      setTypingText("");
      
      const interval = setInterval(() => {
        if (charIdx < activePhrase.length) {
          setTypingText((prev) => prev + activePhrase.charAt(charIdx));
          charIdx++;
        } else {
          clearInterval(interval);
          // Wait and transition to next phrase
          setTimeout(() => {
            setPhraseIndex((prev) => (prev + 1) % typingPhrases.length);
          }, 2800);
        }
      }, 30);
      
      return () => clearInterval(interval);
    }
  }, [activeTab, phraseIndex]);

  // Handle Copy details
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
    onTrackAction("copy_text", { label });
  };

  // Submit dynamic chunks via Admin panel
  const handleAdminUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminTitle || !adminContent) {
      setAdminStatus({ type: "error", message: "Both title and detailed material are required!" });
      return;
    }

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: adminTitle, source: adminSource, content: adminContent })
      });

      if (res.ok) {
        setAdminStatus({ type: "success", message: "Document chunk successfully generated and embedded into RAG database!" });
        streamIndexingLogs("upload");
        setAdminTitle("");
        setAdminContent("");
        onTrackAction("admin_upload", { title: adminTitle });
        fetchChunks();
        fetchAnalytics();
      } else {
        setAdminStatus({ type: "error", message: "Failed to upload document into vector database." });
      }
    } catch (err) {
      setAdminStatus({ type: "error", message: "Network connection failure during upload." });
    }
  };

  // Reset database index
  const handleAdminReset = async () => {
    setRebuilding(true);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (res.ok) {
        setAdminStatus({ type: "success", message: "In-memory RAG database successfully reset to clean Resume.pdf defaults!" });
        streamIndexingLogs("reset");
        onTrackAction("admin_reset");
        fetchChunks();
        fetchAnalytics();
      }
    } catch (err) {
      setAdminStatus({ type: "error", message: "Failed to restore database defaults." });
    } finally {
      setRebuilding(false);
    }
  };

  // Draw custom high-fidelity SVG chart
  const renderSVGLineChart = () => {
    if (!analytics || !analytics.dailyVisits || analytics.dailyVisits.length === 0) return null;

    const maxVal = Math.max(...analytics.dailyVisits.map(d => d.count), 10);
    const chartHeight = 150;
    const chartWidth = 500;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 20;

    const graphHeight = chartHeight - paddingTop - paddingBottom;
    const graphWidth = chartWidth - paddingLeft - paddingRight;

    // Build SVG points
    const points = analytics.dailyVisits.map((d, idx) => {
      const x = paddingLeft + (idx / (analytics.dailyVisits.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - (d.count / maxVal) * graphHeight;
      return { x, y, label: d.date, value: d.count };
    });

    const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPathData = `${pathData} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;

    return (
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B6B93" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1B6B93" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4FC0D0" />
            <stop offset="100%" stopColor="#1B6B93" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + ratio * graphHeight;
          const valLabel = Math.round(maxVal * (1 - ratio));
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
              <text x={paddingLeft - 10} y={y + 4} textAnchor="end" fill="#64748b" className="text-xxs font-semibold">
                {valLabel}
              </text>
            </g>
          );
        })}

        {/* Area fill path */}
        <path d={areaPathData} fill="url(#chartGradient)" />

        {/* Floating smooth line path */}
        <path d={pathData} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Interactive glowing nodes */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="5" fill="#0b1120" stroke="#4FC0D0" strokeWidth="2" className="transition group-hover:scale-125" />
            <circle cx={p.x} cy={p.y} r="1.5" fill="#ffffff" />

            {/* Label for bottom axis */}
            <text x={p.x} y={chartHeight - 4} textAnchor="middle" fill="#64748b" className="text-xxs font-semibold">
              {p.label}
            </text>

            {/* Tooltip on hover */}
            <g className="opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none">
              <rect x={p.x - 20} y={p.y - 30} width="40" height="18" rx="4" fill="#0c0a09" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x={p.x} y={p.y - 18} textAnchor="middle" fill="#f8fafc" className="text-3xs font-extrabold">
                {p.value} visits
              </text>
            </g>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full rounded-2xl bg-[#0B1120] border border-[#1B6B93]/25 overflow-hidden" id="dashboard-root">
      {/* Sidebar Nav */}
      <div className="w-full md:w-64 bg-white/[0.02] p-4 border-b md:border-b-0 md:border-r border-[#1B6B93]/20 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible custom-scrollbar select-none">
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center space-x-2.5 rounded-xl px-4 py-3 text-xs font-semibold whitespace-nowrap md:whitespace-normal transition-all focus-visible:outline-2 ${
            activeTab === "projects" ? "bg-[#1B6B93]/20 text-[#4FC0D0] border border-[#1B6B93]/30 shadow-md" : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          id="tab-projects"
        >
          <Compass className="h-4.5 w-4.5" />
          <span>Interactive Projects</span>
        </button>
        <button
          onClick={() => setActiveTab("certificates")}
          className={`flex items-center space-x-2.5 rounded-xl px-4 py-3 text-xs font-semibold whitespace-nowrap md:whitespace-normal transition-all focus-visible:outline-2 ${
            activeTab === "certificates" ? "bg-[#1B6B93]/20 text-[#4FC0D0] border border-[#1B6B93]/30 shadow-md" : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          id="tab-certificates"
        >
          <Milestone className="h-4.5 w-4.5" />
          <span>Credentials</span>
        </button>
        <button
          onClick={() => setActiveTab("skills")}
          className={`flex items-center space-x-2.5 rounded-xl px-4 py-3 text-xs font-semibold whitespace-nowrap md:whitespace-normal transition-all focus-visible:outline-2 ${
            activeTab === "skills" ? "bg-[#1B6B93]/20 text-[#4FC0D0] border border-[#1B6B93]/30 shadow-md" : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          id="tab-skills"
        >
          <Navigation className="h-4.5 w-4.5" />
          <span>Skills Core</span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center space-x-2.5 rounded-xl px-4 py-3 text-xs font-semibold whitespace-nowrap md:whitespace-normal transition-all focus-visible:outline-2 ${
            activeTab === "analytics" ? "bg-[#1B6B93]/20 text-[#4FC0D0] border border-[#1B6B93]/30 shadow-md" : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          id="tab-analytics"
        >
          <Activity className="h-4.5 w-4.5" />
          <span>Recruiter Insights</span>
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`flex items-center space-x-2.5 rounded-xl px-4 py-3 text-xs font-semibold whitespace-nowrap md:whitespace-normal transition-all focus-visible:outline-2 ${
            activeTab === "admin" ? "bg-[#1B6B93]/20 text-[#4FC0D0] border border-[#1B6B93]/30 shadow-md" : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          id="tab-admin"
        >
          <Layers className="h-4.5 w-4.5" />
          <span>RAG Index Studio</span>
        </button>
        <button
          onClick={() => setActiveTab("contact")}
          className={`flex items-center space-x-2.5 rounded-xl px-4 py-3 text-xs font-semibold whitespace-nowrap md:whitespace-normal transition-all focus-visible:outline-2 ${
            activeTab === "contact" ? "bg-[#1B6B93]/20 text-[#4FC0D0] border border-[#1B6B93]/30 shadow-md" : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          id="tab-contact"
        >
          <Flag className="h-4.5 w-4.5" />
          <span>Direct Contact</span>
        </button>
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 p-6 overflow-y-auto max-h-[800px] custom-scrollbar bg-slate-950/20">
        
        {/* ==================== PROJECTS TAB ==================== */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-extrabold text-white">Interactive Portfolios</h2>
              <p className="text-xs text-slate-400 mt-1">
                Explore Kartik's fully implemented solutions, review their core technology architectures, or trigger deep-dive RAG auditing!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {resumeData.projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onTrackAction("project_click", { title: p.title })}
                  className="group relative flex flex-col rounded-xl bg-white/5 border border-white/10 p-5 hover:border-[#1B6B93]/40 hover:bg-white/[0.08] hover:shadow-[#1B6B93]/5 shadow-lg transition-all duration-300 cursor-pointer"
                >
                  {/* Subtle hover gradient light effect */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#4FC0D0]/30 to-transparent opacity-0 group-hover:opacity-100 transition" />

                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-bold text-white group-hover:text-[#4FC0D0] transition font-display">
                      {p.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAIAboutProject(p.title);
                      }}
                      className="flex items-center space-x-1 rounded-lg bg-[#1B6B93] hover:bg-[#164E6B] px-2.5 py-1 text-2xs font-bold text-white transition shadow-md shadow-[#1B6B93]/25"
                    >
                      <Compass className="h-3 w-3 animate-spin-slow" />
                      <span>Ask AI</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 text-justify line-clamp-3 leading-relaxed">
                    {p.description}
                  </p>

                  <p className="text-[9px] font-mono text-slate-500 mt-4 uppercase tracking-wider">
                    Core Technical Stack
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {p.techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="rounded bg-white/5 px-2 py-0.5 text-xxs font-medium text-slate-400 border border-white/5"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-white/5">
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 text-slate-400 hover:text-white text-xxs font-bold transition focus-visible:outline-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Github className="h-3.5 w-3.5" />
                      <span>View Code</span>
                    </a>
                    <span className="text-slate-800">•</span>
                    <a
                      href={p.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 text-slate-400 hover:text-white text-xxs font-bold transition focus-visible:outline-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Live Demo</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== CERTIFICATES TAB ==================== */}
        {activeTab === "certificates" && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-extrabold text-white">Certifications & Credentials</h2>
              <p className="text-xs text-slate-400 mt-1">
                A verified record of specialized mastery spanning Oracle GenAI, AWS ML, Azure Cloud, Cisco, Deloitte, IBM, and enterprise development simulations.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {(["all", "ai", "cloud", "data", "security", "dev"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCertFilter(cat)}
                  className={`rounded-full px-3 py-1.5 text-xxs font-bold transition-all ${
                    certFilter === cat
                      ? "bg-[#1B6B93] text-white shadow-lg shadow-[#1B6B93]/30"
                      : "border border-white/15 bg-white/5 text-slate-400 hover:text-white hover:border-white/30"
                  }`}
                >
                  {cat === "all" ? "All Credentials" :
                   cat === "ai" ? "AI & ML" :
                   cat === "cloud" ? "Cloud" :
                   cat === "data" ? "Data Analytics" :
                   cat === "security" ? "Cybersecurity" : "Full-Stack & Dev"}
                </button>
              ))}
              <span className="ml-auto text-xxs text-slate-500 self-center font-mono">
                {resumeData.certifications.filter(c => certFilter === "all" || c.category === certFilter).length} credentials
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumeData.certifications
                .filter(c => certFilter === "all" || c.category === certFilter)
                .map((c) => (
                <div
                  key={c.id}
                  className="group relative flex flex-col rounded-2xl bg-white/[0.04] border border-white/10 p-5 hover:border-[#1B6B93]/50 hover:bg-white/[0.07] transition-all duration-300 overflow-hidden"
                  style={{ ['--cert-color' as string]: c.brandColor }}
                >
                  {/* Subtle colored top accent line */}
                  <div className="absolute inset-x-0 top-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: c.brandColor }} />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CertIssuerBadge issuerKey={c.issuerKey} brandColor={c.brandColor} />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.issuer}</p>
                        <p className="text-xxs font-mono text-slate-500">Issued {c.date}</p>
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-4xs font-bold uppercase tracking-wider text-emerald-400">
                      <span>✓</span> Verified
                    </span>
                  </div>

                  <h3 className="mt-3 text-xs font-bold text-white leading-snug group-hover:text-[#4FC0D0] transition-colors">
                    {c.title}
                  </h3>
                  <p className="mt-1.5 text-xxs text-slate-400 leading-relaxed line-clamp-2">{c.description}</p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {c.skills.map((skill) => (
                      <span key={skill} className="rounded-md border border-white/10 bg-black/20 px-1.5 py-0.5 text-4xs font-medium text-slate-400">{skill}</span>
                    ))}
                  </div>

                  {c.credentialId && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-4xs font-mono text-slate-500 truncate max-w-[160px]" title={c.credentialId}>
                        ID: {c.credentialId}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(c.credentialId!);
                          onTrackAction('copy_credential', { id: c.id });
                        }}
                        className="text-3xs font-bold text-slate-400 hover:text-white border border-white/10 hover:border-[#1B6B93]/50 bg-black/20 hover:bg-[#1B6B93]/20 px-2 py-0.5 rounded transition"
                      >
                        Copy ID
                      </button>
                    </div>
                  )}
                  {!c.credentialId && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <span className="text-3xs font-semibold text-slate-500">Official Training Credential</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SKILLS MATRICES ==================== */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-extrabold text-white">Technical Skill Mapping</h2>
              <p className="text-xs text-slate-400 mt-1">
                A visual assessment of Kartik's technical proficiencies mapped across distinct operational vectors.
              </p>
              {/* Live typing ticker */}
              <div className="mt-3 rounded-lg bg-black/50 border border-[#1B6B93]/20 px-3 py-2 font-mono text-[11px] text-[#4FC0D0] flex items-center space-x-2 overflow-hidden">
                <span className="text-slate-500 shrink-0">$</span>
                <span className="truncate">{typingText}</span>
                <span className="w-[2px] h-3.5 bg-[#4FC0D0] animate-pulse shrink-0" />
              </div>
            </div>

            {/* RAG Diagnostics Telemetry */}
            <div className="rounded-xl bg-black/50 border border-[#1B6B93]/20 p-5 font-mono text-[11px] text-slate-300">
              <div className="flex items-center justify-between border-b border-[#1B6B93]/20 pb-2 mb-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RAG System Diagnostics</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] mb-0.5">Active Model</span>
                  <span className="text-white font-semibold">gemini-3.5-flash</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] mb-0.5">Embeddings</span>
                  <span className="text-white font-semibold">gemini-embedding-2</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] mb-0.5">Vector Depth</span>
                  <span className="text-white font-semibold">{chunks.length || 18} Chunks Stored</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] mb-0.5">RAG Context</span>
                  <span className="text-[#4FC0D0] font-semibold">In-Memory JSON (Verifiable)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Drivers */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                <h3 className="text-xs font-bold text-[#4FC0D0] uppercase tracking-wider mb-4 flex items-center justify-between font-display">
                  <span>Daily Drivers (Core Proficiency)</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1B6B93]/20 border border-[#1B6B93]/30 text-[#4FC0D0] font-extrabold uppercase">Primary</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { name: "Python", desc: "Built RAG pipeline, ML models & backend integrations" },
                    { name: "Java", desc: "Backend algorithms, core object-oriented structures" },
                    { name: "JavaScript", desc: "React dashboard components and active UI states" },
                    { name: "FastAPI", desc: "High-performance endpoints and AI backend serving" },
                    { name: "Node.js & Express", desc: "This portfolio's secure server middleware" }
                  ].map((item, idx) => (
                    <div key={idx} className="rounded-lg bg-white/[0.03] border border-white/10 p-3">
                      <span className="text-xs font-bold text-white block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comfortable / Working Knowledge */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between font-display">
                  <span>Comfortable / Working Knowledge</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-extrabold uppercase">Secondary</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { name: "C++", desc: "Data structures and competitive programming pipelines" },
                    { name: "SQL", desc: "Relational database models, indexes, queries" },
                    { name: "Scikit-Learn", desc: "Predictive analytics & classification structures" },
                    { name: "LangChain", desc: "Vector chunk splitting & prompt-engineering pipelines" },
                    { name: "MongoDB", desc: "Document database storage, indexing, lookup" },
                    { name: "Sentence Transformers", desc: "Local semantic embedding evaluation" }
                  ].map((item, idx) => (
                    <div key={idx} className="rounded-lg bg-white/[0.01] border border-white/5 p-3">
                      <span className="text-xs font-bold text-slate-200 block">{item.name}</span>
                      <span className="text-[10px] text-slate-500 mt-1 block leading-relaxed">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid of details */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-5 md:col-span-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-display">
                  Frameworks, Engines & Tools
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Frontend</h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                      {resumeData.skills.frontend.map((s, i) => <li key={i} className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#4FC0D0] shrink-0" /><span>{s}</span></li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Backend</h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                      {resumeData.skills.backend.map((s, i) => <li key={i} className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1B6B93] shrink-0" /><span>{s}</span></li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Databases & Tools</h4>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                      {resumeData.skills.database.concat(resumeData.skills.tools).slice(0, 7).map((s, i) => <li key={i} className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" /><span>{s}</span></li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ANALYTICS CONSOLE ==================== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-extrabold text-white">Recruiter Telemetry Console</h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time tracking of platform activity, popular recruiter questions, and general portal interactions.
              </p>
            </div>

            {loadingAnalytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <div className="skeleton-shimmer h-3 w-16 mb-3" />
                      <div className="skeleton-shimmer h-7 w-12" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-5 md:col-span-7">
                    <div className="skeleton-shimmer h-3 w-32 mb-4" />
                    <div className="skeleton-shimmer h-44 w-full" />
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-5 md:col-span-5">
                    <div className="skeleton-shimmer h-3 w-28 mb-3" />
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => <div key={i} className="skeleton-shimmer h-4 w-full" />)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Counters Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 animate-count-up delay-75">
                    <p className="text-xxs font-bold text-slate-500 uppercase">Total Visits</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {analytics?.visits ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 animate-count-up delay-150">
                    <p className="text-xxs font-bold text-slate-500 uppercase">Queries Solved</p>
                    <p className="text-2xl font-black text-[#4FC0D0] mt-1">
                      {analytics?.questionsAsked ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 animate-count-up delay-225">
                    <p className="text-xxs font-bold text-slate-500 uppercase">Downloads</p>
                    <p className="text-2xl font-black text-[#1B6B93] mt-1">
                      {analytics?.resumeDownloads ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 animate-count-up delay-300">
                    <p className="text-xxs font-bold text-slate-500 uppercase">Projects Explored</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">
                      {analytics?.projectsOpened ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 col-span-2 md:col-span-1 animate-count-up delay-400">
                    <p className="text-xxs font-bold text-slate-500 uppercase">Interaction Time</p>
                    <p className="text-2xl font-black text-amber-400 mt-1">
                      {analytics?.timeSpent ? Math.round(analytics.timeSpent / 60) : 0} <span className="text-xs font-semibold text-slate-400">min</span>
                    </p>
                  </div>
                </div>

                {/* Main Graph Panels */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Visually Plotted SVG Area Chart */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-5 md:col-span-7">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                      Weekly Activity Traffic
                    </h3>
                    <div className="h-44 w-full flex items-center justify-center">
                      {renderSVGLineChart()}
                    </div>
                  </div>

                  {/* Right: Popular RAG queries list */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-5 md:col-span-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        Popular RAG Queries
                      </h3>
                      <div className="space-y-2.5">
                        {analytics?.popularQueries.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-300 truncate max-w-[220px]">
                              "{item.query}"
                            </span>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-3xs font-extrabold text-[#4FC0D0] border border-[#1B6B93]/20">
                              {item.count} queries
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={fetchAnalytics}
                      className="flex items-center justify-center space-x-1.5 w-full mt-4 rounded-lg bg-white/5 hover:bg-white/10 py-1.5 text-xxs font-bold text-slate-300 border border-white/10 transition"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Refresh Analytics</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

            {/* ==================== RAG ADMIN TERMINAL ==================== */}
        {activeTab === "admin" && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-white">RAG Local Database Studio</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Directly manipulate Atlas's knowledge corpus. Inject new facts, or delete custom chunks to modify the AI's search index in real-time.
                </p>
              </div>

              <button
                onClick={handleAdminReset}
                disabled={rebuilding}
                className="flex items-center space-x-1.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/20 px-3 py-1.5 text-xs font-bold transition disabled:opacity-40"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${rebuilding ? "animate-spin" : ""}`} />
                <span>Reset to Clean Resume</span>
              </button>
            </div>

            {/* Notification alert banner */}
            {adminStatus.message && (
              <div
                className={`rounded-xl px-4 py-3 text-xs font-semibold border transition-all ${
                  adminStatus.type === "success"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/15 border-red-500/30 text-red-400"
                }`}
              >
                {adminStatus.message}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form & Developer Logs Console */}
              <div className="lg:col-span-7 space-y-6">
                {/* Uploading form */}
                <form onSubmit={handleAdminUpload} className="space-y-4 rounded-xl bg-white/5 border border-white/10 p-5">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Inject Custom Knowledge Fact
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xxs font-bold text-slate-400 uppercase">Document Section Title</label>
                      <input
                        type="text"
                        placeholder="e.g. MSME Hackathon Solution"
                        value={adminTitle}
                        onChange={(e) => setAdminTitle(e.target.value)}
                        className="w-full rounded-lg bg-black/30 p-2.5 text-xs text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xxs font-bold text-slate-400 uppercase">Citation File Source</label>
                      <input
                        type="text"
                        placeholder="e.g. Hackathon_Certificate.pdf"
                        value={adminSource}
                        onChange={(e) => setAdminSource(e.target.value)}
                        className="w-full rounded-lg bg-black/30 p-2.5 text-xs text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xxs font-bold text-slate-400 uppercase">Fact Content (Embedded into RAG database)</label>
                    <textarea
                      rows={4}
                      placeholder="Paste detailed resume chapters, extra projects, transcripts, or awards here. Every word is chunked, enabling the Atlas RAG search algorithm to refer to these specific items in real-time during conversations."
                      value={adminContent}
                      onChange={(e) => setAdminContent(e.target.value)}
                      className="w-full rounded-lg bg-black/30 p-2.5 text-xs text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center justify-center space-x-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 w-full transition"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Chunk, Embed, and Index Document</span>
                  </button>
                </form>

                {/* Developer Log Console */}
                <div className="rounded-xl bg-black border border-white/10 p-4 font-mono text-xs text-slate-300">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2 select-none">
                    <span className="text-3xs uppercase font-extrabold tracking-wider text-slate-500">
                      Compiler Console Log
                    </span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto select-text scrollbar-thin">
                    <p className="text-slate-500">[SYSTEM] Vector Embedding Model running on CPU (dimension: 384)</p>
                    <p className="text-slate-500">[SYSTEM] Local memory vector store initialized. Total items index: {chunks.length}</p>
                    {indexingLogs.map((log, idx) => (
                      <p key={idx} className={log.includes("[SYS]") ? "text-emerald-400 font-semibold" : log.includes("[EMBED]") ? "text-indigo-400" : "text-amber-400"}>
                        {log}
                      </p>
                    ))}
                    {indexingLogs.length === 0 && (
                      <p className="text-slate-600 text-3xs italic mt-2">Waiting for next indexing operation...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Chunk Indexes */}
              <div className="lg:col-span-5 flex flex-col h-[540px] rounded-xl bg-white/5 border border-white/10 p-5 overflow-hidden">
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3 shrink-0">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Active Vector Index Units
                    </h3>
                    <p className="text-3xs text-slate-500 mt-0.5">
                      Total chunks currently loaded in cache: {chunks.length}
                    </p>
                  </div>
                  <button
                    onClick={fetchChunks}
                    disabled={loadingChunks}
                    className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition text-slate-300 disabled:opacity-50"
                    title="Refresh index list"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingChunks ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  {loadingChunks ? (
                    <div className="flex h-32 items-center justify-center">
                      <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin" />
                    </div>
                  ) : chunks.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-xs text-slate-500 italic">
                      No vector chunks found. Click Reset above.
                    </div>
                  ) : (
                    chunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="group flex items-start justify-between rounded-lg bg-black/25 border border-white/5 p-3 hover:border-indigo-500/30 transition-all"
                      >
                        <div className="space-y-1 min-w-0 flex-1 pr-2.5">
                          <div className="flex items-center space-x-2">
                            <span className="truncate text-xs font-bold text-white leading-tight">
                              {chunk.title}
                            </span>
                            {chunk.hasEmbedding && (
                              <span className="shrink-0 text-[8px] leading-none font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                                EMBED
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-2 text-[10px] text-slate-500">
                            <span>Source: <strong className="text-slate-400">{chunk.source}</strong></span>
                            <span>•</span>
                            <span>{chunk.length} characters</span>
                          </div>
                        </div>

                        {chunk.id.startsWith("custom-upload-") && (
                          <button
                            onClick={() => handleDeleteChunk(chunk.id)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/25 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete chunk from RAG database"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section: RAG Testing Playground Simulator */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-5 mt-6">
              <h3 className="text-xs font-bold text-[#4FC0D0] uppercase tracking-wider mb-2 flex items-center space-x-1.5 font-display">
                <Compass className="h-3.5 w-3.5" />
                <span>RAG Cosine-Similarity Playground</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Test how the vector database answers queries! Type any phrase to evaluate semantic vector alignment scores and observe exactly which background citation chunk matches.
              </p>

              <form onSubmit={handleTestQuery} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Tell me about Kartik's NumPyGPT or MSME achievements..."
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  className="flex-1 rounded-lg bg-black/30 p-2.5 text-xs text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#1B6B93]"
                />
                <button
                  type="submit"
                  disabled={testing}
                  className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 shrink-0"
                >
                  {testing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Query Index</span>
                </button>
              </form>

              {testResult && (
                <div className="mt-4 space-y-3 pt-4 border-t border-white/10">
                  <h4 className="text-3xs uppercase font-extrabold tracking-wider text-slate-500">
                    Calculated Similarity Results (Top matches)
                  </h4>
                  {testResult.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No similarity alignment found for this phrase.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {testResult.map((match, idx) => (
                        <div key={idx} className="rounded-lg bg-black/30 border border-white/10 p-3.5 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="text-xs font-bold text-white truncate max-w-[200px]">{match.title}</p>
                              <p className="text-[10px] text-slate-500">Source: {match.source}</p>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-[10px] font-black text-indigo-400">{match.score}% match</span>
                              <div className="w-14 h-1 bg-black rounded-full overflow-hidden mt-1">
                                <div style={{ width: `${match.score}%` }} className="h-full bg-indigo-500" />
                              </div>
                            </div>
                          </div>
                          <p className="text-xxs text-slate-300 leading-relaxed text-justify line-clamp-3 bg-white/5 p-2 rounded border border-white/5">
                            "{match.content}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== DIRECT CONTACT ==================== */}
        {activeTab === "contact" && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-extrabold text-white">Direct Contact</h2>
              <p className="text-xs text-slate-400 mt-1">
                Reach out to Kartik directly via email, phone, or LinkedIn. He's open to AI/ML roles, collaborations, and interviews.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Email Card */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 hover:border-[#1B6B93]/50 hover:bg-white/[0.08] transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/90 shadow-md">
                    <svg viewBox="0 0 48 48" className="h-6 w-6">
                      <path fill="#EA4335" d="M24 24.5L6 11.2V37c0 1.7 1.3 3 3 3h30c1.7 0 3-1.3 3-3V11.2L24 24.5z" />
                      <path fill="#4285F4" d="M42 11.2V8c0-1.7-1.3-3-3-3H9C7.3 5 6 6.3 6 8v3.2l18 13.3 18-13.3z" />
                      <path fill="#34A853" d="M6 11.2L24 24.5 6 37.8V11.2z" />
                      <path fill="#FBBC05" d="M42 11.2L24 24.5 42 37.8V11.2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-3xs font-bold uppercase tracking-widest text-slate-500">Email Address</p>
                    <p className="text-xs font-bold text-white mt-0.5">{resumeData.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${resumeData.email}&su=AI%20Engineering%20Opportunity%20-%20Kartik%20Raikar`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white text-neutral-900 text-xxs font-bold px-3 py-2 hover:bg-neutral-100 transition"
                  >
                    Open Gmail ↗
                  </a>
                  <button
                    onClick={() => handleCopy(resumeData.email, "email")}
                    className="px-3 py-2 rounded-xl border border-white/15 bg-white/10 text-xxs font-semibold text-white hover:bg-white/20 transition"
                  >
                    {copiedLabel === "email" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Phone/WhatsApp Card */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 hover:border-emerald-500/30 hover:bg-white/[0.08] transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-md">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-3xs font-bold uppercase tracking-widest text-slate-500">Phone / WhatsApp</p>
                    <p className="text-xs font-bold text-white mt-0.5">{resumeData.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <a
                    href={`https://wa.me/918660910358?text=Hi%20Kartik,%20I%20saw%20your%20AI%20portfolio%20and%20would%20love%20to%20connect!`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-white text-xxs font-bold px-3 py-2 hover:bg-emerald-600 transition"
                  >
                    WhatsApp 💬
                  </a>
                  <a
                    href="tel:+918660910358"
                    className="px-3 py-2 rounded-xl border border-white/15 bg-white/10 text-xxs font-semibold text-white hover:bg-white/20 transition"
                  >
                    Call 📞
                  </a>
                  <button
                    onClick={() => handleCopy(resumeData.phone, "phone")}
                    className="px-3 py-2 rounded-xl border border-white/15 bg-white/10 text-xxs font-semibold text-white hover:bg-white/20 transition"
                  >
                    {copiedLabel === "phone" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* GitHub Card */}
              <a
                href={resumeData.github} target="_blank" rel="noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 flex items-center justify-between hover:border-white/40 hover:bg-white/[0.08] transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 border border-white/15 shadow-md">
                    <Github className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-3xs font-bold uppercase tracking-widest text-slate-500">GitHub Codebase</p>
                    <p className="text-xs font-bold text-white mt-0.5">@kartikraikar2005</p>
                  </div>
                </div>
                <div className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-transform group-hover:translate-x-0.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </a>

              {/* LinkedIn Card */}
              <a
                href={resumeData.linkedin} target="_blank" rel="noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 flex items-center justify-between hover:border-[#0077B5]/50 hover:bg-white/[0.08] transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0077B5] shadow-md">
                    <Linkedin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-3xs font-bold uppercase tracking-widest text-slate-500">LinkedIn Network</p>
                    <p className="text-xs font-bold text-white mt-0.5">@kartik-raikar-kr</p>
                  </div>
                </div>
                <div className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-transform group-hover:translate-x-0.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </a>

              {/* Location & Availability HUD */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-mono font-bold uppercase tracking-widest text-slate-500">GEO LOCATION</span>
                    <MapPin className="h-3.5 w-3.5 text-rose-400" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-white">{resumeData.location}</p>
                  <p className="text-xxs font-mono text-slate-500 mt-1">15.8497° N, 74.4977° E</p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-mono font-bold uppercase tracking-widest text-slate-500">AVAILABILITY</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-emerald-400">Open for AI/ML Roles</p>
                  <p className="text-xxs text-slate-400 mt-1">Full-Time · Remote · Onsite</p>
                </div>
              </div>
            </div>

            {/* Quick draft invite */}
            <a
              href={`mailto:${resumeData.email}?subject=AI%20Engineering%20Opportunity%20-%20Kartik%20Raikar&body=Hello%20Kartik,%0D%0A%0D%0AI%20reviewed%20your%20Atlas%20AI%20Resume%20portal%20and%20was%20highly%20impressed%20with%20your%20work%20on%20NumPyGPT%20and%20the%20RAG%20Hallucination%20Auditor.%20I%20would%20love%20to%20schedule%20a%20conversation.%0D%0A%0D%0ABest%20regards,%0D%0A[Your%20Name]%0D%0A[Company]`}
              className="flex items-center justify-center space-x-2 w-full rounded-2xl bg-gradient-to-r from-[#1B6B93] to-[#4FC0D0] hover:opacity-90 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1B6B93]/20 transition"
            >
              <Send className="h-4 w-4" />
              <span>Draft Recruiter Invitation via Email</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CertIssuerBadge ──────────────────────────────────────────────────
function CertIssuerBadge({ issuerKey, brandColor }: { issuerKey: string; brandColor: string }) {
  const base = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md text-white font-black text-xs";
  switch (issuerKey) {
    case "oracle":
      return (
        <div className={base} style={{ background: brandColor }}>
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M16.5 4H7.5C3.36 4 0 7.36 0 11.5s3.36 7.5 7.5 7.5h9c4.14 0 7.5-3.36 7.5-7.5S20.64 4 16.5 4zm-.18 11.52H7.68c-2.21 0-4-1.79-4-4s1.79-4 4-4h8.64c2.21 0 4 1.79 4 4s-1.79 4-4 4z" />
          </svg>
        </div>
      );
    case "aws":
      return (
        <div className={base} style={{ background: "#232F3E" }}>
          <span style={{ color: brandColor }} className="font-black text-[10px] tracking-tight">AWS</span>
        </div>
      );
    case "microsoft":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-md border border-white/20">
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path fill="#F25022" d="M1 1h10v10H1z" />
            <path fill="#7FBA00" d="M13 1h10v10H13z" />
            <path fill="#00A4EF" d="M1 13h10v10H1z" />
            <path fill="#FFB900" d="M13 13h10v10H13z" />
          </svg>
        </div>
      );
    case "ibm":
      return <div className={base} style={{ background: brandColor }}>IBM</div>;
    case "cisco":
      return (
        <div className={base} style={{ background: brandColor }}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 14v4M8 11v7M12 8v10M16 11v7M20 14v4" />
          </svg>
        </div>
      );
    case "deloitte":
      return (
        <div className={`${base} bg-black border border-white/15`}>
          D<span style={{ color: brandColor }}>.</span>
        </div>
      );
    case "tata":
      return <div className={base} style={{ background: brandColor }}>TATA</div>;
    case "tcs":
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-white/20 shadow-md font-black text-[10px]">
          <span style={{ color: brandColor }}>tcs</span>
          <span className="text-black">iON</span>
        </div>
      );
    default:
      return (
        <div className={base} style={{ background: brandColor }}>⚡</div>
      );
  }
}
