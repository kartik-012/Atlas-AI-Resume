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
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  date?: string;
  verificationUrl?: string;
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
  }[];
}

export const resumeData: ResumeData = {
  name: "Kartik Raikar",
  tagline: "Talk with my Resume.",
  title: "AI & Machine Learning Engineer",
  email: "kartikraikar2005@gmail.com",
  phone: "",
  location: "Bangalore, India",
  github: "https://github.com/kartikraikar2005",
  linkedin: "https://linkedin.com/in/kartik-raikar",
  portfolio: "https://kartik-raikar.dev",
  summary: "AI & Machine Learning undergraduate passionate about Software Development, Backend Engineering, Artificial Intelligence, and scalable systems. Experienced in developing full-stack web applications, AI-powered platforms, and machine learning solutions using Java, Python, React, FastAPI, MongoDB, and modern AI frameworks. Strong problem-solving skills with growing expertise in Data Structures and Algorithms.",
  education: {
    degree: "Bachelor of Engineering",
    major: "Artificial Intelligence & Machine Learning",
    institution: "VTU Affiliate Institute",
    period: "2023 – Present",
    university: "Visvesvaraya Technological University (VTU)"
  },
  skills: {
    languages: ["Java", "Python", "C++", "JavaScript", "SQL"],
    frontend: ["React.js", "HTML", "CSS", "TailwindCSS", "Vite", "Framer Motion"],
    backend: ["FastAPI", "Node.js", "Express.js", "REST APIs"],
    aiMl: ["Scikit-learn", "NumPy", "Pandas", "LangChain", "Sentence Transformers", "Claude/GPT APIs", "Cohere API", "NLP", "Deep Learning"],
    database: ["MongoDB", "MySQL", "Neo4j"],
    tools: ["Git", "GitHub", "VS Code", "Postman", "Render", "Vercel"]
  },
  projects: [
    {
      id: "debate-arena",
      title: "Debate Arena",
      techStack: ["React", "FastAPI", "MongoDB", "Advanced LLM APIs", "TailwindCSS"],
      githubUrl: "https://github.com/kartikraikar2005/debate-arena",
      liveUrl: "https://debate-arena.kartik.dev",
      description: "An AI-powered multi-agent debate platform with real-time argument generation and interactive courtroom visualization.",
      longDescription: "Debate Arena is a cutting-edge platform where multiple AI agents engage in structured debates on user-defined topics. Powered by state-of-the-art language models, agents adopt specific personas, research evidence, counter arguments, and deliver persuasive arguments. The frontend features a beautiful, courtroom-inspired interface with real-time streaming, animations, and sentiment analysis overlays.",
      keyPoints: [
        "Built an AI-powered multi-agent debate platform with real-time argument generation.",
        "Integrated advanced language model APIs for intelligent response generation and persona synthesis.",
        "Designed responsive courtroom-inspired frontend using React and TailwindCSS.",
        "Developed high-performance backend REST APIs using FastAPI."
      ]
    },
    {
      id: "rag-auditor",
      title: "RAG Hallucination Auditor",
      techStack: ["Python", "FastAPI", "Cohere", "Sentence Transformers", "Numpy"],
      githubUrl: "https://github.com/kartikraikar2005/rag-hallucination-auditor",
      liveUrl: "https://rag-auditor.kartik.dev",
      description: "An AI tool to detect, analyze, and mitigate hallucinations in Retrieval-Augmented Generation systems using semantic similarity.",
      longDescription: "The RAG Hallucination Auditor is a diagnostic utility for production LLM pipelines. It intercepts retrieved knowledge chunks and compared generated text outputs, using Sentence Transformers to compute fine-grained semantic overlap and check for factual inconsistency, external knowledge injection, or contradiction.",
      keyPoints: [
        "Developed an AI tool to detect hallucinations in Retrieval-Augmented Generation systems.",
        "Implemented high-accuracy semantic similarity scoring using Sentence Transformers.",
        "Compared retrieved knowledge with generated responses to improve reliability.",
        "Created REST APIs and an interactive benchmark testing dashboard."
      ]
    },
    {
      id: "numpygpt",
      title: "NumPyGPT",
      techStack: ["TypeScript", "React", "Deep Learning", "Vite", "TailwindCSS"],
      githubUrl: "https://github.com/kartikraikar2005/numpygpt",
      liveUrl: "https://numpygpt.kartik.dev",
      description: "A complete GPT model implemented completely from scratch without external ML libraries, featuring a rich training dashboard.",
      longDescription: "NumPyGPT is an educational masterpiece designed to demystify generative pre-trained transformers. Every single operation - including Matrix Multiplication, Multi-Head Attention, Layer Normalization, Softmax, FeedForward layers, and Backpropagation - is coded manually. The UI offers a brilliant visual walkthrough of activations, weights, gradients, and attention head maps as text flows through the network.",
      keyPoints: [
        "Implemented a GPT model completely from scratch without ML libraries.",
        "Developed Matrix Multiplication, Attention, LayerNorm, Softmax, and Backpropagation manually.",
        "Created an interactive visualization dashboard for transformer architecture."
      ]
    },
    {
      id: "misinformation-tree",
      title: "Misinformation Family Tree AI",
      techStack: ["FastAPI", "Neo4j", "NLP", "Python", "React"],
      githubUrl: "https://github.com/kartikraikar2005/misinformation-family-tree",
      liveUrl: "https://misinfo-tree.kartik.dev",
      description: "An AI system for tracing the origin, evolution, and propagation routes of fake news using graph databases and semantic NLP.",
      longDescription: "This advanced NLP project models the viral spread of fake news. By analyzing news articles and social media feeds, it clusters similar claims, detects mutations in narrative, and structures propagation pathways inside a Neo4j graph database. Users can explore claim 'genealogies' to pinpoint source accounts and propagation hubs.",
      keyPoints: [
        "Designed an AI system for tracing the origin and evolution of fake news.",
        "Used graph-based visualization (Neo4j) to analyze misinformation propagation pathways.",
        "Integrated modern NLP techniques for semantic relationship detection and clustering."
      ]
    }
  ],
  achievements: [
    {
      id: "hackathon",
      title: "MSME Hackathon 6.0 Participant",
      description: "Participated in the prestigious national MSME Hackathon 6.0, designing AI-powered enterprise solutions."
    },
    {
      id: "ai-apps",
      title: "LLM & FastAPI Specialist",
      description: "Successfully built and deployed multiple production-ready AI applications powered by LLMs and high-performance backends."
    },
    {
      id: "google-course",
      title: "Google AI Agents Graduate",
      description: "Completed Google's elite AI Agents Intensive Course, mastering advanced multi-agent architectures, function calling, and prompt orchestration."
    },
    {
      id: "backend-db",
      title: "Scalable Systems Creator",
      description: "Developed and optimized scalable backend web servers utilizing FastAPI and MongoDB with advanced caching structures."
    },
    {
      id: "dsa-practice",
      title: "Competitive Programming Enthusiast",
      description: "Actively practicing Data Structures and Algorithms on LeetCode and HackerRank, maintaining strong problem-solving skills."
    }
  ],
  certifications: [
    {
      id: "google-agent",
      title: "Google AI Agents Intensive Course Certificate",
      issuer: "Google Developers"
    },
    {
      id: "kaggle-agent",
      title: "Kaggle AI Agents Certificate",
      issuer: "Kaggle / Google"
    },
    {
      id: "harvard-cs50",
      title: "Harvard CS50 Computer Science Certificate",
      issuer: "Harvard University (edX)"
    },
    {
      id: "nptel-cert",
      title: "NPTEL AI/ML Certifications",
      issuer: "NPTEL India"
    }
  ],
  languages: ["English", "Kannada", "Hindi"],
  codingProfiles: [
    { platform: "LeetCode", url: "https://leetcode.com/u/kartikraikar2005" },
    { platform: "GitHub", url: "https://github.com/kartikraikar2005" },
    { platform: "HackerRank", url: "https://hackerrank.com/kartikraikar2005" },
    { platform: "CodeChef", url: "https://codechef.com/users/kartikraikar" }
  ]
};
