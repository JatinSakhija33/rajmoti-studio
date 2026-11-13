import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

export type Customer = {
  id: string;
  customer_name: string | null;
  service_slug?: string | null;
  baby_name: string | null;
  baby_dob: string | null;
  baby_gender: string | null;
  phone: string | null;
  email: string | null;
  anniversary_date: string | null;
  mother_name: string | null;
  father_name: string | null;
  city: string | null;
  address: string | null;
  notes: string | null;
  source: string | null;
  whatsapp_consent: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerDate = {
  id: string;
  customer_id: string;
  label: string;
  date: string;
  recurring: boolean;
};

export type MilestoneConfig = {
  id: string;
  label: string;
  months: number;
  active: boolean;
  sort_order: number;
};

export type ReminderOffer = {
  id: string;
  label: string;
  offer_type: "percent" | "flat" | "free_item" | "text";
  value: number | null;
  message: string | null;
  active: boolean;
};

export type MessageTemplate = {
  id: string;
  body: string;
  active: boolean;
};

export type Reminder = {
  id: string;
  customer_id: string;
  kind: "baby_milestone" | "anniversary" | "custom" | "birthday";
  label: string;
  milestone_date: string;
  remind_on: string;
  offer_id: string | null;
  message: string | null;
  status: "pending" | "sent" | "snoozed" | "dismissed";
  sent_at: string | null;
  snoozed_until: string | null;
  created_at: string;
  updated_at: string;
};

const tbl = (name: string) => supabase.from(name as any);

export const customersQuery = queryOptions({
  queryKey: ["customers"],
  queryFn: async () => {
    const { data, error } = await tbl("customers").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Customer[];
  },
});

export const customerDatesQuery = queryOptions({
  queryKey: ["customer_dates"],
  queryFn: async () => {
    const { data, error } = await tbl("customer_dates").select("*").order("date");
    if (error) throw error;
    return (data ?? []) as unknown as CustomerDate[];
  },
});

export const milestoneConfigsQuery = queryOptions({
  queryKey: ["milestone_configs"],
  queryFn: async () => {
    const { data, error } = await tbl("milestone_configs").select("*").order("sort_order");
    if (error) throw error;
    return (data ?? []) as unknown as MilestoneConfig[];
  },
});

export const reminderOffersQuery = queryOptions({
  queryKey: ["reminder_offers"],
  queryFn: async () => {
    const { data, error } = await tbl("reminder_offers").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ReminderOffer[];
  },
});

export const messageTemplatesQuery = queryOptions({
  queryKey: ["message_templates"],
  queryFn: async () => {
    const { data, error } = await tbl("message_templates").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as MessageTemplate[];
  },
});

export const remindersQuery = queryOptions({
  queryKey: ["reminders"],
  queryFn: async () => {
    const { data, error } = await tbl("reminders").select("*").order("remind_on");
    if (error) throw error;
    return (data ?? []) as unknown as Reminder[];
  },
});

/* -------------------- Milestone computation (client-side upcoming preview) -------------------- */

export type UpcomingMilestone = {
  customer: Customer;
  kind: "baby_milestone" | "custom" | "anniversary";
  label: string;
  milestone_date: string; // ISO
  remind_on: string; // ISO
  days_remaining: number;
};

function addMonths(iso: string, months: number): Date {
  const d = new Date(iso + "T00:00:00");
  const nd = new Date(d);
  nd.setMonth(d.getMonth() + months);
  return nd;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeUpcomingMilestones(
  customers: Customer[],
  milestones: MilestoneConfig[],
  customDates: CustomerDate[],
  lookaheadDays = 60,
): UpcomingMilestone[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + lookaheadDays);
  const out: UpcomingMilestone[] = [];

  for (const c of customers) {
    if (c.baby_dob) {
      for (const m of milestones.filter((x) => x.active)) {
        const md = addMonths(c.baby_dob, m.months);
        if (md >= today && md <= horizon) {
          const remind = new Date(md);
          remind.setDate(remind.getDate() - 7);
          out.push({
            customer: c,
            kind: "baby_milestone",
            label: m.label,
            milestone_date: toISO(md),
            remind_on: toISO(remind),
            days_remaining: daysBetween(md, today),
          });
        }
      }
    }
    if (c.anniversary_date) {
      const ad = new Date(c.anniversary_date + "T00:00:00");
      const thisYear = new Date(today.getFullYear(), ad.getMonth(), ad.getDate());
      const target = thisYear < today ? new Date(today.getFullYear() + 1, ad.getMonth(), ad.getDate()) : thisYear;
      if (target <= horizon) {
        const remind = new Date(target);
        remind.setDate(remind.getDate() - 7);
        out.push({
          customer: c,
          kind: "anniversary",
          label: "Anniversary",
          milestone_date: toISO(target),
          remind_on: toISO(remind),
          days_remaining: daysBetween(target, today),
        });
      }
    }
  }

  for (const cd of customDates) {
    const cust = customers.find((c) => c.id === cd.customer_id);
    if (!cust) continue;
    const d = new Date(cd.date + "T00:00:00");
    let target: Date;
    if (cd.recurring) {
      const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      target = thisYear < today ? new Date(today.getFullYear() + 1, d.getMonth(), d.getDate()) : thisYear;
    } else {
      target = d;
    }
    if (target >= today && target <= horizon) {
      const remind = new Date(target);
      remind.setDate(remind.getDate() - 7);
      out.push({
        customer: cust,
        kind: "custom",
        label: cd.label,
        milestone_date: toISO(target),
        remind_on: toISO(remind),
        days_remaining: daysBetween(target, today),
      });
    }
  }

  return out.sort((a, b) => a.milestone_date.localeCompare(b.milestone_date));
}

/* -------------------- Message generator -------------------- */

export function offerText(offer: ReminderOffer | null | undefined): string {
  if (!offer) return "";
  switch (offer.offer_type) {
    case "percent":
      return `Book this week and enjoy an exclusive ${offer.value ?? 0}% discount on your session.`;
    case "flat":
      return `Book this week and enjoy a special ₹${offer.value ?? 0} off on your session.`;
    case "free_item":
      return `Book this week and receive a complimentary ${offer.message ?? "gift"} with your session.`;
    case "text":
      return offer.message ?? "";
    default:
      return offer.message ?? "";
  }
}

export function generateReminderMessage(opts: {
  customer: Customer;
  milestoneLabel: string;
  kind: string;
  template?: string;
  offer?: ReminderOffer | null;
}): string {
  const { customer, milestoneLabel, kind, template, offer } = opts;
  const parents = [customer.mother_name, customer.father_name].filter(Boolean).join(" & ") || customer.customer_name;
  const baby = customer.baby_name ?? "your little one";
  const line = template ?? "Every month is a new adventure worth remembering. 📸";
  const oText = offerText(offer ?? null);

  if (kind === "baby_milestone") {
    return `🎉 Hello ${parents}!

Little ${baby} is about to complete ${milestoneLabel.toLowerCase()}! ❤️

${line}

We'd love to capture this beautiful stage with a special milestone photoshoot.${oText ? `\n\n${oText}` : ""}

Because tiny moments become lifelong memories. 📸✨

We look forward to seeing your beautiful family again!

– ${SITE.name}`;
  }
  if (kind === "anniversary") {
    return `💐 Hello ${parents}!

Your special anniversary is coming up soon.

${line}

Let us help you capture this beautiful chapter together.${oText ? `\n\n${oText}` : ""}

– ${SITE.name}`;
  }
  return `Hello ${parents}!

${milestoneLabel} is coming up.

${line}${oText ? `\n\n${oText}` : ""}

– ${SITE.name}`;
}

export function pickTemplate(templates: MessageTemplate[]): string | undefined {
  const active = templates.filter((t) => t.active);
  if (!active.length) return undefined;
  return active[Math.floor(Math.random() * active.length)].body;
}
