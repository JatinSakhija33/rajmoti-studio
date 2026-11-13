-- Contacts: staff can read and update (mark contacted, favourite), not delete
CREATE POLICY "staff read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update customers" ON public.customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Notes and tasks: staff can fully manage
CREATE POLICY "staff manage contact notes" ON public.contact_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "staff manage contact tasks" ON public.contact_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reminders: staff can read and update status
CREATE POLICY "staff read reminders" ON public.reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff update reminders" ON public.reminders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Read-only reference data used to render messages
CREATE POLICY "staff read reminder offers" ON public.reminder_offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff read message templates" ON public.message_templates FOR SELECT TO authenticated USING (true);