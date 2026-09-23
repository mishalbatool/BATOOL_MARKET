import { Product, CartItem, CustomerDetails } from '../types';

export const WHATSAPP_NUMBER_DISPLAY = "03015954967";
export const WHATSAPP_PHONE_INTL = "923015954967"; // Pakistan country code +92 without leading 0

/**
 * Creates a direct wa.me link with URL-encoded message
 */
export function createWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_PHONE_INTL}?text=${encoded}`;
}

/**
 * Builds WhatsApp message for a single product order
 */
export function getSingleProductWhatsAppLink(
  product: Product,
  quantity: number = 1,
  customer?: Partial<CustomerDetails>
): string {
  const lineTotal = product.salePrice * quantity;

  let msg = `Assalam o Alaikum Batool Market, I would like to order:\n\n`;
  msg += `📦 *Product:* ${product.name}\n`;
  msg += `🏷️ *Category:* ${product.category}\n`;
  msg += `💰 *Unit Price:* Rs. ${product.salePrice.toLocaleString()}\n`;
  msg += `🔢 *Quantity:* ${quantity}\n`;
  msg += `💵 *Subtotal:* Rs. ${lineTotal.toLocaleString()}\n`;
  msg += `🚚 *Delivery:* FREE DELIVERY ALL OVER PAKISTAN\n`;
  msg += `💳 *Payment Method:* Cash on Delivery (COD)\n\n`;

  msg += `*Customer Details:*\n`;
  msg += `👤 *Name:* ${customer?.name ? customer.name.trim() : '____________________'}\n`;
  msg += `📱 *Phone:* ${customer?.phone ? customer.phone.trim() : '____________________'}\n`;
  msg += `🏙️ *City:* ${customer?.city ? customer.city.trim() : '____________________'}\n`;
  msg += `🏠 *Complete Address:* ${customer?.address ? customer.address.trim() : '____________________'}\n`;

  if (customer?.notes?.trim()) {
    msg += `📝 *Notes:* ${customer.notes.trim()}\n`;
  }

  msg += `\nPlease confirm my order.`;

  return createWhatsAppUrl(msg);
}

/**
 * Builds WhatsApp message for the entire cart
 */
export function getCartWhatsAppLink(
  items: CartItem[],
  customer?: Partial<CustomerDetails>
): string {
  if (items.length === 0) {
    return createWhatsAppUrl("Assalam o Alaikum Batool Market, I need assistance with ordering.");
  }

  const totalAmount = items.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  let msg = `Assalam o Alaikum Batool Market, I would like to order the following items:\n\n`;
  msg += `📋 *ORDER SUMMARY:*\n`;

  items.forEach((item, index) => {
    const itemTotal = item.product.salePrice * item.quantity;
    msg += `${index + 1}. *${item.product.name}*\n   Qty: ${item.quantity} × Rs. ${item.product.salePrice.toLocaleString()} = Rs. ${itemTotal.toLocaleString()}\n`;
  });

  msg += `\n--------------------------------\n`;
  msg += `📦 *Total Quantity:* ${totalItemsCount} item(s)\n`;
  msg += `🚚 *Delivery:* FREE DELIVERY ALL OVER PAKISTAN\n`;
  msg += `💰 *Total Payable:* Rs. ${totalAmount.toLocaleString()}\n`;
  msg += `💵 *Payment:* Cash on Delivery (COD)\n\n`;

  msg += `*CUSTOMER DETAILS:*\n`;
  msg += `👤 *Name:* ${customer?.name ? customer.name.trim() : '____________________'}\n`;
  msg += `📱 *Phone:* ${customer?.phone ? customer.phone.trim() : '____________________'}\n`;
  msg += `🏙️ *City:* ${customer?.city ? customer.city.trim() : '____________________'}\n`;
  msg += `🏠 *Complete Address:* ${customer?.address ? customer.address.trim() : '____________________'}\n`;

  if (customer?.notes?.trim()) {
    msg += `📝 *Special Instructions:* ${customer.notes.trim()}\n`;
  }

  msg += `\nPlease confirm my order.`;

  return createWhatsAppUrl(msg);
}

/**
 * Direct inquiry link
 */
export function getSupportWhatsAppLink(subject?: string): string {
  let msg = `Assalam o Alaikum Batool Market, `;
  if (subject) {
    msg += `I have a question about: "${subject}". Can you please help me?`;
  } else {
    msg += `I would like to enquire about your products and Cash on Delivery service.`;
  }
  return createWhatsAppUrl(msg);
}
