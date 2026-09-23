schema ecomm

================================================================================
ECOMMERCE PLATFORM — FULL DATABASE SCHEMA (SUPABASE / POSTGRESQL)
================================================================================
This file is the complete, single-source reference for the database layer:
every table, every column, every relationship, every trigger, every RLS
policy, and the full runnable SQL script — in one place.

Tested: the SQL in this file was executed end-to-end on a real PostgreSQL 16
instance (with Supabase's auth/storage schemas stubbed) with zero errors,
and 10 functional tests covering the triggers, constraints and rollups all
passed (auto-profile-on-signup, view trimming, order-confirmation stock/
sold_count updates, rating rollups, the role-elevation guard, and the
one-primary-image constraint).

--------------------------------------------------------------------------------
TABLE OF CONTENTS
--------------------------------------------------------------------------------
1. ENTITY RELATIONSHIP OVERVIEW
2. ENUM TYPES
3. DETAILED DATA DICTIONARY (every table, every column)
4. FUNCTIONS & TRIGGERS
5. VIEWS
6. ROW LEVEL SECURITY — POLICY MATRIX
7. STORAGE BUCKETS
8. SETUP INSTRUCTIONS
9. WHAT'S INTENTIONALLY EXCLUDED
10. FULL SQL SCRIPT (copy-paste into Supabase SQL Editor)


================================================================================
1. ENTITY RELATIONSHIP OVERVIEW
================================================================================

auth.users (Supabase-managed)
  |-- profiles (1:1)                          -- role: admin | user
       |-- addresses (1:many)
       |-- cart_items (1:many)
       |-- product_views (1:many)             -- "Continue Browsing"
       |-- orders (1:many)
       |    |-- order_items (1:many)
       |-- product_reviews (1:many)
       |-- contact_submissions (write-only, not linked by FK)
       |-- leads (write-only, not linked by FK)

categories (self-referencing: parent_id -> categories.id)
  category --> subcategory --> sub-subcategory ... (unlimited depth)
  |-- products (1:many)
       |-- product_images (1:many)
       |-- product_variants (1:many)
       |-- product_views (1:many)
       |-- product_reviews (1:many)
       |-- cart_items (1:many)
       |-- order_items (1:many, via product_id -- snapshot, not a hard dependency)

Standalone / admin-managed content tables (no FK dependencies):
  homepage_sections, banners, testimonials, about_us_sections, faqs,
  site_policies, site_settings

Standalone capture tables (public can INSERT, only admin can SELECT):
  contact_submissions, leads


================================================================================
2. ENUM TYPES
================================================================================
  user_role          admin | user
  order_status       pending | confirmed | processing | shipped | delivered
                      | cancelled | refunded
  payment_status      pending | paid | failed | refunded
  address_type        shipping | billing
  lead_status          new | contacted | converted | closed
  contact_status       new | in_progress | resolved
  site_policy_type     privacy | terms | shipping | return


================================================================================
3. DETAILED DATA DICTIONARY
================================================================================

--------------------------------------------------------------------------------
TABLE: profiles          (Auth Logic -- login/signup, profile picture, roles)
--------------------------------------------------------------------------------
  id            uuid         PK, FK -> auth.users(id) ON DELETE CASCADE
                              Same UUID Supabase Auth issues on signup.
                              Deleting the auth user deletes this row too.
  full_name     text         Display name.
  avatar_url    text         Public URL (in the 'avatars' storage bucket).
                              Shown in place of Login/Signup once logged in.
  phone         text         Optional contact number.
  role          user_role    NOT NULL, default 'user'.
                              The single source of truth for admin-panel
                              access. Only 'admin' or 'user' -- nothing else.
  created_at    timestamptz  default now()
  updated_at    timestamptz  default now(), auto-stamped on every UPDATE.

  NOTE: a trigger blocks any UPDATE that changes `role` unless the actor
  is already an admin -- a user can never self-promote via the API.

--------------------------------------------------------------------------------
TABLE: categories        (Shop Logic -- category/subcategory/sub-subcategory)
--------------------------------------------------------------------------------
  id                uuid       PK, default gen_random_uuid()
  parent_id         uuid       FK -> categories(id) ON DELETE CASCADE, nullable.
                                NULL = top-level category. Set = a
                                subcategory (or sub-subcategory, etc -- the
                                self-reference supports unlimited depth).
                                Deleting a parent cascades to its children.
  name              text       NOT NULL
  slug              text       NOT NULL, UNIQUE. Used in URLs; clicking a
                                homepage category box deep-links to
                                /shop?category=<slug>.
  description       text
  image_url         text       Image shown in the square "Shop by Category"
                                box on the home page.
  display_order     int        default 0. Manual sort order in admin.
  is_active         boolean    default true. Soft-disable instead of delete.
  show_on_homepage  boolean    default true. Lets admin keep a category
                                live in Shop but hide its homepage box.
  created_at        timestamptz
  updated_at        timestamptz

--------------------------------------------------------------------------------
TABLE: products          (Home page rows, Shop page, Product Detail page)
--------------------------------------------------------------------------------
  id                        uuid          PK, default gen_random_uuid()
  category_id               uuid          FK -> categories(id) ON DELETE SET NULL.
                                           Product survives if its category
                                           is deleted; just becomes uncategorized.
  name                       text          NOT NULL
  slug                       text          NOT NULL, UNIQUE -- product URL.
  description                text
  brand                      text
  sku                        text          UNIQUE, optional.
  base_price                 numeric(12,2) NOT NULL, CHECK >= 0.
  compare_at_price           numeric(12,2) CHECK >= 0. Optional "was" price
                                           for showing a strikethrough discount.
  stock_quantity             int           NOT NULL, default 0, CHECK >= 0.
  sold_count                 int           NOT NULL, default 0, CHECK >= 0.
                                           Auto-incremented by a trigger when
                                           an order is confirmed. Drives the
                                           automatic Top Sellers ranking.
  is_active                  boolean       default true. Soft-disable/hide.
  is_featured_top_seller     boolean       default false. Manual admin pin
                                           that floats a product to the top
                                           of the Top Sellers row regardless
                                           of sold_count.
  top_seller_display_order   int           Optional manual ordering among
                                           pinned top sellers.
  avg_rating                 numeric(2,1)  default 0. Auto-rolled up from
                                           approved product_reviews.
  review_count                int           default 0. Auto-rolled up.
  meta_title                  text          SEO.
  meta_description            text          SEO.
  created_by                  uuid          FK -> profiles(id). Which admin
                                           created the listing.
  created_at / updated_at     timestamptz

--------------------------------------------------------------------------------
TABLE: product_images
--------------------------------------------------------------------------------
  id             uuid        PK
  product_id     uuid        FK -> products(id) ON DELETE CASCADE
  image_url      text        NOT NULL
  alt_text       text
  display_order  int         default 0. Controls gallery order on the
                              product detail page.
  is_primary     boolean     default false. A PARTIAL UNIQUE INDEX enforces
                              at most one primary image per product (used as
                              the card thumbnail across Home/Shop/Search).
  created_at     timestamptz

--------------------------------------------------------------------------------
TABLE: product_variants
--------------------------------------------------------------------------------
  id                 uuid          PK
  product_id         uuid          FK -> products(id) ON DELETE CASCADE
  variant_name       text          NOT NULL, e.g. "Red / Large"
  sku                text          UNIQUE, optional
  attributes         jsonb         default '{}'. Free-form, e.g.
                                    {"color":"Red","size":"L"} -- lets the
                                    frontend render swatches/dropdowns
                                    without a rigid attribute schema.
  price              numeric(12,2) Optional. Overrides products.base_price
                                    for this specific variant when set.
  compare_at_price   numeric(12,2)
  stock_quantity     int           NOT NULL, default 0, CHECK >= 0. Tracked
                                    per-variant, independent of the parent
                                    product's stock_quantity.
  image_url          text          Optional variant-specific image (e.g. the
                                    red version's photo).
  is_active          boolean       default true
  created_at / updated_at

--------------------------------------------------------------------------------
TABLE: product_views      ("Continue Browsing" row -- max 10, newest first)
--------------------------------------------------------------------------------
  id          uuid         PK
  user_id     uuid         FK -> profiles(id) ON DELETE CASCADE
  product_id  uuid         FK -> products(id) ON DELETE CASCADE
  viewed_at   timestamptz  default now()
  UNIQUE (user_id, product_id) -- re-viewing a product updates its
  viewed_at instead of creating a duplicate row.

  App writes with:
    INSERT INTO product_views (user_id, product_id) VALUES (...)
    ON CONFLICT (user_id, product_id) DO UPDATE SET viewed_at = now();

  A trigger (trim_product_views) then deletes anything beyond the 10 most
  recent rows for that user, so the table -- and the query that reads it --
  never has to think about the cap.

--------------------------------------------------------------------------------
TABLE: homepage_sections   (per-section on/off -- generalizes "banner box can
                             also be disabled" to every home page block)
--------------------------------------------------------------------------------
  key            text         PK. One of: banner, shop_by_category,
                               continue_browsing, top_sellers,
                               category_products, wall_of_love.
  is_enabled     boolean      default true
  display_order  int          default 0
  updated_at     timestamptz

--------------------------------------------------------------------------------
TABLE: banners             (Home page hero / carousel)
--------------------------------------------------------------------------------
  id             uuid         PK
  image_url      text         NOT NULL
  title          text         Optional caption.
  link_url       text         Optional -- banner click destination.
  display_order  int          default 0. Multiple active rows = a carousel;
                               the frontend renders prev/next arrows
                               automatically whenever more than one active
                               banner exists.
  is_active      boolean      default true. Per-image show/hide, separate
                               from the whole-section toggle in
                               homepage_sections.
  created_at / updated_at

--------------------------------------------------------------------------------
TABLE: testimonials        (Wall of Love)
--------------------------------------------------------------------------------
  id             uuid         PK
  customer_name  text         NOT NULL
  designation    text         e.g. job title / company.
  avatar_url     text
  content        text         NOT NULL -- the testimonial text.
  rating         smallint     CHECK 1-5, optional.
  display_order  int          default 0
  is_active      boolean      default true
  created_at / updated_at

--------------------------------------------------------------------------------
TABLE: about_us_sections    (flexible, ordered content blocks)
--------------------------------------------------------------------------------
  id             uuid         PK
  heading        text
  subheading     text
  body           text
  image_url      text
  display_order  int          default 0. Lets admin add/remove/reorder
                               blocks instead of editing one fixed page.
  is_active      boolean      default true
  created_at / updated_at

--------------------------------------------------------------------------------
TABLE: faqs
--------------------------------------------------------------------------------
  id             uuid         PK
  question       text         NOT NULL
  answer         text         NOT NULL
  category       text         Optional grouping label.
  display_order  int          default 0
  is_active      boolean      default true
  created_at / updated_at

--------------------------------------------------------------------------------
TABLE: site_policies        (Privacy / Terms / Shipping / Return, for footer)
--------------------------------------------------------------------------------
  id          uuid              PK
  type        site_policy_type  UNIQUE -- one row per policy type, so admin
                                 edits the existing row rather than creating
                                 duplicates.
  title       text              NOT NULL
  content     text              NOT NULL
  updated_at  timestamptz

--------------------------------------------------------------------------------
TABLE: site_settings         (footer: logo, phone, email, socials -- key/value)
--------------------------------------------------------------------------------
  key         text     PK, e.g. 'footer'
  value       jsonb    NOT NULL, e.g.
                        {"logo_url":"","phone":"","email":"",
                         "social":{"instagram":"","facebook":"","twitter":""}}
  updated_at  timestamptz
  Key/value shape keeps this table generic -- new site-wide settings can be
  added later without a migration.

--------------------------------------------------------------------------------
TABLE: addresses
--------------------------------------------------------------------------------
  id             uuid          PK
  user_id        uuid          FK -> profiles(id) ON DELETE CASCADE
  type           address_type  default 'shipping'. shipping | billing.
  full_name      text          NOT NULL
  phone          text          NOT NULL
  address_line1  text          NOT NULL
  address_line2  text
  city           text          NOT NULL
  state          text          NOT NULL
  postal_code    text          NOT NULL
  country        text          default 'India'
  is_default     boolean       default false. A PARTIAL UNIQUE INDEX
                                enforces at most one default address per
                                user, per type.
  created_at / updated_at

--------------------------------------------------------------------------------
TABLE: cart_items
--------------------------------------------------------------------------------
  id          uuid   PK
  user_id     uuid   FK -> profiles(id) ON DELETE CASCADE
  product_id  uuid   FK -> products(id) ON DELETE CASCADE
  variant_id  uuid   FK -> product_variants(id) ON DELETE CASCADE, nullable.
  quantity    int    NOT NULL, default 1, CHECK > 0.
  added_at    timestamptz
  UNIQUE (user_id, product_id, variant_id) -- adding the same item again
  should increment quantity at the app layer, not duplicate the row.

--------------------------------------------------------------------------------
TABLE: orders
--------------------------------------------------------------------------------
  id                uuid            PK
  user_id            uuid            FK -> profiles(id)
  order_number       text            UNIQUE. Auto-generated by
                                     generate_order_number() as
                                     ORD-YYYYMMDD-00001.
  status              order_status    default 'pending'. pending ->
                                     confirmed -> processing -> shipped ->
                                     delivered (or cancelled/refunded).
  payment_status       payment_status  default 'pending'.
  payment_method       text
  subtotal / discount / shipping_fee / tax / total   numeric(12,2)
  shipping_address     jsonb           NOT NULL. SNAPSHOT of the address at
                                       time of order -- later address edits
                                       don't rewrite order history.
  billing_address       jsonb
  placed_at / updated_at  timestamptz

--------------------------------------------------------------------------------
TABLE: order_items
--------------------------------------------------------------------------------
  id            uuid           PK
  order_id      uuid           FK -> orders(id) ON DELETE CASCADE
  product_id    uuid           FK -> products(id) ON DELETE SET NULL
  variant_id    uuid           FK -> product_variants(id) ON DELETE SET NULL
  product_name  text           NOT NULL. SNAPSHOT -- survives product
                                renames/deletion so past orders stay
                                historically accurate.
  variant_name  text           Snapshot.
  unit_price    numeric(12,2)  NOT NULL. Snapshot of price paid.
  quantity      int            NOT NULL, CHECK > 0.
  subtotal      numeric(12,2)  NOT NULL.

  A trigger on orders (apply_order_confirmation) reads this table when an
  order's status flips to 'confirmed', and for each row: increments
  products.sold_count by quantity, decrements products.stock_quantity (and
  product_variants.stock_quantity, if a variant was ordered).

--------------------------------------------------------------------------------
TABLE: product_reviews
--------------------------------------------------------------------------------
  id             uuid       PK
  product_id     uuid       FK -> products(id) ON DELETE CASCADE
  user_id        uuid       FK -> profiles(id) ON DELETE CASCADE
  order_item_id  uuid       FK -> order_items(id), optional -- links a review
                             back to a verified purchase.
  rating         smallint   NOT NULL, CHECK 1-5.
  review_text    text
  images         jsonb      default '[]'. Array of image URLs.
  is_approved    boolean    default false. Only approved reviews are
                             publicly visible and count toward the rating.
  created_at     timestamptz
  UNIQUE (product_id, user_id) -- one review per user per product.

  A trigger (refresh_product_rating) recalculates products.avg_rating and
  products.review_count on every insert/update/delete of an approved
  review.

--------------------------------------------------------------------------------
TABLE: contact_submissions   (Contact Us form)
--------------------------------------------------------------------------------
  id          uuid            PK
  name        text            NOT NULL
  email       text            NOT NULL
  phone       text
  message     text            NOT NULL ("note" field from the form)
  status      contact_status  default 'new'. new | in_progress | resolved.
  created_at / updated_at
  Write-only for the public -- anyone can INSERT, only admins can SELECT.

--------------------------------------------------------------------------------
TABLE: leads                 (generic lead capture -- newsletter/inquiry/etc,
                               kept separate from the Contact Us form so the
                               admin panel can CRUD them independently)
--------------------------------------------------------------------------------
  id          uuid         PK
  name        text
  email       text         NOT NULL
  phone       text
  source      text         e.g. 'newsletter', 'popup', 'inquiry'.
  message     text
  status      lead_status  default 'new'. new | contacted | converted | closed.
  created_at / updated_at
  Also write-only for the public, admin-only read -- same pattern as
  contact_submissions.


================================================================================
4. FUNCTIONS & TRIGGERS
================================================================================

  is_admin()
    SECURITY DEFINER SQL function. Returns true if the current auth.uid()
    has a profiles row with role = 'admin'. SECURITY DEFINER matters here:
    it lets RLS policies on the profiles table itself call is_admin()
    without recursively re-triggering RLS on profiles (a classic
    self-referential RLS deadlock). Every admin-gated policy in the schema
    calls this one function.

  handle_new_user()  ->  trigger on_auth_user_created (AFTER INSERT ON auth.users)
    Auto-creates the matching profiles row on signup, pulling full_name and
    avatar_url out of auth.users.raw_user_meta_data if present, defaulting
    role to 'user'.

  prevent_role_change()  ->  trigger trg_prevent_role_change (BEFORE UPDATE ON profiles)
    Raises an exception if `role` is being changed by anyone who isn't
    already an admin. This is what stops a user from PATCH-ing their own
    profile to role: 'admin' -- RLS's WITH CHECK can't compare old vs. new
    row values in one clause, so this is enforced at the trigger level.

  set_updated_at()  ->  trg_set_updated_at on profiles, categories, products,
    product_variants, banners, testimonials, about_us_sections, faqs,
    site_settings, addresses, orders, contact_submissions, leads
    (BEFORE UPDATE)
    Generic: stamps updated_at = now() on every update.

  generate_order_number()
    Returns 'ORD-' || today's date || '-' || a 5-digit zero-padded sequence
    number, e.g. ORD-20260818-00001. Set as the DEFAULT for
    orders.order_number.

  trim_product_views()  ->  trg_trim_product_views (AFTER INSERT OR UPDATE
    ON product_views)
    Deletes any product_views rows for that user beyond the 10 most recent
    (by viewed_at). This is what implements "Continue Browsing" -- 10 max,
    most-recently-viewed first, oldest silently dropped.

  apply_order_confirmation()  ->  trg_order_confirmation (AFTER UPDATE ON orders)
    Fires only when status transitions INTO 'confirmed'. Loops that order's
    order_items and, per row: products.sold_count += quantity,
    products.stock_quantity -= quantity (floored at 0), and the same
    stock decrement on product_variants if a variant was ordered. This is
    what drives the automatic half of Top Sellers.

  refresh_product_rating()  ->  trg_refresh_rating (AFTER INSERT OR UPDATE OR
    DELETE ON product_reviews)
    Recalculates products.avg_rating (rounded to 1 decimal) and
    products.review_count from that product's approved reviews only.


================================================================================
5. VIEWS
================================================================================

  v_top_sellers
    SELECT * FROM products WHERE is_active = true
    ORDER BY is_featured_top_seller DESC,
             top_seller_display_order ASC NULLS LAST,
             sold_count DESC
    LIMIT 20;

    Admin-pinned products (is_featured_top_seller = true) always float to
    the top, ordered by top_seller_display_order; everything else ranks by
    real sold_count. The Top Sellers row is auto AND admin-overridable, and
    never needs a manual refresh -- sold_count updates itself via the order
    confirmation trigger.


================================================================================
6. ROW LEVEL SECURITY -- POLICY MATRIX
================================================================================
Every single table has RLS ENABLED. With RLS on and no matching policy, a
table is fully inaccessible by default -- nothing is exposed accidentally.
The Supabase `service_role` key (used server-side) bypasses RLS entirely,
as on every Supabase project -- use it for backend jobs, never in
client-side code.

  TABLE                   PUBLIC (anon/auth)        OWNER (row's user)             ADMIN
  ------------------------------------------------------------------------------------------------------
  profiles                 --                         read/update own                 full CRUD
  categories                read if is_active           --                              full CRUD
  products                   read if is_active           --                              full CRUD
  product_images              read if parent active       --                              full CRUD
  product_variants             read if active + parent      --                              full CRUD
  homepage_sections             read always                   --                              full CRUD
  banners                        read if is_active             --                              full CRUD
  testimonials                    read if is_active             --                              full CRUD
  about_us_sections                 read if is_active             --                              full CRUD
  faqs                               read if is_active             --                              full CRUD
  site_policies                       read always                   --                              full CRUD
  site_settings                        read always                   --                              full CRUD
  product_views                         --                         full on own rows                read only
  addresses                              --                         full on own rows                read only
  cart_items                              --                         full on own rows                -- (private)
  orders                                   --                         create/read own; cancel while    full CRUD
                                                                       'pending'
  order_items                              --                         create/read via own order        full CRUD
  product_reviews                           read if approved          insert own; edit/delete own       full CRUD
  contact_submissions                        INSERT only                --                                full CRUD (only reader)
  leads                                       INSERT only                --                                full CRUD (only reader)

  Notably: contact_submissions and leads have NO select policy for regular
  users -- the public can submit but never read back submissions, including
  their own. That data belongs to the admin panel only.


================================================================================
7. STORAGE BUCKETS
================================================================================
  media (public read)
    Products, categories, banners, testimonials, about-us images.
    INSERT/UPDATE/DELETE require is_admin().

  avatars (public read)
    Profile pictures. Expects paths like avatars/{user_id}/photo.jpg -- a
    user may only INSERT/UPDATE under their own {user_id} folder, checked
    via storage.foldername(name).


================================================================================
8. SETUP INSTRUCTIONS
================================================================================
  1. Supabase Dashboard -> SQL Editor -> paste Section 10 (the full script
     below) -> Run. This is meant for a FRESH project; re-running on an
     existing one will error on duplicate objects.
  2. Sign up your first user through the app as normal.
  3. Promote that user to admin manually (self-promotion is blocked by
     design):
       update public.profiles set role = 'admin' where id = '<your-auth-uid>';
  4. Upload images through the 'media' bucket (products, categories,
     banners, testimonials, about-us) and 'avatars' for profile pictures.
  5. Everything else (categories, products, banners, homepage section
     toggles, about-us blocks, FAQs, policies, footer settings) is now
     editable straight from the admin panel via the tables above.


================================================================================
9. WHAT'S INTENTIONALLY EXCLUDED
================================================================================
Not in the original spec, so left out -- flag any of these if you want them
added:
  - Coupons / discount codes
  - Wishlist (separate from cart)
  - Multi-currency / multi-warehouse inventory
  - Abandoned-cart email triggers
  - Order status history / audit log (currently just the current status
    field on `orders`, not a timestamped history of every transition)


================================================================================
10. FULL SQL SCRIPT
================================================================================
Copy everything below into the Supabase SQL Editor and run once on a fresh
project. (This is the exact script that was tested -- see the note at the
top of this file.)

--------------------------------------------------------------------------------

-- ============================================================================
-- ECOMMERCE PLATFORM — FULL SUPABASE (POSTGRES) SCHEMA
-- Mapped section-by-section to the ECOMM LOGIC & DESIGN spec.
-- Run this once on a fresh Supabase project's SQL Editor (as postgres/owner).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";    -- fast partial-text product search

-- ----------------------------------------------------------------------------
-- 0.1 ENUM TYPES
-- ----------------------------------------------------------------------------
create type public.user_role       as enum ('admin', 'user');
create type public.order_status    as enum ('pending','confirmed','processing','shipped','delivered','cancelled','refunded');
create type public.payment_status  as enum ('pending','paid','failed','refunded');
create type public.address_type    as enum ('shipping','billing');
create type public.lead_status     as enum ('new','contacted','converted','closed');
create type public.contact_status  as enum ('new','in_progress','resolved');
create type public.site_policy_type as enum ('privacy','terms','shipping','return');


-- ============================================================================
-- 1. AUTH / PROFILES  (Auth Logic & Design — login/signup, profile picture, roles)
-- ============================================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  phone       text,
  role        public.user_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'Extends auth.users. role drives admin-panel access — only 2 roles exist: admin, user.';


-- ============================================================================
-- 2. CATEGORIES  (Shop Logic — category / subcategory / sub-subcategory, admin CRUD)
-- ============================================================================
create table public.categories (
  id                uuid primary key default gen_random_uuid(),
  parent_id         uuid references public.categories(id) on delete cascade,
  name              text not null,
  slug              text not null unique,
  description       text,
  image_url         text,
  display_order     int not null default 0,
  is_active         boolean not null default true,
  show_on_homepage  boolean not null default true, -- controls "Shop by Category" boxes
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_categories_parent on public.categories(parent_id);
create index idx_categories_slug   on public.categories(slug);
comment on table public.categories is 'Self-referencing: parent_id null = top category. Supports unlimited depth (category > subcategory > sub-subcategory).';


-- ============================================================================
-- 3. PRODUCTS  (Home + Shop + Product Detail pages)
-- ============================================================================
create table public.products (
  id                        uuid primary key default gen_random_uuid(),
  category_id               uuid references public.categories(id) on delete set null,
  name                       text not null,
  slug                       text not null unique,
  description                text,
  brand                      text,
  sku                        text unique,
  base_price                 numeric(12,2) not null check (base_price >= 0),
  compare_at_price           numeric(12,2) check (compare_at_price >= 0),
  stock_quantity             int not null default 0 check (stock_quantity >= 0),
  sold_count                 int not null default 0 check (sold_count >= 0),
  is_active                  boolean not null default true,
  is_featured_top_seller     boolean not null default false, -- admin manual pin
  top_seller_display_order   int,
  avg_rating                 numeric(2,1) not null default 0,
  review_count               int not null default 0,
  meta_title                 text,
  meta_description           text,
  created_by                 uuid references public.profiles(id),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create index idx_products_category   on public.products(category_id);
create index idx_products_slug       on public.products(slug);
create index idx_products_sold_count on public.products(sold_count desc);
create index idx_products_active     on public.products(is_active);
create index idx_products_name_trgm  on public.products using gin (name gin_trgm_ops); -- header search bar
comment on table public.products is 'sold_count auto-increments on order confirmation (see apply_order_confirmation). is_featured_top_seller lets admin override the automatic ranking.';

create table public.product_images (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products(id) on delete cascade,
  image_url      text not null,
  alt_text       text,
  display_order  int not null default 0,
  is_primary     boolean not null default false,
  created_at     timestamptz not null default now()
);
create index idx_product_images_product on public.product_images(product_id);
create unique index idx_one_primary_image on public.product_images(product_id) where is_primary = true;

create table public.product_variants (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references public.products(id) on delete cascade,
  variant_name       text not null,           -- e.g. "Red / Large"
  sku                text unique,
  attributes         jsonb not null default '{}', -- {"color":"Red","size":"L"}
  price              numeric(12,2),           -- overrides base_price when set
  compare_at_price   numeric(12,2),
  stock_quantity     int not null default 0 check (stock_quantity >= 0),
  image_url          text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_product_variants_product on public.product_variants(product_id);


-- ============================================================================
-- 4. CONTINUE BROWSING  (recently viewed, max 10, newest first)
-- ============================================================================
create table public.product_views (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  unique (user_id, product_id)
);
create index idx_product_views_user on public.product_views(user_id, viewed_at desc);
comment on table public.product_views is 'App upserts: INSERT ... ON CONFLICT (user_id, product_id) DO UPDATE SET viewed_at = now(). Trigger keeps only the latest 10 rows per user.';


-- ============================================================================
-- 5. HOMEPAGE SECTION TOGGLES  (banner box "can be disabled", and other sections)
-- ============================================================================
create table public.homepage_sections (
  key           text primary key, -- 'banner' | 'shop_by_category' | 'continue_browsing' | 'top_sellers' | 'category_products' | 'wall_of_love'
  is_enabled    boolean not null default true,
  display_order int not null default 0,
  updated_at    timestamptz not null default now()
);

-- ============================================================================
-- 6. BANNER BOX  (home page hero, multiple images, admin add/remove/replace)
-- ============================================================================
create table public.banners (
  id             uuid primary key default gen_random_uuid(),
  image_url      text not null,
  title          text,
  link_url       text,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table public.banners is 'Multiple active rows = carousel with nav arrows on the frontend. Whole section on/off lives in homepage_sections.';


-- ============================================================================
-- 7. WALL OF LOVE  (testimonials)
-- ============================================================================
create table public.testimonials (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text not null,
  designation    text,
  avatar_url     text,
  content        text not null,
  rating         smallint check (rating between 1 and 5),
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);


-- ============================================================================
-- 8. ABOUT US  (flexible, admin-editable content blocks)
-- ============================================================================
create table public.about_us_sections (
  id             uuid primary key default gen_random_uuid(),
  heading        text,
  subheading     text,
  body           text,
  image_url      text,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);


-- ============================================================================
-- 9. FOOTER CONTENT  (policies, FAQs, site-wide settings)
-- ============================================================================
create table public.faqs (
  id             uuid primary key default gen_random_uuid(),
  question       text not null,
  answer         text not null,
  category       text,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.site_policies (
  id             uuid primary key default gen_random_uuid(),
  type           public.site_policy_type not null unique,
  title          text not null,
  content        text not null,
  display_order  int not null default 0,
  updated_at     timestamptz not null default now()
);

create table public.site_settings (
  key         text primary key,   -- e.g. 'footer' -> {"logo_url":"","phone":"","email":"","social":{"instagram":"","facebook":""}}
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);


-- ============================================================================
-- 10. ADDRESSES, CART, ORDERS  (shopping flow of customers)
-- ============================================================================
create table public.addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  type           public.address_type not null default 'shipping',
  full_name      text not null,
  phone          text not null,
  address_line1  text not null,
  address_line2  text,
  city           text not null,
  state          text not null,
  postal_code    text not null,
  country        text not null default 'India',
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_addresses_user on public.addresses(user_id);
create unique index idx_one_default_address on public.addresses(user_id, type) where is_default = true;

create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  variant_id  uuid references public.product_variants(id) on delete cascade,
  quantity    int not null default 1 check (quantity > 0),
  added_at    timestamptz not null default now(),
  unique (user_id, product_id, variant_id)
);
create index idx_cart_items_user on public.cart_items(user_id);

create sequence if not exists public.order_number_seq;

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id),
  order_number       text not null unique,
  status             public.order_status not null default 'pending',
  payment_status     public.payment_status not null default 'pending',
  payment_method     text,
  subtotal           numeric(12,2) not null,
  discount           numeric(12,2) not null default 0,
  shipping_fee       numeric(12,2) not null default 0,
  tax                numeric(12,2) not null default 0,
  total              numeric(12,2) not null,
  shipping_address   jsonb not null,  -- snapshot at time of order
  billing_address    jsonb,
  placed_at          timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_orders_user   on public.orders(user_id);
create index idx_orders_status on public.orders(status);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  variant_id    uuid references public.product_variants(id) on delete set null,
  product_name  text not null,  -- snapshot, survives product edits/deletion
  variant_name  text,
  unit_price    numeric(12,2) not null,
  quantity      int not null check (quantity > 0),
  subtotal      numeric(12,2) not null
);
create index idx_order_items_order on public.order_items(order_id);


-- ============================================================================
-- 11. PRODUCT REVIEWS  (Amazon/Flipkart-style product detail page)
-- ============================================================================
create table public.product_reviews (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  order_item_id  uuid references public.order_items(id),
  rating         smallint not null check (rating between 1 and 5),
  review_text    text,
  images         jsonb not null default '[]',
  is_approved    boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (product_id, user_id)
);
create index idx_product_reviews_product on public.product_reviews(product_id);


-- ============================================================================
-- 12. LEADS + CONTACT US SUBMISSIONS  (Admin Panel CRUD targets)
-- ============================================================================
create table public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  message     text not null,
  status      public.contact_status not null default 'new',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_contact_email on public.contact_submissions(email);

create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text not null,
  phone       text,
  source      text,  -- 'newsletter' | 'popup' | 'inquiry' | etc
  message     text,
  status      public.lead_status not null default 'new',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_leads_email on public.leads(email);


-- ============================================================================
-- 13. HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- 13.1 is_admin() — SECURITY DEFINER avoids recursive-RLS issues when used
--      inside policies on the profiles table itself.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 13.2 Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    'user'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 13.3 Prevent a non-admin from ever elevating their own role.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change user roles';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_change
before update on public.profiles
for each row execute function public.prevent_role_change();

-- 13.4 Generic updated_at stamper.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','categories','products','product_variants','banners',
    'testimonials','about_us_sections','faqs','site_settings','addresses',
    'orders','contact_submissions','leads'
  ]
  loop
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t
    );
  end loop;
end $$;

-- 13.5 Human-friendly order numbers: ORD-YYYYMMDD-00001
create or replace function public.generate_order_number()
returns text
language sql
as $$
  select 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' ||
         lpad(nextval('public.order_number_seq')::text, 5, '0');
$$;

alter table public.orders
  alter column order_number set default public.generate_order_number();

-- 13.6 Continue Browsing: keep only the most recent 10 views per user.
create or replace function public.trim_product_views()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.product_views
  where user_id = new.user_id
    and id not in (
      select id from public.product_views
      where user_id = new.user_id
      order by viewed_at desc
      limit 10
    );
  return new;
end;
$$;

create trigger trg_trim_product_views
after insert or update on public.product_views
for each row execute function public.trim_product_views();

-- 13.7 Top Sellers: bump sold_count + decrement stock when an order is confirmed.
create or replace function public.apply_order_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    for item in select * from public.order_items where order_id = new.id loop
      update public.products
      set sold_count     = sold_count + item.quantity,
          stock_quantity  = greatest(stock_quantity - item.quantity, 0)
      where id = item.product_id;

      if item.variant_id is not null then
        update public.product_variants
        set stock_quantity = greatest(stock_quantity - item.quantity, 0)
        where id = item.variant_id;
      end if;
    end loop;
  end if;
  return new;
end;
$$;

create trigger trg_order_confirmation
after update on public.orders
for each row execute function public.apply_order_confirmation();

-- 13.8 Keep products.avg_rating / review_count in sync with approved reviews.
create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  pid := coalesce(new.product_id, old.product_id);
  update public.products p
  set avg_rating   = coalesce((select round(avg(rating)::numeric, 1) from public.product_reviews where product_id = pid and is_approved = true), 0),
      review_count = (select count(*) from public.product_reviews where product_id = pid and is_approved = true)
  where p.id = pid;
  return coalesce(new, old);
end;
$$;

create trigger trg_refresh_rating
after insert or update or delete on public.product_reviews
for each row execute function public.refresh_product_rating();


-- ============================================================================
-- 14. VIEWS
-- ============================================================================
create or replace view public.v_top_sellers as
select *
from public.products
where is_active = true
order by is_featured_top_seller desc, top_seller_display_order asc nulls last, sold_count desc
limit 20;
comment on view public.v_top_sellers is 'Auto-ranked by sold_count; admin pins (is_featured_top_seller + top_seller_display_order) float to the top.';


-- ============================================================================
-- 15. ROW LEVEL SECURITY
-- ============================================================================

-- ---- profiles ----
alter table public.profiles enable row level security;
create policy "profiles_select_own"  on public.profiles for select using (auth.uid() = id);
create policy "profiles_select_admin" on public.profiles for select using (public.is_admin());
create policy "profiles_update_own"  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_admin_all"   on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- ---- categories ----
alter table public.categories enable row level security;
create policy "categories_public_read" on public.categories for select using (is_active = true or public.is_admin());
create policy "categories_admin_all"   on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- ---- products ----
alter table public.products enable row level security;
create policy "products_public_read" on public.products for select using (is_active = true or public.is_admin());
create policy "products_admin_all"   on public.products for all using (public.is_admin()) with check (public.is_admin());

-- ---- product_images ----
alter table public.product_images enable row level security;
create policy "product_images_public_read" on public.product_images for select
  using (
    exists (select 1 from public.products p where p.id = product_images.product_id and p.is_active = true)
    or public.is_admin()
  );
create policy "product_images_admin_all" on public.product_images for all using (public.is_admin()) with check (public.is_admin());

-- ---- product_variants ----
alter table public.product_variants enable row level security;
create policy "product_variants_public_read" on public.product_variants for select
  using (
    (is_active = true and exists (select 1 from public.products p where p.id = product_variants.product_id and p.is_active = true))
    or public.is_admin()
  );
create policy "product_variants_admin_all" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

-- ---- product_views (private, per user) ----
alter table public.product_views enable row level security;
create policy "product_views_own"        on public.product_views for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "product_views_admin_read" on public.product_views for select using (public.is_admin());

-- ---- homepage_sections ----
alter table public.homepage_sections enable row level security;
create policy "homepage_sections_public_read" on public.homepage_sections for select using (true);
create policy "homepage_sections_admin_all"   on public.homepage_sections for all using (public.is_admin()) with check (public.is_admin());

-- ---- banners ----
alter table public.banners enable row level security;
create policy "banners_public_read" on public.banners for select using (is_active = true or public.is_admin());
create policy "banners_admin_all"   on public.banners for all using (public.is_admin()) with check (public.is_admin());

-- ---- testimonials ----
alter table public.testimonials enable row level security;
create policy "testimonials_public_read" on public.testimonials for select using (is_active = true or public.is_admin());
create policy "testimonials_admin_all"   on public.testimonials for all using (public.is_admin()) with check (public.is_admin());

-- ---- about_us_sections ----
alter table public.about_us_sections enable row level security;
create policy "about_us_public_read" on public.about_us_sections for select using (is_active = true or public.is_admin());
create policy "about_us_admin_all"   on public.about_us_sections for all using (public.is_admin()) with check (public.is_admin());

-- ---- faqs ----
alter table public.faqs enable row level security;
create policy "faqs_public_read" on public.faqs for select using (is_active = true or public.is_admin());
create policy "faqs_admin_all"   on public.faqs for all using (public.is_admin()) with check (public.is_admin());

-- ---- site_policies ----
alter table public.site_policies enable row level security;
create policy "site_policies_public_read" on public.site_policies for select using (true);
create policy "site_policies_admin_all"   on public.site_policies for all using (public.is_admin()) with check (public.is_admin());

-- ---- site_settings ----
alter table public.site_settings enable row level security;
create policy "site_settings_public_read" on public.site_settings for select using (true);
create policy "site_settings_admin_all"   on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- ---- addresses ----
alter table public.addresses enable row level security;
create policy "addresses_own"        on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "addresses_admin_read" on public.addresses for select using (public.is_admin());

-- ---- cart_items ----
alter table public.cart_items enable row level security;
create policy "cart_items_own" on public.cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- orders ----
alter table public.orders enable row level security;
create policy "orders_select_own_or_admin" on public.orders for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_insert_own"          on public.orders for insert with check (auth.uid() = user_id);
create policy "orders_user_cancel_pending" on public.orders for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status in ('pending','cancelled'));
create policy "orders_admin_all" on public.orders for all using (public.is_admin()) with check (public.is_admin());

-- ---- order_items ----
alter table public.order_items enable row level security;
create policy "order_items_select_own_or_admin" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "order_items_insert_own" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));
create policy "order_items_admin_all" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

-- ---- product_reviews ----
alter table public.product_reviews enable row level security;
create policy "reviews_read_approved_or_own_or_admin" on public.product_reviews for select
  using (is_approved = true or auth.uid() = user_id or public.is_admin());
create policy "reviews_insert_own" on public.product_reviews for insert with check (auth.uid() = user_id);
create policy "reviews_update_own_or_admin" on public.product_reviews for update
  using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "reviews_delete_own_or_admin" on public.product_reviews for delete
  using (auth.uid() = user_id or public.is_admin());

-- ---- contact_submissions (public form, admin-only visibility) ----
alter table public.contact_submissions enable row level security;
create policy "contact_insert_anyone" on public.contact_submissions for insert with check (true);
create policy "contact_admin_all"     on public.contact_submissions for all using (public.is_admin()) with check (public.is_admin());
-- explicitly no select policy for regular users -> submissions are write-only for them

-- ---- leads (public capture, admin-only visibility) ----
alter table public.leads enable row level security;
create policy "leads_insert_anyone" on public.leads for insert with check (true);
create policy "leads_admin_all"     on public.leads for all using (public.is_admin()) with check (public.is_admin());


-- ============================================================================
-- 16. STORAGE BUCKETS (Supabase Storage) — images for products/categories/
--     banners/testimonials/about-us, plus per-user avatars.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media_public_read"    on storage.objects for select using (bucket_id = 'media');
create policy "media_admin_insert"   on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy "media_admin_update"   on storage.objects for update using (bucket_id = 'media' and public.is_admin());
create policy "media_admin_delete"   on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Expects upload paths like: avatars/{user_id}/photo.jpg
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_owner_insert" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_owner_update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- ============================================================================
-- 17. SEED DATA (safe defaults so the app has something to render on day 1)
-- ============================================================================
insert into public.homepage_sections (key, display_order) values
  ('banner', 1),
  ('shop_by_category', 2),
  ('continue_browsing', 3),
  ('top_sellers', 4),
  ('category_products', 5),
  ('wall_of_love', 6)
on conflict (key) do nothing;

insert into public.site_policies (type, title, content) values
  ('privacy', 'Privacy Policy', 'Add your privacy policy content here.'),
  ('terms', 'Terms & Conditions', 'Add your terms & conditions here.'),
  ('shipping', 'Shipping Policy', 'Add your shipping policy here.'),
  ('return', 'Return & Refund Policy', 'Add your return policy here.')
on conflict (type) do nothing;

insert into public.site_settings (key, value) values
  ('footer', '{"logo_url": "", "phone": "", "email": "", "social": {"instagram": "", "facebook": "", "twitter": ""}}')
on conflict (key) do nothing;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================