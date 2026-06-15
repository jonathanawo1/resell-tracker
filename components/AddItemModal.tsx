"use client";
import { useState, useRef } from "react";
import { CATEGORIES, PLATFORMS } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

type Tab = "ai" | "manual";

interface FormData {
  name: string;
  store: string;
  category: string;
  purchasePrice: string;
  purchaseDate: string;
  status: string;
  platform: string;
  notes: string;
}

const emptyForm: FormData = {
  name: "",
  store: "",
  category: "General",
  purchasePrice: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  status: "unsold",
  platform: "",
  notes: "",
};

export default function AddItemModal({ onClose, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>("ai");
  const [form, setForm] = useState<FormData>(emptyForm);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof FormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  async function analyzeFile(file: File) {
    setAiLoading(true);
    setAiError("");
    const preview = URL.createObjectURL(file);
    setPreviewFile(preview);

    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (data.data) {
        setForm({
          name: data.data.name || "",
          store: data.data.store || "",
          category: data.data.category || "General",
          purchasePrice: String(data.data.purchasePrice || ""),
          purchaseDate: data.data.purchaseDate || new Date().toISOString().slice(0, 10),
          status: "unsold",
          platform: "",
          notes: data.data.notes || "",
        });
        setTab("manual"); // switch to form so user can review/edit
      } else {
        setAiError(data.error || "Could not extract details");
      }
    } catch {
      setAiError("Network error");
    } finally {
      setAiLoading(false);
    }
  }

  async function analyzeText() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError("");
    const fd = new FormData();
    fd.append("text", aiText);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (data.data) {
        setForm({
          name: data.data.name || "",
          store: data.data.store || "",
          category: data.data.category || "General",
          purchasePrice: String(data.data.purchasePrice || ""),
          purchaseDate: data.data.purchaseDate || new Date().toISOString().slice(0, 10),
          status: "unsold",
          platform: "",
          notes: data.data.notes || "",
        });
        setTab("manual");
      } else {
        setAiError(data.error || "Could not extract details");
      }
    } catch {
      setAiError("Network error");
    } finally {
      setAiLoading(false);
    }
  }

  async function save() {
    if (!form.name || !form.store || !form.purchasePrice || !form.purchaseDate) {
      alert("Please fill in: item name, store, purchase price, and date.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      onSaved();
    } else {
      alert("Error saving item");
    }
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Add Purchase</h2>
          <button
            onClick={onClose}
            style={{ background: "none", color: "var(--muted)", fontSize: 20, padding: "4px 8px" }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            marginBottom: 24,
            gap: 0,
          }}
        >
          {(["ai", "manual"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "none",
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 500,
                color: tab === t ? "var(--green)" : "var(--muted)",
                borderBottom: tab === t ? "2px solid var(--green)" : "2px solid transparent",
                borderRadius: 0,
                marginBottom: -1,
              }}
            >
              {t === "ai" ? "🤖 AI Scan" : "✏️ Manual Entry"}
            </button>
          ))}
        </div>

        {tab === "ai" && (
          <div>
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) analyzeFile(file);
              }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "var(--green)" : "var(--border)"}`,
                borderRadius: 12,
                padding: "40px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "rgba(34,197,94,0.05)" : "var(--surface2)",
                transition: "all 0.15s",
                marginBottom: 16,
              }}
            >
              {aiLoading ? (
                <div>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>⏳</p>
                  <p style={{ color: "var(--muted)" }}>Analyzing with AI...</p>
                </div>
              ) : previewFile ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewFile} alt="receipt" style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 8, marginBottom: 8 }} />
                  <p style={{ color: "var(--green)", fontSize: 13 }}>✓ Analyzed — review details below</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 40, marginBottom: 12 }}>📸</p>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>Drop receipt or screenshot here</p>
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>
                    PNG, JPG, WEBP supported · or click to browse
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzeFile(f); }}
            />

            <div style={{ margin: "16px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              — or paste text —
            </div>

            <textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              rows={4}
              placeholder="Paste order confirmation email, receipt text, or just type: 'Nike Dunks from Nike.com, $110, bought June 10'"
            />
            <button
              className="btn-primary"
              onClick={analyzeText}
              disabled={aiLoading || !aiText.trim()}
              style={{ width: "100%", marginTop: 10, padding: "12px" }}
            >
              {aiLoading ? "Analyzing..." : "Extract Details with AI"}
            </button>

            {aiError && (
              <p style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{aiError}</p>
            )}
          </div>
        )}

        {tab === "manual" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {form.name && (
              <div
                style={{
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--green)",
                  marginBottom: 4,
                }}
              >
                ✓ AI filled in the details — review and adjust below
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                  Item Name *
                </label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nike Air Force 1" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                  Store / Retailer *
                </label>
                <input value={form.store} onChange={(e) => set("store", e.target.value)} placeholder="Nike.com" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                  Purchase Price *
                </label>
                <input type="number" step="0.01" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                  Purchase Date *
                </label>
                <input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="unsold">Unsold</option>
                  <option value="listed">Listed</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Size, color, order number, condition..."
              />
            </div>
            <button
              className="btn-primary"
              onClick={save}
              disabled={saving}
              style={{ width: "100%", padding: "13px", fontSize: 15, marginTop: 4 }}
            >
              {saving ? "Saving..." : "Add to Tracker"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
