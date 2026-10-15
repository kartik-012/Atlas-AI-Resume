/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  techStack: string[];
  githubUrl: string;
  liveUrl: string;
  keyPoints: string[];
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  description: string;
  keyPoints: string[];
  technologies: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issuerKey: string;
  date: string;
  category: "ai" | "cloud" | "security" | "data" | "dev";
  credentialId?: string;
  skills: string[];
  description: string;
  brandColor: string;
}

export interface ResumeData {
  name: string;
  tagline: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  portfolio: string;
  summary: string;
  education: {
    degree: string;
    major: string;
    institution: string;
    period: string;
    university: string;
    cgpa: string;
  };
  preUniversity: {
    course: string;
    institution: string;
    period: string;
    percentage: string;
  };
  experience: Experience[];
  skills: {
    languages: string[];
    frontend: string[];
    backend: string[];
    aiMl: string[];
    database: string[];
    tools: string[];
    dataViz: string[];
    observability?: string[];
  };
  projects: Project[];
  achievements: Achievement[];
  certifications: Certification[];
  languages: string[];
  coursework: string[];
  codingProfiles: {
    platform: string;
    url: string;
    handle: string;
    stats?: string;
  }[];
}

export const resumeData: ResumeData = {
  name: "Kartik Raikar",
  tagline: "Talk with my Resume.",
  title: "AI Engineer — Generative AI — LLM Applications",
  email: "kartikraikar2005@gmail.com",
  phone: "+91 8660910358",
  location: "Belagavi, Karnataka, India",
  github: "https://github.com/kartik-012",
  linkedin: "https://www.linkedin.com/in/kartik-raikar-kr",
  portfolio: "https://kartikportfolio-eta.vercel.app/",
  summary: "AI Engineer specializing in Generative AI, LLMs, RAG, and AI evaluation. Experienced in building production-oriented AI applications using Python, FastAPI, React.js, SQL, vector databases, and modern LLM tooling.",
  education: {
    degree: "Bachelor of Engineering (B.E.)",
    major: "Computer Science & Engineering (AI & ML)",
    institution: "Jain College of Engineering, Belagavi",
    period: "Aug 2023 – Jul 2027",
    university: "Visvesvaraya Technological University (VTU)",
    cgpa: "8.50 / 10.0"
  },
  preUniversity: {
    course: "Pre-University Course (PCM)",
    institution: "Jain PU College, Belagavi",
    period: "2021 – 2023",
    percentage: "80%"
  },
  experience: [
    {
      id: "spark-iit",
      role: "AI Intern",
      company: "SPARK IIT",
      location: "Remote / India",
      period: "Jul 2026 – Sep 2026",
      description: "Spearheaded large-scale AQI environmental analytics, predictive time-series modeling, interactive visual intelligence dashboards, and automated AI resume-screening workflows.",
      keyPoints: [
        "Conducted large-scale Air Quality Index (AQI) analysis across 29,531 records spanning 26 Indian cities to identify critical pollution clusters and seasonal particulate trends.",
        "Engineered comparative Time-Series Forecasting models using Facebook Prophet and SARIMAX, reducing prediction error by 64.3% RMSE (from 249.54 to 89.03) and 67.6% MAE.",
        "Built an interactive multi-city Streamlit analytics dashboard for real-time pollution trend visualizer and automated health advisory warnings.",
        "Architected an AI-powered resume screening and candidate evaluation workflow integrating LLM extraction pipelines."
      ],
      technologies: ["Python", "Streamlit", "Prophet", "SARIMAX", "Pandas", "NumPy", "scikit-learn", "LLMs", "Matplotlib", "Seaborn"]
    }
  ],
  skills: {
    languages: ["Python", "JavaScript", "TypeScript", "SQL"],
    frontend: ["React.js", "Next.js", "TailwindCSS", "HTML5", "CSS3", "Vite", "Three.js"],
    backend: ["FastAPI", "Node.js", "Express.js", "FastMCP", "gRPC", "REST APIs", "WebSockets", "Server-Sent Events", "Pydantic", "PyGithub", "OpenAPI/Swagger"],
    aiMl: ["Generative AI", "LLMs", "RAG", "Transformers", "AI Evaluation", "Prompt Engineering", "BM25", "Reciprocal Rank Fusion (RRF)", "Cross-Encoder Reranking", "Semantic Search", "Vector Search", "scikit-learn", "PyTorch", "Sentence Transformers"],
    database: ["PostgreSQL", "pgvector", "MySQL", "MongoDB", "Redis", "Qdrant", "ChromaDB", "Apache Kafka (KRaft)"],
    tools: ["Git", "GitHub", "Docker", "Docker Compose", "Linux", "Linux eBPF", "Postman", "VS Code", "GitHub Actions", "Vercel", "Render"],
    observability: ["OpenTelemetry (OTLP)", "Prometheus", "OTel Waterfall Flamegraphs", "eBPF Probes"],
    dataViz: ["Pandas", "Streamlit", "Prophet", "SARIMAX", "Three.js", "Power BI", "Tableau", "Microsoft Excel"]
  },
  projects: [
    {
      id: "atlas-ai-resume",
      title: "Atlas AI Resume",
      techStack: ["React 19", "TypeScript", "Node.js", "Express", "Gemini API", "RAG", "Vector Search", "TailwindCSS", "Vite"],
      githubUrl: "https://github.com/kartik-012/Atlas-AI-Resume",
      liveUrl: "https://atlas-ai-resume.vercel.app/",
      description: "RAG-Powered AI Portfolio & Interactive Resume Assistant with Gemini, real-time Recruiter Telemetry Console, Benchmark Verifiers, and Knowledge Base Admin Studio.",
      longDescription: "Atlas AI Resume transforms standard static resumes into a living, intelligent conversational agent and comprehensive recruiter telemetry console. Built with a dual-mode RAG engine utilizing Google Gemini and vector cosine similarity search over localized knowledge chunks. Features real-time recruiter telemetry tracking visits, queries, and project interactions, plus an interactive Knowledge Base Studio allowing live chunk indexing, semantic search testing, and system diagnostics.",
      keyPoints: [
        "Architected dual-layer RAG pipeline with Gemini, local vector cosine similarity, and semantic keyword routing.",
        "Built interactive Recruiter Telemetry Console with real-time analytics, question monitoring, and token economics.",
        "Engineered Knowledge Base Admin Studio allowing dynamic chunk ingestion, embedding generation, and live retrieval diagnostics.",
        "Created interactive Benchmark Verifiers proof mode, JD Matcher with automated fit scoring, and 1-Click Executive Screening Packet generator.",
        "Implemented strict grounding rules and token-bucket rate limiter to prevent prompt injection and model hallucinations."
      ]
    },
    {
      id: "aiops-rca",
      title: "AIOps Root Cause Correlator – Incident Engine",
      techStack: ["Python", "FastAPI", "PostgreSQL", "pgvector", "Redis", "NetworkX", "Three.js", "WebSockets", "Apache Kafka (KRaft)", "Linux eBPF", "gRPC"],
      githubUrl: "https://github.com/kartik-012/aiops-rca",
      liveUrl: "https://aiops-rca.kartik.dev",
      description: "Autonomous incident correlation engine resolving cascading microservice alert storms in <45ms with 100% Top-1 RCA accuracy across 30 benchmark scenarios.",
      longDescription: "AIOps Root Cause Correlator is an autonomous incident correlation engine resolving cascading microservice alert storms in <45ms (down from ~2 hours of manual tracing), achieving 100% Top-1 RCA accuracy across 30 benchmark scenarios. It implements dynamic 24h Fourier harmonic EWMA anomaly detection (z > 2.0σ) with MicroRCA++ edge-weighted PageRank on causal dependency graphs, achieving 100% precision/recall in false-positive alert suppression. Traces Linux eBPF kernel probes (sys_enter_futex) for thread contention, streams telemetry over Kafka KRaft (10K ring buffer with 80% backpressure shed) and gRPC :50051, and employs an Online Thompson Sampling bandit for automated remediation with HMAC-SHA256 mobile canary approval. Backed by 118 unit & integration tests (100% pass rate).",
      keyPoints: [
        "Resolves cascading microservice alert storms in <45ms (down from ~2 hours of manual tracing) with 100% Top-1 RCA accuracy across 30 benchmark scenarios.",
        "Implemented dynamic 24h Fourier harmonic EWMA anomaly detection (z > 2.0σ) with MicroRCA++ edge-weighted PageRank on causal dependency graphs (100% false-positive suppression).",
        "Traced Linux eBPF kernel probes (sys_enter_futex contention) and streamed telemetry over Kafka KRaft (10K ring buffer with 80% backpressure) and gRPC :50051.",
        "Deployed Online Thompson Sampling bandit for automated remediation with HMAC-SHA256 mobile canary approval.",
        "Verified with 118 unit and integration tests passing at 100%."
      ]
    },
    {
      id: "versionrag",
      title: "VersionRAG – Documentation & Code Migration Intelligence",
      techStack: ["Python 3.12", "FastAPI", "PostgreSQL", "pgvector", "React 18", "TypeScript", "TailwindCSS", "Okapi BM25", "Cross-Encoder", "Docker"],
      githubUrl: "https://github.com/kartik-012/versionrag",
      liveUrl: "https://versionrag.kartik.dev",
      description: "Enterprise RAG resolving cross-version code contamination, eliminating hallucinated deprecated API calls from 62.5% to 0.0% via 3-stage hybrid retrieval.",
      longDescription: "VersionRAG is an enterprise RAG architecture that eliminates cross-version code contamination and drives hallucinated deprecated API calls from 62.5% to 0.0%. Features a 3-stage hybrid retrieval pipeline combining SQL version partition gates, parallel Okapi BM25 (k1=1.5, b=0.75), pgvector HNSW, Reciprocal Rank Fusion (RRF k=60), and Cross-Encoder reranking, boosting retrieval precision @k=6 from 41.7% to 98.4% (+136%) at 5.4ms latency. Engineered a structure-aware polyglot AST semantic diff engine across Python ast, JS/TS, and OpenAPI 3.x/Swagger 2.0 with ParamNode/ReturnTypeNode/ExceptionNode at 94.2% accuracy. Includes live codebase vulnerability scanner & auto-refactor workbench CLI (python -m app.cli audit), self-generating 3-Way Auto-RAGAS, Redis ZSET rate limiting, and 40 verified tests.",
      keyPoints: [
        "Eliminated cross-version code contamination, reducing hallucinated deprecated API calls from 62.5% to 0.0% via SQL version partition gates.",
        "Engineered 3-stage hybrid retrieval (BM25 + pgvector HNSW + RRF k=60 + Cross-Encoder), boosting retrieval precision @k=6 from 41.7% to 98.4% (+136%) at 5.4ms latency.",
        "Built structure-aware polyglot AST semantic diff engine across Python, JS/TS, and OpenAPI 3.x/Swagger 2.0 with 94.2% accuracy.",
        "Delivered live codebase vulnerability scanner & auto-refactor workbench CLI (python -m app.cli audit) and self-generating 3-Way Auto-RAGAS.",
        "Secured with Bcrypt-hashed OTP email auth and Redis ZSET sliding-window rate limiting across 40 unit/integration tests."
      ]
    },
    {
      id: "github-mcp-toolkit",
      title: "Autonomous GitHub Agent Gateway – MCP Governance Plane",
      techStack: ["Python", "FastMCP", "PyGithub", "Pydantic", "Docker", "GitHub Actions", "Redis"],
      githubUrl: "https://github.com/kartik-012/github-mcp-toolkit",
      liveUrl: "https://github-mcp.kartik.dev",
      description: "Zero-trust governance plane over Model Context Protocol (MCP), eliminating blind state corruption (14.0% to 0.0%) and achieving 100% intent classification.",
      longDescription: "Autonomous GitHub Agent Gateway is a zero-trust governance plane over the Model Context Protocol (MCP) for LLM-driven repository automation. Eliminates a measured 14.0% blind state corruption rate to 0.0% and delivers 100% intent classification accuracy across 100 scenarios. Implements a pure-Python Hybrid RRF (k=60) combining corpus TF-IDF with exact AST error-code matching (0MB ML footprint), sub-microsecond (0.8µs) Outbound DLP scanner using Shannon entropy H(X) >= 3.8 and ISO/IEC 7812 Luhn checksums to block credential leakage. Features a 2-phase preview token protocol with an append-only SHA-256 hash-chained Saga journal for out-of-order rollbacks by tx_id, RLock single-probe circuit breaker, and adaptive compactor slashing context bloat by -92.2% across 120 tests (100% pass rate).",
      keyPoints: [
        "Eliminated 14.0% blind state corruption to 0.0% and achieved 100% intent classification accuracy across 100 scenarios.",
        "Engineered pure-Python Hybrid RRF (k=60) combining corpus TF-IDF with exact AST error-code matching with 0MB ML footprint.",
        "Built 0.8µs Outbound DLP scanner using Shannon entropy H(X) >= 3.8 and ISO/IEC 7812 Luhn checksums to block secret exfiltration.",
        "Architected 2-phase preview token protocol + append-only SHA-256 hash-chained Saga journal for out-of-order rollbacks by tx_id.",
        "Implemented RLock single-probe circuit breaker and adaptive compactor slashing context bloat by -92.2% across 120 unit tests."
      ]
    },
    {
      id: "apexrag",
      title: "ApexRAG – Enterprise Zero-Cost RAG & Production Harness",
      techStack: ["Python", "FastAPI", "ChromaDB", "Sentence Transformers", "Ollama", "scikit-learn", "OpenTelemetry", "Prometheus", "Docker"],
      githubUrl: "https://github.com/kartik-012/apexrag",
      liveUrl: "https://apexrag.kartik.dev",
      description: "Production RAG harness with AST parent-document chunking, Corrective RAG (CRAG), hybrid BM25 + dense RRF, and <37ms Pareto-optimal latency.",
      longDescription: "ApexRAG is an enterprise zero-cost RAG harness and evaluation benchmark over 2,580 documentation chunks and 100 human-verified Q&A pairs on local CPU infrastructure. Employs hierarchical AST parent-document chunking (100-word child for high-res vector retrieval / 600-word parent for LLM context), hybrid BM25 + dense vector RRF (k=60), and Cross-Encoder reranking to achieve Pareto-optimal latency <37ms across 82 unit/integration tests (100% pass rate). Features Corrective RAG (CRAG) with self-reflective tripartite relevance grading, query reformulation, and sub-millisecond semantic cosine cache (>= 0.96). Deploys a dense strategy router with Shannon entropy gating (<= 1.25) + Bayesian Thompson Sampling bandit, multi-tenant clearance RBAC pre-filtering, dual-shield guardrails against PII and prompt injection, GitHub Actions CI/CD evaluation gate, OTel waterfall flamegraphs, and SSE streaming with TTFT <40ms.",
      keyPoints: [
        "Engineered AST parent-document chunking (100-word child / 600-word parent) and hybrid BM25 + dense vector RRF (k=60) + Cross-Encoder reranker (<37ms latency).",
        "Implemented Corrective RAG (CRAG) with self-reflective tripartite relevance grading, query reformulation, and sub-millisecond semantic cosine cache (>= 0.96).",
        "Deployed dense strategy router with Shannon entropy gating (<= 1.25) and Bayesian Thompson Sampling bandit.",
        "Enforced multi-tenant clearance RBAC pre-filtering and dual-shield guardrails against PII and prompt injection.",
        "Delivered GitHub Actions CI/CD evaluation gate, OTel waterfall flamegraphs, Prometheus metrics, and SSE streaming with TTFT <40ms across 82 tests."
      ]
    }
  ],
  achievements: [
    {
      id: "vice-president",
      title: "Vice President – AI & ML Department",
      description: "Elected Vice President of the Department of Artificial Intelligence & Machine Learning at Jain College of Engineering, Belagavi. Led departmental initiatives, technical symposiums, and coordinated academic programs.",
      icon: "🎖️"
    },
    {
      id: "hack2future",
      title: "Hack2Future 2.0 – IIIT Dharwad (Nokia Track)",
      description: "Selected among the Top 60 finalist teams out of 570+ national registrations. Built KubeShield — a graph-based Kubernetes attack-path visualizer and automated security audit tool during an intensive 36-hour hackathon.",
      icon: "🏆"
    },
    {
      id: "code-for-innovex",
      title: "Code for Innovex 2025 – NITTE NMAM IT",
      description: "Competed in Code for Innovex 2025, a prestigious 24-hour national-level hackathon organized by the NSS IT Wing at NMAM Institute of Technology, building rapid prototype AI solutions.",
      icon: "💻"
    },
    {
      id: "leetcode",
      title: "LeetCode Problem Solving – 104 Problems",
      description: "Solved 104 algorithmic problems on LeetCode demonstrating strong mastery of data structures, dynamic programming, graph traversal, and algorithmic optimization (Easy: 30, Medium: 50, Hard: 24).",
      icon: "⚡"
    }
  ],
  certifications: [
    {
      id: "hf-fundamentals-agents",
      title: "Fundamentals of Agents (Hugging Face Agents Course)",
      issuer: "Hugging Face",
      issuerKey: "huggingface",
      date: "2026",
      category: "ai",
      skills: ["Agentic AI", "ReAct Framework", "Tool Calling", "Autonomous Agents", "Hugging Face Hub"],
      description: "Comprehensive certification covering autonomous agent architectures, ReAct decision loops, multi-agent coordination, tool-calling mechanisms, and practical agent deployments.",
      brandColor: "#FFD21E"
    },
    {
      id: "oracle-agentic-ai",
      title: "Agentic AI Certified Foundations Associate",
      issuer: "Oracle",
      issuerKey: "oracle",
      date: "2026",
      category: "ai",
      skills: ["Agentic AI", "OCI AI Services", "Autonomous Workflows", "LLM Orchestration"],
      description: "Certified proficiency in enterprise agentic AI architectures, autonomous decision systems, goal decomposition, and OCI foundation services.",
      brandColor: "#C74634"
    },
    {
      id: "oracle-ai-vector-search",
      title: "AI Vector Search Certified Professional",
      issuer: "Oracle",
      issuerKey: "oracle",
      date: "2026",
      category: "ai",
      skills: ["Vector Search", "HNSW Indexing", "Embedding Models", "Semantic Retrieval", "Database Vectors"],
      description: "Professional certification validating expertise in enterprise vector search, HNSW indexing algorithms, high-dimensional similarity math, and semantic retrieval optimization.",
      brandColor: "#C74634"
    },
    {
      id: "cognifyz-ml-internship",
      title: "Machine Learning Internship (1-Month Intensive)",
      issuer: "Cognifyz Technologies",
      issuerKey: "cognifyz",
      date: "2026",
      category: "ai",
      skills: ["Machine Learning", "Supervised Learning", "Feature Engineering", "Scikit-Learn", "Model Evaluation"],
      description: "Completed intensive practical machine learning curriculum covering exploratory data analysis, predictive modeling pipelines, feature selection, and rigorous cross-validation.",
      brandColor: "#3B82F6"
    },
    {
      id: "linkedin-kafka-scalable",
      title: "Apache Kafka Essential Training: Building Scalable Applications",
      issuer: "LinkedIn Learning",
      issuerKey: "linkedin",
      date: "2026",
      category: "dev",
      skills: ["Apache Kafka", "KRaft", "Event Streaming", "Distributed Messaging", "Pub/Sub Architecture"],
      description: "Comprehensive training in event-driven streaming, Kafka KRaft consensus, partition balancing, consumer groups, backpressure handling, and fault-tolerant message streaming.",
      brandColor: "#0A66C2"
    },
    {
      id: "aws-ml-ai-fundamentals",
      title: "Fundamentals of Machine Learning and Artificial Intelligence",
      issuer: "AWS Training & Certification",
      issuerKey: "aws",
      date: "2026",
      category: "ai",
      skills: ["Machine Learning", "Amazon SageMaker", "Amazon Bedrock", "Deep Learning", "Generative AI"],
      description: "Completed AWS Skill Builder specialized curriculum on core AI algorithms, neural network design, SageMaker pipelines, Bedrock foundation models, and cloud AI deployments.",
      brandColor: "#FF9900"
    },
    {
      id: "ms-azure-cloud",
      title: "Microsoft Azure: Describe Cloud Computing",
      issuer: "Microsoft",
      issuerKey: "microsoft",
      date: "2026",
      category: "cloud",
      skills: ["Cloud Architecture", "Azure Fundamentals", "Compute & Networking", "High Availability"],
      description: "Foundational certification verifying architectural concepts of cloud computing, high availability, fault tolerance, scalability, and Azure core infrastructure.",
      brandColor: "#0089D6"
    },
    {
      id: "deloitte-data-analytics",
      title: "Data Analytics Job Simulation",
      issuer: "Deloitte (Forage)",
      issuerKey: "deloitte",
      date: "2026",
      category: "data",
      skills: ["Data Analytics", "Business Intelligence", "Client Reporting", "Data Cleaning", "Tableau"],
      description: "Completed real-world corporate analytics simulation conducting data wrangling, executive dashboard creation, and strategic data-driven consulting recommendations.",
      brandColor: "#86BC25"
    },
    {
      id: "tata-genai-analytics",
      title: "GenAI Powered Data Analytics Job Simulation",
      issuer: "Tata Group (Forage)",
      issuerKey: "tata",
      date: "2026",
      category: "data",
      skills: ["Generative AI", "Data Analytics", "Prompt Engineering", "Data Modeling", "Executive Storytelling"],
      description: "Hands-on job simulation leveraging cutting-edge Generative AI to automate exploratory data analysis, generate executive insights, and structure analytics workflows.",
      brandColor: "#005691"
    }
  ],
  languages: ["English (Fluent)", "Kannada (Native)", "Hindi (Conversational)"],
  coursework: [
    "Data Structures & Algorithms",
    "Object-Oriented Programming",
    "Database Management Systems",
    "Data Science",
    "Operating Systems",
    "Computer Networks",
    "Software Engineering",
    "Artificial Intelligence",
    "Machine Learning"
  ],
  codingProfiles: [
    { platform: "LeetCode", url: "https://leetcode.com/u/kartikraikar2005", handle: "kartikraikar2005", stats: "104 Solved (30E / 50M / 24H)" },
    { platform: "GitHub", url: "https://github.com/kartik-012", handle: "kartik-012", stats: "Active Open-Source Contributor" },
    { platform: "HackerRank", url: "https://hackerrank.com/kartikraikar2005", handle: "kartikraikar2005", stats: "Verified Skill Badges" },
    { platform: "CodeChef", url: "https://codechef.com/users/kartikraikar", handle: "kartikraikar", stats: "Competitive Programmer" }
  ]
};
