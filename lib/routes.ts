/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  "/",
  "/about",
  "/pricing",
  "/features",
  "/contact",
  "/privacy",
  "/terms",
  "/api/webhook",
  "/api/uploadthing",
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /dashboard
 * @type {string[]}
 */
export const authRoutes = [
  "/sign-in",
  "/sign-up",
  "/sso-callback",
];

/**
 * An array of routes that require authentication
 * These routes will redirect unauthenticated users to /sign-in
 * @type {string[]}
 */
export const protectedRoutes = [
  "/dashboard",
  "/dashboard/(.*)",
  "/admin",
  "/admin/(.*)", 
  "/profile",
  "/profile/(.*)",
  "/settings",
  "/settings/(.*)",
  "/api/protected",
  "/api/protected/(.*)",
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

/**
 * Check if a route is public
 * @param {string} pathname - The route pathname
 * @returns {boolean}
 */
export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.includes("(.*)")) {
      const baseRoute = route.replace("(.*)", "");
      return pathname.startsWith(baseRoute);
    }
    return pathname === route;
  });
}

/**
 * Check if a route is an auth route
 * @param {string} pathname - The route pathname  
 * @returns {boolean}
 */
export function isAuthRoute(pathname: string): boolean {
  return authRoutes.includes(pathname);
}

/**
 * Check if a route is protected
 * @param {string} pathname - The route pathname
 * @returns {boolean} 
 */
export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => {
    if (route.includes("(.*)")) {
      const baseRoute = route.replace("(.*)", "");
      return pathname.startsWith(baseRoute);
    }
    return pathname === route;
  });
}

/**
 * Check if a route is an API auth route
 * @param {string} pathname - The route pathname
 * @returns {boolean}
 */
export function isApiAuthRoute(pathname: string): boolean {
  return pathname.startsWith(apiAuthPrefix);
}