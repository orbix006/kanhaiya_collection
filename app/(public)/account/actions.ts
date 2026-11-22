"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(prevState: any, formData: FormData) {
  const fullName = (formData.get("fullName") as string)?.trim() || "";
  const phone = (formData.get("phone") as string)?.trim() || "";
  const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required to update profile." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  revalidatePath("/", "layout");
  return { success: "Profile information updated successfully!" };
}

export async function addAddressAction(prevState: any, formData: FormData) {
  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const addressLine1 = (formData.get("addressLine1") as string)?.trim();
  const addressLine2 = (formData.get("addressLine2") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim();
  const state = (formData.get("state") as string)?.trim();
  const postalCode = (formData.get("postalCode") as string)?.trim();
  const country = (formData.get("country") as string)?.trim() || "India";
  const type = (formData.get("type") as "shipping" | "billing") || "shipping";
  const isDefault = formData.get("isDefault") === "true";

  if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
    return { error: "Please fill in all required address fields." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  try {
    // If setting as default, unset existing defaults of this type first to respect idx_one_default_address
    if (isDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("type", type);
    }

    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      full_name: fullName,
      phone: phone,
      address_line1: addressLine1,
      address_line2: addressLine2,
      city: city,
      state: state,
      postal_code: postalCode,
      country: country,
      type: type,
      is_default: isDefault,
    });

    if (error) {
      if (error.code === "23505") {
        return { error: `A default ${type} address already exists. Please try setting default again.` };
      }
      return { error: error.message };
    }

    revalidatePath("/account/addresses");
    return { success: "Address added successfully!" };
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred while saving the address." };
  }
}

export async function updateAddressAction(prevState: any, formData: FormData) {
  const addressId = formData.get("addressId") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const addressLine1 = (formData.get("addressLine1") as string)?.trim();
  const addressLine2 = (formData.get("addressLine2") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim();
  const state = (formData.get("state") as string)?.trim();
  const postalCode = (formData.get("postalCode") as string)?.trim();
  const country = (formData.get("country") as string)?.trim() || "India";
  const type = (formData.get("type") as "shipping" | "billing") || "shipping";
  const isDefault = formData.get("isDefault") === "true";

  if (!addressId || !fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
    return { error: "Please fill in all required address fields." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  try {
    if (isDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("type", type);
    }

    const { error } = await supabase
      .from("addresses")
      .update({
        full_name: fullName,
        phone: phone,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city: city,
        state: state,
        postal_code: postalCode,
        country: country,
        type: type,
        is_default: isDefault,
        updated_at: new Date().toISOString(),
      })
      .eq("id", addressId)
      .eq("user_id", user.id);

    if (error) {
      if (error.code === "23505") {
        return { error: `A default ${type} address already exists. Please try again.` };
      }
      return { error: error.message };
    }

    revalidatePath("/account/addresses");
    return { success: "Address updated successfully!" };
  } catch (err: any) {
    return { error: err.message || "An error occurred while updating the address." };
  }
}

export async function deleteAddressAction(addressId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account/addresses");
  return { success: "Address deleted successfully." };
}

export async function setDefaultAddressAction(addressId: string, type: "shipping" | "billing") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  try {
    // 1. Unset existing default for this user & type
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("type", type);

    // 2. Set specified address as default
    const { error } = await supabase
      .from("addresses")
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq("id", addressId)
      .eq("user_id", user.id);

    if (error) {
      if (error.code === "23505") {
        return { error: `Could not set as default ${type} address due to a conflicting default.` };
      }
      return { error: error.message };
    }

    revalidatePath("/account/addresses");
    return { success: `Set as default ${type} address!` };
  } catch (err: any) {
    return { error: err.message || "Could not set default address." };
  }
}
