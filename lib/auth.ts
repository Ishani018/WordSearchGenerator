/**
 * Simple authentication configuration
 * All credentials are stored in environment variables for security
 * Set the following in .env.local:
 * - NEXT_PUBLIC_ADMIN_USERNAME
 * - NEXT_PUBLIC_ADMIN_PASSWORD
 * - NEXT_PUBLIC_SAMPA_USERNAME
 * - NEXT_PUBLIC_SAMPA_PASSWORD
 */

export interface User {
  username: string;
  password: string;
}

// Get credentials from environment variables (no fallbacks - must be set in .env.local)
const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
const SAMPA_USERNAME = process.env.NEXT_PUBLIC_SAMPA_USERNAME;
const SAMPA_PASSWORD = process.env.NEXT_PUBLIC_SAMPA_PASSWORD;

// Validate that all credentials are set
if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !SAMPA_USERNAME || !SAMPA_PASSWORD) {
  throw new Error(
    'Missing authentication credentials in environment variables. ' +
    'Please set NEXT_PUBLIC_ADMIN_USERNAME, NEXT_PUBLIC_ADMIN_PASSWORD, ' +
    'NEXT_PUBLIC_SAMPA_USERNAME, and NEXT_PUBLIC_SAMPA_PASSWORD in .env.local'
  );
}

export const USERS: User[] = [
  {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  },
  {
    username: SAMPA_USERNAME,
    password: SAMPA_PASSWORD,
  },
];

/**
 * Check if credentials are valid
 */
export function validateCredentials(username: string, password: string): boolean {
  const user = USERS.find(u => u.username === username);
  return user?.password === password;
}

/**
 * Check if user is authenticated (client-side check)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('wordsearch_auth') === 'true';
}

/**
 * Set authentication status
 */
export function setAuthenticated(authenticated: boolean): void {
  if (typeof window === 'undefined') return;
  if (authenticated) {
    localStorage.setItem('wordsearch_auth', 'true');
  } else {
    localStorage.removeItem('wordsearch_auth');
  }
}

