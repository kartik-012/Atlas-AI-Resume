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
  skills: {
    languages: string[];
    frontend: string[];
    backend: string[];
    aiMl: string[];
    database: string[];
    tools: string[];
  };
  projects: Project[];
  achievements: Achievement[];
  certifications: Certification[];
  languages: string[];
  codingProfiles: {
    platform: string;
    url: string;
    handle: string;
  }[];
}

export const resumeData: ResumeData = {
  name: "Kartik Raikar",
  tagline: "Talk with my Resume.",
  title: "AI & Machine Learning Engineer",
  email: "kartikraikar2005@gmail.com",
  phone: "+91 8660910358",
  location: "Belagavi, Karnataka, India",
  github: "https://github.com/kartikraikar2005",
  linkedin: "https://linkedin.com/in/kartik-raikar-kr",
  portfolio: "https://kartik-raikar.dev",
  summary: "AI & Machine Learning undergraduate passionate about Software Development, Backend Engineering, Artificial Intelligence, and scalable systems. Experienced in developing full-stack web applications, AI-powered platforms, and machine learning solutions using Java, Python, React, FastAPI, MongoDB, and modern AI frameworks. Strong problem-solving skills with growing expertise in Data Structures and Algorithms.",
  education: {
    degree: "Bachelor of Engineering (B.E.)",
    major: "Artificial Intelligence & Machine Learning",
    institution: "Jain College of Engineering, Belagavi",
    period: "2023 – 2027 (Expected)",
    university: "Visvesvaraya Technological University (VTU)",
    cgpa: "8.5 / 10.0"
  },
  skills: {
    languages: ["Python", "Java", "C++", "JavaScript", "TypeScript", "SQL"],
    frontend: ["React.js", "Next.js 14", "React Three Fiber", "Three.js", "HTML5", "CSS3", "TailwindCSS", "Vite", "Framer Motion", "TypeScript"],
    backend: ["FastAPI", "Node.js", "Express.js", "REST APIs", "WebSockets", "Server-Sent Events", "Celery", "SQLAlchemy"],
    aiMl: ["Scikit-learn", "NumPy", "Pandas", "LangChain", "Sentence Transformers", "Claude API", "GPT-4o API", "Gemini API", "LiteLLM", "NLP", "Deep Learning", "RAG", "Vector Embeddings", "Generative AI", "NLI / Contradiction Detection", "Red-Teaming"],
    database: ["PostgreSQL", "Qdrant Vector DB", "Redis", "MongoDB", "MySQL", "Async SQLite"],
    tools: ["Docker", "Git", "GitHub", "VS Code", "Postman", "Render", "Vercel", "Power BI", "Docker Compose"]
  },
  projects: [
    {
      id: "atlas-ai-resume",
      title: "Atlas AI Resume",
      techStack: ["React 19", "TypeScript", "Node.js", "Express", "Gemini API", "RAG", "Vector Search", "TailwindCSS", "Vite"],
      githubUrl: "https://github.com/kartik-012/Atlas-AI-Resume",
      liveUrl: "http://localhost:3000",
      description: "RAG-Powered AI Portfolio & Interactive Resume Assistant with Gemini 2.5 Flash, real-time Recruiter Telemetry Console, and dynamic Knowledge Base Admin Studio.",
      longDescription: "Atlas AI Resume transforms standard static resumes into a living, intelligent conversational agent and comprehensive recruiter telemetry console. Built with a dual-mode RAG engine utilizing Google Gemini 2.5 Flash and vector cosine similarity search over localized knowledge chunks. Features real-time recruiter telemetry tracking visits, queries, and project interactions, plus an interactive Knowledge Base Studio allowing live chunk indexing, semantic search testing, and system diagnostics.",
      keyPoints: [
        "Architected dual-layer RAG pipeline with Gemini 2.5 Flash and custom vector cosine similarity search.",
        "Built interactive Recruiter Telemetry Console with real-time analytics, question monitoring, and time-tracking.",
        "Engineered Knowledge Base Admin Studio allowing dynamic chunk ingestion, embedding generation, and live retrieval diagnostics.",
        "Created modern cyber-aesthetic interface with 13-credential filterable showcase, interactive skill visualizers, and recruiter invite drafter.",
        "Implemented strict grounding rules and token-bucket rate limiter to prevent prompt injection and model hallucinations."
      ]
    },
    {
      id: "atlas-os",
      title: "AtlasOS",
      techStack: ["FastAPI", "Python 3.11", "PostgreSQL 15", "Qdrant", "Redis", "Next.js 14", "Celery", "Docker"],
      githubUrl: "https://github.com/kartik-012/AtlasOS",
      liveUrl: "https://atlasos.kartik.dev",
      description: "Multi-Tenant AI Memory Operating System orchestrating hierarchical memory (working, episodic, semantic) with active NLI contradiction detection and immutable audit logs.",
      longDescription: "AtlasOS is a production-grade, multi-tenant AI Memory Operating System designed to provide hierarchical, contextual memory management for autonomous AI agents. It orchestrates working memory (Redis with TTLs), episodic memory (Qdrant + Postgres vector search), and semantic memory with active contradiction detection powered by RoBERTa-large-MNLI. Enforces strict tenant isolation via PostgreSQL Row-Level Security (RLS) and scoped Qdrant filters, alongside background summarization pipelines via Celery.",
      keyPoints: [
        "Architected 3-tier memory engine: Ephemeral Working Memory (Redis), Historical Episodic Memory (Qdrant + Postgres), and Synthesized Semantic Memory.",
        "Enforced multi-tenant boundary isolation using PostgreSQL Row-Level Security (RLS) at the database layer and scoped Qdrant vector filtering.",
        "Implemented active contradiction detection evaluating incoming facts against semantic memories using RoBERTa-large-MNLI with policy conflict resolution.",
        "Engineered background summarization pipelines and async task orchestration with Celery and Celery Beat.",
        "Built Next.js 14 Developer Console featuring API key rotation, interactive memory explorers, and evaluation analytics."
      ]
    },
    {
      id: "debate-arena",
      title: "Debate Arena",
      techStack: ["Python 3.11", "FastAPI", "React 18", "React Three Fiber", "Three.js", "TailwindCSS", "Framer Motion", "Async SQLite"],
      githubUrl: "https://github.com/kartikraikar2005/debate-arena",
      liveUrl: "https://debate-arena.kartik.dev",
      description: "AI-Powered Multi-LLM Debate Platform with 3D courtroom visualization in React Three Fiber, live strength scoring, automated fact-checking, and judicial bias auditing.",
      longDescription: "Debate Arena is an adversarial debate platform staging multi-round debates between leading AI models (Gemini, GPT-4o, Claude 3.5). The debate is rendered in a live 3D courtroom using React Three Fiber with dynamic camera staging and glowing speaker podiums. Includes an independent AI judge, live strength scoring graphs, automated claim fact-checking, self-contradiction tracking, and judicial bias auditing via role-swap evaluation.",
      keyPoints: [
        "Built live 3D courtroom environment in React Three Fiber with dynamic podium illumination and camera choreography.",
        "Orchestrated multi-turn adversarial debates across multiple LLM providers (Gemini, GPT-4o, Claude 3.5).",
        "Engineered independent AI Judge evaluation with live strength scoring and multi-persona jury voting (Skeptic, Professor, Optimist).",
        "Implemented judicial bias auditing by re-evaluating transcripts with swapped speaker roles to detect positional bias.",
        "Integrated automated fact-checking and consistency tracking across multi-round debate arguments."
      ]
    },
    {
      id: "numpygpt",
      title: "NumPyGPT",
      techStack: ["Python", "TypeScript", "React 19", "TailwindCSS", "Vite", "Express", "Gemini API", "Matrix Math"],
      githubUrl: "https://github.com/kartikraikar2005/numpygpt",
      liveUrl: "https://numpygpt.kartik.dev",
      description: "GPT-Style Transformer Architecture Built from Scratch without ML frameworks, featuring interactive attention weight visualizers and Gemini NumPy code assistant.",
      longDescription: "NumPyGPT demystifies generative pre-trained transformers by implementing every fundamental building block from first principles — Matrix Multiplication, Multi-Head Attention, Layer Normalization, Softmax, Feed-Forward layers, and Backpropagation — with zero ML framework dependencies. Paired with a conversational AI interface powered by Google Gemini and an interactive visualization dashboard rendering real-time attention heatmaps, token activations, and gradient flows.",
      keyPoints: [
        "Implemented complete GPT transformer architecture from scratch without PyTorch or TensorFlow.",
        "Hand-coded Multi-Head Attention (8 heads), Layer Normalization, Softmax, and Backpropagation algorithms.",
        "Built generation pipeline with top-k sampling, temperature control, and token probability distributions.",
        "Created interactive visualizer for attention weight heatmaps, token activations, and layer flow.",
        "Integrated conversational Gemini AI assistant for natural language to NumPy code generation and explanation."
      ]
    },
    {
      id: "ragaai-catalyst",
      title: "RagaAI Catalyst",
      techStack: ["Python", "FastAPI", "React", "WebSockets", "MongoDB", "LiteLLM", "Sentence Transformers", "Qdrant"],
      githubUrl: "https://github.com/kartikraikar2005/ragaai-catalyst",
      liveUrl: "https://catalyst.raga.ai",
      description: "Enterprise LLM Evaluation & Guardrails Engine with automated metric scoring (Faithfulness, Relevance, Hallucination), agentic tracing, and red-teaming across 5+ LLMs.",
      longDescription: "RagaAI Catalyst is an enterprise-grade evaluation and observability suite for LLM and RAG applications. Features automated metric evaluations (Faithfulness, Relevance, Toxicity, Hallucination scoring), real-time agentic execution tracing, prompt versioning and compilation, synthetic Q&A generation, dynamic guardrail enforcement, and automated red-teaming security scans against model vulnerabilities and biases.",
      keyPoints: [
        "Implemented automated evaluation metrics for RAG pipelines scoring Faithfulness (99.4%), Relevance, and Hallucination rates.",
        "Engineered Agentic Tracing module tracking LLM interactions, token usage, tool executions, and decision graphs.",
        "Built dynamic Guardrails Engine with fail conditions, regex checks, and automated response intervention.",
        "Designed Automated Red-Teaming scanner detecting model vulnerabilities, biases, and harmful prompt attacks.",
        "Supported multi-provider orchestration (OpenAI, Anthropic, Gemini, Grok, LiteLLM) with sub-45ms latency."
      ]
    }
  ],
  achievements: [
    {
      id: "hackathon",
      title: "MSME Hackathon 6.0 Participant",
      description: "Participated in the prestigious national MSME Hackathon 6.0, designing AI-powered enterprise solutions for small and medium businesses.",
      icon: "🏆"
    },
    {
      id: "oracle-certified",
      title: "Oracle AI & Cloud Certified",
      description: "Earned 3 Oracle certifications: OCI AI Foundations, OCI GenAI Professional, and OCI Foundations Associate — all in September 2025.",
      icon: "🎯"
    },
    {
      id: "aws-certified",
      title: "AWS ML & AI Fundamentals Certified",
      description: "Completed AWS Skill Builder curriculum on core AI algorithms, SageMaker, Bedrock, and generative AI deployments on AWS cloud.",
      icon: "☁️"
    },
    {
      id: "google-course",
      title: "Google AI Agents Graduate",
      description: "Completed Google's elite AI Agents Intensive Course on Kaggle, mastering advanced multi-agent architectures, function calling, and prompt orchestration.",
      icon: "🎓"
    },
    {
      id: "dsa-practice",
      title: "Competitive Programming Enthusiast",
      description: "Actively practicing Data Structures and Algorithms on LeetCode and HackerRank, maintaining strong problem-solving skills in Java and Python.",
      icon: "💡"
    }
  ],
  certifications: [
    {
      id: "oracle-ai-foundations-2025",
      title: "Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate",
      issuer: "Oracle",
      issuerKey: "oracle",
      date: "Sep 2025",
      category: "ai",
      skills: ["Generative AI", "Machine Learning", "OCI AI Services", "LLMs"],
      description: "Comprehensive certification verifying mastery of OCI Artificial Intelligence architectures, generative models, and machine learning foundation concepts.",
      brandColor: "#C74634"
    },
    {
      id: "oracle-genai-professional-2025",
      title: "Oracle Cloud Infrastructure 2025 Generative AI Certified Professional",
      issuer: "Oracle",
      issuerKey: "oracle",
      date: "Sep 2025",
      category: "ai",
      skills: ["Fine-Tuning", "RAG Pipelines", "Vector Databases", "OCI GenAI Service"],
      description: "Advanced professional certification in architecting, fine-tuning, and deploying enterprise Large Language Models and Retrieval-Augmented Generation systems on OCI.",
      brandColor: "#C74634"
    },
    {
      id: "oracle-cloud-foundations-2025",
      title: "Oracle Cloud Infrastructure 2025 Certified Foundations Associate",
      issuer: "Oracle",
      issuerKey: "oracle",
      date: "Sep 2025",
      category: "cloud",
      skills: ["Cloud Architecture", "OCI Compute", "Virtual Cloud Networks", "Identity & Access"],
      description: "Core cloud computing certification validating deep understanding of enterprise OCI architecture, high availability, security, and cloud scalability.",
      brandColor: "#C74634"
    },
    {
      id: "aws-ml-ai-fundamentals",
      title: "AWS Training & Certification – Fundamentals of Machine Learning & AI",
      issuer: "Amazon Web Services (AWS)",
      issuerKey: "aws",
      date: "Jun 2026",
      category: "ai",
      skills: ["Machine Learning", "Amazon SageMaker", "Bedrock", "Computer Vision", "NLP"],
      description: "Completed AWS Skill Builder specialized curriculum on core AI algorithms, neural network design, model training, and generative AI deployments on AWS.",
      brandColor: "#FF9900"
    },
    {
      id: "azure-cloud-concepts",
      title: "Introduction to Microsoft Azure: Describe Cloud Concepts",
      issuer: "Microsoft",
      issuerKey: "microsoft",
      date: "Aug 2025",
      category: "cloud",
      skills: ["Azure Architecture", "Serverless", "Cloud Security", "Hybrid Cloud"],
      description: "Microsoft verified credential for cloud computing fundamentals, compute virtualization, storage topologies, and Azure governance frameworks.",
      brandColor: "#0078D4"
    },
    {
      id: "tata-genai-analytics",
      title: "Tata – GenAI Powered Data Analytics Job Simulation",
      issuer: "Forage (Tata)",
      issuerKey: "tata",
      date: "Jun 2026",
      category: "data",
      credentialId: "F75ka7LhKE2sJGxyF",
      skills: ["Generative AI", "Data Analytics", "Prompt Engineering", "Data Modeling"],
      description: "Hands-on job simulation leveraging cutting-edge Generative AI to automate exploratory data analysis, generate executive insights, and structure analytics workflows.",
      brandColor: "#005691"
    },
    {
      id: "deloitte-analytics",
      title: "Deloitte Data Analytics Job Simulation",
      issuer: "Deloitte (Forage)",
      issuerKey: "deloitte",
      date: "Jul 2026",
      category: "data",
      credentialId: "68dcdda956c19017e850b83f",
      skills: ["Data Analytics", "Forensic Technology", "Advanced Excel", "Data Cleaning"],
      description: "Completed practical forensic data analysis simulation with Deloitte, conducting end-to-end data pipeline cleaning, statistical modeling, and insight dashboards.",
      brandColor: "#86BC25"
    },
    {
      id: "tata-data-visualisation",
      title: "Tata – Data Visualisation: Empowering Business with Effective Insights",
      issuer: "Forage (Tata)",
      issuerKey: "tata",
      date: "Jun 2026",
      category: "data",
      credentialId: "fRnWE6dTKBsSJyrg5",
      skills: ["Data Visualization", "Executive Dashboards", "Data Cleaning", "Business Intelligence"],
      description: "Executed practical enterprise data simulation building responsive C-suite visual dashboards, data validation pipelines, and strategic decision metrics.",
      brandColor: "#005691"
    },
    {
      id: "cisco-cybersecurity",
      title: "Introduction to Cybersecurity",
      issuer: "Cisco Networking Academy",
      issuerKey: "cisco",
      date: "Jun 2026",
      category: "security",
      skills: ["Cybersecurity", "Information Security", "Network Defense", "Threat Intelligence"],
      description: "Foundational credential in enterprise security architectures, attack vectors, cryptographic protocols, defense-in-depth, and data privacy safeguards.",
      brandColor: "#049FD9"
    },
    {
      id: "tata-cybersecurity",
      title: "Tata – Cybersecurity Analyst Job Simulation",
      issuer: "Forage (Tata)",
      issuerKey: "tata",
      date: "Jun 2026",
      category: "security",
      credentialId: "oL6ptn27GNbizp9Ch",
      skills: ["IAM Assessments", "Cybersecurity Strategy", "Solution Design", "Access Control"],
      description: "Simulated enterprise security operations focusing on Identity and Access Management (IAM), vulnerability assessments, and mitigation solution design.",
      brandColor: "#005691"
    },
    {
      id: "ibm-process-mining",
      title: "IBM Process Mining Project Journey",
      issuer: "IBM Training",
      issuerKey: "ibm",
      date: "Sep 2025",
      category: "data",
      skills: ["Process Mining", "Workflow Optimization", "Enterprise Automation", "Process Discovery"],
      description: "Awarded by IBM Training for demonstrating hands-on proficiency in process mining, algorithmic bottleneck detection, and workflow transformation pipelines.",
      brandColor: "#0530AD"
    },
    {
      id: "tcs-career-edge",
      title: "TCS iON Career Edge – Young Professional",
      issuer: "TCS iON",
      issuerKey: "tcs",
      date: "Jun 2026",
      category: "dev",
      credentialId: "240640-28976732-1016",
      skills: ["Business Communication", "Presentation", "IT Methodologies", "Leadership"],
      description: "Comprehensive professional capability program covering industry-standard Agile workflows, corporate communications, and collaborative development frameworks.",
      brandColor: "#E20074"
    },
    {
      id: "greatstack-fullstack",
      title: "Full Stack Food Delivery Project & Architecture",
      issuer: "GreatStack",
      issuerKey: "greatstack",
      date: "Aug 2025",
      category: "dev",
      credentialId: "fdeleWZYPOIdyzddhImJG0huQBb7yj22",
      skills: ["React", "Node.js", "MongoDB", "Express", "Stripe API", "JWT"],
      description: "Engineered an end-to-end full stack web application featuring responsive customer UI, authentication, database schemas, admin dashboard, and payment gateway integration.",
      brandColor: "#6366F1"
    }
  ],
  languages: ["English (Fluent)", "Kannada (Native)", "Hindi (Conversational)"],
  codingProfiles: [
    { platform: "LeetCode", url: "https://leetcode.com/u/kartikraikar2005", handle: "kartikraikar2005" },
    { platform: "GitHub", url: "https://github.com/kartikraikar2005", handle: "kartikraikar2005" },
    { platform: "HackerRank", url: "https://hackerrank.com/kartikraikar2005", handle: "kartikraikar2005" },
    { platform: "CodeChef", url: "https://codechef.com/users/kartikraikar", handle: "kartikraikar" }
  ]
};
