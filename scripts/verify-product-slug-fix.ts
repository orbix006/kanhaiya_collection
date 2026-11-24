import { resolveUniqueProductSlug } from "../lib/data/categories";
import { upsertProductInStore, loadMockStore } from "../lib/mock-data/admin-store";
import { getAllProducts, getProductBySlug } from "../lib/store";
import { getShopProducts } from "../lib/data/products";

async function runVerification() {
  console.log("=== STEP 1: Unit Test resolveUniqueProductSlug ===");
  const existing = [
    { id: "1", slug: "latest-handwork-poshak" },
    { id: "2", slug: "latest-handwork-poshak-2" },
  ];

  // Collision with root slug
  const slug1 = resolveUniqueProductSlug("latest-handwork-poshak", undefined, existing);
  console.log("Expected latest-handwork-poshak-3, Got:", slug1);
  if (slug1 !== "latest-handwork-poshak-3") {
    throw new Error(`Failed slug1 test: expected latest-handwork-poshak-3, got ${slug1}`);
  }

  // Editing existing product 1: should keep its own slug
  const slugEdit = resolveUniqueProductSlug("latest-handwork-poshak", "1", existing);
  console.log("Expected latest-handwork-poshak, Got:", slugEdit);
  if (slugEdit !== "latest-handwork-poshak") {
    throw new Error(`Failed slugEdit test: expected latest-handwork-poshak, got ${slugEdit}`);
  }

  // Brand new name with no collisions
  const slugNew = resolveUniqueProductSlug("radha-krishna-poshak", undefined, existing);
  console.log("Expected radha-krishna-poshak, Got:", slugNew);
  if (slugNew !== "radha-krishna-poshak") {
    throw new Error(`Failed slugNew test: expected radha-krishna-poshak, got ${slugNew}`);
  }

  console.log("=== STEP 2: Adding Product 1 (Latest Handwork Poshak 😍😍😍) ===");
  const res1 = upsertProductInStore({
    name: "Latest Handwork Poshak 😍😍😍",
    base_price: 1500,
    stock_quantity: 25,
    is_active: true,
    description: "Exquisite handwork poshak for Laddu Gopal",
    images: [
      {
        id: "img-1",
        image_url: "https://example.com/poshak1.jpg",
        is_primary: true,
        display_order: 1,
      },
    ],
  });

  if (!res1.success || !res1.product) {
    throw new Error(`Failed to create product 1: ${res1.error}`);
  }
  console.log("Product 1 created with slug:", res1.product.slug);
  console.log("Product 1 image_url:", res1.product.image_url);

  console.log("=== STEP 3: Adding Product 2 with duplicate name (Latest Handwork Poshak 😍😍) ===");
  const res2 = upsertProductInStore({
    name: "Latest Handwork Poshak 😍😍",
    base_price: 1800,
    stock_quantity: 15,
    is_active: true,
    description: "Another exquisite handwork poshak for Radhe Krishna",
    images: [
      {
        id: "img-2",
        image_url: "https://example.com/poshak2.jpg",
        is_primary: true,
        display_order: 1,
      },
    ],
  });

  if (!res2.success || !res2.product) {
    throw new Error(`Failed to create product 2: ${res2.error}`);
  }
  console.log("Product 2 created with slug:", res2.product.slug);
  console.log("Product 2 image_url:", res2.product.image_url);

  if (res2.product.slug === res1.product.slug) {
    throw new Error("Slug collision! Both products have the same slug.");
  }
  if (!res2.product.slug.startsWith(`${res1.product.slug}-`)) {
    throw new Error(`Product 2 slug ${res2.product.slug} does not follow incremental pattern`);
  }

  console.log("=== STEP 4: Storefront Fetching - getAllProducts() ===");
  const allProducts = await getAllProducts();
  console.log(`getAllProducts returned ${allProducts.length} products`);
  const found1 = allProducts.find((p) => p.slug === res1.product?.slug);
  const found2 = allProducts.find((p) => p.slug === res2.product?.slug);

  if (!found1) throw new Error("Product 1 not found in getAllProducts()");
  if (!found2) throw new Error("Product 2 not found in getAllProducts()");

  console.log("Product 1 in store image_url:", found1.image_url);
  console.log("Product 2 in store image_url:", found2.image_url);

  if (!found1.image_url) throw new Error("Product 1 image_url is missing or empty!");
  if (!found2.image_url) throw new Error("Product 2 image_url is missing or empty!");

  console.log("=== STEP 5: Storefront Shop Catalog - getShopProducts() ===");
  const shopResult = await getShopProducts({});
  console.log(`getShopProducts returned ${shopResult.products.length} products, totalCount: ${shopResult.totalCount}`);

  const shopP1 = shopResult.products.find((p) => p.slug === res1.product?.slug);
  const shopP2 = shopResult.products.find((p) => p.slug === res2.product?.slug);

  if (!shopP1) throw new Error("Product 1 not found in getShopProducts()");
  if (!shopP2) throw new Error("Product 2 not found in getShopProducts()");
  console.log("Shop Product 1:", shopP1.name, "image_url:", shopP1.image_url);
  console.log("Shop Product 2:", shopP2.name, "image_url:", shopP2.image_url);

  console.log("=== STEP 6: Product Detail By Slug - getProductBySlug() ===");
  const detailP1 = await getProductBySlug(res1.product?.slug || "");
  const detailP2 = await getProductBySlug(res2.product.slug);

  if (!detailP1) throw new Error("getProductBySlug(res1.product.slug) returned null");
  if (!detailP2) throw new Error("getProductBySlug(res2.product.slug) returned null");
  console.log("Detail P1 resolved:", detailP1.name, "slug:", detailP1.slug);
  console.log("Detail P2 resolved:", detailP2.name, "slug:", detailP2.slug);

  console.log("\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
}

runVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
