"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, AtSign, ArrowRight, UserPlus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const domain = "yourtempmail.com";


  useEffect(() => {
    const aliasParam = searchParams.get("alias");
    if (aliasParam) {
      setAlias(aliasParam);
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          alias: alias || undefined
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user && alias) {
      setTimeout(async () => {
        try {
          await fetch('/api/profile/alias', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user!.id,
              alias: alias.toLowerCase().replace(/[^a-z0-9]/g, '')
            })
          });
        } catch (updateError) {
          console.error("Error updating alias:", updateError);
        }
        router.push("/inbox");
      }, 1000);
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
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter italic">Join Us</h1>
            <p className="font-black text-black dark:text-white uppercase tracking-[0.2em] text-[10px] bg-zinc-100 dark:bg-zinc-900 py-2 inline-block px-4 border-2 border-black dark:border-white">
              {alias ? `RESERVE: ${alias}@${domain}` : "FREE REGISTRATION"}
            </p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-8">
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

              <div className="space-y-2">
                <label className="font-black text-xs uppercase tracking-[0.3em] block">Custom Alias (Optional)</label>
                <div className="relative group">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-black dark:text-white" />
                  <Input
                    type="text"
                    placeholder="YOUR-ALIAS"
                    className="pl-14 h-16 border-4 border-black dark:border-white rounded-none bg-white dark:bg-black font-black text-lg focus-visible:ring-0 focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-950 transition-all placeholder:opacity-20 pr-40"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs opacity-50 uppercase">
                    @{domain}
                  </div>
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
                  {alias ? "CLAIM ALIAS" : "GET STARTED"}
                  <ArrowRight className="w-8 h-8" />
                </>
              )}
            </Button>
            
            <div className="text-center pt-4">
              <Link href="/auth/login" className="font-black text-sm uppercase tracking-widest text-black dark:text-white hover:text-indigo-600 transition-colors border-b-4 border-indigo-600 pb-1">
                Already have an account? Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
