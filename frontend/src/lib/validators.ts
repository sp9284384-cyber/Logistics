import { z } from "zod";
import { VEHICLE_TYPES, BOOKING_STATUSES } from "@/lib/constants";

export const bookingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(80, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid 10-digit phone number")
    .max(15, "Phone number is too long")
    .regex(/^[0-9+\-\s]+$/, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  pickupLocation: z
    .string()
    .trim()
    .min(3, "Enter the pickup location")
    .max(120, "Pickup location is too long"),
  deliveryLocation: z
    .string()
    .trim()
    .min(3, "Enter the delivery location")
    .max(120, "Delivery location is too long"),
  materialType: z
    .string()
    .trim()
    .min(2, "Enter the material type")
    .max(80, "Material type is too long"),
  quantity: z
    .string()
    .trim()
    .min(1, "Enter the quantity")
    .max(60, "Quantity is too long"),
  vehicleType: z.enum(VEHICLE_TYPES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Select a vehicle type" }),
  }),
  pickupDate: z
    .string()
    .trim()
    .min(4, "Select a pickup date"),
  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().trim().min(1, "Enter your password"),
});

export const statusUpdateSchema = z.object({
  status: z.enum(BOOKING_STATUSES as unknown as [string, ...string[]]),
  note: z.string().trim().max(300, "Note is too long").optional().or(z.literal("")),
});

export function generateReference(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GLS${y}${m}${d}-${rand}`;
}
