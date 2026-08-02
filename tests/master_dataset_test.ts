import { matchChatbotIntent } from '../src/data/chatbotIntents';

const masterQueries: string[] = [
  // 👤 PERSONAL PROFILE
  "who are you?",
  "tell me about yourself",
  "introduce yourself",
  "introduce yourself in 30 seconds",
  "introduce yourself in one minute",
  "introduce yourself in two minutes",
  "professional introduction",
  "elevator pitch",
  "quick introduction",
  "professional summary",
  "executive summary",
  "profile summary",
  "resume summary",
  "about kartik",
  "full profile",
  "background",
  "career objective",
  "career goals",
  "future goals",
  "long term goals",
  "short term goals",
  "where are you from?",
  "where are you based?",
  "preferred work location",
  "work preferences",

  // 🎓 EDUCATION
  "education",
  "education details",
  "academic background",
  "college",
  "college details",
  "college name",
  "university",
  "degree",
  "branch",
  "specialization",
  "graduation year",
  "cgpa",
  "semester cgpa",
  "semester wise cgpa",
  "marks",
  "academic achievements",
  "subjects studied",

  // 📄 RESUME
  "resume",
  "latest resume",
  "resume highlights",
  "download resume",
  "show resume",
  "explain resume",
  "summarize resume",
  "resume overview",
  "resume timeline",

  // 💻 TECHNICAL SKILLS
  "technical skills",
  "skills",
  "programming languages",
  "frontend skills",
  "backend skills",
  "full stack skills",
  "ai skills",
  "ml skills",
  "deep learning",
  "llm skills",
  "rag skills",
  "cloud skills",
  "devops",
  "database skills",
  "frameworks",
  "libraries",
  "software",
  "operating systems",
  "development tools",
  "strongest skill",
  "weakest skill",
  "technology stack",

  // 🤖 AI KNOWLEDGE
  "explain rag",
  "explain llm",
  "explain transformers",
  "explain attention mechanism",
  "explain embeddings",
  "explain vector database",
  "explain semantic search",
  "explain chunking",
  "explain reranking",
  "explain prompt engineering",
  "explain fine tuning",
  "explain ai agents",
  "explain mcp",
  "explain langchain",
  "explain llamaindex",
  "explain huggingface",
  "explain pytorch",
  "explain tensorflow",

  // 🚀 PROJECTS
  "projects",
  "all projects",
  "featured projects",
  "latest project",
  "best project",
  "favorite project",
  "flagship project",
  "most complex project",
  "hardest project",
  "easiest project",
  "project timeline",
  "project architecture",
  "project workflow",
  "project challenges",
  "project achievements",
  "project deployment",
  "project tech stack",
  "project demonstration",
  "project comparison",

  // 📌 ATLASOS
  "atlasos",
  "explain atlasos",
  "atlasos overview",
  "atlasos architecture",
  "atlasos workflow",
  "atlasos tech stack",
  "atlasos database",
  "atlasos deployment",
  "atlasos challenges",
  "atlasos future improvements",
  "atlasos business value",
  "atlasos demo",
  "why atlasos",

  // 📌 DEBATE ARENA
  "debate arena",
  "explain debate arena",
  "debate arena architecture",
  "debate arena workflow",
  "debate arena technologies",
  "debate arena deployment",
  "why debate arena",

  // 📌 NUMPYGPT
  "numpygpt",
  "explain numpygpt",
  "transformer from scratch",
  "attention mechanism",
  "positional encoding",
  "encoder decoder",
  "self attention",
  "why build transformer manually",

  // 📌 RAGAAI
  "ragaai catalyst",
  "explain ragaai catalyst",
  "llm evaluation",
  "hallucination detection",
  "ai guardrails",
  "prompt injection",
  "evaluation metrics",

  // 🏗 SYSTEM DESIGN
  "architecture",
  "system design",
  "backend architecture",
  "frontend architecture",
  "api architecture",
  "database design",
  "deployment",
  "cloud architecture",
  "authentication",
  "authorization",
  "scalability",
  "caching",
  "load balancing",
  "microservices",
  "security",

  // 🏆 EXPERIENCE
  "internship",
  "work experience",
  "responsibilities",
  "leadership",
  "teamwork",
  "collaboration",
  "agile",
  "achievements",
  "awards",
  "hackathons",
  "competitions",

  // 🧩 PROBLEM SOLVING
  "biggest challenge",
  "debugging experience",
  "difficult situation",
  "problem solving",
  "success story",
  "failure story",
  "lessons learned",
  "conflict resolution",
  "pressure handling",
  "deadline management",

  // 📂 GITHUB
  "github",
  "github profile",
  "repositories",
  "coding profile",
  "open source",
  "github contributions",
  "github statistics",

  // 🏅 CERTIFICATIONS
  "certifications",
  "oracle certifications",
  "cloud certifications",
  "ai certifications",
  "latest certification",
  "certification timeline",

  // 🌐 PORTFOLIO
  "portfolio",
  "portfolio website",
  "personal website",
  "portfolio projects",
  "portfolio technologies",

  // 📞 CONTACT
  "email",
  "phone number",
  "linkedin",
  "linkedin id",
  "contact",
  "how to contact you",
  "schedule interview",

  // 💼 HR QUESTIONS
  "why should we hire you",
  "why are you the right candidate",
  "why should i shortlist you",
  "what makes you different",
  "what value can you bring",
  "strengths",
  "weaknesses",
  "expected salary",
  "relocation",
  "notice period",
  "availability",
  "why this company",
  "why this role",
  "five year plan",
  "motivation",
  "hobbies",
  "interests",

  // 🧠 AI ENGINEER QUESTIONS
  "explain your ai pipeline",
  "explain rag pipeline",
  "explain vector search",
  "explain semantic search",
  "explain retrieval",
  "explain embeddings",
  "explain chunking strategy",
  "explain evaluation",
  "explain hallucination mitigation",
  "explain prompt engineering",

  // ☁ CLOUD
  "azure",
  "aws",
  "oracle cloud",
  "gcp",
  "docker",
  "kubernetes",
  "ci cd",
  "deployment pipeline",

  // 🗄 DATABASE
  "sql",
  "mysql",
  "postgresql",
  "mongodb",
  "vector database",
  "pinecone",
  "chromadb",
  "faiss",

  // 📈 LEARNING
  "what are you learning",
  "current focus",
  "learning roadmap",
  "next project",
  "future certifications",
  "future plans",

  // 📊 ANALYTICS
  "summarize profile",
  "summarize skills",
  "summarize projects",
  "summarize certifications",
  "summarize achievements",
  "career timeline",
  "technology timeline",
  "project timeline",
  "strongest technologies",
  "technology statistics",
  "project statistics",
  "certification statistics",

  // 🤖 SMART AI REASONING
  "which project best matches an ai engineer role",
  "which project should i see first",
  "which project is most impressive",
  "which project has highest business impact",
  "which project is most complex",
  "which certification is most valuable",
  "which skills are strongest",
  "compare atlasos vs debate arena",
  "compare all projects",
  "explain projects from easiest to hardest",
  "recommend best project",
  "recommend certification",
  "recommend learning path",
  "recommend next project",

  // 📋 JOB DESCRIPTION ANALYSIS
  "analyze this job description",
  "compare my resume with this job description",
  "calculate ats score",
  "missing skills",
  "interview probability",
  "skill gap analysis",
  "recommend improvements",
  "explain why i match this role",

  // 🎤 MOCK INTERVIEW
  "interview me",
  "conduct hr interview",
  "conduct technical interview",
  "conduct ai engineer interview",
  "conduct python interview",
  "conduct system design interview",
  "ask coding questions",
  "ask behavioral questions",
  "evaluate my answers",
  "give interview feedback",

  // 📈 RECRUITER ASSISTANT
  "should we hire kartik",
  "is kartik a good fit",
  "why shortlist kartik",
  "recruiter summary",
  "hiring recommendation",
  "strengths for this role",
  "concerns before hiring",
  "interview focus areas",

  // ⚡ ADVANCED AI FEATURES
  "generate cover letter",
  "generate referral request",
  "generate thank you email",
  "create cold email",
  "generate linkedin message",
  "explain my resume for hr",
  "explain my resume technically",
  "explain any project in beginner mode",
  "explain any project in intermediate mode",
  "explain any project in expert mode",
  "answer with resume evidence",
  "answer with github evidence",
  "answer with portfolio evidence",
  "answer with certification evidence",
  "show supporting documents",
  "open project repository",
  "open live demo"
];

let passed = 0;
let failed = 0;

for (const q of masterQueries) {
  const res = matchChatbotIntent(q);
  if (!res || res.trim().length === 0) {
    console.error(`❌ FAILED (no match): "${q}"`);
    failed++;
  } else {
    passed++;
  }
}

console.log("\n================================================");
console.log(`MASTER DATASET TEST RESULTS: ${passed}/${masterQueries.length} PASSED (${failed} failed)`);
console.log("================================================");

if (failed > 0) {
  process.exit(1);
}
