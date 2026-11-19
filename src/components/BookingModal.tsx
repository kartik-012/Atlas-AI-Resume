/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { X, Calendar, Clock, ExternalLink, Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { resumeData } from "../data/resumeData";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export default function BookingModal({
  isOpen,
  onClose,
  isDarkMode = true,
}: BookingModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const calUrl = "https://cal.com/kartik-raikar/15min";

  // Handle global Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in-50 duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDarkMode
            ? "bg-[#0B1120] border-cyan-500/30 text-white shadow-cyan-950/50"
            : "bg-white border-slate-200 text-slate-900 shadow-xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Top Accent Strip */}
        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-[#1B6B93] via-[#4FC0D0] to-[#A2D2DF]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 select-none">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 id="booking-modal-title" className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Schedule a 15-Min Technical Intro</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <Clock className="h-2.5 w-2.5" /> 15m Quick Chat
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct with Kartik Raikar • AI Engineer &amp; LLM Systems Specialist
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={calUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition text-xs flex items-center gap-1 font-mono"
              title="Open full booking link in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open in Tab</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cal.com Embed Iframe / Direct Schedule Surface */}
        <div className="relative flex-1 min-h-[440px] sm:min-h-[480px] bg-black/40 overflow-hidden">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-mono">
              <div className="h-6 w-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading Cal.com calendar availability...</span>
            </div>
          )}
          <iframe
            src={`${calUrl}?theme=dark&layout=month_view`}
            title="Book a meeting with Kartik Raikar"
            className="w-full h-full border-0 min-h-[440px] sm:min-h-[480px]"
            onLoad={() => setIframeLoaded(true)}
            allow="camera; microphone; autoplay; clipboard-write"
          />
        </div>

        {/* Fallback Direct Contact Footer Bar */}
        <div className="px-4 py-2.5 bg-black/60 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xxs font-mono text-slate-300">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${resumeData.email}`}
              className="flex items-center gap-1 hover:text-cyan-300 transition"
              title="Direct Email"
            >
              <Mail className="h-3 w-3 text-cyan-400" />
              <span>{resumeData.email}</span>
            </a>
            <a
              href={`tel:${resumeData.phone}`}
              className="flex items-center gap-1 hover:text-cyan-300 transition"
              title="Direct Phone / WhatsApp"
            >
              <Phone className="h-3 w-3 text-emerald-400" />
              <span>{resumeData.phone}</span>
            </a>
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              <MapPin className="h-3 w-3 text-purple-400" />
              <span>{resumeData.location} (Remote / Relocation)</span>
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
            <CheckCircle2 className="h-3 w-3" />
            <span>Immediate Availability</span>
          </span>
        </div>
      </div>
    </div>
  );
}
