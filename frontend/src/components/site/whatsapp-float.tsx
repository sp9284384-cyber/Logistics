"use client";

import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/constants";

export function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition-all hover:scale-110 hover:bg-brand-600"
    >
      <MessageCircle className="size-7" />
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand/40" />
    </a>
  );
}
