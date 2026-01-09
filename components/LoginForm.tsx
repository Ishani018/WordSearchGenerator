'use client';

import { useState } from 'react';
import { Lock, User, LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { login } from '@/lib/auth-client';

export default function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate network delay for better UX feel
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = await login(username, password);
    
    if (result.success) {
      onLogin();
    } else {
      setError(result.error || 'Invalid credentials');
      setIsLoading(false);
      // Trigger shake animation
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-mesh-pattern opacity-100 pointer-events-none" />
      
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />

      <div className={`w-full max-w-sm relative z-10 transition-transform duration-100 ${shake ? 'translate-x-[-10px] animate-shake' : ''}`}>
        {/* Main Card */}
        <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-border/20 p-8 relative overflow-hidden">
          
          {/* Top Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl mb-4 text-primary ring-1 ring-primary/20 shadow-inner">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Welcome Back</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Username</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-transparent focus:border-primary/30 rounded-xl text-foreground focus:ring-4 focus:ring-primary/10 focus:bg-background transition-all outline-none text-sm placeholder:text-muted-foreground/50"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-secondary/50 border border-transparent focus:border-primary/30 rounded-xl text-foreground focus:ring-4 focus:ring-primary/10 focus:bg-background transition-all outline-none text-sm placeholder:text-muted-foreground/50"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center justify-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-12 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 rounded-xl mt-2" 
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <LogIn className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </div>
        
        {/* Simple Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8 opacity-60">
          &copy; {new Date().getFullYear()} Ishani Chakraborty
        </p>
      </div>
      
      {/* CSS for Shake Animation */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}