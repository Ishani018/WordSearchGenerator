import { NextRequest, NextResponse } from 'next/server';

// Server-side authentication - passwords never exposed to client
const USERS = [
  {
    username: process.env.ADMIN_USERNAME || 'Admin',
    password: process.env.ADMIN_PASSWORD || '',
  },
  {
    username: process.env.SAMPA_USERNAME || 'Sampa',
    password: process.env.SAMPA_PASSWORD || '',
  },
];

// Validate credentials on server
function validateCredentials(username: string, password: string): boolean {
  const user = USERS.find(u => u.username === username);
  return user?.password === password;
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
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }
  } catch (error) {
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

