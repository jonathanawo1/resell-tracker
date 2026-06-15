"use client";
import { useState } from "react";
import { formatCurrency, calcProfit, calcROI, PLATFORMS } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  purchasePrice: number;
}

interface Props {
  item: Item;
  onClose: () => void;
  onSaved: () => void;
}

export default function SellModal({ item, onClose, onSaved }: Props) {
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [platform, setPlatform] = useState("");
  const [saving, setSaving] = useState(false);

  const price = parseFloat(salePrice) || 0;
  const profit = price > 0 ? calcProfit(item.purchasePrice, price) : null;
  const roi = price > 0 ? calcROI(item.purchasePrice, price) : null;

  async function save() {
    if (!salePrice) return;
    setSaving(true);
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salePrice: parseFloat(salePrice),
        saleDate,
        platform: platform || null,
        status: "sold",
      }),
    });
    onSaved();
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Mark as Sold</h2>
          <button onClick={onClose} style={{ background: "none", color: "var(--muted)", fontSize: 20, padding: "4px 8px" }}>✕</button>
        </div>

        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
          {item.name} · Paid {formatCurrency(item.purchasePrice)}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Sale Price *</label>
            <input
              type="number"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Sale Date</label>
            <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="">Select platform...</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {profit !== null && (
            <div
              style={{
                background: profit >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${profit >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                borderRadius: 10,
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>PROFIT</p>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: profit >= 0 ? "var(--green)" : "var(--red)",
                  }}
                >
                  {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>ROI</p>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: roi! >= 0 ? "var(--green)" : "var(--red)",
                  }}
                >
                  {roi! >= 0 ? "+" : ""}{roi!.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          <button
            className="btn-primary"
            onClick={save}
            disabled={saving || !salePrice}
            style={{ padding: "13px", fontSize: 15 }}
          >
            {saving ? "Saving..." : "Confirm Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}
