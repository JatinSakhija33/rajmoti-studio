# Jetpur search and Firestore rollout

## Connect the mobile app first

Use a **read-only pilot**. Keep the mobile app’s existing Firestore data authoritative for the collection you choose. The website already uses Supabase for its admin jobs, customers, bookings and gallery, with separate Cloudflare storage for gift orders. Website orders and payments are outside the first pilot.

| Step | What to do |
| --- | --- |
| Identify the source | Verify the Firebase project ID, Firestore database ID and the real collection path. Inspect the mobile app’s models and one redacted sample document. Confirm who can own and edit each field. |
| Start small | Choose one collection, usually jobs. Backfill ten redacted or dedicated test records into a staging Supabase table. If the app already has reliable status updates, an owner-only read from Firestore is an alternative to a mirror. |
| Map the records | Map service, job stage, promised date and update timestamps. Keep the stable Firestore document path as the external key and preserve the website’s own IDs. Confirm timezone handling with the mobile app. |
| Verify the pilot | Compare record counts, status changes and duplicates. Repeat the same record import twice and check that it updates the original row. Check owner-only visibility and label the last successful sync. |
| Automate | If real-time is needed, deploy an authenticated server-side sync, for example a Firestore trigger. Retry safely using document versions, ignore stale updates, record failures and test deletes or archiving. Keep a manual recheck path. |
| Expand deliberately | Consider customer and booking data only after the job pilot. Preserve payments and photos in their existing systems until there is an explicit mapping and access review. |

Firebase Admin credentials belong only on the server. Use least-privilege IAM and a dedicated integration identity. Keep app users’ current Firebase rules, website roles and customer data access boundaries. For a no-billing pilot, use a sanitized export. Firebase Cloud Functions requires the Blaze plan for deployment, so review costs and expected volume before enabling a trigger.

## Search priorities

- Submit `https://rajmotistudio.in/sitemap.xml` in Search Console once the public changes are live. Inspect the homepage, baby and maternity pages, and one product and service page.
- Verify the public studio address, primary phone, hours and website in Google Business Profile. Update relevant directories where Rajmoti Studio still points to an older domain. Use genuine customer reviews and real service photos.
- Track website clicks and calls from Google Business Profile, impressions for service queries and inquiries from each page. City-level organic or Maps rankings depend on the searcher and Google’s systems.
- Keep service FAQs short and answer from studio practice. Audit offerings and photos when the business changes.

## Google Business Profile copy

**Business description**

Rajmoti Studio has served families in Jetpur, Gujarat since 1982. We photograph newborns and babies, maternity sessions, families and weddings. At the studio you can also enquire about passport and visa photos, old photo restoration, Gujarati memorial portraits, photo printing and framing. We make personalised photo gifts such as ceramic mugs, wooden frames, acrylic prints and photo keychains. Tell us what you have in mind and we’ll confirm suitable options and collection details.

**Product Editor starter entries**

Use a real photograph of the specific product, the confirmed price if appropriate, and its matching page. Availability of Product Editor depends on the Business Profile.

| Product title | Description | Website |
| --- | --- | --- |
| Personalised Ceramic Photo Mug | A ceramic mug printed with your photograph. Ask about artwork placement and collection from our Jetpur studio. | https://rajmotistudio.in/gifts/ceramic-photo-mug |
| Custom Wooden Photo Frame | Frame your family, wedding or baby photograph. Ask about print sizes and finishes available at Rajmoti Studio. | https://rajmotistudio.in/gifts/wooden-photo-frame |
| Custom Acrylic Photo Print | A clear acrylic photo print for home display or gifting. Send the photo and ask about available sizes and artwork preparation. | https://rajmotistudio.in/gifts/acrylic-photo-print |
| Personalised Acrylic Photo Keychain | A small acrylic keepsake with your photograph. Ask the studio about shapes, crops and quotes. | https://rajmotistudio.in/gifts/acrylic-photo-keychain |

Google Shopping through Merchant Center is separate. Start with a small set of genuinely orderable variants after checkout, displayed INR prices, matching availability, real product photos and clear fulfilment and returns policies are verified. Keep quote-only products and photography services outside that feed. Set actual shipping costs and regions in India where delivery is offered. Keep the studio’s existing prepayment and collection policies accurate.
