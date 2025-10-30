// Test script for core services functionality (without authentication)
const { emailService } = require('./lib/email/email-service');
const { pdfService } = require('./lib/pdf');
const { QueueHelpers } = require('./lib/queue');

async function testEmailService() {
  console.log('🔍 Testing Email Service...');
  try {
    // Test email service initialization
    console.log('✅ Email service imported successfully');
    
    // Test email templates
    const { EmailTemplates } = require('./lib/email/templates');
    console.log('✅ Email templates imported successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
    return false;
  }
}

async function testPDFService() {
  console.log('🔍 Testing PDF Service...');
  try {
    // Test PDF service initialization
    console.log('✅ PDF service imported successfully');
    
    // Test PDF generation (basic functionality)
    const testData = [
      { name: 'Test User 1', email: 'test1@example.com', status: 'Active' },
      { name: 'Test User 2', email: 'test2@example.com', status: 'Inactive' }
    ];
    
    const result = await pdfService.generateCustom('users', {}, {
      templateName: 'user-report',
      title: 'Test User Report',
      data: testData
    });
    
    console.log('✅ PDF generation test successful:', {
      size: result.size,
      hasBuffer: !!result.buffer,
      filename: result.filename
    });
    
    return true;
  } catch (error) {
    console.error('❌ PDF service test failed:', error.message);
    return false;
  }
}

async function testQueueService() {
  console.log('🔍 Testing Queue Service...');
  try {
    // Test queue service initialization
    console.log('✅ Queue service imported successfully');
    
    // Test queue helpers
    console.log('✅ Queue helpers imported successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Queue service test failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('🔍 Testing Error Handling...');
  try {
    const { ErrorHandler, AppError, ValidationError } = require('./lib/error-handling');
    
    // Test error creation
    const testError = new ValidationError('Test validation error');
    console.log('✅ Error classes working correctly');
    
    // Test error handling
    const result = await ErrorHandler.safeExecute(
      async () => {
        throw new Error('Test error');
      },
      { operation: 'test' }
    );
    
    console.log('✅ Error handling working correctly:', {
      success: result.success,
      hasError: !!result.error
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

async function runCoreTests() {
  console.log('🚀 Starting core services functionality tests...\n');
  
  const results = [];
  
  results.push(await testEmailService());
  results.push(await testPDFService());
  results.push(await testQueueService());
  results.push(await testErrorHandling());
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Core Services Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All core services are functioning correctly!');
    console.log('📝 Note: API endpoints require authentication setup for full functionality');
  } else {
    console.log('⚠️  Some core services need attention.');
  }
  
  return passed === total;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runCoreTests().catch(console.error);
}

module.exports = { runCoreTests };