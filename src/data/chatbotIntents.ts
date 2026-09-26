/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
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

function tokenMatches(token: string, target: string): boolean {
  if (token === target) return true;
  if (token.length < 3 || target.length < 3) return false;
  if (token.length >= 4 && (target.startsWith(token) || token.startsWith(target))) return true;
  if (token.length >= 4 && target.length >= 4) {
    const maxDist = (token.length >= 6 && target.length >= 6) ? 2 : 1;
    return levenshtein(token, target) <= maxDist;
  }
  return false;
}

const STOP_WORDS = new Set([
  "what", "is", "your", "my", "the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or",
  "me", "show", "tell", "about", "how", "does", "why", "give", "can", "you", "please", "with",
  "have", "are", "do", "this", "that", "all"
]);

export interface IntentRule {
  id: string;
  patterns: string[];
  exactMatches?: string[];
  handler: () => string;
}

export const INTENT_RULES: IntentRule[] = [
  // ==================== 1. PERSONAL PROFILE ====================
  {
    id: "who_are_you",
    exactMatches: ["who are you", "who are you?", "who is kartik", "who is kartik raikar", "about kartik"],
    patterns: ["who are you", "about kartik raikar", "who is kartik", "about kartik"],
    handler: () => `### About Kartik Raikar

**Kartik Raikar** is an **AI Engineer** specializing in **Generative AI, LLMs, RAG, and AI Evaluation**, currently pursuing B.E. in Computer Science & Engineering (AI & ML) at **Jain College of Engineering, Belagavi** (VTU, **8.50 CGPA**, Aug 2023 – Jul 2027).

**Core Specializations:**
• ⚡ **AIOps & Incident Intelligence**: Built **AIOps Root Cause Correlator** achieving 100% Top-1 RCA accuracy in 0.78s.
• 📚 **RAG Architecture**: Engineered **VersionRAG** eliminating 62.5% hallucinated deprecated API calls to 0.0%.
• 🔧 **MCP & LLM Tooling**: Built **GitHub MCP Toolkit** improving intent accuracy from 64% to 100%.
• 📊 **RAG Evaluation**: Created **ApexRAG** benchmarking 5 retrieval strategies (61% → 85% accuracy).
• 🏅 **Leadership**: Vice President of AI & ML Department at Jain College of Engineering.

*Would you like to explore his projects, review his resume, or view his contact details?*`
  },
  {
    id: "tell_me_about_yourself",
    exactMatches: ["tell me about yourself", "tell me about yourself.", "introduce yourself in two minutes", "introduce yourself in 2 minutes", "walk me through your background"],
    patterns: ["tell me about yourself", "tell me about your background", "walk through resume", "two minutes"],
    handler: () => `### Self Introduction (2 min)

**"I'm Kartik Raikar, an AI Engineer specializing in Generative AI, LLMs, RAG, and AI evaluation."**

• **Education**: Pursuing B.E. in CSE (AI & ML) with an 8.50 CGPA at Jain College of Engineering, Belagavi.
• **What I've Built**:
  1. **AIOps Root Cause Correlator**: Autonomous incident engine resolving cascading alert storms in 0.78s with 100% Top-1 RCA accuracy.
  2. **VersionRAG**: Enterprise RAG architecture eliminating cross-version code contamination (62.5% → 0.0% hallucination).
  3. **GitHub MCP Toolkit**: Fault-tolerant MCP server improving intent accuracy from 64% to 100% with zero prompt injections.
  4. **ApexRAG**: RAG evaluation benchmark improving retrieval accuracy from 61% to 85% across 5 strategies.
• **Leadership**: Vice President of AI & ML Department, Hackathon competitor (Hack2Future 2.0, Code for Innovex).
• **Where I'm Headed**: Seeking AI Engineering and Generative AI roles to build production-grade LLM applications.

*Would you like to drill into any specific project or discuss interview availability?*`
  },
  {
    id: "introduce_yourself",
    exactMatches: ["introduce yourself", "self introduction", "intro", "professional introduction"],
    patterns: ["introduce yourself", "give an introduction", "professional introduction"],
    handler: () => `### Professional Introduction

Hello! I am **Atlas AI**, representing **Kartik Raikar** — an AI Engineer specializing in Generative AI, LLMs, RAG, and AI Evaluation.

**Key Highlights:**
1. **Academic Excellence**: B.E. in CSE (AI & ML) with **8.50 / 10.0 CGPA** at Jain College of Engineering (VTU).
2. **Production AI Systems**: Built 4 major production-grade AI projects with measurable impact metrics.
3. **Verified Credentials**: 3 industry certifications (Oracle AI Foundations, AWS ML, Tata GenAI).
4. **Leadership**: Vice President of AI & ML Department at Jain College of Engineering.

*How can I assist your evaluation today? Feel free to ask about specific projects, technical depth, or schedule an interview!*`
  },
  {
    id: "introduce_30_seconds",
    exactMatches: ["introduce yourself in 30 seconds", "elevator pitch", "quick pitch", "pitch", "quick introduction"],
    patterns: ["introduce yourself in 30 seconds", "30 seconds", "elevator pitch", "quick pitch"],
    handler: () => `### 30 Second Elevator Pitch

**"I'm Kartik Raikar, an AI Engineer with an 8.50 CGPA in CSE (AI & ML) and 3 industry certifications.**

I've built **AIOps RCA** (0.78s incident resolution with 100% accuracy), **VersionRAG** (eliminated 62.5% hallucination to 0.0%), **GitHub MCP Toolkit** (64% → 100% intent accuracy), and **ApexRAG** (61% → 85% retrieval accuracy). I specialize in Python, FastAPI, PostgreSQL, pgvector, and production RAG pipelines.

I am ready to ship high-impact AI infrastructure for your engineering team!"`
  },
  {
    id: "introduce_one_minute",
    exactMatches: ["introduce yourself in one minute", "introduce yourself in 1 minute", "one minute introduction", "1 minute pitch"],
    patterns: ["introduce yourself in one minute", "one minute introduction", "1 minute pitch"],
    handler: () => `### 1-Minute Professional Pitch

**"Hi, I'm Kartik Raikar, an AI Engineer pursuing my B.E. in CSE (AI & ML) at Jain College of Engineering, Belagavi (8.50 CGPA).**

My engineering approach centers around **production-grade AI systems with measurable impact**:
• I built **AIOps Root Cause Correlator** resolving cascading alert storms in 0.78s (down from 1-4 hours) with 100% accuracy.
• **VersionRAG** eliminates cross-version hallucinations from 62.5% to 0.0% using version-partitioned vector indexing.
• **GitHub MCP Toolkit** is a fault-tolerant MCP server that improved intent accuracy from 64% to 100%.
• As **Vice President of AI & ML** at my college, I lead departmental technical initiatives.
• My stack spans Python, FastAPI, PostgreSQL + pgvector, React.js, Docker, backed by **3 certifications** (Oracle AI, AWS ML, Tata GenAI).

I am eager to bring this passion for production AI engineering to your team."`
  },
  {
    id: "professional_summary",
    exactMatches: ["professional summary", "summary of profile", "profile summary", "summarize profile"],
    patterns: ["professional summary", "profile summary"],
    handler: () => `### Professional Summary

AI Engineer specializing in **Generative AI, LLMs, RAG, and AI Evaluation**. Experienced in building production-oriented AI applications using Python, FastAPI, React.js, SQL, vector databases, and modern LLM tooling.

Proven ability to deliver measurable impact — from eliminating 62.5% hallucination rates to 0.0% (VersionRAG) to resolving incident storms in 0.78s (AIOps RCA). Holds **3 industry certifications** and maintains an **8.50 CGPA** in CSE (AI & ML). Vice President of the AI & ML Department at Jain College of Engineering.`
  },
  {
    id: "executive_summary",
    exactMatches: ["executive summary", "recruiter summary", "executive briefing"],
    patterns: ["executive summary", "executive briefing", "c-level summary"],
    handler: () => `### Executive Summary

• **Candidate**: Kartik Raikar | AI Engineer — Generative AI — LLM Applications
• **Status**: B.E. CSE (AI & ML) Student (Aug 2023 – Jul 2027) | **8.50 / 10.0 CGPA** | Jain College of Engineering (VTU)
• **Key Differentiator**: Builds production AI systems with measurable metrics — 100% RCA accuracy, 0.0% hallucination, 98.4% retrieval precision.
• **Verified Credentials**: 3 Certifications (Oracle AI Foundations, AWS ML, Tata GenAI).
• **Leadership**: Vice President of AI & ML Department.
• **Readiness**: Immediate availability for AI Engineering and Generative AI roles.`
  },
  {
    id: "resume_summary",
    exactMatches: ["resume summary", "summarize resume", "summary of resume", "show resume", "summarize kartik's resume"],
    patterns: ["resume summary", "summarize resume", "summary of resume", "summarize kartik"],
    handler: () => `### Resume Summary

• **Education**: B.E. in CSE (AI & ML) (Aug 2023 – Jul 2027) from Jain College of Engineering, Belagavi (VTU) — **8.50 CGPA**.
• **Core Projects**:
  1. **Atlas AI Resume**: Interactive RAG resume assistant with Recruiter Telemetry Console.
  2. **AIOps Root Cause Correlator**: 0.78s incident resolution, 100% Top-1 RCA accuracy.
  3. **VersionRAG**: Eliminated 62.5% hallucination to 0.0%, 98.4% retrieval precision.
  4. **GitHub MCP Toolkit**: 64% → 100% intent accuracy, zero prompt injections.
  5. **ApexRAG**: 61% → 85% retrieval accuracy across 5 strategies.
• **Skills**: Python, FastAPI, React.js, PostgreSQL, pgvector, Redis, Docker, PyTorch.
• **Certifications**: Oracle AI Foundations, AWS ML & AI, Tata GenAI.
• **Leadership**: Vice President of AI & ML Department.

*You can download the full PDF resume directly from the top navigation bar!*`
  },
  {
    id: "full_profile",
    exactMatches: ["full profile", "complete profile", "entire profile"],
    patterns: ["complete professional profile", "full profile", "complete background"],
    handler: () => `### Complete Professional Profile

• **Full Name**: Kartik Raikar
• **Role**: AI Engineer — Generative AI — LLM Applications
• **Location**: Belagavi, Karnataka, India (Open to Relocation & Remote)
• **Education**: B.E. in CSE (AI & ML) (Aug 2023 – Jul 2027), Jain College of Engineering (VTU) — **8.50 CGPA**
• **Core Specialties**: Generative AI, LLMs, RAG, AI Evaluation, Prompt Engineering, Semantic Search, Vector Search.
• **Certifications**: 3 Total (Oracle AI Foundations, AWS ML, Tata GenAI).
• **Leadership**: Vice President of AI & ML Department.
• **GitHub**: [github.com/kartik-012](https://github.com/kartik-012)`
  },
  {
    id: "background",
    exactMatches: ["background", "career background", "tell me your background"],
    patterns: ["career background", "engineering background", "academic background"],
    handler: () => `### Career Background

Kartik Raikar is an AI Engineer driven by building production-grade AI applications with measurable impact metrics.

• **AIOps & Incident Intelligence**: Built autonomous incident correlation achieving 100% RCA accuracy in sub-second latency.
• **RAG Architecture & Evaluation**: Engineered version-aware RAG systems and comprehensive evaluation benchmarks.
• **LLM Tooling & MCP**: Created production MCP servers for LLM-driven automation with zero vulnerability tolerance.
• **Leadership**: Serves as Vice President of AI & ML Department, competed in national hackathons.

*Would you like details on how this background aligns with a specific role?*`
  },
  {
    id: "career_objective",
    exactMatches: ["career objective", "objective", "professional objective"],
    patterns: ["career objective", "job objective", "target role"],
    handler: () => `### Career Objective

> *"To secure a challenging role as an **AI Engineer** or **Generative AI Developer** where I can leverage my expertise in LLMs, RAG pipelines, AI evaluation, and production backend infrastructure to build high-impact, fault-tolerant AI applications."*`
  },
  {
    id: "career_goals",
    exactMatches: ["career goals", "career vision", "future aspirations", "future goals", "goals"],
    patterns: ["career goals", "career vision", "future goals"],
    handler: () => `### Career Vision

• **Short-Term (1–2 Years)**: Ship production-grade AI applications, master advanced RAG architectures, and contribute to open-source LLM tooling.
• **Mid-Term (3–5 Years)**: Lead architecture design for enterprise AI platforms, RAG evaluation frameworks, and LLM safety guardrails.
• **Long-Term**: Shape the future of reliable AI systems, driving zero-hallucination RAG architectures and enterprise LLM governance.`
  },
  {
    id: "where_are_you_from",
    exactMatches: ["where are you from?", "where are you from", "hometown", "native"],
    patterns: ["where are you from", "hometown", "native place", "origin"],
    handler: () => `### Hometown & Background

• **Hometown**: **Belagavi, Karnataka, India**
• **Current Base**: Belagavi (pursuing B.E. at Jain College of Engineering, VTU)
• **Language Proficiency**: English (Fluent), Kannada (Native), Hindi (Conversational)
• **Work Readiness**: Ready to relocate to tech hubs like **Bengaluru, Hyderabad, Pune, Mumbai, Delhi-NCR**, or work **Remotely**.`
  },
  {
    id: "where_are_you_based",
    exactMatches: ["where are you based?", "where are you based", "location", "current location", "preferred work location"],
    patterns: ["where are you based", "location", "work preferences", "preferred work location"],
    handler: () => `### Location & Work Preferences

• 📍 **Current Location**: Belagavi, Karnataka, India
• 🌍 **Work Mode**: Open to **Remote**, **Hybrid**, and **Onsite** opportunities.
• 🚀 **Relocation**: Willing to relocate for full-time or internship positions.
• ⚡ **Notice Period**: Immediate availability.

*Feel free to reach out at **kartikraikar2005@gmail.com** or **+91 8660910358**.*`
  },

  // ==================== 2. EDUCATION & ACADEMICS ====================
  {
    id: "education",
    exactMatches: ["education", "education timeline", "academic journey"],
    patterns: ["education timeline", "education details", "academic journey"],
    handler: () => `### Education Timeline

• **Aug 2023 – Jul 2027 (Expected)**:
  - **Degree**: B.E. in **Computer Science & Engineering (AI & ML)**
  - **Institution**: **Jain College of Engineering, Belagavi**
  - **University**: **Visvesvaraya Technological University (VTU)**
  - **CGPA**: **8.50 / 10.0**
• **2021 – 2023**:
  - **Course**: Pre-University Course (PCM)
  - **Institution**: **Jain PU College, Belagavi**
  - **Score**: **80%**
• **Relevant Coursework**: Data Structures & Algorithms, OOP, DBMS, Data Science, OS, Computer Networks, Software Engineering, AI, Machine Learning`
  },
  {
    id: "education_details",
    exactMatches: ["education details", "academic background", "studies"],
    patterns: ["education details", "education background", "academic background"],
    handler: () => `### Education & Academic Background

• 🎓 **Degree**: B.E. in Computer Science & Engineering (AI & ML) (Aug 2023 – Jul 2027)
• 🏫 **College**: Jain College of Engineering, Belagavi (VTU Affiliated)
• 📊 **CGPA**: **8.50 / 10.0**
• 📜 **Pre-University**: PCM at Jain PU College, Belagavi (2021–2023, 80%)

*Would you like to see his coursework or certifications?*`
  },
  {
    id: "college_details",
    exactMatches: ["college", "college details", "college name", "which college", "university"],
    patterns: ["college details", "college name", "university name", "jain college"],
    handler: () => `### College Information

• **Institution**: **Jain College of Engineering (JCE), Belagavi**
• **University**: **Visvesvaraya Technological University (VTU)**
• **Location**: Belagavi, Karnataka, India
• **Department**: Department of Computer Science & Engineering (AI & ML)
• **Leadership**: Kartik serves as **Vice President** of the AI & ML Department`
  },
  {
    id: "branch",
    exactMatches: ["branch", "which branch", "specialization", "major"],
    patterns: ["which branch", "specialization", "branch of engineering", "major"],
    handler: () => `### Computer Science & Engineering (AI & ML)

• **Major**: Computer Science & Engineering (Artificial Intelligence & Machine Learning)
• **Focus Areas**:
  - Generative AI & Large Language Models
  - Retrieval-Augmented Generation (RAG)
  - AI Evaluation & Prompt Engineering
  - Production Backend Systems with FastAPI & PostgreSQL`
  },
  {
    id: "degree",
    exactMatches: ["degree", "which degree", "qualification"],
    patterns: ["which degree", "bachelor degree", "undergraduate degree"],
    handler: () => `### Bachelor's Degree

• **Degree**: Bachelor of Engineering (B.E.)
• **Field**: Computer Science & Engineering (AI & ML)
• **Duration**: 4-Year Full-Time Undergraduate Program (Aug 2023 – Jul 2027)
• **Current Status**: Active Student, 8.50 CGPA`
  },
  {
    id: "graduation_year",
    exactMatches: ["graduation year", "when will you graduate", "passing year"],
    patterns: ["graduation year", "year of passing", "graduating year"],
    handler: () => `### Graduation Timeline

• **Graduation Year**: **July 2027**
• **Availability for Internships**: Immediate availability.
• **Availability for Full-Time**: Open for roles upon graduation.`
  },
  {
    id: "cgpa",
    exactMatches: ["cgpa", "gpa", "marks", "score", "percentage"],
    patterns: ["cgpa", "overall cgpa", "grade point average", "academic score"],
    handler: () => `### CGPA & Academic Performance

• **Cumulative GPA (CGPA)**: **8.50 / 10.0**
• **Pre-University**: 80% in PCM (Jain PU College, 2021-2023)
• **Performance**: Consistently maintained strong academic standing across engineering and computer science subjects.`
  },
  {
    id: "subjects_studied",
    exactMatches: ["subjects studied", "subjects", "courses", "coursework", "relevant coursework"],
    patterns: ["subjects studied", "coursework", "academic subjects", "relevant coursework"],
    handler: () => `### Relevant Coursework

• **Core CS**: Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems, Computer Networks, Software Engineering
• **AI & Data**: Artificial Intelligence, Machine Learning, Data Science`
  },

  // ==================== 3. RESUME & CV ====================
  {
    id: "resume",
    exactMatches: ["resume", "cv", "resume overview", "curriculum vitae", "explain resume"],
    patterns: ["resume overview", "look at resume", "show resume"],
    handler: () => `### Resume Overview

• **Live Viewer**: Currently embedded directly in this interactive portal screen.
• **Key Sections**:
  1. **Candidate Profile**: AI Engineer — Generative AI — LLM Applications (8.50 CGPA, Belagavi).
  2. **5 Key Projects**: Atlas AI Resume, AIOps RCA, VersionRAG, GitHub MCP Toolkit, ApexRAG.
  3. **Technical Stack**: Python, FastAPI, React.js, PostgreSQL, pgvector, Redis, Docker, PyTorch.
  4. **3 Certifications**: Oracle AI Foundations, AWS ML, Tata GenAI.
  5. **Leadership**: Vice President of AI & ML Department.

*Click "Download Resume" in the header to get the official PDF copy.*`
  },
  {
    id: "resume_highlights",
    exactMatches: ["resume highlights", "highlights", "key resume points"],
    patterns: ["resume highlights", "top highlights", "standout points"],
    handler: () => `### Resume Highlights

1. ⚡ **0.78s Incident Resolution** with 100% Top-1 RCA accuracy (AIOps Root Cause Correlator).
2. 📚 **62.5% → 0.0% Hallucination** via version-partitioned vector indexing (VersionRAG).
3. 🔧 **64% → 100% Intent Accuracy** with zero prompt injections (GitHub MCP Toolkit).
4. 📊 **61% → 85% Retrieval Accuracy** across 5 RAG strategies (ApexRAG).
5. 🏅 **Vice President** of AI & ML Department at Jain College of Engineering.
6. 🎓 **8.50 CGPA** in B.E. CSE (AI & ML) from Jain College of Engineering (VTU).`
  },
  {
    id: "download_resume",
    exactMatches: ["download resume", "download cv", "get pdf", "pdf resume"],
    patterns: ["download resume", "download pdf", "get resume pdf"],
    handler: () => `### Resume Download

• 📥 **Direct Download**: Click the glowing **"Download Resume"** button in the top navigation bar.
• 📄 **File Format**: Standard ATS-optimized PDF format.`
  },

  // ==================== 4. TECHNICAL SKILLS & STACK ====================
  {
    id: "technical_skills",
    exactMatches: ["technical skills", "skills", "tech skills", "skill set", "technology stack"],
    patterns: ["technical stack & skills", "technical skills", "skillset", "skills summary", "technology stack"],
    handler: () => `### Technical Stack & Skills

• **Programming**: Python, JavaScript, TypeScript, SQL
• **Frameworks**: FastAPI, React.js, Next.js, PyTorch
• **AI/ML**: Generative AI, LLMs, RAG, Transformers, AI Evaluation, Prompt Engineering, Semantic Search, Vector Search
• **Databases**: PostgreSQL (pgvector), MySQL, MongoDB, Redis, Qdrant
• **Tools**: Git, GitHub, Docker, Linux, Postman, VS Code, GitHub Actions
• **Data & Visualization**: Power BI, Tableau, Microsoft Excel`
  },
  {
    id: "programming_languages",
    exactMatches: ["programming languages", "languages", "coding languages"],
    patterns: ["programming languages", "languages you know", "coding languages"],
    handler: () => `### Programming Languages

• 🐍 **Python**: Primary language for AI/ML, FastAPI backends, LLM tooling, and data processing.
• 🌐 **JavaScript**: Full-stack web development, React.js, Node.js.
• 🟦 **TypeScript**: Type-safe frontend and backend development.
• 🗄️ **SQL**: PostgreSQL, MySQL queries, indexing, migrations, pgvector operations.`
  },
  {
    id: "frontend_skills",
    exactMatches: ["frontend skills", "frontend technologies", "frontend stack"],
    patterns: ["frontend technologies", "frontend skills", "ui skills"],
    handler: () => `### Frontend Technologies

• ⚛️ **React.js & Next.js**: Component-driven UI, hooks, responsive layouts.
• 🎨 **TailwindCSS**: Modern utility-first styling.
• ⚡ **Vite**: High-speed development bundling.
• 🧊 **Three.js**: 3D topology visualizers (AIOps RCA).`
  },
  {
    id: "backend_skills",
    exactMatches: ["backend skills", "backend technologies", "backend stack"],
    patterns: ["backend technologies", "backend skills", "server side skills"],
    handler: () => `### Backend Technologies

• ⚡ **FastAPI**: Async REST APIs, WebSockets, production-grade Python backends.
• 🟢 **Node.js & Express**: REST APIs, SSE token streaming.
• 🐍 **FastMCP**: Model Context Protocol server development.
• 🔌 **WebSockets & SSE**: Real-time streaming and bidirectional communication.`
  },
  {
    id: "ai_skills",
    exactMatches: ["ai skills", "artificial intelligence skills", "ai stack"],
    patterns: ["artificial intelligence skills", "ai skills", "ai capabilities"],
    handler: () => `### AI & Generative AI Skills

• 🤖 **Generative AI & LLMs**: Production LLM application development, prompt engineering, structured output generation.
• 🔍 **RAG**: Version-partitioned vector indexing, AST semantic diff, multi-strategy retrieval evaluation.
• 📊 **AI Evaluation**: Retrieval accuracy benchmarking, hallucination detection, Cross-Encoder re-ranking.
• 🔧 **MCP Protocol**: Anthropic Model Context Protocol server development for LLM-driven automation.
• 🧠 **Transformers & PyTorch**: Deep learning model understanding and application.`
  },
  {
    id: "database_skills",
    exactMatches: ["database skills", "database technologies", "databases"],
    patterns: ["database technologies", "database skills", "db stack"],
    handler: () => `### Database Technologies

• 🐘 **PostgreSQL**: Production database design with pgvector for vector similarity search, HNSW indexing.
• 🗄️ **MySQL**: Relational database management.
• 🍃 **MongoDB**: Document storage.
• ⚡ **Redis**: In-memory caching, session state management.
• 🎯 **Qdrant**: Vector database for semantic search.
• 📦 **ChromaDB**: Lightweight vector store for RAG evaluation.`
  },
  {
    id: "tools_you_use",
    exactMatches: ["tools you use", "development tools", "tools", "developer tools"],
    patterns: ["development tools", "tools you use", "dev tools"],
    handler: () => `### Development Tools

• **IDE**: VS Code
• **Version Control**: Git, GitHub, GitHub Actions (CI/CD)
• **Containers**: Docker
• **API Testing**: Postman
• **OS**: Linux
• **Data & Viz**: Power BI, Tableau, Microsoft Excel`
  },
  {
    id: "strongest_skill",
    exactMatches: ["strongest skill", "strongest skills", "top skill", "what is your best skill"],
    patterns: ["strongest skill", "strongest skills", "top technical strength"],
    handler: () => `### Strongest Skills

1. 📚 **RAG Architecture & Evaluation**: Version-partitioned indexing, multi-strategy benchmarking, hallucination elimination.
2. ⚡ **Production AI Backend**: FastAPI, PostgreSQL + pgvector, HNSW vector indexing, sub-second latency.
3. 🔧 **LLM Tooling & MCP**: Fault-tolerant MCP servers, prompt injection defense, reversible write workflows.`
  },
  {
    id: "weakest_skill",
    exactMatches: ["weakest skill", "weakest skills", "areas of improvement", "weakness"],
    patterns: ["weakest skill", "areas of improvement", "growth areas"],
    handler: () => `### Areas of Growth

• **Distributed Training at Scale**: Expanding expertise in multi-GPU training and inference optimization.
• **Constantly Learning**: Actively deepening knowledge in advanced transformer architectures and MLOps pipelines.`
  },

  // ==================== 5. AI KNOWLEDGE & CONCEPTS ====================
  {
    id: "explain_rag",
    exactMatches: ["explain rag", "what is rag", "retrieval augmented generation", "explain rag pipeline"],
    patterns: ["retrieval-augmented generation", "explain rag", "what is rag", "rag pipeline"],
    handler: () => `### Retrieval-Augmented Generation (RAG)

**RAG** combines information retrieval with LLMs for accurate, grounded responses:

1. **Ingestion & Chunking**: Documents split into semantic chunks.
2. **Embedding Generation**: Chunks transformed into vector representations.
3. **Similarity Search**: Cosine similarity retrieves top-K chunks from vector DB.
4. **Context Injection & Synthesis**: Retrieved facts injected into LLM prompt for grounded generation.

**Kartik's RAG Expertise:**
• **VersionRAG**: Version-partitioned indexing eliminating 62.5% hallucination to 0.0%.
• **ApexRAG**: Benchmarked 5 strategies improving accuracy from 61% to 85%.`
  },
  {
    id: "explain_llm",
    exactMatches: ["explain llm", "what is an llm", "large language models"],
    patterns: ["large language models", "explain llm", "what is llm"],
    handler: () => `### Large Language Models

**LLMs** are deep neural networks based on the Transformer architecture trained on vast text corpora:
• **Key Driver**: Self-Attention allows models to dynamically weigh relationships between tokens.
• **Capabilities**: Natural language understanding, reasoning, code generation, and multi-turn agents.

**Kartik's LLM Work**: Built MCP servers, RAG pipelines, and evaluation frameworks for production LLM applications.`
  },
  {
    id: "explain_mcp",
    exactMatches: ["explain mcp", "what is mcp", "model context protocol"],
    patterns: ["model context protocol", "explain mcp", "what is model context protocol"],
    handler: () => `### Model Context Protocol (MCP)

An open protocol by Anthropic that standardizes how AI applications connect to external data sources and tools.

**Kartik's MCP Work (GitHub MCP Toolkit)**:
• Built production-ready MCP server for LLM-driven repository automation.
• Two-phase SHA-256 preview-token protocol for safe mutations.
• Improved intent accuracy from 64% to 100% with ABAC security and Pydantic validation.`
  },
  {
    id: "explain_vector_database",
    exactMatches: ["explain vector database", "what is a vector database", "vector databases", "pgvector"],
    patterns: ["vector databases", "explain vector database", "what is vector db", "pgvector"],
    handler: () => `### Vector Databases & pgvector

**Vector Databases** are storage engines optimized for high-dimensional vector similarity search:
• **HNSW Indexes**: Hierarchical Navigable Small World graphs for sub-millisecond approximate nearest neighbor retrieval.

**Kartik's Experience:**
• **VersionRAG**: PostgreSQL + pgvector with HNSW at 5.4ms latency.
• **AIOps RCA**: PostgreSQL 16 + pgvector for topology embeddings.
• **ApexRAG**: ChromaDB for RAG evaluation benchmarking.`
  },
  {
    id: "explain_prompt_engineering",
    exactMatches: ["explain prompt engineering", "what is prompt engineering", "prompting techniques"],
    patterns: ["prompt engineering", "explain prompt engineering", "prompting methods"],
    handler: () => `### Prompt Engineering

The art and science of structuring inputs to guide LLMs toward high-quality outputs:
• **Techniques**: Few-Shot Learning, Chain-of-Thought (CoT), Structured JSON output, Chain-of-Version reasoning.

**Kartik's Work**: Implemented 4-step Chain-of-Version reasoning pipeline in VersionRAG and prompt injection defense in GitHub MCP Toolkit.`
  },
  {
    id: "explain_semantic_search",
    exactMatches: ["explain semantic search", "semantic search", "vector search"],
    patterns: ["semantic search", "vector search", "approximate nearest neighbor"],
    handler: () => `### Semantic Search vs Keyword Search

• **Keyword Search (BM25)**: Matches exact word tokens — ApexRAG baseline achieving 61% accuracy.
• **Semantic Search (Dense Vector)**: Meaning-based matching — ApexRAG improved to 85% with Cross-Encoder Re-ranking.

**Kartik's Contribution**: Systematically benchmarked 5 retrieval strategies in ApexRAG, establishing ranking quality as the primary bottleneck.`
  },

  // ==================== 6. ALL PROJECTS & SYSTEM DESIGN ====================
  {
    id: "projects",
    exactMatches: ["projects", "all projects", "what did you build", "list projects", "explain all projects"],
    patterns: ["complete project portfolio", "all projects", "list of projects", "explain all projects"],
    handler: () => `### Complete Project Portfolio

1. 🌐 **Atlas AI Resume**: Interactive RAG portfolio with Recruiter Telemetry Console & KB Studio.
2. ⚡ **AIOps Root Cause Correlator**: Autonomous incident engine — 0.78s resolution, 100% Top-1 RCA accuracy.
3. 📚 **VersionRAG**: Enterprise RAG — 62.5% → 0.0% hallucination, 98.4% retrieval precision.
4. 🔧 **GitHub MCP Toolkit**: Fault-tolerant MCP server — 64% → 100% intent accuracy.
5. 📊 **ApexRAG**: RAG evaluation benchmark — 61% → 85% retrieval accuracy across 5 strategies.

*Which project would you like to explore in detail?*`
  },
  {
    id: "best_project",
    exactMatches: ["best project", "flagship project", "proudest project", "favorite project", "most complex project"],
    patterns: ["flagship project", "best project", "proudest project", "most complex project"],
    handler: () => `### Flagship Projects

**AIOps Root Cause Correlator** and **VersionRAG** are Kartik's flagship engineering accomplishments:
• **AIOps RCA**: Solves cascading alert storms in 0.78s with 100% accuracy using EWMA + causal DAG traversal.
• **VersionRAG**: Eliminates cross-version hallucination from 62.5% to 0.0% with version-partitioned vector indexing.`
  },
  {
    id: "project_achievements",
    exactMatches: ["project achievements", "impact of projects", "project metrics"],
    patterns: ["project achievements", "project milestones", "project results", "project metrics"],
    handler: () => `### Project Achievements & Metrics

• **100% Top-1 RCA Accuracy** across 30 benchmark scenarios (AIOps RCA).
• **0.78s Resolution Time** down from 1-4 hours of manual tracing (AIOps RCA).
• **62.5% → 0.0% Hallucination** in deprecated API calls (VersionRAG).
• **41.7% → 98.4% Retrieval Precision** at 5.4ms HNSW latency (VersionRAG).
• **64% → 100% Intent Execution Accuracy** (GitHub MCP Toolkit).
• **61% → 85% Retrieval Accuracy** across 5 strategies (ApexRAG).`
  },

  // ==================== 7. AIOPS ROOT CAUSE CORRELATOR ====================
  {
    id: "aiops_rca",
    exactMatches: ["aiops", "aiops rca", "root cause correlator", "incident engine", "aiops root cause", "tell me about aiops"],
    patterns: ["aiops root cause correlator", "aiops rca", "incident engine", "root cause analysis", "aiops"],
    handler: () => `### Project Spotlight: AIOps Root Cause Correlator

• ⚡ **Overview**: Autonomous incident correlation engine for microservice environments.
• 🛠️ **Tech Stack**: Python, FastAPI, PostgreSQL, Redis, NetworkX, Three.js, WebSockets, pgvector.
• 📊 **Key Metrics**:
  - Resolves cascading alert storms in **0.78s** (down from 1-4 hours manual tracing).
  - **100% Top-1 RCA accuracy** across 30 benchmark scenarios.
  - **100% precision/recall** in false-positive alert suppression.
• ⚡ **Key Features**:
  1. **EWMA Anomaly Detection**: Dynamic z > 2.0σ threshold with causal DAG traversal in NetworkX.
  2. **3D Topology Visualizer**: Real-time Three.js/WebGL telemetry with streaming WebSockets.
  3. **Counterfactual Simulation**: What-if blast radius simulation over PostgreSQL 16 + pgvector.
• 🐙 **GitHub**: [github.com/kartik-012/aiops-rca](https://github.com/kartik-012/aiops-rca)

*Would you like to know about the EWMA anomaly detection or 3D visualizer?*`
  },
  {
    id: "explain_aiops_rca",
    exactMatches: ["explain aiops rca", "how does aiops work", "aiops architecture"],
    patterns: ["aiops architecture", "explain aiops", "how aiops works", "ewma anomaly"],
    handler: () => `### AIOps RCA Architecture & Workflow

1. **Alert Ingestion**: Microservice alerts flow in as time-series events.
2. **EWMA Anomaly Detection**: Dynamic z-score threshold (z > 2.0σ) flags anomalous metrics.
3. **Causal DAG Traversal**: NetworkX graph algorithms trace causality chains across service dependencies.
4. **Root Cause Isolation**: Multi-root-cause failures identified with 100% precision/recall.
5. **3D Visualization**: Three.js/WebGL renders real-time topology with blast radius simulation.
6. **Vector Storage**: PostgreSQL 16 + pgvector stores topology embeddings for fast similarity queries.`
  },

  // ==================== 8. VERSIONRAG ====================
  {
    id: "versionrag",
    exactMatches: ["versionrag", "version rag", "documentation intelligence", "tell me about versionrag"],
    patterns: ["versionrag", "version rag", "documentation intelligence", "version-partitioned"],
    handler: () => `### Project Spotlight: VersionRAG

• 📚 **Overview**: Enterprise RAG architecture solving cross-version code contamination.
• 🛠️ **Tech Stack**: Python 3.12, FastAPI, PostgreSQL, pgvector, React 18, TypeScript, Tailwind.
• 📊 **Key Metrics**:
  - Hallucinated deprecated API calls: **62.5% → 0.0%**.
  - AST semantic diff accuracy: **94.2%** for undocumented breaking changes.
  - Retrieval precision @k=6: **41.7% → 98.4% (+136%)** at 5.4ms HNSW latency.
• ⚡ **Key Features**:
  1. **Version-Partitioned Vector Indexing**: Database-enforced isolation eliminates cross-version contamination.
  2. **AST Semantic Diff Engine**: Detects undocumented breaking changes with 94.2% accuracy.
  3. **4-Step Chain-of-Version Reasoning**: Live X-Ray diagnostic chunk inspection.
  4. **Production Auth**: Bcrypt-hashed OTP email authentication with pgvector fallbacks.
• 🐙 **GitHub**: [github.com/kartik-012/versionrag](https://github.com/kartik-012/versionrag)

*Would you like to explore the version-partitioned indexing architecture?*`
  },
  {
    id: "explain_versionrag",
    exactMatches: ["explain versionrag", "how does versionrag work", "versionrag architecture"],
    patterns: ["versionrag architecture", "explain versionrag", "how versionrag works"],
    handler: () => `### VersionRAG Architecture & Workflow

1. **Version-Partitioned Ingestion**: Documentation chunks are indexed with strict version tags at the database level.
2. **AST Semantic Diff**: Structure-aware engine parses code changes to detect undocumented breaking changes (94.2% accuracy).
3. **HNSW Vector Search**: pgvector indexes enable 5.4ms retrieval latency with version-scoped queries.
4. **Chain-of-Version Reasoning**: 4-step pipeline ensures responses reference the correct API version.
5. **X-Ray Diagnostics**: Live chunk inspection shows exactly which documentation chunks were retrieved and scored.
6. **Authentication**: Bcrypt-hashed OTP email auth with resilient pgvector fallbacks for production reliability.`
  },

  // ==================== 9. GITHUB MCP TOOLKIT ====================
  {
    id: "github_mcp_toolkit",
    exactMatches: ["github mcp toolkit", "mcp toolkit", "mcp server", "github mcp", "tell me about github mcp"],
    patterns: ["github mcp toolkit", "mcp toolkit", "mcp server", "fault-tolerant mcp"],
    handler: () => `### Project Spotlight: GitHub MCP Toolkit

• 🔧 **Overview**: Production-ready Anthropic MCP server for LLM-driven repository automation.
• 🛠️ **Tech Stack**: Python, FastMCP, GitHub API, Ollama, Docker, GitHub Actions.
• 📊 **Key Metrics**:
  - Eliminated **14% blind bulk-mutation rate** via SHA-256 preview-token protocol.
  - Intent execution accuracy: **64% → 100%**.
  - **Zero prompt injections** across 20 adversarial test suites.
• ⚡ **Key Features**:
  1. **Two-Phase Preview Protocol**: SHA-256 tokens require explicit human approval before mutations.
  2. **ABAC Security**: Attribute-Based Access Control for fine-grained permissions.
  3. **Saga Rollback**: Reversible write workflows with complete state rollback.
  4. **Pydantic Validation**: Strict input validation neutralizing prompt injections.
  5. **Circuit Breakers**: Resilient fault tolerance patterns.
• 🐙 **GitHub**: [github.com/kartik-012/github-mcp-toolkit](https://github.com/kartik-012/github-mcp-toolkit)

*Would you like to learn about the SHA-256 preview protocol or ABAC security?*`
  },
  {
    id: "explain_github_mcp",
    exactMatches: ["explain github mcp", "how does github mcp work", "github mcp architecture"],
    patterns: ["github mcp architecture", "explain github mcp", "how github mcp works"],
    handler: () => `### GitHub MCP Toolkit Architecture

1. **MCP Protocol Layer**: FastMCP server exposes tools for repository automation, search, and triage.
2. **Two-Phase Commit**: SHA-256 preview tokens generated for all mutations, requiring explicit human approval.
3. **Security Stack**: ABAC access control + Pydantic validation + circuit breakers.
4. **Saga Rollback**: Every write operation is reversible with complete state recovery.
5. **Adversarial Testing**: 20 test suites covering prompt injections, edge cases, and security boundaries.
6. **CI/CD Integration**: Docker containerization with GitHub Actions for automated testing.`
  },

  // ==================== 10. APEXRAG ====================
  {
    id: "apexrag",
    exactMatches: ["apexrag", "apex rag", "rag evaluation", "tell me about apexrag"],
    patterns: ["apexrag", "apex rag", "rag evaluation system", "retrieval evaluation"],
    handler: () => `### Project Spotlight: ApexRAG

• 📊 **Overview**: Comprehensive RAG retrieval evaluation system.
• 🛠️ **Tech Stack**: Python, FastAPI, ChromaDB, Sentence Transformers, Ollama, scikit-learn.
• 📊 **Key Metrics**:
  - **2,580 documentation chunks** and **100 human-verified Q&A pairs**.
  - Retrieval accuracy: **61% (BM25) → 85% (Cross-Encoder Re-ranking)**.
  - Established **ranking quality** as the primary retrieval bottleneck.
• ⚡ **Key Features**:
  1. **5 Retrieval Strategy Benchmark**: BM25, Dense, Hybrid, Cross-Encoder, Query Router.
  2. **Path-Based Hashing**: Eliminates data contamination and ID collisions.
  3. **Logistic Regression Router**: Dynamic query strategy selection for optimal retrieval.
  4. **Local CPU Infrastructure**: Runs entirely on local hardware without cloud GPU dependency.
• 🐙 **GitHub**: [github.com/kartik-012/apexrag](https://github.com/kartik-012/apexrag)

*Would you like to explore the 5 retrieval strategies or the query router?*`
  },
  {
    id: "explain_apexrag",
    exactMatches: ["explain apexrag", "how does apexrag work", "apexrag architecture"],
    patterns: ["apexrag architecture", "explain apexrag", "how apexrag works"],
    handler: () => `### ApexRAG Architecture & Evaluation

1. **Data Preparation**: 2,580 documentation chunks with path-based hashing to prevent contamination.
2. **Ground Truth**: 100 human-verified Q&A pairs for reliable evaluation.
3. **Strategy Benchmark**:
   - BM25 (Lexical): 61% baseline accuracy.
   - Dense Retrieval: Improved semantic matching.
   - Hybrid (BM25 + Dense): Combined strengths.
   - Cross-Encoder Re-ranking: **85% accuracy** (best performing).
   - Query Router: Dynamic strategy selection.
4. **Bottleneck Analysis**: Ranking quality identified as primary limitation.
5. **Query Router**: Logistic Regression model selects optimal strategy per query.`
  },

  // ==================== 11. ATLAS AI RESUME ====================
  {
    id: "atlas_ai_resume",
    exactMatches: ["atlas ai resume", "this project", "this website", "tell me about atlas ai resume"],
    patterns: ["atlas ai resume", "rag portfolio", "resume assistant", "this website"],
    handler: () => `### Project Spotlight: Atlas AI Resume

• 🌐 **Overview**: RAG-Powered AI Portfolio & Interactive Resume Assistant.
• 🛠️ **Tech Stack**: React 19, TypeScript, Node.js, Express, Gemini API, RAG, Vector Search, TailwindCSS, Vite.
• ⚡ **Key Features**:
  1. **Dual-Layer RAG Engine**: Vector similarity search + LLM streaming + offline heuristic fallbacks.
  2. **Recruiter Telemetry Console**: Real-time analytics tracking visits, queries, and engagement.
  3. **Knowledge Base Admin Studio**: Dynamic chunk ingestion and live retrieval diagnostics.
  4. **Security**: Token-bucket rate limiter and strict grounding rules preventing prompt injection.
• 🐙 **GitHub**: [github.com/kartik-012/Atlas-AI-Resume](https://github.com/kartik-012/Atlas-AI-Resume)

*This is the very project you are interacting with right now!*`
  },

  // ==================== 12. CERTIFICATIONS ====================
  {
    id: "certifications",
    exactMatches: ["certifications", "certificates", "credentials", "licenses", "show all certifications"],
    patterns: ["certifications", "credentials", "show all certifications", "certificates"],
    handler: () => `### Certifications

1. ☁️ **Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate**: Generative AI, ML, OCI AI Services, LLMs.
2. ⚡ **AWS Training & Certification – Fundamentals of Machine Learning and AI**: Core AI algorithms, SageMaker, Bedrock, NLP.
3. 📊 **Tata – GenAI Powered Data Analytics Job Simulation (Forage)**: Generative AI, Data Analytics, Prompt Engineering.

*Would you like details on any specific certification?*`
  },
  {
    id: "oracle_certifications",
    exactMatches: ["oracle certifications", "oracle", "oci"],
    patterns: ["oracle cloud certifications", "oracle certifications", "oci"],
    handler: () => `### Oracle Cloud Certification

• ☁️ **Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate**
• **Skills Validated**: Generative AI, Machine Learning fundamentals, OCI AI Services, Large Language Models.
• **Significance**: Demonstrates mastery of enterprise cloud AI architectures and generative model concepts.`
  },
  {
    id: "aws_certifications",
    exactMatches: ["aws certification", "aws", "aws ml"],
    patterns: ["aws certification", "aws ml", "amazon web services"],
    handler: () => `### AWS Certification

• ⚡ **AWS Training & Certification – Fundamentals of Machine Learning and Artificial Intelligence**
• **Skills Validated**: Machine Learning, Amazon SageMaker, Bedrock, Computer Vision, NLP.
• **Significance**: Validates understanding of AI deployment on AWS cloud infrastructure.`
  },

  // ==================== 13. LEADERSHIP & ACHIEVEMENTS ====================
  {
    id: "leadership",
    exactMatches: ["leadership", "leadership experience", "vice president", "achievements", "hackathons"],
    patterns: ["leadership experience", "achievements", "leadership", "vice president", "hackathons"],
    handler: () => `### Leadership & Achievements

• 🏅 **Vice President – AI & ML Department**: Led departmental initiatives and coordinated technical and academic programs at Jain College of Engineering, Belagavi.
• 🏆 **Hack2Future 2.0 – IIIT Dharwad**: Competed as part of Team Velora in a national-level hackathon.
• 💻 **Code for Innovex – NITTE NMAM IT**: Participated in a 24-hour national-level hackathon.

*Would you like to learn more about Kartik's leadership style or hackathon experiences?*`
  },
  {
    id: "hackathons",
    exactMatches: ["hackathons", "competitions", "hackathon experience"],
    patterns: ["hackathons", "competitions", "hackathon participation"],
    handler: () => `### Hackathon Experience

• 🏆 **Hack2Future 2.0 – IIIT Dharwad**: Competed as part of Team Velora in a national-level hackathon, building AI-powered solutions.
• 💻 **Code for Innovex – NITTE NMAM IT**: Participated in a 24-hour national-level hackathon, prototyping under intense time constraints.

These experiences sharpened Kartik's rapid prototyping, teamwork, and problem-solving under pressure.`
  },

  // ==================== 14. GITHUB & CONTACT ====================
  {
    id: "github",
    exactMatches: ["github", "git", "github link", "github account", "github profile"],
    patterns: ["github profile", "github account", "github link", "github repositories"],
    handler: () => `### GitHub Profile & Repositories

• 🐙 **Profile**: [github.com/kartik-012](https://github.com/kartik-012)

**Key Repositories:**
1. 🌐 **Atlas AI Resume**: [github.com/kartik-012/Atlas-AI-Resume](https://github.com/kartik-012/Atlas-AI-Resume)
2. ⚡ **AIOps RCA**: [github.com/kartik-012/aiops-rca](https://github.com/kartik-012/aiops-rca)
3. 📚 **VersionRAG**: [github.com/kartik-012/versionrag](https://github.com/kartik-012/versionrag)
4. 🔧 **GitHub MCP Toolkit**: [github.com/kartik-012/github-mcp-toolkit](https://github.com/kartik-012/github-mcp-toolkit)
5. 📊 **ApexRAG**: [github.com/kartik-012/apexrag](https://github.com/kartik-012/apexrag)`
  },
  {
    id: "linkedin",
    exactMatches: ["linkedin", "linkedin profile", "linkedin link", "linkedin id", "linkdin id"],
    patterns: ["linkedin profile", "linkedin", "linkedin link", "linkedin id", "linkdin"],
    handler: () => `### LinkedIn Profile

• 💼 **Profile URL**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)
• **Status**: Open to AI Engineering and Generative AI opportunities.`
  },
  {
    id: "email",
    exactMatches: ["email", "email address", "gmail", "e-mail"],
    patterns: ["email address", "email", "gmail"],
    handler: () => `### Email Address

• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• *Actively monitored with prompt responses!*`
  },
  {
    id: "phone_number",
    exactMatches: ["phone number", "phone", "mobile", "contact number", "call"],
    patterns: ["contact number", "phone number", "mobile number", "phone"],
    handler: () => `### Contact Number

• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358)
• Direct calls and WhatsApp messages are active.`
  },
  {
    id: "contact",
    exactMatches: ["contact", "contact details", "reach", "reach out", "how to contact you"],
    patterns: ["contact information", "contact details", "reach out", "contact kartik"],
    handler: () => `### Contact Information

• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358)
• 💼 **LinkedIn**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)
• 🐙 **GitHub**: [github.com/kartik-012](https://github.com/kartik-012)
• 🌐 **Portfolio**: [kartikportfolio-eta.vercel.app](https://kartikportfolio-eta.vercel.app/)
• 📍 **Location**: Belagavi, Karnataka, India`
  },
  {
    id: "schedule_interview",
    exactMatches: ["schedule interview", "schedule an interview", "book interview", "interview availability"],
    patterns: ["schedule an interview", "schedule interview", "book interview", "interview scheduling"],
    handler: () => `### Schedule an Interview

Thank you for your interest! Kartik is actively open to AI Engineering and Generative AI roles.

#### 📅 Availability:
• **Notice Period**: Immediate / Open for immediate joining
• **Work Modes**: Hybrid, On-site, or Remote
• **Timezone**: IST (UTC+5:30) / Flexible

#### 📬 Contact:
• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358)
• 💼 **LinkedIn**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)

*Drop an email with your proposed date/time and Kartik will respond promptly.*`
  },

  // ==================== 15. HR & INTERVIEW QUESTIONS ====================
  {
    id: "why_hire_kartik",
    exactMatches: ["why should we hire you", "why should we hire you?", "why should i hire you", "why hire kartik", "what makes you different", "what value can you bring"],
    patterns: ["why hire", "why should we hire", "reasons to hire", "why you", "right candidate", "different from other candidates"],
    handler: () => `### Why Hire Kartik Raikar? (Top 5 Reasons)

1. ⚡ **Production AI with Measurable Impact**: 0.78s incident resolution (AIOps RCA), 62.5% → 0.0% hallucination (VersionRAG).
2. 📚 **RAG Architecture Expert**: Version-partitioned indexing, 98.4% retrieval precision, 5 strategy benchmarking.
3. 🔧 **LLM Tooling & Safety**: MCP server with 100% intent accuracy, zero prompt injections, reversible workflows.
4. 📊 **Scientific Evaluation Rigor**: Built ApexRAG systematically isolating retrieval bottlenecks across 2,580 chunks.
5. 🏅 **Leadership & Credentials**: VP of AI&ML Dept, 8.50 CGPA, 3 certifications (Oracle, AWS, Tata).

*Would you like to schedule an interview or view his GitHub repositories?*`
  },
  {
    id: "strengths",
    exactMatches: ["strengths", "what are your strengths", "key strengths"],
    patterns: ["strengths", "key strengths", "greatest strengths"],
    handler: () => `### Strengths

1. **Measurable Impact Focus**: Every project delivers quantifiable improvements (0.78s, 0.0% hallucination, 100% accuracy).
2. **End-to-End AI Engineering**: From RAG pipeline design to production deployment with FastAPI, PostgreSQL, and Docker.
3. **Security-First Mindset**: Two-phase preview protocols, ABAC security, prompt injection defense.
4. **Scientific Rigor**: Systematic benchmarking and evaluation (ApexRAG's 5-strategy analysis).`
  },
  {
    id: "weaknesses",
    exactMatches: ["weaknesses", "what are your weaknesses"],
    patterns: ["weaknesses", "weakness"],
    handler: () => `### Weaknesses

• **Perfectionism in Evaluation**: Sometimes spends extra time ensuring comprehensive benchmarking coverage. Addresses this by setting strict evaluation scope timelines.`
  },
  {
    id: "expected_salary",
    exactMatches: ["expected salary", "salary expectations", "compensation"],
    patterns: ["salary expectations", "expected salary", "ctc expectations"],
    handler: () => `### Salary Expectations

Open to competitive industry-standard compensation, with high flexibility for quality learning and growth opportunities.`
  },
  {
    id: "notice_period",
    exactMatches: ["notice period", "availability", "when can you start", "start date"],
    patterns: ["notice period", "immediate availability", "when can you start"],
    handler: () => `### Availability

• **Notice Period**: **Immediate** (0 days).
• **Internships**: Available immediately.
• **Full-Time**: Available for graduating July 2027 cycle or early transition.`
  },
  {
    id: "motivation",
    exactMatches: ["motivation", "what motivates you", "what drives you"],
    patterns: ["motivation", "what motivates you", "what drives you"],
    handler: () => `### Motivation

The excitement of building AI systems that deliver measurable, real-world impact — from eliminating hallucinations to resolving incidents in sub-second latency.`
  },
  {
    id: "hobbies_interests",
    exactMatches: ["hobbies", "interests", "what do you do in free time"],
    patterns: ["hobbies", "interests", "free time"],
    handler: () => `### Hobbies & Personal Interests

• Exploring new AI research papers and implementing RAG architectures.
• Competitive algorithmic coding on LeetCode.
• Contributing to open-source AI tooling and frameworks.`
  },
  {
    id: "coding_profile",
    exactMatches: ["coding profile", "coding profiles", "dsa", "leetcode", "coding skills"],
    patterns: ["coding profiles", "competitive coding", "leetcode profile"],
    handler: () => `### Coding Profiles & DSA

• **LeetCode**: [leetcode.com/u/kartikraikar2005](https://leetcode.com/u/kartikraikar2005)
• **GitHub**: [github.com/kartik-012](https://github.com/kartik-012)
• **HackerRank**: [hackerrank.com/kartikraikar2005](https://hackerrank.com/kartikraikar2005)
• **CodeChef**: [codechef.com/users/kartikraikar](https://codechef.com/users/kartikraikar)`
  },
  {
    id: "portfolio",
    exactMatches: ["portfolio", "portfolio website", "personal website"],
    patterns: ["portfolio website", "portfolio", "online portfolio"],
    handler: () => `### Portfolio Website

• 🌐 **Live Website**: [kartikportfolio-eta.vercel.app](https://kartikportfolio-eta.vercel.app/)
• 🤖 **Atlas AI Resume**: [atlas-ai-resume.vercel.app](https://atlas-ai-resume.vercel.app/)`
  },

  // ==================== 16. SMART RECOMMENDATIONS ====================
  {
    id: "smart_recommendations",
    exactMatches: ["which project best matches an ai engineer role", "which project should i see first", "recommend best project", "compare all projects"],
    patterns: ["best project for ai engineer", "most impressive project", "best project recommendation", "compare projects"],
    handler: () => `### Smart Project Recommendations

• 🥇 **Best for AI Engineering**: **VersionRAG** — Demonstrates advanced RAG architecture with version-partitioned indexing and 98.4% precision.
• ⚡ **Best for Production Impact**: **AIOps Root Cause Correlator** — 0.78s resolution with 100% accuracy in production microservice environments.
• 🔧 **Best for LLM Tooling**: **GitHub MCP Toolkit** — Fault-tolerant MCP server with 100% intent accuracy.
• 📊 **Best for Research Rigor**: **ApexRAG** — Systematic 5-strategy RAG evaluation benchmark.`
  },

  // ==================== 17. RECRUITER ASSISTANT ====================
  {
    id: "recruiter_assistant",
    exactMatches: ["should we hire kartik", "is kartik a good fit", "hiring recommendation"],
    patterns: ["should we hire kartik", "hiring recommendation", "is kartik a good fit"],
    handler: () => `### Executive Recruiter Briefing

• **Recommendation**: **Strong Hire / Immediate Shortlist**
• **Top Strengths**:
  1. Production AI systems with measurable impact (0.78s RCA, 0.0% hallucination, 100% intent accuracy).
  2. Deep RAG expertise across multiple projects (VersionRAG, ApexRAG, Atlas AI Resume).
  3. Security-first LLM tooling (GitHub MCP Toolkit with zero vulnerabilities).
  4. VP of AI&ML Department with hackathon experience.
  5. 8.50 CGPA with 3 industry certifications.
• **Suggested Interview Focus**:
  - Version-partitioned vector indexing in VersionRAG.
  - EWMA anomaly detection in AIOps RCA.
  - SHA-256 preview-token protocol in GitHub MCP Toolkit.`
  },

  // ==================== 18. ADVANCED FEATURES ====================
  {
    id: "advanced_ai_features",
    exactMatches: ["generate cover letter", "generate referral request", "explain my resume for hr", "explain my resume technically"],
    patterns: ["cover letter", "referral request", "explain resume for hr", "explain resume technically"],
    handler: () => `### Advanced AI Assistant Tools

• ✉️ **Cover Letter / Outreach**: Generates tailored pitches highlighting Kartik's projects and metrics.
• 📑 **Verified Evidence**: All responses cite GitHub repositories, live demos, and verified credentials.
• 🎯 **Multi-Level Explanations**: Ask about any project in Beginner, Intermediate, or Expert level!

*How would you like me to tailor your response?*`
  },

  // ==================== 19. SYSTEM DESIGN ====================
  {
    id: "system_design",
    exactMatches: ["architecture", "system design", "system design overview"],
    patterns: ["system design overview", "system design", "architecture principles"],
    handler: () => `### System Architecture Principles

• **Async Backend**: FastAPI for high-concurrency request handling.
• **Vector Search**: PostgreSQL + pgvector with HNSW indexes for sub-millisecond retrieval.
• **Graph Algorithms**: NetworkX for causal DAG traversal in incident correlation.
• **Real-Time Streaming**: WebSockets and SSE for live data visualization.
• **Security**: ABAC, SHA-256 preview tokens, Pydantic validation, circuit breakers.`
  },

  // ==================== 20. WORK EXPERIENCE ====================
  {
    id: "work_experience",
    exactMatches: ["work experience", "experience", "professional experience", "internship"],
    patterns: ["professional experience", "work experience", "internship"],
    handler: () => `### Professional Experience

Demonstrated engineering capability through 5 major production-grade AI projects with measurable impact metrics, 3 verified certifications, and leadership as VP of the AI & ML Department. Open to full-time and internship opportunities.`
  },

  // ==================== 21. LEARNING & FUTURE ====================
  {
    id: "learning_journey",
    exactMatches: ["what are you learning", "current focus", "learning roadmap", "future plans"],
    patterns: ["current learning journey", "current focus", "future learning roadmap"],
    handler: () => `### Current Learning & Future Plans

• **Current Focus**: Advanced RAG architectures, multi-agent systems, and LLM inference optimization.
• **Growing Expertise**: PyTorch deep learning, MLOps pipelines, and enterprise AI deployment.
• **Next Steps**: Expanding into Graph-RAG, multi-modal AI, and distributed inference systems.`
  },

  // ==================== 22. BIGGEST CHALLENGE ====================
  {
    id: "biggest_challenge",
    exactMatches: ["biggest challenge", "greatest challenge", "hardest problem"],
    patterns: ["biggest challenge", "greatest challenge", "hardest technical problem"],
    handler: () => `### Biggest Technical Challenge

**Cross-Version Code Contamination in VersionRAG**: RAG systems were hallucinating deprecated API calls 62.5% of the time. Solved by inventing database-enforced version-partitioned vector indexing that reduced hallucination to 0.0%, while simultaneously boosting retrieval precision from 41.7% to 98.4% (+136%).`
  },
  {
    id: "success_story",
    exactMatches: ["success story", "proudest moment", "greatest success"],
    patterns: ["success story", "proudest accomplishment", "greatest success"],
    handler: () => `### Success Story

Designing the AIOps Root Cause Correlator that resolves cascading microservice alert storms in 0.78 seconds — a task that previously took 1-4 hours of manual tracing — with 100% Top-1 RCA accuracy across all 30 benchmark scenarios.`
  },

  // ==================== 23. LANGUAGES ====================
  {
    id: "spoken_languages",
    exactMatches: ["spoken languages", "what languages do you speak", "language proficiency"],
    patterns: ["spoken languages", "language proficiency", "languages spoken"],
    handler: () => `### Language Proficiency

• 🇬🇧 **English**: Fluent
• 🇮🇳 **Kannada**: Native
• 🇮🇳 **Hindi**: Conversational`
  }
];

export function matchChatbotIntent(rawQuery: string): string | null {
  if (!rawQuery || rawQuery.trim().length === 0) return null;
  
  const cleanQ = rawQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  const qWords = cleanQ.split(" ").filter(w => w.length > 0 && !STOP_WORDS.has(w));
  
  // Pass 1: Exact Match (Highest Priority)
  for (const rule of INTENT_RULES) {
    if (rule.exactMatches) {
      for (const exact of rule.exactMatches) {
        const cleanExact = exact
          .toLowerCase()
          .replace(/[^\w\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (cleanQ === cleanExact) {
          return rule.handler();
        }
      }
    }
  }

  // Pass 2: Substring Pattern Matching
  for (const rule of INTENT_RULES) {
    for (const pat of rule.patterns) {
      const cleanPat = pat
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (cleanQ.includes(cleanPat) || cleanPat.includes(cleanQ)) {
        return rule.handler();
      }
    }
  }

  // Pass 3: Token-Level Fuzzy Matching
  let bestRule: IntentRule | null = null;
  let highestScore = 0;

  for (const rule of INTENT_RULES) {
    for (const pat of rule.patterns) {
      const cleanPat = pat
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const patWords = cleanPat.split(" ").filter(w => w.length > 0 && !STOP_WORDS.has(w));
      
      if (patWords.length === 0) continue;

      let matchedTokens = 0;
      for (const qw of qWords) {
        if (patWords.some(pw => tokenMatches(qw, pw))) {
          matchedTokens++;
        }
      }

      const score = matchedTokens / Math.max(qWords.length, patWords.length);
      if (score > highestScore && score >= 0.5) {
        highestScore = score;
        bestRule = rule;
      }
    }
  }

  if (bestRule) {
    return bestRule.handler();
  }

  return null;
}
