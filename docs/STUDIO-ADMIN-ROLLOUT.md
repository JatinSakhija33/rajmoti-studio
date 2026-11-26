# Rajmoti Studio admin rollout

## Preview checks

Use a Cloudflare Pages preview with access to the intended Supabase project. Confirm the admin account, job reads, gallery metadata and gallery storage under **Settings → Connections**. Test a gallery draft and a website publish with a consented non-customer test asset. Confirm the draft stays out of the public listing and the published photo appears under its intended category. Check a real owner session and a non-admin session.

Gallery suggestions run locally. Category, subcategory and subject tags use recognised words in file and folder names. The generated web copy supplies the framing tag. Unknown or ambiguous names require a category choice. A batch continues across admin screens in the same browser tab. Following a refresh or browser close, reselect files that had not finished. Private print originals belong in a job's photo section.

Test one editing job from Today through proof review and pickup. Test the core workflow in desktop and phone layouts. All live writes should use approved staging records.

## Connect existing gift orders

The request inbox uses Supabase. Gift orders and recorded receipts use the existing Cloudflare D1 database. In the Rajmoti Pages project, check **Settings → Bindings** for the relevant environment. Identify the existing order database from its project records before linking `ORDER_DB`. Check that the database contains the schemas for `orders`, `order_photos` and `order_payments`. The repository's `db/migrations` contains the expected schema history. Check for the existing private `ORDER_PHOTOS` bucket before binding it. Redeploy the environment and use **Settings → Connections** to verify the binding.

Keep customer checkout flags at their existing values during this recovery. Historical Lovable data and images need source receipts or a verified export before a migration can be called complete.

## Low-cost automation ideas

| Area | Next practical improvement |
| --- | --- |
| Today, jobs and calendar | Suggest a pickup reminder when a job first moves to Ready. Add a single agenda for shoots and print deadlines. |
| Bookings and enquiries | Offer suitable slots from confirmed calendar availability before accepting a session. Keep WhatsApp in draft form for owner review. |
| Contacts, reminders and offers | Fold duplicate suggestions into the normalized phone search. Let the owner preview a Gujarati or English message with variables filled in. |
| Catalogue, gift requests and gift orders | Add a shared saved product draft and use published prices in checkout. Surface verified payment balances and missing design photos before printing. |
| Gallery, categories and website content | Remember frequently used category defaults. Use photo dimensions to sort suggested hero candidates for the chosen frame. Keep suggested tags and publishing editable. |
| Reels, session packages and Booking CMS | Generate draft names from filenames and let the owner copy a proven package or weekly availability schedule. Preview the customer booking form before changing it. |
| Storage and settings | Group recoverable upload failures and stale drafts. Surface measured usage only where the provider reports it. |
