import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.item.findMany();

  const totalItems = items.length;
  const soldItems = items.filter((i) => i.status === "sold");
  const unsoldItems = items.filter((i) => i.status === "unsold");
  const listedItems = items.filter((i) => i.status === "listed");

  const totalSpent = items.reduce((s, i) => s + i.purchasePrice, 0);
  const totalRevenue = soldItems.reduce((s, i) => s + (i.salePrice ?? 0), 0);
  const totalProfit = totalRevenue - soldItems.reduce((s, i) => s + i.purchasePrice, 0);
  const inventoryValue = [...unsoldItems, ...listedItems].reduce((s, i) => s + i.purchasePrice, 0);

  const avgROI =
    soldItems.length > 0
      ? soldItems.reduce((s, i) => {
          const roi = i.purchasePrice > 0 ? ((i.salePrice! - i.purchasePrice) / i.purchasePrice) * 100 : 0;
          return s + roi;
        }, 0) / soldItems.length
      : 0;

  const categoryStats: Record<string, { profit: number; count: number }> = {};
  for (const item of soldItems) {
    const profit = (item.salePrice ?? 0) - item.purchasePrice;
    if (!categoryStats[item.category]) categoryStats[item.category] = { profit: 0, count: 0 };
    categoryStats[item.category].profit += profit;
    categoryStats[item.category].count += 1;
  }
  const bestCategory = Object.entries(categoryStats).sort((a, b) => b[1].profit - a[1].profit)[0]?.[0] ?? null;

  const storeStats: Record<string, { profit: number; count: number }> = {};
  for (const item of soldItems) {
    const profit = (item.salePrice ?? 0) - item.purchasePrice;
    if (!storeStats[item.store]) storeStats[item.store] = { profit: 0, count: 0 };
    storeStats[item.store].profit += profit;
    storeStats[item.store].count += 1;
  }
  const bestStore = Object.entries(storeStats).sort((a, b) => b[1].profit - a[1].profit)[0]?.[0] ?? null;

  return NextResponse.json({
    totalItems,
    soldCount: soldItems.length,
    unsoldCount: unsoldItems.length,
    listedCount: listedItems.length,
    totalSpent,
    totalRevenue,
    totalProfit,
    inventoryValue,
    avgROI,
    bestCategory,
    bestStore,
    categoryStats,
    storeStats,
  });
}
