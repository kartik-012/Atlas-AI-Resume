/**   
 * @license   
 * SPDX-License-Identifier: Apache-2.0 
 */ 
 
import { useState, useEffect, lazy, Suspense } from "react";  
import Navbar, { DashboardTabKey } from "./components/Navbar";
import RecruiterHero from "./components/RecruiterHero"; 
import PDFViewer from "./components/PDFViewer";
import Chatbot from "./components/Chatbot";
import { Compass, RefreshCw } from "lucide-react"; 

const Dashboard = lazy(() => import("./components/Dashboard"));
const DriveExplorer = lazy(() => import("./components/DriveExplorer")); 

export default function App() {
  const [currentView, setCurrentView] = useState<"pdf" | "dashboard" | "drive">("pdf");
  const [dashboardTab, setDashboardTab] = useState<DashboardTabKey>("projects");
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
    const timer = setTimeout(() => setShowSplash(false), 280);
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
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark("atlas_portal_ready");
    }
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

  // Handle direct resume PDF download
  const handleDownloadPDF = () => {
    trackAction("hero_download_resume");
    const link = document.createElement("a");
    link.href = "/resume.pdf";
    link.download = "Kartik_Raikar_Resume.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          style={{ animation: "splashFadeOut 0.35s ease-out forwards", pointerEvents: "none" }}
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
      <div className={`h-[100dvh] max-h-[100dvh] w-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 ${
        isDarkMode 
          ? "bg-[#080D1A] text-slate-100 selection:bg-[#1B6B93]/35 selection:text-white" 
          : "bg-[#FAFBFD] text-slate-800 selection:bg-[#1B6B93]/20 selection:text-[#0E3A52]"
      }`}>
        {/* Atmospheric ambient lights */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
          <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-all duration-500 animate-float-soft ${
            isDarkMode ? "bg-[#1B6B93]/15" : "bg-[#4FC0D0]/5"
          }`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-all duration-500 animate-float-soft delay-1000 ${
            isDarkMode ? "bg-[#4FC0D0]/10" : "bg-[#A2D2DF]/5"
          }`} />
        </div>

        {/* Top Navbar */}
        <div className="shrink-0 z-20">
          <Navbar
            currentView={currentView}
            setCurrentView={handleViewChange}
            activeDashboardTab={dashboardTab}
            onSelectDashboardTab={(tab) => {
              setDashboardTab(tab);
              handleViewChange("dashboard");
              trackAction("navbar_select_tab", { tab });
            }}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            onOpenChat={() => {
              setIsChatOpen(true);
              trackAction("navbar_ask_ai");
            }}
          />
          <RecruiterHero
            onAskAI={() => {
              setIsChatOpen(true);
              trackAction("hero_ask_ai");
            }}
            onDownloadResume={handleDownloadPDF}
            isChatOpen={isChatOpen}
          />
        </div>

        {/* Main Content Viewport: Perfectly fits screen height, NO window scrolling */}
        <main className="flex-1 w-full max-w-[1850px] mx-auto px-2 sm:px-4 py-2 z-10 flex flex-col min-h-0 overflow-hidden">
          <div key={viewKey} className="flex-1 flex flex-col min-h-0 overflow-hidden view-transition-enter">
            {currentView === "pdf" ? (
              /* Side-by-Side Dynamic Workspace (Resume adjusts smoothly when Chatbot opens) */
              <div className="flex-1 flex flex-row gap-3 h-full min-h-0 overflow-hidden">
                {/* Resume PDF Container (Adjusts width automatically without overlapping) */}
                <div className="h-full min-h-0 flex-1 flex flex-col transition-[max-width,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden">
                  <PDFViewer
                    onAskAIAboutProject={handleAskAIAboutProject}
                    onTrackAction={trackAction}
                    isChatOpen={isChatOpen}
                    onToggleChat={() => setIsChatOpen(prev => !prev)}
                  />
                </div>

                {/* Right Side Docked Chatbot Panel (Desktop: Smooth expansion without layout jump) */}
                <div
                  className={`hidden lg:flex flex-col h-full min-h-0 shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isChatOpen
                      ? "w-[390px] xl:w-[420px] opacity-100 translate-x-0"
                      : "w-0 opacity-0 translate-x-6 pointer-events-none overflow-hidden"
                  }`}
                  aria-hidden={!isChatOpen}
                >
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
              </div>
            ) : currentView === "dashboard" ? (
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <Suspense fallback={
                  <div className="flex h-64 items-center justify-center text-cyan-400 gap-2 font-mono text-xs">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading interactive dashboard & verifiers...</span>
                  </div>
                }>
                  <Dashboard
                    initialTab={dashboardTab}
                    onTabChange={setDashboardTab}
                    onAskAIAboutProject={handleAskAIAboutProject}
                    onTrackAction={trackAction}
                  />
                </Suspense>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <Suspense fallback={
                  <div className="flex h-64 items-center justify-center text-cyan-400 gap-2 font-mono text-xs">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading Drive File Explorer...</span>
                  </div>
                }>
                  <DriveExplorer
                    isDarkMode={isDarkMode}
                    onTrackAction={trackAction}
                    onViewChange={handleViewChange}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </main>

        {/* Bottom Status Bar */}
        <footer className={`h-8 border-t px-4 flex items-center justify-between text-xs font-medium select-none z-20 shrink-0 transition-all ${
          isDarkMode 
            ? "bg-[#080D1A]/95 border-white/[0.08] text-slate-300 backdrop-blur-md" 
            : "bg-white/95 border-slate-200 text-slate-600 backdrop-blur-md shadow-[0_-1px_3px_rgba(0,0,0,0.02)]"
        }`}>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Atlas AI Engine v2.4.0
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-300">Gemini 2.5 Flash Connected</span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="hidden md:inline text-cyan-400 font-mono">84 Verified Intents</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="hidden sm:inline font-mono text-xs text-slate-400">
              © {new Date().getFullYear()} Kartik Raikar • 8.50 CGPA • Jain College of Engineering
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wider ${
              isChatOpen 
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" 
                : "bg-white/5 text-slate-300 border border-white/10"
            }`}>
              {isChatOpen ? "DUAL VIEW" : "FULL RESUME"}
            </span>
          </div>
        </footer>

        {/* Mobile Floating / Bottom-Sheet Chatbot (Always accessible on touch viewports < lg) */}
        <div className="lg:hidden">
          <Chatbot
            isOpen={isChatOpen}
            setIsOpen={setIsChatOpen}
            initialQuery={chatInitialQuery}
            clearInitialQuery={() => setChatInitialQuery(undefined)}
            onTrackAction={trackAction}
            isDarkMode={isDarkMode}
            isEmbedded={false}
          />
        </div>

        {/* Desktop Floating Chatbot (Rendered when docked side-by-side mode is collapsed or in other views) */}
        {(!isChatOpen || currentView !== "pdf") && (
          <div className="hidden lg:block">
            <Chatbot
              isOpen={isChatOpen}
              setIsOpen={setIsChatOpen}
              initialQuery={chatInitialQuery}
              clearInitialQuery={() => setChatInitialQuery(undefined)}
              onTrackAction={trackAction}
              isDarkMode={isDarkMode}
              isEmbedded={false}
            />
          </div>
        )}
      </div>
    </>
  );
}
