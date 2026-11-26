# Wadi Al Ghubaitah — Online Shopping & E-Commerce Management System

> Spec reconstructed from the project report ("Online Shopping and E-Commerce Management System",
> Zahra al Shukaili, GIS6000) and the phase prompts in `claude_code_prompts_full.md`.
> The code must match what the report describes: product management, customer orders, payments,
> inventory, customer communication, and the five management reports.

## 1. Project

- Company: **Wadi Al Ghubaitah Trade & Cont.** — trading and contracting, Sultanate of Oman.
- Brand shown on the site: **Wadi Al Ghubaitah** / **وادي الغبيطة**.
- Currency OMR, stored as **integer baisa** (1 OMR = 1000 baisa), always displayed with 3 decimals
  (`OMR 12.500` / `12.500 ر.ع.`). VAT 5 %. Timezone Asia/Muscat. Phone format `+968` + 8 digits.
- Languages: English (British spelling) at `/en`, Modern Standard Arabic at `/ar` with `dir="rtl"`.
- Stack (do not change without asking): Next.js 14 App Router, TypeScript, Tailwind 3, shadcn/ui
  (Radix), next-intl 3, Auth.js v5 (credentials), Prisma + SQLite, Zustand, zod, Recharts,
  Vitest, Playwright.

## 2. Design system

- Feel: premium, calm, trustworthy; generous white space, rounded-2xl cards, soft shadows.
- Fonts: **Plus Jakarta Sans** (headings, EN), **Inter** (body, EN), **IBM Plex Sans Arabic** (all AR).
- Colour tokens (HSL CSS variables, light / dark):
  - `primary` deep oasis teal `#0F5F5A` / `#2BB3A3`
  - `accent` desert sand gold `#C8963E` / `#E0B565`
  - `background` `#FAFAF7` / `#0B1514`; `card` `#FFFFFF` / `#111E1D`
  - `foreground` `#13201F` / `#E8EFEE`; `muted` `#F1F2EE` / `#1A2928`
  - `success` `#15803D`, `warning` `#B45309`, `destructive` `#B91C1C`, `info` `#1D4ED8`
- Dark mode via `class` strategy with a toggle; respects system preference on first visit.
- Logo: SVG text logo (stylised wadi/dune mark + wordmark), no raster logo.
- Product images: locally generated SVG illustrations (no external image hosts).

## 3. Functional requirements

### 3.1 Customer features
1. **Register** — name, email, Omani phone (`+968` + 8 digits), password (min 8, upper, lower, digit, symbol), confirm.
2. **Login / logout** — email + password; 5 failed attempts per 15 minutes locks further attempts for that email+IP.
3. **Change password** — current + new + confirm, from the profile page.
4. **Forgot / reset password** — request by email; one-time token (hashed in DB, 30-minute expiry). Email is simulated: the link is written to the server log and shown in demo mode.
5. **Browse & search** — shop, category pages, search with filters (category, price range, in-stock, rating), sort (newest, price ↑, price ↓, top rated), pagination.
6. **Product detail** — gallery, price, stock status, specs table, reviews summary with breakdown, related products, add to cart / wishlist.
7. **Cart** — guest cart in Zustand (localStorage) merged into DB cart on login; mini-cart drawer; quantities capped at stock.
8. **Checkout** — address (11 governorates, wilayat, area, street, building, way, notes), Standard (OMR 1.500, free over OMR 20.000) or Express (OMR 3.500) delivery, coupon field, server-side totals.
9. **Online payment** — simulated gateway page “Test Payment — Demo Mode”. Card `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined, plus Cash on Delivery. Only last 4 digits are stored.
10. **Order tracking** — timeline Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered (+ Cancelled). Customers may cancel while Placed/Confirmed.
11. **Notifications** — in-app bell with unread count; created on order placement, payment, status change.
12. **Customer reviews** — only after a Delivered order containing the product; one review per product; moderated (admin can hide).
13. **Coupons** — percentage or fixed, min order, expiry, usage limit; validated server-side.
14. **Wishlist** and **saved addresses**.

### 3.2 Admin / staff features (`/[locale]/admin`)
- Dashboard: KPI cards (revenue 30d, orders 30d, average order value, customers, low-stock items), 30-day sales line, orders-by-status donut, top 5 products bar, recent orders table.
- Products CRUD (bilingual fields), Categories CRUD, Inventory (stock adjustments with reason, movement history, low-stock highlight).
- Orders: filters, detail, status update (notifies customer), printable invoice.
- Customers, Reviews moderation, Contact messages.
- **ADMIN only:** Coupons, Users & Roles, financial reports.
- **Reports** (each: date-range filter, summary cards, chart, table, Export CSV, print view):
  1. Sales (ADMIN) 2. Product inventory 3. Customer orders 4. Payment transactions (ADMIN) 5. Delivery status
- Roles: CUSTOMER, STAFF, ADMIN — enforced in middleware **and** in every server action / route handler.

## 4. Pages & layout

- Top bar: free-delivery message, phone, language switcher, theme toggle.
- Header: SVG logo, search, wishlist, notifications, account, cart (with count) + category nav; mobile drawer.
- Footer: about blurb, quick links, customer service links, contact details (Muscat, Oman), payment methods (text badges), copyright.
- Home (11 sections): 1 Hero, 2 Trust strip (delivery, secure payment, returns, support), 3 Shop by category,
  4 Featured products, 5 Promo banner (coupon WELCOME10), 6 New arrivals, 7 Best sellers,
  8 Services (trading & contracting), 9 Why choose us + stats, 10 Customer reviews, 11 Newsletter / contact CTA.
- Shop, Category, Search, Product, Cart, Checkout, Payment, Order confirmation.
- Account: Dashboard, Orders, Order detail, Wishlist, Addresses, Profile, Notifications.
- Static: About, Services, Contact (saved to DB), FAQ, Privacy Policy, Terms & Conditions, custom 404.

## 5. Content wording (source text; translate naturally into MSA)
- Tagline: “Quality products, delivered across Oman.”
- About: Wadi Al Ghubaitah Trade & Cont. is an Omani trading and contracting company supplying quality
  products and dependable services to homes and businesses. Vision: to be one of Oman’s leading trading and
  contracting companies through innovation, service and digital transformation. Mission: to give customers
  high-quality products and services they can rely on, through efficient operations and technology.
- Services: product trading & supply, contracting services, delivery across Oman, customer support, secure online payment, inventory & bulk orders.
- Contact: Muscat, Sultanate of Oman · +968 2400 0000 · info@wadialghubaitah.test · Sun–Thu 8:00–17:00.

## 6. Data model (Prisma, SQLite)
User, PasswordResetToken, LoginAttempt, Address, Category, Product, ProductImage, StockMovement,
Cart, CartItem, WishlistItem, Order, OrderItem, OrderStatusHistory, Payment, Coupon, Review,
Notification, ContactMessage. All money = `Int` baisa. Indexes on all foreign keys and searchable fields.

## 7. Seed data
- Accounts: `admin@wadialghubaitah.test` / `Admin@12345` (ADMIN), `staff@wadialghubaitah.test` / `Staff@12345` (STAFF),
  `customer@wadialghubaitah.test` / `Customer@12345` (CUSTOMER) + ~12 extra customers.
- 6 categories, 36+ bilingual products (some low-stock ≤ 5, some out of stock).
- 40+ orders over the last 60 days in every status, with payments (card success/failed, COD), status history.
- Reviews, notifications, coupons `WELCOME10` (10 %, min OMR 10) and `OMAN5` (OMR 5 off, min OMR 30).

## 8. Non-functional
Accessible (WCAG AA), responsive (360 / 768 / 1280), RTL-correct, security headers, no secrets client-side,
error boundaries, loading skeletons, empty states, Lighthouse ≥ 90 performance & accessibility.
