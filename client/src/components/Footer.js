'use client';

import { Landmark } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-luxury-border/30 bg-luxury-bg py-8 px-6 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-luxury-gold/60" />
          <span className="font-display font-semibold text-sm tracking-widest text-luxury-muted">
            VAULT<span className="font-light text-luxury-gold/60">AUCTION</span>
          </span>
        </div>
        <p className="text-xs text-luxury-muted">
          &copy; {new Date().getFullYear()} Vault Auction Inc. All luxury listings verified server-side.
        </p>
      </div>
    </footer>
  );
}
