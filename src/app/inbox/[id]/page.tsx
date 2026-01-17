"use client";

import { useEffect, useState, use } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Calendar, User as UserIcon, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import { getGuestAliasFromCookie } from "@/lib/auth-utils";
import { toIST } from "@/lib/time-utils";

interface Email {
  id: string;
  sender: string;
  subject: string;
  received_at: string;
  body_text: string;
  body_html: string;
  recipient_alias: string;
}

export default function EmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
    if (authLoading) return;

    const fetchEmail = async () => {
      let allowedAliases: string[] = [];

      // Check guest cookie first (for temp emails)
      const guestAlias = await getGuestAliasFromCookie();
      if (guestAlias) {
        allowedAliases.push(guestAlias);
      }

      // Also check permanent alias for logged-in users
      if (user) {
        try {
          const response = await fetch(`/api/profile?userId=${user.id}`);
          if (response.ok) {
            const profileData = await response.json();
            if (profileData.alias && !allowedAliases.includes(profileData.alias)) {
              allowedAliases.push(profileData.alias);
            }
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }

      console.log('Allowed aliases:', allowedAliases);

      try {
        const response = await fetch(`/api/inbox/${id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Email recipient_alias:', data.recipient_alias);
          // Check if email belongs to any of the user's aliases (temp or permanent)
          if (allowedAliases.length > 0 && allowedAliases.includes(data.recipient_alias)) {
            setEmail(data);
            // Mark as read
            if (!data.is_read) {
              fetch(`/api/inbox/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: true })
              }).catch(err => console.error('Failed to mark as read:', err));
            }
          } else {
            console.error('Unauthorized: email belongs to', data.recipient_alias, 'but user has', allowedAliases);
            toast.error("Unauthorized access");
            router.push("/inbox");
          }
        } else {
          toast.error("Email not found");
          router.push("/inbox");
        }
      } catch (error) {
        toast.error("Email not found");
        router.push("/inbox");
      }
      setLoading(false);
    };

    fetchEmail();
  }, [id, router, user, authLoading]);

  const deleteEmail = async () => {
    try {
      const response = await fetch(`/api/inbox/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success("Email deleted");
        router.push("/inbox");
      }
    } catch (error) {
      toast.error("Failed to delete email");
    }
  };

  if (!mounted || loading || authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600/20" />
      </div>
    );
  }

  if (!email) return null;

  const sanitizedHtml = DOMPurify.sanitize(email.body_html || `<p>${email.body_text}</p>`, {
    USE_PROFILES: { html: true },
  });

  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent pointer-events-none" />
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16 relative max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/inbox">
            <Button 
              className="bg-black dark:bg-white text-white dark:text-black font-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              BACK TO INBOX
            </Button>
          </Link>
          <Button 
            onClick={deleteEmail}
            className="bg-red-500 text-white font-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-6"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            DELETE EMAIL
          </Button>
        </div>

        <div className="border-4 border-black dark:border-white bg-white dark:bg-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden">
          <div className="p-8 border-b-4 border-black dark:border-white bg-zinc-50 dark:bg-zinc-950">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6 leading-tight">
              {email.subject}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white border-2 border-black">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sender</div>
                  <div className="font-bold text-lg">{email.sender}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Received (IST)</div>
                  <div className="font-bold text-lg">{format(toIST(email.received_at), "PPP p")}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 p-4 border-2 border-black bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-100 font-bold mb-6">
              <Shield className="w-6 h-6" />
              <span>Safe view enabled. Scripts and trackers were neutralized.</span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 mb-6 border-2 border-black dark:border-white p-2 bg-zinc-50 dark:bg-zinc-950">
              <button
                onClick={() => setViewMode('html')}
                className={`flex-1 py-2 px-4 font-black uppercase tracking-tighter transition-all ${
                  viewMode === 'html'
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                HTML Preview
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`flex-1 py-2 px-4 font-black uppercase tracking-tighter transition-all ${
                  viewMode === 'text'
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                Text View
              </button>
            </div>

            {/* Content Display */}
            {viewMode === 'html' ? (
              <div 
                className="prose dark:prose-invert max-w-none font-medium text-lg leading-relaxed
                  prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter
                  prose-a:text-indigo-600 prose-a:font-black prose-a:no-underline hover:prose-a:underline
                  prose-strong:font-black prose-img:border-4 prose-img:border-black
                  prose-table:border-2 prose-table:border-black prose-th:border prose-th:border-black
                  prose-td:border prose-td:border-black"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            ) : (
              <div className="whitespace-pre-wrap font-mono text-sm bg-zinc-50 dark:bg-zinc-900 p-6 border-2 border-black dark:border-white">
                {email.body_text}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
