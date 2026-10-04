import { matchChatbotIntent } from "../src/data/chatbotIntents";

const RECRUITER_PROMPTS = [
  "💼 Why should I hire Kartik?",
  "⚡ Tell me about AIOps Root Cause Correlator.",
  "📚 Tell me about VersionRAG.",
  "🔧 Tell me about GitHub MCP Toolkit.",
  "📊 Tell me about ApexRAG.",
  "🤖 Explain all AI projects.",
  "📜 Show all certifications.",
  "💻 What programming languages and frameworks does he know?",
  "📄 Summarize Kartik's resume.",
  "🏆 What makes him different from other candidates?"
];

console.log("=== Testing 10 Recruiter Suggested Prompts ===");
let allPassed = true;

for (const prompt of RECRUITER_PROMPTS) {
  const result = matchChatbotIntent(prompt);
  if (result) {
    console.log(`✅ MATCHED: "${prompt}"`);
    console.log(`   Preview: ${result.slice(0, 75).replace(/\n/g, ' ')}...\n`);
  } else {
    console.error(`❌ NO MATCH: "${prompt}"\n`);
    allPassed = false;
  }
}

if (!allPassed) {
  console.error("\n❌ Some recruiter prompts failed to match!");
  process.exit(1);
} else {
  console.log("✨ All 10 Recruiter Prompts matched with 100% precision!");
}
