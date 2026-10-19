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
    const { updateMockContactStatus } = await import("@/lib/mock-data/admin-store");
    const res = updateMockContactStatus(id, status);
    if (!res.success) return { error: res.error || "Failed to update inquiry status." };
    revalidatePath("/admin/inbox");
    revalidatePath("/admin/inbox/contact");
    return { success: true, message: `Inquiry status updated to '${status.replace("_", " ")}'.`, submission: res.submission };
  }

  const { error } = await auth.supabase
    .from("contact_submissions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: `Failed to update status: ${error.message}` };
  }

  revalidatePath("/admin/inbox");
  revalidatePath("/admin/inbox/contact");
  return { success: true, message: `Inquiry status changed to '${status}'.` };
}

export async function deleteContactSubmissionAction(id: string) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  if (auth.isDemo) {
    const { deleteMockContactSubmission } = await import("@/lib/mock-data/admin-store");
    const res = deleteMockContactSubmission(id);
    if (!res.success) return { error: res.error || "Failed to delete submission." };
    revalidatePath("/admin/inbox");
    revalidatePath("/admin/inbox/contact");
    return { success: true, message: "Contact submission deleted successfully." };
  }

  const { error } = await auth.supabase
    .from("contact_submissions")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: `Failed to delete submission: ${error.message}` };
  }

  revalidatePath("/admin/inbox");
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
    const { updateMockLeadStatus } = await import("@/lib/mock-data/admin-store");
    const res = updateMockLeadStatus(id, status);
    if (!res.success) return { error: res.error || "Failed to update lead status." };
    revalidatePath("/admin/inbox");
    revalidatePath("/admin/inbox/leads");
    return { success: true, message: `Lead status updated to '${status}'.`, lead: res.lead };
  }

  const { error } = await auth.supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: `Failed to update lead status: ${error.message}` };
  }

  revalidatePath("/admin/inbox");
  revalidatePath("/admin/inbox/leads");
  return { success: true, message: `Lead status updated to '${status}'.` };
}

export async function deleteLeadAction(id: string) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  if (auth.isDemo) {
    const { deleteMockLead } = await import("@/lib/mock-data/admin-store");
    const res = deleteMockLead(id);
    if (!res.success) return { error: res.error || "Failed to delete lead." };
    revalidatePath("/admin/inbox");
    revalidatePath("/admin/inbox/leads");
    return { success: true, message: "Lead record removed successfully." };
  }

  const { error } = await auth.supabase
    .from("leads")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: `Failed to delete lead: ${error.message}` };
  }

  revalidatePath("/admin/inbox");
  revalidatePath("/admin/inbox/leads");
  return { success: true, message: "Lead record removed successfully." };
}

export async function addResponseNoteAction(
  inquiryId: string,
  entityType: "contact_submission" | "lead",
  note: string,
  responder: string = "Admin (Amber)"
) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  const { addMockResponseNote } = await import("@/lib/mock-data/admin-store");
  const res = addMockResponseNote(inquiryId, entityType, note, responder);
  if (!res.success) return { error: res.error || "Failed to record response note." };

  revalidatePath("/admin/inbox");
  revalidatePath("/admin/inbox/contact");
  revalidatePath("/admin/inbox/leads");
  return { success: true, message: "Response note recorded in local workflow.", note: res.note };
}

export async function markInquiryReadAction(
  id: string,
  entityType: "contact_submission" | "lead"
) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  const { markInquiryAsRead } = await import("@/lib/mock-data/admin-store");
  const res = markInquiryAsRead(id, entityType);
  if (!res.success) return { error: res.error || "Failed to mark as read." };

  revalidatePath("/admin/inbox");
  revalidatePath("/admin/inbox/contact");
  revalidatePath("/admin/inbox/leads");
  return { success: true, message: "Record marked as reviewed.", newStatus: res.newStatus };
}

export async function updateUnifiedInquiryStatusAction(
  id: string,
  entityType: "contact_submission" | "lead",
  status: string
) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  const { updateUnifiedInquiryStatus } = await import("@/lib/mock-data/admin-store");
  const res = updateUnifiedInquiryStatus(id, entityType, status);
  if (!res.success) return { error: res.error || "Failed to update status." };

  revalidatePath("/admin/inbox");
  revalidatePath("/admin/inbox/contact");
  revalidatePath("/admin/inbox/leads");
  return { success: true, message: `Status updated to '${status.replace("_", " ")}'.` };
}

export async function deleteUnifiedInquiryAction(
  id: string,
  entityType: "contact_submission" | "lead"
) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  const { deleteUnifiedInquiry } = await import("@/lib/mock-data/admin-store");
  const res = deleteUnifiedInquiry(id, entityType);
  if (!res.success) return { error: res.error || "Failed to delete record." };

  revalidatePath("/admin/inbox");
  revalidatePath("/admin/inbox/contact");
  revalidatePath("/admin/inbox/leads");
  return { success: true, message: "Inquiry record deleted successfully." };
}
