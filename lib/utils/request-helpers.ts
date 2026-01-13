/**
 * Request Helper Utilities
 * 
 * Utilities for safely handling Next.js App Router Request objects
 */

import { NextRequest } from 'next/server';

/**
 * Safely parse JSON from a Next.js Request object
 * Handles both the standard request.json() method and fallback to text parsing
 * 
 * @param request - Next.js Request object
 * @returns Parsed JSON object or empty object if parsing fails
 */
export async function safeRequestJson<T = any>(request: NextRequest): Promise<T> {
  try {
    // Try the standard request.json() method first
    const body = await request.json();
    
    // Validate that we got a valid object
    if (body === null || typeof body !== 'object') {
      throw new Error('Invalid JSON: expected object');
    }
    
    return body as T;
  } catch (error) {
    // If request.json() fails, try parsing from text
    try {
      const text = await request.text();
      
      // Handle empty body
      if (!text || text.trim() === '') {
        return {} as T;
      }
      
      const parsed = JSON.parse(text);
      
      // Validate parsed result
      if (parsed === null || typeof parsed !== 'object') {
        throw new Error('Invalid JSON: expected object');
      }
      
      return parsed as T;
    } catch (parseError) {
      // If all parsing attempts fail, throw a descriptive error
      throw new Error(
        `Failed to parse request body: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Extract organization ID from request
 * Checks query params and headers
 * 
 * @param request - Next.js Request object
 * @returns Organization ID or undefined
 */
export function getOrganizationId(request: NextRequest): string | undefined {
  const { searchParams } = new URL(request.url);
  return (
    searchParams.get('organizationId') ||
    request.headers.get('x-organization-id') ||
    undefined
  );
}

/**
 * Extract pagination parameters from request
 * 
 * @param request - Next.js Request object
 * @param defaults - Default values for limit and offset
 * @returns Validated pagination parameters
 */
export function getPaginationParams(
  request: NextRequest,
  defaults: { limit?: number; offset?: number } = {}
): { limit: number; offset: number; page: number } {
  const { searchParams } = new URL(request.url);
  
  const rawLimit = searchParams.get('limit') || String(defaults.limit || 20);
  const rawOffset = searchParams.get('offset') || String(defaults.offset || 0);
  
  const limitNum = Number(rawLimit);
  const offsetNum = Number(rawOffset);
  
  // Validate and constrain values
  const limit = Math.min(
    Math.max(Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 20, 1),
    100
  );
  
  const offset = Math.max(
    Number.isFinite(offsetNum) && offsetNum >= 0 ? offsetNum : 0,
    0
  );
  
  const page = Math.floor(offset / limit) + 1;
  
  return { limit, offset, page };
}

/**
 * Extract user ID from session
 * Supports demo mode
 * 
 * @param session - NextAuth session object
 * @returns User ID or 'demo-user' for demo mode
 */
export function getUserId(session: any): string {
  return session?.user?.id || 'demo-user';
}

/**
 * Check if request is in demo mode
 * 
 * @param session - NextAuth session object
 * @returns True if in demo mode
 */
export function isDemoMode(session: any): boolean {
  return !session?.user?.id;
}
