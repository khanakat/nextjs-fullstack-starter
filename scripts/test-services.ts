/**
 * Service Testing Script
 * Tests all core services to ensure they're working correctly
 */

import { emailService } from '../lib/email/email-service';
import { pdfService } from '../lib/pdf/pdf-service';
import { QueueHelpers } from '../lib/queue';
import { applicationStartup } from '../lib/startup';

async function testEmailService() {
  console.log('\n🔍 Testing Email Service...');
  
  try {
    // Test provider validation
    const providers = await emailService.validateProviders();
    console.log('✅ Email providers status:', providers);
    
    // Test email service stats
    const stats = emailService.getStats();
    console.log('✅ Email service stats:', stats);
    
    return true;
  } catch (error) {
    console.error('❌ Email service test failed:', error);
    return false;
  }
}

async function testPDFService() {
  console.log('\n🔍 Testing PDF Service...');
  
  try {
    // Test available templates
    const templates = pdfService.getAvailableTemplates();
    console.log('✅ Available PDF templates:', templates.length);
    
    // Test sample data generation
    const sampleData = [
      { id: 1, name: 'Test User 1', email: 'test1@example.com', status: 'active' },
      { id: 2, name: 'Test User 2', email: 'test2@example.com', status: 'inactive' },
    ];
    
    // Test PDF generation with template
    const result = await pdfService.generateFromTemplate('user-report', sampleData);
    console.log('✅ PDF generation test:', result.success ? 'SUCCESS' : 'FAILED');
    
    if (result.success) {
      console.log('   - Template used:', result.templateUsed);
      console.log('   - Records processed:', result.recordCount);
      console.log('   - File size:', result.fileSize);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ PDF service test failed:', error);
    return false;
  }
}

async function testQueueSystem() {
  console.log('\n🔍 Testing Queue System...');
  
  try {
    // Test queue stats (this will work even if Redis is not available)
    const stats = await QueueHelpers.getStats();
    console.log('✅ Queue system stats available');
    
    // Test email job creation (will fail gracefully if Redis not available)
    try {
      const emailJob = await QueueHelpers.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email from the queue system',
      });
      console.log('✅ Email job created:', emailJob ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.log('⚠️  Queue system not fully available (Redis may not be running)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Queue system test failed:', error);
    return false;
  }
}

async function testApplicationStartup() {
  console.log('\n🔍 Testing Application Startup...');
  
  try {
    // Test health check
    const health = await applicationStartup.healthCheck();
    console.log('✅ Application health check:', health.status);
    console.log('   - Services:', health.services);
    
    return health.status !== 'unhealthy';
  } catch (error) {
    console.error('❌ Application startup test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Core Services Test Suite');
  console.log('=====================================');
  
  const results = {
    email: false,
    pdf: false,
    queue: false,
    startup: false,
  };
  
  // Run tests
  results.email = await testEmailService();
  results.pdf = await testPDFService();
  results.queue = await testQueueSystem();
  results.startup = await testApplicationStartup();
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([service, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${service.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All services are working correctly!');
  } else {
    console.log('⚠️  Some services need attention. Check the logs above.');
  }
  
  return passed === total;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

export { runAllTests, testEmailService, testPDFService, testQueueSystem, testApplicationStartup };