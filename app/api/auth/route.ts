import { NextRequest, NextResponse } from 'next/server';

// Server-side authentication - passwords never exposed to client
// Helper to safely get env vars (handles Vercel edge cases)
function getEnvVar(key: string, defaultValue: string = ''): string {
  const value = process.env[key];
  if (!value) {
    console.warn(`⚠️ Environment variable ${key} is not set. Using default: "${defaultValue}"`);
    return defaultValue;
  }
  return value.trim();
}

const USERS = [
  {
    username: getEnvVar('ADMIN_USERNAME', 'Admin'),
    password: getEnvVar('ADMIN_PASSWORD', ''),
  },
  {
    username: getEnvVar('SAMPA_USERNAME', 'Sampa'),
    password: getEnvVar('SAMPA_PASSWORD', ''),
  },
  {
    username: getEnvVar('SUPER10_USERNAME', 'super10'),
    password: getEnvVar('SUPER10_PASSWORD', ''),
  },
];

// Log available users on startup (without passwords)
if (typeof window === 'undefined') {
  console.log('🔐 Auth configured with users:', USERS.map(u => ({ 
    username: u.username, 
    hasPassword: !!u.password && u.password.length > 0 
  })));
}

// Validate credentials on server
function validateCredentials(username: string, password: string): boolean {
  // Trim and normalize inputs
  const normalizedUsername = username.trim();
  const normalizedPassword = password.trim();
  
  // Find user (case-insensitive username comparison)
  const user = USERS.find(u => 
    u.username.toLowerCase() === normalizedUsername.toLowerCase()
  );
  
  // Compare passwords (case-sensitive)
  return user?.password === normalizedPassword;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Debug logging (always log in Vercel to help debug)
    console.log('🔐 Auth attempt:', {
      providedUsername: username,
      providedPasswordLength: password.length,
      availableUsers: USERS.map(u => ({ 
        username: u.username, 
        hasPassword: !!u.password && u.password.length > 0,
        passwordLength: u.password.length 
      })),
      envCheck: {
        ADMIN_USERNAME: !!process.env.ADMIN_USERNAME,
        ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
        SAMPA_USERNAME: !!process.env.SAMPA_USERNAME,
        SAMPA_PASSWORD: !!process.env.SAMPA_PASSWORD,
        SUPER10_USERNAME: !!process.env.SUPER10_USERNAME,
        SUPER10_PASSWORD: !!process.env.SUPER10_PASSWORD,
      }
    });

    const isValid = validateCredentials(username, password);

    if (isValid) {
      // Generate a simple session token (in production, use proper session management)
      const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      // Set HTTP-only cookie for session
      const response = NextResponse.json({ success: true });
      response.cookies.set('auth_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    } else {
      // More helpful error message
      const errorMsg = process.env.NODE_ENV !== 'production' 
        ? `Invalid username or password. Check that environment variables are set correctly.`
        : 'Invalid username or password';
      
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Check if user is authenticated via cookie
  const sessionToken = request.cookies.get('auth_session');
  
  if (sessionToken) {
    return NextResponse.json({ authenticated: true });
  }
  
  return NextResponse.json({ authenticated: false });
}

export async function DELETE() {
  // Logout - clear session cookie
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_session');
  return response;
}

