import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { CompactFooter } from '@/components/layout/CompactFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-obsidian text-text-primary flex flex-col">
      <header className="px-4 py-5 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-obsidian/90 backdrop-blur-md z-40">
        <Link href="/" className="w-10 h-10 flex items-center justify-center -ml-2 text-text-primary/70 hover:text-text-primary active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-heading text-lg font-bold">Terms of Service</h1>
      </header>

      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full text-text-primary/80 space-y-8">
        <section>
          <h2 className="text-xl font-heading text-primary mb-3">1. Acceptance of Terms</h2>
          <p className="text-sm leading-relaxed">
            By accessing and using The Golden Oak application, you accept and agree to be bound by the terms and provisions of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading text-primary mb-3">2. Reservation Policy</h2>
          <p className="text-sm leading-relaxed mb-2">
            Reservations are subject to availability. To secure a booking, an advance payment may be required.
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li>Advance payments are non-refundable for cancellations made less than 24 hours before the reservation time.</li>
            <li>We hold tables for a maximum of 15 minutes past the reserved time.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-heading text-primary mb-3">3. Food Order Policy</h2>
          <p className="text-sm leading-relaxed">
            All orders placed through our application are final once confirmed. Preparation times are estimates and may vary during peak hours. Prices are subject to change without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading text-primary mb-3">4. Payment Terms</h2>
          <p className="text-sm leading-relaxed">
            We accept digital payments via UPI and major credit/debit cards. All transactions are processed securely. The final bill will include applicable taxes and service charges.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-heading text-primary mb-3">5. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed">
            The Golden Oak shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services.
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
