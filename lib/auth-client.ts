'use client';

/**
 * Client-side authentication utilities
 * All actual validation happens on the server via API routes
 */

/**
 * Check if user is authenticated (client-side check via API)
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.authenticated === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
}

/**
 * Login - sends credentials to server for validation
 */
export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/**
 * Logout - clears session on server
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth', {
      method: 'DELETE',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

