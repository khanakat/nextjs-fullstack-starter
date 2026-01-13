// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { installTestMocks, resetTestMocks } from "./src/__tests__/utils/test-mocks";

// Polyfill for Web APIs in Node.js environment
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'stream/web';

// Set up global polyfills for Web APIs
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;

// Mock Request and Response for Next.js server components
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      const url = typeof input === 'string' ? input : input.url;
      this._url = url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body || null;
    }
    
    get url() {
      return this._url;
    }

    async json() {
      try {
        // String body
        if (typeof this.body === 'string') {
          return JSON.parse(this.body);
        }

        // ReadableStream body (e.g., from NextRequest)
        if (this.body && typeof this.body === 'object' && typeof this.body.getReader === 'function') {
          const reader = this.body.getReader();
          const decoder = new TextDecoder();
          let text = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // value can be Uint8Array or string depending on polyfill
            if (typeof value === 'string') {
              text += value;
            } else {
              text += decoder.decode(value, { stream: true });
            }
          }
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        }

        // Plain object body
        if (this.body && typeof this.body === 'object') {
          return this.body;
        }

        return this.body;
      } catch (e) {
        return this.body;
      }
    }
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers);
    }
    
    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    }

    // Add instance JSON parser to consume NextResponse in tests
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
  };
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this._headers = new Map();
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value));
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => this.set(key, value));
        }
      }
    }
    
    set(key, value) {
      this._headers.set(key.toLowerCase(), String(value));
    }
    
    get(key) {
      return this._headers.get(key.toLowerCase()) || null;
    }
    
    has(key) {
      return this._headers.has(key.toLowerCase());
    }
    
    delete(key) {
      this._headers.delete(key.toLowerCase());
    }
    
    entries() {
      return this._headers.entries();
    }
  };
}

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock environment variables
process.env.NODE_ENV = "test";

// Provide a global ReportTemplateCategory used by some integration tests
global.ReportTemplateCategory = {
  STANDARD: 'STANDARD',
  SALES: 'SALES', // used by tests
  PREMIUM: 'PREMIUM',
  ENTERPRISE: 'ENTERPRISE',
};

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock crypto.randomUUID if not available
if (!global.crypto) {
  global.crypto = {};
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = jest.fn(() => {
    // Generate a UUID v4 format for testing
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  });
}

// Mock Prisma Client as a virtual module to avoid resolution errors
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    report: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
  })),
}), { virtual: true });

// Mock next-auth and lib/auth for API route tests
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue(null),
}), { virtual: true });

jest.mock('@/lib/auth', () => ({
  authOptions: {},
  auth: jest.fn(() => ({ userId: null })),
  currentUser: jest.fn(() => null),
}), { virtual: true });

// Mock Clerk server auth to prevent ESM import issues
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({ userId: null })),
  currentUser: jest.fn(() => null),
}), { virtual: true });

// Centralized mocks for external services to avoid ESM issues
installTestMocks();
beforeEach(() => {
  resetTestMocks();
  // Reset notification store between tests to avoid cross-test leakage
  try {
    const { notificationStore } = require('./lib/notifications');
    if (notificationStore && typeof notificationStore.resetForTests === 'function') {
      notificationStore.resetForTests();
    }
  } catch {}
});

// Patch DI types resolution for compiled relative paths
jest.mock('../../../../../shared/infrastructure/di/types', () => ({
  TYPES: {
    PrismaClient: Symbol.for('PrismaClient'),
  },
}), { virtual: true });

jest.mock('../../../../shared/infrastructure/di/types', () => ({
  TYPES: {
    PrismaClient: Symbol.for('PrismaClient'),
  },
}), { virtual: true });

// Mock @paralleldrive/cuid2
jest.mock('@paralleldrive/cuid2', () => {
  let counter = 0;
  return {
    createId: jest.fn(() => {
      // Generate a consistent, valid CUID-like string for testing
      // Format: 'test' + padded counter + random chars to reach 24 chars
      counter++;
      const paddedCounter = counter.toString().padStart(4, '0');
      const randomSuffix = 'abcdefghij1234567890'; // 20 chars
      return `test${paddedCounter}${randomSuffix}`.substring(0, 24);
    }),
    init: jest.fn(),
    getConstants: jest.fn(),
    isCuid: jest.fn(() => true),
  };
});

// Mock Inversify container
jest.mock('inversify', () => ({
  Container: jest.fn().mockImplementation(() => ({
    bind: jest.fn().mockReturnThis(),
    to: jest.fn().mockReturnThis(),
    toConstantValue: jest.fn().mockReturnThis(),
    inSingletonScope: jest.fn().mockReturnThis(),
    get: jest.fn(),
    isBound: jest.fn(),
  })),
  injectable: jest.fn(() => (target) => target),
  inject: jest.fn(() => () => {}),
}));

// Mock Server-Sent Events
global.EventSource = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  readyState: 1,
}));

// -----------------------------
// Test Fetch Router
// -----------------------------
// Route test fetch() calls to Next.js API handlers
global.fetch = jest.fn(async (input, init = {}) => {
  const base = "http://localhost";
  const urlStr = typeof input === "string" ? (input.startsWith("http") ? input : base + input) : (input && input.url ? input.url : base);
  const url = new URL(urlStr);
  const path = url.pathname + (url.search || "");
  const method = (init.method || (typeof input === "object" && input.method) || "GET").toUpperCase();
  const headers = new Headers(init.headers || (typeof input === "object" ? input.headers : {}));
  const body = init.body || (typeof input === "object" ? input.body : undefined);

  // Build a Request compatible with our route handlers
  const req = new Request(url.toString(), { method, headers, body });

  try {
    // Lazy require route modules to ensure polyfills are in place
    const NotificationsRoute = require("./app/api/notifications/route");
    const NotificationIdRoute = require("./app/api/notifications/[id]/route");
    const NotificationReadRoute = require("./app/api/notifications/[id]/read/route");
    const NotificationDeliveryStatusRoute = require("./app/api/notifications/[id]/delivery-status/route");
    const NotificationsBulkRoute = require("./app/api/notifications/bulk/route");
    const NotificationsBulkReadRoute = require("./app/api/notifications/bulk/read/route");
    const NotificationsPreferencesRoute = require("./app/api/notifications/preferences/route");
    const NotificationsFromTemplateRoute = require("./app/api/notifications/from-template/route");
    const NotificationsScheduleRoute = require("./app/api/notifications/schedule/route");

    // Preferences
    if (path.startsWith("/api/notifications/preferences")) {
      if (method === "PUT" && NotificationsPreferencesRoute.PUT) {
        return await NotificationsPreferencesRoute.PUT(req);
      }
    }

    // Bulk operations
    if (path.startsWith("/api/notifications/bulk/read")) {
      if (method === "PUT" && NotificationsBulkReadRoute.PUT) {
        return await NotificationsBulkReadRoute.PUT(req);
      }
    }
    if (path.startsWith("/api/notifications/bulk")) {
      if (method === "POST" && NotificationsBulkRoute.POST) {
        return await NotificationsBulkRoute.POST(req);
      }
    }

    // From template
    if (path.startsWith("/api/notifications/from-template")) {
      if (method === "POST" && NotificationsFromTemplateRoute.POST) {
        return await NotificationsFromTemplateRoute.POST(req);
      }
    }

    // Scheduling
    if (path.startsWith("/api/notifications/schedule")) {
      if (method === "POST" && NotificationsScheduleRoute.POST) {
        return await NotificationsScheduleRoute.POST(req);
      }
    }

    // Delivery status
    const deliveryMatch = path.match(/^\/(api\/notifications)\/([^\/]+)\/delivery-status/);
    if (deliveryMatch) {
      const id = deliveryMatch[2];
      if (method === "GET" && NotificationDeliveryStatusRoute.GET) {
        return await NotificationDeliveryStatusRoute.GET(req, { params: { id } });
      }
    }

    // Mark as read
    const readMatch = path.match(/^\/(api\/notifications)\/([^\/]+)\/read/);
    if (readMatch) {
      const id = readMatch[2];
      if (method === "PUT" && NotificationReadRoute.PUT) {
        return await NotificationReadRoute.PUT(req, { params: { id } });
      }
    }

    // Single notification by ID
    const idMatch = path.match(/^\/(api\/notifications)\/([^\/?#]+)(\?.*)?$/);
    if (idMatch && !path.includes("/read") && !path.includes("/delivery-status") && !path.includes("/bulk") && !path.includes("/from-template") && !path.includes("/schedule")) {
      const id = idMatch[2];
      if (method === "GET" && NotificationIdRoute.GET) {
        return await NotificationIdRoute.GET(req, { params: { id } });
      }
      if (method === "PATCH" && NotificationIdRoute.PATCH) {
        return await NotificationIdRoute.PATCH(req, { params: { id } });
      }
      if (method === "DELETE" && NotificationIdRoute.DELETE) {
        return await NotificationIdRoute.DELETE(req, { params: { id } });
      }
    }

    // Notifications list/create
    if (path.startsWith("/api/notifications")) {
      if (method === "GET" && NotificationsRoute.GET) {
        return await NotificationsRoute.GET(req);
      }
      if (method === "POST" && NotificationsRoute.POST) {
        return await NotificationsRoute.POST(req);
      }
    }

    // Fallback 404 for unknown routes
    return Response.json({ success: false, error: "Not Found" }, { status: 404 });
  } catch (err) {
    return Response.json({ success: false, error: "Router error", details: String(err) }, { status: 500 });
  }
});
