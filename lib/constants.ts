export const CONTACT_CONFIG = {
  // Configurable brand contact channels (no fake details displayed)
  instagramUrl: "https://instagram.com/kanhaiyacollection",
  googleMapsUrl: "https://maps.google.com/?q=Kanhaiya+Collection",
  whatsappUrl: "https://wa.me/910000000000",
  phoneUrl: "tel:+910000000000",
};

export interface SearchProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  price?: string;
  slug: string;
}

export interface SearchCategory {
  id: string;
  name: string;
  slug: string;
  itemCount?: string;
}

export const SEARCH_CATALOG = {
  products: [
    {
      id: "prod-1",
      name: "Krishna Idol",
      category: "Idols & Murtis",
      description: "Handcrafted antique brass Krishna idol with intricate flute details",
      price: "₹3,499",
      slug: "krishna-idol",
    },
    {
      id: "prod-2",
      name: "Brass Diya",
      category: "Pooja Essentials",
      description: "Traditional engraved akhand diya with steady flame holder",
      price: "₹899",
      slug: "brass-diya",
    },
    {
      id: "prod-3",
      name: "Radha Krishna Frame",
      category: "Decorative & Frames",
      description: "Gold embossed Tanjore style divine portrait frame",
      price: "₹2,199",
      slug: "radha-krishna-frame",
    },
    {
      id: "prod-4",
      name: "Radha Krishna Murti",
      category: "Idols & Murtis",
      description: "Panchaloha brass sacred divine couple murti",
      price: "₹5,999",
      slug: "radha-krishna-murti",
    },
    {
      id: "prod-5",
      name: "Artisan Puja Thali",
      category: "Pooja Essentials",
      description: "Pure brass puja thali with ghanti bell and kumkum bowls",
      price: "₹1,899",
      slug: "artisan-puja-thali",
    },
    {
      id: "prod-6",
      name: "Pure Chandan Dhoop",
      category: "Sacred Aromas",
      description: "Natural temple sandalwood incense sticks and dhoop cones",
      price: "₹450",
      slug: "pure-chandan-dhoop",
    },
    {
      id: "prod-7",
      name: "Laddu Gopal Murti",
      category: "Idols & Murtis",
      description: "Ashtadhatu brass Bal Gopal idol for daily seva",
      price: "₹1,499",
      slug: "laddu-gopal-murti",
    },
    {
      id: "prod-8",
      name: "Mandir Silk Aasan",
      category: "Decorative & Frames",
      description: "Pure handwoven raw silk prayer rug and deity altar cloth",
      price: "₹1,199",
      slug: "mandir-silk-aasan",
    },
  ] as SearchProduct[],

  categories: [
    {
      id: "cat-1",
      name: "Idols",
      slug: "idols",
      itemCount: "Brass & Stone Murtis",
    },
    {
      id: "cat-2",
      name: "Pooja Essentials",
      slug: "pooja-essentials",
      itemCount: "Thalis, Diyas & Bells",
    },
    {
      id: "cat-3",
      name: "Decorative",
      slug: "decorative",
      itemCount: "Frames, Torans & Aasans",
    },
    {
      id: "cat-4",
      name: "Sacred Aromas",
      slug: "sacred-aromas",
      itemCount: "Dhoop, Chandan & Camphor",
    },
    {
      id: "cat-5",
      name: "Temple Brassware",
      slug: "temple-brassware",
      itemCount: "Artisan Castings",
    },
  ] as SearchCategory[],
};
