import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BookingSlot = {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  active: boolean;
};

export const bookingSlotsQuery = queryOptions({
  queryKey: ["booking_slots"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("booking_slots" as any)
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as unknown as BookingSlot[];
  },
});

export const takenSlotsQuery = (date: string | null) =>
  queryOptions({
    queryKey: ["taken_slots", date],
    enabled: !!date,
    queryFn: async () => {
      if (!date) return [] as string[];
      const { data, error } = await supabase.rpc("get_taken_slots" as any, { d: date });
      if (error) throw error;
      return ((data ?? []) as { slot: string }[]).map((r) => r.slot);
    },
  });
