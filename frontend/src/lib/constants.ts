// Shared constants for Ganraj Logistics Service

export const COMPANY = {
  name: "Ganraj Logistics Service",
  tagline: "Reliable Transport. On Time. Every Time.",
  subTagline: "Your Trusted Logistics Partner Across India",
  phonePrimary: "8108767159",
  phonePrimaryRaw: "8108767159",
  phoneSecondary: "99870 51430",
  whatsapp: "918108767159",
  email: "ganrajlogisticsservice@gmail.com",
  serviceArea: "All Over India",
  whatsappMessage:
    "Hello Ganraj Logistics Service, I need a transport quotation.",
} as const;

export const WHATSAPP_LINK = `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(
  COMPANY.whatsappMessage
)}`;

// Booking workflow statuses — must stay in sync with frontend
export const BOOKING_STATUSES = [
  "New",
  "Quoted",
  "Vehicle Assigned",
  "In Transit",
  "Delivered",
  "Cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_META: Record<
  BookingStatus,
  { label: string; color: string; bg: string; text: string }
> = {
  New: { label: "New", color: "#5b6675", bg: "bg-slate-100", text: "text-slate-700" },
  Quoted: { label: "Quoted", color: "#ed6f00", bg: "bg-orange-100", text: "text-orange-700" },
  "Vehicle Assigned": { label: "Vehicle Assigned", color: "#012a63", bg: "bg-blue-100", text: "text-blue-800" },
  "In Transit": { label: "In Transit", color: "#7c3aed", bg: "bg-violet-100", text: "text-violet-700" },
  Delivered: { label: "Delivered", color: "#15803d", bg: "bg-emerald-100", text: "text-emerald-700" },
  Cancelled: { label: "Cancelled", color: "#dc2626", bg: "bg-red-100", text: "text-red-700" },
};

export const VEHICLE_TYPES = [
  "Tata Ace / Chhota Hathi",
  "Pickup (1 Ton)",
  "Mini Truck (3 Ton)",
  "Truck (10 Tyre)",
  "Truck (12 Tyre)",
  "Container (20ft)",
  "Container (40ft)",
  "Open Body Truck",
  "Trailer",
  "Not Sure — Recommend Me",
] as const;

export const SERVICES = [
  {
    key: "ftl",
    title: "Full Truck Load (FTL)",
    short: "Transportation solutions for bulk and commercial shipments.",
    description:
      "For customers who require an entire vehicle for their shipment. Dedicated truck for factory dispatches, bulk goods, industrial materials and large commercial shipments.",
    points: [
      "Factory dispatches",
      "Bulk goods",
      "Industrial materials",
      "Large commercial shipments",
    ],
  },
  {
    key: "ltl",
    title: "Part Load / LTL",
    short: "Cost-effective solutions for smaller shipments.",
    description:
      "For smaller shipments where a full truck may not be required. Share vehicle space and pay only for the space you use.",
    points: ["Smaller shipments", "Flexible loading", "Cost-efficient"],
  },
  {
    key: "industrial",
    title: "Factory & Industrial Transportation",
    short: "Transportation support for manufacturers and industrial businesses.",
    description:
      "Transportation coordination for factories, manufacturing units and industrial businesses with material movement needs.",
    points: ["Manufacturing units", "Raw material movement", "Industrial goods"],
  },
  {
    key: "distribution",
    title: "Warehouse & Distribution",
    short: "Reliable movement of goods between warehouses, distributors and customers.",
    description:
      "Movement of goods across the supply chain: Factory → Warehouse → Distributor → Customer.",
    points: ["Warehouse transfers", "Distributor supply", "Last-mile coordination"],
  },
  {
    key: "all-india",
    title: "All India Transportation",
    short: "Transportation coordination for routes across India.",
    description:
      "Transportation coordination for different routes across India based on customer requirements.",
    points: ["Pan-India coverage", "Multi-route coordination", "Route planning"],
  },
  {
    key: "vehicle",
    title: "Vehicle Arrangement",
    short: "We coordinate suitable vehicles according to your shipment requirements.",
    description:
      "We help arrange suitable vehicles according to pickup location, delivery location, material type, quantity and vehicle requirement.",
    points: ["Right vehicle match", "Route-based arrangement", "Requirement-based"],
  },
] as const;

export const WHY_CHOOSE_US = [
  {
    title: "Reliable Coordination",
    desc: "We focus on proper communication between customer, vehicle owner and driver.",
  },
  {
    title: "Competitive Rates",
    desc: "We aim to provide practical transportation solutions at competitive market rates.",
  },
  {
    title: "Timely Service",
    desc: "We understand the importance of pickup and delivery schedules.",
  },
  {
    title: "Customer Support",
    desc: "We keep customers updated regarding transportation movement.",
  },
  {
    title: "Flexible Vehicle Options",
    desc: "Vehicle arrangements can be made according to shipment requirements and route.",
  },
  {
    title: "Business-Focused Service",
    desc: "Our services are designed for factories, traders, distributors, warehouses and commercial businesses.",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Share Your Requirement",
    desc: "Send us your Pickup Location + Delivery Location + Material + Quantity + Vehicle Requirement.",
  },
  {
    step: 2,
    title: "Get Transportation Quote",
    desc: "We check the requirement and provide the applicable transportation rate.",
  },
  {
    step: 3,
    title: "Vehicle Arrangement",
    desc: "After confirmation, we coordinate a suitable vehicle for your shipment.",
  },
  {
    step: 4,
    title: "Pickup",
    desc: "The vehicle reaches the pickup location as scheduled.",
  },
  {
    step: 5,
    title: "Delivery",
    desc: "Goods are transported to the destination safely.",
  },
  {
    step: 6,
    title: "Delivery Update",
    desc: "Customer receives transportation / delivery updates as applicable.",
  },
] as const;

export const STATS = [
  { value: "All India", label: "Service Coverage" },
  { value: "FTL + LTL", label: "Load Options" },
  { value: "On-Time", label: "Pickup & Delivery" },
  { value: "6+", label: "Service Categories" },
] as const;
