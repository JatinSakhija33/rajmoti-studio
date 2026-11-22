# Rajmoti integration audit — before application changes

Base: main at 32c340c3873ed340ac98af4b3807bb8d859678fc.
Product-feature source: feature/products-rebuild-4.0 at c90a171dff45a35037a655d38846c4d574dae6a4.
Compatibility reference: antigravity/rajmoti-2-production at 1033bc8ed7d25da01774446c305c2a9074d97394.

The earlier storefront work remains untouched in work/rajmoti-studio and in PR #2. Its tracked patch and complete status were saved under work/integration-audit. A separate worktree and integration branch, codex/integrate-gift-tools, now start directly from main.

## Findings

- Main contains the original photography homepage, portfolio routes, saved styles, Supabase authentication, admin dashboard, contacts/CRM, calendar, bookings, gallery management and production workflow. These were not deleted by PR #2, but that preview incorrectly made the homepage and shared navigation shop-led.
- Both feature sources contain the missing product preview engines. The latest source adds a reusable photo-fitting tool and a two-sided keychain editor. Its mug, frame, translight and devotional engines also include fixes relative to the antigravity reference.
- Required visual dependencies are Three.js, page-flip and qrcode, plus their types. The DOM-based frame/collage engine does not require bringing over the branch's entire Konva stack.
- The advanced branches also replace authentication/navigation, add a separate Cloudflare owner desk, D1/R2 APIs, pricing rules, SEO and a new homepage. Those changes cannot be merged wholesale without changing main's architecture.
- The advanced checkout sends kind/fulfillmentType/deliveryAddress, while its server currently reads type/fulfillment/address. It also omits the Turnstile token required by its order endpoint. Those contracts need an adapter before checkout can work.
- Main's seed variant prices are unconfirmed/null. The advanced branch contains existing calculated price rules. Integration must preserve main records and explicit prices, identify supported existing price rules, and avoid adding guessed inventory, reviews or discounts.
- Customer UTR submission must only set pending_verification. Owner verification must fail closed, require authenticated authorization, and never infer payment success from a UPI-link click. Existing branch payment handlers swallow write errors and need correction before reuse.
- Main's demo guards block uploads and all POST requests. Local product previews need a narrowly scoped exception; configured order endpoints must be permitted without opening unrelated external services.

## Bounded integration

Preserve main's photography homepage, branding, portfolio, authentication, existing admin modules, Supabase sources and storage keys. Add the reviewed preview engines, matching sample assets, gift-only shopping navigation, cart and optional configured order/payment endpoints under Products & Personalized Gifts. Keep manual payment reconciliation in the existing admin area, with deployment requirements documented. No production data migration or payment transaction is authorized by this integration.
