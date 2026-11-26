# Claude Code Development Script — Wadi Al Ghubaitah E-Commerce Website

Is file ko upar se neeche follow karein. **Part A** ek dafa setup hai, **Part B** mein 11 prompts hain jo Claude Code mein **ek ek kar ke** paste karne hain. Har phase complete aur check hone ke baad hi agla prompt dein.

---

## PART A — One-time Setup (Terminal / CMD)

### A1. Requirements install karein
- **Node.js 20 LTS** — https://nodejs.org (install ke baad check: `node -v`)
- **Git** — https://git-scm.com
- **VS Code** (optional, code dekhne ke liye)

### A2. Claude Code install karein
```bash
npm install -g @anthropic-ai/claude-code
```

### A3. Project folder banayein
```bash
mkdir wadi-ecommerce
cd wadi-ecommerce
git init
```

### A4. Spec file folder mein rakhein
`CLAUDE_CODE_PROMPT.md` (pehle wali file) ko is folder mein copy karein aur uska naam **`CLAUDE.md`** rakh dein.
Claude Code `CLAUDE.md` har session mein khud parhta hai, is liye poori spec hamesha uske samne rahegi — chahe session band ho jaye.

```bash
# Windows
copy "C:\path\to\CLAUDE_CODE_PROMPT.md" CLAUDE.md
# Mac/Linux
cp ~/Downloads/CLAUDE_CODE_PROMPT.md CLAUDE.md
```

### A5. Claude Code start karein
```bash
claude
```
Pehli dafa login maangega — apne Claude account se login karein.

> **Tip:** Har phase ke baad Claude ko bolein `commit this phase` — taa ke kuch kharab ho to wapas ja sakein.

---

## PART B — Phase Prompts (copy → paste → wait → check)

### Phase 1 — Setup & Layout
```
Read CLAUDE.md carefully. It is the full specification for this project — follow it exactly for the whole build.

Start Phase 1 (Setup):
- Scaffold Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui in the current folder.
- Add the colour tokens and fonts from Section 2 (Inter, Plus Jakarta Sans, IBM Plex Sans Arabic) with dark mode support.
- Set up next-intl with /en and /ar routes, dir="rtl" for Arabic, and a language switcher.
- Build the base layout: top bar, header (SVG text logo, search, wishlist, notifications, account, cart icons) and footer as described in Section 4.
- Create messages/en.json and messages/ar.json.
Run the dev server, confirm /en and /ar both render with no errors, then summarise what you built and commit.
```
**Check:** `npm run dev` → browser mein `http://localhost:3000/en` aur `/ar` kholein. Arabic mein layout mirror (right-to-left) hona chahiye.

---

### Phase 2 — Database & Seed Data
```
Phase 2 (Database): Using CLAUDE.md Sections 6 and 7:
- Create the full Prisma schema with SQLite, storing all money as integer baisa.
- Add indexes on foreign keys and search fields.
- Write the seed script with the 3 demo accounts, 6 categories, 36+ bilingual products (some low-stock and out-of-stock), 40+ historical orders across the last 60 days in all statuses, payments, reviews, notifications and the 2 coupons.
- Add npm scripts: seed, backup.
Run the migration and seed, confirm no errors, print the demo credentials, then commit.
```
**Check:** `npx prisma studio` chala kar tables mein data dekhein.

---

### Phase 3 — Authentication & Roles
```
Phase 3 (Auth): Implement register, login, logout, change password, and forgot/reset password exactly as in Section 3.1 items 1–4.
- Auth.js v5 credentials provider, bcrypt, zod validation, Omani phone format (+968 + 8 digits).
- Rate limit: 5 failed logins per 15 minutes.
- Roles CUSTOMER / STAFF / ADMIN enforced in middleware AND in every server action.
- All forms bilingual with clear error messages.
Test that a customer cannot open /admin and a staff user cannot open admin-only pages. Then commit.
```
**Check:** `customer@wadialghubaitah.test` se login kar ke `/en/admin` kholein — block hona chahiye.

---

### Phase 4 — Product Catalogue
```
Phase 4 (Catalogue): Build the Home page (all 11 sections from Section 4), Shop page, Category page, Search results and Product detail page.
- Filters: category, price range, in-stock, rating. Sort: newest, price low-high, high-low, top rated. Pagination.
- Product page: gallery, OMR price with 3 decimals, stock status, specs table, reviews summary, related products.
- Skeleton loaders and empty states.
Verify everything works in both English and Arabic and on mobile width, then commit.
```

---

### Phase 5 — Cart, Checkout & Payment
```
Phase 5 (Cart, Checkout, Payment): Implement Section 3.1 items 7–9 and item 13 (coupons).
- Zustand guest cart that merges into the DB cart on login; mini-cart drawer; stock limits.
- Checkout with all 11 Omani governorates, Wilayat, address fields, Standard/Express delivery, coupon field.
- Server-side totals: subtotal, delivery fee, 5% VAT, discount, total — all in baisa.
- Simulated payment page clearly labelled "Test Payment — Demo Mode" (no real bank/brand styling). 4242 4242 4242 4242 succeeds, 4000 0000 0000 0002 fails, plus Cash on Delivery. Store only last 4 digits.
- Order placement in a single DB transaction that also decrements stock and creates notifications.
- Order confirmation page with order number format WG-XXXXX.
Test all three payment paths and confirm order + payment statuses are correct. Then commit.
```
**Check:** Teeno tareeqon se order karein — success card, fail card, COD.

---

### Phase 6 — Customer Account
```
Phase 6 (Customer account): Build the account area from Section 4:
- Dashboard, My Orders, Order detail with visual status timeline (Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered, plus Cancelled), cancel button only for Placed/Confirmed.
- Notification bell with unread count, mark read / mark all read.
- Wishlist, saved addresses, profile + change password.
- Reviews: only customers with a Delivered order for that product can review, one review per product, rating breakdown on product page.
Then commit.
```

---

### Phase 7 — Admin Panel
```
Phase 7 (Admin panel): Build everything in Section 3.2 except Reports:
- Dashboard with KPI cards and Recharts charts (30-day sales line, orders-by-status donut, top 5 products bar, recent orders table).
- Products CRUD (bilingual fields), Categories CRUD, Inventory with stock adjustments + movement history + low-stock highlight.
- Orders: filters, detail, status update that notifies the customer, printable invoice.
- Customers, Reviews moderation, Coupons (ADMIN only), Users & Roles (ADMIN only), Contact messages.
- Admin must also work in Arabic RTL.
Enforce role rules on the server. Then commit.
```
**Check:** `admin@...` aur `staff@...` dono se login kar ke farq dekhein.

---

### Phase 8 — Reports
```
Phase 8 (Reports): Build the 5 reports from Section 3.2:
1. Sales  2. Product inventory  3. Customer orders  4. Payment transactions  5. Delivery status
Each needs a date-range filter, summary cards, a chart, a data table, Export CSV, and a print-friendly view. Financial reports are ADMIN only.
Verify the numbers match the database, then commit.
```

---

### Phase 9 — Static Pages & Content
```
Phase 9 (Content): Create About Us, Services, Contact Us (form saved to DB), FAQ, Privacy Policy, Terms & Conditions and a custom 404, using the wording in Section 5.
- Polished British English, and natural Modern Standard Arabic translations (not word-for-word) for EVERY string in the site, including admin.
- Search the whole codebase and remove any lorem ipsum or hard-coded untranslated text.
Then commit.
```

---

### Phase 10 — Polish & QA
```
Phase 10 (Polish & QA): Do a full quality pass:
- Responsive check at 360px, 768px, 1280px — no horizontal scroll, nothing broken.
- RTL check of every page: spacing, icons, arrows, tables, charts.
- Accessibility: contrast, focus rings, labels, alt text, keyboard navigation.
- Loading, empty and error states everywhere; error boundaries.
- Security headers (CSP, X-Frame-Options), .env.example, no secrets client-side.
- Run Lighthouse on the home page and fix issues until performance and accessibility are 90+.
List what you fixed, then commit.
```

---

### Phase 11 — Tests, Docs & Screenshots
```
Phase 11 (Tests & docs):
- Vitest unit tests for price/VAT/coupon calculations and RBAC helpers.
- Playwright E2E: register → add to cart → checkout with test card → order appears in tracking.
- Use Playwright to capture screenshots into docs/screenshots/: home (EN), home (AR), shop, product, cart, checkout, payment, order tracking, customer dashboard, admin dashboard, and each of the 5 reports.
- README: setup steps, demo credentials, features, and a table "Report Requirement → Where it is in the website".
- Dockerfile and DECISIONS.md.
Finally run npm run build and npm test, fix every error and warning, and give me a final summary.
```

---

## PART C — Agar masla aaye

| Masla | Claude Code ko kya likhein |
|---|---|
| Koi error aa raha hai | Error copy kar ke paste karein + `fix this` |
| Design pasand nahi aaya | `The [page] looks plain. Redesign it to feel premium and modern following Section 2 of CLAUDE.md.` |
| Arabic mein kuch ulta hai | `On /ar/[page], [element] is not mirrored correctly. Fix RTL.` |
| Session band ho gaya | `claude` dobara chalayein aur likhein: `Continue from where we stopped. Check git log and CLAUDE.md, then continue the next phase.` |
| Kuch bigar gaya | `Revert to the last commit.` |

## PART D — Daily Run Commands
```bash
npm run dev      # website chalayein → http://localhost:3000
npm run seed     # demo data dobara daalein
npm test         # tests
npm run build    # production build check
```

**Demo logins:**
- Admin: `admin@wadialghubaitah.test` / `Admin@12345`
- Staff: `staff@wadialghubaitah.test` / `Staff@12345`
- Customer: `customer@wadialghubaitah.test` / `Customer@12345`
