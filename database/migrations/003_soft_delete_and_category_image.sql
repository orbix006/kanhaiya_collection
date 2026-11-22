-- =============================================================================
-- Migration: Additive Soft Delete (deleted_at) and Category Image Fields
-- Tables: public.products, public.categories, public.announcements, public.festive_campaigns
-- =============================================================================

-- 1. Add deleted_at to products
alter table public.products
  add column if not exists deleted_at timestamptz default null;

create index if not exists idx_products_deleted_at on public.products(deleted_at);

-- 2. Add deleted_at, image_url, and image_path to categories
alter table public.categories
  add column if not exists deleted_at timestamptz default null,
  add column if not exists image_url text default null,
  add column if not exists image_path text default null;

create index if not exists idx_categories_deleted_at on public.categories(deleted_at);

-- 3. Add deleted_at to announcements
alter table public.announcements
  add column if not exists deleted_at timestamptz default null;

create index if not exists idx_announcements_deleted_at on public.announcements(deleted_at);

-- 4. Add deleted_at to festive_campaigns
alter table public.festive_campaigns
  add column if not exists deleted_at timestamptz default null;

create index if not exists idx_festive_campaigns_deleted_at on public.festive_campaigns(deleted_at);

-- 5. Updated admin_delete_product function to soft-delete
create or replace function public.admin_delete_product(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_prod public.products;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  update public.products
     set is_active = false,
         deleted_at = coalesce(deleted_at, now())
   where id = p_id
  returning * into v_prod;

  if not found then
    raise exception 'Product not found';
  end if;

  return jsonb_build_object('deleted', true, 'soft_deleted', true, 'id', p_id);
end $$;
