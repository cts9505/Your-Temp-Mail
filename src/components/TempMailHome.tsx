"use client";

import { useState, useEffect } from "react";
import {
  Mail, Copy, Check, RefreshCcw,
  Edit3, Trash2, QrCode, Inbox,
  Loader2, X, Play, Search,
  ArrowRight, Sparkles } from
"lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";

import { setGuestAliasCookie, getGuestAliasFromCookie } from "@/lib/auth-utils";

export default function TempMailHome() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [domain] = useState("yourtempmail.com");
  const [copied, setCopied] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [customAlias, setCustomAlias] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const generateAlias = async () => {
    const savedAlias = await getGuestAliasFromCookie();
    if (savedAlias) {
      setAlias(savedAlias);
      return;
    }

    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAlias(result);
    await setGuestAliasCookie(result);
  };

  useEffect(() => {
    setMounted(true);
    generateAlias();
  }, []);

  const handleCopy = async () => {
    const success = await copyToClipboard(`${alias}@${domain}`);
    if (success) {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAlias(result);
    await setGuestAliasCookie(result);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("New email address generated");
    }, 500);
  };

  const checkAvailability = async () => {
    if (!customAlias.trim()) return;

    setIsChecking(true);
    const cleanAlias = customAlias.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    try {
      const response = await fetch(`/api/alias/check?alias=${cleanAlias}`);
      const result = await response.json();

      if (result.available) {
        setAlias(cleanAlias);
        await setGuestAliasCookie(cleanAlias);
        setIsChanging(false);
        setCustomAlias("");
        toast.success("Email address updated to " + cleanAlias + "@" + domain);
      } else {
        toast.error("This name is already taken. Please try another one.");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsChecking(false);
    }
  };

  if (!mounted) {
    return (
      <div className="w-full max-w-4xl mx-auto h-[400px] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600/20" />
      </div>);

  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full border-4 border-black dark:border-white overflow-hidden shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(255,255,255,0.1)] bg-white dark:bg-black">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left: Temp Mail - Centered Content */}
          <div className="md:col-span-8 p-12 md:p-16 border-b-4 md:border-b-0 md:border-r-4 border-black dark:border-white flex flex-col items-center justify-center text-center bg-zinc-50 dark:bg-zinc-950 min-h-[350px]">
            <div className="space-y-8 w-full">
              <div className="flex items-center justify-center gap-4">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
                <span className="font-black text-xs uppercase tracking-[0.4em] opacity-50">Identity: Active</span>
              </div>
              <div className="relative inline-block w-full">
                <div className="text-3xl md:text-5xl font-black break-all leading-tight tracking-tighter italic">
                  {alias || "IDENTIFYING..."}<span className="opacity-20 not-italic">@{domain}</span>
                </div>
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={handleCopy}
                    className="h-14 px-8 bg-black dark:bg-white text-white dark:text-black font-black border-4 border-black dark:border-white hover:bg-indigo-600 hover:text-white transition-all rounded-none gap-3 shadow-[8px_8px_0px_0px_rgba(79,70,229,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none">

                    {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                    {copied ? "COPIED" : "COPY ADDRESS"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="md:col-span-4 flex flex-col">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex-1 p-8 border-b-4 border-black dark:border-white hover:bg-indigo-600 hover:text-white transition-colors flex flex-col items-center justify-center gap-3 font-black text-xl group uppercase tracking-widest min-h-[175px]">

              <RefreshCcw className={`w-8 h-8 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
              Generate
            </button>
            <button
              onClick={() => setIsChanging(true)}
              className="flex-1 p-8 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex flex-col items-center justify-center gap-3 font-black text-xl uppercase tracking-widest min-h-[175px]">

              <Edit3 className="w-8 h-8" />
              Customize
            </button>
          </div>

          {/* Bottom: Open Inbox */}
          <div className="col-span-1 md:col-span-12">
            <button
              onClick={() => router.push('/inbox')}
              className="w-full h-32 bg-black dark:bg-white text-white dark:text-black hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-8 font-black text-4xl md:text-6xl tracking-tighter border-t-4 border-black dark:border-white group">

              <Inbox className="w-12 h-12 md:w-20 md:h-20 group-hover:scale-110 transition-transform" />
              ACCESS INBOX
              <ArrowRight className="w-12 h-12 md:w-20 md:h-20 ml-4 group-hover:translate-x-4 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 w-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        <div className="flex items-center gap-4 group">
          <div className="w-14 h-14 border-4 border-black dark:border-white bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">1</div>
          <span className="font-black uppercase tracking-[0.2em] text-sm md:text-base italic">Instant delivery</span>
        </div>
        <div className="flex items-center gap-4 group">
          <div className="w-14 h-14 border-4 border-black dark:border-white bg-green-500 flex items-center justify-center text-white font-black text-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">2</div>
          <span className="font-black uppercase tracking-[0.2em] text-sm md:text-base italic">No registration</span>
        </div>
        <div className="flex items-center gap-4 group">
          <div className="w-14 h-14 border-4 border-black dark:border-white bg-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">3</div>
          <span className="font-black uppercase tracking-[0.2em] text-sm md:text-base italic">100% Private</span>
        </div>
      </div>

      {/* Create Own Dialog - Brutalist Theme */}
      <Dialog open={isChanging} onOpenChange={setIsChanging}>
        <DialogContent className="sm:max-w-md p-0 bg-white dark:bg-black border-[6px] border-black dark:border-white rounded-none shadow-[32px_32px_0px_0px_rgba(0,0,0,1)] dark:shadow-[32px_32px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden">
          <div className="p-10 space-y-10">
            <div className="space-y-4 text-center">
              <div className="inline-block p-4 border-4 border-black dark:border-white bg-indigo-600 mb-2">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <DialogTitle className="text-5xl font-black uppercase tracking-tighter italic">Custom Identity</DialogTitle>
              <p className="font-black text-black dark:text-white uppercase tracking-[0.2em] text-[10px] bg-zinc-100 dark:bg-zinc-900 py-2 inline-block px-4 border-2 border-black dark:border-white">
                Choose your unique handle
              </p>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="font-black text-xs uppercase tracking-[0.3em] block">Desired Alias</label>
                <div className="relative group">
                  <Input
                    placeholder="E.G. SUPERHERO"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="h-20 border-[6px] border-black dark:border-white rounded-none bg-white dark:bg-black font-black text-3xl px-8 focus-visible:ring-0 focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-950 transition-all pr-40 placeholder:opacity-10" />

                  <div className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-xl text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter italic">
                    @{domain}
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest pl-2">Alphanumeric characters only</p>
              </div>
              
              <Button
                onClick={checkAvailability}
                disabled={isChecking || !customAlias.trim()}
                className="w-full h-24 bg-black dark:bg-white text-white dark:text-black font-black text-2xl border-[6px] border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(79,70,229,1)] hover:bg-indigo-600 hover:text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all rounded-none gap-4">

                {isChecking ?
                <Loader2 className="w-10 h-10 animate-spin" /> :

                <>
                    ACTIVATE ALIAS
                    <ArrowRight className="w-10 h-10" />
                  </>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}