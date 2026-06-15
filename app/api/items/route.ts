import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "created_at_desc";

  let query = supabase.from("items").select("*");

  if (status && status !== "all") query = query.eq("status", status);
  if (category && category !== "all") query = query.eq("category", category);
  if (search) {
    query = query.or(`name.ilike.%${search}%,store.ilike.%${search}%,notes.ilike.%${search}%`);
  }

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    createdAt_desc: { column: "created_at", ascending: false },
    createdAt_asc: { column: "created_at", ascending: true },
    purchasePrice_desc: { column: "purchase_price", ascending: false },
    purchasePrice_asc: { column: "purchase_price", ascending: true },
    purchaseDate_desc: { column: "purchase_date", ascending: false },
  };
  const { column, ascending } = sortMap[sort] || sortMap.createdAt_desc;
  query = query.order(column, { ascending });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data || []).map(toItem);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, store, category, purchasePrice, purchaseDate, salePrice, saleDate, status, platform, notes } = body;

  if (!name || !store || purchasePrice == null || !purchaseDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase.from("items").insert({
    name,
    store,
    category: category || "General",
    purchase_price: parseFloat(purchasePrice),
    purchase_date: purchaseDate,
    sale_price: salePrice ? parseFloat(salePrice) : null,
    sale_date: saleDate || null,
    status: status || "unsold",
    platform: platform || null,
    notes: notes || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: toItem(data) }, { status: 201 });
}

function toItem(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    store: row.store,
    category: row.category,
    purchasePrice: row.purchase_price,
    purchaseDate: row.purchase_date,
    salePrice: row.sale_price ?? null,
    saleDate: row.sale_date ?? null,
    status: row.status,
    platform: row.platform ?? null,
    notes: row.notes ?? null,
  };
}
