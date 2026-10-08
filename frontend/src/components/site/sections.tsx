"use client";

import {
  Truck,
  PackageCheck,
  Factory,
  Warehouse,
  MapPinned,
  ClipboardList,
  Phone,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Radio,
  BadgePercent,
  Clock,
  Headset,
  Shuffle,
  Building2,
  MapPin,
  Mail,
  ShieldCheck,
  Route,
  Target,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  COMPANY,
  WHATSAPP_LINK,
  SERVICES,
  WHY_CHOOSE_US,
  HOW_IT_WORKS,
  STATS,
} from "@/lib/constants";

const SERVICE_ICONS = [
  Truck,
  PackageCheck,
  Factory,
  Warehouse,
  MapPinned,
  ClipboardList,
];

const WHY_ICONS = [
  Radio,
  BadgePercent,
  Clock,
  Headset,
  Shuffle,
  Building2,
];

function SectionHeading({
  eyebrow,
  title,
  desc,
  light = false,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <span
          className={`inline-block text-xs font-bold uppercase tracking-[0.2em] ${
            light ? "text-brand" : "text-brand"
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl ${
          light ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>
      {desc && (
        <p
          className={`mt-3 text-base sm:text-lg ${
            light ? "text-white/70" : "text-muted-foreground"
          }`}
        >
          {desc}
        </p>
      )}
      <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-brand" />
    </div>
  );
}

/* ----------------------------- HERO ----------------------------- */
export function Hero({ onBookNow }: { onBookNow: () => void }) {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-navy text-white"
    >
      {/* Banner background */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/banner.png"
          alt="Ganraj Logistics Service banner"
          className="size-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="max-w-3xl">
          <Badge className="border border-brand/40 bg-brand/15 text-brand hover:bg-brand/20">
            <Star className="size-3.5" /> {COMPANY.subTagline}
          </Badge>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            GANRAJ LOGISTICS
            <span className="block text-brand">SERVICE</span>
          </h1>
          <p className="mt-5 max-w-xl text-xl font-semibold text-brand">
            Reliable Transport. On Time. Every Time.
          </p>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90">
            Ganraj Logistics Service is a transport and logistics provider that helps businesses move their goods across India. From factories and manufacturers to traders, distributors and warehouses, we arrange the right vehicle for your shipment and coordinate everything from pickup to delivery.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
            Whether you need a full truck load or a part load, our focus is simple: reliable vehicles, timely pickup, safe transport and clear communication at every step.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={onBookNow}
              className="bg-brand text-white hover:bg-brand-600"
            >
              Request a Quote <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              asChild
              variant="outline"
              className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <a href={`tel:${COMPANY.phonePrimaryRaw}`}>
                <Phone className="size-4" /> Call Now
              </a>
            </Button>
            <Button
              size="lg"
              asChild
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> WhatsApp Us
              </a>
            </Button>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <dt className="text-xl font-extrabold text-brand">{s.value}</dt>
                <dd className="mt-0.5 text-xs text-white/70">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- ABOUT --------------------------- */
export function About() {
  return (
    <section id="about" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-brand">
              About Us
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              About Ganraj Logistics Service
            </h2>
            <div className="mt-4 h-1 w-16 rounded-full bg-brand" />
            <p className="mt-6 text-base text-muted-foreground">
              Ganraj Logistics Service is a logistics and transportation service
              provider focused on providing dependable transportation solutions
              to businesses. We understand that transportation is an important
              part of every business — our objective is to make the movement of
              goods simple, reliable and hassle-free.
            </p>
            <p className="mt-4 text-base text-muted-foreground">
              We coordinate transportation requirements with suitable vehicles
              and provide professional communication throughout the movement.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Card className="border-l-4 border-l-brand shadow-sm">
                <CardContent className="p-5">
                  <Target className="size-6 text-brand" />
                  <h3 className="mt-3 font-bold text-navy">Our Mission</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    To provide reliable, transparent and customer-focused
                    logistics solutions that help businesses move their goods
                    efficiently.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-navy shadow-sm">
                <CardContent className="p-5">
                  <Route className="size-6 text-navy" />
                  <h3 className="mt-3 font-bold text-navy">Our Vision</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    To build a trusted logistics network connecting businesses
                    and transportation partners across India.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="relative">
            <div className="gls-grid-bg relative overflow-hidden rounded-2xl border border-border bg-secondary p-8">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand/10" />
              <div className="absolute -bottom-12 -left-8 size-48 rounded-full bg-navy/5" />
              <div className="relative space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy text-white">
                    <Truck className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy">
                      Moving Your Goods. Connecting Your Business.
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Transportation and logistics coordination for
                      manufacturers, traders, distributors and commercial
                      requirements.
                    </p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    "Reliable vehicle arrangements",
                    "Timely pickup & safe transportation",
                    "Professional coordination at every step",
                    "Competitive market rates",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-3">
                      <CheckCircle2 className="size-5 shrink-0 text-brand" />
                      <span className="text-sm font-medium text-navy">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- SERVICES --------------------------- */
export function Services({ onBookNow }: { onBookNow: () => void }) {
  return (
    <section id="services" className="bg-secondary py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What We Offer"
          title="Our Services"
          desc="Reliable transportation and logistics coordination designed for businesses across India."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => {
            const Icon = SERVICE_ICONS[i] ?? Truck;
            return (
              <Card
                key={service.key}
                className="group overflow-hidden border-border bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-navy text-white transition-colors group-hover:bg-brand">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-navy">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {service.short}
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {service.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-center gap-2 text-xs text-navy/80"
                      >
                        <CheckCircle2 className="size-3.5 shrink-0 text-brand" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="border-t border-border bg-secondary/60 px-6 py-3">
                  <button
                    onClick={onBookNow}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:gap-2 transition-all"
                  >
                    Request this service <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------ WHY CHOOSE US ------------------------ */
export function WhyChooseUs() {
  return (
    <section id="why" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why Ganraj?"
          title="Why Choose Us"
          desc="Reliable, timely, competitive and professional — built for businesses."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_CHOOSE_US.map((item, i) => {
            const Icon = WHY_ICONS[i] ?? Star;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-bold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------ HOW IT WORKS ------------------------ */
export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative isolate overflow-hidden bg-navy py-20 text-white sm:py-24"
    >
      <div className="gls-grid-bg absolute inset-0 -z-10 opacity-30" />
      <div className="absolute -right-24 top-10 -z-10 size-72 rounded-full bg-brand/10 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Simple Process
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-white/70">
            From requirement to delivery update — a clear, six-step process.
          </p>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-brand" />
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div
              key={step.step}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand font-extrabold text-white">
                  {step.step}
                </span>
                <h3 className="font-bold text-white">{step.title}</h3>
              </div>
              <p className="mt-3 text-sm text-white/70">{step.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-brand/60 lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- CONTACT --------------------------- */
export function Contact({ onBookNow }: { onBookNow: () => void }) {
  return (
    <section id="contact" className="bg-secondary py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Get In Touch"
          title="Contact Ganraj Logistics Service"
          desc="Need a transport vehicle? Send us your requirement and our team will get back to you."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <a
            href={`tel:${COMPANY.phonePrimaryRaw}`}
            className="group rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-md"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-navy text-white transition-colors group-hover:bg-brand">
              <Phone className="size-6" />
            </div>
            <h3 className="mt-4 font-bold text-navy">Call / WhatsApp</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {COMPANY.phonePrimary}
            </p>
            <p className="text-sm font-semibold text-brand">
              {COMPANY.phoneSecondary}
            </p>
          </a>

          <a
            href={`mailto:${COMPANY.email}`}
            className="group rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-md"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-navy text-white transition-colors group-hover:bg-brand">
              <Mail className="size-6" />
            </div>
            <h3 className="mt-4 font-bold text-navy">Email</h3>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              {COMPANY.email}
            </p>
          </a>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-xl bg-navy text-white">
              <MapPin className="size-6" />
            </div>
            <h3 className="mt-4 font-bold text-navy">Service Area</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {COMPANY.serviceArea}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground/80">
              FTL | LTL | Industrial | Distribution | Vehicle Arrangement
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-8 text-center">
          <ShieldCheck className="size-8 text-brand" />
          <h3 className="text-xl font-bold text-navy">
            Ready to move your goods?
          </h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Share your pickup &amp; delivery details and get a transportation
            quote. Our team coordinates the right vehicle for your shipment.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={onBookNow}
              className="bg-brand text-white hover:bg-brand-600"
            >
              Request a Quote <ArrowRight className="size-4" />
            </Button>
            <Button asChild variant="outline">
              <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> WhatsApp Us
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
