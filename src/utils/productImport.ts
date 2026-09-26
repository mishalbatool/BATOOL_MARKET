import * as XLSX from 'xlsx';
import { Product, CategoryName, ImportPreviewItem, ImportReport } from '../types';
import { normalizeCategoryName } from '../data/categories';
import { IMAGE_UNAVAILABLE_FALLBACK } from './storage';

export const TEMPLATE_COLUMNS = [
  'Product ID',
  'Product Name',
  'Category',
  'Description',
  'Image',
  'Image 2',
  'Image 3',
  'Original Price',
  'Sale Price',
  'Stock',
  'Featured',
  'New Arrival',
  'SKU'
];

/**
 * Downloads a sample CSV or Excel template for bulk product import
 */
export function downloadImportTemplate(format: 'csv' | 'xlsx' = 'csv') {
  const sampleRows = [
    {
      'Product ID': 'BM001',
      'Product Name': 'Velvet Matte Long-Wear Lipstick',
      'Category': 'Cosmetics',
      'Description': 'Ultra-pigmented velvety smooth finish for all-day comfort.',
      'Image': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
      'Image 2': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
      'Image 3': '',
      'Original Price': 2500,
      'Sale Price': 1999,
      'Stock': 20,
      'Featured': 'TRUE',
      'New Arrival': 'TRUE',
      'SKU': 'BM-LIP-01'
    },
    {
      'Product ID': 'BM002',
      'Product Name': 'Embroidered Luxury Lawn 3-Piece',
      'Category': "Women's Unstitched",
      'Description': 'Premium lawn shirt with embroidered neckline, printed chiffon dupatta and dyed trousers.',
      'Image': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      'Image 2': '',
      'Image 3': '',
      'Original Price': 4500,
      'Sale Price': 3800,
      'Stock': 15,
      'Featured': 'TRUE',
      'New Arrival': 'FALSE',
      'SKU': 'BM-WL-02'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: TEMPLATE_COLUMNS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products_Template');

  if (format === 'xlsx') {
    XLSX.writeFile(workbook, 'Batool_Market_Product_Import_Template.xlsx');
  } else {
    XLSX.writeFile(workbook, 'Batool_Market_Product_Import_Template.csv', { bookType: 'csv' });
  }
}

/**
 * Parses a file (CSV or XLSX) into raw row objects
 */
export async function parseImportFile(file: File): Promise<any[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded file does not contain any sheets.');
  }
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  return jsonData;
}

/**
 * Helper to safely extract field regardless of case or spacing in header names
 */
function getFieldValue(row: any, ...aliases: string[]): any {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== '') return row[alias];
    // check case insensitive
    const lowerAlias = alias.toLowerCase().replace(/[\s_\-]/g, '');
    for (const key of Object.keys(row)) {
      const lowerKey = key.toLowerCase().replace(/[\s_\-]/g, '');
      if (lowerKey === lowerAlias) {
        if (row[key] !== undefined && row[key] !== '') return row[key];
      }
    }
  }
  return '';
}

function parseBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1' || s === 'y';
}

function parseNum(val: any, fallback: number = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? fallback : n;
}

/**
 * Validates and converts raw row objects to ImportPreviewItem
 */
export function processRawRowsForPreview(
  rawRows: any[],
  existingProducts: Product[]
): {
  items: ImportPreviewItem[];
  errors: { rowNumber: number; id?: string; name?: string; message: string }[];
} {
  const existingIdSet = new Set(existingProducts.map(p => p.id.toLowerCase().trim()));
  const existingSkuSet = new Set(existingProducts.filter(p => p.sku).map(p => p.sku!.toLowerCase().trim()));

  const items: ImportPreviewItem[] = [];
  const errors: { rowNumber: number; id?: string; name?: string; message: string }[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // header is row 1 in spreadsheet

    const rawId = String(getFieldValue(row, 'Product ID', 'ProductID', 'ID', 'Id', 'id') || '').trim();
    const rawName = String(getFieldValue(row, 'Product Name', 'ProductName', 'Name', 'Title') || '').trim();
    const rawCategory = getFieldValue(row, 'Category', 'category', 'Department');
    const rawDesc = String(getFieldValue(row, 'Description', 'description', 'Desc') || '').trim();
    const rawImg1 = String(getFieldValue(row, 'Image', 'Image 1', 'Image1', 'image', 'Photo') || '').trim();
    const rawImg2 = String(getFieldValue(row, 'Image 2', 'Image2', 'Photo2') || '').trim();
    const rawImg3 = String(getFieldValue(row, 'Image 3', 'Image3', 'Photo3') || '').trim();
    const rawPrice = getFieldValue(row, 'Original Price', 'Price', 'OriginalPrice', 'MRP');
    const rawSalePrice = getFieldValue(row, 'Sale Price', 'SalePrice', 'DiscountPrice', 'OfferPrice');
    const rawStock = getFieldValue(row, 'Stock', 'Quantity', 'Qty', 'stock');
    const rawSku = String(getFieldValue(row, 'SKU', 'Sku', 'sku') || '').trim();

    // Check minimum required
    if (!rawName) {
      errors.push({
        rowNumber: rowNum,
        id: rawId,
        name: '(Empty name)',
        message: 'Product Name is missing or empty.'
      });
      return;
    }

    const id = rawId || `BM-${Date.now().toString().slice(-4)}${idx + 1}`;
    const category: CategoryName = normalizeCategoryName(rawCategory);

    const price = Math.max(0, parseNum(rawPrice, 0));
    let salePrice = parseNum(rawSalePrice, price > 0 ? price : 0);
    if (salePrice <= 0 && price > 0) salePrice = price;
    if (price <= 0 && salePrice > 0) {
      // If original price not provided, default to sale price
    }
    const finalPrice = price > 0 ? price : salePrice;

    const stock = Math.max(0, Math.floor(parseNum(rawStock, 10)));

    // Images
    const images: string[] = [];
    if (rawImg1) images.push(rawImg1);
    if (rawImg2) images.push(rawImg2);
    if (rawImg3) images.push(rawImg3);
    const primaryImage = images.length > 0 ? images[0] : IMAGE_UNAVAILABLE_FALLBACK;

    // Check duplicate
    const existsById = existingIdSet.has(id.toLowerCase());
    const existsBySku = rawSku ? existingSkuSet.has(rawSku.toLowerCase()) : false;
    const isConflict = existsById || existsBySku;

    items.push({
      id,
      name: rawName,
      category,
      description: rawDesc,
      image: primaryImage,
      images: images.length > 0 ? images : [primaryImage],
      price: finalPrice,
      salePrice: salePrice > 0 ? salePrice : finalPrice,
      stock,
      sku: rawSku || undefined,
      isValid: true,
      statusConflict: isConflict ? 'exists' : 'new'
    });
  });

  return { items, errors };
}

/**
 * Converts ImportPreviewItem into a clean Product
 */
export function convertPreviewItemToProduct(item: ImportPreviewItem): Product {
  const discountPercent = item.price > item.salePrice
    ? Math.round(((item.price - item.salePrice) / item.price) * 100)
    : 0;

  const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
    item.stock <= 0 ? 'out_of_stock' : item.stock <= 5 ? 'low_stock' : 'in_stock';

  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description || `${item.name} available at Batool Market with Cash on Delivery across Pakistan.`,
    shortDescription: item.description ? item.description.slice(0, 100) : '',
    image: item.image || IMAGE_UNAVAILABLE_FALLBACK,
    images: item.images && item.images.length > 0 ? item.images : [item.image || IMAGE_UNAVAILABLE_FALLBACK],
    price: item.price,
    salePrice: item.salePrice,
    discountPercent,
    stock: item.stock,
    status,
    sku: item.sku,
    createdAt: new Date().toISOString()
  };
}
