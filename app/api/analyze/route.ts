import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a receipt and order confirmation parser for a reseller tracker app.
Extract purchase details from the provided image or text and return ONLY valid JSON.

Return this exact structure:
{
  "name": "item name/description",
  "store": "store or retailer name",
  "purchasePrice": 0.00,
  "purchaseDate": "YYYY-MM-DD",
  "category": "one of: Sneakers, Clothing, Electronics, Trading Cards, Collectibles, Accessories, Bags, Watches, Games, Books, General",
  "notes": "any relevant notes like size, color, model number, order number"
}

Rules:
- purchasePrice must be a number (the total paid including tax/shipping if shown)
- purchaseDate must be YYYY-MM-DD format; if unclear use today's date
- For category, make your best guess based on the item
- If multiple items, focus on the most expensive or primary item
- notes should include order number if visible
- Return ONLY the JSON object, no markdown, no explanation`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string | null;

    if (!file && !text) {
      return NextResponse.json({ error: "No file or text provided" }, { status: 400 });
    }

    let message;

    if (file) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

      message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: "Extract the purchase details from this receipt or order confirmation.",
              },
            ],
          },
        ],
      });
    } else {
      message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Extract purchase details from this text:\n\n${text}`,
          },
        ],
      });
    }

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response from AI" }, { status: 500 });
    }

    let parsed;
    try {
      // Strip potential markdown code fences
      const cleaned = content.text.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Could not parse AI response", raw: content.text }, { status: 422 });
    }

    return NextResponse.json({ data: parsed });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
