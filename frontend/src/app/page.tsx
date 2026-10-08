"use client";

import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { WhatsAppFloat } from "@/components/site/whatsapp-float";
import {
  Hero,
  About,
  Services,
  WhyChooseUs,
  HowItWorks,
  Contact,
} from "@/components/site/sections";
import { BookingSection } from "@/components/booking/booking-section";
import { AdminView } from "@/components/admin/admin-view";

type View = "site" | "admin";

export default function Page() {
  const [view, setView] = useState<View>("site");

  // Keep the admin view in sync with the URL hash so it can be deep-linked
  // (e.g. #admin) without creating a new Next.js route.
  useEffect(() => {
    const apply = () => {
      setView(window.location.hash.replace("#", "") === "admin" ? "admin" : "site");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const goToAdmin = useCallback(() => {
    window.location.hash = "admin";
    setView("admin");
    window.scrollTo({ top: 0 });
  }, []);

  const goToSite = useCallback(() => {
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
    setView("site");
    window.scrollTo({ top: 0 });
  }, []);

  const goToBooking = useCallback(() => {
    if (view !== "site") {
      goToSite();
      setTimeout(
        () =>
          document
            .getElementById("book")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        80
      );
      return;
    }
    document
      .getElementById("book")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [view, goToSite]);

  if (view === "admin") {
    return <AdminView onBackToSite={goToSite} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader onBookNow={goToBooking} onAdmin={goToAdmin} />
      <main className="flex-1">
        <Hero onBookNow={goToBooking} />
        <About />
        <Services onBookNow={goToBooking} />
        <WhyChooseUs />
        <HowItWorks />
        <BookingSection />
        <Contact onBookNow={goToBooking} />
      </main>
      <SiteFooter onAdmin={goToAdmin} />
      <WhatsAppFloat />
    </div>
  );
}
