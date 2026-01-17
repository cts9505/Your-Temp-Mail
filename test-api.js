#!/usr/bin/env node

/**
 * API Test Script
 * Tests all API endpoints with real data
 * Usage: node test-api.js
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`   Endpoint: ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Response:`, JSON.stringify(data, null, 2).split('\n').slice(0, 10).join('\n'));
      if (JSON.stringify(data).split('\n').length > 10) {
        console.log('   ... (truncated)');
      }
      return true;
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   Error:`, data);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  🚀 API Endpoint Testing');
  console.log('═══════════════════════════════════════════');
  
  console.log('\n📋 Make sure the dev server is running:');
  console.log('   npm run dev\n');

  await new Promise(resolve => setTimeout(resolve, 1000));

  const tests = [
    // Inbox tests
    ['/api/inbox?alias=testuser', 'Get testuser inbox'],
    ['/api/inbox?alias=testuser&limit=5', 'Get testuser inbox (limited)'],
    ['/api/inbox?alias=testuser&search=welcome', 'Search testuser emails'],
    ['/api/inbox?alias=demouser', 'Get demouser inbox'],
    ['/api/inbox?alias=guest123', 'Get guest inbox'],
    
    // Stats tests
    ['/api/inbox/stats?alias=testuser', 'Get testuser stats'],
    ['/api/inbox/stats?alias=demouser', 'Get demouser stats'],
    
    // Senders test
    ['/api/inbox/senders?alias=testuser', 'Get testuser senders'],
    
    // Search test
    ['/api/inbox/search?alias=testuser&q=notification', 'Advanced search'],
    
    // Alias check
    ['/api/alias/check?alias=testuser', 'Check existing alias'],
    ['/api/alias/check?alias=newuser999', 'Check available alias'],
  ];

  let passed = 0;
  let failed = 0;

  for (const [endpoint, description] of tests) {
    const result = await testAPI(endpoint, description);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  📊 Test Results');
  console.log('═══════════════════════════════════════════');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Total: ${passed + failed}`);
  console.log('═══════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 All tests passed! Your API is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.\n');
  }
}

runTests().catch(console.error);
