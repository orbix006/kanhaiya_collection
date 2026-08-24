"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import {
  addAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/app/(public)/account/actions";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Star,
  ArrowLeft,
  Loader2,
  X,
  AlertCircle,
  Building,
  Truck,
} from "lucide-react";

export interface AddressItem {
  id: string;
  user_id: string;
  type: "shipping" | "billing";
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

interface AddressManagerProps {
  addresses: AddressItem[];
}

export function AddressManager({ addresses }: AddressManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [addState, addFormAction, isAddPending] = useActionState(addAddressAction, null);
  const [updateState, updateFormAction, isUpdatePending] = useActionState(updateAddressAction, null);

  const openAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
    setActionError(null);
  };

  const openEditModal = (addr: AddressItem) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
    setActionError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    setDeletingId(id);
    setActionError(null);
    const res = await deleteAddressAction(id);
    setDeletingId(null);
    if (res?.error) {
      setActionError(res.error);
    } else {
      setActionSuccess("Address deleted successfully.");
    }
  };

  const handleSetDefault = async (id: string, type: "shipping" | "billing") => {
    setActionError(null);
    setActionSuccess(null);
    const res = await setDefaultAddressAction(id, type);
    if (res?.error) {
      setActionError(res.error);
    } else if (res?.success) {
      setActionSuccess(res.success);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Address Book</h1>
            <p className="text-sm text-muted-foreground">Manage your shipping and billing delivery addresses</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3.5 text-sm rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 text-sm rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl bg-card space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">No addresses saved yet</h3>
            <p className="text-sm text-muted-foreground">Add your delivery addresses for a faster checkout experience.</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-6 bg-card border rounded-2xl shadow-xs space-y-4 relative flex flex-col justify-between ${
                addr.is_default ? "border-primary/50 ring-1 ring-primary/30" : "border-border"
              }`}
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      addr.type === "shipping"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                    }`}
                  >
                    {addr.type === "shipping" ? <Truck className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                    <span className="capitalize">{addr.type} Address</span>
                  </span>

                  {addr.is_default && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Star className="h-3 w-3 fill-current" />
                      Default {addr.type === "shipping" ? "Shipping" : "Billing"}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h4 className="text-base font-semibold text-foreground">{addr.full_name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{addr.phone}</p>
                </div>

                <div className="text-sm text-foreground space-y-0.5">
                  <p>{addr.address_line1}</p>
                  {addr.address_line2 && <p>{addr.address_line2}</p>}
                  <p>
                    {addr.city}, {addr.state} - {addr.postal_code}
                  </p>
                  <p className="text-xs text-muted-foreground">{addr.country}</p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
                {!addr.is_default ? (
                  <button
                    onClick={() => handleSetDefault(addr.id, addr.type)}
                    className="text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Set as Default {addr.type}
                  </button>
                ) : (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Default Address
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditModal(addr)}
                    className="text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="text-destructive/80 hover:text-destructive font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {deletingId === addr.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {(addState?.error || updateState?.error) && (
              <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{addState?.error || updateState?.error}</span>
              </div>
            )}

            <form
              action={(formData) => {
                if (editingAddress) {
                  updateFormAction(formData);
                } else {
                  addFormAction(formData);
                }
                setIsModalOpen(false);
              }}
              className="space-y-4"
            >
              {editingAddress && <input type="hidden" name="addressId" value={editingAddress.id} />}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Address Type</label>
                  <select
                    name="type"
                    defaultValue={editingAddress?.type || "shipping"}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="shipping">Shipping</option>
                    <option value="billing">Billing</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Set Default</label>
                  <select
                    name="isDefault"
                    defaultValue={editingAddress?.is_default ? "true" : "false"}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes (Set as Default)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Full Name *</label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    defaultValue={editingAddress?.full_name || ""}
                    placeholder="Recipient's Name"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Phone Number *</label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    defaultValue={editingAddress?.phone || ""}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Address Line 1 *</label>
                <input
                  name="addressLine1"
                  type="text"
                  required
                  defaultValue={editingAddress?.address_line1 || ""}
                  placeholder="Street address, house no., building"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Address Line 2 (Optional)</label>
                <input
                  name="addressLine2"
                  type="text"
                  defaultValue={editingAddress?.address_line2 || ""}
                  placeholder="Apartment, suite, landmark"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">City *</label>
                  <input
                    name="city"
                    type="text"
                    required
                    defaultValue={editingAddress?.city || ""}
                    placeholder="City"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">State *</label>
                  <input
                    name="state"
                    type="text"
                    required
                    defaultValue={editingAddress?.state || ""}
                    placeholder="State"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Postal Code *</label>
                  <input
                    name="postalCode"
                    type="text"
                    required
                    defaultValue={editingAddress?.postal_code || ""}
                    placeholder="ZIP / Pincode"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Country</label>
                <input
                  name="country"
                  type="text"
                  defaultValue={editingAddress?.country || "India"}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddPending || isUpdatePending}
                  className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isAddPending || isUpdatePending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Address"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
