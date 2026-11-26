# Design decisions

Short records of the choices that shape this codebase and why they were made.

## 1. Specification
The build script referred to a `CLAUDE.md` specification that was not supplied. `CLAUDE.md` was reconstructed from the project report (functional and non-functional requirements, the five reporting requirements, company profile) and the eleven phase prompts. Where the report was silent, conventional Omani e-commerce practice was used (OMR with three decimals, 5 % VAT, 11 governorates, `+968` numbers).

## 2. Stack
Next.js 14 App Router with server components and server actions keeps data access on the server and avoids a separate API for the UI. **SQLite** via Prisma makes the project run anywhere with no database server; the schema avoids SQLite-specific features, so switching the Prisma provider to PostgreSQL is a one-line change (plus string columns that could become enums).

## 3. Money
All amounts are **integer baisa** (1 OMR = 1000 baisa) in the database, calculations and tests. Formatting to `OMR 12.500` happens only at the edges. This removes floating-point rounding errors in totals and reports.

## 4. Prices and VAT
Catalogue prices are shown **excluding VAT**; 5 % VAT is added at checkout on merchandise after discount **plus delivery**, rounded to the nearest baisa, and itemised on the invoice. Free standard delivery is decided on the merchandise total **after** discounts, so a coupon can’t be used to unlock free delivery unintentionally.

## 5. Totals are never trusted from the client
The Zustand cart stores only product ids and quantities. Prices, stock and totals are always recomputed on the server (`buildQuote`), both for display and again inside the order transaction.

## 6. Order placement and stock
An order is placed in **one transaction**: re-price the cart, validate coupon and stock, create the order, items, history and payment record, decrement stock with a conditional update (`stock >= qty`, so two buyers can’t take the last item), record stock movements, count the coupon use, clear the cart and notify the customer.
For card payments the order is created first (status *Placed*, payment *Pending*) and the customer is sent to the payment page; this **reserves the stock** while they pay. A successful payment moves the order to *Confirmed*; a decline leaves it *Placed / Failed* so the customer can retry, switch to cash on delivery or cancel (which restocks). Staff can cancel abandoned unpaid orders.

## 7. Simulated payments
No real gateway or bank branding is used. The page is labelled “Test Payment — Demo Mode”; only `4242…4242` (success) and `4000…0002` (decline) are recognised. Only the **last four digits** and the cardholder name are stored, never the full number or CVC. Each attempt is a separate `Payment` row, so the payments report shows declines, refunds and voids as well as successes. Cash on delivery is recorded as *Pending* and marked *Succeeded* when staff mark the order *Delivered*.

## 8. Authentication and authorisation
Auth.js v5 with the credentials provider and **JWT sessions** (works on the edge middleware). Because a JWT can be stale, every protected page, server action and route handler re-reads the user from the database (`getCurrentUser`), so role changes and deactivations take effect immediately. Roles are enforced in three layers: middleware (redirect/403), pages (`requireRole`) and actions (`guarded`/`assertRole`). The CSV export route sits outside the middleware and checks the role itself.
Failed logins are stored in a `LoginAttempt` table: 5 failures per email in 15 minutes lock that account temporarily (plus a looser per-IP limit). Password-reset tokens are random, stored only as SHA-256 hashes, expire after 30 minutes and are single-use. Email is simulated: the reset link is logged and, in demo mode, shown on screen.

## 9. Internationalisation
next-intl with `/en` and `/ar` prefixes, `dir="rtl"` for Arabic, logical CSS properties (`ms-`, `pe-`, `start-`) so layouts mirror automatically, and icons that imply direction flipped with `.rtl-flip`. Charts render in an LTR box with reversed axes in Arabic. Bilingual content (products, categories, notifications) is stored in both languages in the database. System notes (e.g. “Opening stock”) are stored as codes and translated on display. Validation errors are translation keys, so the same zod schemas serve both languages on client and server.
To keep pages light, only the message namespaces a route’s client components need are sent to the browser (`ScopedMessages`).

## 10. Reports
One builder (`src/server/reports.ts`) feeds both the report pages and the CSV export, so on-screen numbers and exported numbers can’t disagree. Dates are grouped by **Asia/Muscat** calendar days. Revenue counts every non-cancelled order (card paid or cash due). Sales and payment reports are admin-only; inventory, customer-order and delivery reports are available to staff. Every headline figure was verified against independent raw SQL.

## 11. Charts
Recharts with a categorical palette validated for colour-vision deficiency and contrast in both light and dark mode. Donuts and multi-series charts always have a text legend with values, and every report also has a data table, so meaning never depends on colour alone.

## 12. Product imagery
No external image hosts (privacy, CSP and offline use). The seed generates SVG product art from Lucide icons; products added in the admin can generate the same style of artwork via `/api/art/…`, or use any site path or https URL.

## 13. Performance and Lighthouse
Measured with Lighthouse 12 (mobile, simulated throttling) against `npm run build && npm start`:

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/en` home | 90–93 | 100 | 100 | 100 |
| `/ar` home | 88–89 | 100 | 100 | 100 |
| `/en/shop`, `/en/product/…` | 90–91 | 98–100 | 100 | 100 |

Changes that got there: variable fonts, no cross-locale font preloading, `font-display: optional` for headings and Arabic text (CLS 0), single-SVG rating stars, scoped client translations, no duplicated hero/featured products, no image preloads for the hero collage hidden on phones. The Arabic home page remains 1–2 points below 90: its first paint waits on the Arabic web font and a slightly larger document. Further gains would need per-locale root layouts (to preload only the Arabic font on Arabic pages) — noted as a follow-up.

## 14. Security headers
CSP restricts everything to the same origin. `script-src` includes `'unsafe-inline'` because Next.js injects inline bootstrap scripts; a nonce-based CSP would remove that at the cost of making every page dynamic. HSTS and `upgrade-insecure-requests` are enabled only with `ENABLE_HTTPS_HEADERS=true`, so plain-HTTP deployments (e.g. a LAN demo) keep working.

## 15. Testing
- **Vitest** unit tests cover the pure logic where mistakes are costly: totals, VAT rounding, delivery thresholds, coupon rules, phone/password validation, CSV safety, Muscat date ranges, route access rules and the server-action guard.
- **Playwright** covers the full purchase journey (register → cart → checkout with the test card → tracking) and the declined-card path, and captures the documentation screenshots.
- During development, additional scripted checks covered every route at 360/768/1280 px in both languages (no horizontal overflow) and axe-core in light and dark mode (no serious or critical violations).
