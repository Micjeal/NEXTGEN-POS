import type { CartItem, Product } from "@/lib/types/database"

export function calculateLineTotal(product: Product, quantity: number, discount = 0): number {
  const subtotal = product.price * quantity
  const discountAmount = discount
  const taxableAmount = subtotal - discountAmount
  const tax = taxableAmount * (product.tax_rate / 100)
  return taxableAmount + tax
}

export function calculateLineTax(product: Product, quantity: number, discount = 0): number {
  const subtotal = product.price * quantity
  const discountAmount = discount
  const taxableAmount = subtotal - discountAmount
  return taxableAmount * (product.tax_rate / 100)
}

export function calculateCartTotals(items: CartItem[]) {
  let subtotal = 0
  let taxAmount = 0
  let discountAmount = 0

  for (const item of items) {
    const lineSubtotal = item.product.price * item.quantity
    const lineTax = calculateLineTax(item.product, item.quantity, item.discount)

    subtotal += lineSubtotal
    taxAmount += lineTax
    discountAmount += item.discount
  }

  const total = subtotal + taxAmount - discountAmount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

export function formatCurrency(amount: number, currency: string = "UGX"): string {
  const locale = currency === "UGX" ? "en-UG" : "en-US"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount)
}
