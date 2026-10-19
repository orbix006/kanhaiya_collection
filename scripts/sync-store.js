const fs = require("fs");
const path = require("path");

const storePath = path.join(process.cwd(), "data", "ecomm_store.json");
let store = JSON.parse(fs.readFileSync(storePath, "utf-8"));

// Canonical seed categories and products with images and batch_number
const seedCategories = [
  {
    id: "cat-idols",
    parent_id: null,
    name: "Idols & Murtis",
    slug: "idols",
    description: "Handcrafted sacred Radha Krishna, Bal Gopal and Ganesha brass idols",
    image_url: "/images/preview-murti.jpg",
    display_order: 1,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-09-28T10:00:00.000Z",
    updated_at: "2026-09-28T10:00:00.000Z"
  },
  {
    id: "cat-pooja",
    parent_id: null,
    name: "Pooja Essentials",
    slug: "pooja-essentials",
    description: "Pure brass engraved thalis, akhand diyas, ghanti bells and aarti vessels",
    image_url: "/images/preview-thali.jpg",
    display_order: 2,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-09-29T10:00:00.000Z",
    updated_at: "2026-09-29T10:00:00.000Z"
  },
  {
    id: "cat-aromas",
    parent_id: null,
    name: "Sacred Aromas & Dhoop",
    slug: "sacred-aromas",
    description: "Natural temple chandan, pure cow dung dhoop, sambrani and incense cones",
    image_url: "/images/temple-atmosphere.jpg",
    display_order: 3,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-09-30T10:00:00.000Z",
    updated_at: "2026-09-30T10:00:00.000Z"
  },
  {
    id: "cat-temple-brass",
    parent_id: null,
    name: "Temple Brassware",
    slug: "temple-brassware",
    description: "Heavy cast brass mandir bells, shankh stands and ceremonial kalashes",
    image_url: "/images/hero-flute.jpg",
    display_order: 4,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z"
  },
  {
    id: "cat-decor",
    parent_id: null,
    name: "Mandir Aasans & Textiles",
    slug: "mandir-aasans",
    description: "Pure silk deity robes, handwoven mandir prayer rugs and altar textiles",
    image_url: "/images/preview-murti.jpg",
    display_order: 5,
    is_active: true,
    show_on_homepage: true,
    created_at: "2026-10-02T10:00:00.000Z",
    updated_at: "2026-10-02T10:00:00.000Z"
  },
  // Subcategories
  {
    id: "cat-radha-krishna",
    parent_id: "cat-idols",
    name: "Radha Krishna Murtis",
    slug: "radha-krishna-murtis",
    description: "Handcrafted pure brass Radha Krishna sanctified idols",
    image_url: "/images/preview-murti.jpg",
    display_order: 1,
    is_active: true,
    show_on_homepage: false,
    created_at: "2026-09-28T10:30:00.000Z",
    updated_at: "2026-09-28T10:30:00.000Z"
  },
  {
    id: "cat-glass-diya",
    parent_id: "cat-pooja",
    name: "Akhand Diyas & Lamps",
    slug: "akhand-diyas",
    description: "Steady flame glass chimney brass akhand diyas",
    image_url: "/images/hero-flute.jpg",
    display_order: 1,
    is_active: true,
    show_on_homepage: false,
    created_at: "2026-09-29T10:30:00.000Z",
    updated_at: "2026-09-29T10:30:00.000Z"
  },
  {
    id: "cat-thalis",
    parent_id: "cat-pooja",
    name: "Puja Thali Sets",
    slug: "puja-thalis",
    description: "Engraved brass aarti and puja thalis",
    image_url: "/images/preview-thali.jpg",
    display_order: 2,
    is_active: true,
    show_on_homepage: false,
    created_at: "2026-09-29T11:00:00.000Z",
    updated_at: "2026-09-29T11:00:00.000Z"
  },
  {
    id: "cat-sambrani-cups",
    parent_id: "cat-aromas",
    name: "Sambrani & Guggal Dhoop",
    slug: "sambrani-dhoop",
    description: "Purifying organic dhoop cups and natural havan sambrani",
    image_url: "/images/temple-atmosphere.jpg",
    display_order: 1,
    is_active: true,
    show_on_homepage: false,
    created_at: "2026-09-30T10:30:00.000Z",
    updated_at: "2026-09-30T10:30:00.000Z"
  }
];

const seedProducts = [
  {
    id: "prod-1",
    category_id: "cat-radha-krishna",
    name: "Pure Brass Radha Krishna Murti (9 Inch)",
    slug: "pure-brass-radha-krishna-murti-9-inch",
    description: "Handcrafted sacred Radha Krishna idol sculpted in pure heavy brass. Adorned with sacred flute, intricate mukut, and sanctified posture.",
    brand: "Kanhaiya Collection",
    sku: "KC-RKM-09",
    batch_number: "BATCH-202609-0001",
    base_price: 4999,
    compare_at_price: 5999,
    stock_quantity: 4,
    sold_count: 38,
    is_active: true,
    is_featured_top_seller: true,
    top_seller_display_order: 1,
    avg_rating: 4.9,
    review_count: 24,
    meta_title: "Pure Brass Radha Krishna Murti (9 Inch) | Kanhaiya Collection",
    meta_description: "Order authentic handcrafted brass Radha Krishna murti for your mandir shrine.",
    image_url: "/images/preview-murti.jpg",
    created_at: "2026-09-28T12:00:00.000Z",
    updated_at: "2026-10-01T12:00:00.000Z",
    images: [
      {
        id: "img-1-1",
        product_id: "prod-1",
        image_url: "/images/preview-murti.jpg",
        alt_text: "Front view of pure brass Radha Krishna murti",
        display_order: 1,
        is_primary: true,
        created_at: "2026-09-28T12:00:00.000Z"
      },
      {
        id: "img-1-2",
        product_id: "prod-1",
        image_url: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80",
        alt_text: "Detail of sacred flute and ornamentation",
        display_order: 2,
        is_primary: false,
        created_at: "2026-09-28T12:05:00.000Z"
      }
    ],
    variants: [
      {
        id: "var-1-1",
        product_id: "prod-1",
        variant_name: "Antique Gold / 9 Inch",
        sku: "KC-RKM-09-AG",
        attributes: { size: "9 Inch", finish: "Antique Gold" },
        price: 4999,
        compare_at_price: 5999,
        stock_quantity: 4,
        image_url: "/images/preview-murti.jpg",
        is_active: true,
        created_at: "2026-09-28T12:00:00.000Z",
        updated_at: "2026-09-28T12:00:00.000Z"
      }
    ]
  },
  {
    id: "prod-2",
    category_id: "cat-glass-diya",
    name: "Akhand Brass Diya with Borosilicate Glass Chimney",
    slug: "akhand-brass-diya-glass-chimney",
    description: "Engineered for steady 24-hour burning. Thermal shock resistant borosilicate glass chimney keeps the holy flame safe from air currents.",
    brand: "Kanhaiya Collection",
    sku: "KC-AKD-01",
    batch_number: "BATCH-202609-0002",
    base_price: 1299,
    compare_at_price: 1599,
    stock_quantity: 8,
    sold_count: 85,
    is_active: true,
    is_featured_top_seller: true,
    top_seller_display_order: 2,
    avg_rating: 4.8,
    review_count: 42,
    meta_title: "Akhand Brass Diya with Borosilicate Glass Chimney | Kanhaiya Collection",
    meta_description: "Order heavy brass akhand diya with steady flame glass chimney.",
    image_url: "/images/hero-flute.jpg",
    created_at: "2026-09-29T11:00:00.000Z",
    updated_at: "2026-10-02T11:00:00.000Z",
    images: [
      {
        id: "img-2-1",
        product_id: "prod-2",
        image_url: "/images/hero-flute.jpg",
        alt_text: "Akhand brass diya burning steadily with glass chimney",
        display_order: 1,
        is_primary: true,
        created_at: "2026-09-29T11:00:00.000Z"
      }
    ],
    variants: []
  },
  {
    id: "prod-3",
    category_id: "cat-thalis",
    name: "Pure Brass Asthamangala Puja Thali Set (11 Pieces)",
    slug: "brass-asthamangala-puja-thali-set",
    description: "Complete ceremonial brass puja thali with embossed Om and Gayatri mantra. Includes ghanti bell, panchamrit loti, aarti diya, and katoris.",
    brand: "Kanhaiya Collection",
    sku: "KC-PTH-11",
    batch_number: "BATCH-202609-0003",
    base_price: 3499,
    compare_at_price: 4299,
    stock_quantity: 12,
    sold_count: 42,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.9,
    review_count: 18,
    meta_title: "Pure Brass Asthamangala Puja Thali Set (11 Pieces)",
    meta_description: "11-piece consecrated puja thali set in solid polished brass.",
    image_url: "/images/preview-thali.jpg",
    created_at: "2026-09-30T10:00:00.000Z",
    updated_at: "2026-10-02T10:00:00.000Z",
    images: [
      {
        id: "img-3-1",
        product_id: "prod-3",
        image_url: "/images/preview-thali.jpg",
        alt_text: "11 piece brass asthamangala puja thali set arranged for aarti",
        display_order: 1,
        is_primary: true,
        created_at: "2026-09-30T10:00:00.000Z"
      }
    ],
    variants: []
  },
  {
    id: "prod-4",
    category_id: "cat-sambrani-cups",
    name: "Natural Loban & Guggal Organic Cow Dung Dhoop Cups",
    slug: "natural-loban-guggal-dhoop-cups",
    description: "Handcrafted using indigenous Gir cow dung, camphor, loban resin, and sambrani. Sanctifies temple aura and purifies indoor air.",
    brand: "Kanhaiya Collection",
    sku: "KC-DHP-24",
    batch_number: "BATCH-202609-0004",
    base_price: 349,
    compare_at_price: 449,
    stock_quantity: 120,
    sold_count: 210,
    is_active: true,
    is_featured_top_seller: true,
    top_seller_display_order: 3,
    avg_rating: 4.9,
    review_count: 85,
    meta_title: "Natural Loban & Guggal Organic Cow Dung Dhoop Cups",
    meta_description: "Pure cow dung sambrani dhoop cups for havan and daily mandir aarti.",
    image_url: "/images/temple-atmosphere.jpg",
    created_at: "2026-10-01T09:00:00.000Z",
    updated_at: "2026-10-03T09:00:00.000Z",
    images: [
      {
        id: "img-4-1",
        product_id: "prod-4",
        image_url: "/images/temple-atmosphere.jpg",
        alt_text: "Organic dhoop cups filled with pure loban resin",
        display_order: 1,
        is_primary: true,
        created_at: "2026-10-01T09:00:00.000Z"
      }
    ],
    variants: []
  },
  {
    id: "prod-5",
    category_id: "cat-temple-brass",
    name: "Heavy Temple Brass Hanging Bell with Garuda Finial",
    slug: "heavy-temple-brass-hanging-bell",
    description: "Deeply resonant cast bronze and brass temple bell. High pitch frequency tuned to 432Hz for spiritual meditation and aarti.",
    brand: "Kanhaiya Collection",
    sku: "KC-BEL-05",
    batch_number: "BATCH-202609-0005",
    base_price: 2899,
    compare_at_price: 3499,
    stock_quantity: 7,
    sold_count: 53,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.7,
    review_count: 14,
    meta_title: "Heavy Temple Brass Hanging Bell with Garuda Finial",
    meta_description: "Heavy acoustic resonance brass temple bell for home mandir ceiling mount.",
    image_url: "/images/hero-flute.jpg",
    created_at: "2026-10-02T08:00:00.000Z",
    updated_at: "2026-10-04T08:00:00.000Z",
    images: [
      {
        id: "img-5-1",
        product_id: "prod-5",
        image_url: "/images/hero-flute.jpg",
        alt_text: "Solid brass hanging bell with heavy brass suspension link",
        display_order: 1,
        is_primary: true,
        created_at: "2026-10-02T08:00:00.000Z"
      }
    ],
    variants: []
  },
  {
    id: "prod-6",
    category_id: "cat-decor",
    name: "Handcrafted Zari Embroidered Silk Mandir Aasan (Pack of 2)",
    slug: "zari-embroidered-silk-mandir-aasan",
    description: "Pure Banarasi silk altar cloth featuring golden zari border and peacock feather motifs. Ideal seat for Laddu Gopal and deity idols.",
    brand: "Kanhaiya Collection",
    sku: "KC-ASN-02",
    batch_number: "BATCH-202609-0006",
    base_price: 899,
    compare_at_price: 1199,
    stock_quantity: 35,
    sold_count: 94,
    is_active: true,
    is_featured_top_seller: false,
    top_seller_display_order: null,
    avg_rating: 4.8,
    review_count: 29,
    meta_title: "Handcrafted Zari Embroidered Silk Mandir Aasan",
    meta_description: "Rich Banarasi silk aasan for temple shrine and deity seats.",
    image_url: "/images/preview-murti.jpg",
    created_at: "2026-10-03T07:00:00.000Z",
    updated_at: "2026-10-04T07:00:00.000Z",
    images: [
      {
        id: "img-6-1",
        product_id: "prod-6",
        image_url: "/images/preview-murti.jpg",
        alt_text: "Golden yellow and crimson Banarasi silk deity aasans",
        display_order: 1,
        is_primary: true,
        created_at: "2026-10-03T07:00:00.000Z"
      }
    ],
    variants: []
  }
];

store.products = seedProducts;
store.categories = seedCategories;
fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
console.log("Successfully synchronized data/ecomm_store.json!");
