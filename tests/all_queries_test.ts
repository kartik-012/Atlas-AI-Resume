import { matchChatbotIntent } from '../src/data/chatbotIntents';

const tests: [string, string][] = [
  ['who are you?', '### About Kartik Raikar'],
  ['introduce yourself', '### Professional Introduction'],
  ['tell me about yourself', '### Self Introduction (2 min)'],
  ['quick introduction', '### 30 Second Elevator Pitch'],
  ['full profile', '### Complete Professional Profile'],
  ['professional summary', '### Professional Summary'],
  ['resume summary', '### Resume Summary'],
  ['background', '### Career Background'],
  ['where are you from?', '### Hometown & Background'],
  ['where are you based?', '### Location & Work Preferences'],
  ['career objective', '### Career Objective'],
  ['career goals', '### Career Vision'],
  ['why should we hire you?', '### Why Hire Kartik Raikar? (Top 5 Reasons)'],

  ['education', '### Education Timeline'],
  ['education details', '### Education & Academic Background'],
  ['college details', '### College Information'],
  ['college name', '### College Information'],
  ['branch', '### Computer Science (AI & ML)'],
  ['degree', '### Bachelor\'s Degree'],
  ['graduation year', '### Graduation Timeline'],
  ['cgpa', '### CGPA & Academic Performance'],
  ['semester wise cgpa', '### Semester-wise Academic Performance'],
  ['academic achievements', '### Academic Achievements'],

  ['resume', '### Resume Overview'],
  ['show resume', '### Resume Summary'],
  ['latest resume', '### Latest Resume Version'],
  ['resume highlights', '### Resume Highlights'],
  ['download resume', '### Resume Download'],

  ['technical skills', '### Technical Stack & Skills'],
  ['programming languages', '### Programming Languages'],
  ['frontend skills', '### Frontend Technologies'],
  ['backend skills', '### Backend Technologies'],
  ['full stack skills', '### Full Stack Development Skills'],
  ['ai skills', '### Artificial Intelligence Skills'],
  ['machine learning skills', '### Machine Learning Skills'],
  ['deep learning skills', '### Deep Learning Skills'],
  ['llm skills', '### Large Language Model Skills'],
  ['rag skills', '### Retrieval-Augmented Generation Skills'],
  ['cloud skills', '### Cloud Technologies'],
  ['devops skills', '### DevOps Skills'],
  ['database skills', '### Database Technologies'],
  ['frameworks', '### Frameworks & Libraries'],
  ['tools you use', '### Development Tools'],
  ['operating systems', '### Operating Systems'],
  ['software you know', '### Software & Platforms'],

  ['explain rag', '### Retrieval-Augmented Generation (RAG)'],
  ['explain llm', '### Large Language Models'],
  ['explain transformers', '### Transformer Architecture'],
  ['explain embeddings', '### Vector Embeddings'],
  ['explain vector database', '### Vector Databases'],
  ['explain prompt engineering', '### Prompt Engineering'],
  ['explain fine tuning', '### Fine-Tuning LLMs'],
  ['explain ai agents', '### AI Agents'],
  ['explain mcp', '### Model Context Protocol (MCP)'],
  ['explain langchain', '### LangChain Framework'],
  ['explain llamaindex', '### LlamaIndex Framework'],

  ['atlasos', '### Project Spotlight: AtlasOS'],
  ['explain atlasos', '### AtlasOS Overview'],
  ['how does atlasos work', '### AtlasOS Architecture & Workflow'],
  ['atlasos architecture', '### AtlasOS System Architecture'],
  ['atlasos tech stack', '### AtlasOS Technology Stack'],
  ['atlasos challenges', '### Challenges & Solutions'],
  ['atlasos future', '### Future Enhancements'],
  ['atlasos demo', '### AtlasOS Demonstration'],

  ['debate arena', '### Project Spotlight: Debate Arena'],
  ['explain debate arena', '### Debate Arena Overview'],
  ['debate arena architecture', '### Debate Arena Architecture'],
  ['debate arena workflow', '### Debate Arena Workflow'],
  ['debate arena tech stack', '### Debate Arena Technology Stack'],
  ['why debate arena', '### Purpose of Debate Arena'],

  ['numpygpt', '### Project Spotlight: NumPyGPT'],
  ['explain numpygpt', '### NumPyGPT Overview'],
  ['transformer from scratch', '### Transformer Built from Scratch'],
  ['attention mechanism', '### Self-Attention Mechanism'],
  ['positional encoding', '### Positional Encoding'],
  ['why build transformer manually', '### Learning Objectives'],

  ['ragaai catalyst', '### Project Spotlight: RagaAI Catalyst'],
  ['explain ragaai catalyst', '### RagaAI Overview'],
  ['llm evaluation', '### LLM Evaluation Techniques'],
  ['hallucination detection', '### Hallucination Detection'],
  ['ai guardrails', '### AI Guardrails & Safety'],

  ['all projects', '### Complete Project Portfolio'],
  ['featured projects', '### Featured Projects'],
  ['best project', '### Flagship Project'],
  ['latest project', '### Latest Project'],
  ['project architecture', '### Project Architectures'],
  ['project challenges', '### Challenges Faced'],
  ['project achievements', '### Project Achievements'],
  ['deployment', '### Deployment Process'],
  ['system design', '### System Design Overview'],
  ['backend architecture', '### Backend Architecture'],
  ['frontend architecture', '### Frontend Architecture'],
  ['api architecture', '### API Architecture'],
  ['database design', '### Database Design'],
  ['cloud architecture', '### Cloud Infrastructure'],

  ['internship', '### Internship Experience'],
  ['work experience', '### Professional Experience'],
  ['responsibilities', '### Roles & Responsibilities'],
  ['leadership experience', '### Leadership Experience'],
  ['achievements', '### Achievements & Recognition'],
  ['awards', '### Awards'],
  ['hackathons', '### Hackathons'],
  ['competitions', '### Competitions'],

  ['github', '### GitHub Profile'],
  ['github profile', '### GitHub Repositories'],
  ['repositories', '### Code Repositories'],
  ['coding profile', '### Coding Profiles'],
  ['open source', '### Open Source Contributions'],
  ['contributions', '### GitHub Contributions'],

  ['certifications', '### Certifications'],
  ['oracle certifications', '### Oracle Cloud Certifications'],
  ['cloud certifications', '### Cloud Certifications'],
  ['ai certifications', '### AI Certifications'],
  ['latest certification', '### Latest Certification'],

  ['portfolio', '### Portfolio Website'],
  ['personal website', '### Personal Portfolio'],
  ['portfolio projects', '### Portfolio Projects'],

  ['linkedin', '### LinkedIn Profile'],
  ['linkedin id', '### LinkedIn & Professional Profiles'],
  ['email', '### Email Address'],
  ['phone number', '### Contact Number'],
  ['contact', '### Contact Information'],
  ['how to contact you', '### Contact Kartik Raikar'],
  ['schedule interview', '### Schedule an Interview'],

  ['strengths', '### Strengths'],
  ['weaknesses', '### Weaknesses'],
  ['why this company', '### Why This Company?'],
  ['why this role', '### Why This Role?'],
  ['expected salary', '### Salary Expectations'],
  ['relocation', '### Relocation Preferences'],
  ['notice period', '### Availability & Notice Period'],
  ['where do you see yourself in 5 years', '### Five-Year Career Plan'],
  ['what motivates you', '### Motivation'],

  ['biggest challenge', '### Biggest Challenge'],
  ['hardest project', '### Most Challenging Project'],
  ['debugging experience', '### Debugging Experience'],
  ['failure story', '### Failure & Learning'],
  ['success story', '### Success Story'],
  ['teamwork', '### Team Collaboration'],
  ['leadership', '### Leadership Example'],
  ['conflict resolution', '### Conflict Resolution'],
  ['handling pressure', '### Working Under Pressure'],
  ['deadline management', '### Deadline Management'],

  ['dsa', '### Data Structures & Algorithms'],
  ['coding skills', '### Coding Skills'],
  ['leetcode', '### LeetCode Profile'],
  ['problem solving', '### Problem Solving Skills'],

  ['python', '### Python Skills'],
  ['java', '### Java Skills'],
  ['sql', '### SQL Skills'],
  ['mysql', '### MySQL'],
  ['postgresql', '### PostgreSQL'],
  ['mongodb', '### MongoDB'],
  ['oracle cloud', '### Oracle Cloud Infrastructure'],
  ['azure', '### Microsoft Azure'],
  ['aws', '### Amazon Web Services'],
  ['gcp', '### Google Cloud Platform'],

  ['what are you learning now', '### Current Learning Journey'],
  ['current focus', '### Current Focus Areas'],
  ['future roadmap', '### Future Learning Roadmap'],
  ['upcoming certifications', '### Upcoming Certifications'],
  ['next project', '### Upcoming Projects'],

  ['summarize resume', '### Resume Summary'],
  ['summarize profile', '### Professional Summary'],
  ['summarize skills', '### Skills Summary'],
  ['summarize projects', '### Project Summary'],
  ['one minute introduction', '### 1-Minute Professional Pitch'],
  ['technical interview summary', '### Technical Interview Summary'],
  ['hr interview summary', '### HR Interview Summary'],

  ['compare atlasos vs debate arena', '### Project Comparison'],
  ['compare all projects', '### Complete Project Comparison'],
  ['recommend best project', '### Best Project Recommendation'],
  ['strongest skill', '### Strongest Skills'],
  ['biggest achievement', '### Biggest Achievement'],
  ['career timeline', '### Career Timeline'],
  ['technical timeline', '### Technical Growth Timeline'],
  ['experience with llms', '### LLM Experience'],
  ['experience with rag', '### RAG Experience'],
  ['experience with cloud', '### Cloud Experience'],
  ['experience with ai', '### AI Experience'],
  ['how many projects have you built', '### Project Statistics'],
  ['which project uses rag', '### RAG-Based Projects'],
  ['which project uses llms', '### LLM-Based Projects'],
  ['which project uses cloud', '### Cloud-Based Projects'],
  ['which project is best for ai engineer', '### Best AI Project'],
  ['which certification is most relevant', '### Most Relevant Certification'],
  ['explain projects from easiest to hardest', '### Project Difficulty Ranking'],
  ['recommend project for this job', '### Job Description Matching'],
  ['match my resume with this jd', '### Resume vs Job Description Analysis'],
  ['interview me', '### AI Mock Interview'],
  ['ask technical questions', '### Technical Interview Mode'],
  ['ask hr questions', '### HR Interview Mode'],
  ['give interview feedback', '### Personalized Interview Feedback']
];

let passed = 0;
let failed = 0;
for (const [q, expectedHeading] of tests) {
  const res = matchChatbotIntent(q);
  if (!res) {
    console.error('❌ FAILED (no match): ' + q);
    failed++;
  } else if (!res.startsWith(expectedHeading)) {
    const actualHeading = res.split('\n')[0];
    console.error('❌ MISMATCH: ' + q + ' -> expected "' + expectedHeading + '", got "' + actualHeading + '"');
    failed++;
  } else {
    passed++;
  }
}
console.log('\n=======================================');
console.log('RESULTS: ' + passed + '/' + tests.length + ' PASSED (' + failed + ' failed)');
console.log('=======================================');

if (failed > 0) {
  process.exit(1);
}
