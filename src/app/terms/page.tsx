import { Navbar } from "@/components/Navbar";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing YourTempMail, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service."
    },
    {
      title: "2. Description of Service",
      content: "YourTempMail provides temporary, receive-only email addresses. These addresses are designed to be short-lived and are automatically deleted after 24 hours."
    },
    {
      title: "3. Acceptable Use",
      content: "You agree not to use the service for any illegal activities, including but not limited to spamming, fraud, or distributing malware."
    },
    {
      title: "4. Limitation of Liability",
      content: "YourTempMail is provided 'as is'. We are not responsible for any lost data or damages resulting from the use of our temporary email services."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <div className="border-8 border-black dark:border-white p-12 bg-white dark:bg-black shadow-[24px_24px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic mb-12 border-b-8 border-black dark:border-white pb-8">
            Terms of <br/>Service
          </h1>
          
          <div className="space-y-12">
            {sections.map((s, i) => (
              <div key={i} className="space-y-4">
                <h2 className="text-3xl font-black uppercase tracking-tight italic bg-indigo-600 text-white inline-block px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {s.title}
                </h2>
                <p className="text-xl font-bold leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {s.content}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-20 pt-12 border-t-4 border-black/10 dark:border-white/10 font-black uppercase tracking-widest text-sm">
            Last Updated: 2024.01.01
          </div>
        </div>
      </main>
    </div>
  );
}
