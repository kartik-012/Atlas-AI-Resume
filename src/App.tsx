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
    const saved = localStorage.getItem("atlas-dark-mode");
    if (saved !== null) return saved === "true";
    return true;
  });
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true); // Open chatbot by default on open!
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [viewKey, setViewKey] = useState<number>(0);

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem("atlas-dark-mode", String(isDarkMode));
  }, [isDarkMode]);

  // Splash screen auto-dismiss (quick fade in 900ms)
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 900);
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
      console.warn("Analytics tracking failure:", e);
    }
  };

  // Track initial visit and log active session metrics
  useEffect(() => {
    trackAction("visit");
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
      {/* ─── Fast Splash Screen ─── */}
      {showSplash && (
        <div
          id="splash-screen"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B1120] transition-opacity duration-500"
          style={{ animation: "splashFadeOut 0.9s ease-in-out forwards" }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#1B6B93]/20 blur-[120px]" />
          </div>

          <div className="relative flex flex-col items-center" style={{ animation: "splashLogoEntry 0.4s ease-out forwards" }}>
            <div className="flex h-15 w-15 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B6B93] to-[#4FC0D0] shadow-2xl shadow-[#1B6B93]/40 mb-3.5 border border-cyan-400/30">
              <Compass className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">
              Atlas <span className="text-[#4FC0D0]">AI Resume</span>
            </h1>
            <p className="text-[11px] font-mono text-cyan-400/80 mt-1 tracking-widest uppercase">
              Resume + Interactive AI Assistant
            </p>
            <div className="mt-4 w-44 h-[2.5px] bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1B6B93] to-[#4FC0D0] rounded-full"
                style={{ animation: "splashBarFill 0.8s ease-in-out forwards" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Viewport (Fixed 100vh, NO outer page scrollbar) ─── */}
      <div className={`h-screen max-h-screen w-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 ${
        isDarkMode 
          ? "bg-[#080D1A] text-slate-100 selection:bg-[#1B6B93]/35 selection:text-white" 
          : "bg-[#FAFBFD] text-slate-800 selection:bg-[#1B6B93]/20 selection:text-[#0E3A52]"
      }`}>
        {/* Atmospheric ambient lights */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
          <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-all duration-500 ${
            isDarkMode ? "bg-[#1B6B93]/15" : "bg-[#4FC0D0]/5"
          }`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-all duration-500 ${
            isDarkMode ? "bg-[#4FC0D0]/10" : "bg-[#A2D2DF]/5"
          }`} />
        </div>

        {/* Top Navbar */}
        <div className="shrink-0 z-20">
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
        </div>

        {/* Main Content Viewport: Perfectly fits screen height, NO window scrolling */}
        <main className="flex-1 w-full max-w-[1850px] mx-auto px-2 sm:px-4 py-2 z-10 flex flex-col min-h-0 overflow-hidden">
          <div key={viewKey} className="flex-1 flex flex-col min-h-0 overflow-hidden view-transition-enter">
            {currentView === "pdf" ? (
              /* Side-by-Side Dynamic Workspace (Resume adjusts smoothly when Chatbot opens) */
              <div className="flex-1 flex flex-row gap-3 h-full min-h-0 overflow-hidden">
                {/* Resume PDF Container (Adjusts width automatically without overlapping) */}
                <div className={`h-full min-h-0 flex flex-col transition-all duration-300 ease-in-out ${
                  isChatOpen 
                    ? "w-full lg:w-[calc(100%-390px)] xl:w-[calc(100%-420px)]" 
                    : "w-full"
                }`}>
                  <PDFViewer
                    onAskAIAboutProject={handleAskAIAboutProject}
                    onTrackAction={trackAction}
                    isChatOpen={isChatOpen}
                    onToggleChat={() => setIsChatOpen(prev => !prev)}
                  />
                </div>

                {/* Right Side Docked Chatbot Panel (Desktop: Side-by-Side, NOT covering Resume) */}
                {isChatOpen && (
                  <div className="hidden lg:flex w-[380px] xl:w-[410px] h-full min-h-0 shrink-0 flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                    <Chatbot
                      isOpen={isChatOpen}
                      setIsOpen={setIsChatOpen}
                      initialQuery={chatInitialQuery}
                      clearInitialQuery={() => setChatInitialQuery(undefined)}
                      onTrackAction={trackAction}
                      isDarkMode={isDarkMode}
                      isEmbedded={true}
                    />
                  </div>
                )}
              </div>
            ) : currentView === "dashboard" ? (
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <Dashboard
                  onAskAIAboutProject={handleAskAIAboutProject}
                  onTrackAction={trackAction}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <DriveExplorer
                  isDarkMode={isDarkMode}
                  onTrackAction={trackAction}
                  onViewChange={handleViewChange}
                />
              </div>
            )}
          </div>
        </main>

        {/* Bottom Status Bar */}
        <footer className={`h-6.5 border-t px-4 flex items-center justify-between text-[10px] font-semibold select-none z-20 shrink-0 transition-all ${
          isDarkMode 
            ? "bg-[#080D1A] border-slate-800/80 text-slate-400" 
            : "bg-white border-slate-200 text-slate-500 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]"
        }`}>
          <div className="flex gap-4 uppercase tracking-widest text-[9px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Atlas AI Active
            </span>
            <span className="hidden sm:inline text-slate-500">324 Master Intents Loaded</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="hidden sm:inline font-mono text-[9px] text-slate-500">
              © {new Date().getFullYear()} Kartik Raikar • 8.5 CGPA • Jain College of Engineering
            </span>
            <span className="text-[#4FC0D0] font-mono text-[9px]">
              {isChatOpen ? "Dual View Active" : "Resume Full View"}
            </span>
          </div>
        </footer>

        {/* Mobile / Floating Chatbot (For mobile devices or when closed on desktop) */}
        {(!isChatOpen || currentView !== "pdf") && (
          <Chatbot
            isOpen={isChatOpen}
            setIsOpen={setIsChatOpen}
            initialQuery={chatInitialQuery}
            clearInitialQuery={() => setChatInitialQuery(undefined)}
            onTrackAction={trackAction}
            isDarkMode={isDarkMode}
            isEmbedded={false}
          />
        )}
      </div>
    </>
  );
}
