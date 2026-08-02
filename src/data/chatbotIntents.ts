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

**Kartik Raikar** is an **AI & ML Systems Engineer** and Full-Stack Developer currently pursuing his Bachelor of Engineering (B.E.) in Artificial Intelligence & Machine Learning at **Jain College of Engineering, Belagavi** (VTU, **8.5 CGPA**, 2023–2027).

**Core Specializations:**
• 🧠 **AI Memory & Systems**: Architect of **AtlasOS** (3-tier memory engine + NLI contradiction detection).
• 🛠️ **Deep Learning from First Principles**: Hand-coded **NumPyGPT** Transformer with zero ML frameworks.
• 🚀 **Enterprise LLM Reliability**: Built **RagaAI Catalyst** scoring 99.4% faithfulness with automated guardrails.
• ⚡ **Production Full-Stack**: FastAPI (async), React 19, Next.js 14, Qdrant Vector DB, PostgreSQL (RLS), Redis 7.
• 📜 **13 Industry Certifications**: Triple-certified Oracle Cloud, AWS ML, Microsoft Azure, Cisco, Deloitte.

*Would you like to explore his projects, review his resume, or view his contact details?*`
  },
  {
    id: "tell_me_about_yourself",
    exactMatches: ["tell me about yourself", "tell me about yourself.", "introduce yourself in two minutes", "introduce yourself in 2 minutes", "walk me through your background"],
    patterns: ["tell me about yourself", "tell me about your background", "walk through resume", "two minutes"],
    handler: () => `### Self Introduction (2 min)

**"I'm Kartik Raikar, an AI Systems Engineer who loves bridging the gap between theoretical deep learning and high-throughput production infrastructure."**

• **Where I Started**: Pursuing my B.E. in AI & ML (8.5 CGPA), I focused early on understanding deep learning at the mathematical layer rather than just calling high-level APIs.
• **What I've Built**:
  1. **NumPyGPT**: Hand-coded attention, layer normalization, softmax, and backpropagation in raw Python.
  2. **AtlasOS**: Developed a multi-tenant AI Memory OS that resolves contradictory facts in real-time with RoBERTa NLI.
  3. **Debate Arena**: Created a 3D adversarial multi-LLM courtroom with bias auditing using React Three Fiber.
  4. **RagaAI Catalyst**: Engineered enterprise evaluation pipelines achieving 99.4% faithfulness.
• **Where I'm Headed**: Actively seeking AI/ML Engineering and Full-Stack AI roles where I can architect scalable agent infrastructure and production-grade LLM applications.

*Would you like to drill into any specific project or discuss interview availability?*`
  },
  {
    id: "introduce_yourself",
    exactMatches: ["introduce yourself", "self introduction", "intro", "professional introduction"],
    patterns: ["introduce yourself", "give an introduction", "professional introduction"],
    handler: () => `### Professional Introduction

Hello! I am **Atlas AI**, representing **Kartik Raikar** — an aspiring AI & ML Systems Engineer with deep expertise in autonomous agents, hierarchical memory architectures, and production full-stack systems.

**Key Highlights:**
1. **Academic Excellence**: B.E. in AI & ML with an **8.5 / 10.0 CGPA** at Jain College of Engineering (VTU).
2. **Systems-First AI Rigor**: Built a complete GPT Transformer from scratch in pure NumPy without PyTorch.
3. **Autonomous Infrastructure**: Architected AtlasOS to solve memory fragmentation and semantic contradictions in multi-agent systems.
4. **Verified Industry Skills**: 13 certifications across Oracle (OCI GenAI Pro), AWS, Azure, Cisco, and Deloitte.

*How can I assist your evaluation today? Feel free to ask about specific projects, technical depth, or schedule an interview!*`
  },
  {
    id: "introduce_30_seconds",
    exactMatches: ["introduce yourself in 30 seconds", "elevator pitch", "quick pitch", "pitch", "quick introduction"],
    patterns: ["introduce yourself in 30 seconds", "30 seconds", "elevator pitch", "quick pitch"],
    handler: () => `### 30 Second Elevator Pitch

**"I'm Kartik Raikar, an AI Systems Engineer with an 8.5 CGPA in AI & ML and 13 cloud/AI certifications.**

I've engineered **AtlasOS** (a multi-tenant AI Memory OS with real-time NLI contradiction detection) and hand-coded **NumPyGPT** (a full GPT Transformer from scratch in pure NumPy). I specialize in FastAPI async backends, vector databases (Qdrant), and production LLM guardrails. 

I am ready to ship high-impact AI infrastructure for your engineering team!"`
  },
  {
    id: "introduce_one_minute",
    exactMatches: ["introduce yourself in one minute", "introduce yourself in 1 minute", "one minute introduction", "1 minute pitch"],
    patterns: ["introduce yourself in one minute", "one minute introduction", "1 minute pitch"],
    handler: () => `### 1-Minute Professional Pitch

**"Hi, I'm Kartik Raikar, an AI & ML Systems Engineer pursuing my B.E. at Jain College of Engineering, Belagavi (8.5 CGPA).**

My engineering approach centers around **first-principles mastery**:
• Rather than relying solely on black-box libraries, I hand-coded **NumPyGPT** — a full Transformer with self-attention and backpropagation from scratch in raw Python.
• In production AI systems, I architected **AtlasOS**, a 3-tier memory kernel for autonomous agents with local RoBERTa contradiction filtering, and **RagaAI Catalyst**, an evaluation suite scoring 99.4% faithfulness.
• My stack spans FastAPI, React 19, PostgreSQL (RLS), Redis 7, and Qdrant Vector DB, backed by **13 certifications** including Oracle OCI GenAI Professional and AWS ML.

I am eager to bring this passion for rigorous, low-latency AI engineering to your team."`
  },
  {
    id: "professional_summary",
    exactMatches: ["professional summary", "summary of profile", "profile summary", "summarize profile"],
    patterns: ["professional summary", "profile summary"],
    handler: () => `### Professional Summary

AI & ML Systems Engineer with a proven foundation in **first-principles deep learning** and **enterprise full-stack engineering**. Experienced in architecting low-latency agent memory systems, vector search pipelines, and automated LLM guardrails. 

Proven ability to deliver complex architectures from scratch—including writing complete Transformer models without external libraries and designing multi-tenant databases with strict Row-Level Security (RLS). Holds **13 industry certifications** and maintains an **8.5 CGPA** in AI & Machine Learning.`
  },
  {
    id: "executive_summary",
    exactMatches: ["executive summary", "recruiter summary", "executive briefing"],
    patterns: ["executive summary", "executive briefing", "c-level summary"],
    handler: () => `### Executive Summary

• **Candidate**: Kartik Raikar | AI & ML Systems Engineer
• **Status**: Active B.E. Student (2023–2027) | **8.5 / 10.0 CGPA** | Jain College of Engineering (VTU)
• **Key Differentiator**: Bridges theoretical deep learning (NumPyGPT from scratch) with enterprise systems architecture (AtlasOS multi-tenant memory with RoBERTa NLI).
• **Verified Credentials**: 13 Certifications (Oracle Triple Certified, AWS ML, Microsoft Azure, Cisco, Deloitte).
• **Readiness**: Immediate availability for internships and high-growth engineering roles.`
  },
  {
    id: "resume_summary",
    exactMatches: ["resume summary", "summarize resume", "summary of resume", "show resume"],
    patterns: ["resume summary", "summarize resume", "summary of resume"],
    handler: () => `### Resume Summary

• **Education**: B.E. in AI & ML (2023–2027) from Jain College of Engineering, Belagavi (VTU) — **8.5 CGPA**.
• **Core Projects**:
  1. **Atlas AI Resume**: Interactive RAG resume assistant with Recruiter Telemetry Console.
  2. **AtlasOS**: Multi-tenant AI Memory OS with RoBERTa-large-MNLI contradiction detection.
  3. **Debate Arena**: Multi-LLM 3D debate courtroom with judicial bias auditing.
  4. **NumPyGPT**: GPT-style Transformer coded 100% from first principles with zero ML frameworks.
  5. **RagaAI Catalyst**: Enterprise evaluation suite scoring 99.4% faithfulness with guardrails.
• **Skills**: Python, TypeScript, FastAPI, React 19, Next.js 14, Qdrant, PostgreSQL, Redis, Docker.
• **Credentials**: 13 Certifications (Oracle, AWS, Azure, Cisco, Deloitte, Tata, IBM).

*You can download the full PDF resume directly from the top navigation bar!*`
  },
  {
    id: "full_profile",
    exactMatches: ["full profile", "complete profile", "entire profile"],
    patterns: ["complete professional profile", "full profile", "complete background"],
    handler: () => `### Complete Professional Profile

• **Full Name**: Kartik Raikar
• **Role**: AI & ML Systems Engineer / Full-Stack Developer
• **Location**: Belagavi, Karnataka, India (Open to Relocation & Remote)
• **Education**: B.E. in AI & ML (2023–2027), Jain College of Engineering (VTU) — **8.5 CGPA**
• **Core Specialties**: Autonomous Agent Memory, First-Principles Deep Learning, Vector Search (Qdrant), FastAPI Async Microservices, 3D Web Graphics (Three.js/R3F).
• **Certifications**: 13 Total (Oracle OCI GenAI Pro, AWS ML, Azure Cloud, Cisco Cyber, Deloitte).
• **GitHub**: [github.com/kartik-012](https://github.com/kartik-012) & [github.com/kartikraikar2005](https://github.com/kartikraikar2005)`
  },
  {
    id: "background",
    exactMatches: ["background", "career background", "tell me your background"],
    patterns: ["career background", "engineering background", "academic background"],
    handler: () => `### Career Background

Kartik Raikar began his engineering journey driven by a curiosity for how artificial neural networks represent human knowledge. 

• **Foundational Phase**: Focused on linear algebra, calculus, and matrix computations, culminating in coding the complete **NumPyGPT** Transformer architecture by hand.
• **Systems & Infrastructure Phase**: Expanded into distributed backend systems, building **AtlasOS** to manage persistent agent state across Redis, PostgreSQL RLS, and Qdrant.
• **Applied AI & Observability Phase**: Engineered **RagaAI Catalyst** for production LLM guardrails and **Atlas AI Resume** for interactive recruiter engagement.

*Would you like details on how this background aligns with a specific role?*`
  },
  {
    id: "career_objective",
    exactMatches: ["career objective", "objective", "professional objective"],
    patterns: ["career objective", "job objective", "target role"],
    handler: () => `### Career Objective

> *"To secure a challenging role as an **AI/ML Systems Engineer** or **Full-Stack AI Developer** where I can leverage my deep foundation in Transformer architectures, vector retrieval pipelines, and distributed backend infrastructure to build high-impact, fault-tolerant AI applications."*`
  },
  {
    id: "career_goals",
    exactMatches: ["career goals", "career vision", "future aspirations", "future goals", "goals"],
    patterns: ["career goals", "career vision", "future goals"],
    handler: () => `### Career Vision

• **Short-Term (1–2 Years)**: Ship scalable, production-grade AI infrastructure, master distributed inference optimization (vLLM, TensorRT-LLM), and contribute to open-source agent standards.
• **Mid-Term (3–5 Years)**: Lead architecture design for autonomous agent frameworks, multi-modal memory systems, and enterprise LLM security guardrails.
• **Long-Term**: Shape the future of contextual machine cognition, driving systems where AI agents collaborate transparently with human teams.`
  },
  {
    id: "long_term_goals",
    exactMatches: ["long term goals", "long-term goals", "long term vision"],
    patterns: ["long term goals", "long term career", "long-term objectives"],
    handler: () => `### Long-Term Career Vision

• **Technical Leadership**: Become a Principal AI Systems Architect driving next-generation foundation model infrastructure and low-latency reasoning engines.
• **Open-Source Impact**: Build and maintain widely adopted open-source frameworks for agent memory, safety guardrails, and deterministic evaluation.
• **Industry Innovation**: Advance zero-hallucination RAG architectures and enterprise agent governance standards.`
  },
  {
    id: "short_term_goals",
    exactMatches: ["short term goals", "short-term goals", "short term objectives"],
    patterns: ["short term goals", "immediate goals", "short-term objectives"],
    handler: () => `### Short-Term Objectives

1. **High-Impact Engineering Role**: Join an innovative AI team where I can contribute to production RAG pipelines, agent workflows, and scalable FastAPI/Python backends.
2. **Inference Optimization**: Deepen expertise in quantization (AWQ, GPTQ), vLLM deployment, and TensorRT-LLM acceleration.
3. **Continuous Mastery**: Maintain 8.5+ CGPA while expanding open-source contributions in agentic memory.`
  },
  {
    id: "where_are_you_from",
    exactMatches: ["where are you from?", "where are you from", "hometown", "native"],
    patterns: ["where are you from", "hometown", "native place", "origin"],
    handler: () => `### Hometown & Background

• **Hometown**: **Belagavi, Karnataka, India**
• **Current Base**: Belagavi (pursuing B.E. at Jain College of Engineering, VTU)
• **Language Proficiency**: English (Professional), Kannada, Hindi
• **Work Readiness**: Ready and eager to relocate to tech hubs like **Bengaluru, Hyderabad, Pune, Mumbai, Delhi-NCR**, or work **Remotely** across international timezones.`
  },
  {
    id: "where_are_you_based",
    exactMatches: ["where are you based?", "where are you based", "location", "current location", "preferred work location", "work preferences"],
    patterns: ["where are you based", "location", "work preferences", "preferred work location"],
    handler: () => `### Location & Work Preferences

• 📍 **Current Location**: Belagavi, Karnataka, India
• 🌍 **Work Mode**: Open to **Remote**, **Hybrid**, and **Onsite** opportunities worldwide.
• 🚀 **Relocation**: 100% willing to relocate immediately for full-time or internship positions (Bengaluru, Hyderabad, Pune, Mumbai, Delhi-NCR, International).
• ⚡ **Notice Period**: Immediate availability.

*Feel free to reach out directly at **kartikraikar2005@gmail.com** or **+91 8660910358**.*`
  },

  // ==================== 2. EDUCATION & ACADEMICS ====================
  {
    id: "education",
    exactMatches: ["education", "education timeline", "academic journey"],
    patterns: ["education timeline", "education details", "academic journey"],
    handler: () => `### Education Timeline

• **2023 – 2027 (Expected)**:
  - **Degree**: Bachelor of Engineering (B.E.) in **Artificial Intelligence & Machine Learning**
  - **Institution**: **Jain College of Engineering, Belagavi**
  - **Affiliation**: **Visvesvaraya Technological University (VTU)**
  - **Academic Standing**: **8.5 / 10.0 CGPA**
• **Core Coursework**:
  - Data Structures & Algorithms, Operating Systems, Database Management Systems (DBMS), Computer Networks
  - Deep Learning, Natural Language Processing (NLP), Machine Learning, Discrete Mathematics`
  },
  {
    id: "education_details",
    exactMatches: ["education details", "academic background", "studies"],
    patterns: ["education details", "education background", "academic background"],
    handler: () => `### Education & Academic Background

• 🎓 **Degree**: B.E. in Artificial Intelligence & Machine Learning (2023–2027)
• 🏫 **College**: Jain College of Engineering, Belagavi (VTU Affiliated, AICTE Approved)
• 📊 **CGPA**: **8.5 / 10.0**
• 🌟 **Key Strengths**: Algorithms, Mathematical Modeling, AI Systems Design, Vector Search Systems

*Would you like to see his semester-wise performance or academic achievements?*`
  },
  {
    id: "college_details",
    exactMatches: ["college", "college details", "college name", "which college", "university"],
    patterns: ["college details", "college name", "university name", "jain college"],
    handler: () => `### College Information

• **Institution**: **Jain College of Engineering (JCE), Belagavi**
• **University**: **Visvesvaraya Technological University (VTU)**
• **Location**: Belagavi, Karnataka, India
• **Department**: Department of Artificial Intelligence & Machine Learning
• **Accreditation**: Approved by AICTE, New Delhi & Affiliated to VTU`
  },
  {
    id: "branch",
    exactMatches: ["branch", "which branch", "specialization", "major"],
    patterns: ["which branch", "specialization", "branch of engineering", "major"],
    handler: () => `### Computer Science (AI & ML)

• **Major**: Artificial Intelligence & Machine Learning (AIML)
• **Focus Areas**:
  - Neural Network Architectures & Mathematical Foundations
  - Natural Language Processing & Large Language Models
  - Vector Databases, Knowledge Graphs & RAG Architectures
  - High-Concurrency Backend Systems with FastAPI & Redis`
  },
  {
    id: "degree",
    exactMatches: ["degree", "which degree", "qualification"],
    patterns: ["which degree", "bachelor degree", "undergraduate degree"],
    handler: () => `### Bachelor's Degree

• **Degree**: Bachelor of Engineering (B.E.)
• **Field**: Artificial Intelligence & Machine Learning
• **Duration**: 4-Year Full-Time Undergraduate Program (2023 – 2027)
• **Current Status**: Active Student, 8.5 CGPA`
  },
  {
    id: "graduation_year",
    exactMatches: ["graduation year", "when will you graduate", "passing year"],
    patterns: ["graduation year", "year of passing", "graduating year"],
    handler: () => `### Graduation Timeline

• **Graduation Year**: **2027**
• **Availability for Internships**: Immediate availability for Full-Time / Remote internships.
• **Availability for Full-Time Roles**: Open for early transition upon graduation.`
  },
  {
    id: "cgpa",
    exactMatches: ["cgpa", "gpa", "marks", "score", "percentage", "semester cgpa"],
    patterns: ["cgpa", "overall cgpa", "grade point average", "academic score"],
    handler: () => `### CGPA & Academic Performance

• **Cumulative GPA (CGPA)**: **8.5 / 10.0**
• **Performance Summary**: Consistently maintained top-tier academic standing across rigorous engineering, mathematics, and computer science subjects.`
  },
  {
    id: "semester_wise_cgpa",
    exactMatches: ["semester wise cgpa", "sem marks", "semester marks"],
    patterns: ["semester wise cgpa", "semester marks", "sem wise"],
    handler: () => `### Semester-wise Academic Performance

• **Overall Cumulative CGPA**: **8.5 / 10.0**
• **Core Subject Scores**:
  - Advanced Mathematics & Linear Algebra: **A+**
  - Data Structures & Algorithms (DSA): **A+**
  - Deep Learning & Neural Architectures: **A+**
  - Database Management Systems (DBMS): **A+**`
  },
  {
    id: "academic_achievements",
    exactMatches: ["academic achievements", "academic awards", "college achievements"],
    patterns: ["academic achievements", "scholastic achievements", "college awards"],
    handler: () => `### Academic Achievements

• 🌟 Maintained consistent **8.5 CGPA** in B.E. AI & ML.
• 🏆 Built and presented **NumPyGPT** as a first-principles deep learning showcase.
• 📜 Earned **13 Industry Certifications** (Oracle, AWS, Microsoft, Cisco, Deloitte) alongside full-time degree coursework.`
  },
  {
    id: "subjects_studied",
    exactMatches: ["subjects studied", "subjects", "courses", "coursework"],
    patterns: ["subjects studied", "coursework", "academic subjects"],
    handler: () => `### Core Subjects & Coursework

• **AI & Data Science**: Deep Learning, Natural Language Processing (NLP), Machine Learning, Discrete Mathematics, Probability & Statistics.
• **Core Computer Science**: Data Structures & Algorithms (DSA), Operating Systems, Database Management Systems (DBMS), Computer Networks, Object-Oriented Programming (OOP).`
  },

  // ==================== 3. RESUME & CV ====================
  {
    id: "resume",
    exactMatches: ["resume", "cv", "resume overview", "curriculum vitae", "explain resume"],
    patterns: ["resume overview", "look at resume", "show resume"],
    handler: () => `### Resume Overview

• **Live Viewer**: Currently embedded directly in this interactive portal screen.
• **Key Sections**:
  1. **Candidate Profile**: AI & ML Systems Engineer (8.5 CGPA, Belagavi).
  2. **5 Key Projects**: Atlas AI Resume, AtlasOS, Debate Arena, NumPyGPT, RagaAI Catalyst.
  3. **Technical Stack**: Python, TypeScript, FastAPI, React 19, Next.js 14, Qdrant, PostgreSQL, Redis.
  4. **13 Certifications**: Oracle (3x), AWS, Azure, Cisco, Deloitte, Tata, IBM.

*Click "Download Resume" in the header to get the official PDF copy.*`
  },
  {
    id: "latest_resume",
    exactMatches: ["latest resume", "updated resume", "current resume"],
    patterns: ["latest resume", "updated resume version", "current resume"],
    handler: () => `### Latest Resume Version

• **Current Version**: Updated for 2025/2026 Recruitment Cycle.
• **Includes**: Complete 5 project deep-dives, latest Oracle & AWS certifications, verified GitHub repositories, and direct recruiter contact channels.`
  },
  {
    id: "resume_highlights",
    exactMatches: ["resume highlights", "highlights", "key resume points"],
    patterns: ["resume highlights", "top highlights", "standout points"],
    handler: () => `### Resume Highlights

1. 🐍 **Hand-coded Transformer from scratch** (NumPyGPT) without PyTorch or TensorFlow.
2. 🧠 **Multi-tenant AI Memory OS** (AtlasOS) with RoBERTa NLI contradiction detection.
3. ⚖️ **3D Multi-LLM Debate Platform** (Debate Arena) with React Three Fiber.
4. 📜 **13 Verified Industry Certifications** including Oracle OCI GenAI Professional.
5. 🎓 **8.5 CGPA** in B.E. AI & ML from Jain College of Engineering (VTU).`
  },
  {
    id: "download_resume",
    exactMatches: ["download resume", "download cv", "get pdf", "pdf resume"],
    patterns: ["download resume", "download pdf", "get resume pdf"],
    handler: () => `### Resume Download

• 📥 **Direct Download**: Click the glowing **"Download Resume"** button in the top navigation bar.
• 📄 **File Format**: Standard ATS-optimized PDF format with verified clickable links.`
  },
  {
    id: "resume_timeline",
    exactMatches: ["resume timeline", "career timeline", "timeline"],
    patterns: ["resume timeline", "career timeline", "milestones timeline"],
    handler: () => `### Career & Resume Timeline

• **2023**: Commenced B.E. in AI & ML at Jain College of Engineering (VTU).
• **2024**: Hand-built **NumPyGPT** from scratch; earned Oracle OCI AI Foundations & Foundations certifications.
• **2025**: Architected **AtlasOS** & **Debate Arena**; earned Oracle OCI GenAI Professional & AWS Machine Learning certifications.
• **2026**: Built **RagaAI Catalyst** & **Atlas AI Resume**; actively seeking AI/ML engineering roles.`
  },

  // ==================== 4. TECHNICAL SKILLS & STACK ====================
  {
    id: "technical_skills",
    exactMatches: ["technical skills", "skills", "tech skills", "skill set", "technology stack"],
    patterns: ["technical stack & skills", "technical skills", "skillset", "skills summary", "technology stack"],
    handler: () => `### Technical Stack & Skills

• **Languages**: Python (95%), TypeScript (90%), JavaScript (90%), Java (80%), C++ (75%), SQL (85%)
• **AI & ML**: NumPy, Scikit-learn, LangChain, LlamaIndex, Sentence Transformers, RoBERTa-large-MNLI, Google Gemini API, OpenAI API, Vector Embeddings, RAG
• **Frontend & 3D**: React 19, Next.js 14, React Three Fiber (R3F), Three.js, TailwindCSS, Vite, Framer Motion
• **Backend & Distributed**: FastAPI (async), Node.js, Express, Celery, Redis 7, WebSockets, Server-Sent Events (SSE)
• **Databases & Vector**: PostgreSQL 15 (Row-Level Security), Qdrant Vector DB, Redis 7, MongoDB, SQLite
• **DevOps & Tools**: Docker, Git/GitHub, Postman, Power BI, Linux/Bash, Vercel`
  },
  {
    id: "programming_languages",
    exactMatches: ["programming languages", "languages", "coding languages"],
    patterns: ["programming languages", "languages you know", "coding languages"],
    handler: () => `### Programming Languages

• 🐍 **Python**: 95% proficiency — Primary language for AI/ML, FastAPI, deep learning, data processing, and scripting.
• 🟦 **TypeScript**: 90% proficiency — Strict type-safe full-stack web development with React 19, Next.js 14, and Node.js.
• 🌐 **JavaScript (ES6+)**: 90% proficiency — Asynchronous programming, DOM, WebSockets, SSE streaming.
• ☕ **Java**: 80% proficiency — Object-Oriented Programming (OOP), Data Structures & Algorithms.
• ⚙️ **C++**: 75% proficiency — Algorithmic problem-solving, memory management fundamentals.
• 🗄️ **SQL**: 85% proficiency — Complex joins, CTEs, PostgreSQL Row-Level Security (RLS) policies.`
  },
  {
    id: "frontend_skills",
    exactMatches: ["frontend skills", "frontend technologies", "frontend stack"],
    patterns: ["frontend technologies", "frontend skills", "ui skills"],
    handler: () => `### Frontend Technologies

• ⚛️ **React 19 & Next.js 14**: Server components, hooks, suspense, client state management, responsive UI.
• 🧊 **Three.js & React Three Fiber (R3F)**: Interactive 3D graphics rendering, shaders, dynamic scene lighting (Debate Arena).
• 🎨 **TailwindCSS & Framer Motion**: Glassmorphism, micro-animations, dark/light theme systems, ATS design.
• ⚡ **Vite & Webpack**: High-speed HMR, production bundling, asset optimization.`
  },
  {
    id: "backend_skills",
    exactMatches: ["backend skills", "backend technologies", "backend stack"],
    patterns: ["backend technologies", "backend skills", "server side skills"],
    handler: () => `### Backend Technologies

• ⚡ **FastAPI (Python 3.11)**: Asynchronous request handling, Pydantic schemas, dependency injection, sub-45ms responses.
• 🟢 **Node.js & Express**: High-throughput REST APIs, SSE token streaming, reverse proxies.
• 🔄 **Celery & Redis 7**: Distributed asynchronous task queues for heavy ML embedding generation and evaluation.
• 🔌 **WebSockets & SSE**: Real-time bidirectional communication and low-latency token streaming.`
  },
  {
    id: "full_stack_skills",
    exactMatches: ["full stack skills", "full stack development", "full stack"],
    patterns: ["full stack development skills", "full stack skills", "end to end development"],
    handler: () => `### Full Stack Development Skills

Kartik designs complete end-to-end architectures:
• **UI/UX Layer**: High-performance React 19 + TailwindCSS with accessible, responsive layouts.
• **API & Business Logic Layer**: FastAPI async services with strict request validation and auth middleware.
• **Data & Persistence Layer**: Multi-tenant PostgreSQL with Row-Level Security (RLS) paired with Qdrant vector search.
• **Caching & Queue Layer**: Redis 7 caching and Celery workers for sub-second user responsiveness.`
  },
  {
    id: "ai_skills",
    exactMatches: ["ai skills", "artificial intelligence skills", "ai stack"],
    patterns: ["artificial intelligence skills", "ai skills", "ai capabilities"],
    handler: () => `### Artificial Intelligence Skills

• 🤖 **Autonomous Agents**: Hierarchical memory management, tool execution, multi-agent debate and consensus.
• 🔍 **Retrieval-Augmented Generation (RAG)**: Dense vector retrieval, hybrid search, low-temperature grounded generation.
• 🛡️ **LLM Evaluation & Guardrails**: Faithfulness scoring, toxicity filters, automated red-teaming (RagaAI Catalyst).
• 🧠 **NLI Contradiction Analysis**: Contradiction and entailment classification using fine-tuned RoBERTa-large models.`
  },
  {
    id: "machine_learning_skills",
    exactMatches: ["machine learning skills", "ml skills", "ml stack"],
    patterns: ["machine learning skills", "ml algorithms", "ml capabilities"],
    handler: () => `### Machine Learning Skills

• **Algorithms**: Supervised & Unsupervised Learning, Linear/Logistic Regression, Decision Trees, Random Forests, SVM, k-Means, PCA.
• **Libraries**: NumPy, Pandas, Scikit-learn, SciPy.
• **Techniques**: Feature Engineering, Cross-Validation, Hyperparameter Tuning, Precision/Recall Optimization.`
  },
  {
    id: "deep_learning_skills",
    exactMatches: ["deep learning skills", "dl skills", "deep learning"],
    patterns: ["deep learning skills", "neural networks", "deep learning capabilities"],
    handler: () => `### Deep Learning Skills

• **Architectures**: Multi-Head Self-Attention, Feed-Forward Networks, Layer Normalization, Residual Connections, Softmax.
• **First-Principles Implementation**: Hand-coded Transformer architecture in pure NumPy (**NumPyGPT**) including forward and backward propagation passes.
• **Models**: RoBERTa, BERT, GPT variants, Gemini, Claude, Sentence Transformers.`
  },
  {
    id: "llm_skills",
    exactMatches: ["llm skills", "large language model skills", "llm stack"],
    patterns: ["large language model skills", "llm skills", "large language models"],
    handler: () => `### Large Language Model Skills

• **Model Integration**: Google Gemini 2.5 Flash, OpenAI GPT-4o, Anthropic Claude 3.5, LiteLLM unified gateway.
• **Prompt Engineering**: Chain-of-Thought (CoT), Few-Shot Prompting, Structured Output generation (JSON mode).
• **Evaluation & Guardrails**: ROUGE, BLEU, Cross-Encoder Faithfulness scoring, prompt injection defense.`
  },
  {
    id: "rag_skills",
    exactMatches: ["rag skills", "retrieval augmented generation skills", "rag stack"],
    patterns: ["retrieval-augmented generation skills", "rag skills", "rag pipeline"],
    handler: () => `### Retrieval-Augmented Generation Skills

• **Retrieval Pipelines**: Dense vector embeddings, cosine similarity search, chunking strategies (semantic, sliding window).
• **Vector Databases**: Qdrant Vector DB, semantic distance thresholds, metadata filtering.
• **Grounding & Guardrails**: Low-temperature response synthesis, automated citation generation, hallucination mitigation.`
  },
  {
    id: "cloud_skills",
    exactMatches: ["cloud skills", "cloud technologies", "cloud stack"],
    patterns: ["cloud technologies", "cloud skills", "cloud platforms"],
    handler: () => `### Cloud Technologies

• ☁️ **Oracle Cloud Infrastructure (OCI)**: Triple certified (OCI GenAI Professional, AI Foundations, Foundations).
• ⚡ **Amazon Web Services (AWS)**: AWS ML & AI certified (EC2, S3, IAM, Lambda basics).
• 🔷 **Microsoft Azure**: Azure Cloud Concepts certified.
• 🚀 **Deployment**: Vercel, Docker containers, reverse proxies.`
  },
  {
    id: "devops_skills",
    exactMatches: ["devops skills", "devops", "ci cd", "ci/cd"],
    patterns: ["devops skills", "devops tools", "containerization"],
    handler: () => `### DevOps & Infrastructure Skills

• 🐳 **Docker**: Multi-stage container builds, Docker Compose orchestration for microservices.
• 🐙 **Git & GitHub**: Branching workflows, PR reviews, CI/CD automation with GitHub Actions.
• 🐧 **Linux / Bash**: Server administration, process management, shell scripting.`
  },
  {
    id: "database_skills",
    exactMatches: ["database skills", "database technologies", "databases"],
    patterns: ["database technologies", "database skills", "db stack"],
    handler: () => `### Database Technologies

• 🐘 **PostgreSQL 15**: Advanced schema design, CTEs, Row-Level Security (RLS) for multi-tenant isolation.
• 🎯 **Qdrant Vector DB**: High-dimensional vector indexing, payload filtering, semantic similarity search.
• ⚡ **Redis 7**: In-memory caching, working state TTL, pub/sub, message queuing.
• 🍃 **MongoDB & SQLite**: Document storage, async local databases.`
  },
  {
    id: "frameworks",
    exactMatches: ["frameworks", "frameworks and libraries", "libraries"],
    patterns: ["frameworks & libraries", "frameworks", "libraries used"],
    handler: () => `### Frameworks & Libraries

• **AI/ML**: LangChain, LlamaIndex, Sentence Transformers, LiteLLM, Scikit-learn, NumPy.
• **Backend**: FastAPI, Express.js, Celery, Pydantic.
• **Frontend**: React 19, Next.js 14, React Three Fiber, Three.js, TailwindCSS, Framer Motion.`
  },
  {
    id: "tools_you_use",
    exactMatches: ["tools you use", "development tools", "tools", "developer tools"],
    patterns: ["development tools", "tools you use", "dev tools"],
    handler: () => `### Development Tools

• **IDE & Editors**: VS Code, Cursor, Antigravity AI Studio
• **API Testing**: Postman, Swagger / OpenAPI UI
• **Analytics & BI**: Power BI, Custom Telemetry Dashboards
• **Version Control**: Git, GitHub CLI`
  },
  {
    id: "operating_systems",
    exactMatches: ["operating systems", "os skills", "which os"],
    patterns: ["operating systems", "os platforms", "linux experience"],
    handler: () => `### Operating Systems

• 🐧 **Linux (Ubuntu / Debian)**: Production deployments, bash scripting, service management (systemd).
• 🪟 **Windows**: Primary development environment with PowerShell and WSL2.
• 🍎 **macOS**: Cross-platform POSIX development compatibility.`
  },
  {
    id: "software_you_know",
    exactMatches: ["software you know", "software", "platforms"],
    patterns: ["software & platforms", "software you know", "platforms used"],
    handler: () => `### Software & Engineering Platforms

• **Cloud**: Oracle Cloud Infrastructure (OCI), AWS Console, Microsoft Azure Portal, Vercel
• **Database Tools**: pgAdmin, Qdrant Cloud UI, Redis Insight, MongoDB Compass
• **Productivity & Analytics**: Power BI, GitKraken, Postman, Figma`
  },
  {
    id: "strongest_skill",
    exactMatches: ["strongest skill", "strongest skills", "top skill", "what is your best skill"],
    patterns: ["strongest skill", "strongest skills", "top technical strength"],
    handler: () => `### Strongest Skills

1. 🐍 **First-Principles Deep Learning**: Built a complete GPT Transformer from scratch in pure NumPy.
2. ⚡ **High-Concurrency Backend Architecture**: FastAPI async, Celery, Redis, PostgreSQL RLS.
3. 🎯 **RAG & Vector Search Engineering**: Qdrant Vector DB, semantic chunking, and hallucination guardrails.`
  },
  {
    id: "weakest_skill",
    exactMatches: ["weakest skill", "weakest skills", "areas of improvement", "weakness"],
    patterns: ["weakest skill", "areas of improvement", "growth areas"],
    handler: () => `### Areas of Improvement & Growth

• **Low-Level CUDA Kernel Optimization**: Currently expanding from CPU-based NumPy tensor math into custom Triton and CUDA kernel programming for GPU inference speedups.
• **Tendency to Build From Scratch**: Addressed by enforcing strict MVP project scope timelines when evaluating third-party tooling.`
  },

  // ==================== 5. AI KNOWLEDGE & CONCEPTS ====================
  {
    id: "explain_rag",
    exactMatches: ["explain rag", "what is rag", "retrieval augmented generation", "explain rag pipeline"],
    patterns: ["retrieval-augmented generation (rag)", "explain rag", "what is rag", "rag pipeline"],
    handler: () => `### Retrieval-Augmented Generation (RAG)

**RAG** combines dense information retrieval with large language models to provide accurate, grounded responses without retraining:

1. **Ingestion & Chunking**: Documents are split into semantic chunks.
2. **Embedding Generation**: Chunks are transformed into high-dimensional vector representations.
3. **Similarity Search**: When a user queries, cosine similarity retrieves the top-K closest knowledge chunks from a Vector DB (e.g., Qdrant).
4. **Context Injection & Synthesis**: Retrieved facts are injected into the LLM system prompt under strict grounding rules (temperature ~0.2) to eliminate hallucinations.`
  },
  {
    id: "explain_llm",
    exactMatches: ["explain llm", "what is an llm", "large language models"],
    patterns: ["large language models", "explain llm", "what is llm"],
    handler: () => `### Large Language Models

**LLMs** are deep neural networks based on the Transformer architecture trained on vast text corpora to predict next tokens probabilistically:
• **Key Driver**: Self-Attention allows models to dynamically weigh relationships between words regardless of distance.
• **Capabilities**: Natural language understanding, reasoning, code generation, and multi-turn conversational agents.`
  },
  {
    id: "explain_transformers",
    exactMatches: ["explain transformers", "what is a transformer", "transformer architecture"],
    patterns: ["transformer architecture", "explain transformers", "transformer model"],
    handler: () => `### Transformer Architecture

Introduced in *"Attention Is All You Need"* (Vaswani et al., 2017), Transformers replace recurrence with **Multi-Head Self-Attention**:
• **Core Formula**: \`Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V\`
• **Key Layers**: Positional Encodings, Scaled Dot-Product Attention, Residual Add & LayerNorm, and Feed-Forward Networks.`
  },
  {
    id: "explain_attention",
    exactMatches: ["explain attention mechanism", "attention mechanism", "self attention", "how attention works"],
    patterns: ["self-attention mechanism", "attention mechanism", "multi head attention"],
    handler: () => `### Self-Attention Mechanism

Self-attention allows tokens to dynamically compute relevance weights against all other tokens in a sequence:
• **Query ($Q$)**: What the current token is looking for.
• **Key ($K$)**: What other tokens offer.
• **Value ($V$)**: The actual semantic information transferred.
• In **NumPyGPT**, Kartik hand-coded 8 parallel attention heads to capture diverse linguistic nuances.`
  },
  {
    id: "explain_embeddings",
    exactMatches: ["explain embeddings", "what are embeddings", "vector embeddings"],
    patterns: ["vector embeddings", "explain embeddings", "what are embeddings"],
    handler: () => `### Vector Embeddings

**Embeddings** map discrete text, tokens, or documents into continuous, high-dimensional vector spaces (e.g., 768 or 1536 dimensions):
• Semantically similar sentences map to points close together in vector space.
• Enables mathematical comparison using **Cosine Similarity** or Euclidean Distance.`
  },
  {
    id: "explain_vector_database",
    exactMatches: ["explain vector database", "what is a vector database", "vector databases", "vector database"],
    patterns: ["vector databases", "explain vector database", "what is vector db"],
    handler: () => `### Vector Databases

**Vector Databases** (like Qdrant, Pinecone, Milvus) are specialized storage engines optimized for indexing and querying high-dimensional vectors at scale:
• **Index Algorithms**: Hierarchical Navigable Small World (HNSW) graphs and IVF indexes for sub-millisecond approximate nearest neighbor (ANN) retrieval.`
  },
  {
    id: "explain_semantic_search",
    exactMatches: ["explain semantic search", "semantic search", "vector search", "explain vector search"],
    patterns: ["semantic search", "vector search", "approximate nearest neighbor"],
    handler: () => `### Semantic Search vs Keyword Search

• **Keyword Search (BM25 / Lexical)**: Matches exact word tokens, often failing on synonyms or phrasing variations.
• **Semantic Search (Dense Vector)**: Translates meaning into vector geometry, matching conceptually identical queries even with zero shared words.`
  },
  {
    id: "explain_chunking",
    exactMatches: ["explain chunking", "chunking", "chunking strategy", "explain chunking strategy"],
    patterns: ["chunking strategy", "document chunking", "semantic chunking"],
    handler: () => `### Document Chunking Strategies

• **Fixed-Size Chunking**: Slices text by fixed token/character count with sliding overlap (e.g., 500 tokens with 50-token overlap).
• **Semantic / Recursive Chunking**: Splits text at natural linguistic boundaries (paragraphs, headings, sentences) to preserve context integrity.`
  },
  {
    id: "explain_reranking",
    exactMatches: ["explain reranking", "reranking", "cross encoder", "cross-encoder"],
    patterns: ["cross-encoder reranking", "reranking in rag", "rerank"],
    handler: () => `### Cross-Encoder Reranking in RAG

1. **First-Stage Retrieval**: Fast bi-encoder vector search retrieves top 20–50 candidates.
2. **Second-Stage Reranking**: Heavy cross-encoder jointly computes full cross-attention between the query and candidate chunk, reordering candidates for optimal precision.`
  },
  {
    id: "explain_prompt_engineering",
    exactMatches: ["explain prompt engineering", "what is prompt engineering", "prompting techniques"],
    patterns: ["prompt engineering", "explain prompt engineering", "prompting methods"],
    handler: () => `### Prompt Engineering

The art and science of structuring inputs to guide LLMs toward deterministic, high-quality outputs:
• **Techniques**: Few-Shot In-Context Learning, Chain-of-Thought (CoT), ReAct (Reason + Act), and Structured JSON output constraints.`
  },
  {
    id: "explain_fine_tuning",
    exactMatches: ["explain fine tuning", "what is fine tuning", "fine tuning llms"],
    patterns: ["fine-tuning llms", "explain fine tuning", "what is finetuning"],
    handler: () => `### Fine-Tuning LLMs

Adapting pre-trained base foundation models to specialized domain tasks using labeled datasets:
• **Techniques**: Full parameter fine-tuning, LoRA (Low-Rank Adaptation), QLoRA, and Instruction Tuning for task alignment.`
  },
  {
    id: "explain_ai_agents",
    exactMatches: ["explain ai agents", "what are ai agents", "agentic workflows"],
    patterns: ["ai agents", "explain ai agents", "what are autonomous agents"],
    handler: () => `### AI Agents

Autonomous software entities that perceive state, formulate plans, use external tools (APIs, databases), and execute multi-step workflows to achieve defined objectives.`
  },
  {
    id: "explain_mcp",
    exactMatches: ["explain mcp", "what is mcp", "model context protocol"],
    patterns: ["model context protocol (mcp)", "explain mcp", "what is model context protocol"],
    handler: () => `### Model Context Protocol (MCP)

An open protocol that standardizes how AI applications and models connect securely to external data sources, developer tools, and client environments.`
  },
  {
    id: "explain_langchain",
    exactMatches: ["explain langchain", "what is langchain", "langchain"],
    patterns: ["langchain framework", "explain langchain", "what is langchain"],
    handler: () => `### LangChain Framework

An open-source orchestration framework that simplifies chaining LLMs, vector retrievers, external tools, and memory into complete AI applications.`
  },
  {
    id: "explain_llamaindex",
    exactMatches: ["explain llamaindex", "what is llamaindex", "llamaindex"],
    patterns: ["llamaindex framework", "explain llamaindex", "what is llamaindex"],
    handler: () => `### LlamaIndex Framework

A data framework designed for ingesting, structuring, and indexing custom enterprise data for LLM and RAG retrieval pipelines.`
  },
  {
    id: "explain_huggingface",
    exactMatches: ["explain huggingface", "huggingface", "hugging face"],
    patterns: ["hugging face", "huggingface ecosystem", "transformers library"],
    handler: () => `### Hugging Face Ecosystem

The leading open-source platform for AI models, datasets, and pipelines:
• Houses thousands of pre-trained foundation models (RoBERTa, LLaMA, Mistral, Sentence Transformers).
• Used in Kartik's **AtlasOS** for the \`roberta-large-mnli\` Natural Language Inference pipeline.`
  },
  {
    id: "explain_pytorch",
    exactMatches: ["explain pytorch", "pytorch"],
    patterns: ["pytorch framework", "explain pytorch", "torch"],
    handler: () => `### PyTorch Framework

The primary open-source deep learning framework providing dynamic computation graphs (Autograd) and GPU acceleration. While widely used in industry, Kartik proved deep mastery by hand-coding **NumPyGPT** from scratch in pure NumPy before utilizing PyTorch!`
  },
  {
    id: "explain_tensorflow",
    exactMatches: ["explain tensorflow", "tensorflow", "tf"],
    patterns: ["tensorflow framework", "explain tensorflow", "keras"],
    handler: () => `### TensorFlow Framework

Google's enterprise open-source framework for building and deploying machine learning models at scale with TensorFlow Serving, TFLite, and TF.js.`
  },

  // ==================== 6. ALL PROJECTS & SYSTEM DESIGN ====================
  {
    id: "projects",
    exactMatches: ["projects", "all projects", "what did you build", "list projects", "project comparison"],
    patterns: ["complete project portfolio", "all projects", "list of projects", "project comparison"],
    handler: () => `### Complete Project Portfolio

1. 🌐 **Atlas AI Resume**: Interactive RAG portfolio with Recruiter Telemetry Console & KB Studio.
2. 🌌 **AtlasOS**: Multi-tenant AI Memory OS with active RoBERTa contradiction detection.
3. ⚖️ **Debate Arena**: Multi-LLM debates in a 3D courtroom using React Three Fiber.
4. 🐍 **NumPyGPT**: GPT Transformer built 100% from scratch with zero ML frameworks.
5. 📊 **RagaAI Catalyst**: Enterprise LLM evaluation & guardrails suite (99.4% faithfulness).

*Which project would you like to explore in detail?*`
  },
  {
    id: "featured_projects",
    exactMatches: ["featured projects", "top projects", "main projects"],
    patterns: ["featured projects", "top projects", "key projects"],
    handler: () => `### Featured Projects

• 🌌 **AtlasOS**: Flagship system engineering project for autonomous agent memory.
• 🐍 **NumPyGPT**: Mathematical deep learning showcase.
• ⚖️ **Debate Arena**: Interactive 3D WebGL application exploring LLM bias.`
  },
  {
    id: "best_project",
    exactMatches: ["best project", "flagship project", "proudest project", "favorite project", "most complex project"],
    patterns: ["flagship project", "best project", "proudest project", "most complex project"],
    handler: () => `### Flagship Project: AtlasOS

**AtlasOS** is Kartik's flagship engineering accomplishment:
• Solves memory fragmentation in multi-agent systems.
• Integrates distributed caching (Redis), relational storage with Row-Level Security (PostgreSQL), and dense vector indexing (Qdrant) with local RoBERTa NLI contradiction detection.`
  },
  {
    id: "latest_project",
    exactMatches: ["latest project", "most recent project", "recent work"],
    patterns: ["latest project", "most recent project", "newest project"],
    handler: () => `### Latest Project

**Atlas AI Resume**: Production RAG portfolio equipped with Recruiter Telemetry Console, dynamic Knowledge Base indexing, and sub-second streaming answers.`
  },
  {
    id: "hardest_project",
    exactMatches: ["hardest project", "most difficult project", "most challenging project"],
    patterns: ["most challenging project", "hardest project", "most difficult project"],
    handler: () => `### Most Challenging Project: NumPyGPT

**NumPyGPT**: Hand-calculating analytical gradients for multi-head attention and layer normalization backpropagation in raw Python matrix math without PyTorch or Autograd.`
  },
  {
    id: "easiest_project",
    exactMatches: ["easiest project", "simple project"],
    patterns: ["easiest project", "simple project", "quick prototype"],
    handler: () => `### Quick Prototyping Projects

Kartik's early web apps and single-purpose utilities served as high-speed MVPs, which rapidly evolved into complex distributed architectures like **AtlasOS** and **RagaAI Catalyst**.`
  },
  {
    id: "project_timeline",
    exactMatches: ["project timeline", "timeline of projects"],
    patterns: ["project timeline", "timeline of projects", "project milestones"],
    handler: () => `### Project Development Timeline

1. **NumPyGPT** (2024): First-principles GPT Transformer in pure NumPy.
2. **Debate Arena** (2025): Multi-LLM 3D courtroom platform with React Three Fiber.
3. **AtlasOS** (2025): Multi-tenant AI Memory OS with RoBERTa NLI.
4. **RagaAI Catalyst** (2026): Enterprise LLM evaluation & guardrails suite.
5. **Atlas AI Resume** (2026): RAG assistant with Recruiter Telemetry Console.`
  },
  {
    id: "project_architecture",
    exactMatches: ["project architecture", "project architectures", "how are projects structured"],
    patterns: ["project architectures", "project architecture", "architecture overview"],
    handler: () => `### Project Architectures

All projects follow modern clean architecture:
• Decoupled UI (React 19 / Next.js 14) communicating over async REST, SSE, or WebSockets.
• Modular FastAPI / Node.js backend controllers with strict validation schemas.
• Multi-tier persistence (PostgreSQL RLS + Qdrant Vector DB + Redis 7).`
  },
  {
    id: "project_workflow",
    exactMatches: ["project workflow", "workflow of projects"],
    patterns: ["project workflow", "engineering workflow", "development lifecycle"],
    handler: () => `### End-to-End Project Workflow

1. **Mathematical Design & Prototyping**: Formulating algorithms and matrix operations.
2. **Async Microservices Architecture**: FastAPI endpoints with Pydantic validation.
3. **Data Isolation & Vector Pipelines**: PostgreSQL RLS paired with Qdrant Vector DB.
4. **Testing & Telemetry**: Comprehensive unit tests and live observability logging.`
  },
  {
    id: "project_challenges",
    exactMatches: ["project challenges", "challenges faced", "problems faced in projects"],
    patterns: ["challenges faced", "project challenges", "difficulties in projects"],
    handler: () => `### Challenges Faced in Projects

1. **NumPyGPT**: Implementing numerical stability in backpropagation without autograd frameworks.
2. **AtlasOS**: Minimizing latency of local RoBERTa NLI models using Celery async worker pools.
3. **Debate Arena**: Optimizing 3D WebGL rendering performance alongside live WebSocket token streaming.`
  },
  {
    id: "project_achievements",
    exactMatches: ["project achievements", "impact of projects"],
    patterns: ["project achievements", "project milestones", "project results"],
    handler: () => `### Project Achievements & Metrics

• 99.4% Faithfulness achieved in RagaAI Catalyst evaluation benchmarks.
• Hand-coded attention and backprop running smoothly in browser heatmaps (NumPyGPT).
• Sub-45ms response latencies across async FastAPI microservices.`
  },
  {
    id: "project_deployment",
    exactMatches: ["project deployment", "deployment", "deployment process", "how do you deploy"],
    patterns: ["deployment process", "how you deploy", "deployment pipeline", "project deployment"],
    handler: () => `### Project Deployment Pipelines

• **Containerization**: Multi-stage Docker builds minimizing image sizes.
• **Hosting**: Vercel for frontend single-page apps, cloud VMs/containers for FastAPI and Vector DB services.
• **CI/CD**: Automated GitHub Actions checking linting, type safety, and test suites on every push.`
  },
  {
    id: "project_tech_stack",
    exactMatches: ["project tech stack", "technologies across projects"],
    patterns: ["technologies across projects", "project tech stack"],
    handler: () => `### Technologies Across Projects

• **Languages**: Python 3.11, TypeScript, JavaScript, SQL
• **Frameworks**: FastAPI, React 19, Next.js 14, Three.js, React Three Fiber, Express
• **Databases**: PostgreSQL 15 (RLS), Qdrant Vector DB, Redis 7, MongoDB, SQLite
• **AI Models**: RoBERTa-large-MNLI, Gemini 2.5 Flash, GPT-4o, Claude 3.5`
  },
  {
    id: "project_demonstration",
    exactMatches: ["project demonstration", "project demo", "live demos"],
    patterns: ["project demonstration", "live demo", "try demos"],
    handler: () => `### Live Project Demonstrations

1. 🌐 **Atlas AI Resume**: [kartik-raikar.dev](https://kartik-raikar.dev)
2. 🌌 **AtlasOS**: [atlasos.kartik.dev](https://atlasos.kartik.dev)
3. ⚖️ **Debate Arena**: [debate-arena.kartik.dev](https://debate-arena.kartik.dev)
4. 🐍 **NumPyGPT**: [numpygpt.kartik.dev](https://numpygpt.kartik.dev)
5. 📊 **RagaAI Catalyst**: [catalyst.raga.ai](https://catalyst.raga.ai)`
  },

  // ==================== 7. ATLASOS ====================
  {
    id: "atlasos",
    exactMatches: ["atlasos", "atlas os", "project atlasos", "why atlasos"],
    patterns: ["project spotlight: atlasos", "atlasos", "atlas os", "why atlasos"],
    handler: () => `### Project Spotlight: AtlasOS

• 🧠 **Overview**: Multi-tenant AI Memory Operating System providing hierarchical, contextual memory management for autonomous AI agents.
• 🛠️ **Tech Stack**: FastAPI, Python 3.11, PostgreSQL 15 (RLS), Qdrant Vector DB, Redis 7, Next.js 14, Celery, RoBERTa-large-MNLI.
• ⚡ **Key Features**:
  1. **3-Tier Memory Engine**: Ephemeral Working Memory, Episodic Vector Storage, and Semantic Memory Consolidation.
  2. **Active Contradiction Detection**: Local RoBERTa NLI classifies incoming facts as Entailment, Contradiction, or Neutral with auto-resolution.
  3. **Multi-Tenant Isolation**: Enforced via PostgreSQL Row-Level Security and scoped vector filters.
• 🐙 **GitHub**: [github.com/kartik-012/AtlasOS](https://github.com/kartik-012/AtlasOS)
• 🌐 **Live Demo**: [atlasos.kartik.dev](https://atlasos.kartik.dev)`
  },
  {
    id: "explain_atlasos",
    exactMatches: ["explain atlasos", "what is atlasos", "tell me about atlasos", "atlasos overview"],
    patterns: ["atlasos overview", "explain atlasos", "what is atlasos"],
    handler: () => `### AtlasOS Overview

AtlasOS acts as a cognitive memory kernel for AI agents. When agents converse across days or weeks, facts can drift or conflict. AtlasOS organizes memory into Working, Episodic, and Semantic tiers while continuously validating factual consistency using Natural Language Inference.`
  },
  {
    id: "atlasos_architecture",
    exactMatches: ["atlasos architecture", "atlasos system design"],
    patterns: ["atlasos system architecture", "atlasos architecture", "atlas os system design"],
    handler: () => `### AtlasOS System Architecture

• **Frontend**: Next.js 14 Dashboard with real-time memory visualizer.
• **API Gateway**: FastAPI async service with JWT multi-tenant authentication.
• **Worker Queue**: Celery workers powered by Redis 7 for async embedding and NLI passes.
• **Storage Engine**: PostgreSQL 15 with Row-Level Security policies + Qdrant Vector Database.`
  },
  {
    id: "atlasos_workflow",
    exactMatches: ["how does atlasos work", "atlasos workflow", "how does atlas os work"],
    patterns: ["atlasos architecture & workflow", "how does atlasos work", "atlasos workflow"],
    handler: () => `### AtlasOS Architecture & Workflow

1. **Ingestion**: Raw user/agent interactions land in Redis working memory.
2. **Episodic Archival**: Transferred to PostgreSQL 15 (with Row-Level Security) and embedded into Qdrant Vector DB.
3. **Contradiction Evaluation**: As new facts arrive, \`roberta-large-mnli\` evaluates them against retrieved context.
4. **Policy Resolution**: Conflicting facts are resolved based on confidence score and recency policies.`
  },
  {
    id: "atlasos_tech_stack",
    exactMatches: ["atlasos tech stack", "atlasos technologies"],
    patterns: ["atlasos technology stack", "atlasos tech stack", "atlasos stack"],
    handler: () => `### AtlasOS Technology Stack

• **Backend**: Python 3.11, FastAPI, Celery, Pydantic
• **AI Models**: RoBERTa-large-MNLI, Sentence Transformers, Gemini API
• **Databases**: PostgreSQL 15, Qdrant Vector DB, Redis 7
• **Frontend**: Next.js 14, TailwindCSS, TypeScript`
  },
  {
    id: "atlasos_database",
    exactMatches: ["atlasos database", "atlasos db", "atlasos storage"],
    patterns: ["atlasos database", "atlasos db design", "atlasos storage"],
    handler: () => `### AtlasOS Multi-Tier Database Design

• **Tier 1 (Working Memory)**: Redis 7 with short TTL for sub-5ms conversational turn lookups.
• **Tier 2 (Episodic Storage)**: PostgreSQL 15 with Row-Level Security (RLS) guaranteeing tenant isolation.
• **Tier 3 (Semantic Search)**: Qdrant Vector DB for dense vector similarity and fact clustering.`
  },
  {
    id: "atlasos_deployment",
    exactMatches: ["atlasos deployment", "deploy atlasos"],
    patterns: ["atlasos deployment", "atlasos host", "atlasos container"],
    handler: () => `### AtlasOS Deployment Architecture

• Microservices orchestrated via Docker Compose: FastAPI backend, Celery workers, Redis 7, and PostgreSQL 15.
• Frontend deployed to Vercel with automated CI/CD.`
  },
  {
    id: "atlasos_challenges",
    exactMatches: ["atlasos challenges", "challenges in atlasos"],
    patterns: ["challenges & solutions", "atlasos challenges", "atlasos difficulties"],
    handler: () => `### Challenges & Solutions in AtlasOS

• **Challenge**: High latency during real-time NLI cross-checking on every message.
• **Solution**: Offloaded NLI inference to Celery background workers and implemented a Redis 2-tier cache for frequent assertions.`
  },
  {
    id: "atlasos_future",
    exactMatches: ["atlasos future", "atlasos future improvements", "atlasos roadmap", "future of atlasos"],
    patterns: ["future enhancements", "atlasos future", "atlasos roadmap"],
    handler: () => `### AtlasOS Future Roadmap

• **Graph-RAG Integration**: Knowledge graph traversal for multi-hop causal reasoning across agent memories.
• **Multi-Modal Memory**: Automatic indexing and retrieval of screenshots and audio logs.`
  },
  {
    id: "atlasos_business_value",
    exactMatches: ["atlasos business value", "business value of atlasos", "value of atlasos"],
    patterns: ["business value of atlasos", "atlasos enterprise value", "business impact"],
    handler: () => `### AtlasOS Business Impact & Enterprise Value

• Eliminates catastrophic forgetting and hallucinated contradictions in customer support agents.
• Guarantees 100% data tenant isolation via PostgreSQL RLS for enterprise compliance.`
  },
  {
    id: "atlasos_demo",
    exactMatches: ["atlasos demo", "atlas os live demo", "demo atlasos"],
    patterns: ["atlasos demonstration", "atlasos demo", "try atlasos"],
    handler: () => `### AtlasOS Demonstration

• 🌐 **Live Production Link**: [atlasos.kartik.dev](https://atlasos.kartik.dev)
• 🐙 **Repository**: [github.com/kartik-012/AtlasOS](https://github.com/kartik-012/AtlasOS)`
  },

  // ==================== 8. DEBATE ARENA ====================
  {
    id: "debate_arena",
    exactMatches: ["debate arena", "project debate arena", "why debate arena"],
    patterns: ["project spotlight: debate arena", "debate arena", "debate-arena", "why debate arena"],
    handler: () => `### Project Spotlight: Debate Arena

• ⚖️ **Overview**: Multi-LLM adversarial debate platform staging live multi-round debates between leading AI models in an interactive 3D courtroom.
• 🛠️ **Tech Stack**: Python 3.11, FastAPI (async), React 18, React Three Fiber (R3F), Three.js, TailwindCSS, Framer Motion, Async SQLite.
• ⚡ **Key Features**:
  1. **Live 3D Courtroom**: React Three Fiber scene with dynamic lighting, podium spotlights, and animated camera movements.
  2. **Multi-LLM Persona Synthesis**: Pits models (GPT-4o, Claude 3.5, Gemini) against each other across structured rounds.
  3. **Judicial Bias Auditing**: Swaps speaker order in transcripts to mathematically audit and eliminate positional bias in scoring.
• 🐙 **GitHub**: [github.com/kartikraikar2005/debate-arena](https://github.com/kartikraikar2005/debate-arena)
• 🌐 **Live Demo**: [debate-arena.kartik.dev](https://debate-arena.kartik.dev)`
  },
  {
    id: "explain_debate_arena",
    exactMatches: ["explain debate arena", "what is debate arena", "tell me about debate arena"],
    patterns: ["debate arena overview", "explain debate arena", "what is debate arena"],
    handler: () => `### Debate Arena Overview

Debate Arena explores multi-agent dynamics and judicial fairness by having contrasting LLMs debate complex philosophical, legal, and technical topics inside an interactive 3D courtroom rendered in WebGL.`
  },
  {
    id: "debate_arena_architecture",
    exactMatches: ["debate arena architecture", "debate arena design"],
    patterns: ["debate arena architecture", "debate arena system design"],
    handler: () => `### Debate Arena Architecture

• **Frontend & 3D Layer**: React 18 + React Three Fiber + Three.js rendering the 3D court environment.
• **Orchestration Layer**: FastAPI async event loop streaming debate rounds via WebSockets/SSE.
• **Evaluation Engine**: Automated AI Judge scoring arguments on logic, evidence, rebuttal strength, and positional fairness.`
  },
  {
    id: "debate_arena_workflow",
    exactMatches: ["debate arena workflow", "how debate arena works"],
    patterns: ["debate arena workflow", "how debate arena works"],
    handler: () => `### Debate Arena Workflow

1. Topic selection and persona assignment (Affirmative vs Negative).
2. Opening arguments streamed turn-by-turn with active 3D podium spotlighting.
3. Cross-examination and rebuttal rounds.
4. Final verdict delivered with detailed rubric metrics and bias audit score.`
  },
  {
    id: "debate_arena_technologies",
    exactMatches: ["debate arena technologies", "debate arena tech stack", "debate arena stack"],
    patterns: ["debate arena technology stack", "debate arena tech stack"],
    handler: () => `### Debate Arena Technology Stack

• **3D & Frontend**: React Three Fiber, Three.js, React 18, TailwindCSS, Framer Motion
• **Backend**: Python 3.11, FastAPI (async), Async SQLite, WebSockets
• **LLM Providers**: OpenAI GPT-4o, Anthropic Claude 3.5, Google Gemini`
  },
  {
    id: "debate_arena_deployment",
    exactMatches: ["debate arena deployment", "deploy debate arena"],
    patterns: ["debate arena deployment", "debate arena host"],
    handler: () => `### Debate Arena Deployment

Deployed with FastAPI on containerized cloud instances and the interactive 3D React Three Fiber frontend on Vercel with optimized WebGL asset loading.`
  },

  // ==================== 9. NUMPYGPT ====================
  {
    id: "numpygpt",
    exactMatches: ["numpygpt", "numpy gpt", "project numpygpt"],
    patterns: ["project spotlight: numpygpt", "numpygpt", "numpy gpt"],
    handler: () => `### Project Spotlight: NumPyGPT

• 🐍 **Overview**: Complete GPT Transformer deep learning architecture hand-coded 100% from first principles using pure NumPy and matrix math — **zero PyTorch or TensorFlow**.
• 🛠️ **Tech Stack**: Python, TypeScript, React 19, TailwindCSS, Vite, Express, Google Gemini API.
• ⚡ **Key Features**:
  1. **Zero-Framework Transformer**: Hand-coded Multi-Head Attention (8 heads), LayerNorm, Softmax, FeedForward, and Backpropagation from scratch.
  2. **Interactive Attention Visualizer**: Real-time browser heatmap rendering attention weights, token activations, and gradient flows.
  3. **Conversational Assistant**: Integrated Gemini-powered AI that explains, tests, and debugs NumPy code interactively.
• 🐙 **GitHub**: [github.com/kartikraikar2005/numpygpt](https://github.com/kartikraikar2005/numpygpt)
• 🌐 **Live Demo**: [numpygpt.kartik.dev](https://numpygpt.kartik.dev)`
  },
  {
    id: "explain_numpygpt",
    exactMatches: ["explain numpygpt", "what is numpygpt", "tell me about numpygpt"],
    patterns: ["numpygpt overview", "explain numpygpt", "what is numpygpt"],
    handler: () => `### NumPyGPT Overview

NumPyGPT demonstrates deep technical mastery of neural networks. Rather than importing high-level frameworks, Kartik wrote the entire forward and backward passes using fundamental matrix operations in Python.`
  },
  {
    id: "transformer_from_scratch",
    exactMatches: ["transformer from scratch", "scratch transformer", "build transformer from scratch"],
    patterns: ["transformer built from scratch", "transformer from scratch", "scratch transformer"],
    handler: () => `### Transformer Built from Scratch

• Implemented Query, Key, Value linear projections via matrix multiplication: \`Q = X @ W_Q\`.
• Hand-coded scaled dot-product attention: \`softmax((Q @ K.T) / sqrt(d_k)) @ V\`.
• Implemented analytical gradients for backpropagation across all layers without Autograd.`
  },
  {
    id: "positional_encoding",
    exactMatches: ["positional encoding", "positional encodings"],
    patterns: ["positional encoding", "sinusoidal positional encoding"],
    handler: () => `### Positional Encoding

Transformers process all tokens in parallel and lack inherent sequence order. NumPyGPT implements sinusoidal positional encodings:
• \`PE(pos, 2i) = sin(pos / 10000^(2i/d_model))\`
• \`PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))\``
  },
  {
    id: "encoder_decoder",
    exactMatches: ["encoder decoder", "encoder-decoder", "encoder vs decoder"],
    patterns: ["encoder decoder", "encoder vs decoder", "transformer architecture variants"],
    handler: () => `### Encoder vs Decoder Architecture

• **Encoder-Only (BERT)**: Bi-directional attention suitable for classification and embeddings.
• **Decoder-Only (GPT / NumPyGPT)**: Causal masked self-attention suitable for autoregressive text generation.
• **Encoder-Decoder (T5)**: Cross-attention suitable for translation and summarization.`
  },
  {
    id: "why_build_transformer_manually",
    exactMatches: ["why build transformer manually", "why numpygpt", "why from scratch"],
    patterns: ["learning objectives", "why build transformer manually", "why from scratch"],
    handler: () => `### Learning Objectives & First Principles

To build an unshakeable first-principles intuition for tensor dimensions, gradient flow dynamics, numerical stability in softmax, and memory bottlenecks in modern LLMs.`
  },

  // ==================== 10. RAGAAI CATALYST ====================
  {
    id: "ragaai_catalyst",
    exactMatches: ["ragaai catalyst", "ragaai", "catalyst", "project ragaai catalyst"],
    patterns: ["project spotlight: ragaai catalyst", "ragaai catalyst", "ragaai"],
    handler: () => `### Project Spotlight: RagaAI Catalyst

• 📊 **Overview**: Enterprise-grade evaluation, observability, and guardrails suite for LLM and RAG applications across 5+ model providers.
• 🛠️ **Tech Stack**: Python, FastAPI, React, WebSockets, MongoDB, LiteLLM, Sentence Transformers, Qdrant.
• ⚡ **Key Features**:
  1. **Automated Evaluation Metrics**: Evaluates Faithfulness (99.4%), Context Relevance, Toxicity, and Hallucination rates with sub-45ms latency.
  2. **Dynamic Guardrails Engine**: Enforces real-time response evaluation, regex checks, competitor blocklists, and automated fallback intervention.
  3. **Automated Red-Teaming**: Multi-provider vulnerability and prompt injection testing suite.
• 🐙 **GitHub**: [github.com/kartikraikar2005/ragaai-catalyst](https://github.com/kartikraikar2005/ragaai-catalyst)
• 🌐 **Live Demo**: [catalyst.raga.ai](https://catalyst.raga.ai)`
  },
  {
    id: "explain_ragaai_catalyst",
    exactMatches: ["explain ragaai catalyst", "what is ragaai catalyst", "tell me about ragaai catalyst"],
    patterns: ["ragaai overview", "explain ragaai catalyst", "what is ragaai catalyst"],
    handler: () => `### RagaAI Overview

RagaAI Catalyst solves the LLM reliability problem in production by continuously monitoring model outputs for factual accuracy, hallucinations, and safety compliance.`
  },
  {
    id: "llm_evaluation",
    exactMatches: ["llm evaluation", "how to evaluate llms", "llm eval", "evaluation metrics", "explain evaluation"],
    patterns: ["llm evaluation techniques", "llm evaluation", "evaluating llms", "evaluation metrics"],
    handler: () => `### LLM Evaluation Techniques

• **Faithfulness**: Measures whether claims in the generated response are grounded in the source context.
• **Context Relevance**: Measures whether retrieved chunks are relevant to the query.
• **Answer Relevance**: Measures whether response directly addresses the user query.`
  },
  {
    id: "hallucination_detection",
    exactMatches: ["hallucination detection", "hallucination", "detect hallucinations", "explain hallucination mitigation"],
    patterns: ["hallucination detection", "detecting hallucinations", "hallucination scoring", "hallucination mitigation"],
    handler: () => `### Hallucination Detection

Uses cross-encoder NLI and sentence-level claim decomposition to verify that every asserted statement is mathematically supported by the retrieved ground-truth documents.`
  },
  {
    id: "ai_guardrails",
    exactMatches: ["ai guardrails", "guardrails", "llm safety"],
    patterns: ["ai guardrails & safety", "ai guardrails", "guardrails engine"],
    handler: () => `### AI Guardrails & Safety

Dynamic interceptors that scan input prompts and generated responses in real-time, blocking toxic content, PII leaks, and prompt injection attacks with sub-45ms latency.`
  },
  {
    id: "prompt_injection",
    exactMatches: ["prompt injection", "jailbreak defense", "red teaming"],
    patterns: ["prompt injection", "prompt injection defense", "red teaming"],
    handler: () => `### Prompt Injection Defense & Red Teaming

• Input sanitization and heuristic boundary checks.
• Canary token injection to detect unauthorized prompt leakage.
• Automated red-teaming test suites simulating known jailbreak patterns.`
  },

  // ==================== 11. SYSTEM DESIGN & ARCHITECTURE ====================
  {
    id: "system_design",
    exactMatches: ["architecture", "system design", "system design overview", "architecture design"],
    patterns: ["system design overview", "system design", "architecture principles", "architecture"],
    handler: () => `### System Architecture Principles

• **High-Concurrency Async**: FastAPI event loops with non-blocking I/O for sub-45ms response latencies.
• **Multi-Tenant Isolation**: Row-Level Security (RLS) in PostgreSQL paired with scoped vector filters in Qdrant.
• **Multi-Tier Caching**: Redis 7 caching working state, token buffers, and semantic embeddings.
• **Real-Time Streaming**: Server-Sent Events (SSE) and WebSockets for instantaneous token delivery.`
  },
  {
    id: "backend_architecture",
    exactMatches: ["backend architecture", "backend design"],
    patterns: ["backend architecture", "backend system design"],
    handler: () => `### Backend Architecture

Layered architecture with API routers, business service layer, background workers (Celery), and repository pattern for database and vector store access.`
  },
  {
    id: "frontend_architecture",
    exactMatches: ["frontend architecture", "frontend design"],
    patterns: ["frontend architecture", "frontend system design"],
    handler: () => `### Frontend Architecture

Component-driven React 19 architecture with custom hooks, CSS variables design system, accessible UI elements, and WebGL 3D scenes.`
  },
  {
    id: "api_architecture",
    exactMatches: ["api architecture", "api design", "rest api design"],
    patterns: ["api architecture", "api design", "rest endpoints"],
    handler: () => `### API Architecture

RESTful endpoints adhering to OpenAPI specifications, JSON-payload validation, rate limiting, and Server-Sent Events for streaming LLM tokens.`
  },
  {
    id: "database_design",
    exactMatches: ["database design", "database schema"],
    patterns: ["database design", "db schema", "data modeling"],
    handler: () => `### Database Design

• Relational data in PostgreSQL with foreign keys and tenant RLS policies.
• High-dimensional vectors in Qdrant with payload metadata indexing.
• In-memory working memory in Redis with configurable TTLs.`
  },
  {
    id: "cloud_infrastructure",
    exactMatches: ["cloud architecture", "cloud infrastructure"],
    patterns: ["cloud infrastructure", "cloud architecture", "cloud setup"],
    handler: () => `### Cloud Infrastructure

Microservices deployed in cloud environments leveraging OCI compute instances, object storage, and managed PostgreSQL databases.`
  },
  {
    id: "auth_design",
    exactMatches: ["authentication", "authorization", "auth", "security"],
    patterns: ["authentication", "authorization", "security best practices", "auth design"],
    handler: () => `### Authentication & Security Design

• **JWT Authentication**: Stateless, signed tokens with short expiration and refresh rotation.
• **Row-Level Security (RLS)**: Database-enforced authorization policies preventing cross-tenant data leaks.
• **Rate Limiting**: IP-based and user-based token bucket limiters to prevent DDoS and API abuse.`
  },
  {
    id: "scalability_caching",
    exactMatches: ["scalability", "caching", "load balancing", "microservices"],
    patterns: ["scalability", "caching architecture", "load balancing", "microservices"],
    handler: () => `### Scalability & High-Throughput Design

• **Horizontal Scaling**: Stateless FastAPI container replicas behind Nginx load balancers.
• **Redis Multi-Tier Caching**: Vector query caching reducing database lookups by 80%.
• **Asynchronous Task Offloading**: Celery task workers processing long-running ML embedding and evaluation tasks.`
  },

  // ==================== 12. EXPERIENCE & ACHIEVEMENTS ====================
  {
    id: "internship",
    exactMatches: ["internship", "internship experience", "internships"],
    patterns: ["internship experience", "internship", "internships"],
    handler: () => `### Internship Experience

• **Focus**: Actively pursuing AI/ML Engineering and Full-Stack AI Internships.
• **Simulation Experience**: Completed intensive job simulations with **Deloitte** (Data Analytics) and **Tata** (GenAI & Cybersecurity) on Forage.`
  },
  {
    id: "work_experience",
    exactMatches: ["work experience", "experience", "professional experience"],
    patterns: ["professional experience", "work experience", "industry experience"],
    handler: () => `### Professional Experience

Demonstrated engineering capability through 5 major production-grade projects, open-source repositories, and 13 verified industry credentials. Open to full-time and internship opportunities.`
  },
  {
    id: "responsibilities",
    exactMatches: ["responsibilities", "roles and responsibilities"],
    patterns: ["roles & responsibilities", "responsibilities", "roles"],
    handler: () => `### Roles & Responsibilities

• End-to-end system architecture design and implementation.
• Writing clean, strictly typed, and thoroughly tested code.
• Optimizing inference latency and database query throughput.`
  },
  {
    id: "leadership_experience",
    exactMatches: ["leadership experience", "lead experience", "team leadership"],
    patterns: ["leadership experience", "team leadership experience", "lead experience"],
    handler: () => `### Leadership Experience

Led academic project teams, conducted peer workshops on Transformer math and RAG architectures, and actively mentored junior students in Python and web development.`
  },
  {
    id: "teamwork_collaboration",
    exactMatches: ["teamwork", "collaboration", "working in a team", "agile"],
    patterns: ["team collaboration", "teamwork", "cross-functional collaboration", "agile"],
    handler: () => `### Team Collaboration & Dynamics

Values clear communication, modular API contracts, respectful code reviews, and proactive knowledge sharing using Agile/Scrum sprint methodologies.`
  },
  {
    id: "achievements",
    exactMatches: ["achievements", "achievements and recognition", "accomplishments", "summarize achievements"],
    patterns: ["achievements & recognition", "achievements", "accomplishments", "summarize achievements"],
    handler: () => `### Achievements & Recognition

• Triple-certified in Oracle Cloud Infrastructure (OCI).
• Hand-coded a complete Transformer model from scratch (NumPyGPT).
• Maintained 8.5 CGPA throughout engineering degree.`
  },
  {
    id: "awards",
    exactMatches: ["awards", "honors", "prizes"],
    patterns: ["awards", "honors", "recognition"],
    handler: () => `### Awards

• Top Academic Standing Award in Department of AI & ML.
• Certificate of Merit in Competitive Coding & Cloud Foundations.`
  },
  {
    id: "hackathons_competitions",
    exactMatches: ["hackathons", "competitions", "coding competitions", "hackathon experience"],
    patterns: ["hackathons", "competitions", "coding contests", "hackathon participation"],
    handler: () => `### Hackathons & Competitions

Participated in university and national-level AI hackathons, prototyping real-time agent memory engines and 3D interactive applications under strict time limits.`
  },

  // ==================== 13. PROBLEM SOLVING & BEHAVIORAL ====================
  {
    id: "biggest_challenge",
    exactMatches: ["biggest challenge", "greatest challenge", "hardest problem", "difficult situation"],
    patterns: ["biggest challenge", "greatest challenge", "hardest technical problem", "difficult situation"],
    handler: () => `### Biggest Technical Challenge

Implementing real-time contradiction detection in AtlasOS without introducing unacceptable latency; solved using background Celery workers and multi-tier Redis caching.`
  },
  {
    id: "debugging_experience",
    exactMatches: ["debugging experience", "how do you debug", "debugging story", "problem solving"],
    patterns: ["debugging experience", "how you debug", "debugging approach", "problem solving"],
    handler: () => `### Debugging Experience

Systematic isolation using unit tests, logging tensor shapes and gradient norms, and reproducing race conditions locally with mocked datasets.`
  },
  {
    id: "failure_story",
    exactMatches: ["failure story", "tell me about a failure", "mistake you made", "lessons learned"],
    patterns: ["failure & learning", "failure story", "mistake and learning", "lessons learned"],
    handler: () => `### Failure & Learning

Early versions of AtlasOS attempted synchronous NLI checking on the main thread, causing API timeouts. Re-architected into asynchronous background queues.`
  },
  {
    id: "success_story",
    exactMatches: ["success story", "proudest moment", "greatest success"],
    patterns: ["success story", "proudest accomplishment", "greatest success"],
    handler: () => `### Success Story

Successfully training NumPyGPT to overfit a sample text corpus and seeing the attention weight heatmaps visually light up with syntactically correct activations.`
  },
  {
    id: "leadership_behavioral",
    exactMatches: ["leadership", "leadership style", "lead a team"],
    patterns: ["leadership example", "leadership style", "leadership"],
    handler: () => `### Leadership Example

Leads by example: setting up rigorous TypeScript types, automated testing pipelines, and clear architectural documentation.`
  },
  {
    id: "conflict_resolution",
    exactMatches: ["conflict resolution", "how do you handle conflict", "disagreement"],
    patterns: ["conflict resolution", "handling disagreements", "conflict in team"],
    handler: () => `### Conflict Resolution

Anchors debates in empirical benchmarks and data rather than subjective opinions; builds quick prototypes to test contrasting approaches.`
  },
  {
    id: "handling_pressure",
    exactMatches: ["handling pressure", "working under pressure", "pressure", "pressure handling", "deadline management"],
    patterns: ["working under pressure", "handling pressure", "stress management", "deadline management"],
    handler: () => `### Working Under Pressure

Breaks complex problems into discrete, prioritised milestones and focuses on high-impact MVP deliverables.`
  },

  // ==================== 14. GITHUB & OPEN SOURCE ====================
  {
    id: "github",
    exactMatches: ["github", "git", "github link", "github account"],
    patterns: ["github profile", "github account", "github link"],
    handler: () => `### GitHub Profile

• 🐙 **Primary Profile**: [github.com/kartik-012](https://github.com/kartik-012)
• 🐙 **Secondary Profile**: [github.com/kartikraikar2005](https://github.com/kartikraikar2005)`
  },
  {
    id: "github_profile",
    exactMatches: ["github profile", "github repositories", "repos", "open project repository"],
    patterns: ["github repositories", "github profile", "github repos", "project repository"],
    handler: () => `### GitHub Repositories

1. 🌐 **Atlas AI Resume**: [github.com/kartik-012/Atlas-AI-Resume](https://github.com/kartik-012/Atlas-AI-Resume)
2. 🌌 **AtlasOS**: [github.com/kartik-012/AtlasOS](https://github.com/kartik-012/AtlasOS)
3. ⚖️ **Debate Arena**: [github.com/kartikraikar2005/debate-arena](https://github.com/kartikraikar2005/debate-arena)
4. 🐍 **NumPyGPT**: [github.com/kartikraikar2005/numpygpt](https://github.com/kartikraikar2005/numpygpt)
5. 📊 **RagaAI Catalyst**: [github.com/kartikraikar2005/ragaai-catalyst](https://github.com/kartikraikar2005/ragaai-catalyst)`
  },
  {
    id: "repositories",
    exactMatches: ["repositories", "code repositories", "all repos"],
    patterns: ["code repositories", "repositories", "codebases"],
    handler: () => `### Code Repositories

Explore Kartik's open-source projects on GitHub with full documentation, architectural diagrams, and installation scripts.`
  },
  {
    id: "coding_profile",
    exactMatches: ["coding profile", "coding profiles", "cp profile", "dsa", "leetcode", "coding skills"],
    patterns: ["coding profiles", "coding profile", "competitive coding profile", "leetcode profile"],
    handler: () => `### Coding Profiles & DSA

• **GitHub**: [github.com/kartik-012](https://github.com/kartik-012) & [github.com/kartikraikar2005](https://github.com/kartikraikar2005)
• **LeetCode / DSA**: Active problem solver focusing on Arrays, Dynamic Programming, Graphs, and Trees.`
  },
  {
    id: "open_source",
    exactMatches: ["open source", "open source contributions", "foss"],
    patterns: ["open source contributions", "open source", "contributions"],
    handler: () => `### Open Source Contributions

All of Kartik's major projects (AtlasOS, NumPyGPT, Debate Arena, Atlas AI Resume) are released as open-source codebases with permissive Apache-2.0 / MIT licenses.`
  },
  {
    id: "contributions",
    exactMatches: ["contributions", "github contributions", "github statistics"],
    patterns: ["github contributions", "contributions", "commit history", "github statistics"],
    handler: () => `### GitHub Contributions & Activity

Maintains regular commit activity across multiple AI and full-stack repositories, focusing on modular architecture, strict typing, and comprehensive README documentation.`
  },

  // ==================== 15. CERTIFICATIONS ====================
  {
    id: "certifications",
    exactMatches: ["certifications", "certificates", "credentials", "licenses", "summarize certifications"],
    patterns: ["certifications", "13 certifications", "credentials", "summarize certifications"],
    handler: () => `### Certifications

• ☁️ **Oracle (3x)**: OCI AI Foundations, OCI GenAI Professional, OCI Foundations (Sep 2025)
• ⚡ **AWS**: Fundamentals of Machine Learning and AI (Jun 2026)
• 🔷 **Microsoft**: Introduction to Azure: Describe Cloud Concepts (Aug 2025)
• 🔒 **Cisco**: Introduction to Cybersecurity (Jun 2026)
• 📊 **Deloitte**: Data Analytics Job Simulation (Forage ID: 68dcdda956c19017e850b83f)
• 🏢 **Tata (3x)**: GenAI Data Analytics, Data Visualisation, Cybersecurity Analyst
• ⚙️ **IBM, TCS & GreatStack**: Process Mining (IBM), Career Edge (TCS), Full Stack Food Delivery (GreatStack)`
  },
  {
    id: "oracle_certifications",
    exactMatches: ["oracle certifications", "oracle", "oci certs", "oci"],
    patterns: ["oracle cloud certifications", "oracle certifications", "oci"],
    handler: () => `### Oracle Cloud Certifications

1. ☁️ **OCI 2025 Certified Generative AI Professional**: Validates fine-tuning LLMs, RAG pipelines, OCI GenAI service, and vector embeddings.
2. 🤖 **OCI 2025 Certified AI Foundations Associate**: Validates ML algorithms, Generative AI fundamentals, and OCI AI tools.
3. 🏛️ **OCI 2025 Certified Foundations Associate**: Validates OCI compute, networking, security, and storage architecture.`
  },
  {
    id: "cloud_certifications",
    exactMatches: ["cloud certifications", "cloud certs"],
    patterns: ["cloud certifications", "cloud certs", "cloud credentials"],
    handler: () => `### Cloud Certifications

• **Oracle Cloud (OCI)**: Triple Certified (GenAI Pro, AI Foundations, Foundations)
• **Amazon Web Services (AWS)**: Fundamentals of Machine Learning and AI
• **Microsoft Azure**: Introduction to Azure Cloud Concepts`
  },
  {
    id: "ai_certifications",
    exactMatches: ["ai certifications", "ai certs", "machine learning certifications"],
    patterns: ["ai certifications", "ai certs", "ml certifications"],
    handler: () => `### AI Certifications

• Oracle OCI 2025 Certified Generative AI Professional
• Oracle OCI 2025 Certified AI Foundations Associate
• AWS Fundamentals of Machine Learning and AI
• Tata GenAI-Powered Data Analytics Certification`
  },
  {
    id: "latest_certification",
    exactMatches: ["latest certification", "most recent cert", "newest certificate"],
    patterns: ["latest certification", "most recent certification", "newest cert"],
    handler: () => `### Latest Certification

**Oracle Cloud Infrastructure 2025 Certified Generative AI Professional** (Earned Sep 2025), validating enterprise fine-tuning, RAG design, and vector databases.`
  },
  {
    id: "certification_timeline",
    exactMatches: ["certification timeline", "future certifications", "certification statistics"],
    patterns: ["certification timeline", "future certifications", "certification statistics"],
    handler: () => `### Certification Timeline & Journey

• **2025**: Oracle OCI GenAI Professional, OCI AI Foundations, OCI Foundations, Azure Cloud Concepts, Deloitte Data Analytics.
• **2026**: AWS Machine Learning & AI Fundamentals, Cisco Cybersecurity, Tata GenAI Analytics.
• **Upcoming Focus**: Kubernetes CKA & AWS Solutions Architect Associate.`
  },

  // ==================== 16. PORTFOLIO & CONTACT ====================
  {
    id: "portfolio",
    exactMatches: ["portfolio", "portfolio website", "personal website", "portfolio projects", "portfolio technologies"],
    patterns: ["portfolio website", "portfolio", "online portfolio", "portfolio projects"],
    handler: () => `### Portfolio Website

• 🌐 **Live Website**: [kartik-raikar.dev](https://kartik-raikar.dev)
• 🚀 **Interactive Features**: Built-in RAG AI representative, interactive PDF resume viewer, Recruiter Telemetry Console, and project live demos.`
  },
  {
    id: "linkedin",
    exactMatches: ["linkedin", "linkedin profile", "linkedin link"],
    patterns: ["linkedin profile", "linkedin", "linkedin link"],
    handler: () => `### LinkedIn Profile

• 💼 **Profile URL**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)
• **Handle**: \`@kartik-raikar-kr\`
• **Status**: Open to AI/ML Engineering and Full-Stack Developer opportunities.`
  },
  {
    id: "linkedin_id",
    exactMatches: ["linkedin id", "linkdin id", "linkdin id?", "linkedin id?"],
    patterns: ["linkedin & professional profiles", "linkedin id", "linkdin id"],
    handler: () => `### LinkedIn & Professional Profiles

• 💼 **LinkedIn Profile**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)
  - **Handle / ID**: \`@kartik-raikar-kr\`
• 🐙 **GitHub**: [github.com/kartik-012](https://github.com/kartik-012)
• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 📱 **Phone**: [+91 8660910358](tel:+918660910358)`
  },
  {
    id: "email",
    exactMatches: ["email", "email address", "gmail", "e-mail"],
    patterns: ["email address", "email", "gmail"],
    handler: () => `### Email Address

• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• *Actively monitored with prompt responses to recruiter inquiries!*`
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
    exactMatches: ["contact", "contact details", "reach", "reach out", "how to contact you", "how to contact you?"],
    patterns: ["contact information", "contact details", "reach out", "contact kartik raikar"],
    handler: () => `### Contact Information

• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358)
• 💼 **LinkedIn**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)
• 🐙 **GitHub**: [github.com/kartik-012](https://github.com/kartik-012)
• 📍 **Location**: Belagavi, Karnataka, India`
  },
  {
    id: "schedule_interview",
    exactMatches: [
      "schedule interview", "schedule an interview", "book interview", "book an interview",
      "how to schedule an interview", "how to schedule an interview?", "schedule a meeting",
      "book a meeting", "schedule a call", "book a call", "set up an interview",
      "contact for interview", "interview availability"
    ],
    patterns: [
      "schedule an interview", "schedule interview", "book interview", "book an interview",
      "how to schedule", "schedule a meeting", "book a meeting", "schedule a call",
      "set up an interview", "interview scheduling"
    ],
    handler: () => `### Schedule an Interview

Thank you for your interest in connecting with **Kartik Raikar**! He is actively open to full-time AI/ML and software engineering roles, technical screenings, and recruiter discussions.

#### 📅 Availability & Preferences:
• **Notice Period**: Immediate / Open for immediate joining
• **Work Modes**: Hybrid, On-site, or Remote
• **Preferred Timezone**: IST (UTC+5:30) / Flexible across global timezones

#### 📬 Direct Contact Channels:
• 📧 **Email**: [kartikraikar2005@gmail.com](mailto:kartikraikar2005@gmail.com)
• 📱 **Phone / WhatsApp**: [+91 8660910358](tel:+918660910358)
• 💼 **LinkedIn**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)
• 🐙 **GitHub**: [github.com/kartik-012](https://github.com/kartik-012)
• 📍 **Location**: Belagavi, Karnataka, India (Open to relocate)

*Feel free to drop an email with your proposed date/time or role description, and Kartik will respond promptly.*`
  },

  // ==================== 17. HR QUESTIONS ====================
  {
    id: "why_hire_kartik",
    exactMatches: [
      "why should we hire you", "why should we hire you?", "why should i hire you",
      "why are you the right candidate", "why should i shortlist you", "what makes you different",
      "what value can you bring"
    ],
    patterns: ["why hire", "why should we hire", "reasons to hire", "why you", "pitch yourself", "right candidate", "shortlist you"],
    handler: () => `### Why Hire Kartik Raikar? (Top 5 Reasons)

1. 🛠️ **Systems-Level AI Rigor**: Hand-coded Transformer architecture from first principles in **NumPyGPT** without PyTorch/TensorFlow.
2. 🧠 **Production AI Infrastructure**: Architected **AtlasOS**, a multi-tenant AI Memory OS with active RoBERTa contradiction detection.
3. 🛡️ **AI Reliability & Safety**: Built **RagaAI Catalyst** scoring Faithfulness (99.4%) and Hallucination metrics.
4. ⚡ **Modern Full-Stack Fluency**: FastAPI async, React 19, Three.js 3D, PostgreSQL RLS, and Qdrant Vector DB.
5. 📜 **Proven Track Record**: 8.5 CGPA with 13 verified certifications (Oracle, AWS, Azure, Cisco, Deloitte).

*Would you like to schedule an interview or view his GitHub repositories?*`
  },
  {
    id: "strengths",
    exactMatches: ["strengths", "what are your strengths", "key strengths"],
    patterns: ["strengths", "key strengths", "greatest strengths"],
    handler: () => `### Strengths

1. **First-Principles Understanding**: Deep grasp of underlying ML math and system mechanics.
2. **Speed of Execution**: Rapid prototyping from algorithmic concept to production microservices.
3. **End-to-End Ownership**: Comfortable building everything from 3D WebGL interfaces to PostgreSQL RLS database policies.
4. **Relentless Curiosity**: Proven track record of self-driven learning and 13 certifications.`
  },
  {
    id: "weaknesses",
    exactMatches: ["weaknesses", "what are your weaknesses"],
    patterns: ["weaknesses", "weakness"],
    handler: () => `### Weaknesses

• **Tendency to Over-Engineer**: Sometimes aims to build from scratch (like NumPyGPT) when existing tools suffice; addresses this by enforcing strict MVP project scope timelines.`
  },
  {
    id: "why_this_company",
    exactMatches: ["why this company", "why our company", "why do you want to join us"],
    patterns: ["why this company?", "why this company", "why join our company"],
    handler: () => `### Why This Company?

Kartik seeks organizations that tackle ambitious engineering challenges, value first-principles thinking, and provide an environment where high-throughput AI systems can be deployed to solve real-world problems.`
  },
  {
    id: "why_this_role",
    exactMatches: ["why this role", "why do you want this role", "why apply"],
    patterns: ["why this role?", "why this role", "why apply for this position"],
    handler: () => `### Why This Role?

Matches Kartik's passions: developing agentic architectures, optimizing inference pipelines, and engineering robust, low-latency full-stack applications.`
  },
  {
    id: "expected_salary",
    exactMatches: ["expected salary", "salary expectations", "compensation"],
    patterns: ["salary expectations", "expected salary", "ctc expectations"],
    handler: () => `### Salary Expectations

Open to competitive industry-standard compensation tailored to the role, location (or remote), and company structure, with high flexibility for top-tier learning and growth opportunities.`
  },
  {
    id: "relocation",
    exactMatches: ["relocation", "willing to relocate", "can you relocate"],
    patterns: ["relocation preferences", "relocation", "willing to relocate"],
    handler: () => `### Relocation Preferences

100% willing to relocate immediately across major tech hubs (Bengaluru, Hyderabad, Pune, Mumbai, Delhi-NCR) or work remotely across global timezones.`
  },
  {
    id: "notice_period",
    exactMatches: ["notice period", "availability", "when can you start", "start date"],
    patterns: ["availability & notice period", "notice period", "immediate availability"],
    handler: () => `### Availability & Notice Period

• **Notice Period**: **Immediate** (0 days).
• **Internships**: Available immediately for full-time / remote roles.
• **Full-Time**: Available for graduating 2027 cycle or early transition.`
  },
  {
    id: "five_year_plan",
    exactMatches: ["five year plan", "where do you see yourself in 5 years", "5 year plan"],
    patterns: ["five-year career plan", "where do you see yourself in 5 years", "5 years"],
    handler: () => `### Five-Year Career Plan

Aiming to grow into a Lead AI Systems Architect, spearheading core agent infrastructure, open-source AI frameworks, and distributed inference engines.`
  },
  {
    id: "motivation",
    exactMatches: ["motivation", "what motivates you", "what drives you"],
    patterns: ["motivation", "what motivates you", "what drives you"],
    handler: () => `### Motivation

The excitement of transforming abstract mathematical formulas into working, interactive software that empowers users and solves real-world bottlenecks.`
  },
  {
    id: "hobbies_interests",
    exactMatches: ["hobbies", "interests", "what do you do in free time"],
    patterns: ["hobbies & personal interests", "hobbies", "interests", "free time"],
    handler: () => `### Hobbies & Personal Interests

• Reading deep learning research papers and reproducing architectures in code.
• Competitive algorithmic coding and 3D WebGL graphics experimentation.
• Technology podcasts and open-source contribution.`
  },

  // ==================== 18. CLOUD & DATABASES ====================
  {
    id: "cloud_platforms",
    exactMatches: ["azure", "aws", "oracle cloud", "gcp", "docker", "kubernetes", "deployment pipeline"],
    patterns: ["cloud platforms", "oracle cloud infrastructure", "amazon web services", "microsoft azure", "google cloud platform", "docker containerization", "kubernetes"],
    handler: () => `### Cloud & DevOps Infrastructure

• ☁️ **Oracle Cloud (OCI)**: Triple certified (GenAI Pro, AI Foundations, Foundations).
• ⚡ **AWS**: Certified in ML & AI Fundamentals; experienced with EC2, S3, IAM.
• 🔷 **Microsoft Azure**: Certified in Azure Cloud Concepts.
• 🐳 **Docker & K8s**: Multi-stage container builds, Docker Compose, microservice deployment.`
  },
  {
    id: "databases_all",
    exactMatches: ["sql", "mysql", "postgresql", "mongodb", "pinecone", "chromadb", "faiss"],
    patterns: ["database technologies", "postgresql", "mysql", "mongodb", "pinecone", "chromadb", "faiss"],
    handler: () => `### Database Technologies (Relational, Document & Vector)

• 🐘 **PostgreSQL 15**: Row-Level Security (RLS) for multi-tenant isolation, CTEs, complex indexes.
• 🎯 **Vector Databases**: Qdrant Vector DB (primary), Pinecone, ChromaDB, FAISS.
• ⚡ **In-Memory**: Redis 7 for high-speed caching and working state TTLs.
• 🍃 **Document / Local**: MongoDB, Async SQLite.`
  },

  // ==================== 19. LEARNING & ANALYTICS ====================
  {
    id: "learning_journey",
    exactMatches: ["what are you learning", "what are you learning now", "current focus", "learning roadmap", "next project", "future plans"],
    patterns: ["current learning journey", "current focus", "future learning roadmap", "learning roadmap"],
    handler: () => `### Current Learning Journey & Roadmap

• **Current Focus**: Distributed inference optimization (vLLM, TensorRT-LLM, AWQ quantization).
• **Next Project**: Graph-RAG memory consolidation engine with multi-modal indexing.
• **Certifications in Progress**: Kubernetes CKA & AWS Solutions Architect Associate.`
  },
  {
    id: "summaries_analytics",
    exactMatches: [
      "summarize skills", "summarize projects", "technology timeline",
      "strongest technologies", "technology statistics", "project statistics"
    ],
    patterns: ["skills summary", "project summary", "technology growth timeline", "statistics"],
    handler: () => `### Comprehensive Engineering Summary

• **Projects**: 5 major production systems (Atlas AI Resume, AtlasOS, Debate Arena, NumPyGPT, RagaAI Catalyst).
• **Top Skills**: Python (95%), TypeScript (90%), FastAPI, React 19, Qdrant Vector DB, PostgreSQL (RLS), Redis.
• **Certifications**: 13 Verified Credentials (Oracle 3x, AWS, Azure, Cisco, Deloitte).
• **Academic Record**: 8.5 CGPA in B.E. AI & ML at Jain College of Engineering (VTU).`
  },

  // ==================== 20. SMART AI REASONING & RECOMMENDATIONS ====================
  {
    id: "smart_recommendations",
    exactMatches: [
      "which project best matches an ai engineer role", "which project should i see first",
      "which project is most impressive", "which project has highest business impact",
      "which certification is most valuable", "which skills are strongest",
      "compare atlasos vs debate arena", "compare all projects", "explain projects from easiest to hardest",
      "recommend best project", "recommend certification", "recommend learning path", "recommend next project"
    ],
    patterns: [
      "best project for ai engineer", "most impressive project", "compare atlasos vs debate arena",
      "project difficulty ranking", "best project recommendation", "recommend certification"
    ],
    handler: () => `### Smart Project & Career Recommendations

• 🥇 **Best for AI / ML Systems**: **AtlasOS** — Demonstrates multi-tenant vector memory, local RoBERTa NLI contradiction detection, and production FastAPI architecture.
• 🧠 **Best for Deep Learning Rigor**: **NumPyGPT** — Proves zero-framework mastery by building a complete GPT Transformer from scratch in pure NumPy.
• 🎨 **Best for Full-Stack & 3D**: **Debate Arena** — Showcases real-time WebSocket orchestration and 3D WebGL rendering with React Three Fiber.
• 📜 **Most Valuable Certification**: **Oracle OCI GenAI Professional** (Enterprise fine-tuning, RAG, and vector search).`
  },

  // ==================== 21. JOB DESCRIPTION ANALYSIS ====================
  {
    id: "job_description_analysis",
    exactMatches: [
      "analyze this job description", "compare my resume with this job description",
      "calculate ats score", "missing skills", "interview probability", "skill gap analysis",
      "recommend improvements", "explain why i match this role", "match my resume with this jd"
    ],
    patterns: [
      "analyze this job description", "job description matching", "ats score",
      "skill gap analysis", "why i match this role", "resume vs job description analysis"
    ],
    handler: () => `### Job Description (JD) Analysis Engine

Kartik's profile provides **high alignment (90%+ ATS match)** for:
• **AI / ML Engineer**: Strong in Transformers (NumPyGPT), RAG (Atlas AI Resume), Evaluation (RagaAI Catalyst).
• **Full-Stack AI Developer**: Production FastAPI, React 19, Next.js 14, PostgreSQL (RLS), Redis 7, Qdrant Vector DB.
• **Backend Systems Engineer**: High-concurrency async handlers, microservices, Docker, sub-45ms latency architecture.

*Paste any Job Description directly in the chat to see a custom point-by-point alignment breakdown!*`
  },

  // ==================== 22. MOCK INTERVIEW MODES ====================
  {
    id: "mock_interview",
    exactMatches: [
      "interview me", "conduct hr interview", "conduct technical interview",
      "conduct ai engineer interview", "conduct python interview", "conduct system design interview",
      "ask coding questions", "ask behavioral questions", "evaluate my answers", "give interview feedback",
      "ask technical questions", "ask hr questions"
    ],
    patterns: [
      "mock interview", "ai mock interview", "technical interview mode", "hr interview mode",
      "conduct interview", "interview feedback", "coding questions"
    ],
    handler: () => `### AI Mock Interview Simulator

Welcome to Kartik Raikar's interactive interview simulator! 

**Select your interview mode:**
1. 🧠 **AI / RAG Technical Screen**: "Explain how multi-head attention prevents loss of positional context."
2. ⚡ **Backend & System Design**: "How would you design a multi-tenant memory cache in Redis with RLS?"
3. 👥 **HR & Behavioral STAR**: "Tell me about a time you solved a high-latency system bottleneck."

*Type your answer or select a topic to begin!*`
  },

  // ==================== 23. RECRUITER ASSISTANT ====================
  {
    id: "recruiter_assistant",
    exactMatches: [
      "should we hire kartik", "is kartik a good fit", "why shortlist kartik",
      "hiring recommendation", "strengths for this role", "concerns before hiring",
      "interview focus areas"
    ],
    patterns: [
      "should we hire kartik", "hiring recommendation", "is kartik a good fit",
      "recruiter summary", "strengths for this role"
    ],
    handler: () => `### Executive Recruiter Briefing & Hiring Recommendation

• **Recommendation**: **Strong Hire / Immediate Shortlist**
• **Top Strengths**:
  1. Hand-coded Transformer architecture from first principles (NumPyGPT).
  2. Production multi-tenant AI Memory OS (AtlasOS) with RoBERTa NLI.
  3. 13 Verified Certifications (Oracle Triple Certified, AWS, Azure, Cisco, Deloitte).
  4. 8.5 CGPA academic excellence with immediate availability.
• **Suggested Technical Deep-Dive Areas**:
  - Attention math and gradient backprop in NumPyGPT.
  - Multi-tenant Row-Level Security in PostgreSQL.
  - Local NLI contradiction mitigation in AtlasOS.`
  },

  // ==================== 24. ADVANCED AI FEATURES & TOOLS ====================
  {
    id: "advanced_ai_features",
    exactMatches: [
      "generate cover letter", "generate referral request", "generate thank you email",
      "create cold email", "generate linkedin message", "explain my resume for hr",
      "explain my resume technically", "explain any project in beginner mode",
      "explain any project in intermediate mode", "explain any project in expert mode",
      "answer with resume evidence", "answer with github evidence", "answer with portfolio evidence",
      "answer with certification evidence", "show supporting documents", "open live demo"
    ],
    patterns: [
      "cover letter", "referral request", "thank you email", "cold email",
      "linkedin message", "explain my resume for hr", "explain my resume technically",
      "beginner mode", "expert mode", "resume evidence", "github evidence", "live demo"
    ],
    handler: () => `### Advanced AI Assistant & Outreach Tools

• ✉️ **Cover Letter / Cold Outreach**: Generates tailored outreach pitches highlighting Kartik's projects and 13 certifications.
• 📑 **Verified Evidence**: All responses cite verified links directly to Kartik's GitHub repositories, PDF resume, and live demos.
• 🎯 **Multi-Level Explanations**: Ask me to explain any project in *Beginner*, *Intermediate*, or *Expert Systems* level!

*How would you like me to tailor your response?*`
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
