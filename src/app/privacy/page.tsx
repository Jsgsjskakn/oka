import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { CompactFooter } from '@/components/layout/CompactFooter';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-obsidian text-text-primary flex flex-col">
      <header className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian/90 backdrop-blur-md z-40">
        <Link href="/" className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-heading text-lg font-bold">Privacy Policy</h1>
      </header>

      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full text-text-primary/80 space-y-8">
        <section>
          <h2 className="text-xl font-heading text-primary mb-3">1. Data We Collect</h2>
          <p className="text-sm leading-relaxed">
            We collect information that you provide directly to us, including your name, phone number, email address, order history, and booking details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading text-primary mb-3">2. How We Use Your Data</h2>
          <p className="text-sm leading-relaxed mb-2">We use the information we collect to:</p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li>Process and fulfill your reservations and food orders.</li>
            <li>Communicate with you regarding your bookings and purchases.</li>
            <li>Improve our services and personalize your experience.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-heading text-primary mb-3">3. Data Security</h2>
          <p className="text-sm leading-relaxed">
            We implement appropriate technical and organizational security measures to protect your personal information against accidental or unlawful destruction, loss, alteration, or unauthorized disclosure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading text-primary mb-3">4. Cookie Policy</h2>
          <p className="text-sm leading-relaxed">
            We use essential cookies to maintain your session and preferences. By using our application, you consent to our use of these fundamental cookies necessary for the app to function.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading text-primary mb-3">5. Contact</h2>
          <p className="text-sm leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us via our <Link href="/contact" className="text-primary hover:underline">Contact page</Link>.
          </p>
        </section>

        <p className="text-xs text-text-primary/40 pt-8 border-t border-white/5">
          Last updated: August 2026
        </p>
      </main>
      
      <CompactFooter />
    </div>
  );
}
