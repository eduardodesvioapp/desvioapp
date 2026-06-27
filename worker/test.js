// Test script for the R2 Worker
// Run with: node test.js

const WORKER_URL = "http://localhost:8787";

async function testHealth() {
  console.log("Testing health endpoint...");
  const response = await fetch(`${WORKER_URL}/api/r2/health`);
  const data = await response.json();
  console.log("Health:", data);
  return data.status === "ok";
}

async function testPresignedUrl() {
  console.log("\nTesting presigned URL generation...");
  const response = await fetch(`${WORKER_URL}/api/r2/presigned-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: "test-image.jpg",
      contentType: "image/jpeg",
      folder: "media",
      userId: "test-user-123"
    })
  });

  const data = await response.json();
  console.log("Presigned URL response:", data);
  return !!data.uploadUrl;
}

async function runTests() {
  console.log("🧪 Running R2 Worker Tests\n");

  try {
    const healthOk = await testHealth();
    const presignedOk = await testPresignedUrl();

    console.log("\n📊 Test Results:");
    console.log(`Health: ${healthOk ? "✅" : "❌"}`);
    console.log(`Presigned URL: ${presignedOk ? "✅" : "❌"}`);

    if (healthOk && presignedOk) {
      console.log("\n✅ All tests passed!");
    } else {
      console.log("\n❌ Some tests failed");
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
  }
}

runTests();