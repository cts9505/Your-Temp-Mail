"use client";

import { Navbar } from "@/components/Navbar";
import TempMailHome from "@/components/TempMailHome";
import { Shield, Zap, Lock, Globe, Trash2, Mail } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Animate title
    if (titleRef.current) {
      const chars = titleRef.current.querySelectorAll(".char");
      gsap.fromTo(
        chars,
        { opacity: 0, y: 50, rotateX: -90 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.05,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 60%",
            end: "top 40%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    // Animate cards
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll(".feature-card");
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 100,
            scale: 0.8,
            rotateY: -15,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateY: 0,
            duration: 1,
            delay: index * 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 75%",
              end: "top 50%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }
  }, []);

  const features = [
  {
    title: "Self-Destructing",
    desc: "Emails are automatically deleted after 24 hours to keep your digital footprint clean.",
    icon: <Trash2 className="w-8 h-8" />,
    color: "bg-red-500"
  },
  {
    title: "Ultra Fast",
    desc: "Instant delivery. No lag. Receive verification codes and links in real-time.",
    icon: <Zap className="w-8 h-8" />,
    color: "bg-yellow-400"
  },
  {
    title: "Anonymity First",
    desc: "No IP logging. No tracking. Your identity is shielded behind our secure relays.",
    icon: <Lock className="w-8 h-8" />,
    color: "bg-indigo-600"
  },
  {
    title: "Global Reach",
    desc: "Works with any service worldwide. Bypass region locks and spam filters.",
    icon: <Globe className="w-8 h-8" />,
    color: "bg-green-500"
  }];


  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent pointer-events-none" />
      <Navbar />
      
      <main className="pt-24 pb-16 relative">
        <section className="container mx-auto px-4 max-w-5xl">
          <TempMailHome />
        </section>

        {/* Core Benefits */}
        <section className="container mx-auto px-4 mt-32">
          <div className="flex flex-col items-center mb-16">
            <h2 
              ref={titleRef}
              className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic text-center"
              style={{ perspective: "1000px" }}
            >
              {"Why YourTempMail?".split("").map((char, i) => (
                <span key={i} className="char inline-block" style={{ transformStyle: "preserve-3d" }}>
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </h2>
            <div className="h-4 w-48 bg-black dark:bg-white mt-4 shadow-[4px_4px_0px_0px_rgba(79,70,229,1)]" />
          </div>
          
          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) =>
              <div key={i} className="feature-card group border-4 border-black dark:border-white p-8 bg-white dark:bg-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <div className={`w-16 h-16 border-4 border-black dark:border-white ${f.color} flex items-center justify-center text-white mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-4">{f.title}</h3>
                <p className="font-bold text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed uppercase tracking-wide">
                  {f.desc}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Extra Features / Proof Points */}
        {/* <section className="container mx-auto px-4 mt-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-black dark:border-white">
            <div className="p-12 border-b-4 md:border-b-0 md:border-r-4 border-black dark:border-white bg-yellow-400 dark:bg-yellow-500">
              <h4 className="text-4xl font-black uppercase tracking-tighter italic mb-4">API Access</h4>
              <p className="font-bold text-black uppercase tracking-widest text-xs leading-loose">
                Integrate temporary mail into your automated testing workflows. Reliable, fast, and free.
              </p>
            </div>
            <div className="p-12 border-b-4 md:border-b-0 md:border-r-4 border-black dark:border-white bg-indigo-600 text-white">
              <h4 className="text-4xl font-black uppercase tracking-tighter italic mb-4">No Cookies</h4>
              <p className="font-bold text-white uppercase tracking-widest text-xs leading-loose">
                We don't track you. We don't store cookies for longer than your session. Total privacy.
              </p>
            </div>
            <div className="p-12 bg-green-500">
              <h4 className="text-4xl font-black uppercase tracking-tighter italic mb-4">Unlimited</h4>
              <p className="font-bold text-black uppercase tracking-widest text-xs leading-loose">
                Create as many aliases as you need. No daily limits, no hidden fees, no credit cards.
              </p>
            </div>
          </div>
        </section> */}

        {/* Footer */}
        <footer className="container mx-auto px-4 py-20 mt-40 border-t-8 border-black dark:border-white text-center">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-left">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">YourTempMail</h2>
              <p className="font-bold text-zinc-400 uppercase tracking-widest text-xs mt-2">The ultimate shield for your primary inbox.</p>
            </div>
            <div className="flex gap-8 font-black uppercase tracking-widest text-sm">
              <a href="/terms" className="hover:text-indigo-600 transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</a>
              <a href="mailto:support@yourtempmail.com" className="hover:text-indigo-600 transition-colors">Contact</a>
            </div>
          </div>
          <p className="mt-12 pt-12 border-t-4 border-black/5 dark:border-white/5 font-bold text-zinc-400 uppercase tracking-[0.3em] text-[10px]">
            © 2024 YourTempMail. Receive-only email platform. Built for privacy.
          </p>
        </footer>
      </main>
    </div>);

}