import { Navbar } from "@/components/Navbar";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Data Collection",
      content: "We do not collect personal information. We do not require registration for basic use. Temporary emails and their contents are stored for a maximum of 24 hours."
    },
    {
      title: "2. Cookies",
      content: "We use local storage and cookies to remember your temporary email address during your session. No tracking or third-party advertising cookies are used."
    },
    {
      title: "3. Email Privacy",
      content: "Emails received are private to the temporary address. However, as these are temporary and shared-domain addresses, we advise against using them for sensitive personal information."
    },
    {
      title: "4. Data Security",
      content: "We implement industry-standard security measures to protect the temporary data on our servers. All data is purged automatically after 24 hours."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <div className="border-8 border-black dark:border-white p-12 bg-white dark:bg-black shadow-[24px_24px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic mb-12 border-b-8 border-black dark:border-white pb-8">
            Privacy <br/>Policy
          </h1>
          
          <div className="space-y-12">
            {sections.map((s, i) => (
              <div key={i} className="space-y-4">
                <h2 className="text-3xl font-black uppercase tracking-tight italic bg-green-500 text-white inline-block px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
