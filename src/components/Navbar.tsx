"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Mail, User as UserIcon, LogOut, Inbox } from "lucide-react";

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!mounted || loading) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b-3 md:border-b-4 border-black dark:border-white">
      <div className="container mx-auto px-3 md:px-4 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <div className="bg-black dark:bg-white p-1.5 md:p-2 border-2 border-black dark:border-white rotate-[-2deg]">
            <Mail className="w-5 h-5 md:w-6 md:h-6 text-white dark:text-black" />
          </div>
          <span className="text-lg md:text-2xl font-black uppercase tracking-tighter">
            <span className="hidden sm:inline">YourTempMail</span>
            <span className="sm:hidden">YourTempMail</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 md:gap-3">
          {user ? (
            <>
              <Link href="/inbox">
                <Button className="hidden sm:flex bg-white dark:bg-black text-black dark:text-white font-black border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all gap-2 h-10 px-4 text-xs">
                  <Inbox className="w-4 h-4" />
                  INBOX
                </Button>
              </Link>
              <Link href="/profile">
                <Button className="bg-indigo-600 text-white font-black border-2 border-black dark:border-white hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-1.5 md:gap-2 h-9 md:h-10 px-2.5 md:px-4 text-[10px] md:text-xs">
                  <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">PROFILE</span>
                </Button>
              </Link>
              <Button 
                onClick={handleLogout} 
                className="bg-white dark:bg-black text-red-500 font-black border-2 border-black dark:border-white hover:bg-red-500 hover:text-white transition-all h-9 md:h-10 w-9 md:w-10 p-0"
              >
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:block">
                <Button variant="ghost" className="font-black uppercase tracking-widest text-xs h-10">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-wider md:tracking-widest text-[10px] md:text-xs px-3 md:px-6 py-2 md:py-4 h-9 md:h-auto border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] md:dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
