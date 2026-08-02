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
  const containerRef = useRef<HTMLDivElement>(null);

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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E1726]/90 px-4 py-2.5 border-b border-cyan-500/20 backdrop-blur-md shrink-0">
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
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950/60 text-[#4FC0D0] border border-cyan-500/30 font-semibold">
                ATS Verified
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Kartik Raikar • AI & ML Systems Engineer (8.5 CGPA)
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
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
            className="flex items-center space-x-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white px-3 py-1.5 text-xs font-semibold transition-all"
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 rounded-lg bg-[#1B6B93] hover:bg-[#164E6B] text-white px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-md shadow-[#1B6B93]/20"
            title="Download PDF"
            id="pdf-download"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-black/30 border border-white/10 text-slate-400 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* PDF Embed */}
      <div className="flex-1 min-h-0 h-full bg-[#0B1120] relative" id="pdf-paper-canvas">
        <iframe
          src={`${RESUME_URL}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
          title="Kartik Raikar Resume"
          className="w-full h-full border-0 block absolute inset-0"
          aria-label="Kartik Raikar's Resume PDF"
        />
      </div>
    </div>
  );
}
