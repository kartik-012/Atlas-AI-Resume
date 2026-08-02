async function testApi() {
  const queries = [
    "who are you?",
    "explain numpygpt",
    "atlasos architecture",
    "why should we hire you?",
    "oracle certifications",
    "dsa",
    "interview me"
  ];

  for (const q of queries) {
    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, history: [] })
    });
    const text = await res.text();
    const clean = text
      .split("\n")
      .filter(l => l.startsWith("data: "))
      .map(l => {
        try {
          return JSON.parse(l.replace("data: ", "")).chunk || "";
        } catch {
          return "";
        }
      })
      .join("");
    
    console.log(`\n========================================`);
    console.log(`QUERY: "${q}"`);
    console.log(`STATUS: ${res.status}`);
    console.log(`FIRST 120 CHARS: ${clean.slice(0, 120).replace(/\n/g, " ")}...`);
    if (res.status !== 200 || clean.length < 20) {
      console.error(`❌ HTTP TEST FAILED for query: ${q}`);
      process.exit(1);
    }
  }
  console.log("\n✅ ALL HTTP API ENDPOINT TESTS PASSED!");
}

testApi();
