import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  const { data, error } = await supabase.from("items").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = data || [];
  const soldItems = items.filter((i) => i.status === "sold");
  const unsoldItems = items.filter((i) => i.status === "unsold");
  const listedItems = items.filter((i) => i.status === "listed");

  const totalSpent = items.reduce((s: number, i) => s + (i.purchase_price ?? 0), 0);
  const totalRevenue = soldItems.reduce((s: number, i) => s + (i.sale_price ?? 0), 0);
  const totalProfit = totalRevenue - soldItems.reduce((s: number, i) => s + i.purchase_price, 0);
  const inventoryValue = [...unsoldItems, ...listedItems].reduce((s: number, i) => s + i.purchase_price, 0);

  const avgROI =
    soldItems.length > 0
      ? soldItems.reduce((s: number, i) => {
          const roi = i.purchase_price > 0 ? ((i.sale_price! - i.purchase_price) / i.purchase_price) * 100 : 0;
          return s + roi;
        }, 0) / soldItems.length
      : 0;

  const categoryStats: Record<string, { profit: number; count: number }> = {};
  for (const item of soldItems) {
    const profit = (item.sale_price ?? 0) - item.purchase_price;
    if (!categoryStats[item.category]) categoryStats[item.category] = { profit: 0, count: 0 };
    categoryStats[item.category].profit += profit;
    categoryStats[item.category].count += 1;
  }
  const bestCategory = Object.entries(categoryStats).sort((a, b) => b[1].profit - a[1].profit)[0]?.[0] ?? null;

  const storeStats: Record<string, { profit: number; count: number }> = {};
  for (const item of soldItems) {
    const profit = (item.sale_price ?? 0) - item.purchase_price;
    if (!storeStats[item.store]) storeStats[item.store] = { profit: 0, count: 0 };
    storeStats[item.store].profit += profit;
    storeStats[item.store].count += 1;
  }
  const bestStore = Object.entries(storeStats).sort((a, b) => b[1].profit - a[1].profit)[0]?.[0] ?? null;

  return NextResponse.json({
    totalItems: items.length,
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
