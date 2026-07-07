'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Coffee, Lock, User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username or password.');
        setIsLoading(false);
      } else {
        // Successful login, fetch user session to determine redirect
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        const role = session?.user?.role;

        // Redirect based on role
        if (role === 'ADMIN') {
          router.push('/admin');
        } else if (role === 'CASHIER') {
          router.push('/cashier');
        } else if (role === 'BARISTA') {
          router.push('/barista');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#2c1d11] via-[#4a3525] to-[#785b46] px-4 overflow-hidden">
      {/* Background Coffee Beans / Graphic Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#3e2c1c]/30 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#1c120a]/40 blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border border-white/10 bg-white/10 dark:bg-black/30 backdrop-blur-md shadow-2xl text-white">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-[#ebd9cc]/20 p-3 rounded-full border border-white/20">
                <Coffee className="h-10 w-10 text-[#f5d9c3]" />
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold tracking-tight">Smart Coffee</CardTitle>
            <CardDescription className="text-[#ebd9cc]/75 font-medium">
              Management Portal
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="flex items-center gap-2 bg-destructive/20 border border-destructive/50 text-[#ff8e8e] px-4 py-3 rounded-lg text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#ebd9cc] font-medium">Username</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/50">
                    <User className="h-5 w-5" />
                  </span>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder-white/40 focus:border-[#ebd9cc] focus:ring-0 rounded-lg"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#ebd9cc] font-medium">Password</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/50">
                    <Lock className="h-5 w-5" />
                  </span>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder-white/40 focus:border-[#ebd9cc] focus:ring-0 rounded-lg"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-8 pt-4">
              <Button
                type="submit"
                className="w-full bg-[#f5d9c3] hover:bg-[#ebceb5] text-[#2c1d11] font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
              <div className="text-center text-xs text-[#ebd9cc]/50 mt-2">
                <p>Default credentials (username / password):</p>
                <p className="mt-1">admin / admin123  |  kasir / kasir123  |  barista / barista123</p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
