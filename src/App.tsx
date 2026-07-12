/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import PDFViewer from "./components/PDFViewer";
import Dashboard from "./components/Dashboard";
import DriveExplorer from "./components/DriveExplorer";
import Chatbot from "./components/Chatbot";
import { Compass } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<"pdf" | "dashboard" | "drive">("pdf");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Persist dark mode: check localStorage first, then OS preference
    const saved = localStorage.getItem("atlas-dark-mode");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [viewKey, setViewKey] = useState<number>(0); // triggers re-animation on view switch

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem("atlas-dark-mode", String(isDarkMode));
  }, [isDarkMode]);

  // Splash screen auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Core tracking mechanism
  const trackAction = async (event: string, meta: any = {}) => {
    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, ...meta })
      });
    } catch (e) {
      // Fail silently to avoid interrupting recruiter experience
      console.warn("Analytics tracking failure:", e);
    }
  };

  // Track initial visit and log active session metrics
  useEffect(() => {
    trackAction("visit");

    // Track active session duration (reporting every 30s)
    const interval = setInterval(() => {
      trackAction("time_spent", { seconds: 30 });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle Ask AI button on project cards
  const handleAskAIAboutProject = (projectTitle: string) => {
    trackAction("ask_ai_trigger", { item: projectTitle });
    setChatInitialQuery(`Explain Kartik's "${projectTitle}" project in detail and tell me why it stands out.`);
    setIsChatOpen(true);
  };

  // Handle view switch with animation key
  const handleViewChange = (view: "pdf" | "dashboard" | "drive") => {
    setCurrentView(view);
    setViewKey(prev => prev + 1);
  };

  return (
    <>
      {/* ─── Premium Splash Screen ─── */}
      {showSplash && (
        <div
          id="splash-screen"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B1120]"
          style={{ animation: "splashFadeOut 2s ease-in-out forwards" }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#1B6B93]/15 blur-[120px]" />
          </div>

          {/* Logo + Text */}
          <div className="relative flex flex-col items-center" style={{ animation: "splashLogoEntry 0.8s ease-out forwards" }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B6B93] to-[#4FC0D0] shadow-2xl shadow-[#1B6B93]/30 mb-5">
              <Compass className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              Atlas <span className="text-[#4FC0D0]">AI</span>
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-1.5 tracking-widest uppercase">
              Loading Resume Intelligence
            </p>

            {/* Progress bar */}
            <div className="mt-6 w-48 h-[3px] bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1B6B93] to-[#4FC0D0] rounded-full"
                style={{ animation: "splashBarFill 1.6s ease-in-out forwards" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Application ─── */}
      <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isDarkMode 
          ? "bg-[#0B1120] text-slate-100 selection:bg-[#1B6B93]/35 selection:text-white" 
          : "bg-[#FAFBFD] text-slate-800 selection:bg-[#1B6B93]/20 selection:text-[#0E3A52]"
      }`}>
        {/* Visual background atmospheric lights */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
          <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-all duration-500 ${
            isDarkMode ? "bg-[#1B6B93]/10" : "bg-[#4FC0D0]/5"
          }`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-all duration-500 ${
            isDarkMode ? "bg-[#1B6B93]/8" : "bg-[#A2D2DF]/5"
          }`} />
        </div>

        {/* Main Glass Header */}
        <Navbar
          currentView={currentView}
          setCurrentView={handleViewChange}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onOpenChat={() => {
            setIsChatOpen(true);
            trackAction("navbar_ask_ai");
          }}
        />

        {/* Main Frame View layout */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 z-10 flex flex-col min-h-0">
          <div className="flex-1 min-h-[500px] md:min-h-[680px]">
            <div key={viewKey} className="h-full view-transition-enter">
              {currentView === "pdf" ? (
                <div className={`h-full w-full transition-all duration-500 ease-in-out ${
                  isChatOpen ? "lg:w-[calc(100%-390px)]" : "lg:w-full"
                }`}>
                  <PDFViewer
                    onAskAIAboutProject={handleAskAIAboutProject}
                    onTrackAction={trackAction}
                  />
                </div>
              ) : currentView === "dashboard" ? (
                <Dashboard
                  onAskAIAboutProject={handleAskAIAboutProject}
                  onTrackAction={trackAction}
                />
              ) : (
                <DriveExplorer
                  isDarkMode={isDarkMode}
                  onTrackAction={trackAction}
                />
              )}
            </div>
          </div>
        </main>

        {/* Bottom Status Bar */}
        <footer className={`h-8 border-t px-8 flex items-center justify-between text-[10px] font-semibold select-none z-10 shrink-0 transition-all ${
          isDarkMode 
            ? "bg-[#0B1120] border-slate-700/40 text-slate-500" 
            : "bg-white border-slate-200 text-slate-400 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]"
        }`}>
          <div className="flex gap-6 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              System Active
            </span>
            <span className="hidden sm:inline">Atlas AI Engine v2.0</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="hidden sm:inline font-mono text-[9px]">© {new Date().getFullYear()} Kartik Raikar</span>
            <span>Session Active</span>
          </div>
        </footer>

        {/* RAG Chat Assistant Floating Drawer */}
        <Chatbot
          isOpen={isChatOpen}
          setIsOpen={setIsChatOpen}
          initialQuery={chatInitialQuery}
          clearInitialQuery={() => setChatInitialQuery(undefined)}
          onTrackAction={trackAction}
          isDarkMode={isDarkMode}
        />
      </div>
    </>
  );
}
