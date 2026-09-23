import { CategoryName } from '../types';

export interface CategoryInfo {
  name: CategoryName;
  iconName: string;
  description: string;
  image: string;
}

export const EXACT_CATEGORIES: CategoryName[] = [
  "Cosmetics",
  "Women's Unstitched",
  "Women's Stitched",
  "Men's Unstitched",
  "Kids Clothing",
  "Women's Handbags",
  "Men's Stitched",
  "Kids Accessories",
  "Jewellery",
  "Kitchenware",
  "Fashion Accessories",
  "Home Essentials",
  "Bedding",
  "Shoes",
  "Festive Collection",
  "Home Decor",
  "Islamic Accessories",
  "Mother & Baby",
  "Women Undergarments",
  "Men's Undergarments",
  "Books & Stationery",
  "Electronic Accessories",
  "Perfumes",
  "Men's Shawls",
  "Women's Shawls",
  "Bags",
  "Home Linen",
  "Auto & Bike Accessories",
  "Fitness",
  "Electronics",
  "Other"
];

// Helper to normalize string for category matching (case-insensitive, trims apostrophes & whitespace)
export function normalizeCategoryName(raw: string | undefined | null): CategoryName {
  if (!raw || typeof raw !== 'string') return "Other";
  const clean = raw.trim();

  // Exact match
  const foundExact = EXACT_CATEGORIES.find(c => c.toLowerCase() === clean.toLowerCase());
  if (foundExact) return foundExact;

  // Normalized comparison without apostrophe or hyphens
  const simplified = clean.toLowerCase().replace(/['’`\-_]/g, '').replace(/\s+/g, ' ');
  for (const cat of EXACT_CATEGORIES) {
    const catSimp = cat.toLowerCase().replace(/['’`\-_]/g, '').replace(/\s+/g, ' ');
    if (catSimp === simplified) return cat;
  }

  // Keyword heuristic matching
  if (/cosmetic|makeup|lipstick|beauty|skincare/i.test(clean)) return "Cosmetics";
  if (/women.*unstitched|ladies.*unstitched|lawn/i.test(clean)) return "Women's Unstitched";
  if (/women.*stitched|pret|kurti/i.test(clean)) return "Women's Stitched";
  if (/men.*unstitched|gents.*unstitched|latha/i.test(clean)) return "Men's Unstitched";
  if (/men.*stitched|gents.*kurta|waistcoat/i.test(clean)) return "Men's Stitched";
  if (/kids.*cloth|baby.*cloth|children.*cloth/i.test(clean)) return "Kids Clothing";
  if (/kids.*acc|baby.*acc|children.*acc/i.test(clean)) return "Kids Accessories";
  if (/jewel|necklace|ring|earring|choker|bangle/i.test(clean)) return "Jewellery";
  if (/handbag|clutch|tote/i.test(clean)) return "Women's Handbags";
  if (/bag|backpack/i.test(clean)) return "Bags";
  if (/kitchen|pan|knife|cook/i.test(clean)) return "Kitchenware";
  if (/bedding|bedsheet|quilt|pillow/i.test(clean)) return "Bedding";
  if (/shoe|khussa|sandal|heel|sneaker/i.test(clean)) return "Shoes";
  if (/festive|wedding|eid/i.test(clean)) return "Festive Collection";
  if (/home.*decor|wall.*art|vase/i.test(clean)) return "Home Decor";
  if (/islamic|janamaz|tasbeeh/i.test(clean)) return "Islamic Accessories";
  if (/mother|baby|newborn/i.test(clean)) return "Mother & Baby";
  if (/women.*under|bra|pant/i.test(clean)) return "Women Undergarments";
  if (/men.*under|boxer|vest|brief/i.test(clean)) return "Men's Undergarments";
  if (/stationery|book|pen|journal/i.test(clean)) return "Books & Stationery";
  if (/electronic.*acc|charger|cable|earbud|airpod/i.test(clean)) return "Electronic Accessories";
  if (/electronic|gadget|smart watch/i.test(clean)) return "Electronics";
  if (/perfume|attar|fragrance|oud/i.test(clean)) return "Perfumes";
  if (/men.*shawl|gents.*shawl/i.test(clean)) return "Men's Shawls";
  if (/women.*shawl|ladies.*shawl|stole/i.test(clean)) return "Women's Shawls";
  if (/linen|curtain|towel|cushion/i.test(clean)) return "Home Linen";
  if (/auto|car|bike/i.test(clean)) return "Auto & Bike Accessories";
  if (/fitness|gym|workout|yoga/i.test(clean)) return "Fitness";
  if (/home/i.test(clean)) return "Home Essentials";

  return "Other";
}

export const CATEGORIES: CategoryInfo[] = [
  {
    name: "Cosmetics",
    iconName: "Sparkles",
    description: "Premium skincare, makeup palettes & lipsticks",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Women's Unstitched",
    iconName: "Scissors",
    description: "Embroidered lawn, chiffon, silk & cotton suits",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Women's Stitched",
    iconName: "Shirt",
    description: "Ready-to-wear kurtis, frocks & luxury pret",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Men's Unstitched",
    iconName: "Layers",
    description: "Wash & wear, latha, blended fabrics & boski",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Kids Clothing",
    iconName: "Baby",
    description: "Comfortable festive & daily wear for boys & girls",
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Women's Handbags",
    iconName: "ShoppingBag",
    description: "Totes, clutches, crossbody & shoulder bags",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Men's Stitched",
    iconName: "User",
    description: "Designer kurtas, shalwar kameez & waistcoats",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Kids Accessories",
    iconName: "Smile",
    description: "Hairbands, clips, mini bags & school essentials",
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Jewellery",
    iconName: "Gem",
    description: "Kundan, zirconia, antique gold & bridal sets",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Kitchenware",
    iconName: "Utensils",
    description: "Non-stick sets, slicers, dinnerware & organizers",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Fashion Accessories",
    iconName: "Watch",
    description: "Watches, belts, sunglasses & scarves",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Home Essentials",
    iconName: "Home",
    description: "Storage solutions, cleaning aids & utilities",
    image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Bedding",
    iconName: "Moon",
    description: "Bridal bedsheets, fitted sheets & quilts",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Shoes",
    iconName: "Footprints",
    description: "Traditional khussas, heels, slides & sneakers",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Festive Collection",
    iconName: "Crown",
    description: "Eid, wedding & party wear heavy formals",
    image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Home Decor",
    iconName: "Palette",
    description: "Wall clocks, vases, islamic frames & lamps",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Islamic Accessories",
    iconName: "BookOpen",
    description: "Prayer mats (Janamaz), digital tasbeehs & Quran boxes",
    image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Mother & Baby",
    iconName: "Heart",
    description: "Baby care sets, blankets, carriers & essentials",
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Women Undergarments",
    iconName: "Shield",
    description: "Comfort bras, loungewear & shapewear",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Men's Undergarments",
    iconName: "ShieldCheck",
    description: "Premium cotton vests, briefs & boxers",
    image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Books & Stationery",
    iconName: "Bookmark",
    description: "Journals, luxury pens, islamic literature & art supplies",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Electronic Accessories",
    iconName: "Headphones",
    description: "Earbuds, fast chargers, cables & power banks",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Perfumes",
    iconName: "Wind",
    description: "Long-lasting Arabic attars, French & oriental EDPs",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Men's Shawls",
    iconName: "Feather",
    description: "Pure wool, pashmina & traditional gents shawls",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Women's Shawls",
    iconName: "Sparkle",
    description: "Embroidered velvet, woollen & jacquard stoles",
    image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Bags",
    iconName: "Briefcase",
    description: "Backpacks, laptop sleeves & travel duffels",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Home Linen",
    iconName: "Grid",
    description: "Curtains, tablecloths, cushion covers & runners",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Auto & Bike Accessories",
    iconName: "Compass",
    description: "Car phone mounts, keychains, covers & car perfumes",
    image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Fitness",
    iconName: "Activity",
    description: "Resistance bands, yoga mats, waist trimmers & shakers",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Electronics",
    iconName: "Cpu",
    description: "Smart watches, mini blenders, hair trimmers & gadgets",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "Other",
    iconName: "MoreHorizontal",
    description: "Trending novelties, gifts & seasonal specials",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80"
  }
];
