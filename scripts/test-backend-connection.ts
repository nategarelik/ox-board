/**
 * @fileoverview Backend Connection Test Script
 * @description Tests connection to deployed Stemify backend
 *
 * Usage:
 *   npx ts-node scripts/test-backend-connection.ts <backend-url>
 *
 * Example:
 *   npx ts-node scripts/test-backend-connection.ts https://ox-board-backend.railway.app
 */

const BACKEND_URL =
  process.argv[2] ||
  process.env.NEXT_PUBLIC_STEMIFY_API_URL ||
  "http://localhost:8000";

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version?: string;
  environment?: string;
}

async function testHealthEndpoint(baseUrl: string): Promise<void> {
  console.log(`\n🔍 Testing health endpoint: ${baseUrl}/api/v1/health`);

  try {
    const response = await fetch(`${baseUrl}/api/v1/health`);

    if (!response.ok) {
      console.error(
        `❌ Health check failed: ${response.status} ${response.statusText}`,
      );
      return;
    }

    const health: HealthResponse = await response.json();
    console.log(`✅ Health check passed!`);
    console.log(`   Status: ${health.status}`);
    console.log(`   Timestamp: ${health.timestamp}`);
    console.log(`   Version: ${health.version || "N/A"}`);
    console.log(`   Environment: ${health.environment || "N/A"}`);
  } catch (error: any) {
    console.error(`❌ Connection failed: ${error.message}`);
    console.error(`   Make sure the backend is deployed and accessible`);
  }
}

async function testRootEndpoint(baseUrl: string): Promise<void> {
  console.log(`\n🔍 Testing root endpoint: ${baseUrl}/`);

  try {
    const response = await fetch(`${baseUrl}/`);

    if (!response.ok) {
      console.error(
        `❌ Root endpoint failed: ${response.status} ${response.statusText}`,
      );
      return;
    }

    const data = await response.json();
    console.log(`✅ Root endpoint accessible!`);
    console.log(`   Name: ${data.name || "N/A"}`);
    console.log(`   Version: ${data.version || "N/A"}`);
    console.log(`   Environment: ${data.environment || "N/A"}`);
    if (data.docs) {
      console.log(`   API Docs: ${baseUrl}${data.docs}`);
    }
  } catch (error: any) {
    console.error(`❌ Connection failed: ${error.message}`);
  }
}

async function testCORS(baseUrl: string): Promise<void> {
  console.log(`\n🔍 Testing CORS configuration`);

  try {
    const response = await fetch(`${baseUrl}/api/v1/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
      },
    });

    const corsHeaders = {
      "Access-Control-Allow-Origin": response.headers.get(
        "Access-Control-Allow-Origin",
      ),
      "Access-Control-Allow-Methods": response.headers.get(
        "Access-Control-Allow-Methods",
      ),
      "Access-Control-Allow-Headers": response.headers.get(
        "Access-Control-Allow-Headers",
      ),
    };

    if (corsHeaders["Access-Control-Allow-Origin"]) {
      console.log(`✅ CORS is configured`);
      console.log(
        `   Allow-Origin: ${corsHeaders["Access-Control-Allow-Origin"]}`,
      );
      console.log(
        `   Allow-Methods: ${corsHeaders["Access-Control-Allow-Methods"] || "N/A"}`,
      );
      console.log(
        `   Allow-Headers: ${corsHeaders["Access-Control-Allow-Headers"] || "N/A"}`,
      );
    } else {
      console.warn(`⚠️  CORS headers not found - may need configuration`);
    }
  } catch (error: any) {
    console.error(`❌ CORS test failed: ${error.message}`);
  }
}

async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  OX Board Backend Connection Test`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\n📡 Testing backend: ${BACKEND_URL}`);

  if (!BACKEND_URL || BACKEND_URL === "http://localhost:8000") {
    console.warn(`\n⚠️  WARNING: Using default localhost URL`);
    console.warn(`   For production testing, provide backend URL:`);
    console.warn(
      `   npx ts-node scripts/test-backend-connection.ts https://your-backend.railway.app`,
    );
  }

  // Run tests
  await testRootEndpoint(BACKEND_URL);
  await testHealthEndpoint(BACKEND_URL);
  await testCORS(BACKEND_URL);

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Test Summary`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\n✅ If all tests passed, your backend is ready!`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Add to .env.local:`);
  console.log(`      NEXT_PUBLIC_STEMIFY_API_URL=${BACKEND_URL}`);
  console.log(`   2. Restart frontend: npm run dev`);
  console.log(`   3. Test file upload in Terminal UI`);
  console.log(`\n`);
}

main().catch(console.error);
