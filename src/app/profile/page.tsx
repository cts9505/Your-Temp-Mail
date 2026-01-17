"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { getDomain } from "@/lib/domain";
import { useRouter } from "next/navigation";
import { User as UserIcon, Mail, Shield, AlertTriangle, LogOut, Trash2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

interface Profile {
  alias: string;
  is_premium: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [customAlias, setCustomAlias] = useState("");
  const [suggestedAlias, setSuggestedAlias] = useState("");
  const [activatingAlias, setActivatingAlias] = useState(false);
  const router = useRouter();
  const domain = getDomain();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push("/auth/login");
      return;
    }
    
    fetchProfile(user.id);
    generateSuggestedAlias(user.email);
  }, [user, authLoading, router]);

  const generateSuggestedAlias = (email: string) => {
    // Generate a suggested alias from email
    const username = email.split('@')[0].toLowerCase();
    const randomNum = Math.floor(Math.random() * 9999);
    const cleanUsername = username.replace(/[^a-z0-9]/g, '');
    setSuggestedAlias(`${cleanUsername}${randomNum}`);
  };

  const regenerateSuggestion = () => {
    if (user?.email) {
      generateSuggestedAlias(user.email);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
    setLoading(false);
  };

  const activateAlias = async (alias: string) => {
    if (!alias || alias.length < 3) {
      toast.error("Alias must be at least 3 characters");
      return;
    }

    // Validate alphanumeric only
    if (!/^[a-z0-9]+$/i.test(alias)) {
      toast.error("Alias must contain only letters and numbers");
      return;
    }

    setActivatingAlias(true);

    try {
      // Check availability
      const checkRes = await fetch(`/api/alias/check?alias=${alias.toLowerCase()}`);
      const checkData = await checkRes.json();

      if (!checkData.available) {
        toast.error("This alias is already taken");
        setActivatingAlias(false);
        return;
      }

      // Update profile with new alias
      const updateRes = await fetch(`/api/profile/alias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: alias.toLowerCase() })
      });

      if (updateRes.ok) {
        toast.success("Alias activated successfully!");
        // Wait a moment then redirect to inbox
        setTimeout(() => {
          router.push('/inbox');
        }, 1000);
      } else {
        toast.error("Failed to activate alias");
      }
    } catch (error) {
      toast.error("Error activating alias");
    }

    setActivatingAlias(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const deleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action is irreversible and all your emails will be deleted.")) {
      toast.error("Account deletion requires administrative privileges in this demo.");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasAlias = profile?.alias || user?.alias;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* No Alias - Show Activation */}
          {!hasAlias && (
            <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-zinc-900 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Custom Identity
                </CardTitle>
                <CardDescription>Choose your unique handle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Suggested Alias */}
                <div className="p-4 bg-white dark:bg-zinc-950 rounded-lg border-2 border-indigo-100 dark:border-indigo-900">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Suggested for you
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={regenerateSuggestion}
                      className="h-8 px-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {suggestedAlias}
                    </span>
                    <span className="text-zinc-400">@{domain}</span>
                  </div>
                  <Button
                    onClick={() => activateAlias(suggestedAlias)}
                    disabled={activatingAlias}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {activatingAlias ? "Activating..." : "Get This Email"}
                  </Button>
                </div>

                {/* Custom Alias */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-2">
                    Or choose your own
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="superhero"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        className="pr-48 font-mono"
                        maxLength={20}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 pointer-events-none">
                        @{domain}
                      </span>
                    </div>
                    <Button
                      onClick={() => activateAlias(customAlias)}
                      disabled={activatingAlias || !customAlias || customAlias.length < 3}
                      className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 whitespace-nowrap"
                    >
                      {activatingAlias ? "..." : "Activate"}
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    Alphanumeric characters only (a-z, 0-9)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
              {hasAlias && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-zinc-500">Active Alias</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {profile?.alias || user?.alias}@{domain}
                    </span>
                  </div>
                </div>
              )}
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
