"use client";

import { useEffect, useState } from "react";
import { Phone, Menu, Truck, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { COMPANY, WHATSAPP_LINK } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Why Us", href: "#why" },
  { label: "How It Works", href: "#how" },
  { label: "Contact", href: "#contact" },
];

export function SiteHeader({
  onBookNow,
  onAdmin,
}: {
  onBookNow: () => void;
  onAdmin: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-white/95 shadow-sm backdrop-blur"
          : "bg-navy text-white"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => handleNav("#home")}
          className="flex items-center gap-2.5"
        >
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg transition-colors",
              scrolled ? "bg-navy text-white" : "bg-brand text-white"
            )}
          >
            <Truck className="size-5" />
          </span>
          <span className="text-left leading-tight">
            <span
              className={cn(
                "block text-sm font-extrabold tracking-tight",
                scrolled ? "text-navy" : "text-white"
              )}
            >
              GANRAJ LOGISTICS
            </span>
            <span
              className={cn(
                "block text-[10px] font-semibold uppercase tracking-[0.18em]",
                scrolled ? "text-brand" : "text-brand"
              )}
            >
              Service
            </span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNav(link.href)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                scrolled
                  ? "text-navy/80 hover:bg-secondary hover:text-navy"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              )}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant={scrolled ? "outline" : "outline"}
            className={cn(
              "hidden sm:inline-flex",
              scrolled
                ? "border-navy/20 text-navy hover:bg-secondary"
                : "border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            )}
          >
            <a href={`tel:${COMPANY.phonePrimaryRaw}`}>
              <Phone className="size-4" /> Call
            </a>
          </Button>
          <Button
            size="sm"
            onClick={onBookNow}
            className="bg-brand text-white hover:bg-brand-600"
          >
            Book Now
          </Button>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "lg:hidden",
                  scrolled ? "text-navy" : "text-white"
                )}
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] border-navy bg-navy text-white"
            >
              <SheetHeader>
                <SheetTitle className="text-white">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleNav(link.href)}
                    className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {link.label}
                  </button>
                ))}
                <Button
                  onClick={() => {
                    setOpen(false);
                    onBookNow();
                  }}
                  className="mt-3 bg-brand text-white hover:bg-brand-600"
                >
                  Book Now
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="mt-2 border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4" /> WhatsApp Us
                  </a>
                </Button>
                <button
                  onClick={() => {
                    setOpen(false);
                    onAdmin();
                  }}
                  className="mt-4 rounded-md px-3 py-2 text-left text-xs text-white/50 transition-colors hover:text-white/80"
                >
                  Admin Login
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

