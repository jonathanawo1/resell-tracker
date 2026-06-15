"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency, formatDate, calcProfit, calcROI } from "@/lib/utils";
import AddItemModal from "@/components/AddItemModal";
import SellModal from "@/components/SellModal";

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

function ItemsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [sellItem, setSellItem] = useState<Item | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("createdAt_desc");

  const loadItems = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    params.set("sort", sort);

    fetch(`/api/items?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, [status, category, search, sort]);

  useEffect(() => { loadItems(); }, [loadItems]);

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    loadItems();
  }

  const totalSpent = items.reduce((s, i) => s + i.purchasePrice, 0);
  const totalProfit = items
    .filter((i) => i.status === "sold")
    .reduce((s, i) => s + calcProfit(i.purchasePrice, i.salePrice ?? 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: 18, color: "var(--green)", textDecoration: "none" }}>
            💰 ResellTracker
          </Link>
          <div style={{ display: "flex", gap: 4 }}>
            <Link href="/" style={{ padding: "6px 14px", borderRadius: 8, color: "var(--muted)", textDecoration: "none", fontSize: 14 }}>
              Dashboard
            </Link>
            <Link href="/items" style={{ padding: "6px 14px", borderRadius: 8, color: "var(--green)", background: "rgba(34,197,94,0.1)", textDecoration: "none", fontSize: 14 }}>
              Inventory
            </Link>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Add Item
        </button>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Inventory</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
              {items.length} items · Spent {formatCurrency(totalSpent)} · Profit {" "}
              <span style={{ color: totalProfit >= 0 ? "var(--green)" : "var(--red)" }}>
                {formatCurrency(totalProfit)}
              </span>
            </p>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <input
            placeholder="Search items, stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 260 }}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "auto" }}>
            <option value="all">All Status</option>
            <option value="unsold">Unsold</option>
            <option value="listed">Listed</option>
            <option value="sold">Sold</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "auto" }}>
            <option value="all">All Categories</option>
            {["Sneakers","Clothing","Electronics","Trading Cards","Collectibles","Accessories","Bags","Watches","Games","Books","General"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: "auto" }}>
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="purchasePrice_desc">Highest Cost</option>
            <option value="purchasePrice_asc">Lowest Cost</option>
            <option value="purchaseDate_desc">Purchase Date ↓</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>Loading...</div>
        ) : items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "var(--muted)",
              background: "var(--surface)",
              borderRadius: 12,
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: 40, marginBottom: 12 }}>📦</p>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No items yet</p>
            <p style={{ marginBottom: 20 }}>Add your first purchase to get started</p>
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              + Add Item
            </button>
          </div>
        ) : (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Item", "Store", "Category", "Bought", "Sold For", "Profit", "ROI", "Status", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const profit = item.salePrice ? calcProfit(item.purchasePrice, item.salePrice) : null;
                  const roi = item.salePrice ? calcROI(item.purchasePrice, item.salePrice) : null;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{item.name}</div>
                        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                          {formatDate(item.purchaseDate)}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 14 }}>{item.store}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--muted)" }}>{item.category}</td>
                      <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 500 }}>
                        {formatCurrency(item.purchasePrice)}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 14 }}>
                        {item.salePrice ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{formatCurrency(item.salePrice)}</div>
                            {item.platform && (
                              <div style={{ fontSize: 11, color: "var(--muted)" }}>{item.platform}</div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>
                        {profit !== null ? (
                          <span className={profit >= 0 ? "profit-positive" : "profit-negative"}>
                            {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13 }}>
                        {roi !== null ? (
                          <span className={roi >= 0 ? "profit-positive" : "profit-negative"}>
                            {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span className={`badge badge-${item.status}`}>{item.status}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {item.status !== "sold" && (
                            <button
                              className="btn-secondary"
                              style={{ padding: "5px 10px", fontSize: 12 }}
                              onClick={() => setSellItem(item)}
                            >
                              Mark Sold
                            </button>
                          )}
                          <Link
                            href={`/items/${item.id}`}
                            style={{
                              padding: "5px 10px",
                              fontSize: 12,
                              background: "var(--surface2)",
                              border: "1px solid var(--border)",
                              borderRadius: 8,
                              color: "var(--muted)",
                              textDecoration: "none",
                            }}
                          >
                            Edit
                          </Link>
                          <button
                            className="btn-danger"
                            style={{ padding: "5px 8px", fontSize: 12 }}
                            onClick={() => deleteItem(item.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddItemModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadItems(); }}
        />
      )}
      {sellItem && (
        <SellModal
          item={sellItem}
          onClose={() => setSellItem(null)}
          onSaved={() => { setSellItem(null); loadItems(); }}
        />
      )}
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense>
      <ItemsContent />
    </Suspense>
  );
}
