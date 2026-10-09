-- Migration: 002_cms_policies_order.sql
-- Add display_order to public.site_policies table for custom policy ordering

alter table public.site_policies
  add column if not exists display_order int not null default 0;

-- Set initial default sequence
update public.site_policies set display_order = 1 where type = 'privacy' and display_order = 0;
update public.site_policies set display_order = 2 where type = 'terms' and display_order = 0;
update public.site_policies set display_order = 3 where type = 'shipping' and display_order = 0;
update public.site_policies set display_order = 4 where type = 'return' and display_order = 0;
