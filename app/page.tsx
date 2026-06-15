"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import AddItemModal from "@/components/AddItemModal";

interface Stats {
  totalItems: number;
  soldCount: number;
  unsoldCount: number;
  listedCount: number;
  totalSpent: number;
  totalRevenue: number;
  totalProfit: number;
  inventoryValue: number;
  avgROI: number;
  bestCategory: string | null;
  bestStore: string | null;
  categoryStats: Record<string, { profit: number; count: number }>;
  storeStats: Record<string, { profit: number; count: number }>;
}

function StatCard({
  label, value, sub, color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="card">
      <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color || "var(--text)" }}>{value}</p>
      {sub && <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const loadStats = () =>
    fetch("/api/stats").then((r) => r.json()).then(setStats);

  useEffect(() => { loadStats(); }, []);

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
          <span style={{ fontWeight: 700, fontSize: 18, color: "var(--green)" }}>
            💰 ResellTracker
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <Link
              href="/"
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                color: "var(--green)",
                background: "rgba(34,197,94,0.1)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Dashboard
            </Link>
            <Link
              href="/items"
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                color: "var(--muted)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Inventory
            </Link>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Add Item
        </button>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Overview</h1>
          <p style={{ color: "var(--muted)" }}>Track your reselling performance</p>
        </div>

        {stats ? (
          <>
            {/* Main stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 32,
              }}
            >
              <StatCard
                label="Total Profit"
                value={formatCurrency(stats.totalProfit)}
                color={stats.totalProfit >= 0 ? "var(--green)" : "var(--red)"}
                sub={`${stats.avgROI.toFixed(1)}% avg ROI`}
              />
              <StatCard
                label="Total Revenue"
                value={formatCurrency(stats.totalRevenue)}
                sub={`from ${stats.soldCount} sold`}
              />
              <StatCard
                label="Total Spent"
                value={formatCurrency(stats.totalSpent)}
                sub={`across ${stats.totalItems} items`}
              />
              <StatCard
                label="Inventory Value"
                value={formatCurrency(stats.inventoryValue)}
                sub={`${stats.unsoldCount} unsold · ${stats.listedCount} listed`}
              />
            </div>

            {/* Status breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
              {/* Category breakdown */}
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Profit by Category</h3>
                {Object.keys(stats.categoryStats).length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>No sales yet</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Object.entries(stats.categoryStats)
                      .sort((a, b) => b[1].profit - a[1].profit)
                      .slice(0, 6)
                      .map(([cat, data]) => {
                        const maxProfit = Math.max(
                          ...Object.values(stats.categoryStats).map((d) => d.profit)
                        );
                        const pct = maxProfit > 0 ? (data.profit / maxProfit) * 100 : 0;
                        return (
                          <div key={cat}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4,
                                fontSize: 13,
                              }}
                            >
                              <span>{cat}</span>
                              <span
                                style={{
                                  color: data.profit >= 0 ? "var(--green)" : "var(--red)",
                                  fontWeight: 600,
                                }}
                              >
                                {formatCurrency(data.profit)}
                              </span>
                            </div>
                            <div
                              style={{
                                height: 4,
                                background: "var(--border)",
                                borderRadius: 2,
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${pct}%`,
                                  background:
                                    data.profit >= 0 ? "var(--green)" : "var(--red)",
                                  borderRadius: 2,
                                  transition: "width 0.5s",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Store breakdown */}
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Profit by Store</h3>
                {Object.keys(stats.storeStats).length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>No sales yet</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Object.entries(stats.storeStats)
                      .sort((a, b) => b[1].profit - a[1].profit)
                      .slice(0, 6)
                      .map(([store, data]) => {
                        const maxProfit = Math.max(
                          ...Object.values(stats.storeStats).map((d) => d.profit)
                        );
                        const pct = maxProfit > 0 ? (data.profit / maxProfit) * 100 : 0;
                        return (
                          <div key={store}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4,
                                fontSize: 13,
                              }}
                            >
                              <span>{store}</span>
                              <span
                                style={{
                                  color: data.profit >= 0 ? "var(--green)" : "var(--red)",
                                  fontWeight: 600,
                                }}
                              >
                                {formatCurrency(data.profit)} ({data.count})
                              </span>
                            </div>
                            <div
                              style={{
                                height: 4,
                                background: "var(--border)",
                                borderRadius: 2,
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${pct}%`,
                                  background: "var(--green)",
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick links */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/items?status=unsold"
                style={{
                  padding: "10px 18px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text)",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                📦 {stats.unsoldCount} Unsold Items
              </Link>
              <Link
                href="/items?status=listed"
                style={{
                  padding: "10px 18px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text)",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                📋 {stats.listedCount} Listed Items
              </Link>
              <Link
                href="/items?status=sold"
                style={{
                  padding: "10px 18px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text)",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                ✅ {stats.soldCount} Sold Items
              </Link>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
            Loading...
          </div>
        )}
      </div>

      {showAdd && (
        <AddItemModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadStats(); }}
        />
      )}
    </div>
  );
}
