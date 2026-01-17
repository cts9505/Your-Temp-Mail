"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { 
  RefreshCcw, Trash2, Copy, Check, 
  Inbox, ArrowRight, Loader2, Edit3, 
  UserPlus, Search, X, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { copyToClipboard, generateUniqueTempAlias } from "@/lib/utils";
import { getGuestAliasFromCookie, setGuestAliasCookie } from "@/lib/auth-utils";
import { extractSenderName, toIST } from "@/lib/time-utils";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDomain } from "@/lib/domain";

interface Email {
  id: string;
  sender: string;
  subject: string;
  received_at: string;
  body_text: string;
  recipient_alias: string;
  is_read?: boolean;
}

interface Profile {
  alias: string;
}

export default function InboxPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeAlias, setActiveAlias] = useState<string | null>(null);
  const [permanentAlias, setPermanentAlias] = useState<string | null>(null); // User's saved alias
  const [mounted, setMounted] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [customAlias, setCustomAlias] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  const router = useRouter();
  const domain = getDomain();

  useEffect(() => {
    setMounted(true);
    const initInbox = async () => {
      console.log('🚀 Init inbox - authLoading:', authLoading, 'initialized:', initialized);
      if (authLoading || initialized) {
        console.log('⏭️ Skipping init - already loading or initialized');
        return;
      }

      console.log('✅ Starting initialization...');
      let currentAlias = null;

      // Check guest cookie first (for both auth and non-auth users)  
      const guestAlias = await getGuestAliasFromCookie();
      console.log('🍪 Guest alias from cookie:', guestAlias);
      
      if (user) {
        console.log('👤 Logged in user detected:', user.id);
        // Fetch profile from API
        try {
          const response = await fetch(`/api/profile?userId=${user.id}`);
          if (response.ok) {
            const profileData = await response.json();
            console.log('Profile data:', profileData);
            
            // Save permanent alias if user has one
            if (profileData.alias) {
              setPermanentAlias(profileData.alias);
            }
            
            // Priority: guest cookie (temp email) > profile alias > auto-generate
            if (guestAlias) {
              // User is using a temporary email - show it
              console.log('Using temporary alias from cookie:', guestAlias);
              setActiveAlias(guestAlias);
              setProfile({ ...profileData, alias: guestAlias });
              fetchEmailsByAlias(guestAlias);
            } else if (profileData.alias) {
              // No temp email, use permanent alias
              setActiveAlias(profileData.alias);
              setProfile(profileData);
              await setGuestAliasCookie(profileData.alias);
              fetchEmailsByAlias(profileData.alias);
            } else {
              // No alias anywhere - generate temporary unique alias
              console.log('No alias found, generating temporary alias...');
              const tempAlias = generateUniqueTempAlias();
              
              console.log('Generated temporary alias:', tempAlias);
              setActiveAlias(tempAlias);
              setProfile({ ...profileData, alias: tempAlias });
              await setGuestAliasCookie(tempAlias);
              toast.success(`Temporary email: ${tempAlias}@${domain}`, {
                description: "Activate it in your profile to keep it permanently!"
              });
              fetchEmailsByAlias(tempAlias);
            }
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setLoading(false);
        }
      } else {
        console.log('👻 Guest user');
        // Guest user - only use cookie
        if (guestAlias) {
          console.log('Guest alias from cookie:', guestAlias);
          currentAlias = guestAlias;
          setActiveAlias(guestAlias);
          setProfile({ alias: guestAlias });
          fetchEmailsByAlias(guestAlias);
        } else {
          console.log('No guest alias found, loading=false');
          setLoading(false);
        }
      }
      
      setInitialized(true);
      console.log('✅ Initialization complete');
    };

    initInbox();
  }, [user, authLoading]);

  const fetchEmailsByAlias = async (alias: string) => {
    console.log('📧 Fetching emails for alias:', alias);
    setRefreshing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sec timeout
      
      const response = await fetch(`/api/inbox?alias=${alias}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Emails loaded:', data.emails?.length || 0, 'emails');
        // API returns { emails: [...], total, limit, offset, unread }
        setEmails(Array.isArray(data) ? data : (data.emails || []));
        setUnreadCount(data.unread || 0);
      } else {
        console.error('❌ Email fetch failed:', response.status);
        setEmails([]);
        toast.error('Failed to load emails');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('⏱️ Request timeout');
        toast.error('Request timeout - please try again');
      } else {
        console.error("❌ Error fetching emails:", error);
        toast.error('Failed to load emails');
      }
      setEmails([]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const deleteEmail = async (emailId: string) => {
    try {
      const response = await fetch(`/api/inbox/${emailId}`, { method: 'DELETE' });
      if (response.ok) {
        setEmails(emails.filter((e) => e.id !== emailId));
        toast.success("Email deleted");
      }
    } catch (error) {
      toast.error("Failed to delete email");
    }
  };

  const copyAlias = async (aliasToCopy: string) => {
    const success = await copyToClipboard(`${aliasToCopy}@${domain}`);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Alias copied to clipboard");
    }
  };

  const handleNewRandom = async () => {
    console.log("🔄 Change button clicked");
    setRefreshing(true);
    try {
      const tempAlias = generateUniqueTempAlias();
      console.log("✅ Generated new unique alias:", tempAlias);
      
      await setGuestAliasCookie(tempAlias);
      console.log("✅ Cookie set successfully");
      
      toast.success("New temporary email generated!");
      console.log("🔄 About to reload page...");
      window.location.reload();
    } catch (error) {
      console.error("❌ Failed to generate new alias:", error);
      toast.error("Failed to generate new email");
      setRefreshing(false);
    }
  };

  const checkAvailability = async () => {
    if (!customAlias.trim()) return;
    setIsChecking(true);
    const cleanAlias = customAlias.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    try {
      const response = await fetch(`/api/alias/check?alias=${cleanAlias}`);
      const result = await response.json();
      if (result.available) {
        await setGuestAliasCookie(cleanAlias);
        setIsChanging(false);
        setCustomAlias("");
        toast.success("Switched to " + cleanAlias + "@" + domain);
        window.location.reload();
      } else {
        toast.error("Alias taken");
      }
    } catch (err) {
      toast.error("Error");
    } finally {
      setIsChecking(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600/20" />
      </div>
    );
  }

  if (!activeAlias && !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center gap-6">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent pointer-events-none" />
        <Inbox className="w-20 h-20 text-black dark:text-white" />
        <h1 className="text-4xl font-black uppercase tracking-tighter">No active inbox found</h1>
        <Button onClick={() => router.push('/')} className="bg-black dark:bg-white text-white dark:text-black font-black px-8 py-6 text-xl border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          CREATE AN EMAIL
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent pointer-events-none" />
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16 relative">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="border-4 border-black dark:border-white p-8 bg-white dark:bg-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
              <h2 className="font-black text-sm uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Active Address
              </h2>
              <div className="space-y-6">
                <div className="text-3xl md:text-4xl font-black break-all pb-4 border-b-2 border-black/10 dark:border-white/10 flex items-center justify-between group">
                  <span className="italic tracking-tighter">{activeAlias}<span className="opacity-20 not-italic">@{domain}</span></span>
                  <button onClick={() => copyAlias(activeAlias || "")} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                {/* Show permanent alias info for logged-in users */}
                {user && permanentAlias && permanentAlias !== activeAlias && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-600 dark:border-indigo-400">
                    <div className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
                      Your Permanent Email
                    </div>
                    <div className="font-bold text-sm break-all">{permanentAlias}@{domain}</div>
                    <Button
                      onClick={async () => {
                        setRefreshing(true);
                        await setGuestAliasCookie(permanentAlias);
                        window.location.reload();
                      }}
                      variant="outline"
                      className="mt-3 w-full text-xs font-black"
                    >
                      Switch to Permanent
                    </Button>
                  </div>
                )}
                
                  <div className="grid gap-6">
                    <Button 
                      onClick={() => fetchEmailsByAlias(activeAlias || "")}
                      disabled={refreshing}
                      className="w-full h-20 bg-indigo-600 text-white font-black border-[6px] border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all gap-4 text-2xl tracking-tighter uppercase italic"
                    >
                      <RefreshCcw className={`w-8 h-8 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh Inbox
                    </Button>

                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={handleNewRandom}
                        disabled={refreshing}
                        className="h-20 border-[6px] border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex flex-col items-center justify-center gap-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] uppercase tracking-tighter italic disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCcw className={`w-8 h-8 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>New Temp</span>
                      </Button>
                      <Button 
                        onClick={async () => {
                          setRefreshing(true);
                          const tempAlias = generateUniqueTempAlias();
                          await setGuestAliasCookie(tempAlias);
                          toast.success("Identity wiped. New one ready.");
                          router.push('/');
                        }}
                        disabled={refreshing}
                        className="h-20 border-[6px] border-black dark:border-white bg-red-500 text-white font-black hover:bg-black transition-all flex flex-col items-center justify-center gap-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] uppercase tracking-tighter italic disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className={`w-8 h-8`} />
                        <span>Delete</span>
                      </Button>
                    </div>

                    <Button 
                      onClick={() => setIsChanging(true)}
                      className="w-full h-20 bg-black dark:bg-white text-white dark:text-black font-black border-[6px] border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all gap-4 text-2xl tracking-tighter uppercase italic"
                    >
                      <Sparkles className="w-8 h-8" />
                      Create Custom
                    </Button>
                  </div>

              </div>
            </div>

            {!user && (
              <Link 
                href={`/auth/register?alias=${activeAlias}`}
                className="block group"
              >
                <div className="border-4 border-indigo-600 dark:border-indigo-400 p-6 bg-indigo-50 dark:bg-indigo-950/20 shadow-[12px_12px_0px_0px_#4f46e5] transition-all group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-none">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg uppercase tracking-tight">Make it Permanent?</h3>
                      <p className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-widest mt-1">
                        Register to keep this address forever
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 ml-auto mt-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )}

            </aside>


          {/* Inbox Content */}
          <div className="lg:col-span-8">
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,0.1)] min-h-[600px] flex flex-col">
              <div className="p-8 border-b-4 border-black dark:border-white flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
                <h1 className="text-4xl font-black uppercase tracking-tighter">Inbox</h1>
                <div className="flex items-center gap-4">
                  {unreadCount > 0 && (
                    <div className="px-3 py-1 bg-indigo-600 text-white font-black text-sm border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {unreadCount} NEW
                    </div>
                  )}
                  <div className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-black text-xl">
                    {emails.length}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                {emails.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-32 text-center px-4">
                    <Inbox className="w-24 h-24 mb-6 opacity-10" />
                    <h3 className="text-2xl font-black uppercase tracking-tight">Your inbox is empty</h3>
                    <p className="font-bold text-zinc-400 mt-2 uppercase tracking-widest text-xs">Waiting for incoming messages...</p>
                    <Button 
                      onClick={() => fetchEmailsByAlias(activeAlias || "")}
                      variant="ghost" 
                      className="mt-8 font-black text-indigo-600"
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      RELOAD
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y-4 divide-black dark:divide-white">
                    {emails.map((email) => (
                      <div key={email.id} className={`group relative hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors ${!email.is_read ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''}`}>
                        <Link href={`/inbox/${email.id}`} className="block p-8 pr-20">
                          <div className="flex items-center gap-3 mb-2">
                            {!email.is_read && (
                              <span className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></span>
                            )}
                            <span className="font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-sm">
                              {extractSenderName(email.sender)}
                            </span>
                            <span className="font-bold text-zinc-400 text-xs uppercase tracking-widest">
                              {formatDistanceToNow(toIST(email.received_at))} ago
                            </span>
                          </div>
                          <h3 className={`text-2xl font-black tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${!email.is_read ? 'text-black dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {email.subject}
                          </h3>
                          <p className="font-bold text-zinc-500 dark:text-zinc-400 line-clamp-1">
                            {email.body_text}
                          </p>
                        </Link>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            deleteEmail(email.id);
                          }}
                          className="absolute right-8 top-1/2 -translate-y-1/2 p-4 border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-red-500 hover:text-white transition-all rounded-xl"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Change/Custom Alias Dialog */}
      <Dialog open={isChanging} onOpenChange={setIsChanging}>
        <DialogContent className="sm:max-w-md p-0 bg-white dark:bg-black border-4 border-black dark:border-white rounded-none shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden">
          <div className="p-8 space-y-8">
            <div className="space-y-2 text-center">
              <DialogTitle className="text-4xl font-black uppercase tracking-tighter">Switch Address</DialogTitle>
              <p className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-xs">All existing mail for this address will remain accessible if you switch back</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-black text-xs uppercase tracking-widest">New Alias</label>
                <div className="relative group">
                  <Input 
                    placeholder="e.g. workspace" 
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="h-16 border-4 border-black dark:border-white rounded-none bg-white dark:bg-black font-black text-1xl px-6 focus-visible:ring-0 focus-visible:border-indigo-600 transition-colors pr-32"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-sm text-indigo-600 dark:text-indigo-400 uppercase">
                    @{domain}
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={checkAvailability}
                disabled={isChecking || !customAlias.trim()}
                className="w-full h-20 bg-black dark:bg-white text-white dark:text-black font-black text-xl border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] hover:bg-indigo-600 hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-none gap-3"
              >
                {isChecking ? <Loader2 className="w-8 h-8 animate-spin" /> : "SWITCH NOW"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
