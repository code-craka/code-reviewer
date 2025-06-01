
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import AlertComponent from '@/components/ui/CustomAlert'; 
import Spinner from '@/components/ui/Spinner'; 
import { LogIn, Mail, Github, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

interface AuthFormProps {
  initialError?: string;
  initialMessage?: string;
}

export default function AuthForm({ initialError, initialMessage }: AuthFormProps) {
  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); 
  
  const [error, setError] = useState<string | null>(initialError || null);
  const [info, setInfo] = useState<string | null>(initialMessage || null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Get the next path for redirection after login
  const nextPathAfterLogin = searchParams.get('next') || '/reviewer';
  
  useEffect(() => {
    setError(searchParams.get('error'));
    setInfo(searchParams.get('message'));
    
    // Check for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Get stored redirect path or use default
        const redirectPath = localStorage.getItem('authRedirectPath') || nextPathAfterLogin;
        // Clear stored path
        localStorage.removeItem('authRedirectPath');
        // Force a hard navigation to ensure the session is properly loaded
        window.location.href = redirectPath;
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, nextPathAfterLogin, supabase.auth]);

  const getRedirectURL = () => {
    const nextPath = searchParams.get('next') || '/reviewer';
    let url = process.env.NEXT_PUBLIC_SITE_URL ||
              (typeof window !== 'undefined' ? window.location.origin : '') ||
              'http://localhost:3000/';
    url = url.includes('http') ? url : `https://${url}`;
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
    url += `auth/callback?next=${encodeURIComponent(nextPath)}`;
    return url;
  };
  
  // nextPathAfterLogin is now defined at the top of the component

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      if (isLoginMode) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
          setError(loginError.message);
        } else {
          // Force a hard navigation instead of client-side routing to ensure the session is properly loaded
          window.location.href = nextPathAfterLogin;
          return; // Prevent further execution
        }
      } else { 
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { user_name: username || undefined }, // Send undefined if empty
            emailRedirectTo: getRedirectURL(), 
          },
        });
        if (signupError) {
          setError(signupError.message);
        } else {
          if (data.session) {
            // Force a hard navigation for signup with immediate session
            window.location.href = nextPathAfterLogin;
            return; // Prevent further execution
          } else {
            setInfo('Signup successful! Please check your email to confirm your account.');
            setIsLoginMode(true);
          }
        }
      }
    });
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError(null);
    setInfo(null);
    // Store the redirect path in localStorage before OAuth flow
    localStorage.setItem('authRedirectPath', nextPathAfterLogin);
    startTransition(async () => {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectURL(),
        },
      });
      if (oauthError) setError(oauthError.message);
    });
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      // Store the redirect path in localStorage before magic link flow
      localStorage.setItem('authRedirectPath', nextPathAfterLogin);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getRedirectURL(),
        },
      });
      if (error) setError(error.message);
      else setInfo('Check your email for the magic link!');
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isLoginMode ? 
            <LogIn size={40} className="mx-auto text-primary mb-3" /> :
            <UserPlus size={40} className="mx-auto text-primary mb-3" />
          }
          <CardTitle className="text-2xl sm:text-3xl">{isLoginMode ? "Welcome Back!" : "Create Account"}</CardTitle>
          <CardDescription>{isLoginMode ? "Log in to continue." : "Sign up to get started."}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {error && <AlertComponent type="error" message={error} onClose={() => setError(null)} className="mb-4" />}
          {info && <AlertComponent type="info" message={info} onClose={() => setInfo(null)} className="mb-4" />}

          <form onSubmit={handleEmailPasswordAuth} className="space-y-5">
            {!isLoginMode && (
              <div className="space-y-1">
                <Label htmlFor="username">Username (Optional)</Label>
                <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_username" />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? <Spinner className="h-5 w-5" /> : (isLoginMode ? 'Log In' : 'Sign Up')}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isLoginMode ? "New user?" : "Already have an account?"}{' '}
            <Button 
              variant="link"
              onClick={() => { setIsLoginMode(!isLoginMode); setError(null); setInfo(null); }}
              className="p-0 h-auto font-medium"
            >
              {isLoginMode ? "Create an account" : "Log in"}
            </Button>
          </p>

          <div className="my-6 flex items-center">
            <Separator className="flex-grow" />
            <span className="flex-shrink mx-4 text-muted-foreground text-sm">OR</span>
            <Separator className="flex-grow" />
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isPending}
              className="w-full"
            >
              <GoogleIcon className="h-5 w-5 mr-2" />
              Continue with Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('github')}
              disabled={isPending}
              className="w-full"
            >
              <Github size={20} className="mr-2" />
              Continue with GitHub
            </Button>
          </div>

          <div className="my-6 flex items-center">
            <Separator className="flex-grow" />
            <span className="flex-shrink mx-4 text-muted-foreground text-sm">OR</span>
            <Separator className="flex-grow" />
          </div>
          
          <form onSubmit={handleMagicLinkSignIn} className="space-y-3">
            <div className="space-y-1">
                <Label htmlFor="magicLinkEmail">Sign in with Magic Link</Label>
              <Input
                id="magicLinkEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
              />
            </div>
            <Button
              variant="outline" // Or a custom variant
              type="submit"
              disabled={isPending}
              className="w-full"
            >
              {isPending ? <Spinner className="h-5 w-5 mr-2" /> : <Mail size={18} className="mr-2" />}
              Send Magic Link
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Remember to add ShadCN UI components used:
// npx shadcn-ui@latest add button input label card separator
// And Alert is already being handled by components/ui/CustomAlert.tsx (which uses shadcn alert)
// Spinner is your custom components/ui/Spinner.tsx
// Make sure NEXT_PUBLIC_SITE_URL is set in your .env.local
// e.g., NEXT_PUBLIC_SITE_URL=http://localhost:3000 (for local dev)
//       NEXT_PUBLIC_SITE_URL=https://yourdomain.com (for production)
