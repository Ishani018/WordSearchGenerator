'use client';

import { useState } from 'react';
import { Lock, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { login } from '@/lib/auth-client';

export default function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = await login(username, password);
    if (result.success) {
      onLogin();
    } else {
      setError(result.error || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-xl border border-border p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to generate puzzles</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{error}</div>}

            <Button type="submit" disabled={isLoading} className="w-full h-10 font-semibold" size="lg">
              {isLoading ? 'Checking...' : 'Sign In'} <LogIn className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
