/**
 * Test utilities for API requests and responses
 * Provides type-safe helpers to avoid common testing pitfalls
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates a proper Request object for testing API routes
 * Avoids the "request.json is not a function" error
 */
export function createTestRequest(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
    query?: Record<string, string>;
  } = {}
): Request {
  const { method = 'GET', body, headers = {}, query } = options;
  
  // Build URL with query parameters
  const fullUrl = query ? `${url}?${new URLSearchParams(query)}` : url;
  
  // Create proper headers
  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  });
  
  // Create request body
  const requestBody = body ? JSON.stringify(body) : null;
  
  // Create native Request object (not NextRequest to avoid issues)
  return new Request(fullUrl, {
    method,
    headers: requestHeaders,
    body: requestBody,
  });
}

/**
 * Safely extracts JSON from a request body
 * Handles edge cases and provides proper error handling
 */
export async function safeRequestJson(request: Request): Promise<any> {
  try {
    // Check if request has body
    if (!request.body) {
      return null;
    }
    
    // Clone the request to avoid consuming the body
    const clonedRequest = request.clone();
    
    // Try to get text first (more reliable than json())
    const text = await clonedRequest.text();
    
    if (!text) {
      return null;
    }
    
    // Parse JSON from text
    return JSON.parse(text);
  } catch (error) {
    // If JSON parsing fails, return null instead of throwing
    if (error instanceof SyntaxError) {
      console.warn('Invalid JSON in request body:', error.message);
      return null;
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Creates a successful JSON response
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Creates an error response with proper formatting
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
): NextResponse<{
  error: string;
  details?: any;
  timestamp: string;
}> {
  return NextResponse.json({
    error: message,
    details,
    timestamp: new Date().toISOString(),
  }, { status });
}

export const testDataBuilders = {
  createScheduledReport: (overrides?: Partial<CreateScheduledReportRequest>) => ({
    name: 'Test Report',
    description: 'Test description',
    reportId: '550e8400-e29b-41d4-a716-446655440000',
    schedule: '0 9 * * 1',
    timezone: 'UTC',
    recipients: ['test@example.com'],
    format: 'pdf' as const,
    options: {
      includeCharts: true,
      includeData: true,
      includeMetadata: false,
    },
    isActive: true,
    organizationId: 'test-org-123',
    ...overrides,
  }),

  createReportExecution: (overrides?: Partial<ReportExecution>) => ({
    id: 'exec-123',
    scheduledReportId: 'report-123',
    status: 'completed' as const,
    startedAt: new Date().toISOString(),
    completedAt: new Date(Date.now() + 30000).toISOString(),
    duration: 30000,
    fileSize: 1024 * 1024,
    downloadUrl: '/api/reports/exec-123/download',
    error: null,
    ...overrides,
  }),
};



// Helper para crear un mock de NextRequest con body JSON
export const createMockNextRequest = (body: any, options: Partial<NextRequest> = {}) => {
  const bodyStr = JSON.stringify(body);
  const request = new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    body: bodyStr,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  // Asegurar que request.json funcione correctamente
  request.json = jest.fn().mockResolvedValue(body);
  
  return request;
}