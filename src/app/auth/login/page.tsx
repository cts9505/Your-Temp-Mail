"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || "Login failed");
      setLoading(false);
    } else {
      router.push("/inbox");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent pointer-events-none" />
      <Navbar />
      <div className="flex items-center justify-center min-h-screen pt-20 px-4 relative">
        <div className="w-full max-w-md border-[6px] border-black dark:border-white bg-white dark:bg-black shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(255,255,255,0.1)] p-8 md:p-12">
          <div className="space-y-4 mb-10 text-center">
            <div className="inline-block p-4 border-4 border-black dark:border-white mb-4 bg-indigo-600">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter italic">Login</h1>
            <p className="font-black text-black dark:text-white uppercase tracking-[0.2em] text-[10px] bg-zinc-100 dark:bg-zinc-900 py-2 inline-block px-4 border-2 border-black dark:border-white">
              Authorized Personnel Only
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-8">
            {error && (
              <div className="p-4 border-4 border-black bg-red-500 text-white font-black text-sm uppercase tracking-tight shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-black text-xs uppercase tracking-[0.3em] block">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-black dark:text-white" />
                  <Input
                    type="email"
                    placeholder="EMAIL@DOMAIN.COM"
                    className="pl-14 h-16 border-4 border-black dark:border-white rounded-none bg-white dark:bg-black font-black text-lg focus-visible:ring-0 focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-950 transition-all placeholder:opacity-20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-black text-xs uppercase tracking-[0.3em] block">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-black dark:text-white" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-14 h-16 border-4 border-black dark:border-white rounded-none bg-white dark:bg-black font-black text-lg focus-visible:ring-0 focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-950 transition-all placeholder:opacity-20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-20 bg-black dark:bg-white text-white dark:text-black font-black text-2xl border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(79,70,229,1)] hover:bg-indigo-600 hover:text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all rounded-none gap-4" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  PROCEED
                  <ArrowRight className="w-8 h-8" />
                </>
              )}
            </Button>
            
            <div className="text-center pt-4">
              <Link href="/auth/register" className="font-black text-sm uppercase tracking-widest text-black dark:text-white hover:text-indigo-600 transition-colors border-b-4 border-indigo-600 pb-1">
                Create Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
