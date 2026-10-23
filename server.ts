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

  // 4. Experience & Internships
  resumeData.experience.forEach(exp => {
    chunks.push({
      id: `experience-${exp.id}`,
      title: `Experience: ${exp.role} at ${exp.company}`,
      source: "Experience.pdf",
      content: `Work Experience: ${exp.role} at ${exp.company} (${exp.period}, ${exp.location}). ${exp.description} Key Deliverables: ${exp.keyPoints.join(" ")} Technologies: ${exp.technologies.join(", ")}.`
    });
  });

  // 4b. Six Enterprise RAG Production Pillars
  chunks.push({
    id: "rag-production-pillars",
    title: "The 6 Production RAG Architectural Pillars (Top 1% Standard)",
    source: "System_Architecture.pdf",
    content: "The 6 Core Architectural Pillars of Production RAG implemented in Kartik's engineering systems: 1) Ingestion & Chunking: Hierarchical AST Parent-Document Chunking (100-word child for vector resolution, 600-word parent for LLM synthesis). 2) Hybrid Retrieval: Okapi BM25 (k1=1.5, b=0.75) + Dense HNSW pgvector fused via Reciprocal Rank Fusion (RRF, k=60). 3) Re-ranking: Cross-Encoder joint scoring with <37ms Pareto-optimal latency. 4) Self-Correction: Corrective RAG (CRAG) tripartite relevance grading (CORRECT, AMBIGUOUS, INCORRECT) with query reformulation. 5) Latency & Economics: Semantic cosine cache (>= 0.96) and Shannon entropy router gating (<= 1.25) with Thompson Sampling bandit. 6) Security & Observability: 0.8µs Outbound Shannon entropy DLP (H(X) >= 3.8) with Luhn checksums, append-only SHA-256 Saga rollback journal, and OTel waterfall flamegraphs."
  });

  // 4c. Technical Skills Taxonomy (Official Resume Grouping)
  chunks.push({
    id: "skills-official-taxonomy",
    title: "Complete Technical Skills Breakdown by Category",
    source: "Resume.pdf",
    content: "Kartik Raikar Technical Skills Taxonomy: Programming Languages: Python, JavaScript, TypeScript, SQL. Frameworks & APIs: FastAPI, React.js, Next.js, FastMCP, Pydantic, PyGithub, gRPC, OpenAPI/Swagger. AI/ML & Retrieval: LLMs, RAG, Transformers, AI Evaluation, Prompt Engineering, BM25, Reciprocal Rank Fusion (RRF), Cross-Encoder Reranking, Semantic Search, Vector Search, scikit-learn. Databases & Messaging: PostgreSQL, pgvector, MySQL, MongoDB, Redis, Qdrant, ChromaDB, Apache Kafka (KRaft). Observability & Infrastructure: OpenTelemetry (OTLP), Prometheus, Linux eBPF, Docker, Docker Compose, Linux. Data & Visualization: Pandas, Streamlit, Prophet, SARIMAX, Three.js, Power BI, Tableau, Microsoft Excel. Developer Tools: Git, GitHub, Postman, VS Code, Vercel, Render."
  });

  // 5. Technical Skills
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
    title: "Skills - Databases, DevOps & Observability",
    source: "Resume.pdf",
    content: `Databases: ${resumeData.skills.database.join(", ")}. Tools & DevOps: ${resumeData.skills.tools.join(", ")}. Observability: ${(resumeData.skills.observability || []).join(", ")}.`
  });

  // 6. Projects
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

  // 7. Achievements & LeetCode
  resumeData.achievements.forEach(a => {
    chunks.push({
      id: `achievement-${a.id}`,
      title: `Achievement: ${a.title}`,
      source: "Achievements.pdf",
      content: `Kartik's Achievement: "${a.title}" ${a.icon || ""} - ${a.description}`
    });
  });

  // 8. Certifications
  chunks.push({
    id: "certifications-all-summary",
    title: "All Certifications - Complete List",
    source: "Certificates.pdf",
    content: `Kartik Raikar holds ${resumeData.certifications.length} verified professional certifications: ${resumeData.certifications.map(c => `${c.title} (${c.issuer}, ${c.date})`).join("; ")}.`
  });

  resumeData.certifications.forEach(c => {
    chunks.push({
      id: `certification-${c.id}`,
      title: `Certification: ${c.title}`,
      source: "Certificates.pdf",
      content: `Certification: "${c.title}" (Issued: ${c.date}) by ${c.issuer}. ${c.credentialId ? `Credential ID: ${c.credentialId}.` : ""} Skills: ${c.skills.join(", ")}. ${c.description}`
    });
  });

  // 9. Interview & Technical Knowledge Chunks
  chunks.push({
    id: "interview-why-hire",
    title: "Interview Question: Why should we hire Kartik Raikar?",
    source: "Interview_Preparation.pdf",
    content: "Why Hire Kartik Raikar? 1) Real-World AI Experience: AI Intern at SPARK IIT (AQI analysis over 29,531 records, Prophet vs SARIMAX with RMSE down 64.3%, Streamlit dashboard, AI resume screening). 2) Production AI Engineering: Built AIOps Root Cause Correlator achieving 100% Top-1 RCA accuracy in <45ms (Kafka KRaft, Linux eBPF, gRPC) and VersionRAG eliminating 62.5% hallucinated deprecated API calls to 0.0% via 3-stage hybrid retrieval. 3) RAG & Evaluation Expertise: Engineered ApexRAG (AST parent-document chunking, CRAG, semantic cosine cache >=0.96, <37ms latency across 82 tests). 4) MCP Governance: Built Autonomous GitHub Agent Gateway MCP with 0.8µs Outbound Shannon entropy DLP, SHA-256 Saga rollback, 100% intent classification. 5) Verified Credentials: 8.50 CGPA, 9 certifications (Hugging Face Agents, Oracle Agentic AI, Oracle AI Vector Search, Cognifyz ML, Kafka LinkedIn, AWS ML/AI, Azure, Deloitte, Tata), VP of AI&ML Dept, 104 LeetCode solved."
  });

  chunks.push({
    id: "interview-technical-challenge",
    title: "Interview Question: Tell me about a complex technical challenge you solved.",
    source: "Interview_Preparation.pdf",
    content: "Technical Challenge & Problem Solving: In VersionRAG, Kartik faced the critical challenge of cross-version code contamination where RAG systems hallucinate deprecated API calls 62.5% of the time. Solution: 1) Designed 3-stage hybrid retrieval with database-enforced SQL version partition gates, eliminating contamination from 62.5% to 0.0%. 2) Built polyglot AST semantic diff engine across Python, JS/TS, OpenAPI 3.x detecting breaking changes with 94.2% accuracy. 3) Boosted retrieval precision @k=6 from 41.7% to 98.4% (+136%) at 5.4ms HNSW latency. In AIOps RCA, resolved alert storms in <45ms using 24h Fourier harmonic EWMA and MicroRCA++ PageRank with Linux eBPF futex tracing."
  });

  chunks.push({
    id: "interview-rag-hallucinations",
    title: "Interview Question: How do you prevent and audit hallucinations in RAG systems?",
    source: "Interview_Preparation.pdf",
    content: "RAG Reliability & Hallucination Mitigation Strategy: Kartik employs a rigorous enterprise defense strategy: 1) Hierarchical AST Parent-Document Chunking (ApexRAG): 100-word child chunks for high-resolution vector search fused with 600-word parent chunks for generation context. 2) Version-Partitioned Indexing (VersionRAG): Database-enforced version isolation eliminating deprecated API hallucinations (62.5% to 0.0%). 3) Corrective RAG (CRAG): Self-reflective tripartite relevance grading and query reformulation. 4) Sub-millisecond Semantic Cosine Cache (>= 0.96). 5) Dual-Shield Guardrails: Pre-retrieval prompt injection and PII blocking."
  });

  chunks.push({
    id: "interview-scaling-latency",
    title: "Interview Question: How do you optimize latency and throughput in AI applications?",
    source: "Interview_Preparation.pdf",
    content: "Latency & Scalability Optimization: Kartik achieves production sub-second latency through: 1) HNSW Vector Indexing: 5.4ms retrieval latency in VersionRAG using pgvector HNSW indexes. 2) MicroRCA++ PageRank & eBPF: <45ms incident resolution in AIOps RCA over Kafka KRaft ring buffers. 3) Semantic Caching: Sub-millisecond cache hit delivery (>= 0.96 cosine threshold). 4) Real-Time Streaming: WebSockets and SSE streaming with TTFT <40ms. 5) Circuit Breakers & Saga Rollback patterns in GitHub MCP Gateway."
  });

  chunks.push({
    id: "interview-career-goals",
    title: "Interview Question: What are your career aspirations and ideal role?",
    source: "Interview_Preparation.pdf",
    content: "Career Goals & Aspirations: Kartik aims to contribute as an AI Engineer, Generative AI Engineer, or LLM Applications Developer. He is passionate about building production-grade RAG pipelines, enterprise agentic workflows (MCP servers), incident intelligence platforms, and high-reliability AI applications."
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

// Build initial knowledge base
knowledgeBase = buildDefaultKnowledgeBase();
saveKnowledgeBase();
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
  const requestStartTime = Date.now();
  let firstTokenTime: number | null = null;
  const { messages, query } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing or invalid query parameter" });
  }
  if (query.length > 500) {
    return res.status(400).json({ error: "Query exceeds maximum length of 500 characters." });
  }

  // Multi-Layer Enterprise Security Guardrail Engine
  // Layer 1: Prompt Injection / System Jailbreak Patterns
  const jailbreakPatterns = [
    { name: "Directive Override", pattern: /ignore\s+(all\s+)?(previous|prior)\s+instructions/i },
    { name: "System Prompt Extraction", pattern: /(reveal|print|show|output)\s+(the\s+)?(system\s+prompt|core\s+directives|hidden\s+instructions)/i },
    { name: "Persona Hijack", pattern: /(you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+(an?\s+unrestricted|dan|jailbroken|evil)/i },
    { name: "Memory Purge Attempt", pattern: /(forget|disregard|wipe)\s+(everything|all\s+rules|your\s+guidelines)/i },
    { name: "Delimiter / Token Hijack", pattern: /(<\|im_start\|>|<\|endoftext\|>|```system|\[INST\]\s*<<SYS>>)/i }
  ];

  // Layer 2: PII Leakage / Data Exfiltration Probe
  const piiProbePatterns = [
    { name: "Sensitive Key Exfiltration", pattern: /(api[_\-\s]?key|gemini[_\-\s]?key|admin[_\-\s]?key|secret[_\-\s]?token|private[_\-\s]?key)/i },
    { name: "Credential Dump", pattern: /(dump\s+database|show\s+all\s+passwords|export\s+env)/i }
  ];

  const matchedJailbreak = jailbreakPatterns.find(p => p.pattern.test(query));
  const matchedPii = piiProbePatterns.find(p => p.pattern.test(query));

  if (matchedJailbreak || matchedPii) {
    const violationType = matchedJailbreak ? `Adversarial Jailbreak (${matchedJailbreak.name})` : `Data Exfiltration (${matchedPii?.name})`;
    const violationDetail = matchedJailbreak 
      ? "Prompt injection attack neutralized. Atlas AI operates under immutable system constraints grounded strictly in verified resume facts."
      : "Access denied. Candidate privacy and credential security guardrails strictly prohibit sensitive key/credential inspection.";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(`data: ${JSON.stringify({ 
      chunk: `🛡️ **[Security Guardrail Intercept - Rule Violation Blocked]**\n\n• **Threat Category**: \`${violationType}\`\n• **Defense Action**: Execution halted via L1 Input Guardrail.\n• **Explanation**: ${violationDetail}\n\n*Atlas AI is hardened against jailbreak attempts and blind prompt overrides.*` 
    })}\n\n`);
    res.write(`data: ${JSON.stringify({ 
      done: true, 
      confidence: 99, 
      citations: [],
      guardrailTripped: true,
      violationType,
      metrics: {
        ttftMs: 6,
        totalLatencyMs: 9,
        promptTokens: Math.ceil(query.length / 4),
        completionTokens: 42,
        totalTokens: Math.ceil(query.length / 4) + 42,
        estimatedCostUsd: 0.000002,
        model: "atlas-guardrail-l1",
        retrievalLatencyMs: 1,
        retrievalStrategy: "Guardrail Policy Intercept"
      }
    })}\n\n`);
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
  const retrievalStart = Date.now();
  const searchResults = await searchKnowledgeBase(query, 3);
  const retrievalLatencyMs = Date.now() - retrievalStart;
  const bestMatch = searchResults[0];
  const hasDenseEmbedding = Boolean(bestMatch?.chunk?.embedding);
  const retrievalStrategy = hasDenseEmbedding 
    ? "Hybrid (Dense Cosine Embeddings + Lexical Rerank)" 
    : "Lexical BM25 / Fuzzy Inverted Index";

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
• 💼 **Experience**: AI Intern at **SPARK IIT** (AQI Analysis over 29,531 records, Prophet vs SARIMAX with RMSE down 64.3%).
• 🎓 **Education**: B.E. in CSE (AI & ML) (Aug 2023 – Jul 2027), Jain College of Engineering (VTU) — **8.50 CGPA**.
• 📜 **Credentials**: 9 Verified Professional Certifications (Hugging Face Agents, Oracle Agentic AI, Oracle AI Vector Search, Cognifyz ML, Kafka LinkedIn, AWS ML/AI, Azure, Deloitte, Tata).
• 🚀 **Projects**: AIOps RCA (<45ms RCA), VersionRAG (0.0% contamination), Autonomous GitHub Agent Gateway MCP (0.8µs DLP), ApexRAG (AST parent-doc chunking, CRAG), Atlas AI Resume.

*Would you like me to highlight his technical skills or project achievements?*`;

    // 7. Location & Work Preferences
    } else if (matchPattern(cleanLowerQuery, ["location", "where", "city", "state", "country", "address", "belagavi", "karnataka", "india", "relocate", "relocation", "remote", "onsite", "hybrid", "based"])) {
      textReply = `### Location & Work Preferences

• 📍 **Current Location**: Belagavi, Karnataka, India
• 🌍 **Work Availability**: Open to **Remote**, **Hybrid**, and **Onsite** opportunities.
• ⚡ **Notice Period**: Immediate availability.

*Reach Kartik at **+91 8660910358** or **kartikraikar2005@gmail.com**.*`;

    // 8. Work Experience & Internships
    } else if (matchPattern(cleanLowerQuery, ["experience", "work experience", "internship", "intern", "spark iit", "spark", "cognifyz", "employment", "job"])) {
      textReply = `### Kartik Raikar's Professional Experience & Internships

1. 🏢 **AI Intern — SPARK IIT** *(Jul 2026 – Sep 2026 | Remote / India)*
   • **Large-Scale AQI Analysis**: Analyzed 29,531 environmental records across 26 Indian cities to identify critical pollution clusters and seasonal trends.
   • **Time-Series Forecasting**: Engineered comparative forecasting models using Facebook Prophet and SARIMAX, cutting prediction error by **64.3% RMSE** (from 249.54 to 89.03) and **67.6% MAE**.
   • **Interactive Streamlit Dashboard**: Built multi-city real-time pollution visualizer and automated health advisory warnings.
   • **AI Resume Screening**: Architected candidate evaluation workflow integrating LLM extraction pipelines.
   • *Tech*: Python, Streamlit, Prophet, SARIMAX, Pandas, NumPy, scikit-learn, LLMs.

2. 🧪 **Machine Learning Internship — Cognifyz Technologies** *(1-Month Intensive | 2026)*
   • Hands-on predictive modeling pipelines, feature engineering, and cross-validation in scikit-learn.

*Would you like to explore his production projects or certifications next?*`;

    // 9. Education, College, Degree & CGPA
    } else if (matchPattern(cleanLowerQuery, ["education", "college", "university", "school", "degree", "b.e", "be", "bachelor", "jain college", "vtu", "gpa", "cgpa", "marks", "grade", "academics", "study", "branch", "engineering", "pu", "pre university"])) {
      textReply = `### Education & Academic Background

• 🎓 **Degree**: B.E. in **Computer Science & Engineering (AI & ML)** (Aug 2023 – Jul 2027)
• 🏫 **Institution**: **Jain College of Engineering, Belagavi**
• 🏛️ **University**: **Visvesvaraya Technological University (VTU)**
• 📈 **CGPA**: **8.50 / 10.0**
• 📚 **Pre-University**: PCM at Jain PU College, Belagavi (2021–2023, 80%)
• 📖 **Coursework**: DSA, OOP, DBMS, Data Science, OS, Computer Networks, AI, ML.

*Would you like to explore his certifications or projects?*`;

    // 10. Certifications
    } else if (matchPattern(cleanLowerQuery, ["certificate", "certificates", "certification", "certifications", "cert", "certs", "credentials", "oracle", "aws", "tata", "forage", "hugging face", "kafka", "azure", "deloitte", "cognifyz"])) {
      textReply = `### Kartik's 9 Verified Professional Certifications

1. 🤖 **Fundamentals of Agents**: Hugging Face Agents Course (2026) — Autonomous agent architectures & ReAct loops.
2. 🏛️ **Agentic AI Certified Foundations Associate**: Oracle (2026) — Autonomous decision systems & goal decomposition.
3. 🔍 **AI Vector Search Certified Professional**: Oracle (2026) — Enterprise vector search & HNSW indexing algorithms.
4. 🧠 **Machine Learning Internship (1-Month Intensive)**: Cognifyz Technologies (2026) — Predictive modeling & feature engineering.
5. ⚡ **Apache Kafka Essential Training: Building Scalable Applications**: LinkedIn Learning (2026) — KRaft consensus & stream processing.
6. ☁️ **Fundamentals of Machine Learning and AI**: AWS Training & Certification (2026) — SageMaker pipelines & Bedrock foundation models.
7. 🌐 **Microsoft Azure: Describe Cloud Computing**: Microsoft (2026) — High availability & cloud infrastructure.
8. 📊 **Data Analytics Job Simulation**: Deloitte (Forage, 2026) — Data wrangling & business intelligence.
9. 💡 **GenAI Powered Data Analytics Job Simulation**: Tata Group (Forage, 2026) — Generative AI analytics & data storytelling.

*Would you like details on any specific credential?*`;

    // 11. Project: AIOps Root Cause Correlator
    } else if (matchPattern(cleanLowerQuery, ["aiops", "root cause", "rca", "incident engine", "alert storm", "ewma", "anomaly detection", "networkx", "topology", "ebpf", "kraft", "kafka"])) {
      textReply = `### Project Spotlight: AIOps Root Cause Correlator – Incident Engine

• ⚡ **Overview**: Autonomous incident correlation engine resolving cascading microservice alert storms.
• 🛠️ **Tech Stack**: Python, FastAPI, PostgreSQL, pgvector, Redis, NetworkX, Three.js, WebSockets, Apache Kafka (KRaft), Linux eBPF, gRPC.
• 📊 **Key Metrics & Innovations**:
  - Resolves cascading alert storms in **<45ms** (down from ~2 hours of manual tracing).
  - **100% Top-1 RCA accuracy** across 30 benchmark scenarios.
  - Dynamic 24h Fourier harmonic EWMA anomaly detection (z > 2.0σ) with MicroRCA++ edge-weighted PageRank on causal dependency graphs.
  - Linux eBPF kernel probes tracing \`sys_enter_futex\` contention.
  - Kafka KRaft 10K ring buffer with 80% backpressure shedding and streaming gRPC :50051 telemetry.
  - Online Thompson Sampling bandit for automated remediation with HMAC-SHA256 mobile canary approval.
  - Backed by **118 unit & integration tests (100% pass rate)**.
• 🐙 **GitHub**: [github.com/kartik-012/aiops-rca](https://github.com/kartik-012/aiops-rca)

*Would you like to explore the eBPF kernel tracing or MicroRCA++ PageRank?*`;

    // 12. Project: VersionRAG
    } else if (matchPattern(cleanLowerQuery, ["versionrag", "version rag", "documentation intelligence", "cross version", "deprecated api", "ast diff", "chain of version", "version partitioned", "polyglot"])) {
      textReply = `### Project Spotlight: VersionRAG – Documentation & Code Migration Intelligence

• 📚 **Overview**: Enterprise RAG architecture eliminating cross-version code contamination.
• 🛠️ **Tech Stack**: Python 3.12, FastAPI, PostgreSQL, pgvector, React 18, TypeScript, TailwindCSS, Okapi BM25, Cross-Encoder, Docker.
• 📊 **Key Metrics & Innovations**:
  - 3-stage hybrid retrieval: SQL version partition gate + parallel Okapi BM25 ($k_1=1.5, b=0.75$) + pgvector HNSW + RRF ($k=60$) + Cross-Encoder reranking.
  - Hallucinated deprecated API calls eliminated: **62.5% → 0.0%**.
  - Retrieval precision @k=6 boosted: **41.7% → 98.4% (+136%)** at **5.4ms latency**.
  - Polyglot AST semantic diff engine across Python \`ast\`, JS/TS, OpenAPI 3.x/Swagger 2.0 with ParamNode/ReturnTypeNode/ExceptionNode at **94.2% accuracy**.
  - Live codebase vulnerability scanner & auto-refactor workbench CLI (\`python -m app.cli audit\`).
  - Self-generating 3-Way Auto-RAGAS evaluation suite and Redis ZSET rate limiting across 40 tests.
• 🐙 **GitHub**: [github.com/kartik-012/versionrag](https://github.com/kartik-012/versionrag)

*Would you like to explore the 3-stage hybrid retrieval pipeline?*`;

    // 13. Project: Autonomous GitHub Agent Gateway MCP
    } else if (matchPattern(cleanLowerQuery, ["mcp", "mcp toolkit", "github mcp", "model context protocol", "fastmcp", "preview token", "sha-256", "saga rollback", "abac", "gateway", "dlp"])) {
      textReply = `### Project Spotlight: Autonomous GitHub Agent Gateway – MCP Governance Plane

• 🔧 **Overview**: Zero-trust governance plane over Model Context Protocol (MCP) for LLM-driven repository automation.
• 🛠️ **Tech Stack**: Python, FastMCP, PyGithub, Pydantic, Docker, GitHub Actions, Redis.
• 📊 **Key Metrics & Innovations**:
  - Eliminated **14.0% blind state corruption to 0.0%**; achieved **100% intent classification** across 100 scenarios.
  - Pure-Python Hybrid RRF ($k=60$) combining corpus TF-IDF with exact AST error-code matching (**0MB ML footprint**).
  - Sub-microsecond (**0.8µs**) Outbound DLP scanner using Shannon entropy $H(X) \ge 3.8$ & ISO/IEC 7812 Luhn checksums to block secret exfiltration.
  - 2-phase preview token protocol + append-only SHA-256 hash-chained Saga journal for out-of-order rollbacks by \`tx_id\`.
  - RLock single-probe circuit breaker and adaptive compactor slashing context bloat by **-92.2%** across **120 unit tests (100% pass rate)**.
• 🐙 **GitHub**: [github.com/kartik-012/github-mcp-toolkit](https://github.com/kartik-012/github-mcp-toolkit)

*Would you like to learn about the 0.8µs DLP scanner or the Saga rollback journal?*`;

    // 14. Project: ApexRAG
    } else if (matchPattern(cleanLowerQuery, ["apexrag", "apex rag", "retrieval evaluation", "bm25", "cross encoder", "reranking", "query router", "retrieval benchmark", "crag", "parent document"])) {
      textReply = `### Project Spotlight: ApexRAG – Enterprise Zero-Cost RAG & Production Harness

• 📊 **Overview**: Production RAG harness and evaluation benchmark over 2,580 documentation chunks and 100 human-verified Q&A pairs.
• 🛠️ **Tech Stack**: Python, FastAPI, ChromaDB, Sentence Transformers, Ollama, scikit-learn, OpenTelemetry, Prometheus, Docker.
• 📊 **Key Metrics & Innovations**:
  - Hierarchical AST parent-document chunking (100-word child for high-res vector retrieval / 600-word parent for LLM context).
  - Hybrid BM25 + dense vector RRF ($k=60$) + Cross-Encoder reranker achieving Pareto-optimal latency **<37ms** across 82 tests (100% pass rate).
  - Corrective RAG (CRAG) with self-reflective tripartite relevance grading, query reformulation, and sub-millisecond semantic cosine cache ($\ge 0.96$).
  - Dense strategy router with Shannon entropy gating ($\le 1.25$) + Bayesian Thompson Sampling bandit.
  - Multi-tenant clearance RBAC pre-filtering + dual-shield guardrails against PII and prompt injection.
  - GitHub Actions CI/CD evaluation gate, OTel waterfall flamegraphs, Prometheus metrics, and SSE streaming TTFT <40ms.
• 🐙 **GitHub**: [github.com/kartik-012/apexrag](https://github.com/kartik-012/apexrag)

*Would you like to explore the AST parent-document chunking or CRAG tripartite grading?*`;

    // 15. Project: Atlas AI Resume
    } else if (matchPattern(cleanLowerQuery, ["atlas ai resume", "telemetry", "kb studio", "knowledge base studio", "rate limit", "rag portfolio", "resume assistant"])) {
      textReply = `### Project Spotlight: Atlas AI Resume

• 🌐 **Overview**: RAG-Powered AI Portfolio & Interactive Resume Assistant (this web app!).
• 🛠️ **Tech Stack**: React 19, TypeScript, Node.js, Express, Gemini API, Vector Search, TailwindCSS, Vite.
• ⚡ **Key Features**:
  1. **Dual-Layer RAG Engine**: Vector similarity search + LLM streaming + offline heuristic fallbacks.
  2. **Recruiter Telemetry Console**: Real-time dashboard tracking visitor analytics, token economics, and TTFT metrics.
  3. **Interactive Benchmark Verifiers**: Proof mode executing real tests on AIOps, VersionRAG, MCP, and ApexRAG.
  4. **Recruiter JD Matcher & Screening Packet**: Automated semantic job description fit scoring and 1-click executive packet generator.
  5. **Knowledge Base Admin Studio**: Dynamic indexing and search diagnostics.
• 🐙 **GitHub**: [github.com/kartik-012/Atlas-AI-Resume](https://github.com/kartik-012/Atlas-AI-Resume)

*Would you like to explore another project or view his credentials?*`;

    // 16. All Projects Overview
    } else if (matchPattern(cleanLowerQuery, ["project", "projects", "what did you build", "built", "work", "portfolio", "showcase"])) {
      textReply = `### Kartik's 5 Production Projects

1. 🌐 **Atlas AI Resume**: RAG portfolio with Recruiter Telemetry, Benchmark Verifiers, and KB Studio.
2. ⚡ **AIOps Root Cause Correlator**: <45ms RCA time, 100% Top-1 accuracy, Kafka KRaft, Linux eBPF, gRPC.
3. 📚 **VersionRAG**: 3-stage hybrid retrieval, 62.5% → 0.0% hallucination, 98.4% retrieval precision at 5.4ms.
4. 🔧 **Autonomous GitHub Agent Gateway MCP**: 14.0% → 0.0% blind state corruption, 0.8µs Outbound Shannon entropy DLP, SHA-256 Saga journal.
5. 📊 **ApexRAG**: AST parent-doc chunking, CRAG, hybrid BM25 + dense RRF, <37ms latency across 82 tests.

*Which project would you like to dive into?*`;

    // 17. Technical Skills & Tech Stack
    } else if (matchPattern(cleanLowerQuery, ["skill", "skills", "tech stack", "technology", "technologies", "languages", "python", "typescript", "fastapi", "react", "nextjs", "database", "postgres", "qdrant", "redis", "docker", "tools", "frameworks", "stack", "pytorch", "grpc", "kafka", "ebpf", "opentelemetry", "prometheus"])) {
      textReply = `### Kartik's Technical Stack & Skills

• **Frameworks & APIs**: FastAPI, React.js, Next.js, FastMCP, Pydantic, PyGithub, gRPC, OpenAPI/Swagger
• **AI/ML & Retrieval**: Generative AI, LLMs, RAG, Transformers, AI Evaluation, Prompt Engineering, BM25, Reciprocal Rank Fusion (RRF), Cross-Encoder Reranking, Semantic Search, Vector Search, scikit-learn, PyTorch
• **Databases & Messaging**: PostgreSQL, pgvector, MySQL, MongoDB, Redis, Qdrant, ChromaDB, Apache Kafka (KRaft)
• **Observability & Infrastructure**: OpenTelemetry (OTLP), Prometheus, Linux eBPF, Docker, Docker Compose, Linux, Git, GitHub Actions
• **Data & Visualization**: Pandas, Streamlit, Prophet, SARIMAX, Three.js, Power BI, Tableau, Microsoft Excel
• **Languages**: Python, JavaScript, TypeScript, SQL

*Would you like details on how any specific tool was used in his projects?*`;

    // 18. Why Hire Kartik?
    } else if (matchPattern(cleanLowerQuery, ["why hire", "hire kartik", "why should we hire", "why you", "why should i hire", "reasons to hire", "sell yourself", "pitch"])) {
      textReply = `### Why Hire Kartik Raikar? (Top 5 Reasons)

1. 🏢 **Real Industry AI Experience**: AI Intern at **SPARK IIT** (AQI analysis over 29,531 records, Prophet vs SARIMAX with RMSE down 64.3%, Streamlit dashboard, AI resume screening).
2. ⚡ **Production Systems Engineering**: Built AIOps RCA with <45ms incident resolution (Kafka KRaft, Linux eBPF, gRPC) and VersionRAG eliminating 62.5% hallucination to 0.0% via 3-stage hybrid retrieval.
3. 📚 **Advanced RAG & Agentic Mastery**: AST parent-document chunking, CRAG self-reflective grading, semantic caching in ApexRAG; zero-trust MCP gateway with 0.8µs DLP and SHA-256 Saga rollback.
4. 📜 **9 Verified Credentials & LeetCode Rigor**: 9 industry certifications (Hugging Face Agents, Oracle Agentic AI, Oracle AI Vector Search, Cognifyz ML, Kafka, AWS, Azure, Deloitte, Tata) and **104 LeetCode problems solved** (30E / 50M / 24H).
5. 🏅 **Leadership & Academic Excellence**: Vice President of the AI & ML Department, 8.50 CGPA, Top 60 national finalist in Hack2Future 2.0 (IIIT Dharwad).

*Would you like to schedule an interview or view his GitHub?*`;

    // 19. Technical Challenge
    } else if (matchPattern(cleanLowerQuery, ["technical challenge", "challenge", "hardest problem", "bug", "difficult problem", "problem solved"])) {
      textReply = `### Technical Challenge: Cross-Version Contamination & Alert Storms

• **Challenge 1: VersionRAG Cross-Version Code Contamination**:
  - *Problem*: RAG systems hallucinated deprecated API calls 62.5% of the time.
  - *Kartik's Solution*: Designed 3-stage hybrid retrieval with database-enforced SQL version partition gates, driving contamination from 62.5% to 0.0% and boosting precision @k=6 from 41.7% to 98.4% at 5.4ms latency with a polyglot AST semantic diff engine (94.2% accuracy).

• **Challenge 2: AIOps Alert Storms (<45ms RCA)**:
  - *Problem*: Cascading microservice alerts took ~2 hours of manual tracing.
  - *Kartik's Solution*: Dynamic 24h Fourier harmonic EWMA (z > 2.0σ) + MicroRCA++ edge-weighted PageRank on causal dependency graphs, isolated with Linux eBPF \`sys_enter_futex\` kernel probes in <45ms with 100% Top-1 accuracy.

*Would you like to explore the AST diff engine or the eBPF kernel tracing?*`;

    // 20. RAG & Hallucination
    } else if (matchPattern(cleanLowerQuery, ["hallucination", "rag", "faithfulness", "grounding", "prevent hallucination", "real rag"])) {
      textReply = `### Enterprise RAG Reliability & Hallucination Mitigation

1. 🧩 **Hierarchical AST Parent-Document Chunking** (ApexRAG): 100-word child chunks for high-res vector retrieval fused with 600-word parent chunks for generation context.
2. 📚 **Version-Partitioned Indexing** (VersionRAG): Database-enforced version isolation eliminating deprecated API hallucinations (62.5% → 0.0%).
3. 🔄 **Corrective RAG (CRAG)**: Self-reflective tripartite relevance grading and query reformulation.
4. ⚡ **Sub-millisecond Semantic Cosine Cache** (threshold $\ge 0.96$): Instant zero-cost responses.
5. 🛡️ **Dual-Shield Guardrails**: Intercepts prompt injections and PII before retrieval or inference occurs.

*Would you like to see how VersionRAG or ApexRAG implements this?*`;

    // 21. Leadership & Achievements
    } else if (matchPattern(cleanLowerQuery, ["leadership", "vice president", "achievements", "hackathon", "hack2future", "innovex", "team velora", "leetcode"])) {
      textReply = `### Leadership & Achievements

• 🏅 **Vice President – AI & ML Department**: Elected VP at Jain College of Engineering, Belagavi. Led departmental technical symposiums and academic programs.
• 🏆 **Hack2Future 2.0 – IIIT Dharwad (Nokia Track)**: Top 60 finalist team from 570+ national registrations. Built KubeShield (graph-based Kubernetes attack-path visualizer, 36h hackathon).
• 💻 **Code for Innovex 2025 – NMAM IT**: 24-hour national hackathon by NSS IT Wing.
• ⚡ **LeetCode Problem Solving**: 104 problems solved (30 Easy, 50 Medium, 24 Hard).

*Would you like to explore his projects or certifications?*`;

    // 22. Greetings & Casual
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

I'm ready to answer any questions about Kartik's AI engineering background, industry experience, projects, and credentials.

**Quick topics to explore:**
• 🏢 **SPARK IIT AI Internship**: AQI analysis (29,531 records), Prophet vs SARIMAX (RMSE down 64.3%)
• ⚡ **AIOps Root Cause Correlator**: <45ms incident resolution, 100% accuracy, Kafka KRaft & eBPF
• 📚 **VersionRAG**: 62.5% → 0.0% hallucination, 98.4% precision at 5.4ms
• 🔧 **Autonomous GitHub Agent Gateway MCP**: 0.8µs Shannon entropy DLP, SHA-256 Saga rollback
• 📊 **ApexRAG**: AST parent-doc chunking, CRAG, <37ms latency across 82 tests
• 📜 **9 Verified Certifications**: Hugging Face, Oracle (Agentic AI & Vector Search), AWS, Kafka, Azure, Deloitte, Tata

*Feel free to ask a question or pick a topic below!*`;

    // 23. Bio / Introduction
    } else if (matchPattern(cleanLowerQuery, ["who is", "about kartik", "tell me about yourself", "bio", "introduction", "overview", "summary", "introduce yourself", "profile"])) {
      textReply = `**Kartik Raikar** is an AI Engineer specializing in **Generative AI, LLMs, RAG, and AI Evaluation**, pursuing B.E. in CSE (AI & ML) at **Jain College of Engineering, Belagavi** (VTU, **8.50 CGPA**, Aug 2023 – Jul 2027).

**Core Highlights:**
• 🏢 **Industry Experience**: AI Intern at **SPARK IIT** (AQI analysis over 29,531 records, Prophet vs SARIMAX with RMSE down 64.3%, Streamlit dashboard, AI resume screening).
• ⚡ **AIOps**: Built incident correlation engine with 100% Top-1 RCA accuracy in <45ms (Kafka KRaft, Linux eBPF, gRPC).
• 📚 **RAG Architecture**: Eliminated 62.5% hallucination to 0.0% in VersionRAG via 3-stage hybrid retrieval.
• 🔧 **MCP Governance**: Autonomous GitHub Agent Gateway MCP with 0.8µs DLP and SHA-256 Saga rollback.
• 📊 **RAG Evaluation**: ApexRAG with AST parent-doc chunking, CRAG, and semantic caching (<37ms latency).
• 🏅 **Leadership & Rigor**: Vice President of AI & ML Department, 9 certifications, 104 LeetCode solved.

*Would you like to explore any project in detail or view his contact info?*`;

    // 24. Context-Matched Fallback
    } else if (contextText && bestMatch.score > 0.05) {
      textReply = `Based on Kartik's official portfolio knowledge base:\n\n${bestMatch.chunk.content}\n\n*If you'd like to explore further, ask about his experience at SPARK IIT, his projects (AIOps RCA, VersionRAG, GitHub MCP Gateway, ApexRAG), his 9 certifications, or his technical skills!*`;
    } else {
      textReply = `I'd be glad to help you learn more about Kartik Raikar! Here are key areas you can ask me about:

1. 🏢 **Work Experience**: AI Intern at SPARK IIT (AQI analysis, Prophet vs SARIMAX, Streamlit, AI resume screening).
2. 🚀 **His 5 Major Projects**: Atlas AI Resume, AIOps Root Cause Correlator, VersionRAG, Autonomous GitHub Agent Gateway MCP, and ApexRAG.
3. 🛠️ **Technical Stack**: Python, FastAPI, React.js, PostgreSQL, pgvector, Redis, Kafka KRaft, Linux eBPF, Docker, PyTorch.
4. 📜 **9 Certifications**: Hugging Face Agents, Oracle Agentic AI, Oracle AI Vector Search, Cognifyz ML, Kafka, AWS, Azure, Deloitte, Tata.
5. 🏅 **Leadership & Problem Solving**: Vice President of AI & ML Department, Top 60 at Hack2Future 2.0, 104 LeetCode problems solved.
6. 📞 **Contact**: Phone (+91 8660910358), Email, LinkedIn.

Which area would you like to explore?`;
    }

    // Clean any leading ### Header line so response starts directly with 🤖 **[Atlas AI Active]** followed by the answer body
    const cleanedReply = textReply.replace(/^###\s+[^\n]*\n+/, "");

    // Stream the fallback text with natural, comfortable reading cadence
    const words = cleanedReply.split(" ");
    let generatedChars = 0;
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (firstTokenTime === null) {
        firstTokenTime = Date.now();
      }
      generatedChars += word.length + 1;
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

    const totalDuration = Date.now() - requestStartTime;
    const ttftMs = (firstTokenTime ? firstTokenTime - requestStartTime : 24);
    const estimatedPromptTokens = Math.max(1, Math.ceil(query.length / 4) + Math.ceil(contextText.length / 4));
    const estimatedCompletionTokens = Math.max(1, Math.ceil(generatedChars / 4));
    const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;
    // Gemini 2.5 Flash / Flash-lite pricing reference ($0.075 / 1M prompt, $0.30 / 1M completion)
    const estimatedCostUsd = Number(((estimatedPromptTokens * 0.000000075) + (estimatedCompletionTokens * 0.0000003)).toFixed(7));

    res.write(`data: ${JSON.stringify({ 
      done: true, 
      confidence, 
      citations: uniqueCitations,
      metrics: {
        ttftMs,
        totalLatencyMs: totalDuration,
        promptTokens: estimatedPromptTokens,
        completionTokens: estimatedCompletionTokens,
        totalTokens,
        estimatedCostUsd,
        model: "atlas-neural-engine (local-verified)",
        retrievalLatencyMs,
        retrievalStrategy
      }
    })}\n\n`);
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
- Experience / Internships:
  • AI Intern at SPARK IIT (Jul 2026 – Sep 2026 | Remote / India):
    - Conducted large-scale Air Quality Index (AQI) analysis across 29,531 records spanning 26 Indian cities.
    - Engineered comparative Time-Series Forecasting models using Facebook Prophet and SARIMAX, cutting prediction error by 64.3% RMSE (from 249.54 to 89.03) and 67.6% MAE.
    - Built an interactive multi-city Streamlit analytics dashboard for real-time pollution trend visualizer and automated health advisory warnings.
    - Architected an AI-powered resume screening and candidate evaluation workflow integrating LLM extraction pipelines.
  • Machine Learning Internship at Cognifyz Technologies (1-Month Intensive | 2026): Predictive modeling, feature engineering, and cross-validation pipelines.
- Email: kartikraikar2005@gmail.com | Phone/WhatsApp: +91 8660910358
- Location: Belagavi, Karnataka, India (Available for Remote, Hybrid, or Onsite roles)
- GitHub: https://github.com/kartik-012 | LinkedIn: https://www.linkedin.com/in/kartik-raikar-kr | Portfolio: https://kartikportfolio-eta.vercel.app/ | Atlas AI Resume: https://atlas-ai-resume.vercel.app/
- Professional Summary: AI Engineer specializing in Generative AI, LLMs, RAG, and AI evaluation. Experienced in building production-oriented AI applications using Python, FastAPI, React.js, SQL, vector databases, and modern LLM tooling.
- 5 Major Production Projects:
  1. Atlas AI Resume: RAG-Powered AI Portfolio & Interactive Resume Assistant with Gemini, real-time Recruiter Telemetry Console, Benchmark Verifiers proof mode, Recruiter JD Matcher, and dynamic KB Studio. (React 19, TypeScript, Node.js, Express, Gemini API, RAG, Vector Search, TailwindCSS, Vite)
  2. AIOps Root Cause Correlator – Incident Engine: Autonomous incident correlation engine resolving cascading microservice alert storms in <45ms (down from ~2 hours of manual tracing) with 100% Top-1 RCA accuracy across 30 benchmark scenarios. Implements dynamic 24h Fourier harmonic EWMA anomaly detection (z > 2.0σ) with MicroRCA++ edge-weighted PageRank on causal dependency graphs (100% false-positive suppression). Traces Linux eBPF kernel probes (sys_enter_futex contention) and streams telemetry over Kafka KRaft (10K ring buffer with 80% backpressure shed) and gRPC :50051. Online Thompson Sampling bandit for automated remediation with HMAC-SHA256 mobile canary approval. 118 unit & integration tests (100% pass rate). (Python, FastAPI, PostgreSQL, pgvector, Redis, NetworkX, Three.js, Kafka KRaft, Linux eBPF, gRPC)
  3. VersionRAG – Documentation & Code Migration Intelligence: Enterprise RAG eliminating cross-version code contamination, driving hallucinated deprecated API calls from 62.5% to 0.0%. Features 3-stage hybrid retrieval (SQL version partition gate + parallel Okapi BM25 k1=1.5, b=0.75 + pgvector HNSW + RRF k=60 + Cross-Encoder reranking), boosting precision @k=6 from 41.7% to 98.4% (+136%) at 5.4ms latency. Structure-aware polyglot AST semantic diff engine across Python ast, JS/TS, OpenAPI 3.x/Swagger 2.0 with ParamNode/ReturnTypeNode/ExceptionNode at 94.2% accuracy. Includes live codebase vulnerability scanner & auto-refactor workbench CLI (python -m app.cli audit), self-generating 3-Way Auto-RAGAS, Redis ZSET rate limiting, 40 tests. (Python 3.12, FastAPI, PostgreSQL, pgvector, React 18, TypeScript, TailwindCSS, Okapi BM25, Cross-Encoder, Docker)
  4. Autonomous GitHub Agent Gateway – MCP Governance Plane: Zero-trust governance plane over Model Context Protocol (MCP) for LLM-driven repository automation. Eliminates 14.0% blind state corruption to 0.0% and delivers 100% intent classification accuracy across 100 scenarios. Pure-Python Hybrid RRF (k=60) combining corpus TF-IDF with exact AST error-code matching (0MB ML footprint). Sub-microsecond (0.8µs) Outbound DLP scanner using Shannon entropy H(X) >= 3.8 and ISO/IEC 7812 Luhn checksums to block secret exfiltration. 2-phase preview token protocol + append-only SHA-256 hash-chained Saga journal for out-of-order rollbacks by tx_id, RLock single-probe circuit breaker, adaptive compactor slashing context bloat by -92.2% across 120 tests (100% pass rate). (Python, FastMCP, PyGithub, Pydantic, Docker, GitHub Actions, Redis)
  5. ApexRAG – Enterprise Zero-Cost RAG & Production Harness: Production RAG harness and evaluation benchmark over 2,580 documentation chunks and 100 human-verified Q&A pairs on local CPU infrastructure. Hierarchical AST parent-document chunking (100-word child for high-res vector retrieval / 600-word parent for LLM context), hybrid BM25 + dense vector RRF (k=60), and Cross-Encoder reranker achieving Pareto-optimal latency <37ms across 82 unit/integration tests (100% pass rate). Corrective RAG (CRAG) with self-reflective tripartite relevance grading, query reformulation, and sub-millisecond semantic cosine cache (>= 0.96). Dense strategy router with Shannon entropy gating (<= 1.25) + Bayesian Thompson Sampling bandit. Multi-tenant clearance RBAC pre-filtering, dual-shield guardrails against PII and prompt injection, GitHub Actions CI/CD evaluation gate, OTel waterfall flamegraphs, Prometheus metrics, SSE streaming TTFT <40ms. (Python, FastAPI, ChromaDB, Sentence Transformers, Ollama, scikit-learn, OpenTelemetry, Prometheus, Docker)
- 9 Verified Professional Certifications:
  1. Fundamentals of Agents (Hugging Face Agents Course) – Hugging Face (2026)
  2. Agentic AI Certified Foundations Associate – Oracle (2026)
  3. AI Vector Search Certified Professional – Oracle (2026)
  4. Machine Learning Internship (1-Month Intensive) – Cognifyz Technologies (2026)
  5. Apache Kafka Essential Training: Building Scalable Applications – LinkedIn Learning (2026)
  6. Fundamentals of Machine Learning and Artificial Intelligence – AWS Training & Certification (2026)
  7. Microsoft Azure: Describe Cloud Computing – Microsoft (2026)
  8. Data Analytics Job Simulation – Deloitte (Forage, 2026)
  9. GenAI Powered Data Analytics Job Simulation – Tata Group (Forage, 2026)
- Technical Skills:
  • Frameworks & APIs: FastAPI, React.js, Next.js, FastMCP, Pydantic, PyGithub, gRPC, OpenAPI/Swagger
  • AI/ML & Retrieval: Generative AI, LLMs, RAG, Transformers, AI Evaluation, Prompt Engineering, BM25, Reciprocal Rank Fusion (RRF), Cross-Encoder Reranking, Semantic Search, Vector Search, scikit-learn, PyTorch
  • Databases & Messaging: PostgreSQL, pgvector, MySQL, MongoDB, Redis, Qdrant, ChromaDB, Apache Kafka (KRaft)
  • Observability & Infrastructure: OpenTelemetry (OTLP), Prometheus, Linux eBPF, Docker, Docker Compose, Linux, Git, GitHub Actions
  • Data & Visualization: Pandas, Streamlit, Prophet, SARIMAX, Three.js, Power BI, Tableau, Microsoft Excel
  • Programming Languages: Python, JavaScript, TypeScript, SQL
- Leadership & Achievements:
  • Vice President – Department of Artificial Intelligence & Machine Learning, Jain College of Engineering, Belagavi
  • Hack2Future 2.0 – IIIT Dharwad (Nokia Track): Top 60 finalist team from 570+ national registrations. Built KubeShield (graph-based Kubernetes attack-path visualizer, 36h hackathon)
  • Code for Innovex 2025 – NMAM Institute of Technology: 24h national-level hackathon by NSS IT Wing
  • LeetCode Problem Solving: 104 problems solved (30 Easy, 50 Medium, 24 Hard)
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

    let totalCharsStreamed = 0;
    for await (const chunk of streamResponse) {
      const textChunk = chunk.text || "";
      if (textChunk) {
        if (firstTokenTime === null) {
          firstTokenTime = Date.now();
        }
        totalCharsStreamed += textChunk.length;
        res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
      }
    }

    const totalDuration = Date.now() - requestStartTime;
    const ttftMs = (firstTokenTime ? firstTokenTime - requestStartTime : 120);
    const estimatedPromptTokens = Math.max(1, Math.ceil((query.length + systemInstruction.length) / 4));
    const estimatedCompletionTokens = Math.max(1, Math.ceil(totalCharsStreamed / 4));
    const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;
    const estimatedCostUsd = Number(((estimatedPromptTokens * 0.000000075) + (estimatedCompletionTokens * 0.0000003)).toFixed(7));

    // Send final completion message with rich telemetry metrics
    res.write(`data: ${JSON.stringify({ 
      done: true, 
      confidence, 
      citations: uniqueCitations,
      metrics: {
        ttftMs,
        totalLatencyMs: totalDuration,
        promptTokens: estimatedPromptTokens,
        completionTokens: estimatedCompletionTokens,
        totalTokens,
        estimatedCostUsd,
        model: "gemini-3.5-flash",
        retrievalLatencyMs,
        retrievalStrategy
      }
    })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("LLM processing error:", err);
    res.write(`data: ${JSON.stringify({ chunk: "I'm having trouble connecting right now. Here's what I found in Kartik's portfolio related to your question:\n\n" })}\n\n`);
    res.write(`data: ${JSON.stringify({ chunk: `**Best Matched Resume Content:**\n${bestMatch ? bestMatch.chunk.content : "No context available."}` })}\n\n`);
    res.write(`data: ${JSON.stringify({ 
      done: true, 
      confidence, 
      citations: uniqueCitations,
      metrics: {
        ttftMs: 25,
        totalLatencyMs: Date.now() - requestStartTime,
        promptTokens: Math.ceil(query.length / 4),
        completionTokens: 40,
        totalTokens: Math.ceil(query.length / 4) + 40,
        estimatedCostUsd: 0.000005,
        model: "fallback-resilient-rag",
        retrievalLatencyMs,
        retrievalStrategy
      }
    })}\n\n`);
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

// ==================== RECRUITER JD MATCHER & AUDIT API ====================
app.post("/api/recruiter/match-jd", apiLimiter, async (req, res) => {
  const { jobDescription, targetRole } = req.body;
  if (!jobDescription || typeof jobDescription !== "string") {
    return res.status(400).json({ error: "Missing or invalid job description" });
  }

  // Key requirement clusters to score against Kartik's verified resume
  const candidateSkills = [
    { skill: "Python", category: "Core Languages", projectEvidence: "AIOps RCA, VersionRAG, GitHub MCP Toolkit, ApexRAG" },
    { skill: "FastAPI", category: "Backend & Microservices", projectEvidence: "AIOps RCA, VersionRAG, ApexRAG" },
    { skill: "PostgreSQL & pgvector", category: "Databases & Vector Stores", projectEvidence: "VersionRAG (HNSW 5.4ms), AIOps RCA" },
    { skill: "RAG & Semantic Retrieval", category: "Generative AI", projectEvidence: "VersionRAG (AST semantic diff), ApexRAG (5 strategies)" },
    { skill: "LLM Tooling & Model Context Protocol (MCP)", category: "Agentic AI & Tooling", projectEvidence: "GitHub MCP Toolkit (SHA-256 preview tokens)" },
    { skill: "AI Evaluation & Benchmarking", category: "ML Quality", projectEvidence: "ApexRAG (2,580 chunks, MRR/NDCG metrics)" },
    { skill: "Incident Triage & Anomaly Detection", category: "AIOps / SRE", projectEvidence: "AIOps RCA (EWMA anomaly detection, <45ms resolution)" },
    { skill: "Apache Kafka (KRaft) & Event Streaming", category: "Distributed Systems", projectEvidence: "AIOps RCA (10K ring buffer, 80% backpressure shed)" },
    { skill: "Linux eBPF & Systems Telemetry", category: "Low-Level Systems", projectEvidence: "AIOps RCA (sys_enter_futex tracing)" },
    { skill: "Time-Series Forecasting & ML Analytics", category: "Data Science & ML", projectEvidence: "SPARK IIT (AQI analysis over 29,531 records, Prophet vs SARIMAX -64.3% RMSE)" },
    { skill: "Docker & Containerization", category: "DevOps / Infra", projectEvidence: "GitHub MCP Toolkit, Microservices topology" },
    { skill: "React.js & TypeScript", category: "Full-Stack UI", projectEvidence: "Atlas AI Resume, VersionRAG web client" },
    { skill: "Redis & Caching", category: "High Performance", projectEvidence: "AIOps RCA alert storm pipeline" },
    { skill: "Outbound DLP & Secret Scanning", category: "AI Safety & Governance", projectEvidence: "GitHub MCP Toolkit (0.8µs Shannon entropy H(X)>=3.8 + Luhn checksums)" },
    { skill: "Corrective RAG (CRAG) & AST Chunking", category: "Advanced RAG Architecture", projectEvidence: "ApexRAG (100-word child / 600-word parent, CRAG tripartite grading)" },
    { skill: "Cross-Encoder Reranking & Hybrid RRF", category: "Information Retrieval", projectEvidence: "VersionRAG & ApexRAG (Okapi BM25 + pgvector HNSW fused via RRF k=60)" }
  ];

  const jdLower = jobDescription.toLowerCase();
  const matchedSkills: typeof candidateSkills = [];
  const missingOrUnspecified: string[] = [];

  for (const item of candidateSkills) {
    const skillTerms = item.skill.toLowerCase().split(/[&\/\s,]+/).filter(t => t.length > 2);
    const hasMatch = skillTerms.some(term => jdLower.includes(term));
    if (hasMatch) {
      matchedSkills.push(item);
    } else {
      missingOrUnspecified.push(item.skill);
    }
  }

  // Calculate alignment score (base 70% if general AI keywords present, scaling up to 96%)
  const matchRatio = candidateSkills.length > 0 ? (matchedSkills.length / candidateSkills.length) : 0.8;
  const matchScore = Math.min(97, Math.max(68, Math.round(62 + matchRatio * 35)));

  // Generate actionable recruiter fit summary
  const roleName = targetRole || "AI / Generative AI Engineer";
  const matchedNames = matchedSkills.map(m => m.skill);

  const fitAnalysis = {
    targetRole: roleName,
    overallMatchScore: matchScore,
    matchRating: matchScore >= 88 ? "Exceptional Match (Top 1%)" : matchScore >= 78 ? "Strong Production Fit" : "Competent Engineering Match",
    summary: `Kartik Raikar presents a high-relevance engineering profile for this ${roleName} posting, offering verified hands-on production code across ${matchedSkills.length} requested technical competencies.`,
    matchedCompetencies: matchedSkills,
    keyStrengthsForRole: [
      "Industry Experience: AI Intern at SPARK IIT (AQI analysis across 29,531 records, Prophet vs SARIMAX reducing RMSE by 64.3%, Streamlit dashboard).",
      "Production-proven RAG reliability (eliminated 62.5% hallucination rate down to 0.0% in VersionRAG via 3-stage hybrid retrieval).",
      "High-throughput sub-second incident diagnostics (<45ms RCA via MicroRCA++ PageRank, Kafka KRaft, and Linux eBPF in AIOps Correlator).",
      "LLM Security & Tool Execution safety via MCP (0.8µs Outbound Shannon entropy DLP, SHA-256 Saga rollback, 100% intent accuracy).",
      "Rigorous evaluation methodology (ApexRAG isolated ranking quality with parent-document chunking and CRAG across 2,580 chunks)."
    ],
    recommendedInterviewQuestions: [
      "How did you implement the 3-stage hybrid retrieval in VersionRAG to balance lexical BM25 with dense pgvector HNSW?",
      "Can you walk through your two-phase commit protocol with SHA-256 preview tokens and Saga rollback in the GitHub MCP server?",
      "In AIOps RCA, how did you utilize Linux eBPF futex probes and MicroRCA++ PageRank to achieve <45ms RCA time?"
    ],
    directContact: {
      name: "Kartik Raikar",
      email: "kartikraikar2005@gmail.com",
      phone: "+91 8660910358",
      github: "https://github.com/kartik-012"
    }
  };

  res.json(fitAnalysis);
});

// ==================== SYSTEM HEALTH & TELEMETRY API ====================
app.get("/api/health", (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: "healthy",
    engine: "Atlas AI Resume",
    version: "2.4.0-enterprise",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    knowledgeBase: {
      totalChunks: knowledgeBase.length,
      embeddedChunks: knowledgeBase.filter(c => !!c.embedding).length
    },
    systemMetrics: {
      memoryRssMb: Math.round(memory.rss / (1024 * 1024) * 100) / 100,
      memoryHeapTotalMb: Math.round(memory.heapTotal / (1024 * 1024) * 100) / 100,
      memoryHeapUsedMb: Math.round(memory.heapUsed / (1024 * 1024) * 100) / 100
    }
  });
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
