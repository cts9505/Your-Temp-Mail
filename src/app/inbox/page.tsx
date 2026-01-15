"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
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
import { copyToClipboard } from "@/lib/utils";
import { getGuestAliasFromCookie, setGuestAliasCookie } from "@/lib/auth-utils";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface Email {
  id: string;
  sender: string;
  subject: string;
  received_at: string;
  body_text: string;
  recipient_alias: string;
}

interface Profile {
  alias: string;
}

export default function InboxPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeAlias, setActiveAlias] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [customAlias, setCustomAlias] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  
  const router = useRouter();
  const domain = "yourtempmail.com";

  useEffect(() => {
    setMounted(true);
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      let currentAlias = null;

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("alias")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          currentAlias = profileData.alias;
          setActiveAlias(profileData.alias);
          await setGuestAliasCookie(profileData.alias);
          fetchEmailsByAlias(profileData.alias);
        } else {
          setLoading(false);
        }
      } else {
        const guestAlias = await getGuestAliasFromCookie();
        if (guestAlias) {
          currentAlias = guestAlias;
          setActiveAlias(guestAlias);
          setProfile({ alias: guestAlias });
          fetchEmailsByAlias(guestAlias);
        } else {
          setLoading(false);
        }
      }

      if (currentAlias) {
        const channel = supabase
          .channel('emails_realtime_' + currentAlias)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'emails',
              filter: `recipient_alias=eq.${currentAlias}`
            },
            (payload) => {
              setEmails((prev) => [payload.new as Email, ...prev]);
              toast.success("New email received!");
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };

    checkUser();
  }, [router]);

  const fetchEmailsByAlias = async (alias: string) => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .eq("recipient_alias", alias)
      .order("received_at", { ascending: false });

    if (data) setEmails(data);
    setLoading(false);
    setRefreshing(false);
  };

  const deleteEmail = async (emailId: string) => {
    const { error } = await supabase
      .from("emails")
      .delete()
      .eq("id", emailId);

    if (!error) {
      setEmails(emails.filter((e) => e.id !== emailId));
      toast.success("Email deleted");
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
    setRefreshing(true);
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    await setGuestAliasCookie(result);
    window.location.reload();
  };

  const checkAvailability = async () => {
    if (!customAlias.trim()) return;
    setIsChecking(true);
    const cleanAlias = customAlias.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    try {
      const { data } = await supabase.from('profiles').select('alias').eq('alias', cleanAlias).maybeSingle();
      if (!data) {
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
                <div className="text-xl font-black break-all pb-4 border-b-2 border-black/10 dark:border-white/10 flex items-center justify-between group">
                  <span>{activeAlias}<span className="opacity-30">@{domain}</span></span>
                  <button onClick={() => copyAlias(activeAlias || "")} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                
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
                        className="h-24 border-[6px] border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex flex-col items-center justify-center gap-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] uppercase tracking-tighter italic"
                      >
                        <RefreshCcw className="w-8 h-8" />
                        <span>Change</span>
                      </Button>
                      <Button 
                        onClick={async () => {
                          const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
                          let result = "";
                          for (let i = 0; i < 10; i++) {
                            result += chars.charAt(Math.floor(Math.random() * chars.length));
                          }
                          await setGuestAliasCookie(result);
                          router.push('/');
                          toast.success("Identity wiped. New one ready.");
                        }}
                        className="h-24 border-[6px] border-black dark:border-white bg-red-500 text-white font-black hover:bg-black transition-all flex flex-col items-center justify-center gap-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] uppercase tracking-tighter italic"
                      >
                        <Trash2 className="w-8 h-8" />
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
                <div className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-black text-xl">
                  {emails.length}
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
                      <div key={email.id} className="group relative hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors">
                        <Link href={`/inbox/${email.id}`} className="block p-8 pr-20">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-sm">
                              {email.sender.split('@')[0]}
                            </span>
                            <span className="font-bold text-zinc-400 text-xs uppercase tracking-widest">
                              {formatDistanceToNow(new Date(email.received_at))} ago
                            </span>
                          </div>
                          <h3 className="text-2xl font-black tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
                    className="h-16 border-4 border-black dark:border-white rounded-none bg-white dark:bg-black font-black text-2xl px-6 focus-visible:ring-0 focus-visible:border-indigo-600 transition-colors pr-32"
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
