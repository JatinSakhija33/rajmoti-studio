import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BookingService = {
  id: string; name: string; slug: string; description: string | null;
  cover_url: string | null; gallery: any; booking_instructions: string | null;
  sort_order: number; active: boolean; featured: boolean;
};
export type BookingPackage = {
  id: string; service_id: string; name: string; description: string | null;
  price: number; duration_minutes: number;
  max_themes: number; max_poses: number; max_edited_photos: number; max_family_members: number;
  features: any; badge: string | null; popular: boolean;
  advance_percent: number; seasonal_discount_percent: number;
  sort_order: number; active: boolean;
};
export type BookingTheme = {
  id: string; service_id: string; name: string;
  thumbnail_url: string | null; gallery: any;
  recommended_age: string | null; bg_color: string | null; props: string[];
  sort_order: number; active: boolean;
};
export type BookingPose = {
  id: string; theme_id: string; name: string; preview_url: string | null;
  category: string | null; difficulty: string | null;
  recommended_age: string | null; description: string | null;
  sort_order: number; active: boolean;
};
export type BookingHours = {
  id: string; day_of_week: number; blocks: { start: string; end: string }[];
  session_minutes: number; open: boolean;
};
export type BlockedDate = {
  id: string; date: string; reason: string | null; all_day: boolean; blocked_slots: string[];
};
export type BookingOffer = {
  id: string; name: string; code: string | null;
  discount_percent: number | null; flat_amount: number | null;
  starts_at: string | null; ends_at: string | null;
  applies_to_service_ids: string[]; applies_to_package_ids: string[];
  weekday_mask: number; active: boolean; auto_apply: boolean;
};

const table = (name: string) => supabase.from(name as any);

export const bookingServicesQuery = queryOptions({
  queryKey: ["booking_services"],
  queryFn: async () => {
    const { data, error } = await table("booking_services").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []) as unknown as BookingService[];
  },
});
export const bookingPackagesQuery = queryOptions({
  queryKey: ["booking_packages"],
  queryFn: async () => {
    const { data, error } = await table("booking_packages").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []) as unknown as BookingPackage[];
  },
});
export const bookingThemesQuery = queryOptions({
  queryKey: ["booking_themes"],
  queryFn: async () => {
    const { data, error } = await table("booking_themes").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []) as unknown as BookingTheme[];
  },
});
export const bookingPosesQuery = queryOptions({
  queryKey: ["booking_poses"],
  queryFn: async () => {
    const { data, error } = await table("booking_poses").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []) as unknown as BookingPose[];
  },
});
export const bookingHoursQuery = queryOptions({
  queryKey: ["booking_hours"],
  queryFn: async () => {
    const { data, error } = await table("booking_hours").select("*").order("day_of_week");
    if (error) throw error;
    return (data ?? []) as unknown as BookingHours[];
  },
});
export const blockedDatesQuery = queryOptions({
  queryKey: ["booking_blocked_dates"],
  queryFn: async () => {
    const { data, error } = await table("booking_blocked_dates").select("*").order("date");
    if (error) throw error;
    return (data ?? []) as unknown as BlockedDate[];
  },
});
export const bookingOffersQuery = queryOptions({
  queryKey: ["booking_offers"],
  queryFn: async () => {
    const { data, error } = await table("booking_offers").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as BookingOffer[];
  },
});

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Generate slot start times from working blocks + session length (minutes). */
export function generateSlots(blocks: { start: string; end: string }[], sessionMinutes: number): string[] {
  const out: string[] = [];
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  for (const b of blocks) {
    let t = toMin(b.start);
    const end = toMin(b.end);
    while (t + sessionMinutes <= end) {
      out.push(fmt(t));
      t += sessionMinutes;
    }
  }
  return out;
}
