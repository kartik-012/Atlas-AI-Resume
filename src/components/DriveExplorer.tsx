/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Folder, 
  File, 
  Search, 
  Upload, 
  Plus, 
  Trash2, 
  LogOut, 
  RefreshCw, 
  FolderPlus, 
  FilePlus, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  Info, 
  Calendar, 
  HardDrive, 
  AlertCircle, 
  Loader2, 
  Check, 
  ArrowLeft, 
  HelpCircle
} from "lucide-react";
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from "../lib/driveAuth";
import type { User } from "firebase/auth";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  owners?: { displayName: string; photoLink?: string }[];
  description?: string;
}

interface AIAnalysis {
  summary: string;
  fileTypeAnalysis: string;
  insights: string[];
  aiSuggestions: string[];
}

interface DriveExplorerProps {
  isDarkMode: boolean;
  onTrackAction: (event: string, meta?: any) => void;
}

export default function DriveExplorer({ isDarkMode, onTrackAction }: DriveExplorerProps) {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);

  // Explorer state
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "My Drive" }
  ]);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [fileFilter, setFileFilter] = useState<"all" | "folders" | "docs" | "sheets" | "slides" | "images">("all");

  // Create state
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);

  const [showFileModal, setShowFileModal] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>("");
  const [newFileContent, setNewFileContent] = useState<string>("");
  const [creatingFile, setCreatingFile] = useState<boolean>(false);

  // Delete State
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [deletingFile, setDeletingFile] = useState<boolean>(false);

  // Upload State
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        setAuthLoading(false);
        onTrackAction("drive_auth_restored", { email: currentUser.email });
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
        setAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch files when folder or token or filter changes
  useEffect(() => {
    if (token) {
      fetchDriveFiles();
    }
  }, [token, currentFolderId, fileFilter]);

  // Handle Login
  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        onTrackAction("drive_login_success", { email: result.user.email });
      }
    } catch (err) {
      console.error("Login failed", err);
      onTrackAction("drive_login_failed");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to disconnect Google Drive?")) {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setFiles([]);
      setSelectedFile(null);
      setAiAnalysis(null);
      onTrackAction("drive_logout");
    }
  };

  // Fetch Drive Files
  const fetchDriveFiles = async (searchTerm: string = searchQuery) => {
    if (!token) return;
    setLoadingFiles(true);
    try {
      let queryParts = ["trashed = false"];

      // Traversal or search mode
      if (searchTerm.trim()) {
        queryParts.push(`name contains '${searchTerm.replace(/'/g, "\\'")}'`);
      } else {
        queryParts.push(`'${currentFolderId}' in parents`);
      }

      // Filter mapping
      if (fileFilter === "folders") {
        queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
      } else if (fileFilter === "docs") {
        queryParts.push("mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain' or mimeType = 'application/pdf'");
      } else if (fileFilter === "sheets") {
        queryParts.push("mimeType = 'application/vnd.google-apps.spreadsheet'");
      } else if (fileFilter === "slides") {
        queryParts.push("mimeType = 'application/vnd.google-apps.presentation'");
      } else if (fileFilter === "images") {
        queryParts.push("mimeType contains 'image/'");
      }

      const q = encodeURIComponent(queryParts.join(" and "));
      const fields = "files(id,name,mimeType,size,modifiedTime,owners,description,webViewLink,iconLink)";
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=60&orderBy=folder,name`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Google API returned status ${response.status}`);
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error("Error fetching files from Google Drive:", err);
      // If unauthorized, token might be expired. Force relogin if needed.
    } finally {
      setLoadingFiles(false);
    }
  };

  // Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDriveFiles(searchQuery);
    onTrackAction("drive_search", { query: searchQuery });
  };

  // Reset Search
  const handleResetSearch = () => {
    setSearchQuery("");
    fetchDriveFiles("");
  };

  // Open a file or folder
  const handleFileClick = (file: DriveFile) => {
    setSelectedFile(file);
    setAiAnalysis(null);
    setAnalysisError(null);
  };

  const handleFileDoubleClick = (file: DriveFile) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      // Enter folder
      const newBreads = [...breadcrumbs, { id: file.id, name: file.name }];
      setBreadcrumbs(newBreads);
      setCurrentFolderId(file.id);
      setSelectedFile(null);
      setAiAnalysis(null);
      setSearchQuery("");
      onTrackAction("drive_folder_traverse", { folderName: file.name });
    } else if (file.webViewLink) {
      // Open file in new tab
      window.open(file.webViewLink, "_blank");
      onTrackAction("drive_file_open_external", { fileName: file.name });
    }
  };

  // Breadcrumb navigation
  const navigateBreadcrumb = (index: number) => {
    const bread = breadcrumbs[index];
    const newBreads = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreads);
    setCurrentFolderId(bread.id);
    setSelectedFile(null);
    setAiAnalysis(null);
    setSearchQuery("");
    onTrackAction("drive_breadcrumb_navigate", { target: bread.name });
  };

  // Create folder
  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !token) return;
    setCreatingFolder(true);
    try {
      const response = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          mimeType: "application/vnd.google-apps.folder",
          parents: [currentFolderId]
        })
      });

      if (response.ok) {
        setShowFolderModal(false);
        setNewFolderName("");
        fetchDriveFiles();
        onTrackAction("drive_folder_create", { name: newFolderName });
      } else {
        alert("Failed to create folder. Google API returned an error.");
      }
    } catch (err) {
      console.error("Folder creation error", err);
    } finally {
      setCreatingFolder(false);
    }
  };

  // Create text file
  const handleCreateFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !token) return;
    setCreatingFile(true);
    try {
      const metadata = {
        name: newFileName.endsWith(".txt") ? newFileName.trim() : `${newFileName.trim()}.txt`,
        mimeType: "text/plain",
        parents: [currentFolderId]
      };

      const formData = new FormData();
      formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      formData.append("file", new Blob([newFileContent], { type: "text/plain" }));

      const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setShowFileModal(false);
        setNewFileName("");
        setNewFileContent("");
        fetchDriveFiles();
        onTrackAction("drive_file_create", { name: newFileName });
      } else {
        alert("Failed to create file. Google API returned an error.");
      }
    } catch (err) {
      console.error("File creation error", err);
    } finally {
      setCreatingFile(false);
    }
  };

  // Delete file (Requires user confirmation)
  const handleDeleteConfirm = async () => {
    if (!fileToDelete || !token) return;
    setDeletingFile(true);
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchDriveFiles();
        if (selectedFile?.id === fileToDelete.id) {
          setSelectedFile(null);
          setAiAnalysis(null);
        }
        setFileToDelete(null);
        onTrackAction("drive_file_delete", { name: fileToDelete.name });
      } else {
        alert("Failed to delete file. It might be read-only or deleted already.");
      }
    } catch (err) {
      console.error("Deletion error", err);
    } finally {
      setDeletingFile(false);
    }
  };

  // Drag and Drop files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Upload file (multipart API)
  const handleFileUpload = async (file: File) => {
    if (!token) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      const metadata = {
        name: file.name,
        parents: [currentFolderId]
      };

      const formData = new FormData();
      formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      formData.append("file", file);

      setUploadProgress(40);
      const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      setUploadProgress(80);
      if (response.ok) {
        setUploadProgress(100);
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          fetchDriveFiles();
          onTrackAction("drive_file_upload", { name: file.name, size: file.size });
        }, 400);
      } else {
        alert("Upload failed. Try smaller files or verify permissions.");
        setUploading(false);
      }
    } catch (err) {
      console.error("Upload error", err);
      setUploading(false);
    }
  };

  // Analyze File with Gemini
  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setAiAnalysis(null);
    setAnalysisError(null);
    onTrackAction("drive_analyze_file_trigger", { fileName: selectedFile.name });

    try {
      // For text files, try to retrieve a small snippet of content if possible
      let contentSnippet = "";
      if (selectedFile.mimeType === "text/plain") {
        try {
          const res = await fetch(`https://www.googleapis.com/drive/v3/files/${selectedFile.id}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const txt = await res.text();
            contentSnippet = txt.slice(0, 1500); // Send up to 1500 chars to server
          }
        } catch (e) {
          console.warn("Could not retrieve file content media snippet", e);
        }
      }

      // Hit our full-stack Express backend analyze endpoint
      const response = await fetch("/api/drive/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.mimeType,
          fileSize: selectedFile.size ? formatBytes(parseInt(selectedFile.size)) : "Unknown size",
          modifiedTime: selectedFile.modifiedTime ? new Date(selectedFile.modifiedTime).toLocaleString() : "Unknown time",
          description: selectedFile.description || "",
          snippet: contentSnippet
        })
      });

      if (!response.ok) {
        throw new Error("Analysis request failed");
      }

      const analysisData = await response.json();
      setAiAnalysis(analysisData);
      onTrackAction("drive_analyze_file_success", { fileName: selectedFile.name });
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setAnalysisError("AI analysis server encountered an issue. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Format File sizes
  const formatBytes = (bytes: number, decimals: number = 1): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Map MIME types to pleasant UI helpers
  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/vnd.google-apps.folder") {
      return <Folder className="h-5 w-5 text-indigo-400 shrink-0" />;
    }
    if (mimeType === "application/vnd.google-apps.spreadsheet" || mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("csv")) {
      return <FileText className="h-5 w-5 text-emerald-500 shrink-0" />;
    }
    if (mimeType === "application/vnd.google-apps.document" || mimeType.includes("word") || mimeType.includes("pdf") || mimeType === "text/plain") {
      return <FileText className="h-5 w-5 text-blue-500 shrink-0" />;
    }
    if (mimeType === "application/vnd.google-apps.presentation" || mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
      return <FileText className="h-5 w-5 text-amber-500 shrink-0" />;
    }
    if (mimeType.includes("image/")) {
      return <FileText className="h-5 w-5 text-purple-500 shrink-0" />;
    }
    return <File className="h-5 w-5 text-slate-400 shrink-0" />;
  };

  return (
    <div className={`flex flex-col h-full rounded-2xl border transition-all duration-300 relative select-none shadow-xl ${
      isDarkMode 
        ? "bg-[#0D0D11]/90 border-white/10 text-white" 
        : "bg-white border-slate-200 text-slate-800"
    }`} id="drive-workspace">
      {/* Background Neon Header Line */}
      <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-t-2xl z-20" />

      {/* Explorer Header */}
      <div className={`flex flex-col md:flex-row items-center justify-between px-6 py-4 border-b z-10 gap-4 shrink-0 ${
        isDarkMode ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"
      }`}>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-md">
            <HardDrive className="h-5 w-5 text-white" />
            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#09090B]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Google Drive Workspace</h1>
            <p className={`text-[10px] font-semibold tracking-wide ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Full Cloud File Operations & Atlas AI Document Summaries
            </p>
          </div>
        </div>

        {/* User Connection Information Card */}
        {!needsAuth && user && (
          <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
            <div className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border ${
              isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-slate-200 shadow-2xs"
            }`}>
              {user.photoURL ? (
                <img referrerPolicy="no-referrer" src={user.photoURL} alt={user.displayName || "User"} className="h-7 w-7 rounded-lg shadow border border-indigo-500/30" />
              ) : (
                <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  {user.displayName?.[0] || "U"}
                </div>
              )}
              <div className="min-w-0 max-w-[140px] text-left">
                <p className="text-[10px] font-bold truncate leading-tight">{user.displayName || "Drive User"}</p>
                <p className={`text-[8px] font-semibold truncate ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center space-x-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all duration-300 hover:scale-102 active:scale-98 ${
                isDarkMode 
                  ? "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20" 
                  : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>

      {/* Auth Screen Overlay / Loading Cover */}
      {authLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
          <p className={`mt-4 text-xs font-bold tracking-wide animate-pulse ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Connecting secure portal pipelines...
          </p>
        </div>
      ) : needsAuth ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-xl mx-auto">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-6">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-lg font-bold tracking-tight mb-2">Connect Your Google Workspace</h2>
          <p className={`text-xs leading-relaxed mb-8 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Access your custom documents, resume portfolios, research projects, or personal folders in Google Drive. Atlas AI can automatically parse, summarize, and outline any document with lightning-fast cloud intelligence.
          </p>

          <button
            onClick={handleLogin}
            className="gsi-material-button shadow-xl hover:shadow-indigo-500/20 transition-all hover:scale-102"
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents font-bold">Sign in with Google</span>
            </div>
          </button>
        </div>
      ) : (
        /* Actual File Explorer Grid Layout */
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
          
          {/* Left Panel: Upload Zone & Filters */}
          <div className={`w-full md:w-60 border-b md:border-b-0 md:border-r p-5 flex flex-col gap-5 shrink-0 ${
            isDarkMode ? "border-white/5 bg-white/1" : "border-slate-100 bg-slate-50/50"
          }`}>
            {/* Quick Actions (Create Folders, Files) */}
            <div className="flex flex-col gap-2 shrink-0">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Create New</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowFolderModal(true)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition-all duration-300 hover:scale-102 active:scale-98 ${
                    isDarkMode 
                      ? "border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-400" 
                      : "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                  }`}
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>Folder</span>
                </button>
                <button
                  onClick={() => setShowFileModal(true)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition-all duration-300 hover:scale-102 active:scale-98 ${
                    isDarkMode 
                      ? "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/15 text-blue-400" 
                      : "border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                  }`}
                >
                  <FilePlus className="h-4 w-4" />
                  <span>Text Doc</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="flex flex-col gap-2 shrink-0">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Upload Files</span>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-all duration-300 relative ${
                  dragActive 
                    ? "border-indigo-500 bg-indigo-500/10 scale-98" 
                    : isDarkMode 
                      ? "border-white/10 hover:border-white/25 hover:bg-white/5 bg-black/10" 
                      : "border-slate-200 hover:border-slate-400 hover:bg-slate-50 bg-slate-100/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {uploading ? (
                  <div className="w-full flex flex-col items-center">
                    <Loader2 className="h-6 w-6 text-indigo-500 animate-spin mb-2" />
                    <p className="text-[10px] font-bold text-indigo-400">Uploading ({uploadProgress}%)</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-500 h-1 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className={`h-6 w-6 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
                    <div className="text-[10px] font-bold">Drag files here</div>
                    <div className={`text-[8px] font-semibold ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>or click to browse local storage</div>
                  </>
                )}
              </div>
            </div>

            {/* Quick File Filters */}
            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest shrink-0 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Filter Storage</span>
              {[
                { filter: "all", label: "All Cloud Files" },
                { filter: "folders", label: "Folders Only" },
                { filter: "docs", label: "Documents & PDFs" },
                { filter: "sheets", label: "Spreadsheets" },
                { filter: "slides", label: "Presentations" },
                { filter: "images", label: "Images" }
              ].map((item) => (
                <button
                  key={item.filter}
                  onClick={() => {
                    setFileFilter(item.filter as any);
                    setSelectedFile(null);
                    setAiAnalysis(null);
                  }}
                  className={`flex items-center text-left px-3 py-2 text-xs font-bold rounded-xl transition ${
                    fileFilter === item.filter
                      ? isDarkMode 
                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20" 
                        : "bg-white text-indigo-600 shadow-2xs border border-slate-200/50 font-extrabold"
                      : isDarkMode
                        ? "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Central Main Panel: Explorer Traversal Grid */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            
            {/* Search Bar & Controls */}
            <div className={`p-4 border-b flex flex-col sm:flex-row items-center gap-3 shrink-0 ${
              isDarkMode ? "border-white/5 bg-black/10" : "border-slate-100 bg-white"
            }`}>
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`} />
                <input
                  type="text"
                  placeholder="Search file and folder names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-xl outline-none border focus:ring-1 focus:ring-indigo-500 transition ${
                    isDarkMode 
                      ? "bg-[#16161D] border-white/10 text-white placeholder:text-slate-500" 
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-2xs font-bold uppercase py-0.5 px-1.5 rounded transition ${
                      isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Clear
                  </button>
                )}
              </form>

              <button
                onClick={() => fetchDriveFiles()}
                className={`p-2 rounded-xl border transition ${
                  isDarkMode 
                    ? "border-white/10 text-slate-400 hover:text-white hover:bg-white/5" 
                    : "border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
                title="Refresh Folder"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Breadcrumbs */}
            <div className={`px-6 py-2 border-b flex items-center space-x-1.5 overflow-x-auto text-xxs font-bold shrink-0 custom-scrollbar select-none ${
              isDarkMode ? "border-white/5 bg-white/2" : "border-slate-100 bg-slate-50/30"
            }`}>
              {breadcrumbs.map((bread, index) => (
                <div key={bread.id} className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => navigateBreadcrumb(index)}
                    className={`hover:underline ${
                      index === breadcrumbs.length - 1
                        ? "text-indigo-500 font-extrabold cursor-default pointer-events-none"
                        : isDarkMode ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {bread.name}
                  </button>
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                  )}
                </div>
              ))}
            </div>

            {/* Main Files Table/List Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loadingFiles ? (
                <div className="h-full flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p className={`mt-3 text-2xs font-bold tracking-wide animate-pulse ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Syncing file index tables...
                  </p>
                </div>
              ) : files.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-24 text-center px-6">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center border border-dashed mb-4 ${
                    isDarkMode ? "border-white/10 text-slate-600" : "border-slate-200 text-slate-400"
                  }`}>
                    <HardDrive className="h-6 w-6" />
                  </div>
                  <h3 className="text-xs font-bold tracking-tight mb-1">No Items Found</h3>
                  <p className={`text-[10px] max-w-xs leading-relaxed ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    This directory is empty, or no matches were found under active search filters. Use quick actions to add folders or text docs.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-4xs font-black uppercase tracking-wider border-b select-none ${
                      isDarkMode ? "border-white/5 bg-white/2 text-slate-500" : "border-slate-100 bg-slate-50/80 text-slate-400"
                    }`}>
                      <th className="px-6 py-3 font-extrabold">Name</th>
                      <th className="px-6 py-3 hidden sm:table-cell font-extrabold">Last Modified</th>
                      <th className="px-6 py-3 hidden md:table-cell font-extrabold">File Size</th>
                      <th className="px-6 py-3 text-right pr-6 font-extrabold">Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/10 dark:divide-white/5">
                    {files.map((file) => {
                      const isSelected = selectedFile?.id === file.id;
                      return (
                        <tr
                          key={file.id}
                          onClick={() => handleFileClick(file)}
                          onDoubleClick={() => handleFileDoubleClick(file)}
                          className={`cursor-pointer group transition-all duration-150 ${
                            isSelected
                              ? isDarkMode
                                ? "bg-indigo-600/20"
                                : "bg-indigo-50 border-indigo-200/50"
                              : isDarkMode
                                ? "hover:bg-white/5"
                                : "hover:bg-slate-50"
                          }`}
                        >
                          {/* File Name Panel */}
                          <td className="px-6 py-3.5 flex items-center space-x-3 max-w-sm sm:max-w-md">
                            {getFileIcon(file.mimeType)}
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate leading-tight ${
                                isSelected
                                  ? isDarkMode ? "text-indigo-400" : "text-indigo-800"
                                  : isDarkMode ? "text-slate-100" : "text-slate-800"
                              }`}>
                                {file.name}
                              </p>
                              <p className={`text-[9px] font-semibold truncate uppercase tracking-wider ${
                                isDarkMode ? "text-slate-500" : "text-slate-400"
                              }`}>
                                {file.mimeType.split(".").pop()?.split("/").pop()}
                              </p>
                            </div>
                          </td>

                          {/* Last Modified Date */}
                          <td className="px-6 py-3.5 text-xxs font-semibold hidden sm:table-cell select-none">
                            <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
                              {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : "--"}
                            </span>
                          </td>

                          {/* File Size */}
                          <td className="px-6 py-3.5 text-xxs font-mono font-bold hidden md:table-cell select-none">
                            <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
                              {file.size ? formatBytes(parseInt(file.size)) : file.mimeType === "application/vnd.google-apps.folder" ? "Folder" : "--"}
                            </span>
                          </td>

                          {/* Creator / Owner Card */}
                          <td className="px-6 py-3.5 text-right pr-6 select-none">
                            <div className="flex items-center justify-end space-x-1.5">
                              <span className={`text-[10px] font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                                {file.owners?.[0]?.displayName || "Drive User"}
                              </span>
                              {file.owners?.[0]?.photoLink ? (
                                <img referrerPolicy="no-referrer" src={file.owners[0].photoLink} alt="avatar" className="h-5 w-5 rounded-full border border-slate-400/20 shadow-xs shrink-0" />
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center text-[10px]">
                                  {file.owners?.[0]?.displayName?.[0] || "U"}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Panel: Selected File Metadata Details & Gemini AI summary */}
          <div className={`w-full md:w-80 border-t md:border-t-0 md:border-l p-5 flex flex-col min-h-0 overflow-y-auto shrink-0 custom-scrollbar ${
            isDarkMode ? "border-white/5 bg-black/20" : "border-slate-100 bg-slate-50/30"
          }`}>
            {selectedFile ? (
              <div className="flex flex-col gap-5 h-full">
                {/* File Overview card */}
                <div className={`p-4 rounded-xl border flex flex-col gap-3 select-none ${
                  isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-slate-200/50 shadow-2xs"
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 border border-indigo-500/25">
                      {getFileIcon(selectedFile.mimeType)}
                    </div>
                    <div className="flex items-center space-x-1">
                      {selectedFile.webViewLink && (
                        <button
                          onClick={() => {
                            window.open(selectedFile.webViewLink, "_blank");
                            onTrackAction("drive_file_open_sidebar", { name: selectedFile.name });
                          }}
                          className={`p-1.5 rounded-lg border transition ${
                            isDarkMode 
                              ? "border-white/10 hover:border-white/20 text-slate-400 hover:text-white bg-[#16161D]" 
                              : "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 bg-slate-50"
                          }`}
                          title="Open Link"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setFileToDelete(selectedFile)}
                        className={`p-1.5 rounded-lg border transition ${
                          isDarkMode 
                            ? "border-red-500/10 hover:border-red-500/20 text-red-400 hover:bg-red-500/10 bg-[#16161D]" 
                            : "border-red-200 hover:bg-red-50 text-red-600 hover:bg-red-100 bg-slate-50"
                        }`}
                        title="Delete File"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xs font-black truncate leading-tight">{selectedFile.name}</h3>
                    <p className={`text-[9px] font-bold truncate mt-0.5 uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      {selectedFile.mimeType.split(".").pop()?.split("/").pop()}
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t pt-2.5 mt-1">
                    <div className="flex items-center justify-between text-[9px] font-semibold">
                      <span className={isDarkMode ? "text-slate-500" : "text-slate-400"}>File ID</span>
                      <span className="font-mono text-slate-400 font-bold max-w-[120px] truncate">{selectedFile.id}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-semibold">
                      <span className={isDarkMode ? "text-slate-500" : "text-slate-400"}>Size</span>
                      <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                        {selectedFile.size ? formatBytes(parseInt(selectedFile.size)) : selectedFile.mimeType === "application/vnd.google-apps.folder" ? "Folder" : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-semibold">
                      <span className={isDarkMode ? "text-slate-500" : "text-slate-400"}>Modified</span>
                      <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                        {selectedFile.modifiedTime ? new Date(selectedFile.modifiedTime).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gemini AI Core Analysis Panel */}
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  <div className="flex items-center justify-between select-none">
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Atlas RAG AI Core</span>
                    <span className={`rounded-full px-2 py-0.5 text-4xs font-black uppercase tracking-wider border ${
                      isDarkMode ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-purple-50 text-purple-600 border-purple-200"
                    }`}>
                      Live
                    </span>
                  </div>

                  {analyzing ? (
                    <div className={`flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border ${
                      isDarkMode ? "bg-white/2 border-white/5" : "bg-white border-slate-200 shadow-2xs"
                    }`}>
                      <Loader2 className="h-7 w-7 text-indigo-500 animate-spin mb-3" />
                      <p className={`text-[10px] font-bold text-center animate-pulse ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Atlas AI reading catalog metadata...
                      </p>
                      <p className={`text-[8px] font-semibold text-center mt-1 max-w-[160px] ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}>
                        Formulating insights and professional workflows...
                      </p>
                    </div>
                  ) : aiAnalysis ? (
                    /* Render Beautiful Gemini Analysis Cards */
                    <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-0.5">
                      
                      {/* Summary Block */}
                      <div className={`p-4 rounded-xl border ${
                        isDarkMode ? "bg-[#111116] border-[#1D1D26]" : "bg-[#F9FBFC] border-slate-200/60 shadow-2xs"
                      }`}>
                        <div className="flex items-center gap-1.5 mb-2 select-none">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">Executive Analysis</h4>
                        </div>
                        <p className="text-xxs leading-relaxed text-justify font-medium">
                          {aiAnalysis.summary}
                        </p>
                      </div>

                      {/* File Mime Type Analysis */}
                      <div className={`p-4 rounded-xl border ${
                        isDarkMode ? "bg-[#111116] border-[#1D1D26]" : "bg-[#F9FBFC] border-slate-200/60 shadow-2xs"
                      }`}>
                        <div className="flex items-center gap-1.5 mb-2 select-none">
                          <HardDrive className="h-3.5 w-3.5 text-blue-400" />
                          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">Asset Profile</h4>
                        </div>
                        <p className="text-xxs leading-relaxed text-justify font-medium">
                          {aiAnalysis.fileTypeAnalysis}
                        </p>
                      </div>

                      {/* Deeper Insights */}
                      <div className="space-y-1.5">
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest select-none px-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Core Insights</span>
                        <div className="space-y-2">
                          {aiAnalysis.insights.map((ins, idx) => (
                            <div key={idx} className={`flex items-start space-x-2 p-2.5 rounded-xl border ${
                              isDarkMode ? "bg-white/2 border-white/5" : "bg-white border-slate-200/40 shadow-3xs"
                            }`}>
                              <span className="text-indigo-400 font-extrabold text-[10px] select-none mt-0.5">✦</span>
                              <p className="text-xxs leading-relaxed font-semibold">{ins}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Suggestions */}
                      <div className="space-y-1.5">
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest select-none px-1 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Next Actions</span>
                        <div className="space-y-2">
                          {aiAnalysis.aiSuggestions.map((sug, idx) => (
                            <div key={idx} className={`flex items-start space-x-2 p-2.5 rounded-xl border ${
                              isDarkMode ? "bg-white/2 border-white/5" : "bg-white border-slate-200/40 shadow-3xs"
                            }`}>
                              <span className="text-emerald-400 font-extrabold text-[10px] select-none mt-0.5">✓</span>
                              <p className="text-xxs leading-relaxed font-semibold">{sug}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Re-analyze Button */}
                      <button
                        onClick={handleAnalyzeFile}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs border transition flex items-center justify-center gap-1.5 hover:scale-101 active:scale-99 ${
                          isDarkMode 
                            ? "border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10" 
                            : "border-slate-200 hover:bg-slate-100 bg-white"
                        }`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Re-analyze File</span>
                      </button>
                    </div>
                  ) : (
                    /* Prompt user to Analyze file with AI */
                    <div className={`flex-1 flex flex-col items-center justify-center p-6 text-center rounded-2xl border ${
                      isDarkMode ? "bg-white/2 border-white/5" : "bg-white border-slate-200 shadow-2xs"
                    }`}>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md mb-3">
                        <Sparkles className="h-5 w-5 text-white animate-pulse" />
                      </div>
                      <h4 className="text-xs font-bold tracking-tight mb-1">Analyze with Atlas AI</h4>
                      <p className={`text-[10px] max-w-[180px] leading-relaxed mb-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                        Generate deep analytical summaries, MIME type assessments, and direct workflow action lists automatically.
                      </p>
                      <button
                        onClick={handleAnalyzeFile}
                        className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:scale-102"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Run AI Summary</span>
                      </button>
                      {analysisError && (
                        <div className="flex items-center space-x-1.5 text-red-500 mt-3 text-[9px] font-bold">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{analysisError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* No selected file state */
              <div className="h-full flex flex-col items-center justify-center text-center py-20 select-none">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border border-dashed mb-3 ${
                  isDarkMode ? "border-white/10 text-slate-600" : "border-slate-200 text-slate-400"
                }`}>
                  <Info className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold tracking-tight mb-0.5">No File Selected</h4>
                <p className={`text-[10px] max-w-[160px] leading-relaxed ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  Select any folder or document to view properties and unleash active Atlas AI insights. Double click to traverse directories.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== CREATE FOLDER MODAL ==================== */}
      {showFolderModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 duration-150 text-left ${
            isDarkMode ? "bg-[#0F0F13] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <h3 className="text-sm font-bold tracking-tight mb-1">Create Folder</h3>
            <p className={`text-[10px] font-semibold mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Creates a brand new storage bucket directory in the current cloud path.
            </p>
            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <div>
                <label className={`text-[10px] font-extrabold uppercase tracking-wide block mb-1.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Folder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Recruiter Briefings"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl outline-none border focus:ring-1 focus:ring-indigo-500 transition ${
                    isDarkMode 
                      ? "bg-[#16161D] border-white/10 text-white placeholder:text-slate-600" 
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderModal(false);
                    setNewFolderName("");
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition hover:bg-slate-100 dark:hover:bg-white/5 ${
                    isDarkMode ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-600"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all hover:scale-102 active:scale-98 flex items-center gap-1"
                >
                  {creatingFolder && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Create Directory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE FILE MODAL ==================== */}
      {showFileModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 duration-150 text-left ${
            isDarkMode ? "bg-[#0F0F13] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <h3 className="text-sm font-bold tracking-tight mb-1">Create Text Document</h3>
            <p className={`text-[10px] font-semibold mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Writes a simple plain text or markdown doc directly inside your cloud path.
            </p>
            <form onSubmit={handleCreateFileSubmit} className="space-y-4">
              <div>
                <label className={`text-[10px] font-extrabold uppercase tracking-wide block mb-1.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. feedback-notes.txt"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl outline-none border focus:ring-1 focus:ring-indigo-500 transition ${
                    isDarkMode 
                      ? "bg-[#16161D] border-white/10 text-white placeholder:text-slate-600" 
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                  }`}
                />
              </div>
              <div>
                <label className={`text-[10px] font-extrabold uppercase tracking-wide block mb-1.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Content</label>
                <textarea
                  rows={6}
                  placeholder="Type anything here..."
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl outline-none border focus:ring-1 focus:ring-indigo-500 transition resize-none custom-scrollbar ${
                    isDarkMode 
                      ? "bg-[#16161D] border-white/10 text-white placeholder:text-slate-600" 
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowFileModal(false);
                    setNewFileName("");
                    setNewFileContent("");
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition hover:bg-slate-100 dark:hover:bg-white/5 ${
                    isDarkMode ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-600"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFile || !newFileName.trim()}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all hover:scale-102 active:scale-98 flex items-center gap-1"
                >
                  {creatingFile && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Write Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE FILE CONFIRMATION MODAL (MANDATORY) ==================== */}
      {fileToDelete && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl animate-in zoom-in-95 duration-150 text-left ${
            isDarkMode ? "bg-[#0F0F13] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="flex items-center gap-2 mb-3 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <h3 className="text-sm font-bold tracking-tight">Delete Cloud File?</h3>
            </div>
            <p className={`text-xs leading-relaxed mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Are you sure you want to delete <span className="font-bold text-red-400 break-all">"{fileToDelete.name}"</span>? This operation is permanent and cannot be undone. Please confirm to proceed.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition hover:bg-slate-100 dark:hover:bg-white/5 ${
                  isDarkMode ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-600"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingFile}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow transition-all hover:scale-102 active:scale-98 flex items-center gap-1"
              >
                {deletingFile && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
