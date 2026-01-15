"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { User as UserIcon, Mail, Shield, AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

interface Profile {
  alias: string;
  is_premium: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);
      fetchProfile(user.id);
    };

    checkUser();
  }, [router]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) setProfile(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const deleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action is irreversible and all your emails will be deleted.")) {
      // In a real app, you'd use a service role or a specialized edge function to delete auth user
      // For this demo, we'll just sign out and show a message
      toast.error("Account deletion requires administrative privileges in this demo.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile Info */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                Identity
              </CardTitle>
              <CardDescription>Your personal and alias information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-zinc-500">Real Email</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-zinc-500">Active Alias</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {profile?.alias}@yourtempmail.com
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-indigo-600" />
                Subscription Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-black rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div>
                  <div className="font-bold">{profile?.is_premium ? "Premium" : "Free"}</div>
                  <p className="text-sm text-zinc-500">
                    {profile?.is_premium 
                      ? "You have full access to all features." 
                      : "Upgrade to get more aliases and longer retention."}
                  </p>
                </div>
                {!profile?.is_premium && (
                  <Button className="bg-indigo-600 hover:bg-indigo-700">Upgrade</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold">Delete Account</div>
                  <p className="text-sm text-zinc-500">Permanently delete your account and all data.</p>
                </div>
                <Button variant="destructive" size="sm" onClick={deleteAccount}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
            <CardFooter className="border-t border-red-100 dark:border-red-900/30 pt-4 flex justify-center">
              <Button variant="ghost" className="text-zinc-500" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
