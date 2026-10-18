# Atlas AI Resume — "Talk with my Resume"

Atlas AI Resume is a production-quality, ultra-premium, full-stack AI Resume Portal. Designed with a futuristic dark glassmorphic design and smooth micro-interactions, the portal allows engineering recruiters and hiring managers to explore Kartik Raikar's resume interactively, view high-fidelity printable layouts, inspect real-time SRE architecture blueprints, and chat with **Atlas AI**—an intelligent agent trained on his verified credentials, real-world internships, systems engineering projects, and architectural pillars.

## 🏛️ What 99% of Common Projects Do vs. What the Top 1% Production IT Standard Does

Atlas AI Resume and Kartik's AI engineering portfolio are architected to demonstrate top-tier production enterprise standards across the **6 Core Pillars of Production RAG**:

| # | RAG Architectural Pillar | What 99% of Common AI Projects Do | Top 1% Production IT Standard (Kartik's Implementations) |
|---|---|---|---|
| **1** | **Ingestion & Chunking** | Fixed-size token chunking (`chunk_size=512, overlap=50`) slicing sentences mid-thought. | **Hierarchical AST Parent-Document Chunking**: 100-word child chunks for high-resolution vector search, 600-word AST parent chunks for LLM synthesis. |
| **2** | **Hybrid Retrieval** | Dense cosine similarity only; misses exact acronyms, error codes, and IDs. | **Hybrid BM25 + Dense RRF ($k=60$)**: Merges Okapi BM25 keyword matching with dense HNSW vector search to eliminate vocabulary mismatch. |
| **3** | **Re-ranking & Ordering** | Top-$k$ vector distance passed directly to LLM; suffers from the "Lost in the Middle" phenomenon. | **Cross-Encoder Re-ranking**: Full joint query-document cross-attention scoring with Pareto-optimal latency (<37ms). |
| **4** | **Self-Correction & Verification** | Blind single-pass generation; hallucinated answers delivered with high confidence. | **Corrective RAG (CRAG)**: Tripartite relevance grading (`CORRECT`, `AMBIGUOUS`, `INCORRECT`), query rewriting, and fallback to semantic cache. |
| **5** | **Latency & Token Economics** | Repeated LLM invocations costing \$0.03-\$0.12/query and 1.5s-3.5s latency. | **Sub-millisecond Semantic Cache ($\ge 0.96$) & Router Gating**: Bypasses LLM for recurring queries with Shannon entropy router ($H(X) \le 1.25$). |
| **6** | **Security & Observability** | No prompt injection defense, no PII redaction, zero telemetry. | **0.8µs Outbound Shannon DLP, SHA-256 Saga Rollbacks & OpenTelemetry**: Real-time flamegraphs, Luhn checksums, and reversible state transitions. |



## 🚀 Key Features

- **Interactive High-Fidelity PDF Viewer**: Typeset responsive resume with page pagination, real-time keyword highlights, zoom controls, and a direct download/print trigger.
- **Experience & Internships Console**:
  - **SPARK IIT (Summer Research AI Intern)**: Time-series AQI modeling across 29,531 records (-64.3% RMSE / -67.6% MAE with Prophet vs SARIMAX) & AI resume screening pipeline.
  - **Cognifyz Technologies (ML Intern)**: Supervised ML pipelines, cross-validation, and predictive feature modeling.
- **5 Flagship Systems Showcase**:
  - **Atlas AI Resume**: Production interactive RAG portal with Recruiter Telemetry Console & KB Studio.
  - **AIOps Root Cause Correlator**: Resolves cascading alert storms in `<45ms` MTTR with 100% Top-1 RCA accuracy (MicroRCA++ PageRank, Kafka KRaft 10K ring buffer, Linux eBPF).
  - **VersionRAG**: Eliminates deprecated API hallucinations (62.5% → 0.0%) and achieves 98.4% retrieval precision with version-partitioned HNSW indexing.
  - **Autonomous GitHub Agent Gateway (MCP)**: Zero blind state corruption (14.0% → 0.0%), 100% intent classification, 0.8µs Outbound Shannon entropy DLP, and SHA-256 Saga rollback journal.
  - **ApexRAG Benchmark**: Enterprise zero-cost RAG harness across 2,580 chunks, AST parent-doc chunking, CRAG self-correction, and `<37ms` latency.
- **9 Verified Industry Certifications Directory**:
  1. Hugging Face: *Fundamentals of Agents (Agents Course)* (2026)
  2. Oracle: *Agentic AI Certified Foundations Associate* (2026)
  3. Oracle: *AI Vector Search Certified Professional* (2026)
  4. Cognifyz Technologies: *Machine Learning Internship (1-Month Intensive)* (2026)
  5. LinkedIn Learning: *Apache Kafka Essential Training: Building Scalable Applications* (2026)
  6. AWS Training & Certification: *Fundamentals of Machine Learning and Artificial Intelligence* (2026)
  7. Microsoft Azure: *Describe Cloud Computing* (2026)
  8. Deloitte (Forage): *Data Analytics Job Simulation* (2026)
  9. Tata Group (Forage): *GenAI Powered Data Analytics Job Simulation* (2026)
- **Competitive Programming & Hackathons**:
  - **LeetCode**: 104 Problems Solved (30 Easy / 50 Medium / 24 Hard).
  - **Hack2Future 2.0 (IIIT Dharwad - Nokia Track)**: Top 60 Finalist out of 570+ national teams (Built KubeShield).
  - **Leadership**: Vice President of the AI & ML Department at Jain College of Engineering (8.50 CGPA).
- **Recruiter Telemetry Console**:
  - Real-time telemetry tracking visits, questions asked, project exploration, resume downloads, and session durations with interactive SVG area charts.
- **RAG Knowledge Base Studio**:
  - Interactive admin interface to drag-and-drop custom text or documents to chunk, embed, and test live retrieval.
- **Floating AI Chatbot (Atlas AI)**:
  - Streaming responses via Server-Sent Events (SSE).
  - Dual-engine retrieval with dynamic confidence scoring and clickable source citations.
  - Markdown tables, lists, and syntax-highlighted code blocks.

---

## 🛠️ Full-Stack Technology Stack

### Frontend Architecture
- **React 19** & **Vite**: Ultra-fast hot-reloading development and static generation.
- **TypeScript**: Complete strict type-safety across components and data interfaces.
- **Tailwind CSS v4**: Hardware-accelerated fluid utility grids and dark glassmorphic styling.
- **Lucide React**: Vector indicators and status badges.

### Backend & RAG Pipeline
- **Express.js (Node 20+)**: High-performance, low-latency API proxy and asset server.
- **Gemini AI API (`gemini-2.5-flash` / `gemini-3.5-flash`)**: Orchestrates semantic responses, role constraints, and factual compliance.
- **Vector Embeddings (`gemini-embedding-2-preview`)**: Dynamically chunks and embeds resume assets during server startup or admin uploads.
- **Dual-Engine Search**: Performs cosine similarity vector lookups with automatic fallback to keyword term overlap to guarantee offline reliability.
- **Server-Sent Events (SSE)**: Streams chatbot responses word-by-word with sub-40ms TTFT.

---

## 📂 Project Directory Structure

```text
/
├── server.ts                    # Full-stack Express.js server (APIs + RAG + Analytics + SSE)
├── index.html                   # HTML entrypoint
├── package.json                 # Dependency manifests and build scripts
├── tsconfig.json                # TS compiler configuration
├── vite.config.ts               # Vite bundler options
├── .env.example                 # Environment configuration template
│
└── src/
    ├── main.tsx                 # Client entrypoint
    ├── App.tsx                  # Master UI view coordinator and tracking manager
    ├── index.css                # Tailwind CSS core directives
    │
    ├── data/
    │   ├── resumeData.ts        # Single source of truth for Kartik's verified credentials
    │   └── chatbotIntents.ts    # Comprehensive offline intent engine & fallback patterns
    │
    └── components/
        ├── Navbar.tsx           # Glassmorphic top navigation header
        ├── PDFViewer.tsx        # High-fidelity document viewer with real-time text highlight
        ├── Dashboard.tsx        # Projects, Experience, Credentials, Telemetry, & SRE Blueprints
        ├── DriveExplorer.tsx    # Interactive Knowledge Base & mock file explorer
        └── Chatbot.tsx          # Floating assistant panel, RAG streaming client, and markdown parser
```

---

## ⚙️ Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kartik-012/Atlas-AI-Resume.git
   cd Atlas-AI-Resume
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root directory (using `.env.example` as a template):
   ```env
   # Your Google AI Studio API Key (for Gemini and embeddings)
   GEMINI_API_KEY="AIzaSy..."
   
   # Current Deployment Port / URL
   PORT=3000
   APP_URL="http://localhost:3000"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   *The server runs on port 3000, hosting both the backend REST endpoints and the client-side compiler.*

5. **Type check & Production build**:
   ```bash
   npx tsc --noEmit
   npm run build
   npm start
   ```

---

## ☁️ Production Deployment

### Option A: Unified Node.js Server (Render / Cloud Run / Railway)
The project compiles frontend assets into `dist/` and the server into `dist/server.js`:
- Build Command: `npm run build`
- Start Command: `npm start`
- Inject Environment Variable: `GEMINI_API_KEY`

### Option B: Decoupled Deploy (Vercel Frontend + Render Backend)
- **Frontend (Vercel)**:
  - Framework Preset: `Vite`
  - Build Command: `npm run build`
  - Output Directory: `dist`
- **Backend (Render / Cloud Run)**:
  - Start command: `node dist/server.js`

---

## 🏆 Candidate Profile Summary

- **Candidate**: Kartik Raikar
- **Degree**: B.E. in Computer Science & Engineering (Artificial Intelligence & Machine Learning)
- **Institution**: Jain College of Engineering, Belagavi (VTU) — **8.50 CGPA**
- **Core Specialties**: Generative AI, RAG Architectures, Agentic Workflows, AIOps & SRE Telemetry, Vector Search.
- **GitHub**: [github.com/kartik-012](https://github.com/kartik-012)
- **LinkedIn**: [linkedin.com/in/kartik-raikar-kr](https://linkedin.com/in/kartik-raikar-kr)
- **LeetCode**: [leetcode.com/u/kartikraikar2005](https://leetcode.com/u/kartikraikar2005) (104 Solved)
