/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Github, Linkedin, ExternalLink, Sun, Moon, FileText, LayoutDashboard, HardDrive, MessageCircle, Compass, Menu, X } from "lucide-react";
import { resumeData } from "../data/resumeData";

interface NavbarProps {
  currentView: "pdf" | "dashboard" | "drive";
  setCurrentView: (view: "pdf" | "dashboard" | "drive") => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onOpenChat: () => void;
}

const NAV_TABS = [
  { key: "pdf" as const, label: "Resume", icon: FileText, coord: "48.2°N" },
  { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard, coord: "13.0°E" },
  { key: "drive" as const, label: "Drive", icon: HardDrive, coord: "77.6°E" },
];

const STATUS_MESSAGES = [
  "Available for Opportunities",
  "AI & ML Engineer",
  "Full-Stack Developer",
  "Open to Collaborate",
];

export default function Navbar({
  currentView,
  setCurrentView,
  isDarkMode,
  setIsDarkMode,
  onOpenChat
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [statusFading, setStatusFading] = useState(false);

  // Rotate status messages every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusFading(true);
      setTimeout(() => {
        setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
        setStatusFading(false);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
        isDarkMode
          ? "bg-[#0B1120]/90 text-slate-100"
          : "bg-[#FAFBFD]/90 text-slate-800"
      }`}
      style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
    >
      {/* Top accent line — a subtle gradient "route line" across the full width */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: "linear-gradient(90deg, #1B6B93 0%, #4FC0D0 35%, #A2D2DF 65%, #1B6B93 100%)",
        }}
      />

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* ── Wordmark ── */}
        <div className="flex items-center space-x-2.5 select-none">
          {/* Compass icon as brand mark */}
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isDarkMode
                ? "bg-[#1B6B93]/20 text-[#4FC0D0]"
                : "bg-[#1B6B93]/10 text-[#1B6B93]"
            }`}
          >
            <Compass className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-display font-bold tracking-tight leading-tight">
              Atlas
              <span className={`ml-1 font-semibold ${isDarkMode ? "text-[#4FC0D0]" : "text-[#1B6B93]"}`}>
                AI
              </span>
            </span>
            <span
              className={`text-[10px] font-mono tracking-wider leading-none transition-all duration-300 ${
                statusFading ? "opacity-0 translate-y-0.5" : "opacity-100 translate-y-0"
              } ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
            >
              {STATUS_MESSAGES[statusIndex].toUpperCase()}
            </span>
          </div>
        </div>

        {/* ── Navigation Tabs (desktop) — styled as waypoints on a route ── */}
        <nav className="hidden sm:flex items-center" role="navigation" aria-label="Main navigation">
          <div className="relative flex items-center">
            {/* Connecting route line behind the tabs */}
            <div
              className={`absolute top-1/2 left-4 right-4 h-[1px] -translate-y-1/2 ${
                isDarkMode ? "bg-slate-700/60" : "bg-slate-200"
              }`}
              aria-hidden="true"
            />

            {NAV_TABS.map((tab, index) => {
              const isActive = currentView === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setCurrentView(tab.key)}
                  className={`
                    relative flex items-center space-x-1.5 px-4 py-1.5 text-[13px] font-semibold
                    rounded-md transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2
                    ${isDarkMode ? "focus-visible:outline-[#4FC0D0]" : "focus-visible:outline-[#1B6B93]"}
                    ${index > 0 ? "ml-1" : ""}
                    ${isActive
                      ? isDarkMode
                        ? "bg-[#1B6B93]/20 text-[#4FC0D0] shadow-sm shadow-[#1B6B93]/10"
                        : "bg-white text-[#1B6B93] shadow-sm shadow-slate-200/60 ring-1 ring-slate-200/60"
                      : isDarkMode
                        ? "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                    }
                  `}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Waypoint dot */}
                  <span
                    className={`absolute -bottom-[13px] left-1/2 -translate-x-1/2 transition-all duration-200 ${
                      isActive
                        ? `h-1.5 w-1.5 rounded-full ${isDarkMode ? "bg-[#4FC0D0]" : "bg-[#1B6B93]"}`
                        : `h-1 w-1 rounded-full ${isDarkMode ? "bg-slate-600" : "bg-slate-300"}`
                    }`}
                    aria-hidden="true"
                  />
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {/* Coordinate micro-label on active tab */}
                  {isActive && (
                    <span
                      className={`hidden lg:inline text-[9px] font-mono tracking-wide ml-1 ${
                        isDarkMode ? "text-[#4FC0D0]/50" : "text-[#1B6B93]/40"
                      }`}
                    >
                      {tab.coord}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Right Actions ── */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Ask AI trigger */}
          <button
            onClick={onOpenChat}
            className={`
              group flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold
              transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2
              ${isDarkMode
                ? "bg-[#1B6B93] hover:bg-[#1B6B93]/80 text-white focus-visible:outline-[#4FC0D0] shadow-md shadow-[#1B6B93]/20"
                : "bg-[#1B6B93] hover:bg-[#164E6B] text-white focus-visible:outline-[#1B6B93] shadow-md shadow-[#1B6B93]/15"
              }
            `}
            id="navbar-ask-ai"
            title="Ask AI (⌘K)"
          >
            <MessageCircle className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          {/* Divider */}
          <div className={`hidden sm:block h-5 w-[1px] mx-1 ${isDarkMode ? "bg-slate-700/60" : "bg-slate-200"}`} aria-hidden="true" />

          {/* Social Icons */}
          <div className="hidden sm:flex items-center space-x-0.5">
            <a
              href={resumeData.github}
              target="_blank"
              rel="noreferrer"
              className={`rounded-md p-1.5 transition-all duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isDarkMode
                  ? "text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] focus-visible:outline-[#4FC0D0]"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-[#1B6B93]"
              }`}
              title="GitHub"
            >
              <Github className="h-[18px] w-[18px]" />
            </a>
            <a
              href={resumeData.linkedin}
              target="_blank"
              rel="noreferrer"
              className={`rounded-md p-1.5 transition-all duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isDarkMode
                  ? "text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] focus-visible:outline-[#4FC0D0]"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-[#1B6B93]"
              }`}
              title="LinkedIn"
            >
              <Linkedin className="h-[18px] w-[18px]" />
            </a>
            <a
              href={resumeData.portfolio}
              target="_blank"
              rel="noreferrer"
              className={`rounded-md p-1.5 transition-all duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isDarkMode
                  ? "text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] focus-visible:outline-[#4FC0D0]"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-[#1B6B93]"
              }`}
              title="Portfolio"
            >
              <ExternalLink className="h-[18px] w-[18px]" />
            </a>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`rounded-md p-1.5 transition-all duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isDarkMode
                ? "text-slate-400 hover:text-amber-300 hover:bg-white/[0.06] focus-visible:outline-[#4FC0D0]"
                : "text-slate-400 hover:text-[#1B6B93] hover:bg-slate-100 focus-visible:outline-[#1B6B93]"
            }`}
            title="Toggle theme"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`sm:hidden rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isDarkMode
                ? "text-slate-400 hover:text-white hover:bg-white/[0.06] focus-visible:outline-[#4FC0D0]"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-[#1B6B93]"
            }`}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile navigation drawer ── */}
      <div
        className={`sm:hidden border-t overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } ${isDarkMode ? "border-slate-700/60 bg-[#0B1120]" : "border-slate-200 bg-white"}`}
      >
        <nav className="flex flex-col p-2 space-y-0.5" aria-label="Mobile navigation">
          {NAV_TABS.map((tab) => {
            const isActive = currentView === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setCurrentView(tab.key);
                  setMobileMenuOpen(false);
                }}
                className={`
                  flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold
                  transition-colors focus-visible:outline-2 focus-visible:outline-offset-2
                  ${isDarkMode ? "focus-visible:outline-[#4FC0D0]" : "focus-visible:outline-[#1B6B93]"}
                  ${isActive
                    ? isDarkMode
                      ? "bg-[#1B6B93]/15 text-[#4FC0D0]"
                      : "bg-[#1B6B93]/5 text-[#1B6B93]"
                    : isDarkMode
                      ? "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span
                  className={`ml-auto text-[10px] font-mono tracking-wider ${
                    isDarkMode ? "text-slate-600" : "text-slate-300"
                  }`}
                >
                  {tab.coord}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Mobile social links */}
        <div className={`flex items-center justify-center space-x-2 px-3 py-2.5 border-t ${
          isDarkMode ? "border-slate-700/60" : "border-slate-100"
        }`}>
          <a href={resumeData.github} target="_blank" rel="noreferrer" className={`p-2 rounded-md ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>
            <Github className="h-5 w-5" />
          </a>
          <a href={resumeData.linkedin} target="_blank" rel="noreferrer" className={`p-2 rounded-md ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>
            <Linkedin className="h-5 w-5" />
          </a>
          <a href={resumeData.portfolio} target="_blank" rel="noreferrer" className={`p-2 rounded-md ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
      </div>
    </header>
  );
}
