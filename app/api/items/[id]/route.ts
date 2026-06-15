import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.item.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.store !== undefined) data.store = body.store;
  if (body.category !== undefined) data.category = body.category;
  if (body.purchasePrice !== undefined) data.purchasePrice = parseFloat(body.purchasePrice);
  if (body.purchaseDate !== undefined) data.purchaseDate = new Date(body.purchaseDate);
  if (body.salePrice !== undefined) data.salePrice = body.salePrice ? parseFloat(body.salePrice) : null;
  if (body.saleDate !== undefined) data.saleDate = body.saleDate ? new Date(body.saleDate) : null;
  if (body.status !== undefined) data.status = body.status;
  if (body.platform !== undefined) data.platform = body.platform || null;
  if (body.notes !== undefined) data.notes = body.notes || null;

  const item = await prisma.item.update({ where: { id: params.id }, data });
  return NextResponse.json({ item });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.item.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
