---
Task ID: 1
Agent: main (orchestrator)
Task: Build complete backend + database + frontend for Ganraj Logistics Service website. Colors taken ONLY from the uploaded banner.pdf. Content from Company_Requirements.doc and overview.docx.

Work Log:
- Extracted text from overview.docx (company intro, planned architecture, API contract) and Company_Requirements.doc (sitemap, services, why-choose-us, how-it-works, contact, colors: dark blue / white / orange).
- Converted Banner.pdf to PNG and analyzed pixel colors. Dominant non-white colors: Navy #001c42, Orange #ed6f00, Light gray #ced1d7. Copied banner to /public/banner.png for hero background.
- Set up design tokens in src/app/globals.css: --color-navy (#001c42), --color-brand/orange (#ed6f00), --color-cloud (#ced1d7). shadcn primary = navy, ring = orange. Light theme only (white background). Custom scrollbar + grid-bg utilities.
- Updated src/app/layout.tsx metadata for Ganraj Logistics Service.
- Prisma schema (prisma/schema.prisma): models Admin, Booking (with reference, customer + shipment fields, status), StatusHistory (from/to status, note, adminId). Ran `bun run db:push`.
- Backend libs:
  - src/lib/constants.ts: COMPANY info (phones 9987051430 / 8108767159, email ganrajlogisticsservice@gmail.com, WhatsApp link), BOOKING_STATUSES (New/Quoted/Vehicle Assigned/In Transit/Delivered/Cancelled), STATUS_META, VEHICLE_TYPES, SERVICES, WHY_CHOOSE_US, HOW_IT_WORKS, STATS.
  - src/lib/auth.ts: scrypt password hashing + HMAC-SHA256 JWT (no extra deps), httpOnly cookie helpers, getAdminFromRequest.
  - src/lib/validators.ts: zod schemas for booking/login/status, generateReference().
  - src/lib/rate-limit.ts: in-memory IP rate limiter.
- Seeded default admin via scripts/seed-admin.ts: admin@ganrajlogistics.in / ganraj@123.
- API routes (Next.js App Router, src/app/api):
  - POST /api/bookings (public, rate-limited, validates, creates booking + first history row "New")
  - GET /api/bookings (admin auth, search/status filter/pagination)
  - GET /api/bookings/[id] (admin auth, includes history)
  - PATCH /api/bookings/[id]/status (admin auth, transactional status update + history row)
  - GET /api/bookings/track?reference= (public, returns booking + history)
  - POST /api/admin/login (sets httpOnly cookie), GET /api/admin/me, POST /api/admin/logout
- Frontend API client: src/lib/api-client.ts (typed functions + ApiError with field issues).
- Frontend (single route / only, view-switching via #admin hash):
  - src/hooks/use-admin.ts (session hook)
  - src/components/site/status-badge.tsx, site-header.tsx (sticky, mobile sheet menu), site-footer.tsx (sticky via mt-auto in min-h-screen flex-col), whatsapp-float.tsx
  - src/components/site/sections.tsx: Hero (banner bg + navy overlay, Call/WhatsApp/Book CTAs, stats), About (mission/vision), Services (6 cards), WhyChooseUs (6 cards), HowItWorks (6 steps on navy bg), Contact (3 cards + CTA)
  - src/components/booking/booking-section.tsx: full booking form (name, phone, email, pickup, delivery, material, quantity, vehicle select, date with min=today, notes) + success dialog with reference + track-by-reference dialog with timeline
  - src/components/admin/admin-view.tsx: login (pre-filled demo creds) -> dashboard (stat cards, search + status filter + pagination, sortable table) -> booking detail (shipment details + status timeline + status updater with note)
  - src/app/page.tsx: orchestrates site vs admin view, sticky footer layout
- Verification with Agent Browser (all passed):
  - Home renders all sections, no console errors, banner navy/orange palette confirmed by VLM on desktop + mobile (responsive, no overflow).
  - Booking flow: filled form -> POST /api/bookings 201 -> success dialog with reference GLS261006-W6QD.
  - Track flow: entered reference -> status dialog shows "New" + timeline.
  - Admin flow: login (admin@ganrajlogistics.in / ganraj@123) -> dashboard shows bookings -> opened detail -> updated status New->Quoted with note -> PATCH 200 -> timeline updated.
- `bun run lint` passes clean (0 errors).

Stage Summary:
- Complete production-ready logistics website with full backend + database + admin CMS.
- Colors taken ONLY from banner.pdf: Navy #001c42 (primary/dark sections), Orange #ed6f00 (CTAs/accents), White (background), Light gray #ced1d7 (scrollbars/borders).
- Single user-visible route (/); admin panel deep-linked via #admin hash (no extra Next.js routes).
- Admin credentials: admin@ganrajlogistics.in / ganraj@123 (seeded; hash via scrypt, session via httpOnly JWT cookie).
- All content from client docs (FTL, LTL, Industrial, Distribution, All India, Vehicle Arrangement services; 6-step process; 6 why-choose-us points; mission/vision; contact info).
- Key files: prisma/schema.prisma, src/lib/{constants,auth,validators,rate-limit,api-client,db}.ts, src/app/api/**, src/app/{page,layout,globals.css}, src/components/{site,booking,admin}/**, src/hooks/use-admin.ts, scripts/seed-admin.ts.
