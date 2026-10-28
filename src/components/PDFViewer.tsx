/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Download, Maximize2, Minimize2, FileText, ExternalLink, Bot, Sparkles, MessageSquare } from "lucide-react";

interface PDFViewerProps {
  onAskAIAboutProject?: (projectTitle: string) => void;
  onTrackAction: (event: string, meta?: any) => void;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
}

const RESUME_URL = "/resume.pdf";
const RESUME_FILENAME = "Kartik_Raikar_Resume.pdf";

export default function PDFViewer({ 
  onTrackAction,
  isChatOpen = true,
  onToggleChat
}: PDFViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const jumpToPage = (pageNum: number) => {
    setActivePage(pageNum);
    onTrackAction(`pdf_jump_page_${pageNum}`);
  };

  // Track Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
      onTrackAction("fullscreen_enter");
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Download the actual PDF file
  const handleDownload = () => {
    onTrackAction("download");
    const link = document.createElement("a");
    link.href = RESUME_URL;
    link.download = RESUME_FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open in new browser tab
  const handleOpenTab = () => {
    onTrackAction("open_pdf_tab");
    window.open(RESUME_URL, "_blank", "noreferrer");
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col h-full w-full rounded-2xl bg-[#0B1120] border border-[#1B6B93]/25 overflow-hidden transition-all outline-none shadow-2xl ${
        isFullscreen ? "p-0 rounded-none border-0" : ""
      }`}
      id="pdf-viewer-root"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E1726]/90 px-4 py-2.5 border-b border-cyan-500/20 backdrop-blur-md shrink-0 shadow-lg shadow-black/20">
        {/* Left: File info */}
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B6B93]/25 text-[#4FC0D0] border border-cyan-500/30">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-200 tracking-tight">
                {RESUME_FILENAME}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm shadow-emerald-500/15">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ATS 100% Verified
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Kartik Raikar • AI Engineer (8.50 CGPA • SPARK IIT Intern • 9 Certs)
            </span>
          </div>
        </div>

        {/* Center/Right: Page Switcher & Actions */}
        <div className="flex items-center space-x-2">
          {/* Quick Page Jump Pills */}
          <div className="hidden md:flex items-center space-x-1 rounded-lg bg-black/40 border border-cyan-500/20 p-1">
            <button
              onClick={() => jumpToPage(1)}
              className={`px-2.5 py-1 rounded text-3xs font-mono font-bold transition-all ${
                activePage === 1
                  ? "bg-cyan-500/20 text-[#4FC0D0] border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Page 1: Summary, Skills, SPARK IIT Experience, AIOps RCA, VersionRAG"
            >
              Page 1 (Experience)
            </button>
            <button
              onClick={() => jumpToPage(2)}
              className={`px-2.5 py-1 rounded text-3xs font-mono font-bold transition-all ${
                activePage === 2
                  ? "bg-cyan-500/20 text-[#4FC0D0] border border-cyan-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Page 2: GitHub MCP, ApexRAG, 9 Certifications, Leadership, LeetCode"
            >
              Page 2 (Credentials)
            </button>
          </div>
          {/* AI Assistant Toggle Button (Desktop & Mobile) */}
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 border ${
                isChatOpen 
                  ? "bg-cyan-950/40 text-cyan-300 border-cyan-500/30 hover:bg-cyan-900/50" 
                  : "bg-gradient-to-r from-[#1B6B93] to-[#4FC0D0] text-white border-transparent shadow-md shadow-[#1B6B93]/30 hover:scale-105"
              }`}
              title={isChatOpen ? "Hide AI Assistant Panel" : "Show AI Assistant Panel"}
            >
              <Bot className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {isChatOpen ? "Chatbot Active" : "Ask AI Chatbot"}
              </span>
              {!isChatOpen && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
              )}
            </button>
          )}

          <button
            onClick={handleOpenTab}
            className="flex items-center space-x-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white px-3 py-1.5 text-xs font-semibold transition-all hover:scale-102 active:scale-98 cursor-pointer"
            title="Open PDF in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open</span>
          </button>

          <button
            onClick={handleDownload}
            className="group relative flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-[#1B6B93] to-[#4FC0D0] hover:from-[#164E6B] hover:to-[#38A8B8] text-white px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-102 active:scale-95 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 overflow-hidden cursor-pointer"
            title="Download PDF Copy"
            id="pdf-download"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-black/30 border border-white/10 hover:border-cyan-500/30 text-slate-400 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* PDF Embed */}
      <div className="flex-1 min-h-0 h-full bg-[#0B1120] relative" id="pdf-paper-canvas">
        <iframe
          src={`${RESUME_URL}#page=${activePage}&toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
          title="Kartik Raikar Resume"
          className="w-full h-full border-0 block absolute inset-0"
          aria-label="Kartik Raikar's Resume PDF"
        />
      </div>
    </div>
  );
}
