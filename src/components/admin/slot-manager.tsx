import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { bookingSlotsQuery } from "@/lib/booking";

export function SlotManager() {
  const qc = useQueryClient();
  const { data: slots = [] } = useQuery(bookingSlotsQuery);
  const [label, setLabel] = useState("");
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:30");

  async function add() {
    if (!label.trim()) return toast.error("Add a label");
    const { error } = await supabase.from("booking_slots" as any).insert({
      label, start_time: start, end_time: end, sort_order: slots.length + 1,
    } as any);
    if (error) return toast.error(error.message);
    setLabel("");
    qc.invalidateQueries({ queryKey: ["booking_slots"] });
  }
  async function toggle(id: string, active: boolean) {
    const { error } = await supabase.from("booking_slots" as any).update({ active } as any).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_slots"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this slot?")) return;
    const { error } = await supabase.from("booking_slots" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["booking_slots"] });
  }

  return (
    <section className="bg-white border border-onyx/10 p-6">
      <h2 className="font-display text-xl mb-1">Booking time slots</h2>
      <p className="text-xs text-muted-foreground mb-5">Shown to families when they book a studio session. Toggle off to hide temporarily.</p>

      <div className="space-y-2 mb-6">
        {slots.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3 border border-onyx/10">
            <span className="flex-1 text-sm">{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</span>
            <label className="text-xs flex items-center gap-1.5">
              <input type="checkbox" checked={s.active} onChange={(e) => toggle(s.id, e.target.checked)} /> Active
            </label>
            <button onClick={() => del(s.id)} className="text-destructive"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
        <label className="text-xs">
          <span className="eyebrow text-muted-foreground block mb-1">Label</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. 10:00 AM – 11:30 AM" className="w-full border border-onyx/15 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs">
          <span className="eyebrow text-muted-foreground block mb-1">Start</span>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="border border-onyx/15 px-2 py-2 text-sm" />
        </label>
        <label className="text-xs">
          <span className="eyebrow text-muted-foreground block mb-1">End</span>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="border border-onyx/15 px-2 py-2 text-sm" />
        </label>
        <button onClick={add} className="bg-onyx text-cream px-4 py-2.5 text-xs uppercase tracking-widest font-semibold hover:bg-gold inline-flex items-center gap-1.5">
          <Plus className="size-3" /> Add
        </button>
      </div>
    </section>
  );
}
