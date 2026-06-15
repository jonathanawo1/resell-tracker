"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, calcProfit, calcROI, calcMargin, CATEGORIES, PLATFORMS } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  store: string;
  category: string;
  purchasePrice: number;
  purchaseDate: string;
  salePrice: number | null;
  saleDate: string | null;
  status: string;
  platform: string | null;
  notes: string | null;
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Item>>({});

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setItem(d.item);
        setForm({
          ...d.item,
          purchaseDate: d.item.purchaseDate?.slice(0, 10),
          saleDate: d.item.saleDate?.slice(0, 10) || "",
        });
      });
  }, [id]);

  const set = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const d = await res.json();
      setItem(d.item);
      alert("Saved!");
    }
    setSaving(false);
  }

  async function deleteItem() {
    if (!confirm("Delete this item permanently?")) return;
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    router.push("/items");
  }

  if (!item) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
      Loading...
    </div>
  );

  const profit = item.salePrice ? calcProfit(item.purchasePrice, item.salePrice) : null;
  const roi = item.salePrice ? calcROI(item.purchasePrice, item.salePrice) : null;
  const margin = item.salePrice ? calcMargin(item.purchasePrice, item.salePrice) : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: 18, color: "var(--green)", textDecoration: "none" }}>
            💰 ResellTracker
          </Link>
          <span style={{ color: "var(--muted)" }}>/</span>
          <Link href="/items" style={{ color: "var(--muted)", textDecoration: "none", fontSize: 14 }}>Inventory</Link>
          <span style={{ color: "var(--muted)" }}>/</span>
          <span style={{ fontSize: 14, color: "var(--text)" }}>{item.name}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-danger" onClick={deleteItem}>Delete</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats bar if sold */}
        {item.status === "sold" && profit !== null && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>Profit</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: profit >= 0 ? "var(--green)" : "var(--red)" }}>
                {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
              </p>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>ROI</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: roi! >= 0 ? "var(--green)" : "var(--red)" }}>
                {roi! >= 0 ? "+" : ""}{roi!.toFixed(1)}%
              </p>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>Margin</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: margin! >= 0 ? "var(--green)" : "var(--red)" }}>
                {margin!.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Purchase details */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Purchase Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Item Name</label>
                <input value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Store / Retailer</label>
                <input value={form.store || ""} onChange={(e) => set("store", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Category</label>
                <select value={form.category || "General"} onChange={(e) => set("category", e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Purchase Price</label>
                <input type="number" step="0.01" value={form.purchasePrice ?? ""} onChange={(e) => set("purchasePrice", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Purchase Date</label>
                <input type="date" value={form.purchaseDate as string || ""} onChange={(e) => set("purchaseDate", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sale details */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Sale Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Status</label>
                <select value={form.status || "unsold"} onChange={(e) => set("status", e.target.value)}>
                  <option value="unsold">Unsold</option>
                  <option value="listed">Listed</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Sale Price</label>
                <input type="number" step="0.01" value={form.salePrice ?? ""} onChange={(e) => set("salePrice", e.target.value || null)} placeholder="0.00" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Sale Date</label>
                <input type="date" value={form.saleDate as string || ""} onChange={(e) => set("saleDate", e.target.value || null)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Sold On Platform</label>
                <select value={form.platform || ""} onChange={(e) => set("platform", e.target.value || null)}>
                  <option value="">Select platform...</option>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Notes</label>
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={3}
                  placeholder="Size, color, order number..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Summary</h3>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            <div>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>Purchased</p>
              <p style={{ fontWeight: 600 }}>{formatDate(item.purchaseDate)} · {formatCurrency(item.purchasePrice)}</p>
            </div>
            {item.saleDate && (
              <div>
                <p style={{ color: "var(--muted)", fontSize: 12 }}>Sold</p>
                <p style={{ fontWeight: 600 }}>{formatDate(item.saleDate)} · {formatCurrency(item.salePrice!)}</p>
              </div>
            )}
            {item.saleDate && item.purchaseDate && (
              <div>
                <p style={{ color: "var(--muted)", fontSize: 12 }}>Days Held</p>
                <p style={{ fontWeight: 600 }}>
                  {Math.round((new Date(item.saleDate).getTime() - new Date(item.purchaseDate).getTime()) / 86400000)} days
                </p>
              </div>
            )}
            <div>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>Status</p>
              <span className={`badge badge-${item.status}`}>{item.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
