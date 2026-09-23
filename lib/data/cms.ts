import { createClient } from "@/lib/supabase/server";

export interface HomepageSection {
  key: string;
  is_enabled: boolean;
  display_order: number;
  updated_at?: string;
}

export interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  designation: string | null;
  avatar_url: string | null;
  content: string;
  rating: number | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AboutSection {
  id: string;
  heading: string | null;
  subheading: string | null;
  body: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PolicyType = "privacy" | "terms" | "shipping" | "return";

export interface SitePolicy {
  id: string;
  type: PolicyType;
  title: string;
  content: string;
  display_order: number;
  updated_at?: string;
}

export interface FooterSettings {
  brand_name: string;
  tagline: string;
  logo_url?: string;
  phone: string;
  email: string;
  address: string;
  business_hours?: string;
  social: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "in_progress" | "resolved";
  created_at: string;
  updated_at?: string;
}

export interface Lead {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  source: string | null;
  message: string | null;
  status: "new" | "contacted" | "converted" | "closed";
  created_at: string;
  updated_at?: string;
}

// -----------------------------------------------------------------------------
// Fallback Seed Datasets
// -----------------------------------------------------------------------------

export const FALLBACK_HOMEPAGE_SECTIONS: HomepageSection[] = [
  { key: "banner", is_enabled: true, display_order: 1 },
  { key: "shop_by_category", is_enabled: true, display_order: 2 },
  { key: "continue_browsing", is_enabled: true, display_order: 3 },
  { key: "top_sellers", is_enabled: true, display_order: 4 },
  { key: "category_products", is_enabled: true, display_order: 5 },
  { key: "wall_of_love", is_enabled: true, display_order: 6 },
];

export const FALLBACK_BANNERS: Banner[] = [
  {
    id: "banner-1",
    image_url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1600&q=80",
    title: "Summer Festive Collection 2026",
    link_url: "/shop?category=menswear",
    display_order: 1,
    is_active: true,
  },
  {
    id: "banner-2",
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80",
    title: "Handcrafted Heritage Sarees & Kurtas",
    link_url: "/shop?category=womenswear",
    display_order: 2,
    is_active: true,
  },
  {
    id: "banner-3",
    image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1600&q=80",
    title: "Artisanal Accessories & Fine Footwear",
    link_url: "/shop?category=accessories",
    display_order: 3,
    is_active: true,
  },
];

export const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    customer_name: "Priya Sharma",
    designation: "Fashion Blogger, Mumbai",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    content: "The quality of pure Kanjeevaram silk and handloom craftsmanship is outstanding. It feels regal and authentic in every weave.",
    rating: 5,
    display_order: 1,
    is_active: true,
  },
  {
    id: "test-2",
    customer_name: "Rahul Verma",
    designation: "Verified Buyer, New Delhi",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    content: "Perfect fitting tailored chinos and linen shirts. Fast delivery and premium eco-friendly packaging exceeded my expectations.",
    rating: 5,
    display_order: 2,
    is_active: true,
  },
  {
    id: "test-3",
    customer_name: "Ananya Mehta",
    designation: "Design Consultant, Bangalore",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    content: "Exquisite Kundan jewelry and festive ensembles. Truly timeless pieces that draw compliments at every celebration!",
    rating: 5,
    display_order: 3,
    is_active: true,
  },
  {
    id: "test-4",
    customer_name: "Vikram Singh",
    designation: "Corporate Executive, Jaipur",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    content: "Great luxury linen collection. Kanhaiya Heritage never disappoints in fabric quality, stitch perfection, and refined styling.",
    rating: 5,
    display_order: 4,
    is_active: true,
  },
];

export const FALLBACK_ABOUT_SECTIONS: AboutSection[] = [
  {
    id: "about-1",
    heading: "Our Rich Heritage",
    subheading: "Crafting Timeless Indian Elegance Since 1998",
    body: "Founded over two decades ago in the historic heart of Rajasthan, Kanhaiya Collection began with a singular mission: to preserve and elevate India's finest handloom and artisanal traditions for modern connoisseurs. What started as a bespoke atelier has flourished into a nationally celebrated luxury label.",
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80",
    display_order: 1,
    is_active: true,
  },
  {
    id: "about-2",
    heading: "Master Craftsmanship",
    subheading: "Uncompromising Attention to Fabric, Fit, and Detail",
    body: "Every Kanhaiya garment passes through the hands of master artisans whose lineages represent generations of weaving, embroidery, and tailoring mastery. From the delicate threads of authentic Varanasi Zari to hand-stitched leather mojris, every seam embodies enduring luxury.",
    image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=80",
    display_order: 2,
    is_active: true,
  },
  {
    id: "about-3",
    heading: "Ethical & Sustainable Artisanship",
    subheading: "Empowering Over 400 Weaver Families",
    body: "We believe true luxury honors the hands that create it. Kanhaiya Collection operates direct, fair-wage partnerships with regional weaver cooperatives across Kanchipuram, Chanderi, and Jaipur, ensuring safe craft environments, organic dyes, and zero-compromise sustainability.",
    image_url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80",
    display_order: 3,
    is_active: true,
  },
];

export const FALLBACK_FAQS: Faq[] = [
  {
    id: "faq-1",
    category: "Shipping",
    question: "What are your shipping rates and estimated delivery timelines?",
    answer: "We offer complimentary standard shipping across India on all orders exceeding ₹1,999. For orders below this value, a flat shipping fee of ₹99 is applied. Metro cities generally receive delivery within 2–4 business days, while all other locations take 4–6 business days.",
    display_order: 1,
    is_active: true,
  },
  {
    id: "faq-2",
    category: "Shipping",
    question: "Do you ship internationally?",
    answer: "Yes, we ship to over 45 countries worldwide via express courier. International delivery typically takes 5–8 business days depending on customs clearance.",
    display_order: 2,
    is_active: true,
  },
  {
    id: "faq-3",
    category: "Returns",
    question: "What is your return and exchange policy?",
    answer: "We offer a 7-day hassle-free return and exchange policy from the date of delivery for all unworn garments with original security tags and packaging intact. Bespoke and customized items are non-returnable.",
    display_order: 3,
    is_active: true,
  },
  {
    id: "faq-4",
    category: "Products",
    question: "Are your sarees and kurtas certified authentic handloom?",
    answer: "Every pure silk, Banarasi, and Chanderi piece is accompanied by our certified Handloom Authenticity Seal, guaranteeing pure natural fibers and genuine artisan craftsmanship.",
    display_order: 4,
    is_active: true,
  },
  {
    id: "faq-5",
    category: "Orders",
    question: "How can I track my shipment after placing an order?",
    answer: "As soon as your order is dispatched, you will receive real-time SMS and email tracking links. You can also view live status updates directly within your account orders portal.",
    display_order: 5,
    is_active: true,
  },
  {
    id: "faq-6",
    category: "Payments",
    question: "What payment options are accepted?",
    answer: "We accept all major domestic and international Credit/Debit cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and Cash on Delivery (COD) for eligible pin codes across India.",
    display_order: 6,
    is_active: true,
  },
];

export const FALLBACK_POLICIES: Record<PolicyType, SitePolicy> = {
  privacy: {
    id: "policy-privacy",
    type: "privacy",
    title: "Privacy Policy",
    content: `### 1. Introduction
At Kanhaiya Collection, protecting your personal privacy and maintaining your trust is fundamental to our brand philosophy. This Privacy Policy details how we collect, use, safeguard, and disclose your personal data when you visit our storefront, make a purchase, or communicate with us.

### 2. Information We Collect
- **Personal Details**: Your full name, email address, phone number, and delivery/billing addresses.
- **Transactional Data**: Order history, payment confirmations, and cart contents (payment card numbers are processed securely through RBI-compliant payment gateways and are never stored on our servers).
- **Browsing Data**: IP address, device identifiers, browser type, and items viewed to enhance your shopping experience.

### 3. How We Use Your Data
- To fulfill and deliver your purchases, process returns, and send automated transactional receipts.
- To notify you about dispatch updates, customer support inquiries, and optional festive promotions.
- To prevent fraudulent transactions and maintain catalog integrity.

### 4. Data Security & Storage
We employ industry-standard SSL encryption and strict row-level security on our databases. We never sell, rent, or trade your personal information to third-party marketing companies.

### 5. Your Rights & Inquiries
You have the right to request access to your stored personal details, request corrections, or request account deletion by emailing **privacy@kanhaiyacollection.com**.`,
    display_order: 1,
  },
  terms: {
    id: "policy-terms",
    type: "terms",
    title: "Terms of Service",
    content: `### 1. Agreement to Terms
By browsing our catalog or placing an order on Kanhaiya Collection, you agree to be bound by these Terms of Service, all applicable laws, and regulations of India. If you disagree with any terms, you are prohibited from using our site.

### 2. Accuracy of Catalog & Colors
We make every effort to display the colors, weaves, and details of our handcrafted products with extreme fidelity. However, because our garments use natural dye-lots and hand-woven silk, minor organic variations in texture and shade are inherent traits of genuine handloom.

### 3. Pricing & Availability
All prices are displayed in Indian Rupees (₹) inclusive of GST. We reserve the right to revise prices, discontinue items, or correct typographical errors at any time without prior notice.

### 4. Intellectual Property
All design patterns, product photography, trademarks, brand assets, and digital content are the exclusive intellectual property of Kanhaiya Collection. Any unauthorized reproduction is strictly prohibited.

### 5. Limitation of Liability
Kanhaiya Collection shall not be liable for any indirect, consequential, or incidental damages arising from the use of our products or delivery carrier delays outside our reasonable control.`,
    display_order: 2,
  },
  shipping: {
    id: "policy-shipping",
    type: "shipping",
    title: "Shipping & Delivery Policy",
    content: `### 1. Order Processing Time
- All standard catalog orders are verified and dispatched within **24 to 48 business hours** following confirmation.
- Bespoke or tailored orders (such as custom blouse stitching or customized sarees) require 5–7 business days of preparation prior to dispatch.

### 2. Shipping Charges
- **Domestic Standard Shipping**: Free for all orders above ₹1,999. For orders under ₹1,999, a nominal flat rate of ₹99 applies nationwide.
- **Express Shipping**: Available at checkout for select metro pin codes for ₹199.

### 3. Estimated Delivery Timelines
- **Metro Cities (Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Hyderabad)**: 2 to 4 business days.
- **Tier 2 & Tier 3 Cities**: 3 to 6 business days.
- **Remote / Northeast Regions**: 5 to 8 business days.

### 4. Tracking Your Package
A tracking number and SMS notification from our premium logistics partners (Blue Dart, Delhivery) will be sent upon dispatch.`,
    display_order: 3,
  },
  return: {
    id: "policy-return",
    type: "return",
    title: "Return & Refund Policy",
    content: `### 1. 7-Day Hassle-Free Returns
We want you to be completely delighted with your heirloom pieces. If for any reason you are not satisfied, you may initiate a return or exchange within **7 days of delivery**.

### 2. Eligibility Criteria
- The garment must be in its original, unworn, unwashed condition with all original tags, authenticity seals, and packaging intact.
- Items marked as Final Clearance or customized/altered pieces cannot be returned.

### 3. Return Pickup Process
- Submit a return request through your account orders portal or email **support@kanhaiyacollection.com**.
- Our courier partner will schedule a complimentary reverse pickup within 48 hours.

### 4. Refund Processing
- Once your return is received and inspected at our Jaipur warehouse (typically 2 business days), your refund will be processed.
- Prepaid orders: Credited back to the original source payment method within 5–7 working days.
- COD orders: Refunded via direct bank transfer (NEFT/UPI) to the account provided by the customer.`,
    display_order: 4,
  },
};

export const FALLBACK_FOOTER_SETTINGS: FooterSettings = {
  brand_name: "Kanhaiya Collection",
  tagline: "Handcrafted Luxury, Heritage Silk & Timeless Elegance",
  logo_url: "",
  phone: "+91 98290 12345",
  email: "care@kanhaiyacollection.com",
  address: "108 Heritage Boulevard, C-Scheme, Jaipur, Rajasthan 302001, India",
  business_hours: "Monday – Saturday: 10:00 AM – 8:00 PM IST",
  social: {
    instagram: "https://instagram.com/kanhaiya_collection",
    facebook: "https://facebook.com/kanhaiyacollection",
    twitter: "https://twitter.com/kanhaiyacoll",
    youtube: "https://youtube.com/@kanhaiyacollection",
  },
};

export const FALLBACK_CONTACT_SUBMISSIONS: ContactSubmission[] = [
  {
    id: "sub-1",
    name: "Sunita Kapoor",
    email: "sunita.kapoor@example.com",
    phone: "+91 98111 22334",
    message: "Interested in bulk orders of Banarasi sarees for our family wedding in November. Do you offer bridal consultation appointments?",
    status: "new",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "sub-2",
    name: "Arjun Singhal",
    email: "arjun.singhal@example.com",
    phone: "+91 97222 33445",
    message: "Inquiring about custom size availability for the Royal Embroidered Silk Kurta Set in chest size 46.",
    status: "in_progress",
    created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
  },
  {
    id: "sub-3",
    name: "Meenakshi Das",
    email: "meenakshi.das@example.com",
    phone: "+91 99333 44556",
    message: "Thank you for the prompt exchange on the mojris. They fit perfectly now!",
    status: "resolved",
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

export const FALLBACK_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "Devika Roy",
    email: "devika.roy@example.com",
    phone: "+91 98450 11223",
    source: "newsletter",
    message: "Subscribed to seasonal festive drops.",
    status: "new",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "lead-2",
    name: "Karan Malhotra",
    email: "karan.malhotra@example.com",
    phone: "+91 98765 99887",
    source: "popup",
    message: "Requested 10% first purchase promo coupon.",
    status: "contacted",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "lead-3",
    name: "Aarti Deshmukh",
    email: "aarti.deshmukh@example.com",
    phone: "+91 91234 56789",
    source: "newsletter",
    message: "Interested in bridal wedding trunk show notifications.",
    status: "converted",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

// -----------------------------------------------------------------------------
// Data Fetchers
// -----------------------------------------------------------------------------

export async function getHomepageSectionsAdmin(): Promise<HomepageSection[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("homepage_sections")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_HOMEPAGE_SECTIONS;
    }
    return data as HomepageSection[];
  } catch {
    return FALLBACK_HOMEPAGE_SECTIONS;
  }
}

export async function getBannersAdmin(): Promise<Banner[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_BANNERS;
    }
    return data as Banner[];
  } catch {
    return FALLBACK_BANNERS;
  }
}

export async function getTestimonialsAdmin(): Promise<Testimonial[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_TESTIMONIALS;
    }
    return data as Testimonial[];
  } catch {
    return FALLBACK_TESTIMONIALS;
  }
}

export async function getAboutSectionsAdmin(): Promise<AboutSection[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("about_us_sections")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_ABOUT_SECTIONS;
    }
    return data as AboutSection[];
  } catch {
    return FALLBACK_ABOUT_SECTIONS;
  }
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-project.supabase.co"
  );
}

export async function getPublicAboutSections(): Promise<AboutSection[]> {
  if (!isSupabaseConfigured()) {
    return FALLBACK_ABOUT_SECTIONS.filter((s) => s.is_active);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("about_us_sections")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data) {
      console.warn("Supabase about_us_sections fetch error:", error);
      return FALLBACK_ABOUT_SECTIONS.filter((s) => s.is_active);
    }
    return data as AboutSection[];
  } catch {
    return FALLBACK_ABOUT_SECTIONS.filter((s) => s.is_active);
  }
}

export async function getFaqsAdmin(): Promise<Faq[]> {
  if (!isSupabaseConfigured()) {
    return FALLBACK_FAQS;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data) {
      return FALLBACK_FAQS;
    }
    return data as Faq[];
  } catch {
    return FALLBACK_FAQS;
  }
}

export async function getPublicFaqs(): Promise<Faq[]> {
  if (!isSupabaseConfigured()) {
    return FALLBACK_FAQS.filter((f) => f.is_active);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data) {
      console.warn("Supabase faqs fetch error:", error);
      return FALLBACK_FAQS.filter((f) => f.is_active);
    }
    return data as Faq[];
  } catch {
    return FALLBACK_FAQS.filter((f) => f.is_active);
  }
}

export async function getSitePoliciesAdmin(): Promise<SitePolicy[]> {
  if (!isSupabaseConfigured()) {
    return Object.values(FALLBACK_POLICIES).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_policies")
      .select("*");

    if (error || !data || data.length === 0) {
      return Object.values(FALLBACK_POLICIES).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }
    const policies = (data as any[]).map((p) => ({
      ...p,
      display_order: p.display_order ?? FALLBACK_POLICIES[p.type as PolicyType]?.display_order ?? 0,
    })) as SitePolicy[];

    return policies.sort((a, b) => a.display_order - b.display_order);
  } catch {
    return Object.values(FALLBACK_POLICIES).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }
}

export async function getPublicPolicies(): Promise<SitePolicy[]> {
  return getSitePoliciesAdmin();
}

export async function getPublicPolicy(type: PolicyType): Promise<SitePolicy> {
  if (!isSupabaseConfigured()) {
    return FALLBACK_POLICIES[type];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_policies")
      .select("*")
      .eq("type", type)
      .maybeSingle();

    if (error || !data) {
      return FALLBACK_POLICIES[type];
    }
    return data as SitePolicy;
  } catch {
    return FALLBACK_POLICIES[type];
  }
}

export async function getSiteSettings(key = "footer"): Promise<FooterSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error || !data || !data.value) {
      return FALLBACK_FOOTER_SETTINGS;
    }
    return { ...FALLBACK_FOOTER_SETTINGS, ...(data.value as object) };
  } catch {
    return FALLBACK_FOOTER_SETTINGS;
  }
}

export async function getContactSubmissionsAdmin(): Promise<ContactSubmission[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return FALLBACK_CONTACT_SUBMISSIONS;
    }
    return data as ContactSubmission[];
  } catch {
    return FALLBACK_CONTACT_SUBMISSIONS;
  }
}

export async function getLeadsAdmin(): Promise<Lead[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return FALLBACK_LEADS;
    }
    return data as Lead[];
  } catch {
    return FALLBACK_LEADS;
  }
}
