/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, Search, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, Check, Copy, Sparkles, FileText, Phone, Mail, Github, Linkedin, Globe, Compass } from "lucide-react";
import { resumeData } from "../data/resumeData";

interface PDFViewerProps {
  onAskAIAboutProject: (projectTitle: string) => void;
  onTrackAction: (event: string, meta?: any) => void;
}

export default function PDFViewer({ onAskAIAboutProject, onTrackAction }: PDFViewerProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [totalPages] = useState<number>(2);
  const [pageTransition, setPageTransition] = useState<"none" | "left" | "right">("none");

  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 15, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 15, 70));
  const handleResetZoom = () => setZoom(100);

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

  // Page change with animation
  const handlePageChange = useCallback((p: number) => {
    if (p === currentPage || p < 1 || p > totalPages) return;
    const direction = p > currentPage ? "left" : "right";
    setPageTransition(direction);
    setTimeout(() => {
      setCurrentPage(p);
      setPageTransition("none");
      onTrackAction("page_view", { page: p });
    }, 200);
  }, [currentPage, totalPages, onTrackAction]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if this component's container is focused or in fullscreen
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        handlePageChange(Math.max(currentPage - 1, 1));
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        handlePageChange(Math.min(currentPage + 1, totalPages));
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (container) {
        container.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [currentPage, totalPages, handlePageChange]);

  // Copy handler
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(label);
    setTimeout(() => setIsCopied(null), 2000);
    onTrackAction("copy_text", { label });
  };

  // Printable layout download
  const handleDownloadPDF = () => {
    onTrackAction("download");
    // Standard professional print dialog setup
    window.print();
  };

  // Highlight matches inside texts
  const highlight = (text: string) => {
    if (!searchQuery) return <span>{text}</span>;
    const cleanSearch = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${cleanSearch})`, "gi");
    const parts = text.split(regex);
    if (parts.length === 1) return <span>{text}</span>;

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-300 text-slate-900 font-bold px-0.5 rounded-sm animate-pulse">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Page transition class
  const getPageTransitionClass = () => {
    if (pageTransition === "left") return "opacity-0 -translate-x-4";
    if (pageTransition === "right") return "opacity-0 translate-x-4";
    return "opacity-100 translate-x-0";
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative flex flex-col h-full w-full rounded-2xl bg-[#0F0F12] border border-white/10 overflow-hidden transition-all outline-none ${
        isFullscreen ? "p-4" : ""
      }`}
      id="pdf-viewer-root"
    >
      {/* PDF Tool Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 px-4 py-2 border-b border-white/5 backdrop-blur-md">
        {/* Left Controls: Pages & Document Info */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 rounded-lg bg-black/30 px-2 py-1 border border-white/10">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
              title="Previous Page (←)"
              id="pdf-prev-page"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="text-xs font-semibold text-slate-300 min-w-14 text-center select-none">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
              title="Next Page (→)"
              id="pdf-next-page"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-medium text-slate-500 tracking-tight">
              kartik_resume.pdf
            </span>
            <span className="text-3xs text-slate-600 font-mono">• Updated Jul 2026</span>
          </div>
        </div>

        {/* Middle Controls: Search & Zoom */}
        <div className="flex items-center gap-3">
          {/* Zooming widgets */}
          <div className="flex items-center space-x-1 rounded-lg bg-black/30 p-1 border border-white/10">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition"
              title="Zoom Out (−)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="text-xxs font-bold text-slate-300 px-1.5 min-w-10 text-center hover:text-[#4FC0D0] transition"
              title="Reset Zoom"
            >
              {zoom}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search resume..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 sm:w-48 rounded-lg bg-black/30 py-1.5 pl-8 pr-3 text-xs text-white border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#1B6B93] placeholder:text-slate-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xxs bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded text-slate-300 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Extra Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-1.5 rounded-lg bg-[#1B6B93] hover:bg-[#164E6B] text-white px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-md shadow-[#1B6B93]/20"
            title="Download PDF File"
            id="pdf-download"
          >
            <Download className="h-4 w-4" />
            <span className="hidden md:inline">Print / Save</span>
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

      {/* Actual PDF Page Canvas */}
      <div className="flex-1 overflow-auto bg-black/25 p-4 sm:p-8 flex justify-center items-start custom-scrollbar">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          className="transition-transform duration-200 print:transform-none"
        >
          {/* Paper Canvas */}
          <div
            className={`w-[800px] min-h-[1050px] bg-white text-slate-900 rounded-lg shadow-2xl relative select-text border border-slate-200 print:w-full print:shadow-none print:border-none transition-all duration-200 ${getPageTransitionClass()}`}
            id="pdf-paper-canvas"
          >
            {/* Page 1 Details */}
            <div className={`p-10 sm:p-14 h-full print:p-0 flex flex-col space-y-6 text-sm leading-relaxed font-sans ${currentPage === 1 ? 'block' : 'hidden print:block'}`}>
                {/* Header Information */}
                <div className="border-b-2 border-slate-900 pb-5 text-center">
                  <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
                    {resumeData.name}
                  </h1>
                  <p className="text-sm font-bold text-slate-600 tracking-wide mt-1">
                    {resumeData.title}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4 text-xs font-semibold text-slate-700">
                    <button
                      onClick={() => handleCopyText(resumeData.phone, "phone")}
                      className="flex items-center space-x-1 hover:text-[#1B6B93] transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{highlight(resumeData.phone)}</span>
                      {isCopied === "phone" && <Check className="h-3 w-3 text-green-600" />}
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => handleCopyText(resumeData.email, "email")}
                      className="flex items-center space-x-1 hover:text-[#1B6B93] transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>{highlight(resumeData.email)}</span>
                      {isCopied === "email" && <Check className="h-3 w-3 text-green-600" />}
                    </button>
                    <span>•</span>
                    <a
                      href={resumeData.github}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1 hover:text-[#1B6B93] transition-colors"
                    >
                      <Github className="h-3.5 w-3.5" />
                      <span>github.com/kartikraikar2005</span>
                    </a>
                    <span>•</span>
                    <a
                      href={resumeData.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1 hover:text-[#1B6B93] transition-colors"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                      <span>linkedin.com/in/kartik-raikar</span>
                    </a>
                  </div>
                </div>

                {/* Summary Section */}
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                    Professional Summary
                  </h2>
                  <p className="text-slate-700 text-justify leading-relaxed">
                    {highlight(resumeData.summary)}
                  </p>
                </div>

                {/* Technical Skills Section */}
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                    Technical Skills
                  </h2>
                  <div className="grid grid-cols-1 gap-2 text-slate-800">
                    <div>
                      <strong className="font-bold text-slate-900">Languages: </strong>
                      {highlight(resumeData.skills.languages.join(", "))}
                    </div>
                    <div>
                      <strong className="font-bold text-slate-900">Frontend Stack: </strong>
                      {highlight(resumeData.skills.frontend.join(", "))}
                    </div>
                    <div>
                      <strong className="font-bold text-slate-900">Backend Systems: </strong>
                      {highlight(resumeData.skills.backend.join(", "))}
                    </div>
                    <div>
                      <strong className="font-bold text-slate-900">AI / ML Engine: </strong>
                      {highlight(resumeData.skills.aiMl.join(", "))}
                    </div>
                    <div>
                      <strong className="font-bold text-slate-900">Databases: </strong>
                      {highlight(resumeData.skills.database.join(", "))}
                    </div>
                    <div>
                      <strong className="font-bold text-slate-900">Tools: </strong>
                      {highlight(resumeData.skills.tools.join(", "))}
                    </div>
                  </div>
                </div>

                {/* Projects Section */}
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                    Projects & Implementations
                  </h2>
                  <div className="space-y-4">
                    {resumeData.projects.map((project) => (
                      <div key={project.id} className="relative group border-l-2 border-slate-200 pl-4 hover:border-[#1B6B93] transition-colors">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900">
                            {highlight(project.title)} —{" "}
                            <span className="text-xs font-semibold text-slate-600">
                              {project.techStack.join(", ")}
                            </span>
                          </h3>
                          {/* Floating interactive Ask AI about this project */}
                          <button
                            onClick={() => onAskAIAboutProject(project.title)}
                            className="hidden group-hover:flex items-center space-x-1 rounded bg-[#1B6B93] px-2 py-0.5 text-xxs font-bold text-white shadow-sm hover:bg-[#164E6B] transition"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Ask AI</span>
                          </button>
                        </div>
                        <p className="text-slate-700 mt-1 text-xs">
                          {highlight(project.description)}
                        </p>
                        <ul className="list-disc list-inside mt-1.5 space-y-1 pl-1 text-xxs sm:text-xs text-slate-600">
                          {project.keyPoints.map((point, index) => (
                            <li key={index}>{highlight(point)}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            {/* Page 2 Details */}
            <div className={`p-10 sm:p-14 h-full print:p-0 print:break-before-page flex flex-col space-y-6 text-sm leading-relaxed font-sans ${currentPage === 2 ? 'block' : 'hidden print:block'}`}>
                {/* Header Profile Mini */}
                <div className="border-b border-slate-300 pb-3 flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 uppercase">
                      {resumeData.name}
                    </h1>
                    <p className="text-xs font-semibold text-slate-500">
                      AI & Machine Learning Undergrad
                    </p>
                  </div>
                  <span className="text-xxs font-bold text-slate-400">
                    Page 2 of 2
                  </span>
                </div>

                {/* Education Section */}
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
                    Education
                  </h2>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {highlight(resumeData.education.degree)}
                      </h3>
                      <p className="text-xs italic text-slate-600">
                        {highlight(resumeData.education.major)}
                      </p>
                      <p className="text-xs font-semibold text-slate-700">
                        {highlight(resumeData.education.university)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      {resumeData.education.period}
                    </span>
                  </div>
                </div>

                {/* Achievements Section */}
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
                    Achievements
                  </h2>
                  <ul className="list-disc list-inside space-y-2 text-slate-700">
                    {resumeData.achievements.map((ach) => (
                      <li key={ach.id} className="text-justify pl-1">
                        <strong className="font-bold text-slate-900">{highlight(ach.title)}:</strong>{" "}
                        {highlight(ach.description)}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Certifications Section */}
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
                    Certifications
                  </h2>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-700">
                    {resumeData.certifications.map((cert) => (
                      <li key={cert.id} className="pl-1">
                        <strong className="font-bold text-slate-900">
                          {highlight(cert.title)}
                        </strong>{" "}
                        — {highlight(cert.issuer)}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Coding Profiles & Handles */}
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
                    Coding Profiles
                  </h2>
                  <div className="grid grid-cols-2 gap-2 text-slate-800">
                    {resumeData.codingProfiles.map((p, i) => (
                      <a
                        key={i}
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-2 text-xs font-semibold text-[#1B6B93] hover:text-[#164E6B] transition pl-1"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>{highlight(p.platform)}:</span>
                        <span className="text-slate-500 font-normal underline overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
                          {p.url.replace("https://", "")}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Languages Section */}
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
                    Languages
                  </h2>
                  <p className="text-slate-700 font-semibold pl-1">
                    {highlight(resumeData.languages.join("  |  "))}
                  </p>
                </div>

                {/* Professional footer */}
                <div className="mt-auto pt-6 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 print:hidden">
                  <div className="flex items-center space-x-1.5">
                    <Compass className="h-3 w-3" />
                    <span className="font-semibold">Generated by Atlas AI Resume</span>
                  </div>
                  <span className="font-mono">kartik-raikar.dev</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
