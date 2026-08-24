-- Migration: 001_razorpay_fields.sql
-- Add Razorpay payment fields to public.orders table

alter table public.orders
  add column razorpay_order_id text,
  add column razorpay_payment_id text,
  add column razorpay_signature text;
