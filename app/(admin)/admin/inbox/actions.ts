"use server";

import { revalidatePath as nextRevalidatePath } from "next/cache";
import { verifyAdminCaller } from "@/lib/auth/admin";

function revalidatePath(path: string, type?: "layout" | "page") {
  try {
    nextRevalidatePath(path, type);
  } catch {
    // Ignore static generation store missing error outside request context (e.g. tests)
  }
}

export async function updateContactStatusAction(
  id: string,
  status: "new" | "in_progress" | "resolved"
) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  if (auth.isDemo) {
    revalidatePath("/admin/inbox/contact");
    return { success: true, message: `[Demo Mode] Status updated to '${status}'.` };
  }

  const { error } = await auth.supabase
    .from("contact_submissions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: `Failed to update status: ${error.message}` };
  }

  revalidatePath("/admin/inbox/contact");
  return { success: true, message: `Inquiry status changed to '${status}'.` };
}

export async function deleteContactSubmissionAction(id: string) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  if (auth.isDemo) {
    revalidatePath("/admin/inbox/contact");
    return { success: true, message: "[Demo Mode] Submission deleted." };
  }

  const { error } = await auth.supabase
    .from("contact_submissions")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: `Failed to delete submission: ${error.message}` };
  }

  revalidatePath("/admin/inbox/contact");
  return { success: true, message: "Contact submission deleted successfully." };
}

export async function updateLeadStatusAction(
  id: string,
  status: "new" | "contacted" | "converted" | "closed"
) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  if (auth.isDemo) {
    revalidatePath("/admin/inbox/leads");
    return { success: true, message: `[Demo Mode] Lead status updated to '${status}'.` };
  }

  const { error } = await auth.supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: `Failed to update lead status: ${error.message}` };
  }

  revalidatePath("/admin/inbox/leads");
  return { success: true, message: `Lead status updated to '${status}'.` };
}

export async function deleteLeadAction(id: string) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  if (auth.isDemo) {
    revalidatePath("/admin/inbox/leads");
    return { success: true, message: "[Demo Mode] Lead deleted." };
  }

  const { error } = await auth.supabase
    .from("leads")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: `Failed to delete lead: ${error.message}` };
  }

  revalidatePath("/admin/inbox/leads");
  return { success: true, message: "Lead record removed successfully." };
}
