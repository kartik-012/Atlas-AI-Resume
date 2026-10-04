/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { resumeData } from "./src/data/resumeData";
import { matchChatbotIntent } from "./src/data/chatbotIntents";

// Setup path helpers for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
app.use(express.json());

// In-memory Analytics state
const analyticsFile = path.join(__dirname, "analytics_store.json");
let analytics = {
  // Real data (even if it starts at 0) demonstrates integrity and an understanding of honest metrics.
  visits: 0, 
  questionsAsked: 0,
  timeSpent: 0, 
  projectsOpened: 0,
  resumeDownloads: 0,
  dailyVisits: [
    { date: "Mon", count: 0 },
    { date: "Tue", count: 0 },
    { date: "Wed", count: 0 },
    { date: "Thu", count: 0 },
    { date: "Fri", count: 0 },
    { date: "Sat", count: 0 },
    { date: "Sun", count: 0 }
  ],
  popularQueries: [] as { query: string; count: number }[]
};

// Load analytics from file if exists
if (fs.existsSync(analyticsFile)) {
  try {
    analytics = JSON.parse(fs.readFileSync(analyticsFile, "utf-8"));
  } catch (e) {
    console.error("Failed to read analytics file, using defaults", e);
  }
}

function saveAnalytics() {
  try {
    fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2));
  } catch (e) {
    console.error("Failed to save analytics", e);
  }
}

// In-memory RAG database
interface KnowledgeChunk {
  id: string;
  title: string;
  source: string;
  content: string;
  embedding?: number[] | null;
}

let knowledgeBase: KnowledgeChunk[] = [];
const kbFile = path.join(__dirname, "knowledge_base.json");

function saveKnowledgeBase() {
  try {
    fs.writeFileSync(kbFile, JSON.stringify(knowledgeBase, null, 2));
  } catch (e) {
    console.error("Failed to save knowledge base", e);
  }
}

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini SDK initialized successfully server-side");
  } catch (err) {
    console.error("Failed to initialize Gemini Client", err);
  }
} else {
  console.warn("GEMINI_API_KEY environment variable is not defined or is placeholder. Falling back to keyword search for RAG.");
}

// Helper to generate text chunks from the resume data
function buildDefaultKnowledgeBase() {
  const chunks: KnowledgeChunk[] = [];

  // 1. General Profile Summary
  chunks.push({
    id: "profile-summary",
    title: "Summary & Overview",
    source: "Resume.pdf",
    content: `Kartik Raikar is an AI Engineer specializing in Generative AI, LLMs, RAG, and AI evaluation. He is pursuing a ${resumeData.education.degree} in ${resumeData.education.major} (${resumeData.education.period}) at ${resumeData.education.institution} under ${resumeData.education.university}. CGPA: ${resumeData.education.cgpa}. ${resumeData.summary} Contact Email: ${resumeData.email}, Phone: ${resumeData.phone}, Github: ${resumeData.github}, LinkedIn: ${resumeData.linkedin}. Location: ${resumeData.location}.`
  });

  // 2. Education with Pre-University
  chunks.push({
    id: "education",
    title: "Education & Institution",
    source: "Resume.pdf",
    content: `Education: Kartik is pursuing a ${resumeData.education.degree} in ${resumeData.education.major} (${resumeData.education.period}) at ${resumeData.education.institution} under ${resumeData.education.university}. CGPA: ${resumeData.education.cgpa}. Pre-University: ${resumeData.preUniversity.course} at ${resumeData.preUniversity.institution} (${resumeData.preUniversity.period}), ${resumeData.preUniversity.percentage}. Relevant Coursework: ${resumeData.coursework.join(", ")}.`
  });

  // 3. Contact Information
  chunks.push({
    id: "contact-info",
    title: "Contact Information",
    source: "Resume.pdf",
    content: `Kartik Raikar Contact Info: Email: ${resumeData.email}. Phone/WhatsApp: ${resumeData.phone}. Location: ${resumeData.location}. GitHub: ${resumeData.github}. LinkedIn: ${resumeData.linkedin}. Portfolio: ${resumeData.portfolio}. Coding Profiles: ${resumeData.codingProfiles.map(p => `${p.platform} (${p.handle})`).join(", ")}.`
  });

  // 4. Technical Skills
  chunks.push({
    id: "skills-languages",
    title: "Skills - Programming Languages & Frameworks",
    source: "Resume.pdf",
    content: `Programming Languages: ${resumeData.skills.languages.join(", ")}. Frameworks: ${resumeData.skills.frontend.join(", ")}. Backend: ${resumeData.skills.backend.join(", ")}.`
  });

  chunks.push({
    id: "skills-ai-ml",
    title: "Skills - AI, Machine Learning, & LLMs",
    source: "Resume.pdf",
    content: `AI/ML Skills: ${resumeData.skills.aiMl.join(", ")}. Data & Visualization: ${resumeData.skills.dataViz.join(", ")}.`
  });

  chunks.push({
    id: "skills-databases-devops",
    title: "Skills - Databases & DevOps",
    source: "Resume.pdf",
    content: `Databases: ${resumeData.skills.database.join(", ")}. Tools & DevOps: ${resumeData.skills.tools.join(", ")}.`
  });

  // 5. Projects
  resumeData.projects.forEach(p => {
    chunks.push({
      id: `project-${p.id}-summary`,
      title: `${p.title} - Overview`,
      source: `${p.title}.pdf`,
      content: `Project Details for "${p.title}": Tech Stack: ${p.techStack.join(", ")}. Brief: ${p.description}. GitHub: ${p.githubUrl}. Demo: ${p.liveUrl}.`
    });

    chunks.push({
      id: `project-${p.id}-details`,
      title: `${p.title} - Core Architecture`,
      source: "README.md",
      content: `In-depth Project Implementation: "${p.title}" Details: ${p.longDescription}. Key Accomplishments: ${p.keyPoints.join(" ")}`
    });
  });

  // 6. Achievements
  resumeData.achievements.forEach(a => {
    chunks.push({
      id: `achievement-${a.id}`,
      title: `Achievement: ${a.title}`,
      source: "Achievements.pdf",
      content: `Kartik's Achievement: "${a.title}" ${a.icon || ""} - ${a.description}`
    });
  });

  // 7. Certifications
  chunks.push({
    id: "certifications-all-summary",
    title: "All Certifications - Complete List",
    source: "Certificates.pdf",
    content: `Kartik Raikar holds ${resumeData.certifications.length} verified certifications: ${resumeData.certifications.map(c => `${c.title} (${c.issuer}, ${c.date})`).join("; ")}.`
  });

  resumeData.certifications.forEach(c => {
    chunks.push({
      id: `certification-${c.id}`,
      title: `Certification: ${c.title}`,
      source: "Certificates.pdf",
      content: `Certification: "${c.title}" (Issued: ${c.date}) by ${c.issuer}. ${c.credentialId ? `Credential ID: ${c.credentialId}.` : ""} Skills: ${c.skills.join(", ")}. ${c.description}`
    });
  });

  // 8. Interview & Technical Knowledge Chunks
  chunks.push({
    id: "interview-why-hire",
    title: "Interview Question: Why should we hire Kartik Raikar?",
    source: "Interview_Preparation.pdf",
    content: "Why Hire Kartik Raikar? 1) Production AI Engineering: Built AIOps Root Cause Correlator achieving 100% Top-1 RCA accuracy in 0.78s and VersionRAG eliminating 62.5% hallucinated deprecated API calls to 0.0%. 2) RAG & Evaluation Expertise: Engineered ApexRAG benchmarking 5 retrieval strategies and improving accuracy from 61% to 85%. 3) MCP & LLM Tooling: Built GitHub MCP Toolkit improving intent execution accuracy from 64% to 100% with zero prompt injection vulnerabilities. 4) Full-Stack AI Fluency: Python, FastAPI, React.js, PostgreSQL (pgvector), Redis, Docker. 5) Verified Credentials: 8.50 CGPA, 3 certifications (Oracle AI, AWS ML, Tata GenAI), Vice President of AI&ML Department."
  });

  chunks.push({
    id: "interview-technical-challenge",
    title: "Interview Question: Tell me about a complex technical challenge you solved.",
    source: "Interview_Preparation.pdf",
    content: "Technical Challenge & Problem Solving: In VersionRAG, Kartik faced the critical challenge of cross-version code contamination where RAG systems would hallucinate deprecated API calls 62.5% of the time. Solution: 1) Designed database-enforced version-partitioned vector indexing that completely eliminated cross-version contamination (62.5% to 0.0%). 2) Engineered a structure-aware AST semantic diff engine that detects undocumented breaking changes with 94.2% accuracy. 3) Boosted retrieval precision @k=6 from 41.7% to 98.4% (+136%) at 5.4ms HNSW latency."
  });

  chunks.push({
    id: "interview-rag-hallucinations",
    title: "Interview Question: How do you prevent and audit hallucinations in RAG systems?",
    source: "Interview_Preparation.pdf",
    content: "RAG Reliability & Hallucination Mitigation Strategy: Kartik employs a multi-layered defense strategy: 1) Version-Partitioned Indexing (VersionRAG): Database-enforced version isolation eliminates cross-version contamination, reducing hallucinated deprecated API calls from 62.5% to 0.0%. 2) AST Semantic Diff Engine: Detects undocumented breaking changes with 94.2% accuracy. 3) Multi-Strategy Evaluation (ApexRAG): Benchmarked 5 retrieval strategies (BM25, Dense, Hybrid, Cross-Encoder, Query Router). 4) Path-Based Hashing: Eliminates data contamination and ID collisions."
  });

  chunks.push({
    id: "interview-scaling-latency",
    title: "Interview Question: How do you optimize latency and throughput in AI applications?",
    source: "Interview_Preparation.pdf",
    content: "Latency & Scalability Optimization: Kartik achieves sub-second latency through: 1) HNSW Vector Indexing: 5.4ms retrieval latency in VersionRAG using pgvector HNSW indexes. 2) Causal DAG Traversal: 0.78s incident resolution in AIOps RCA using NetworkX. 3) Real-Time Streaming: WebSockets and SSE for immediate token delivery. 4) Caching: Redis for high-speed caching. 5) Circuit Breakers & Saga Rollback patterns in GitHub MCP Toolkit."
  });

  chunks.push({
    id: "interview-career-goals",
    title: "Interview Question: What are your career aspirations and ideal role?",
    source: "Interview_Preparation.pdf",
    content: "Career Goals & Aspirations: Kartik aims to contribute as an AI Engineer, Generative AI Engineer, or LLM Applications Developer. He is passionate about building production-grade RAG pipelines, AI evaluation systems, LLM-driven automation tools (MCP servers), incident intelligence platforms, and high-reliability AI applications."
  });

  return chunks;
}

// Embedding calculations
async function calculateEmbeddings() {
  if (!ai) return;
  console.log(`Embedding ${knowledgeBase.length} chunks using Gemini...`);
  for (const chunk of knowledgeBase) {
    if (chunk.embedding) continue;
    try {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: chunk.content,
      });
      const values = response?.embeddings?.[0]?.values || (response as any)?.embedding?.values;
      if (values) {
        chunk.embedding = values;
      }
    } catch (e) {
      console.error(`Failed to embed chunk ${chunk.id}:`, e);
    }
  }
  console.log("Embedding calculations completed");
}

// Mathematical vector operations for similarity search
function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, idx) => sum + val * (b[idx] || 0), 0);
}

function magnitude(a: number[]): number {
  return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

// Levenshtein distance for fuzzy keyword tolerance (typos like linkdin -> linkedin)
function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyMatchToken(token: string, targetWord: string): boolean {
  if (token === targetWord) return true;
  if (token.length < 3 || targetWord.length < 3) return false;
  if (token.length >= 4 && (targetWord.startsWith(token) || token.startsWith(targetWord))) return true;
  if (token.length >= 4 && targetWord.length >= 4) {
    const maxDist = (token.length >= 6 && targetWord.length >= 6) ? 2 : 1;
    return levenshteinDistance(token, targetWord) <= maxDist;
  }
  return false;
}

// Enhanced keyword similarity algorithm with fuzzy matching and title weighting
function keywordSimilarity(query: string, chunkOrText: KnowledgeChunk | string): number {
  const queryTokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 2);
  
  if (queryTokens.length === 0) return 0;

  const contentLower = typeof chunkOrText === "string" ? chunkOrText.toLowerCase() : chunkOrText.content.toLowerCase();
  const titleLower = typeof chunkOrText === "string" ? "" : chunkOrText.title.toLowerCase();
  const sourceLower = typeof chunkOrText === "string" ? "" : chunkOrText.source.toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    // 1. Direct title match (high weight)
    if (titleLower && titleLower.includes(token)) {
      score += 2.0;
    } else if (titleLower) {
      const titleWords = titleLower.split(/\s+/);
      if (titleWords.some(tw => fuzzyMatchToken(token, tw))) {
        score += 1.5;
      }
    }

    // 2. Direct source match
    if (sourceLower && sourceLower.includes(token)) {
      score += 1.0;
    }

    // 3. Content match
    if (contentLower.includes(token)) {
      score += 1.0;
    } else {
      const contentWords = contentLower.split(/\s+/);
      if (contentWords.some(cw => fuzzyMatchToken(token, cw))) {
        score += 0.7;
      }
    }
  }

  // Normalized score
  return Math.min(1.0, score / queryTokens.length);
}

// Search knowledge base
async function searchKnowledgeBase(query: string, topN = 3): Promise<{ chunk: KnowledgeChunk; score: number }[]> {
  let queryEmbedding: number[] | null = null;

  // Try semantic search if API key exists
  if (ai) {
    try {
      const res = await ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: query,
      });
      const values = res?.embeddings?.[0]?.values || (res as any)?.embedding?.values;
      if (values) {
        queryEmbedding = values;
      }
    } catch (e) {
      console.error("Semantic embedding of query failed, falling back to keywords", e);
    }
  }

  const scoredChunks = knowledgeBase.map(chunk => {
    let score = 0;
    if (queryEmbedding && chunk.embedding) {
      score = cosineSimilarity(queryEmbedding, chunk.embedding);
    } else {
      // Enhanced fuzzy keyword overlap score
      score = keywordSimilarity(query, chunk);
    }
    return { chunk, score };
  });

  // Sort by score descending
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

// Build initial knowledge base or load from file
if (fs.existsSync(kbFile)) {
  try {
    knowledgeBase = JSON.parse(fs.readFileSync(kbFile, "utf-8"));
  } catch (e) {
    console.error("Failed to read knowledge base file, rebuilding", e);
    knowledgeBase = buildDefaultKnowledgeBase();
    saveKnowledgeBase();
  }
} else {
  // First startup, build from default resume data
  knowledgeBase = buildDefaultKnowledgeBase();
  saveKnowledgeBase();
}
calculateEmbeddings().catch(err => console.error("Async embedding calculation failed", err));

// Rate limiters (generous limit for interactive recruiter testing)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again in a few seconds." }
});

// Admin Auth Middleware
const adminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const adminKey = req.headers["x-admin-key"];
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    res.status(401).json({ error: "Unauthorized: Invalid or missing admin key" });
    return;
  }
  next();
};

// ==================== API ENDPOINTS ====================

// GET: Current Analytics
app.get("/api/analytics", (req, res) => {
  res.json(analytics);
});

// POST: Track User Interactions
app.post("/api/track", (req, res) => {
  const { event } = req.body;
  const validEvents = ["visit", "question", "download", "project_click", "time_spent"];
  if (!event || typeof event !== "string" || !validEvents.includes(event)) {
    return res.status(400).json({ error: "Missing or invalid event type" });
  }

  switch (event) {
    case "visit":
      analytics.visits++;
      // Increment today's visit count in chart
      const todayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
      const dayItem = analytics.dailyVisits.find(d => d.date === todayName);
      if (dayItem) dayItem.count++;
      break;
    case "question":
      analytics.questionsAsked++;
      break;
    case "download":
      analytics.resumeDownloads++;
      break;
    case "project_click":
      analytics.projectsOpened++;
      break;
    case "time_spent":
      const { seconds } = req.body;
      if (seconds && typeof seconds === "number") {
        analytics.timeSpent += seconds;
      }
      break;
    default:
      break;
  }

  saveAnalytics();
  res.json({ success: true, analytics });
});

// POST: RAG AI Chat Endpoint (SSE Streaming)
app.post("/api/chat", apiLimiter, async (req, res) => {
  const { messages, query } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing or invalid query parameter" });
  }
  if (query.length > 500) {
    return res.status(400).json({ error: "Query exceeds maximum length of 500 characters." });
  }

  // Prompt injection rudimentary check
  const lowerQuery = query.toLowerCase();
  const suspiciousPhrases = ["ignore previous instructions", "you are now", "system prompt", "act as", "forget everything"];
  if (suspiciousPhrases.some(phrase => lowerQuery.includes(phrase))) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(`data: ${JSON.stringify({ chunk: "I'm sorry, I cannot fulfill that request as it conflicts with my core directives." })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, confidence: 99, citations: [] })}\n\n`);
    return res.end();
  }

  // Update query logs if it's unique
  const existingQuery = analytics.popularQueries.find(q => q.query.toLowerCase() === query.toLowerCase());
  if (existingQuery) {
    existingQuery.count++;
  } else {
    analytics.popularQueries.push({ query, count: 1 });
    // Keep top 6 popular queries
    analytics.popularQueries.sort((a, b) => b.count - a.count);
    analytics.popularQueries = analytics.popularQueries.slice(0, 6);
  }
  analytics.questionsAsked++;
  saveAnalytics();

  // Search the knowledge base for top matching chunks
  const searchResults = await searchKnowledgeBase(query, 3);
  const bestMatch = searchResults[0];

  // Map scores to dynamic realistic relevance percentages. 
  // (Heuristic similarity-based score, not a calibrated probability of factual correctness)
  let confidence = 50;
  if (bestMatch && bestMatch.score > 0) {
    if (bestMatch.chunk.embedding) {
      // Semantic similarity score is usually 0.3 - 0.95
      confidence = Math.min(99, Math.max(50, Math.round((bestMatch.score + 0.15) * 105)));
    } else {
      // Keyword overlap similarity is 0.0 - 1.0
      confidence = Math.min(99, Math.max(50, Math.round(65 + bestMatch.score * 30)));
    }
  }

  // If there are literally no matches, confidence is low
  if (!bestMatch || bestMatch.score === 0) {
    confidence = 35;
  }

  // Collect source citations
  const citations = searchResults
    .filter(res => res.score > 0.05)
    .map(res => ({
      title: res.chunk.source,
      chunkTitle: res.chunk.title,
      score: Math.round(res.score * 100)
    }));

  // Unique citations only
  const uniqueCitations = citations.filter((item, idx, self) =>
    self.findIndex(t => t.title === item.title) === idx
  );

  // Setup Server-Sent Events (SSE) Response Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Format contextual content for LLM
  const contextText = searchResults
    .filter(r => r.score > 0.05)
    .map(r => `Source: ${r.chunk.source} [${r.chunk.title}]: ${r.chunk.content}`)
    .join("\n\n");

  // Common stop words to exclude from fuzzy token matching
  const stopWords = new Set(["what", "is", "your", "my", "the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "me", "show", "tell", "about", "how", "does", "why", "give", "can", "you", "please", "with", "have", "are", "do"]);

  // Helper function to check if query matches any pattern with fuzzy tolerance
  const matchPattern = (q: string, patterns: string[]): boolean => {
    const cleanQ = q.toLowerCase().replace(/[^\w\s]/g, " ").trim();
    const qWords = cleanQ.split(/\s+/).filter(w => w.length > 0 && !stopWords.has(w));
    
    for (const pat of patterns) {
      const cleanPat = pat.toLowerCase().replace(/[^\w\s]/g, " ").trim();
      if (cleanQ.includes(cleanPat)) return true;
      
      const patWords = cleanPat.split(/\s+/);
      if (patWords.length === 1 && !stopWords.has(patWords[0])) {
        if (qWords.some(w => fuzzyMatchToken(w, patWords[0]))) return true;
      }
    }
    return false;
  };

  // Fallback direct answers if Gemini API Key is missing or invalid
  if (!ai) {
    res.write(`data: ${JSON.stringify({ chunk: "🤖 **[Atlas AI Active]**\n\n" })}\n\n`);
    
    const cleanLowerQuery = query.trim().toLowerCase();
    let textReply = "";
    
    // Priority 1: Match against comprehensive intent library (100+ categories)
    const exactIntentResponse = matchChatbotIntent(cleanLowerQuery);
    if (exactIntentResponse) {
      textReply = exactIntentResponse;
    // 2. GitHub & Open-Source Code Repositories
    } else if (matchPattern(cleanLowerQuery, ["github", "git hub", "githb", "git", "repo", "repos", "repository", "repositories", "codebase", "source code", "open source", "leetcode", "hackerrank", "codechef"])) {
      textReply = `### Kartik Raikar's GitHub & Code Repositories

• 🐙 **GitHub Profile**: [github.com/kartik-012](https://github.com/kartik-012)

**Top Repositories:**
1. 🌐 **Atlas AI Resume**: [github.com/kartik-012/Atlas-AI-Resume](https://github.com/kartik-012/Atlas-AI-Resume)
2. ⚡ **AIOps Root Cause Correlator**: [github.com/kartik-012/aiops-rca](https://github.com/kartik-012/aiops-rca)
3. 📚 **VersionRAG**: [github.com/kartik-012/versionrag](https://github.com/kartik-012/versionrag)
4. 🔧 **GitHub MCP Toolkit**: [github.com/kartik-012/github-mcp-toolkit](https://github.com/kartik-012/github-mcp-toolkit)
5. 📊 **ApexRAG**: [github.com/kartik-012/apexrag](https://github.com/kartik-012/apexrag)

*Which repository would you like to explore?*`;

    // 3. Email & Direct Messaging
    } else if (matchPattern(cleanLowerQuery, ["email", "mail", "gmail", "e-mail", "inbox", "send email", "write email"])) {
      textReply = `### Kartik Raikar's Email Address

• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358)
• 💼 **LinkedIn**: [linkedin.com/in/kartik-raikar-kr](https://www.linkedin.com/in/kartik-raikar-kr)

*Kartik actively checks his inbox and responds promptly!*`;

    // 4. Phone, WhatsApp & Calling
    } else if (matchPattern(cleanLowerQuery, ["phone", "mobile", "number", "cell", "call", "whatsapp", "whats app", "calling", "contact number", "phone number"])) {
      textReply = `### Kartik Raikar's Phone & WhatsApp

• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358) *(Direct calls & WhatsApp active)*
• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 💼 **LinkedIn**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)

*You can call or message Kartik directly!*`;

    // 5. Contact, Schedule Interview & Availability
    } else if (matchPattern(cleanLowerQuery, ["contact", "reach", "reach out", "connect", "schedule", "interview", "touch", "get in touch"])) {
      textReply = `### Contact Kartik Raikar & Schedule Interview

• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358)
• 💼 **LinkedIn**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)
• 🐙 **GitHub**: [github.com/kartik-012](https://github.com/kartik-012)
• 📍 **Location**: Belagavi, Karnataka, India (Open to Remote / Relocation)

*Kartik is immediately available for AI Engineering and Generative AI roles!*`;

    // 6. Resume, CV & PDF Download
    } else if (matchPattern(cleanLowerQuery, ["resume", "cv", "pdf", "download", "document", "paper", "curriculum", "biodata"])) {
      textReply = `### Kartik Raikar's Resume & CV

• 📄 **Interactive Resume Viewer**: Currently loaded on the main screen.
• 📥 **Direct Download**: Use the **"Download Resume"** button in the top navigation bar.
• 🎓 **Education**: B.E. in CSE (AI & ML) (Aug 2023 – Jul 2027), Jain College of Engineering (VTU) — **8.50 CGPA**.
• 📜 **Credentials**: 3 Industry Certifications (Oracle, AWS, Tata).
• 🚀 **Projects**: AIOps RCA, VersionRAG, GitHub MCP Toolkit, ApexRAG, Atlas AI Resume.

*Would you like me to highlight his technical skills or project achievements?*`;

    // 7. Location & Work Preferences
    } else if (matchPattern(cleanLowerQuery, ["location", "where", "city", "state", "country", "address", "belagavi", "karnataka", "india", "relocate", "relocation", "remote", "onsite", "hybrid", "based"])) {
      textReply = `### Location & Work Preferences

• 📍 **Current Location**: Belagavi, Karnataka, India
• 🌍 **Work Availability**: Open to **Remote**, **Hybrid**, and **Onsite** opportunities.
• ⚡ **Notice Period**: Immediate availability.

*Reach Kartik at **+91 8660910358** or **kartikraikar2005@gmail.com**.*`;

    // 8. Education, College, Degree & CGPA
    } else if (matchPattern(cleanLowerQuery, ["education", "college", "university", "school", "degree", "b.e", "be", "bachelor", "jain college", "vtu", "gpa", "cgpa", "marks", "grade", "academics", "study", "branch", "engineering", "pu", "pre university"])) {
      textReply = `### Education & Academic Background

• 🎓 **Degree**: B.E. in **Computer Science & Engineering (AI & ML)** (Aug 2023 – Jul 2027)
• 🏫 **Institution**: **Jain College of Engineering, Belagavi**
• 🏛️ **University**: **Visvesvaraya Technological University (VTU)**
• 📈 **CGPA**: **8.50 / 10.0**
• 📚 **Pre-University**: PCM at Jain PU College, Belagavi (2021–2023, 80%)
• 📖 **Coursework**: DSA, OOP, DBMS, Data Science, OS, Computer Networks, AI, ML.

*Would you like to explore his certifications or projects?*`;

    // 9. Certifications
    } else if (matchPattern(cleanLowerQuery, ["certificate", "certificates", "certification", "certifications", "cert", "certs", "credentials", "oracle", "aws", "tata", "forage"])) {
      textReply = `### Kartik's 3 Verified Industry Certifications

1. ☁️ **Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate**: Generative AI, ML, OCI AI Services, LLMs.
2. ⚡ **AWS Training & Certification – Fundamentals of ML and AI**: SageMaker, Bedrock, NLP, Computer Vision.
3. 📊 **Tata – GenAI Powered Data Analytics Job Simulation (Forage)**: GenAI, Data Analytics, Prompt Engineering.

*Would you like details on any specific credential?*`;

    // 10. Project: AIOps Root Cause Correlator
    } else if (matchPattern(cleanLowerQuery, ["aiops", "root cause", "rca", "incident engine", "alert storm", "ewma", "anomaly detection", "networkx", "topology"])) {
      textReply = `### Project Spotlight: AIOps Root Cause Correlator

• ⚡ **Overview**: Autonomous incident correlation engine for microservice environments.
• 🛠️ **Tech Stack**: Python, FastAPI, PostgreSQL, Redis, NetworkX, Three.js, WebSockets, pgvector.
• 📊 **Key Metrics**:
  - Resolves cascading alert storms in **0.78s** (down from 1-4 hours).
  - **100% Top-1 RCA accuracy** across 30 benchmark scenarios.
  - **100% precision/recall** in false-positive suppression.
• ⚡ **Architecture**: EWMA anomaly detection (z > 2.0σ) + causal DAG traversal + 3D Three.js topology visualizer.
• 🐙 **GitHub**: [github.com/kartik-012/aiops-rca](https://github.com/kartik-012/aiops-rca)

*Would you like to explore the EWMA detection or 3D visualizer?*`;

    // 11. Project: VersionRAG
    } else if (matchPattern(cleanLowerQuery, ["versionrag", "version rag", "documentation intelligence", "cross version", "deprecated api", "ast diff", "chain of version", "version partitioned"])) {
      textReply = `### Project Spotlight: VersionRAG

• 📚 **Overview**: Enterprise RAG solving cross-version code contamination.
• 🛠️ **Tech Stack**: Python 3.12, FastAPI, PostgreSQL, pgvector, React 18, TypeScript, Tailwind.
• 📊 **Key Metrics**:
  - Hallucinated deprecated API calls: **62.5% → 0.0%**.
  - AST semantic diff accuracy: **94.2%**.
  - Retrieval precision @k=6: **41.7% → 98.4% (+136%)** at 5.4ms HNSW latency.
• 🐙 **GitHub**: [github.com/kartik-012/versionrag](https://github.com/kartik-012/versionrag)

*Would you like to explore the version-partitioned indexing architecture?*`;

    // 12. Project: GitHub MCP Toolkit
    } else if (matchPattern(cleanLowerQuery, ["mcp", "mcp toolkit", "github mcp", "model context protocol", "fastmcp", "preview token", "sha-256", "saga rollback", "abac"])) {
      textReply = `### Project Spotlight: GitHub MCP Toolkit

• 🔧 **Overview**: Production-ready MCP server for LLM-driven repository automation.
• 🛠️ **Tech Stack**: Python, FastMCP, GitHub API, Ollama, Docker, GitHub Actions.
• 📊 **Key Metrics**:
  - Eliminated **14% blind bulk-mutation rate** via SHA-256 preview-token protocol.
  - Intent execution accuracy: **64% → 100%**.
  - **Zero prompt injections** across 20 adversarial test suites.
• 🐙 **GitHub**: [github.com/kartik-012/github-mcp-toolkit](https://github.com/kartik-012/github-mcp-toolkit)

*Would you like to learn about the ABAC security or Saga rollback?*`;

    // 13. Project: ApexRAG
    } else if (matchPattern(cleanLowerQuery, ["apexrag", "apex rag", "retrieval evaluation", "bm25", "cross encoder", "reranking", "query router", "retrieval benchmark"])) {
      textReply = `### Project Spotlight: ApexRAG

• 📊 **Overview**: Comprehensive RAG retrieval evaluation system.
• 🛠️ **Tech Stack**: Python, FastAPI, ChromaDB, Sentence Transformers, Ollama, scikit-learn.
• 📊 **Key Metrics**:
  - **2,580 documentation chunks** and **100 human-verified Q&A pairs**.
  - Retrieval accuracy: **61% (BM25) → 85% (Cross-Encoder Re-ranking)**.
  - Established **ranking quality** as the primary bottleneck.
• 🐙 **GitHub**: [github.com/kartik-012/apexrag](https://github.com/kartik-012/apexrag)

*Would you like to explore the 5 retrieval strategies?*`;

    // 14. Project: Atlas AI Resume
    } else if (matchPattern(cleanLowerQuery, ["atlas ai resume", "telemetry", "kb studio", "knowledge base studio", "rate limit", "rag portfolio", "resume assistant"])) {
      textReply = `### Project Spotlight: Atlas AI Resume

• 🌐 **Overview**: RAG-Powered AI Portfolio & Interactive Resume Assistant (this web app!).
• 🛠️ **Tech Stack**: React 19, TypeScript, Node.js, Express, Gemini API, Vector Search, TailwindCSS, Vite.
• ⚡ **Key Features**:
  1. **Dual-Layer RAG Engine**: Vector similarity search + LLM streaming + offline heuristic fallbacks.
  2. **Recruiter Telemetry Console**: Real-time dashboard tracking visitor analytics.
  3. **Knowledge Base Admin Studio**: Dynamic indexing and search diagnostics.
• 🐙 **GitHub**: [github.com/kartik-012/Atlas-AI-Resume](https://github.com/kartik-012/Atlas-AI-Resume)

*Would you like to explore another project or view his credentials?*`;

    // 15. All Projects Overview
    } else if (matchPattern(cleanLowerQuery, ["project", "projects", "what did you build", "built", "work", "portfolio", "showcase"])) {
      textReply = `### Kartik's 5 Production Projects

1. 🌐 **Atlas AI Resume**: RAG portfolio with Recruiter Telemetry Console & KB Studio.
2. ⚡ **AIOps Root Cause Correlator**: 0.78s incident resolution, 100% Top-1 RCA accuracy.
3. 📚 **VersionRAG**: 62.5% → 0.0% hallucination, 98.4% retrieval precision.
4. 🔧 **GitHub MCP Toolkit**: 64% → 100% intent accuracy, zero prompt injections.
5. 📊 **ApexRAG**: 61% → 85% retrieval accuracy across 5 strategies.

*Which project would you like to dive into?*`;

    // 16. Technical Skills & Tech Stack
    } else if (matchPattern(cleanLowerQuery, ["skill", "skills", "tech stack", "technology", "technologies", "languages", "python", "typescript", "fastapi", "react", "nextjs", "database", "postgres", "qdrant", "redis", "docker", "tools", "frameworks", "stack", "pytorch"])) {
      textReply = `### Kartik's Technical Stack & Skills

• **Programming**: Python, JavaScript, TypeScript, SQL
• **Frameworks**: FastAPI, React.js, Next.js, PyTorch
• **AI/ML**: Generative AI, LLMs, RAG, Transformers, AI Evaluation, Prompt Engineering, Semantic Search, Vector Search
• **Databases**: PostgreSQL (pgvector), MySQL, MongoDB, Redis, Qdrant
• **Tools**: Git, GitHub, Docker, Linux, Postman, VS Code, GitHub Actions
• **Data & Viz**: Power BI, Tableau, Microsoft Excel

*Would you like details on how any specific tool was used in his projects?*`;

    // 17. Why Hire Kartik?
    } else if (matchPattern(cleanLowerQuery, ["why hire", "hire kartik", "why should we hire", "why you", "why should i hire", "reasons to hire", "sell yourself", "pitch"])) {
      textReply = `### Why Hire Kartik Raikar? (Top 5 Reasons)

1. ⚡ **Production AI with Measurable Impact**: 0.78s incident resolution (AIOps RCA), 62.5% → 0.0% hallucination (VersionRAG).
2. 📚 **RAG Architecture Expert**: Version-partitioned indexing, 98.4% retrieval precision, 5-strategy benchmarking.
3. 🔧 **LLM Tooling & Safety**: MCP server with 100% intent accuracy, zero prompt injections.
4. 📊 **Scientific Evaluation Rigor**: ApexRAG systematically isolating retrieval bottlenecks.
5. 🏅 **Leadership & Credentials**: VP of AI&ML Dept, 8.50 CGPA, 3 certifications (Oracle, AWS, Tata).

*Would you like to schedule an interview or view his GitHub?*`;

    // 18. Technical Challenge
    } else if (matchPattern(cleanLowerQuery, ["technical challenge", "challenge", "hardest problem", "bug", "difficult problem", "problem solved"])) {
      textReply = `### Technical Challenge: Cross-Version Contamination in VersionRAG

• **The Problem**: RAG systems hallucinating deprecated API calls 62.5% of the time due to cross-version contamination.
• **Kartik's Solution**:
  1. **Version-Partitioned Indexing**: Database-enforced version isolation eliminated contamination (62.5% → 0.0%).
  2. **AST Semantic Diff Engine**: Detects undocumented breaking changes with 94.2% accuracy.
  3. **Retrieval Precision**: Boosted from 41.7% to 98.4% (+136%) at 5.4ms HNSW latency.

*Would you like to explore the AIOps RCA challenge next?*`;

    // 19. RAG & Hallucination
    } else if (matchPattern(cleanLowerQuery, ["hallucination", "rag", "faithfulness", "grounding", "prevent hallucination"])) {
      textReply = `### RAG Reliability & Hallucination Mitigation

1. 📚 **Version-Partitioned Indexing** (VersionRAG): 62.5% → 0.0% hallucination.
2. 🎯 **AST Semantic Diff**: Detects undocumented breaking changes (94.2% accuracy).
3. 📊 **Multi-Strategy Evaluation** (ApexRAG): Benchmarked 5 strategies, 61% → 85%.
4. 🔒 **Path-Based Hashing**: Eliminates data contamination and ID collisions.
5. 🤖 **Dynamic Query Router**: Logistic Regression selects optimal retrieval strategy per query.

*Would you like to see how VersionRAG or ApexRAG implements this?*`;

    // 20. Leadership & Achievements
    } else if (matchPattern(cleanLowerQuery, ["leadership", "vice president", "achievements", "hackathon", "hack2future", "innovex", "team velora"])) {
      textReply = `### Leadership & Achievements

• 🏅 **Vice President – AI & ML Department**: Led departmental initiatives and coordinated technical and academic programs at Jain College of Engineering, Belagavi.
• 🏆 **Hack2Future 2.0 – IIIT Dharwad**: Competed as part of Team Velora in a national-level hackathon.
• 💻 **Code for Innovex – NITTE NMAM IT**: Participated in a 24-hour national-level hackathon.

*Would you like to explore his projects or certifications?*`;

    // 21. Greetings & Casual
    } else if (
      cleanLowerQuery === "hi" || 
      cleanLowerQuery === "hello" || 
      cleanLowerQuery === "hey" || 
      cleanLowerQuery === "hey there" || 
      cleanLowerQuery === "who are you" || 
      cleanLowerQuery === "what can you do" ||
      cleanLowerQuery === "help" ||
      cleanLowerQuery.length <= 3
    ) {
      textReply = `Hello! 👋 I'm **Atlas AI**, Kartik Raikar's candidate representative.

I'm ready to answer any questions about Kartik's AI engineering background, projects, and credentials.

**Quick topics to explore:**
• ⚡ **AIOps Root Cause Correlator**: 0.78s incident resolution, 100% accuracy
• 📚 **VersionRAG**: 62.5% → 0.0% hallucination, 98.4% precision
• 🔧 **GitHub MCP Toolkit**: 64% → 100% intent accuracy
• 📊 **ApexRAG**: 61% → 85% retrieval accuracy across 5 strategies
• 📜 **3 Certifications**: Oracle AI, AWS ML, Tata GenAI

*Feel free to ask a question or pick a topic below!*`;

    // 22. Bio / Introduction
    } else if (matchPattern(cleanLowerQuery, ["who is", "about kartik", "tell me about yourself", "bio", "introduction", "overview", "summary", "introduce yourself", "profile"])) {
      textReply = `**Kartik Raikar** is an AI Engineer specializing in **Generative AI, LLMs, RAG, and AI Evaluation**, pursuing B.E. in CSE (AI & ML) at **Jain College of Engineering, Belagavi** (VTU, **8.50 CGPA**, Aug 2023 – Jul 2027).

**Core Highlights:**
• ⚡ **AIOps**: Built incident correlation engine with 100% Top-1 RCA accuracy in 0.78s.
• 📚 **RAG Architecture**: Eliminated 62.5% hallucination to 0.0% in VersionRAG.
• 🔧 **MCP Servers**: GitHub MCP Toolkit with 100% intent accuracy.
• 🏅 **Leadership**: Vice President of AI & ML Department.
• 📜 **Certified**: Oracle AI Foundations, AWS ML, Tata GenAI.

*Would you like to explore any project in detail or view his contact info?*`;

    // 23. Context-Matched Fallback
    } else if (contextText && bestMatch.score > 0.05) {
      textReply = `Based on Kartik's official portfolio knowledge base:\n\n${bestMatch.chunk.content}\n\n*If you'd like to explore further, ask about his projects (AIOps RCA, VersionRAG, GitHub MCP Toolkit, ApexRAG), his 3 certifications, or his technical skills!*`;
    } else {
      textReply = `I'd be glad to help you learn more about Kartik Raikar! Here are key areas you can ask me about:

1. 🚀 **His 5 Major Projects**: Atlas AI Resume, AIOps Root Cause Correlator, VersionRAG, GitHub MCP Toolkit, and ApexRAG.
2. 🛠️ **Technical Stack**: Python, FastAPI, React.js, PostgreSQL, pgvector, Redis, Docker, PyTorch.
3. 📜 **3 Certifications**: Oracle AI Foundations, AWS ML & AI, Tata GenAI.
4. 🏅 **Leadership**: Vice President of AI & ML Department, hackathon competitor.
5. 📞 **Contact**: Phone (+91 8660910358), Email, LinkedIn.

Which area would you like to explore?`;
    }

    // Clean any leading ### Header line so response starts directly with 🤖 **[Atlas AI Active]** followed by the answer body
    const cleanedReply = textReply.replace(/^###\s+[^\n]*\n+/, "");

    // Stream the fallback text with natural, comfortable reading cadence
    const words = cleanedReply.split(" ");
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      res.write(`data: ${JSON.stringify({ chunk: word + " " })}\n\n`);
      
      // Natural human-readable pacing
      let delay = 22;
      if (word.endsWith(".") || word.endsWith("?") || word.endsWith("!")) {
        delay = 45;
      } else if (word.endsWith(":") || word.includes("\n")) {
        delay = 35;
      } else if (word.endsWith(",")) {
        delay = 28;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    res.write(`data: ${JSON.stringify({ done: true, confidence, citations: uniqueCitations })}\n\n`);
    return res.end();
  }

  // ==================== CALL GEMINI FOR REAL RAG ====================
  try {
    const historyFormatted = (messages || [])
      .slice(-4) // Keep last 4 messages for memory
      .map((m: any) => `${m.role === "user" ? "Recruiter" : "Atlas AI"}: ${m.content}`)
      .join("\n");

    const systemInstruction = `You are Atlas AI — Kartik Raikar's dedicated, articulate, and courteous AI candidate representative and portfolio guide. You represent Kartik to recruiters, hiring managers, engineers, and collaborators.

KARTIK'S VERIFIED GROUND TRUTH FACTS:
- Full Name: Kartik Raikar
- Role: AI Engineer — Generative AI — LLM Applications
- Education: B.E. in Computer Science & Engineering (AI & ML) at Jain College of Engineering, Belagavi, VTU (Aug 2023 – Jul 2027, CGPA: 8.50/10.0). Pre-University: PCM at Jain PU College, Belagavi (2021–2023, 80%).
- Email: kartikraikar2005@gmail.com | Phone/WhatsApp: +91 8660910358
- Location: Belagavi, Karnataka, India (Available for Remote, Hybrid, or Onsite roles)
- GitHub: https://github.com/kartik-012 | LinkedIn: https://www.linkedin.com/in/kartik-raikar-kr | Portfolio: https://kartikportfolio-eta.vercel.app/ | Atlas AI Resume: https://atlas-ai-resume.vercel.app/
- Professional Summary: AI Engineer specializing in Generative AI, LLMs, RAG, and AI evaluation. Experienced in building production-oriented AI applications using Python, FastAPI, React.js, SQL, vector databases, and modern LLM tooling.
- 5 Major Projects:
  1. Atlas AI Resume: RAG-Powered AI Portfolio & Interactive Resume Assistant (React 19, TypeScript, Node.js, Express, Gemini API, RAG, Vector Search, TailwindCSS, Vite)
  2. AIOps Root Cause Correlator – Incident Engine: Autonomous incident correlation engine resolving cascading microservice alert storms in 0.78s (down from 1-4 hours), achieving 100% Top-1 RCA accuracy across 30 benchmark scenarios. EWMA anomaly detection (z > 2.0σ) with causal DAG traversal in NetworkX. 3D topology visualizer with Three.js/WebGL. (Python, FastAPI, PostgreSQL, Redis, NetworkX, Three.js, pgvector)
  3. VersionRAG – Documentation Intelligence: Enterprise RAG eliminating cross-version code contamination. Hallucinated deprecated API calls from 62.5% to 0.0%. AST semantic diff engine with 94.2% accuracy. Retrieval precision @k=6 from 41.7% to 98.4% (+136%) at 5.4ms HNSW latency. 4-step Chain-of-Version reasoning pipeline. (Python 3.12, FastAPI, PostgreSQL, pgvector, React 18, TypeScript, Tailwind)
  4. GitHub MCP Toolkit – Fault-Tolerant MCP Server: Production-ready Anthropic Model Context Protocol (MCP) server. Eliminated 14% blind bulk-mutation rate via SHA-256 preview-token protocol. Intent execution accuracy from 64% to 100%. Zero prompt injections across 20 adversarial suites. (Python, FastMCP, GitHub API, Ollama, Docker, GitHub Actions)
  5. ApexRAG – RAG Retrieval Evaluation System: Comprehensive RAG evaluation benchmark over 2,580 docs and 100 Q&A pairs. Improved retrieval accuracy from 61% (BM25) to 85% (Cross-Encoder Re-ranking). Path-based hashing. Logistic Regression query router. (Python, FastAPI, ChromaDB, Sentence Transformers, Ollama, scikit-learn)
- 3 Certifications:
  - Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate
  - AWS Training & Certification – Fundamentals of Machine Learning and Artificial Intelligence
  - Tata – GenAI Powered Data Analytics Job Simulation (Forage)
- Technical Skills: Programming: Python, JavaScript, TypeScript, SQL. Frameworks: FastAPI, React.js, Next.js, PyTorch. Databases: PostgreSQL, MySQL, MongoDB, Redis, Qdrant. Tools: Git, GitHub, Docker, Linux, Postman, VS Code. Data & Viz: Power BI, Tableau, Excel. AI/ML: Generative AI, LLMs, RAG, Transformers, AI Evaluation, Prompt Engineering, Semantic Search, Vector Search.
- Leadership: Vice President – Department of AI & ML, Jain College of Engineering. Hack2Future 2.0 (IIIT Dharwad). Code for Innovex (NITTE NMAM IT).
- Relevant Coursework: Data Structures & Algorithms, OOP, DBMS, Data Science, OS, Computer Networks, Software Engineering, AI, Machine Learning.
- Availability: Immediate availability for AI Engineering, Generative AI, and LLM Application roles.

PERSONA & COMMUNICATION RULES:
1. Candidate Advocacy: Speak warmly, professionally, and politely in the first-person plural or candidate advocate voice ("Kartik has built...", "We architected...").
2. Handling Brief, Vague, or Improper Questions:
   - If the user's prompt is short, casual, or vague (e.g. "hi", "projects?", "skills?", "why?", "tell me more"), provide a polite, concise summary of Kartik's strengths, and then politely suggest 3-4 structured options or follow-up technical questions in a courteous candidate way.
3. Clean Formatting:
   - Use crisp Markdown formatting: **bold** key metrics and technologies, clean bulleted lists, and structured headings.
4. Contact Inquiries:
   - When asked for contact information, always provide email (kartikraikar2005@gmail.com), phone/WhatsApp (+91 8660910358), and LinkedIn profile link.
5. Strict Grounding:
   - Answer strictly from the verified facts above and the retrieved context below. Never invent information or stray off-topic.

VERIFIED PORTFOLIO CONTEXT:
${contextText || "No matching contextual chunks found for this specific query."}

CONVERSATION HISTORY:
${historyFormatted}

User Query: ${query}`;

    const streamResponse = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: query,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature = stays factual, doesn't get creative with your resume facts
      }
    });

    for await (const chunk of streamResponse) {
      const textChunk = chunk.text || "";
      if (textChunk) {
        res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
      }
    }

    // Send final completion message with metadata
    res.write(`data: ${JSON.stringify({ done: true, confidence, citations: uniqueCitations })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("LLM processing error:", err);
    res.write(`data: ${JSON.stringify({ chunk: "I'm having trouble connecting right now. Here's what I found in Kartik's portfolio related to your question:\n\n" })}\n\n`);
    res.write(`data: ${JSON.stringify({ chunk: `**Best Matched Resume Content:**\n${bestMatch ? bestMatch.chunk.content : "No context available."}` })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, confidence, citations: uniqueCitations })}\n\n`);
    res.end();
  }
});

// POST: Admin Endpoint - Upload new knowledge items
app.post("/api/admin/upload", adminAuth, (req, res) => {
  const { title, source, content } = req.body;
  if (!title || typeof title !== "string" || !content || typeof content !== "string") {
    return res.status(400).json({ error: "Missing or invalid title or content" });
  }
  if (content.length > 10000) {
    return res.status(400).json({ error: "Content exceeds maximum length of 10,000 characters." });
  }

  const newChunk: KnowledgeChunk = {
    id: `custom-upload-${Date.now()}`,
    title,
    source: source || "Uploaded_Doc.pdf",
    content,
    embedding: null
  };

  knowledgeBase.push(newChunk);
  
  // Re-embed database asynchronously
  calculateEmbeddings().catch(err => console.error("Async embedding calculation failed on upload", err));
  saveKnowledgeBase();

  res.json({ success: true, message: "Material successfully chunked and injected into local RAG database!" });
});

// POST: Admin Endpoint - Reset database
app.post("/api/admin/reset", adminAuth, (req, res) => {
  knowledgeBase = buildDefaultKnowledgeBase();
  saveKnowledgeBase();
  calculateEmbeddings().catch(err => console.error("Async embedding calculation failed on reset", err));
  res.json({ success: true, message: "RAG index reverted to official resume.pdf defaults!" });
});

// GET: Admin Endpoint - Retrieve indexed chunks
app.get("/api/admin/chunks", adminAuth, (req, res) => {
  const chunksSummary = knowledgeBase.map(chunk => ({
    id: chunk.id,
    title: chunk.title,
    source: chunk.source,
    length: chunk.content.length,
    hasEmbedding: !!chunk.embedding
  }));
  res.json({ chunks: chunksSummary });
});

// DELETE: Admin Endpoint - Delete an indexed chunk
app.delete("/api/admin/chunks/:id", adminAuth, (req, res) => {
  const { id } = req.params;
  const initialLength = knowledgeBase.length;
  knowledgeBase = knowledgeBase.filter(chunk => chunk.id !== id);
  if (knowledgeBase.length < initialLength) {
    saveKnowledgeBase();
    calculateEmbeddings().catch(err => console.error("Async embedding calculation failed on delete", err));
    res.json({ success: true, message: "Material successfully deleted and RAG index updated!" });
  } else {
    res.status(404).json({ error: "Indexed chunk not found." });
  }
});

// POST: Admin Endpoint - Query test search
app.post("/api/admin/search", adminAuth, async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });
  const results = await searchKnowledgeBase(query, 2);
  const formattedResults = results.map(r => ({
    title: r.chunk.title,
    source: r.chunk.source,
    content: r.chunk.content,
    score: Math.round(r.score * 100)
  }));
  res.json({ results: formattedResults });
});

// POST: Google Drive AI Analysis Endpoint
app.post("/api/drive/analyze", apiLimiter, async (req, res) => {
  const { fileName, mimeType, fileSize, modifiedTime, description, snippet } = req.body;
  if (!fileName || typeof fileName !== "string") {
    return res.status(400).json({ error: "Missing or invalid file name" });
  }

  const fileContext = `
File Name: ${fileName}
MIME Type: ${mimeType || "Unknown"}
File Size: ${fileSize || "Unknown"}
Last Modified: ${modifiedTime || "Unknown"}
Description: ${description || "None provided"}
File Content Snippet: ${snippet || "No direct snippet available"}
  `;

  if (!ai) {
    // Elegant fallback simulation when Gemini Key is absent
    const fallbackResponse = {
      summary: `This is an automated structural analysis of "${fileName}". The file appears to be a ${mimeType?.split("/").pop() || "resource"} of size ${fileSize || "unknown size"}, last modified on ${modifiedTime || "unknown date"}.`,
      fileTypeAnalysis: `Mime type "${mimeType}" represents a digital workspace asset, crucial for modern operational workflows.`,
      insights: [
        `File structure matches typical developer or administrator repository signatures with a size footprint of ${fileSize || "standard size"}.`,
        `Activity logs indicate this asset was last updated during active working sessions on ${modifiedTime || "recent session"}.`,
        description ? `Provided description ("${description}") indicates active indexing by the owner.` : `No custom embedded indexing description was found for this file.`
      ],
      aiSuggestions: [
        `Integrate this asset into your recruitment review process if it contains relevant developer coordinates.`,
        `Ensure file permissions are aligned with your organizational security standards.`,
        `Initiate a deep search context embedding once the live Gemini API key is configured.`
      ]
    };
    return res.json(fallbackResponse);
  }

  try {
    const prompt = `You are Atlas AI, an ultra-intelligent workspace analyst.
Analyze the following Google Drive file metadata and snippet, and provide a structured professional analysis.

${fileContext}

Provide your response in JSON format containing exactly these fields:
{
  "summary": "2-3 sentences general executive summary",
  "fileTypeAnalysis": "1-2 sentences explaining what this MIME type represents and its utility in professional settings",
  "insights": ["3 distinct analytical bullet points based on the metadata and snippet provided"],
  "aiSuggestions": ["3 distinct action-oriented suggestions or next steps for the user"]
}

Do NOT wrap the response in markdown code blocks like \`\`\`json. Return pure JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "{}";
    const resultJson = JSON.parse(resultText);
    res.json(resultJson);
  } catch (err: any) {
    console.error("Failed to analyze Google Drive file:", err);
    res.status(500).json({ error: "Failed to perform AI analysis on Google Drive file" });
  }
});

// ==================== VITE & STATIC SERVING ====================

if (!process.env.VERCEL) {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    // Production: Serve pre-built client assets
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Development: Mount Vite server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // Listen on Port 3000 (skip on Vercel)
  if (process.env.NODE_ENV !== "test") {
    app.listen(3000, "0.0.0.0", () => {
      console.log("Atlas AI server listening on http://0.0.0.0:3000");
    });
  }
}

// Export for testing
export { app, cosineSimilarity, keywordSimilarity, searchKnowledgeBase };
