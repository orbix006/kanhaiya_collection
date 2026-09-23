"use server";

import { revalidatePath as nextRevalidatePath } from "next/cache";
import { verifyAdminCaller } from "@/lib/auth/admin";
import type { PolicyType } from "@/lib/data/cms";

function revalidatePath(path: string, type?: "layout" | "page") {
  try {
    nextRevalidatePath(path, type);
  } catch {
    // Safely ignore static generation store missing errors when run outside HTTP context
  }
}

// -----------------------------------------------------------------------------
// 1. Homepage Sections Actions
// -----------------------------------------------------------------------------

export async function updateHomepageSectionsAction(
  sections: { key: string; is_enabled: boolean; display_order: number }[]
) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  if (auth.isDemo) {
    revalidatePath("/");
    revalidatePath("/admin/cms/homepage");
    return { success: true, message: "[Demo Mode] Homepage sections layout updated successfully." };
  }

  const { supabase } = auth;
  for (const s of sections) {
    const { error } = await supabase
      .from("homepage_sections")
      .upsert(
        {
          key: s.key,
          is_enabled: Boolean(s.is_enabled),
          display_order: Number(s.display_order),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (error) {
      return { error: `Failed to update section '${s.key}': ${error.message}` };
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/cms/homepage");
  return { success: true, message: "Homepage section order & enablement saved successfully." };
}

// -----------------------------------------------------------------------------
// 2. Banner Actions
// -----------------------------------------------------------------------------

export interface BannerPayload {
  id?: string;
  image_url: string;
  title?: string | null;
  link_url?: string | null;
  display_order: number;
  is_active: boolean;
}

export async function saveBannerAction(payload: BannerPayload) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) {
    return { error: auth.error || "Forbidden: Administrator privileges required." };
  }

  const imageUrl = payload.image_url?.trim();
  if (!imageUrl) {
    return { error: "Banner image URL is required." };
  }

  if (auth.isDemo) {
    revalidatePath("/");
    revalidatePath("/admin/cms/banners");
    return {
      success: true,
      message: `[Demo Mode] Banner '${payload.title || "Hero Banner"}' saved.`,
      banner: { ...payload, id: payload.id || `demo-banner-${Date.now()}` },
    };
  }

  const { supabase } = auth;
  const record = {
    image_url: imageUrl,
    title: payload.title?.trim() || null,
    link_url: payload.link_url?.trim() || null,
    display_order: Number(payload.display_order) || 0,
    is_active: Boolean(payload.is_active),
    updated_at: new Date().toISOString(),
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("banners")
      .update(record)
      .eq("id", payload.id)
      .select()
      .single();

    if (error) return { error: `Failed to update banner: ${error.message}` };
    revalidatePath("/");
    revalidatePath("/admin/cms/banners");
    return { success: true, message: "Banner updated successfully.", banner: data };
  } else {
    const { data, error } = await supabase
      .from("banners")
      .insert(record)
      .select()
      .single();

    if (error) return { error: `Failed to create banner: ${error.message}` };
    revalidatePath("/");
    revalidatePath("/admin/cms/banners");
    return { success: true, message: "Banner created successfully.", banner: data };
  }
}

export async function toggleBannerStatusAction(id: string, is_active: boolean) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  if (!auth.isDemo) {
    const { error } = await auth.supabase
      .from("banners")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { error: `Failed to toggle banner: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath("/admin/cms/banners");
  return { success: true, message: `Banner ${is_active ? "activated" : "hidden"} successfully.` };
}

export async function deleteBannerAction(id: string) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  if (!auth.isDemo) {
    const { error } = await auth.supabase.from("banners").delete().eq("id", id);
    if (error) return { error: `Failed to delete banner: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath("/admin/cms/banners");
  return { success: true, message: "Banner deleted successfully." };
}

// -----------------------------------------------------------------------------
// 3. Testimonial Actions
// -----------------------------------------------------------------------------

export interface TestimonialPayload {
  id?: string;
  customer_name: string;
  designation?: string | null;
  avatar_url?: string | null;
  content: string;
  rating?: number | null;
  display_order: number;
  is_active: boolean;
}

export async function saveTestimonialAction(payload: TestimonialPayload) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  const name = payload.customer_name?.trim();
  const content = payload.content?.trim();

  if (!name) return { error: "Customer name is required." };
  if (!content) return { error: "Testimonial content is required." };

  if (auth.isDemo) {
    revalidatePath("/");
    revalidatePath("/admin/cms/testimonials");
    return {
      success: true,
      message: `[Demo Mode] Testimonial from '${name}' saved.`,
      testimonial: { ...payload, id: payload.id || `demo-test-${Date.now()}` },
    };
  }

  const { supabase } = auth;
  const record = {
    customer_name: name,
    designation: payload.designation?.trim() || null,
    avatar_url: payload.avatar_url?.trim() || null,
    content,
    rating: payload.rating ? Number(payload.rating) : null,
    display_order: Number(payload.display_order) || 0,
    is_active: Boolean(payload.is_active),
    updated_at: new Date().toISOString(),
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("testimonials")
      .update(record)
      .eq("id", payload.id)
      .select()
      .single();

    if (error) return { error: `Failed to update testimonial: ${error.message}` };
    revalidatePath("/");
    revalidatePath("/admin/cms/testimonials");
    return { success: true, message: "Testimonial updated successfully.", testimonial: data };
  } else {
    const { data, error } = await supabase
      .from("testimonials")
      .insert(record)
      .select()
      .single();

    if (error) return { error: `Failed to create testimonial: ${error.message}` };
    revalidatePath("/");
    revalidatePath("/admin/cms/testimonials");
    return { success: true, message: "Testimonial created successfully.", testimonial: data };
  }
}

export async function toggleTestimonialStatusAction(id: string, is_active: boolean) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  if (!auth.isDemo) {
    const { error } = await auth.supabase
      .from("testimonials")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { error: `Failed to toggle testimonial: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath("/admin/cms/testimonials");
  return { success: true, message: `Testimonial ${is_active ? "published" : "hidden"} successfully.` };
}

export async function deleteTestimonialAction(id: string) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  if (!auth.isDemo) {
    const { error } = await auth.supabase.from("testimonials").delete().eq("id", id);
    if (error) return { error: `Failed to delete testimonial: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath("/admin/cms/testimonials");
  return { success: true, message: "Testimonial removed successfully." };
}

// -----------------------------------------------------------------------------
// 4. About Us Section Actions
// -----------------------------------------------------------------------------

export interface AboutSectionPayload {
  id?: string;
  heading?: string | null;
  subheading?: string | null;
  body?: string | null;
  image_url?: string | null;
  display_order: number;
  is_active: boolean;
}

export async function saveAboutSectionAction(payload: AboutSectionPayload) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  if (!payload.heading?.trim() && !payload.body?.trim()) {
    return { error: "A heading or body text is required for an About section." };
  }

  if (auth.isDemo) {
    revalidatePath("/about");
    revalidatePath("/admin/cms/about");
    return {
      success: true,
      message: `[Demo Mode] About section '${payload.heading || "Section"}' saved.`,
      section: { ...payload, id: payload.id || `demo-about-${Date.now()}` },
    };
  }

  const { supabase } = auth;
  const record = {
    heading: payload.heading?.trim() || null,
    subheading: payload.subheading?.trim() || null,
    body: payload.body?.trim() || null,
    image_url: payload.image_url?.trim() || null,
    display_order: Number(payload.display_order) || 0,
    is_active: Boolean(payload.is_active),
    updated_at: new Date().toISOString(),
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("about_us_sections")
      .update(record)
      .eq("id", payload.id)
      .select()
      .single();

    if (error) return { error: `Failed to update About section: ${error.message}` };
    revalidatePath("/about");
    revalidatePath("/admin/cms/about");
    return { success: true, message: "About section updated successfully.", section: data };
  } else {
    const { data, error } = await supabase
      .from("about_us_sections")
      .insert(record)
      .select()
      .single();

    if (error) return { error: `Failed to create About section: ${error.message}` };
    revalidatePath("/about");
    revalidatePath("/admin/cms/about");
    return { success: true, message: "About section created successfully.", section: data };
  }
}

export async function toggleAboutSectionStatusAction(id: string, is_active: boolean) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  if (!auth.isDemo) {
    const { error } = await auth.supabase
      .from("about_us_sections")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { error: `Failed to toggle section: ${error.message}` };
  }

  revalidatePath("/about");
  revalidatePath("/admin/cms/about");
  return { success: true, message: `About section ${is_active ? "published" : "hidden"} successfully.` };
}

export async function deleteAboutSectionAction(id: string) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  if (!auth.isDemo) {
    const { error } = await auth.supabase.from("about_us_sections").delete().eq("id", id);
    if (error) return { error: `Failed to delete section: ${error.message}` };
  }

  revalidatePath("/about");
  revalidatePath("/admin/cms/about");
  return { success: true, message: "About section deleted successfully." };
}

// -----------------------------------------------------------------------------
// 5. FAQ Actions
// -----------------------------------------------------------------------------

export interface FaqPayload {
  id?: string;
  question: string;
  answer: string;
  category?: string | null;
  display_order: number;
  is_active: boolean;
}

export async function saveFaqAction(payload: FaqPayload) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  const question = payload.question?.trim();
  const answer = payload.answer?.trim();

  if (!question) return { error: "FAQ question is required." };
  if (!answer) return { error: "FAQ answer is required." };

  if (auth.isDemo) {
    revalidatePath("/faqs");
    revalidatePath("/faq");
    revalidatePath("/admin/cms/faqs");
    return {
      success: true,
      message: `[Demo Mode] FAQ saved successfully.`,
      faq: { ...payload, id: payload.id || `demo-faq-${Date.now()}` },
    };
  }

  const { supabase } = auth;
  const record = {
    question,
    answer,
    category: payload.category?.trim() || "General",
    display_order: Number(payload.display_order) || 0,
    is_active: Boolean(payload.is_active),
    updated_at: new Date().toISOString(),
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("faqs")
      .update(record)
      .eq("id", payload.id)
      .select()
      .single();

    if (error) return { error: `Failed to update FAQ: ${error.message}` };
    revalidatePath("/faqs");
    revalidatePath("/faq");
    revalidatePath("/admin/cms/faqs");
    return { success: true, message: "FAQ updated successfully.", faq: data };
  } else {
    const { data, error } = await supabase
      .from("faqs")
      .insert(record)
      .select()
      .single();

    if (error) return { error: `Failed to create FAQ: ${error.message}` };
    revalidatePath("/faqs");
    revalidatePath("/faq");
    revalidatePath("/admin/cms/faqs");
    return { success: true, message: "FAQ created successfully.", faq: data };
  }
}

export async function toggleFaqStatusAction(id: string, is_active: boolean) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  if (!auth.isDemo) {
    const { error } = await auth.supabase
      .from("faqs")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { error: `Failed to toggle FAQ: ${error.message}` };
  }

  revalidatePath("/faqs");
  revalidatePath("/faq");
  revalidatePath("/admin/cms/faqs");
  return { success: true, message: `FAQ ${is_active ? "published" : "hidden"} successfully.` };
}

export async function deleteFaqAction(id: string) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  if (!auth.isDemo) {
    const { error } = await auth.supabase.from("faqs").delete().eq("id", id);
    if (error) return { error: `Failed to delete FAQ: ${error.message}` };
  }

  revalidatePath("/faqs");
  revalidatePath("/faq");
  revalidatePath("/admin/cms/faqs");
  return { success: true, message: "FAQ deleted successfully." };
}

// -----------------------------------------------------------------------------
// 6. Policy Pages Actions
// -----------------------------------------------------------------------------

export async function savePolicyAction(
  type: PolicyType,
  title: string,
  content: string,
  display_order?: number
) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  const validTitle = title?.trim();
  const validContent = content?.trim();

  if (!validTitle) return { error: "Policy title is required." };
  if (!validContent) return { error: "Policy content is required." };

  if (auth.isDemo) {
    revalidatePath(`/${type}`);
    revalidatePath("/admin/cms/policies");
    revalidatePath("/", "layout");
    return {
      success: true,
      message: `[Demo Mode] ${validTitle} updated successfully.`,
    };
  }

  const { supabase } = auth;
  const payload: Record<string, any> = {
    type,
    title: validTitle,
    content: validContent,
    updated_at: new Date().toISOString(),
  };

  if (display_order !== undefined) {
    payload.display_order = Number(display_order);
  }

  const { data, error } = await supabase
    .from("site_policies")
    .upsert(payload, { onConflict: "type" })
    .select()
    .single();

  if (error) return { error: `Failed to save policy: ${error.message}` };

  revalidatePath(`/${type}`);
  revalidatePath("/admin/cms/policies");
  revalidatePath("/", "layout");
  return { success: true, message: `${validTitle} updated successfully.`, policy: data };
}

export async function updatePolicyOrderAction(
  policies: { type: PolicyType; display_order: number }[]
) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  if (auth.isDemo) {
    revalidatePath("/admin/cms/policies");
    revalidatePath("/", "layout");
    return { success: true, message: "[Demo Mode] Policy order updated." };
  }

  const { supabase } = auth;
  for (const item of policies) {
    await supabase
      .from("site_policies")
      .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
      .eq("type", item.type);
  }

  revalidatePath("/admin/cms/policies");
  revalidatePath("/", "layout");
  return { success: true, message: "Policy sequence updated successfully." };
}

// -----------------------------------------------------------------------------
// 7. Site Settings Actions
// -----------------------------------------------------------------------------

export async function saveSiteSettingsAction(key: string, value: Record<string, any>) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return { error: auth.error };

  if (!key) return { error: "Settings key is required." };

  if (auth.isDemo) {
    revalidatePath("/", "layout");
    revalidatePath("/admin/cms/settings");
    return { success: true, message: "[Demo Mode] Site settings updated successfully." };
  }

  const { supabase } = auth;
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    )
    .select()
    .single();

  if (error) return { error: `Failed to save site settings: ${error.message}` };

  revalidatePath("/", "layout");
  revalidatePath("/admin/cms/settings");
  return { success: true, message: "Site settings updated successfully.", settings: data };
}
