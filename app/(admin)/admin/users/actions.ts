"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/auth/role-check";
import { getLocalSession, setLocalUserRole } from "@/lib/auth/local-auth";

/**
 * Updates a user's role in the system.
 * Enforces role verification on caller and prevents admin self-demotion.
 */
export async function updateUserRoleAction(targetUserId: string, newRole: "admin" | "user") {
  if (!targetUserId || !newRole || !["admin", "user"].includes(newRole)) {
    return { error: "Invalid user ID or role parameter." };
  }

  // 1. Supabase Mode
  if (isSupabaseConfigured()) {
    const supabase = await createClient();

    const {
      data: { user: caller },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !caller) {
      return { error: "Unauthorized: You must be logged in to modify user roles." };
    }

    // Verify acting user possesses admin role
    const { data: callerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!isUserAdmin(caller, callerProfile) || (callerProfile && callerProfile.role !== "admin" && !isUserAdmin(caller))) {
      return { error: "Forbidden: Only administrators can modify roles." };
    }

    // Prevent self-demotion if caller is demoting their own admin account
    if (caller.id === targetUserId && newRole !== "admin") {
      return {
        error:
          "Safety guard: You cannot demote your own administrator account. Please have another admin perform this action.",
      };
    }

    // Update target user's role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", targetUserId);

    if (updateError) {
      return { error: `Failed to update role: ${updateError.message}` };
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, message: `Successfully updated user role to '${newRole}'.` };
  }

  // 2. Local Mode
  const session = await getLocalSession();
  if (!session || !isUserAdmin(session)) {
    return { error: "Forbidden: Only administrators can modify roles." };
  }

  if (session.id === targetUserId && newRole !== "admin") {
    return {
      error:
        "Safety guard: You cannot demote your own administrator account. Please have another admin perform this action.",
    };
  }

  const updated = await setLocalUserRole(targetUserId, newRole);
  if (!updated) {
    return { error: "Target user not found." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: true, message: `Successfully updated user role to '${newRole}'.` };
}
