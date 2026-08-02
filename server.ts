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

  // 1. General Profile Summary with all contact details
  chunks.push({
    id: "profile-summary",
    title: "Summary & Overview",
    source: "Resume.pdf",
    content: `Kartik Raikar is an AI & Machine Learning undergraduate student (B.E., 2023–2027) at Jain College of Engineering, Belagavi, Karnataka, under Visvesvaraya Technological University (VTU). CGPA: 8.5/10.0. He is an AI Engineer & Systems Architect. ${resumeData.summary} Contact Email: ${resumeData.email}, Phone: ${resumeData.phone}, Github: ${resumeData.github}, LinkedIn: ${resumeData.linkedin}. Location: ${resumeData.location}.`
  });

  // 2. Education with CGPA
  chunks.push({
    id: "education",
    title: "Education & Institution",
    source: "Resume.pdf",
    content: `Education: Kartik is pursuing a ${resumeData.education.degree} in ${resumeData.education.major} (${resumeData.education.period}) at ${resumeData.education.institution} under ${resumeData.education.university}. CGPA: ${resumeData.education.cgpa}. He is passionate about systems, data structures, algorithms, and production AI applications.`
  });

  // 3. Contact Information chunk
  chunks.push({
    id: "contact-info",
    title: "Contact Information",
    source: "Resume.pdf",
    content: `Kartik Raikar Contact Info: Email: ${resumeData.email}. Phone/WhatsApp: ${resumeData.phone}. Location: ${resumeData.location}. GitHub: ${resumeData.github}. LinkedIn: ${resumeData.linkedin}. Portfolio: ${resumeData.portfolio}. Coding Profiles: ${resumeData.codingProfiles.map(p => `${p.platform} (${p.handle})`).join(", ")}.`
  });

  // 4. Technical Skills
  chunks.push({
    id: "skills-languages",
    title: "Skills - Programming Languages",
    source: "Resume.pdf",
    content: `Technical Programming Languages: Kartik is highly proficient in ${resumeData.skills.languages.join(", ")}.`
  });

  chunks.push({
    id: "skills-web-dev",
    title: "Skills - Frontend & Backend Frameworks",
    source: "Resume.pdf",
    content: `Web Development Stack: Frontend: ${resumeData.skills.frontend.join(", ")}. Backend: ${resumeData.skills.backend.join(", ")}. Database systems: ${resumeData.skills.database.join(", ")}. Tools: ${resumeData.skills.tools.join(", ")}.`
  });

  chunks.push({
    id: "skills-ai-ml",
    title: "Skills - AI, Machine Learning, & NLP",
    source: "Resume.pdf",
    content: `AI, Machine Learning, and Deep Learning Skills: Kartik possesses practical experience with ${resumeData.skills.aiMl.join(", ")}. He has integrated 5+ LLMs (GPT-4, Claude, Gemini, Llama 3, Mistral) into production applications.`
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
      content: `Kartik's Official Achievement: "${a.title}" ${a.icon || ""} - Description: ${a.description}`
    });
  });

  // 7. Certifications — grouped for richer context
  // Oracle certs
  const oracleCerts = resumeData.certifications.filter(c => c.issuerKey === "oracle");
  if (oracleCerts.length > 0) {
    chunks.push({
      id: "certifications-oracle",
      title: "Certifications: Oracle Cloud Infrastructure",
      source: "Certificates.pdf",
      content: `Oracle Certifications (all Sep 2025): ${oracleCerts.map(c => `"${c.title}" — Skills: ${c.skills.join(", ")}.`).join(" ")}`
    });
  }

  // AWS cert
  const awsCerts = resumeData.certifications.filter(c => c.issuerKey === "aws");
  awsCerts.forEach(c => {
    chunks.push({
      id: `certification-${c.id}`,
      title: `Certification: ${c.title}`,
      source: "Certificates.pdf",
      content: `AWS Certification of Kartik Raikar: "${c.title}" (Issued: ${c.date}) by ${c.issuer}. Skills: ${c.skills.join(", ")}. ${c.description}`
    });
  });

  // All other certs
  resumeData.certifications.filter(c => c.issuerKey !== "oracle" && c.issuerKey !== "aws").forEach(c => {
    chunks.push({
      id: `certification-${c.id}`,
      title: `Certification: ${c.title}`,
      source: "Certificates.pdf",
      content: `Official Certification of Kartik Raikar: "${c.title}" (Issued: ${c.date}) by ${c.issuer}. ${c.credentialId ? `Credential ID: ${c.credentialId}.` : ""} Skills: ${c.skills.join(", ")}. ${c.description}`
    });
  });

  // 8. All certifications summary
  chunks.push({
    id: "certifications-all-summary",
    title: "All Certifications - Complete List",
    source: "Certificates.pdf",
    content: `Kartik Raikar holds ${resumeData.certifications.length} verified certifications: ${resumeData.certifications.map(c => `${c.title} (${c.issuer}, ${c.date})`).join("; ")}.`
  });

  // 9. Interview & Technical Deep Dive Knowledge Chunks
  chunks.push({
    id: "interview-why-hire",
    title: "Interview Question: Why should we hire Kartik Raikar?",
    source: "Interview_Preparation.pdf",
    content: "Why Hire Kartik Raikar? 1) Proven Systems-Level AI Rigor: Unlike candidates who only call external APIs, Kartik implemented an entire Transformer from first principles in NumPyGPT (hand-coding backpropagation and 8-head attention) and built AtlasOS (a multi-tenant AI Memory Operating System with NLI contradiction detection). 2) Full-Stack Engineering Mastery: Fluent across FastAPI, React 19, Next.js 14, PostgreSQL (with RLS), Qdrant Vector DB, Redis 7, and Docker. 3) Evaluation & Reliability Focus: Built RagaAI Catalyst scoring Faithfulness (99.4%) and Hallucination rates, demonstrating an enterprise commitment to AI safety. 4) Industry Credentialed: Holds 13 verified certifications (Oracle Triple Certified, AWS ML, Microsoft Azure, Cisco, Deloitte, Tata, IBM). 5) Strong Academics & Problem Solving: 8.5 CGPA with active competitive programming practice on LeetCode and HackerRank."
  });

  chunks.push({
    id: "interview-technical-challenge",
    title: "Interview Question: Tell me about a complex technical challenge you solved.",
    source: "Interview_Preparation.pdf",
    content: "Technical Challenge & Problem Solving: When architecting AtlasOS (the AI Memory Operating System), Kartik faced the critical challenge of semantic memory drift and agent factual contradictions when ingesting continuous streams of episodic interactions. Solution: 1) Designed a 3-tier memory hierarchy separating ephemeral working state (Redis), chronological raw interactions (Qdrant + Postgres), and synthesized semantic facts. 2) Integrated a local Natural Language Inference (NLI) model (RoBERTa-large-MNLI) into the ingestion pipeline to classify new incoming facts against existing semantic embeddings as Entailment, Contradiction, or Neutral. 3) Developed policy-driven automated conflict resolution algorithms (confidence-weighted, recency-weighted, or manual review trigger) to guarantee agent state consistency without human intervention."
  });

  chunks.push({
    id: "interview-rag-hallucinations",
    title: "Interview Question: How do you prevent and audit hallucinations in RAG systems?",
    source: "Interview_Preparation.pdf",
    content: "RAG Reliability & Hallucination Mitigation Strategy: Kartik employs a multi-layered defense strategy: 1) Retrieval Precision: Uses dense vector embeddings (e.g. Gemini Embedding-2 or BAAI/bge-large-en-v1.5) combined with cosine similarity thresholds (>0.05) to eliminate irrelevant context chunks. 2) Strict System Grounding: Enforces low model temperature (0.2) and explicit system prompt rules that mandate answering solely from retrieved facts. 3) Output Faithfulness Auditing: Implemented in RagaAI Catalyst and RAG Hallucination Auditor by cross-checking generated claims against source chunks using cross-encoders and SentenceTransformers to calculate semantic entailment percentages (achieving 98.8%+ hallucination catch rates). 4) Dynamic Guardrails: Intercepts out-of-domain queries or high-risk answers with automated fallback intervention."
  });

  chunks.push({
    id: "interview-scaling-latency",
    title: "Interview Question: How do you optimize latency and throughput in AI applications?",
    source: "Interview_Preparation.pdf",
    content: "Latency & Scalability Optimization: In his production projects, Kartik achieves sub-45ms latency and high concurrency through: 1) Asynchronous Concurrency: Using FastAPI async endpoints and Node.js non-blocking I/O for parallel LLM calls. 2) Distributed Background Queues: Offloading heavy embedding generation, summarization, and evaluation tasks to Celery workers backed by Redis brokers. 3) Streaming Responses: Implementing Server-Sent Events (SSE) and WebSockets for immediate token streaming to the UI. 4) Multi-Tier Caching: Caching frequent semantic queries in Redis and keeping in-memory index maps for instant cosine similarity search."
  });

  chunks.push({
    id: "interview-career-goals",
    title: "Interview Question: What are your career aspirations and ideal role?",
    source: "Interview_Preparation.pdf",
    content: "Career Goals & Aspirations: Kartik aims to contribute as an AI Engineer, ML Systems Engineer, or Full-Stack AI Developer within forward-thinking technology teams. He is passionate about building autonomous multi-agent systems, hierarchical memory architectures, LLM evaluation pipelines, and high-throughput AI products that solve real-world problems with high reliability and visual excellence."
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
    } else if (
      matchPattern(cleanLowerQuery, ["linkedin", "linkdin", "linkdn", "linkin", "linked in", "linked-in", "social", "socials", "social media", "handle", "handles"]) ||
      (cleanLowerQuery.includes("id") && (cleanLowerQuery.includes("link") || cleanLowerQuery.includes("profile") || cleanLowerQuery.includes("kartik") || cleanLowerQuery.includes("user")))
    ) {
      textReply = `### Kartik Raikar's LinkedIn & Professional Profiles

• 💼 **LinkedIn Profile**: [linkedin.com/in/kartik-raikar-kr](https://www.linkedin.com/in/kartik-raikar-kr)
  - **Handle / ID**: \`@kartik-raikar-kr\`
  - **Status**: Open to AI/ML Engineering & Full-Stack Developer opportunities.

**Other Direct Channels:**
• 🐙 **GitHub**: [github.com/kartik-012](https://github.com/kartik-012)
• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358)
• 🌐 **Portfolio**: [kartikraikar.dev](https://kartikraikar.dev)
• 🤖 **Atlas AI Resume**: [atlas-ai-resume.vercel.app](https://atlas-ai-resume.vercel.app/)

*Feel free to connect on LinkedIn or message Kartik directly!*`;

    // 2. GitHub & Open-Source Code Repositories
    } else if (matchPattern(cleanLowerQuery, ["github", "git hub", "githb", "git", "repo", "repos", "repository", "repositories", "codebase", "source code", "open source", "leetcode", "hackerrank", "codechef"])) {
      textReply = `### Kartik Raikar's GitHub & Code Repositories

• 🐙 **GitHub Profile**: [github.com/kartik-012](https://github.com/kartik-012)

**Top Open-Source Repositories:**
1. 🌐 **Atlas AI Resume**: [github.com/kartik-012/Atlas-AI-Resume](https://github.com/kartik-012/Atlas-AI-Resume) (Live: [atlas-ai-resume.vercel.app](https://atlas-ai-resume.vercel.app/))
2. 🌌 **AtlasOS (AI Memory OS)**: [github.com/kartik-012/AtlasOS](https://github.com/kartik-012/AtlasOS)
3. ⚖️ **Debate Arena (3D Courtroom)**: [github.com/kartikraikar2005/debate-arena](https://github.com/kartikraikar2005/debate-arena)
4. 🐍 **NumPyGPT (Scratch Transformer)**: [github.com/kartikraikar2005/numpygpt](https://github.com/kartikraikar2005/numpygpt)
5. 📊 **RagaAI Catalyst (LLM Eval)**: [github.com/kartikraikar2005/ragaai-catalyst](https://github.com/kartikraikar2005/ragaai-catalyst)

*Which repository architecture would you like to explore?*`;

    // 3. Email & Direct Messaging
    } else if (matchPattern(cleanLowerQuery, ["email", "mail", "gmail", "e-mail", "inbox", "send email", "write email"])) {
      textReply = `### Kartik Raikar's Email Address

• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358)
• 💼 **LinkedIn**: [linkedin.com/in/kartik-raikar-kr](https://www.linkedin.com/in/kartik-raikar-kr)
• 🌐 **Portfolio**: [kartikraikar.dev](https://kartikraikar.dev)

*Kartik actively checks his inbox and responds to recruiter and engineering inquiries promptly!*`;

    // 4. Phone, WhatsApp & Calling
    } else if (matchPattern(cleanLowerQuery, ["phone", "mobile", "number", "cell", "call", "whatsapp", "whats app", "calling", "contact number", "phone number", "ph no"])) {
      textReply = `### Kartik Raikar's Phone & WhatsApp

• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358) *(Direct calls & WhatsApp active)*
• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 💼 **LinkedIn**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)
• 📍 **Location**: Belagavi, Karnataka, India

*You can call or message Kartik directly to discuss interview opportunities!*`;

    // 5. Contact, Schedule Interview & Availability
    } else if (matchPattern(cleanLowerQuery, ["contact", "reach", "reach out", "connect", "schedule", "interview", "touch", "get in touch", "talk to him"])) {
      textReply = `### Contact Kartik Raikar & Schedule Interview

• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358) *(Direct calls & WhatsApp active)*
• 💼 **LinkedIn**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)
• 🐙 **GitHub**: [github.com/kartik-012](https://github.com/kartik-012)
• 📍 **Location**: Belagavi, Karnataka, India (Open to Remote / Relocation)

*Kartik is immediately available for AI/ML Engineering and Full-Stack AI roles!*`;

    // 6. Resume, CV & PDF Download
    } else if (matchPattern(cleanLowerQuery, ["resume", "cv", "pdf", "download", "document", "paper", "curriculum", "biodata", "download resume"])) {
      textReply = `### Kartik Raikar's Resume & CV

• 📄 **Interactive Resume Viewer**: Currently loaded on the main screen of this portal.
• 📥 **Direct Download**: Use the **"Download Resume"** button in the top navigation bar to get the official PDF.
• 🎓 **Education**: B.E. in AI & ML (2023–2027), Jain College of Engineering (VTU) — **8.5 CGPA**.
• 📜 **Credentials**: 13 Industry Certifications (Oracle, AWS, Azure, Cisco, Deloitte).
• 🚀 **Projects**: AtlasOS, NumPyGPT, Debate Arena, RagaAI Catalyst, Atlas AI Resume.

*Would you like me to highlight his technical skills or project achievements?*`;

    // 7. Location, Relocation & Work Mode (Remote / Hybrid / Onsite)
    } else if (matchPattern(cleanLowerQuery, ["location", "where", "city", "state", "country", "address", "belagavi", "karnataka", "india", "relocate", "relocation", "remote", "onsite", "hybrid", "based", "live", "living", "staying", "place"])) {
      textReply = `### Location & Work Preferences

• 📍 **Current Location**: Belagavi, Karnataka, India
• 🌍 **Work Availability**: Open to **Remote**, **Hybrid**, and **Onsite** opportunities across India (Bengaluru, Hyderabad, Pune, Mumbai, Delhi-NCR) and Worldwide.
• ⚡ **Notice Period**: Immediate availability for Full-Time and Internship roles.

*You can reach Kartik directly at **+91 8660910358** or **kartikraikar2005@gmail.com**.*`;

    // 8. Education, College, Degree, University & CGPA
    } else if (matchPattern(cleanLowerQuery, ["education", "college", "university", "school", "degree", "b.e", "be", "bachelor", "jain college", "vtu", "gpa", "cgpa", "marks", "grade", "academics", "study", "studying", "branch", "engineering"])) {
      textReply = `### Education & Academic Background

• 🎓 **Degree**: Bachelor of Engineering (B.E.) in **Artificial Intelligence & Machine Learning** (2023 – 2027)
• 🏫 **Institution**: **Jain College of Engineering, Belagavi**
• 🏛️ **University**: **Visvesvaraya Technological University (VTU)**
• 📈 **Academic Performance**: **8.5 / 10.0 CGPA**
• 📚 **Core Subjects**: Data Structures & Algorithms, Deep Learning, NLP, Database Management Systems, Operating Systems, Computer Networks.

*Would you like to explore his competitive coding background or 13 industry certifications?*`;

    // 9. Oracle Certifications Specifically
    } else if (matchPattern(cleanLowerQuery, ["oracle", "oci", "genai certified", "ai foundations associate", "oci foundations"])) {
      textReply = `### Kartik's Oracle Cloud Certifications (Triple Certified - Sep 2025)

1. ☁️ **OCI 2025 Certified Generative AI Professional**: Validates hands-on skills in Fine-Tuning LLMs, RAG Pipelines, Vector Databases, OCI GenAI Service, and prompt engineering.
2. 🤖 **OCI 2025 Certified AI Foundations Associate**: Validates Generative AI concepts, Machine Learning fundamentals, and OCI AI Services.
3. 🏛️ **OCI 2025 Certified Foundations Associate**: Validates cloud computing architecture, VCN networking, Compute, Storage, and IAM security governance.

*Would you like to see his AWS, Azure, or Cisco certifications?*`;

    // 10. All 13 Certifications & Credentials
    } else if (matchPattern(cleanLowerQuery, ["certificate", "certificates", "certification", "certifications", "cert", "certs", "credentials", "licenses", "badges", "aws", "azure", "microsoft", "cisco", "deloitte", "tata", "ibm", "forage", "tcs", "greatstack"])) {
      textReply = `### Kartik's 13 Verified Industry Certifications

• ☁️ **Oracle (3x)**: OCI AI Foundations, OCI GenAI Professional, OCI Foundations (Sep 2025)
• ⚡ **AWS**: Fundamentals of Machine Learning and AI (Jun 2026)
• 🔷 **Microsoft**: Introduction to Azure: Describe Cloud Concepts (Aug 2025)
• 🔒 **Cisco**: Introduction to Cybersecurity (Jun 2026)
• 📊 **Deloitte**: Data Analytics Job Simulation (Forage ID: 68dcdda956c19017e850b83f)
• 🏢 **Tata (3x)**: GenAI Data Analytics, Data Visualisation, Cybersecurity Analyst
• ⚙️ **IBM, TCS & GreatStack**: Process Mining (IBM), Career Edge (TCS), Full Stack Food Delivery (GreatStack)

*Would you like details on any specific credential?*`;

    // 11. Project: AtlasOS
    } else if (matchPattern(cleanLowerQuery, ["atlasos", "atlas os", "memory os", "episodic memory", "working memory", "roberta", "contradiction", "tenant isolation", "postgres rls"])) {
      textReply = `### Project Spotlight: AtlasOS (AI Memory Operating System)

• 🧠 **What it is**: Multi-tenant AI Memory OS providing hierarchical, contextual memory management for autonomous AI agents.
• 🛠️ **Tech Stack**: FastAPI, Python 3.11, PostgreSQL 15 (RLS), Qdrant Vector DB, Redis 7, Next.js 14, Celery, RoBERTa-large-MNLI.
• ⚡ **Key Architecture**:
  1. **3-Tier Memory**: Ephemeral Working Memory (Redis TTL), Episodic Memory (Qdrant + PostgreSQL RLS), and Consolidated Semantic Memory.
  2. **Active Contradiction Detection**: Evaluates incoming facts against stored memories using \`roberta-large-mnli\` with automatic policy-driven resolution.
  3. **Multi-Tenant Boundary Isolation**: Enforces tenant security at the PostgreSQL database layer (Row-Level Security) and scoped Qdrant filters.
• 🐙 **GitHub**: [github.com/kartik-012/AtlasOS](https://github.com/kartik-012/AtlasOS)
• 🌐 **Live Demo**: [atlasos.kartik.dev](https://atlasos.kartik.dev)

*Would you like to know how he scaled this with Celery background workers?*`;

    // 12. Project: NumPyGPT
    } else if (matchPattern(cleanLowerQuery, ["numpygpt", "numpy gpt", "transformer from scratch", "attention from scratch", "zero ml", "zero framework", "scratch transformer", "matrix math", "backprop"])) {
      textReply = `### Project Spotlight: NumPyGPT (Transformer Built from Scratch)

• 🐍 **What it is**: Complete GPT Transformer deep learning architecture hand-coded 100% from first principles using pure NumPy and matrix math — **zero PyTorch or TensorFlow**.
• 🛠️ **Tech Stack**: Python, TypeScript, React 19, TailwindCSS, Vite, Express, Gemini API.
• ⚡ **Key Architecture**:
  1. **Zero-Framework Transformer**: Hand-coded Matrix Multiplication, Multi-Head Attention (8 heads), LayerNorm, Softmax, FeedForward, and Backpropagation from scratch.
  2. **Interactive Attention Visualizer**: Real-time browser heatmap rendering attention weights, token activations, and gradient flows.
  3. **Conversational Assistant**: Integrated Gemini-powered AI that explains, tests, and debugs NumPy code interactively.
• 🐙 **GitHub**: [github.com/kartikraikar2005/numpygpt](https://github.com/kartikraikar2005/numpygpt)
• 🌐 **Live Demo**: [numpygpt.kartik.dev](https://numpygpt.kartik.dev)

*Would you like to explore the multi-head attention math?*`;

    // 13. Project: Debate Arena
    } else if (matchPattern(cleanLowerQuery, ["debate arena", "debate", "courtroom", "3d courtroom", "r3f", "three.js", "threejs", "judge", "jury", "judicial bias"])) {
      textReply = `### Project Spotlight: Debate Arena (Multi-LLM 3D Debate Platform)

• ⚖️ **What it is**: Multi-LLM adversarial debate platform staging live multi-round debates between leading AI models in an interactive 3D courtroom.
• 🛠️ **Tech Stack**: Python 3.11, FastAPI (async), React 18, React Three Fiber (R3F), Three.js, TailwindCSS, Framer Motion, Async SQLite.
• ⚡ **Key Architecture**:
  1. **Live 3D Courtroom**: React Three Fiber 3D scene with dynamic spotlighting, active speaker podiums, and camera choreography.
  2. **Multi-LLM Debates**: Pits models (GPT-4o, Claude 3.5, Gemini) against each other with custom persona synthesis.
  3. **Judicial Bias Auditing**: Swaps speaker roles in debate transcripts to mathematically audit and eliminate positional bias.
• 🐙 **GitHub**: [github.com/kartikraikar2005/debate-arena](https://github.com/kartikraikar2005/debate-arena)
• 🌐 **Live Demo**: [debate-arena.kartik.dev](https://debate-arena.kartik.dev)

*Would you like to know how the AI Judge evaluates argument strength?*`;

    // 14. Project: RagaAI Catalyst
    } else if (matchPattern(cleanLowerQuery, ["ragaai", "catalyst", "llm eval", "faithfulness", "guardrails", "red teaming", "synthetic data", "observability", "toxicity"])) {
      textReply = `### Project Spotlight: RagaAI Catalyst (LLM Evaluation & Guardrails)

• 📊 **What it is**: Enterprise-grade evaluation, observability, and guardrails suite for LLM and RAG applications across 5+ model providers.
• 🛠️ **Tech Stack**: Python, FastAPI, React, WebSockets, MongoDB, LiteLLM, Sentence Transformers, Qdrant.
• ⚡ **Key Architecture**:
  1. **Automated Evaluation Metrics**: Evaluates Faithfulness (99.4%), Context Relevance, Toxicity, and Hallucination rates with sub-45ms latency.
  2. **Dynamic Guardrails Engine**: Enforces real-time response evaluation, regex checks, competitor blocklists, and automated fallback intervention.
  3. **Automated Red-Teaming**: Multi-provider vulnerability and prompt injection testing suite.
• 🐙 **GitHub**: [github.com/kartikraikar2005/ragaai-catalyst](https://github.com/kartikraikar2005/ragaai-catalyst)
• 🌐 **Live Demo**: [catalyst.raga.ai](https://catalyst.raga.ai)

*Would you like to see how it calculates faithfulness metrics?*`;

    // 15. Project: Atlas AI Resume
    } else if (matchPattern(cleanLowerQuery, ["atlas ai resume", "telemetry", "kb studio", "knowledge base studio", "rate limit", "rag portfolio", "resume assistant"])) {
      textReply = `### Project Spotlight: Atlas AI Resume (Interactive RAG Portfolio)

• 🌐 **What it is**: Production-grade RAG-Powered AI Portfolio and Interactive Resume Assistant (this web app!).
• 🛠️ **Tech Stack**: React 19, TypeScript, Node.js, Express, Google Gemini 2.5 Flash, Vector Search, TailwindCSS, Vite.
• ⚡ **Key Architecture**:
  1. **Dual-Layer RAG Engine**: Vector similarity search + LLM streaming + intelligent offline heuristic fallbacks.
  2. **Recruiter Telemetry Console**: Real-time dashboard tracking visitor sessions, questions asked, query analytics, and duration.
  3. **Knowledge Base Admin Studio**: Dynamic indexing, on-the-fly embedding generation, and search relevance diagnostics.
• 🐙 **GitHub**: [github.com/kartik-012/Atlas-AI-Resume](https://github.com/kartik-012/Atlas-AI-Resume)

*Would you like to explore another project or view his credentials?*`;

    // 16. All Projects Overview
    } else if (matchPattern(cleanLowerQuery, ["project", "projects", "what did you build", "built", "work", "portfolio", "showcase", "creations"])) {
      textReply = `### Kartik's 5 Production Projects

1. 🌐 **Atlas AI Resume**: RAG portfolio with Recruiter Telemetry Console & KB Studio.
2. 🌌 **AtlasOS**: Multi-tenant AI Memory OS with active NLI contradiction detection.
3. ⚖️ **Debate Arena**: Multi-LLM debates in a 3D courtroom using React Three Fiber.
4. 🐍 **NumPyGPT**: GPT Transformer built 100% from scratch with zero ML frameworks.
5. 📊 **RagaAI Catalyst**: Enterprise LLM evaluation & guardrails suite (99.4% faithfulness).

*Which project would you like to dive into?*`;

    // 17. Technical Skills & Tech Stack
    } else if (matchPattern(cleanLowerQuery, ["skill", "skills", "tech stack", "technology", "technologies", "languages", "python", "typescript", "fastapi", "react", "nextjs", "database", "postgres", "qdrant", "redis", "docker", "tools", "frameworks", "stack"])) {
      textReply = `### Kartik's Technical Stack & Skills

• **Languages**: Python (95%), TypeScript (90%), JavaScript, Java, C++, SQL
• **AI & ML**: NumPy, Scikit-learn, LangChain, Sentence Transformers, RoBERTa-large-MNLI, Gemini API, Vector Embeddings, RAG
• **Frontend & 3D**: React 19, Next.js 14, React Three Fiber (R3F), Three.js, TailwindCSS
• **Backend & Distributed**: FastAPI (async), Node.js, Express, Celery, Redis 7, WebSockets, SSE
• **Databases**: PostgreSQL 15 (RLS), Qdrant Vector DB, Redis 7, MongoDB
• **DevOps**: Docker, Git/GitHub, Postman, Power BI, Vercel

*Would you like details on how any specific tool was used in his projects?*`;

    // 18. Why Hire Kartik? (Interview Pitch)
    } else if (matchPattern(cleanLowerQuery, ["why hire", "hire kartik", "why should we hire", "why you", "why should i hire", "reasons to hire", "sell yourself", "pitch"])) {
      textReply = `### Why Hire Kartik Raikar? (Top 5 Reasons)

1. 🛠️ **Systems-Level AI Rigor**: Hand-coded Transformer architecture from first principles in **NumPyGPT** without PyTorch/TensorFlow.
2. 🧠 **Production AI Infrastructure**: Architected **AtlasOS**, a multi-tenant AI Memory OS with active RoBERTa contradiction detection.
3. 🛡️ **AI Reliability & Safety**: Built **RagaAI Catalyst** scoring Faithfulness (99.4%) and Hallucination metrics.
4. ⚡ **Modern Full-Stack Fluency**: FastAPI async, React 19, Three.js 3D, PostgreSQL RLS, and Qdrant Vector DB.
5. 📜 **Proven Track Record**: 8.5 CGPA with 13 verified certifications (Oracle, AWS, Azure, Cisco, Deloitte).

*Would you like to schedule an interview or view his GitHub repositories?*`;

    // 19. Technical Challenge (Interview Question)
    } else if (matchPattern(cleanLowerQuery, ["technical challenge", "challenge", "hardest problem", "bug", "difficult problem", "conflict", "problem solved", "architecture decision"])) {
      textReply = `### Technical Challenge: Active Contradiction Detection in AtlasOS

• **The Problem**: Continuous episodic memory ingestion causes semantic drift and conflicting agent facts.
• **Kartik's Solution**:
  1. **3-Tier Memory**: Separated Redis working state, PostgreSQL RLS + Qdrant raw interactions, and synthesized semantic facts.
  2. **NLI Pipeline**: Local \`roberta-large-mnli\` classifies facts as *Entailment*, *Contradiction*, or *Neutral*.
  3. **Auto-Resolution**: Policy-driven resolution (confidence/recency weights) keeps memory 100% consistent.

*Would you like to know how he scaled this with Celery background workers?*`;

    // 20. RAG Hallucination Prevention (Interview Question)
    } else if (matchPattern(cleanLowerQuery, ["hallucination", "rag", "faithfulness", "grounding", "prevent hallucination", "hallucinate", "hallucinations"])) {
      textReply = `### RAG Reliability & Hallucination Mitigation Strategy

1. 🎯 **Dense Vector Retrieval**: High-dimensional embeddings with strict cosine thresholds (>0.05).
2. 🔒 **Deterministic Grounding**: Low temperature (0.2) + strict system boundary rules.
3. ⚖️ **Output Faithfulness Auditing**: Automated cross-encoder evaluation (as in RagaAI Catalyst, 99.4% faithfulness).
4. 🛡️ **Dynamic Guardrails**: Graceful interceptors for out-of-scope or high-risk inputs.

*Would you like to see how this works in Atlas AI Resume or RagaAI Catalyst?*`;

    // 21. Scalability & Latency Optimization (Interview Question)
    } else if (matchPattern(cleanLowerQuery, ["scaling", "scale", "latency", "performance", "optimization", "throughput", "fastapi async", "speed", "sub 45ms"])) {
      textReply = `### Scalability & Latency Optimization Strategy

• **Async Concurrency**: FastAPI async handlers and non-blocking Node.js I/O for sub-45ms responses.
• **Background Queues**: Celery + Redis 7 offload heavy embeddings and evaluations.
• **Real-Time Streaming**: Server-Sent Events (SSE) provide immediate token streaming to the client.
• **Multi-Tier Caching**: Vector indexes and frequent queries cached in Redis for sub-10ms delivery.

*Would you like to explore his database design or system architecture?*`;

    // 22. Greetings & Casual Queries
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

I'm ready to answer any questions about Kartik's engineering background, projects, and credentials.

**Quick topics to explore:**
• 🌌 **AtlasOS**: AI Memory OS with active NLI contradiction detection
• 🐍 **NumPyGPT**: Full GPT Transformer hand-coded from scratch
• ⚖️ **Debate Arena**: Multi-LLM debates in a 3D courtroom (React Three Fiber)
• 📊 **RagaAI Catalyst**: Enterprise LLM evaluation & guardrails suite
• 📜 **13 Certifications**: Oracle Triple Certified, AWS, Azure, Cisco, Deloitte

*Feel free to ask a question or pick a suggested topic below!*`;

    // 23. Bio / Introduction / Summary
    } else if (matchPattern(cleanLowerQuery, ["who is", "about kartik", "tell me about yourself", "bio", "introduction", "overview", "summary", "introduce yourself", "profile"])) {
      textReply = `**Kartik Raikar** is an AI & ML Systems Engineer pursuing his B.E. at **Jain College of Engineering, Belagavi** (VTU, **8.5 CGPA**, 2023–2027).

**Core Highlights:**
• 🧠 **AI Systems & Memory**: Built **AtlasOS** (3-tier memory engine + NLI contradiction detection).
• 🛠️ **Deep Learning Rigor**: Hand-coded **NumPyGPT** Transformer with zero ML frameworks.
• 🚀 **Full-Stack Mastery**: Production FastAPI, React 19, Next.js 14, Qdrant Vector DB, PostgreSQL (RLS), Redis 7.
• 📜 **Verified Credentials**: 13 industry certifications (Oracle 3x, AWS ML, Azure, Cisco, Deloitte).

*Would you like to explore any of his projects in detail or view his contact info?*`;

    // 24. Context-Matched Fallback using Knowledge Base Chunk
    } else if (contextText && bestMatch.score > 0.05) {
      textReply = `Based on Kartik's official portfolio knowledge base:\n\n${bestMatch.chunk.content}\n\n*If you'd like to explore further, feel free to ask about his projects (AtlasOS, NumPyGPT, Debate Arena), his 13 certifications, or his core technical skills!*`;
    } else {
      textReply = `I'd be glad to help you learn more about Kartik Raikar! Here are key areas you can ask me about:

1. 🚀 **His 5 Major Projects**: Atlas AI Resume, AtlasOS, Debate Arena, NumPyGPT, and RagaAI Catalyst.
2. 🛠️ **Technical Stack**: Python, FastAPI, React 19, Next.js 14, Qdrant, PostgreSQL with RLS, Redis.
3. 📜 **13 Certifications**: Oracle Triple Certified, AWS ML, Microsoft Azure, Cisco, and Deloitte.
4. 🎯 **Interview Questions**: "Why hire Kartik?", "Technical challenge solved", or "Mitigating RAG hallucinations".
5. 📞 **Contact Information**: Phone (+91 8660910358), Email, and LinkedIn.

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
- Role: AI & ML Systems Engineer, Full-Stack Developer
- Education: B.E. in AI & Machine Learning at Jain College of Engineering, Belagavi, VTU (2023–2027, CGPA: 8.5/10.0)
- Email: kartikraikar2005@gmail.com | Phone/WhatsApp: +91 8660910358
- Location: Belagavi, Karnataka, India (Available for Remote, Hybrid, or Onsite roles worldwide)
- GitHub: https://github.com/kartik-012 | LinkedIn: https://www.linkedin.com/in/kartik-raikar-kr | Portfolio: https://kartikraikar.dev | Atlas AI Resume: https://atlas-ai-resume.vercel.app/
- 5 Major Projects:
  1. Atlas AI Resume: Production RAG-Powered AI Portfolio & Recruiter Telemetry Console (React 19, TypeScript, Node.js, Express, Gemini RAG, Vector Search, TailwindCSS)
  2. AtlasOS: Multi-Tenant AI Memory Operating System (FastAPI, Python 3.11, PostgreSQL 15 RLS, Qdrant Vector DB, Redis 7, Next.js 14, Celery, RoBERTa-large-MNLI Contradiction Detection)
  3. Debate Arena: Multi-LLM Adversarial Debate Platform (Python 3.11, FastAPI, React 18, React Three Fiber 3D courtroom, Multi-LLM debates, Judicial bias auditing)
  4. NumPyGPT: GPT-Style Transformer Architecture Built from Scratch (Python, TypeScript, React 19, TailwindCSS, Vite, Express, Gemini API, Hand-coded 8-head attention & backpropagation)
  5. RagaAI Catalyst: Enterprise LLM Evaluation & Guardrails Suite (Python, FastAPI, React, WebSockets, MongoDB, LiteLLM, Sentence Transformers, Qdrant, Faithfulness 99.4%, Hallucination scoring)
- 13 Certifications:
  - Oracle: OCI 2025 AI Foundations Associate, OCI 2025 GenAI Professional, OCI 2025 Foundations Associate (Sep 2025)
  - AWS: Fundamentals of Machine Learning and AI (Jun 2026)
  - Microsoft: Introduction to Azure: Describe Cloud Concepts (Aug 2025)
  - Cisco: Introduction to Cybersecurity (Jun 2026)
  - IBM: Process Mining Project Journey (Sep 2025)
  - Deloitte: Data Analytics Job Simulation (Forage ID: 68dcdda956c19017e850b83f)
  - Tata (3): GenAI Powered Data Analytics (ID: F75ka7LhKE2sJGxyF), Data Visualisation (ID: fRnWE6dTKBsSJyrg5), Cybersecurity Analyst (ID: oL6ptn27GNbizp9Ch)
  - TCS iON: Career Edge - Young Professional (ID: 240640-28976732-1016)
  - GreatStack: Full Stack Food Delivery Project (ID: fdeleWZYPOIdyzddhImJG0huQBb7yj22)
- Availability: Immediate availability for AI/ML Engineering, ML Systems, and Full-Stack AI roles.

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
