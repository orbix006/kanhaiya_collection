"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateUserRoleAction(
  targetUserId: string,
  newRole: "admin" | "user"
) {
  if (!targetUserId || !["admin", "user"].includes(newRole)) {
    return { error: "Invalid user ID or role parameter." };
  }

  // Strictly use normal authenticated Supabase client carrying caller's session cookie.
  // NEVER use service-role key!
  const supabase = await createClient();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co";

  if (!isConfigured) {
    // In local development / offline demo mode
    revalidatePath("/admin/users");
    return { success: true, message: `[Demo Mode] Role updated to '${newRole}'.` };
  }

  // 1. Verify acting user is authenticated
  const {
    data: { user: caller },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !caller) {
    return { error: "Unauthorized: You must be logged in to modify user roles." };
  }

  // 2. Verify acting user possesses admin role
  const { data: callerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (profileError || !callerProfile || callerProfile.role !== "admin") {
    return { error: "Forbidden: Only administrators can modify roles." };
  }

  // 3. Prevent self-demotion if caller is demoting their own admin account
  if (caller.id === targetUserId && newRole !== "admin") {
    return {
      error:
        "Safety guard: You cannot demote your own administrator account. Please have another admin perform this action.",
    };
  }

  // 4. Update the target user's role via standard authenticated client
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
