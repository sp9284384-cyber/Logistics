"use client";

import { Truck, Phone, Mail, MapPin, MessageCircle, ArrowUp } from "lucide-react";
import { COMPANY, WHATSAPP_LINK } from "@/lib/constants";

const SERVICE_TAGS = ["FTL", "LTL", "Industrial Transport", "Distribution", "Vehicle Arrangement"];

export function SiteFooter({ onAdmin }: { onAdmin: () => void }) {
  const scrollTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-white">
                <Truck className="size-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-extrabold tracking-tight">
                  GANRAJ LOGISTICS
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
                  Service
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm text-white/70">
              Ganraj Logistics Service provides reliable full truck load and part load transport for businesses across India, with timely pickup, safe delivery and competitive rates.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {SERVICE_TAGS.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${COMPANY.phonePrimaryRaw}`}
                  className="flex items-start gap-3 text-white/80 transition-colors hover:text-white"
                >
                  <Phone className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>
                    {COMPANY.phonePrimary}
                    <br />
                    <span className="text-white/60">{COMPANY.phoneSecondary}</span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="flex items-start gap-3 break-all text-white/80 transition-colors hover:text-white"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-brand" />
                  {COMPANY.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/80">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                {COMPANY.serviceArea}
              </li>
            </ul>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <MessageCircle className="size-4" /> WhatsApp Us
            </a>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { label: "Home", href: "#home" },
                { label: "About Us", href: "#about" },
                { label: "Services", href: "#services" },
                { label: "Why Choose Us", href: "#why" },
                { label: "How It Works", href: "#how" },
                { label: "Contact", href: "#contact" },
              ].map((l) => (
                <li key={l.href}>
                  <button
                    onClick={() =>
                      document
                        .querySelector(l.href)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className="text-white/80 transition-colors hover:text-brand"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={onAdmin}
              className="text-xs text-white/40 transition-colors hover:text-white/70"
            >
              Admin
            </button>
            <button
              onClick={scrollTop}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-brand hover:text-white"
            >
              Back to top <ArrowUp className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
