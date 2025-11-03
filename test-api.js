/**
 * Simple API test script
 * Run with: node test-api.js
 * Make sure dev server is running first: npm run dev
 */

const API_URL = 'http://localhost:3000';

async function testChatAPI() {
  console.log('\n🧪 Testing /api/chat...\n');

  const testCases = [
    {
      name: 'Valid request',
      payload: {
        problem: '2x + 5 = 13',
        messages: [
          {
            role: 'student',
            content: "I don't know where to start",
            timestamp: new Date().toISOString(),
          },
        ],
      },
      expectedStatus: 200,
    },
    {
      name: 'Missing problem field',
      payload: {
        messages: [],
      },
      expectedStatus: 400,
    },
    {
      name: 'Problem too long',
      payload: {
        problem: 'x'.repeat(501),
        messages: [],
      },
      expectedStatus: 400,
    },
    {
      name: 'Invalid messages format',
      payload: {
        problem: '2x + 5 = 13',
        messages: 'not an array',
      },
      expectedStatus: 400,
    },
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify(testCase.payload),
      });

      const data = await response.json();
      const statusMatch = response.status === testCase.expectedStatus;

      console.log(`${statusMatch ? '✅' : '❌'} ${testCase.name}`);
      console.log(`   Status: ${response.status} (expected ${testCase.expectedStatus})`);

      if (response.ok) {
        console.log(`   Response preview: ${data.response?.substring(0, 100)}...`);
      } else {
        console.log(`   Error: ${data.error}`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ ${testCase.name}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
}

async function testVisionAPI() {
  console.log('\n🧪 Testing /api/vision...\n');

  const testCases = [
    {
      name: 'Missing image field',
      payload: {},
      expectedStatus: 400,
    },
    {
      name: 'Invalid mime type',
      payload: {
        image: 'base64string',
        mimeType: 'image/gif',
      },
      expectedStatus: 400,
    },
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${API_URL}/api/vision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify(testCase.payload),
      });

      const data = await response.json();
      const statusMatch = response.status === testCase.expectedStatus;

      console.log(`${statusMatch ? '✅' : '❌'} ${testCase.name}`);
      console.log(`   Status: ${response.status} (expected ${testCase.expectedStatus})`);
      console.log(`   Error: ${data.error}`);
      console.log('');
    } catch (error) {
      console.log(`❌ ${testCase.name}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
}

async function testCORS() {
  console.log('\n🧪 Testing CORS protection...\n');

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil-site.com',
      },
      body: JSON.stringify({
        problem: '2x + 5 = 13',
        messages: [],
      }),
    });

    if (response.status === 403) {
      console.log('✅ CORS protection working (rejected unauthorized origin)\n');
    } else {
      console.log('❌ CORS protection not working (should have rejected)\n');
    }
  } catch (error) {
    console.log(`❌ CORS test error: ${error.message}\n`);
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════');
  console.log('  Socrates API Test Suite');
  console.log('═══════════════════════════════════════');

  // Check if server is running
  try {
    await fetch(API_URL);
  } catch (error) {
    console.log('\n❌ Error: Dev server not running!');
    console.log('   Start it with: npm run dev\n');
    process.exit(1);
  }

  await testChatAPI();
  await testVisionAPI();
  await testCORS();

  console.log('═══════════════════════════════════════');
  console.log('  Tests complete!');
  console.log('═══════════════════════════════════════\n');
}

runTests();
