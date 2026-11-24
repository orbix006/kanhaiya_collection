import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function inspect() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  console.log("=== 1. FETCH ALL PRODUCTS DIRECTLY FROM SUPABASE WITH EXPLICIT COLUMNS ===");
  const { data: prods, error: pErr } = await supabase
    .from("products")
    .select(`
      id,
      category_id,
      subcategory_id,
      sub_subcategory_id,
      name,
      slug,
      description,
      sku,
      price,
      stock,
      is_active,
      created_at,
      product_images (
        id,
        product_id,
        url,
        storage_path,
        sort_order,
        is_primary
      )
    `)
    .order("created_at", { ascending: false });

  if (pErr) {
    console.error("Direct explicit select error:", pErr);
  } else {
    console.log(`Found ${prods?.length} products in Supabase:`);
    prods?.forEach((p, idx) => {
      console.log(`\nProduct [${idx + 1}]:`);
      console.log(`  ID: ${p.id}`);
      console.log(`  Name: ${p.name}`);
      console.log(`  Slug: ${p.slug}`);
      console.log(`  Price: ₹${p.price}`);
      console.log(`  Stock: ${p.stock}`);
      console.log(`  Is Active: ${p.is_active}`);
      console.log(`  Created At: ${p.created_at}`);
      console.log(`  Category ID: ${p.category_id}`);
      console.log(`  Subcategory ID: ${p.subcategory_id}`);
      console.log(`  Sub-subcategory ID: ${p.sub_subcategory_id}`);
      console.log(`  Images (${p.product_images?.length}):`, p.product_images);
    });
  }

  console.log("\n=== 2. TEST THE REPAIRED QUERY FOR app/(admin)/admin/products/page.tsx ===");
  const { data: adminData, error: adminErr } = await supabase
    .from("products")
    .select(`
      id,
      category_id,
      subcategory_id,
      sub_subcategory_id,
      name,
      slug,
      description,
      sku,
      price,
      stock,
      is_active,
      created_at,
      category:categories!products_category_id_fkey(id, name, slug, parent_id),
      images:product_images(id, product_id, url, storage_path, sort_order, is_primary)
    `)
    .order("created_at", { ascending: false });

  console.log("Admin repaired query error:", adminErr);
  console.log("Admin repaired query count:", adminData?.length);
  if (adminData && adminData.length > 0) {
    adminData.forEach((p, i) => {
      console.log(`  [${i+1}] ID: ${p.id}, Name: ${p.name}, Price: ₹${p.price}, Stock: ${p.stock}, Category: ${p.category?.name}`);
    });
  }

  console.log("\n=== 3. TEST getAllProducts() from lib/store/index.ts ===");
  const { getAllProducts } = await import("@/lib/store");
  const storeProds = await getAllProducts();
  console.log("getAllProducts() count:", storeProds.length);
  storeProds.forEach((p, i) => {
    console.log(`  [${i + 1}] ID: ${p.id}, Name: ${p.name}, Slug: ${p.slug}, Price: ₹${p.base_price}`);
  });
}

inspect().catch(console.error);
