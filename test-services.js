// Test script for core services integration
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testHealthEndpoint() {
  console.log('🔍 Testing health endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Health endpoint:', response.status, data);
    return response.ok;
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.message);
    return false;
  }
}

async function testQueueEndpoint() {
  console.log('🔍 Testing queue endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/queue`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json();
    console.log('✅ Queue endpoint:', response.status, data);
    return response.status === 200 || response.status === 401; // 401 is expected without auth
  } catch (error) {
    console.error('❌ Queue endpoint failed:', error.message);
    return false;
  }
}

async function testEmailEndpoint() {
  console.log('🔍 Testing email endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/email`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json();
    console.log('✅ Email endpoint:', response.status, data);
    return response.status === 200 || response.status === 401; // 401 is expected without auth
  } catch (error) {
    console.error('❌ Email endpoint failed:', error.message);
    return false;
  }
}

async function testExportEndpoint() {
  console.log('🔍 Testing export endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/export`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json();
    console.log('✅ Export endpoint:', response.status, data);
    return response.status === 200 || response.status === 401; // 401 is expected without auth
  } catch (error) {
    console.error('❌ Export endpoint failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting core services integration tests...\n');
  
  const results = [];
  
  results.push(await testHealthEndpoint());
  results.push(await testQueueEndpoint());
  results.push(await testEmailEndpoint());
  results.push(await testExportEndpoint());
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All core services are working correctly!');
  } else {
    console.log('⚠️  Some services need attention.');
  }
  
  return passed === total;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };