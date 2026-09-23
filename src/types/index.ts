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
  id: string; // Unique Product ID (e.g. BM001)
  name: string; // Product Name
  category: CategoryName; // Category
  description: string; // Product Description
  shortDescription?: string; // Optional short summary
  image: string; // Primary image URL or stored Base64
  images: string[]; // Multiple Product Images array
  price: number; // Original Price in PKR
  salePrice: number; // Sale Price in PKR
  discountPercent?: number; // Calculated or specified discount percentage
  stock: number; // Stock Quantity
  status: 'in_stock' | 'low_stock' | 'out_of_stock'; // Stock Status
  featured: boolean; // Featured Product boolean
  newArrival: boolean; // New Arrival boolean
  rating?: number; // Product Rating (optional)
  reviewsCount?: number; // Number of reviews (optional)
  sku?: string; // Product SKU (optional)
  createdAt?: string; // Creation timestamp
}

export interface CartItem {
  product: Product;
  quantity: number;
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
  featured: boolean;
  newArrival: boolean;
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
