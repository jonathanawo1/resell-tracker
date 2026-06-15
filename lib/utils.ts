export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function calcProfit(purchasePrice: number, salePrice: number): number {
  return salePrice - purchasePrice;
}

export function calcROI(purchasePrice: number, salePrice: number): number {
  if (purchasePrice === 0) return 0;
  return ((salePrice - purchasePrice) / purchasePrice) * 100;
}

export function calcMargin(purchasePrice: number, salePrice: number): number {
  if (salePrice === 0) return 0;
  return ((salePrice - purchasePrice) / salePrice) * 100;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const CATEGORIES = [
  "Sneakers",
  "Clothing",
  "Electronics",
  "Trading Cards",
  "Collectibles",
  "Accessories",
  "Bags",
  "Watches",
  "Games",
  "Books",
  "General",
];

export const PLATFORMS = [
  "eBay",
  "StockX",
  "GOAT",
  "Depop",
  "Poshmark",
  "Facebook Marketplace",
  "Grailed",
  "Mercari",
  "Other",
];
