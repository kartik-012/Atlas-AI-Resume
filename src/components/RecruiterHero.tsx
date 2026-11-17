/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, Download, MessageSquare, Award, Brain, Code2, GraduationCap } from "lucide-react";

interface RecruiterHeroProps {
  onAskAI: () => void;
  onDownloadResume: () => void;
  isChatOpen: boolean;
}

export default function RecruiterHero({
  onAskAI,
  onDownloadResume,
  isChatOpen,
}: RecruiterHeroProps) {
  return (
    <header className="w-full border-b border-white/[0.08] bg-[#090D16]/90 backdrop-blur-md px-4 sm:px-6 py-3 shrink-0 select-none transition-colors" role="banner">
      <div className="max-w-[1850px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Candidate Identity & Target Role */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white font-display">
                Kartik Raikar
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                AI &amp; Generative AI Engineer
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              B.E. Computer Science (AI &amp; ML) • 8.50 CGPA • Jain College of Engineering, Belagavi
            </p>
          </div>
        </div>

        {/* Center: 3 Real Proof Points */}
        <div className="hidden xl:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300">
            <Brain className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>
              <strong className="text-white font-bold">SPARK IIT</strong> Research (-64.3% RMSE)
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300">
            <Award className="h-4 w-4 text-purple-400 shrink-0" />
            <span>
              <strong className="text-white font-bold">9 Industry Certs</strong> (Oracle, AWS, Azure)
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300">
            <Code2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white font-bold">104 LeetCode</strong> Algorithmic Solves
            </span>
          </div>
        </div>

        {/* Right: 2 Primary Recruiter Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onAskAI}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer min-h-[40px] ${
              isChatOpen
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 hover:bg-cyan-500/25"
                : "bg-gradient-to-r from-[#1B6B93] to-[#00D2EE] text-white hover:brightness-110 shadow-md shadow-cyan-500/20 active:scale-98"
            }`}
            title="Chat with Atlas AI about Kartik's credentials"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{isChatOpen ? "Atlas AI Active" : "Ask Atlas AI"}</span>
          </button>

          <button
            onClick={onDownloadResume}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-cyan-500/30 transition-all duration-200 active:scale-98 cursor-pointer min-h-[40px]"
            title="Download high-fidelity printable PDF copy"
          >
            <Download className="h-4 w-4 text-slate-300" />
            <span>Download Resume</span>
          </button>
        </div>
      </div>
    </header>
  );
}
