import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

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

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from("items").select("*").eq("id", params.id).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: toItem(data) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (body.name !== undefined) update.name = body.name;
  if (body.store !== undefined) update.store = body.store;
  if (body.category !== undefined) update.category = body.category;
  if (body.purchasePrice !== undefined) update.purchase_price = parseFloat(body.purchasePrice);
  if (body.purchaseDate !== undefined) update.purchase_date = body.purchaseDate;
  if (body.salePrice !== undefined) update.sale_price = body.salePrice ? parseFloat(body.salePrice) : null;
  if (body.saleDate !== undefined) update.sale_date = body.saleDate || null;
  if (body.status !== undefined) update.status = body.status;
  if (body.platform !== undefined) update.platform = body.platform || null;
  if (body.notes !== undefined) update.notes = body.notes || null;

  const { data, error } = await supabase.from("items").update(update).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: toItem(data) });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from("items").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
