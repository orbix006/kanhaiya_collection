"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { CartSummary, CartItemWithDetails } from "@/lib/data/cart";
import {
  updateCartQuantityAction,
  removeCartItemAction,
  clearCartAction,
} from "@/app/(public)/cart/actions";

interface CartViewProps {
  initialCart: CartSummary;
}

export function CartView({ initialCart }: CartViewProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartSummary>(initialCart);
  const [isPending, startTransition] = useTransition();
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dispatchCartEvent = (newCount: number) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cart:updated", { detail: { count: newCount } })
      );
    }
  };

  const handleUpdateQuantity = (item: CartItemWithDetails, newQty: number) => {
    if (newQty < 1 || newQty > item.available_stock) return;
    setBusyItemId(item.id);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await updateCartQuantityAction({
        cartItemId: item.id,
        quantity: newQty,
      });

      setBusyItemId(null);
      if (res?.error) {
        setErrorMessage(res.error);
      } else if (res?.success) {
        dispatchCartEvent(res.newCartCount);
        // Optimistically update local cart
        setCart((prev) => {
          const updatedItems = prev.items.map((it) => {
            if (it.id === item.id) {
              const subtotal = it.unit_price * newQty;
              return {
                ...it,
                quantity: newQty,
                subtotal,
                exceeds_stock: newQty > it.available_stock,
              };
            }
            return it;
          });

          const subtotal = updatedItems.reduce((acc, it) => acc + it.subtotal, 0);
          const shipping_fee = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
          const total = subtotal + shipping_fee;

          return {
            ...prev,
            items: updatedItems,
            item_count: updatedItems.reduce((acc, it) => acc + it.quantity, 0),
            subtotal,
            shipping_fee,
            total,
            amount_for_free_shipping: Math.max(0, 1999 - subtotal),
            has_stock_exceeded: updatedItems.some((it) => it.exceeds_stock),
          };
        });
        router.refresh();
      }
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setBusyItemId(itemId);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await removeCartItemAction(itemId);
      setBusyItemId(null);

      if (res?.error) {
        setErrorMessage(res.error);
      } else if (res?.success) {
        dispatchCartEvent(res.newCartCount);
        setCart((prev) => {
          const updatedItems = prev.items.filter((it) => it.id !== itemId);
          const subtotal = updatedItems.reduce((acc, it) => acc + it.subtotal, 0);
          const shipping_fee = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
          const total = subtotal + shipping_fee;

          return {
            ...prev,
            items: updatedItems,
            item_count: updatedItems.reduce((acc, it) => acc + it.quantity, 0),
            distinct_count: updatedItems.length,
            subtotal,
            shipping_fee,
            total,
            amount_for_free_shipping: Math.max(0, 1999 - subtotal),
            has_out_of_stock: updatedItems.some((it) => it.is_out_of_stock),
            has_stock_exceeded: updatedItems.some((it) => it.exceeds_stock),
          };
        });
        router.refresh();
      }
    });
  };

  const handleClearCart = () => {
    if (!confirm("Are you sure you want to empty your shopping cart?")) return;
    setErrorMessage(null);

    startTransition(async () => {
      const res = await clearCartAction();
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        dispatchCartEvent(0);
        setCart({
          items: [],
          item_count: 0,
          distinct_count: 0,
          subtotal: 0,
          shipping_fee: 0,
          discount: 0,
          tax: 0,
          total: 0,
          has_out_of_stock: false,
          has_stock_exceeded: false,
          free_shipping_threshold: 1999,
          amount_for_free_shipping: 1999,
        });
        router.refresh();
      }
    });
  };

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 sm:py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 shadow-xs">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Your Shopping Bag is Empty
        </h1>
        <p className="mt-3 text-base text-muted-foreground max-w-md mx-auto">
          Explore our handcrafted textiles, bespoke menswear, and royal sarees to find something extraordinary.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02]"
          >
            <span>Explore Collections</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/shop?sort=featured"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <span>View Top Sellers</span>
          </Link>
        </div>
      </div>
    );
  }

  const freeShippingProgress = Math.min(
    100,
    Math.round((cart.subtotal / cart.free_shipping_threshold) * 100)
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      {/* Title & Micro Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <span>Shopping Bag</span>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {cart.item_count} {cart.item_count === 1 ? "item" : "items"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Carefully curated pieces reserved in your authenticated bag.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearCart}
          disabled={isPending}
          className="self-start sm:self-auto text-xs font-semibold text-muted-foreground hover:text-destructive flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/80 hover:border-destructive/30 hover:bg-destructive/5 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Empty Bag</span>
        </button>
      </div>

      {/* Free Shipping Progress Meter */}
      <div className="mt-6 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-2">
          <span className="flex items-center gap-2 text-foreground">
            <Truck className="h-4 w-4 text-primary" />
            {cart.amount_for_free_shipping === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Congratulations! You qualified for Free Standard Delivery
              </span>
            ) : (
              <span>
                Add{" "}
                <strong className="text-primary font-bold">
                  ₹{cart.amount_for_free_shipping.toLocaleString("en-IN")}
                </strong>{" "}
                more to unlock Free Express Delivery
              </span>
            )}
          </span>
          <span className="text-xs text-muted-foreground font-semibold">
            {freeShippingProgress}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              cart.amount_for_free_shipping === 0
                ? "bg-emerald-500"
                : "bg-primary"
            }`}
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="mt-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to update cart</p>
            <p className="text-xs mt-0.5 opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Stock warning banner */}
      {(cart.has_out_of_stock || cart.has_stock_exceeded) && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Inventory Alert</p>
            <p className="text-xs mt-0.5">
              Some items in your cart have exceeded available inventory. Please adjust quantities before proceeding to checkout.
            </p>
          </div>
        </div>
      )}

      {/* Main Cart Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.items.map((item) => {
            const isItemBusy = busyItemId === item.id || isPending;
            const isAtMaxStock = item.quantity >= item.available_stock;

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl bg-card border transition-all ${
                  item.exceeds_stock || item.is_out_of_stock
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border hover:border-border/80 shadow-xs"
                }`}
              >
                <div className="flex gap-4 sm:gap-6">
                  {/* Thumbnail */}
                  <Link
                    href={`/shop/product/${item.product.slug}`}
                    className="relative h-24 w-20 sm:h-32 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/50 group"
                  >
                    {item.product.primary_image ? (
                      <Image
                        src={item.product.primary_image}
                        alt={item.product.name}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/shop/product/${item.product.slug}`}
                          className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isItemBusy}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Variant details */}
                      {item.variant && (
                        <p className="mt-1 text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                          <span>{item.variant.variant_name}</span>
                        </p>
                      )}

                      {/* Stock availability badge */}
                      <div className="mt-2 flex items-center gap-2">
                        {item.is_out_of_stock ? (
                          <span className="text-[11px] font-bold text-destructive px-2 py-0.5 rounded-full bg-destructive/10">
                            Out of Stock
                          </span>
                        ) : item.exceeds_stock ? (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10">
                            Only {item.available_stock} in stock
                          </span>
                        ) : item.available_stock <= 5 ? (
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            Only {item.available_stock} left
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            In Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing and Quantity Bar */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-xl border border-border bg-background shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                            disabled={isItemBusy || item.quantity <= 1}
                            className="h-8 w-8 flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-30 rounded-l-xl"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-10 text-center text-xs font-bold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                            disabled={isItemBusy || isAtMaxStock}
                            className="h-8 w-8 flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-30 rounded-r-xl"
                            title={isAtMaxStock ? `Max available stock (${item.available_stock}) reached` : "Increase quantity"}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {isItemBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <div className="text-base font-extrabold text-foreground">
                          ₹{item.subtotal.toLocaleString("en-IN")}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[11px] text-muted-foreground">
                            ₹{item.unit_price.toLocaleString("en-IN")} each
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border shadow-md space-y-5">
            <h2 className="text-lg font-bold tracking-tight text-foreground border-b border-border pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({cart.item_count} items)</span>
                <span className="font-semibold text-foreground">
                  ₹{cart.subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span>Shipping Fee</span>
                  {cart.shipping_fee === 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600">
                      FREE
                    </span>
                  )}
                </span>
                <span className="font-semibold text-foreground">
                  {cart.shipping_fee === 0 ? "₹0" : `₹${cart.shipping_fee}`}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Taxes & GST</span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Inclusive (18% GST)
                </span>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-baseline">
                <span className="text-base font-bold text-foreground">Total Amount</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary tracking-tight">
                    ₹{cart.total.toLocaleString("en-IN")}
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    Prices calculated server-side from active catalog
                  </p>
                </div>
              </div>
            </div>

            {/* Checkout CTA */}
            <Link
              href={cart.has_out_of_stock || cart.has_stock_exceeded ? "#" : "/checkout"}
              aria-disabled={cart.has_out_of_stock || cart.has_stock_exceeded}
              className={`w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-md transition-all ${
                cart.has_out_of_stock || cart.has_stock_exceeded
                  ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01]"
              }`}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-border/60 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Verified authentic artisan textiles & couture</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-primary shrink-0" />
                <span>Express pan-India delivery with real-time tracking</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw className="h-4 w-4 text-primary shrink-0" />
                <span>7-Day seamless exchange policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
