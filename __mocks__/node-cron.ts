/**
 * Mock for node-cron module
 */

export const validate = jest.fn((cronExpression: string) => {
  // Basic validation for common cron patterns
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return false;
  
  // Mock validation logic
  if (cronExpression === '* * * * *') return false; // Too frequent
  if (cronExpression === 'invalid') return false;
  if (cronExpression === '0 25 * * *') return false; // Invalid hour
  
  return true;
});

export const schedule = jest.fn((cronExpression: string, task: () => void) => {
  return {
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  };
});

export default {
  validate,
  schedule,
};