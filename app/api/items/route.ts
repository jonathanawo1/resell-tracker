import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "createdAt_desc";

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (category && category !== "all") where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { store: { contains: search } },
      { notes: { contains: search } },
    ];
  }

  const [field, direction] = sort.split("_");
  const orderBy: Record<string, string> = { [field]: direction };

  const items = await prisma.item.findMany({
    where,
    orderBy,
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name, store, category, purchasePrice, purchaseDate,
    salePrice, saleDate, status, platform, notes,
  } = body;

  if (!name || !store || purchasePrice == null || !purchaseDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const item = await prisma.item.create({
    data: {
      name,
      store,
      category: category || "General",
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate: new Date(purchaseDate),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      saleDate: saleDate ? new Date(saleDate) : null,
      status: status || "unsold",
      platform: platform || null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
