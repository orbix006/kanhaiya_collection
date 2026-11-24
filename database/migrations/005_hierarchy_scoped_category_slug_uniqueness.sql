-- =====================================================================
-- Migration: 005_hierarchy_scoped_category_slug_uniqueness.sql
-- Description: Scopes category slug and name uniqueness to the hierarchy (parent_id)
-- so the same category/subcategory/sub-subcategory name & slug can coexist
-- under DIFFERENT parent categories (e.g. Poshak > Laddu Gopal > Hand Work Poshak
-- and Poshak > Radhe Krishna > Hand Work Poshak).
-- =====================================================================

begin;

-- 1. Drop existing global unique constraints/indexes on categories.slug
alter table public.categories drop constraint if exists categories_slug_key;
drop index if exists public.categories_slug_idx;
drop index if exists public.idx_categories_slug;

-- 2. Create composite unique index on (parent_id, lower(slug))
-- Coalescing parent_id to '00000000-0000-0000-0000-000000000000' ensures root categories (parent_id IS NULL)
-- are unique among root categories, and subcategories/sub-subcategories are unique within their specific parent.
create unique index if not exists categories_unique_slug_per_parent
  on public.categories (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(slug));

-- 3. Ensure composite unique index on (parent_id, lower(name)) exists
create unique index if not exists categories_unique_name_per_parent
  on public.categories (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

-- 4. Fast non-unique lookup index on slug for query performance
create index if not exists idx_categories_slug on public.categories(slug);

commit;
