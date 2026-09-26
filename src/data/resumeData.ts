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
  skills: {
    languages: string[];
    frontend: string[];
    backend: string[];
    aiMl: string[];
    database: string[];
    tools: string[];
    dataViz: string[];
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
  skills: {
    languages: ["Python", "JavaScript", "TypeScript", "SQL"],
    frontend: ["React.js", "Next.js", "TailwindCSS", "HTML5", "CSS3", "Vite"],
    backend: ["FastAPI", "Node.js", "Express.js", "REST APIs", "WebSockets", "Server-Sent Events"],
    aiMl: ["Generative AI", "LLMs", "RAG", "Transformers", "AI Evaluation", "Prompt Engineering", "Semantic Search", "Vector Search", "PyTorch", "Sentence Transformers"],
    database: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Qdrant"],
    tools: ["Git", "GitHub", "Docker", "Linux", "Postman", "VS Code", "GitHub Actions"],
    dataViz: ["Power BI", "Tableau", "Microsoft Excel"]
  },
  projects: [
    {
      id: "atlas-ai-resume",
      title: "Atlas AI Resume",
      techStack: ["React 19", "TypeScript", "Node.js", "Express", "Gemini API", "RAG", "Vector Search", "TailwindCSS", "Vite"],
      githubUrl: "https://github.com/kartik-012/Atlas-AI-Resume",
      liveUrl: "https://atlas-ai-resume.vercel.app/",
      description: "RAG-Powered AI Portfolio & Interactive Resume Assistant with Gemini, real-time Recruiter Telemetry Console, and dynamic Knowledge Base Admin Studio.",
      longDescription: "Atlas AI Resume transforms standard static resumes into a living, intelligent conversational agent and comprehensive recruiter telemetry console. Built with a dual-mode RAG engine utilizing Google Gemini and vector cosine similarity search over localized knowledge chunks. Features real-time recruiter telemetry tracking visits, queries, and project interactions, plus an interactive Knowledge Base Studio allowing live chunk indexing, semantic search testing, and system diagnostics.",
      keyPoints: [
        "Architected dual-layer RAG pipeline with Gemini and custom vector cosine similarity search.",
        "Built interactive Recruiter Telemetry Console with real-time analytics, question monitoring, and time-tracking.",
        "Engineered Knowledge Base Admin Studio allowing dynamic chunk ingestion, embedding generation, and live retrieval diagnostics.",
        "Created modern cyber-aesthetic interface with credential showcase, interactive skill visualizers, and recruiter invite drafter.",
        "Implemented strict grounding rules and token-bucket rate limiter to prevent prompt injection and model hallucinations."
      ]
    },
    {
      id: "aiops-rca",
      title: "AIOps Root Cause Correlator – Incident Engine",
      techStack: ["Python", "FastAPI", "PostgreSQL", "Redis", "NetworkX", "Three.js", "WebSockets", "pgvector"],
      githubUrl: "https://github.com/kartik-012/aiops-rca",
      liveUrl: "https://aiops-rca.kartik.dev",
      description: "Autonomous incident correlation engine resolving cascading microservice alert storms in 0.78s with 100% Top-1 RCA accuracy across 30 benchmark scenarios.",
      longDescription: "AIOps Root Cause Correlator is an autonomous incident correlation engine that resolves cascading microservice alert storms in 0.78s (down from 1–4 hours of manual tracing), achieving 100% Top-1 RCA accuracy across 30 benchmark scenarios. It implements dynamic EWMA anomaly detection (z > 2.0σ) with causal DAG traversal in NetworkX, isolating multi-root-cause failures with 100% precision/recall in false-positive alert suppression. Features a real-time 3D topology telemetry visualizer with Three.js/WebGL and streaming WebSockets, supporting counterfactual what-if blast radius simulation over PostgreSQL 16 + pgvector.",
      keyPoints: [
        "Resolves cascading microservice alert storms in 0.78s (down from 1–4 hours of manual tracing) with 100% Top-1 RCA accuracy across 30 benchmark scenarios.",
        "Implemented dynamic EWMA anomaly detection (z > 2.0σ) with causal DAG traversal in NetworkX, achieving 100% precision/recall in false-positive alert suppression.",
        "Built real-time 3D topology telemetry visualizer with Three.js/WebGL and streaming WebSockets for counterfactual what-if blast radius simulation.",
        "Leverages PostgreSQL 16 + pgvector for efficient vector similarity storage and retrieval.",
        "Designed for production-grade microservice environments with real-time incident response capabilities."
      ]
    },
    {
      id: "versionrag",
      title: "VersionRAG – Documentation Intelligence",
      techStack: ["Python 3.12", "FastAPI", "PostgreSQL", "pgvector", "React 18", "TypeScript", "Tailwind"],
      githubUrl: "https://github.com/kartik-012/versionrag",
      liveUrl: "https://versionrag.kartik.dev",
      description: "Enterprise RAG architecture resolving cross-version code contamination, eliminating hallucinated deprecated API calls from 62.5% to 0.0% via version-partitioned vector indexing.",
      longDescription: "VersionRAG is an enterprise RAG architecture that resolves cross-version code contamination, eliminating hallucinated deprecated API calls from 62.5% to 0.0% via database-enforced version-partitioned vector indexing. It features a structure-aware AST semantic diff engine detecting undocumented breaking changes with 94.2% accuracy, boosting retrieval precision @k=6 from 41.7% to 98.4% (+136%) at 5.4ms HNSW latency. Integrates a 4-step Chain-of-Version reasoning pipeline with live X-Ray diagnostic chunk inspection, Bcrypt-hashed OTP email auth, and resilient pgvector fallbacks.",
      keyPoints: [
        "Eliminated hallucinated deprecated API calls from 62.5% to 0.0% via database-enforced version-partitioned vector indexing.",
        "Engineered structure-aware AST semantic diff engine detecting undocumented breaking changes with 94.2% accuracy.",
        "Boosted retrieval precision @k=6 from 41.7% to 98.4% (+136%) at 5.4ms HNSW latency.",
        "Integrated 4-step Chain-of-Version reasoning pipeline with live X-Ray diagnostic chunk inspection.",
        "Implemented Bcrypt-hashed OTP email auth and resilient pgvector fallbacks for production reliability."
      ]
    },
    {
      id: "github-mcp-toolkit",
      title: "GitHub MCP Toolkit – Fault-Tolerant MCP Server",
      techStack: ["Python", "FastMCP", "GitHub API", "Ollama", "Docker", "GitHub Actions"],
      githubUrl: "https://github.com/kartik-012/github-mcp-toolkit",
      liveUrl: "https://github-mcp.kartik.dev",
      description: "Production-ready Anthropic Model Context Protocol (MCP) server for LLM-driven repository automation, semantic search, and deterministic issue triage with reversible write workflows.",
      longDescription: "GitHub MCP Toolkit is a production-ready Anthropic Model Context Protocol (MCP) server for LLM-driven repository automation, semantic search, and deterministic issue triage with reversible write workflows. It eliminates a measured 14% blind bulk-mutation rate via a two-phase SHA-256 preview-token protocol requiring explicit human approval before mutating remote repository states. Improved intent execution accuracy from 64% to 100% and neutralized prompt injections across 20 adversarial test suites using ABAC security, circuit breakers, Saga rollback, and Pydantic validation.",
      keyPoints: [
        "Built production-ready MCP server for LLM-driven repository automation, semantic search, and deterministic issue triage.",
        "Eliminated 14% blind bulk-mutation rate via two-phase SHA-256 preview-token protocol requiring explicit human approval.",
        "Improved intent execution accuracy from 64% to 100% across 20 adversarial test suites.",
        "Neutralized prompt injections using ABAC security, circuit breakers, Saga rollback, and Pydantic validation.",
        "Implemented reversible write workflows with complete state rollback capabilities."
      ]
    },
    {
      id: "apexrag",
      title: "ApexRAG – RAG Retrieval Evaluation System",
      techStack: ["Python", "FastAPI", "ChromaDB", "Sentence Transformers", "Ollama", "scikit-learn"],
      githubUrl: "https://github.com/kartik-012/apexrag",
      liveUrl: "https://apexrag.kartik.dev",
      description: "Comprehensive RAG evaluation benchmark over 2,580 documentation chunks and 100 human-verified Q&A pairs, improving retrieval accuracy from 61% (BM25) to 85% (Cross-Encoder Re-ranking).",
      longDescription: "ApexRAG is a comprehensive RAG evaluation benchmark built over 2,580 documentation chunks and 100 human-verified Q&A pairs on local CPU infrastructure to systematically isolate retrieval bottlenecks. It benchmarks 5 retrieval strategies, improving retrieval accuracy from 61% (BM25) to 85% (Cross-Encoder Re-ranking), establishing ranking quality as the primary bottleneck. Features elimination of data contamination and ID collisions using path-based hashing, and deploys a Logistic Regression query strategy router for dynamic retrieval optimization.",
      keyPoints: [
        "Built comprehensive RAG evaluation benchmark over 2,580 documentation chunks and 100 human-verified Q&A pairs.",
        "Benchmarked 5 retrieval strategies, improving accuracy from 61% (BM25) to 85% (Cross-Encoder Re-ranking).",
        "Established ranking quality as the primary retrieval bottleneck through systematic analysis.",
        "Eliminated data contamination and ID collisions using path-based hashing.",
        "Deployed Logistic Regression query strategy router for dynamic retrieval optimization."
      ]
    }
  ],
  achievements: [
    {
      id: "vice-president",
      title: "Vice President – AI & ML Department",
      description: "Vice President of the Department of Artificial Intelligence & Machine Learning at Jain College of Engineering, Belagavi. Led departmental initiatives and coordinated technical and academic programs.",
      icon: "🎖️"
    },
    {
      id: "hack2future",
      title: "Hack2Future 2.0 – IIIT Dharwad",
      description: "Competed as part of Team Velora in Hack2Future 2.0, a national-level hackathon at IIIT Dharwad.",
      icon: "🏆"
    },
    {
      id: "code-for-innovex",
      title: "Code for Innovex – NITTE NMAM IT",
      description: "Participated in Code for Innovex, a 24-hour national-level hackathon at NITTE NMAM Institute of Technology.",
      icon: "💻"
    },
    {
      id: "oracle-certified",
      title: "Oracle AI & Cloud Certified",
      description: "Earned Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate certification.",
      icon: "🎯"
    },
    {
      id: "aws-certified",
      title: "AWS ML & AI Fundamentals Certified",
      description: "Completed AWS Skill Builder curriculum on core AI algorithms, SageMaker, Bedrock, and generative AI deployments on AWS cloud.",
      icon: "☁️"
    }
  ],
  certifications: [
    {
      id: "oracle-ai-foundations-2025",
      title: "Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate",
      issuer: "Oracle",
      issuerKey: "oracle",
      date: "2025",
      category: "ai",
      skills: ["Generative AI", "Machine Learning", "OCI AI Services", "LLMs"],
      description: "Comprehensive certification verifying mastery of OCI Artificial Intelligence architectures, generative models, and machine learning foundation concepts.",
      brandColor: "#C74634"
    },
    {
      id: "aws-ml-ai-fundamentals",
      title: "AWS Training & Certification – Fundamentals of Machine Learning and Artificial Intelligence",
      issuer: "Amazon Web Services (AWS)",
      issuerKey: "aws",
      date: "2026",
      category: "ai",
      skills: ["Machine Learning", "Amazon SageMaker", "Bedrock", "Computer Vision", "NLP"],
      description: "Completed AWS Skill Builder specialized curriculum on core AI algorithms, neural network design, model training, and generative AI deployments on AWS.",
      brandColor: "#FF9900"
    },
    {
      id: "tata-genai-analytics",
      title: "Tata – GenAI Powered Data Analytics Job Simulation",
      issuer: "Forage (Tata)",
      issuerKey: "tata",
      date: "2026",
      category: "data",
      skills: ["Generative AI", "Data Analytics", "Prompt Engineering", "Data Modeling"],
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
    { platform: "LeetCode", url: "https://leetcode.com/u/kartikraikar2005", handle: "kartikraikar2005" },
    { platform: "GitHub", url: "https://github.com/kartik-012", handle: "kartik-012" },
    { platform: "HackerRank", url: "https://hackerrank.com/kartikraikar2005", handle: "kartikraikar2005" },
    { platform: "CodeChef", url: "https://codechef.com/users/kartikraikar", handle: "kartikraikar" }
  ]
};
