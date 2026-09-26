export type CategoryName =
  | "Cosmetics"
  | "Women's Unstitched"
  | "Women's Stitched"
  | "Men's Unstitched"
  | "Kids Clothing"
  | "Women's Handbags"
  | "Men's Stitched"
  | "Kids Accessories"
  | "Jewellery"
  | "Kitchenware"
  | "Fashion Accessories"
  | "Home Essentials"
  | "Bedding"
  | "Shoes"
  | "Festive Collection"
  | "Home Decor"
  | "Islamic Accessories"
  | "Mother & Baby"
  | "Women Undergarments"
  | "Men's Undergarments"
  | "Books & Stationery"
  | "Electronic Accessories"
  | "Perfumes"
  | "Men's Shawls"
  | "Women's Shawls"
  | "Bags"
  | "Home Linen"
  | "Auto & Bike Accessories"
  | "Fitness"
  | "Electronics"
  | "Other";

export interface Product {
  id: string; // Unique Product ID (e.g. BM001 or custom)
  name: string; // Product Name
  category: CategoryName; // Category
  description: string; // Full Product Description
  shortDescription?: string; // Optional short summary
  image: string; // Main primary image (URL or data URI)
  images: string[]; // Unlimited Multiple Images array
  price: number; // Original Price in PKR
  discountPrice?: number | null; // Optional Discount Price in PKR (products.discount_price)
  salePrice: number; // Effective Selling Price in PKR
  discountPercent?: number; // Discount percentage
  stock: number; // Quantity / Stock
  status: 'in_stock' | 'low_stock' | 'out_of_stock'; // Stock Status
  sizes?: string[]; // Optional multiple sizes (e.g., S, M, L, XL or custom)
  colors?: string[]; // Optional multiple colors (e.g., Black, Gold, Maroon)
  sku?: string; // Product SKU (optional)
  slug?: string; // Clean URL slug for /product/slug or /product/id
  createdAt?: string; // Creation timestamp
  updatedAt?: string; // Update timestamp
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
}

export type ActivePage = 'home' | 'shop' | 'categories' | 'about' | 'contact' | 'admin';

export interface ImportPreviewItem {
  id: string;
  name: string;
  category: CategoryName;
  description: string;
  image: string;
  images: string[];
  price: number;
  salePrice: number;
  stock: number;
  sizes?: string[];
  colors?: string[];
  sku?: string;
  isValid: boolean;
  validationError?: string;
  statusConflict?: 'exists' | 'new';
}

export interface ImportReport {
  totalParsed: number;
  successCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: { rowNumber: number; id?: string; name?: string; message: string }[];
}
