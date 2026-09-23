# Kanhaiya Collection — Production Deployment & Operations Guide

This guide details the deployment, configuration, database migrations, security rules, and verification procedures for **Kanhaiya Collection**, a royal Indian ethnic couture e-commerce platform built with Next.js 16 (App Router & Turbopack), Supabase (PostgreSQL with RLS and schema triggers), and Razorpay payments.

---

## 1. Architecture Overview

- **Framework**: Next.js 16.3.2 with React 19, Tailwind CSS v4, and Turbopack compiler.
- **Data & Auth Layer**: Supabase PostgreSQL with Row Level Security (RLS) policies on all tables and storage buckets.
- **State Machine & Automation**: Handled via database triggers:
  - `trg_order_confirmation`: Decrements variant stock and increments product sold count *once* when an order enters `confirmed`.
  - `trg_refresh_rating`: Authoritatively calculates and updates `avg_rating` and `review_count` exclusively from `is_approved = true` reviews.
  - `trg_prevent_role_change`: Protects against unauthorized role escalation on `public.profiles`.
  - `trg_trim_product_views`: Automatically trims historical views to maintain database performance.
- **Payment Processing**: Dual-mode payment engine:
  - **Cash on Delivery (COD)**: Initiates as `pending` order and pending payment; stocks held and confirmed via admin operations.
  - **Razorpay (Card / UPI / NetBanking / Wallet)**: Server-side cryptographic HMAC-SHA256 order creation, client checkout modal, and server-side webhook ingestion with idempotency guards and service-role execution.

---

## 2. Environment Variables Specification

Ensure all environment variables are correctly provisioned in your hosting environment (e.g. Vercel, AWS Amplify, Docker).

### Public Variables (Safe for Browser Bundles)
| Variable Name | Required | Description | Example |
|---|:---:|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public URL of the storefront | `https://kanhaiyacollection.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project REST/Auth endpoint | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anonymous API key with RLS enforcement | `eyJhbGciOi...` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | Razorpay Public Key ID (used by frontend modal) | `rzp_live_xxxxxxxxxxxxxx` (or `rzp_test_...`) |

### Private Variables (Strictly Server-Only — NEVER Expose with NEXT_PUBLIC_)
| Variable Name | Required | Description | Example |
|---|:---:|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Elevated service role secret bypassing RLS for webhook tasks | `eyJhbGciOi...` |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay private secret key for order generation & signatures | `xxxxxxxxxxxxxxxxxxxxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Webhook cryptographic secret for HMAC-SHA256 signature verification | `whsec_xxxxxxxxxxxxxxxxx` |

> [!CAUTION]
> Under no circumstances should `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, or `RAZORPAY_WEBHOOK_SECRET` be prefixed with `NEXT_PUBLIC_` or imported into client components. Our automated security pass confirms zero secret leakage.

---

## 3. Database Setup, Migrations & Seeds

### Step 3.1: Apply Schema Migrations
1. Run the base schema migration in your Supabase SQL Editor:
   - Tables: `profiles`, `categories`, `products`, `product_variants`, `product_images`, `product_reviews`, `orders`, `order_items`, `addresses`, `cart_items`, `banners`, `homepage_sections`, `testimonials`, `faqs`, `store_settings`, `contact_submissions`, `leads`.
2. Apply the Razorpay integration migration:
   ```sql
   -- file: supabase/migrations/001_razorpay_fields.sql
   ALTER TABLE orders
     ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT UNIQUE,
     ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
     ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

   CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
   ```

### Step 3.2: Verify Database Triggers
Confirm that database triggers are active in PostgreSQL:
```sql
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```
Key triggers:
- `trg_order_confirmation` ON `orders`
- `trg_refresh_rating` ON `product_reviews`
- `trg_prevent_role_change` ON `profiles`
- `trg_trim_product_views` ON `product_views`
- `trg_set_updated_at` ON multiple tables

### Step 3.3: Execute Initial Data Seeding
Run the comprehensive seed script to populate categories, initial couture products, variants, CMS sections, hero banners, and policies:
```bash
npm run seed
# or
npx tsx scripts/seed.ts
```

---

## 4. Razorpay Gateway Setup

1. **Dashboard Configuration**:
   - Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com).
   - Navigate to **Settings > API Keys** and generate live (or test) credentials.
   - Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.

2. **Webhook Endpoint Setup**:
   - Go to **Settings > Webhooks** and click **Add New Webhook**.
   - **Webhook URL**: `https://kanhaiyacollection.com/api/webhooks/razorpay`
   - **Secret**: Generate a strong secret string and configure it as `RAZORPAY_WEBHOOK_SECRET`.
   - **Active Events**:
     - `order.paid`
     - `payment.captured`
     - `payment.failed`

3. **HMAC-SHA256 Signature Verification & Idempotency**:
   - Incoming requests are cryptographically verified using `verifyWebhookSignature()` against raw request text.
   - If an event is received multiple times (e.g. both `order.paid` and `payment.captured`), the idempotency guard detects that `order.payment_status === "paid"` and `order.status === "confirmed"`, returning `idempotent_duplicate_ignored` without double-decrementing stock.

---

## 5. Build & Deployment Execution

### Local Build Validation
Before deploying to production, execute the automated build validation locally:
```bash
# 1. Type-check entire codebase
npx tsc --noEmit

# 2. Run unit and integration verification suites
npx tsx scripts/verify-e2e-integration.ts
npx tsx scripts/verify-orders-reviews.ts

# 3. Compile Next.js production build
npm run build
```

### Vercel / Cloud Deployment
1. Connect Git repository to Vercel (or preferred hosting provider).
2. Configure **Framework Preset**: `Next.js`.
3. Add all public and private environment variables specified in Section 2.
4. Deploy branch (`main` or `production`).

---

## 6. End-to-End Test Payment & Verification Procedures

### Cash on Delivery (COD) Flow
1. Add an item to cart from `/shop`.
2. Proceed to `/checkout`.
3. Fill in or select a delivery address.
4. Select **Cash on Delivery**.
5. Click **Place COD Order**.
6. Verify order confirmation screen and check that:
   - Order appears in `/account/orders` as `pending`.
   - Admin sees order in `/admin/orders` as `pending`.
   - Admin transitions status to `confirmed` (stock decrements once).

### Razorpay Test Mode Flow
1. In development or staging, configure Razorpay test keys (`rzp_test_...`).
2. Add an item to cart and select **Pay Online with Razorpay**.
3. In the Razorpay modal, select **Card** and use Razorpay test card credentials (e.g. standard test cards with any future expiry and CVV).
4. Complete OTP verification in simulator.
5. Verify:
   - Modal closes and redirects to `/account/orders/[id]` with `is_confirmed=true`.
   - Order payment status is `paid` and order status is `confirmed`.
   - Shopping cart is cleared.

---

## 7. Rollback & Disaster Recovery Protocol

1. **Deployment Rollback**:
   - In Vercel, navigate to **Deployments**, locate the last stable deployment, click the **...** menu, and select **Rollback**. Instant zero-downtime rollback is completed in seconds.
2. **Database Point-in-Time Recovery**:
   - Supabase Pro provides Continuous WAL Archiving with Point-in-Time Recovery (PITR).
   - In the event of catastrophic data corruption, navigate to **Database > Backups > Point in Time** in Supabase and restore to a timestamp before the incident.
3. **Trigger & Stock Integrity Check**:
   - In the event of manual order edits, run the following verification query to ensure product stock matches remaining physical inventory:
     ```sql
     SELECT id, name, stock_quantity, sold_count
     FROM products
     ORDER BY updated_at DESC
     LIMIT 20;
     ```
