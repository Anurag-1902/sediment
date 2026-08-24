"use client";

import Link from "next/link";
import { Layers } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border-custom bg-charcoal">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-4 max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber to-amber-dark">
                <Layers className="h-4 w-4 text-charcoal" />
              </div>
              <span className="text-lg font-semibold text-text">Sediment</span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Daily standups that build living context.
              <br />
              Query your team&apos;s progress naturally.
            </p>
          </div>
          <div className="flex gap-16">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-text">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="text-sm text-text-muted hover:text-amber-light transition-colors">Features</Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-text">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-text-muted hover:text-amber-light transition-colors">About</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border-custom flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">&copy; {new Date().getFullYear()} Sediment. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
