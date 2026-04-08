import { useEffect, useState } from "react"
import { Card, NRSBar, SectionNote, LoadingSpinner } from "../components/Components"
import styles from "./Tabs.module.css"

const FIELDS = [
  { key: "painRest", label: "Pain at rest (NRS 0–10)" },
  { key: "painLoad", label: "Pain during load (NRS 0–10)" },
  { key: "painAfter", label: "Pain post-session (NRS 0–10)" },
  { key: "swelling", label: "Swelling (0–10)" },
  { key: "function", label: "Function score (0–10)" },
]

export default function RehabTab() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], painRest: 0, painLoad: 0, painAfter: 0, swelling: 0, function: 5, sessions: 0, plannedSessions: 3, notes: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/manual?type=rehab")
      .then(r => r.json())
      .then(d => setEntries(d || []))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    const res = await fetch("/api/manual?type=rehab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const entry = await res.json()
    setEntries(prev => [entry, ...prev])
    setShowForm(false)
    setSaving(false)
  }

  const latest = entries[0]
  const trend = entries.slice(0, 8).reverse()

  const w = 320
  const h = 60

  function trendLine(key, color) {
    const vals = trend.map(e => Number(e[key]) || 0)
    if (vals.length < 2) return null
    const max = Math.max(...vals, 1)
    const points = vals.map((v, i) => {
      const x = Math.round(4 + (i / (vals.length - 1)) * (w - 8))
      const y = Math.round(h - 4 - (v / max) * (h - 8))
      return `${x},${y}`
    }).join(" ")
    return <polyline key={key} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
  }

  return (
    <div>
      <div className={styles.metricsStrip} style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
        <div className={styles.metricTileSimple}>
          <div className={styles.metricLabel}>Sessions this week</div>
          <div className={styles.metricValue}>{latest?.sessions ?? "—"}<span style={{ fontSize: 14, color: "var(--text3)" }}>/{latest?.plannedSessions ?? 3}</span></div>
        </div>
        <div className={styles.metricTileSimple}>
          <div className={styles.metricLabel}>Pain (load)</div>
          <div className={styles.metricValue} style={{ color: latest?.painLoad <= 3 ? "var(--green)" : latest?.painLoad <= 6 ? "var(--amber)" : "var(--red)" }}>
            {latest?.painLoad ?? "—"}<span style={{ fontSize: 14, color: "var(--text3)" }}>/10</span>
          </div>
        </div>
      </div>

      {latest && (
        <Card title="Latest entry">
          <div className={styles.rehabList}>
            {FIELDS.map(f => (
              <div key={f.key} className={styles.rehabItem}>
                <span className={styles.rehabLbl}>{f.label.replace(" (NRS 0–10)", "").replace(" (0–10)", "")}</span>
                <NRSBar value={Number(latest[f.key]) || 0} max={10} />
              </div>
            ))}
          </div>
          {latest.notes && <SectionNote>{latest.notes}</SectionNote>}
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>{latest.date}</div>
        </Card>
      )}

      {trend.length >= 2 && (
        <Card title="8-week trend">
          <div className={styles.loadLegend}>
            <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#ff5e5e" }} />Pain (load)</span>
            <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#3ecf8e" }} />Function</span>
          </div>
          <svg width="100%" viewBox={`0 0 ${w} ${h + 14}`} style={{ overflow: "visible" }}>
            {trendLine("painLoad", "#ff5e5e")}
            {trendLine("function", "#3ecf8e")}
            <text x="4" y={h + 12} fontSize="9" fill="#4a5060">{trend[0]?.date}</text>
            <text x={w - 4} y={h + 12} fontSize="9" fill="#4a5060" textAnchor="end">{trend[trend.length - 1]?.date}</text>
          </svg>
        </Card>
      )}

      <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "+ Log rehab session"}
      </button>

      {showForm && (
        <Card title="New rehab entry">
          <div className={styles.formGrid}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Date</label>
              <input type="date" className={styles.formInput} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            {FIELDS.map(f => (
              <div key={f.key} className={styles.formRow}>
                <label className={styles.formLabel}>{f.label}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="range" min="0" max="10" step="1" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: Number(e.target.value) }))} style={{ flex: 1 }} />
                  <span style={{ fontFamily: "var(--mono)", fontSize: 13, width: 20, textAlign: "right" }}>{form[f.key]}</span>
                </div>
              </div>
            ))}
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Sessions done</label>
              <input type="number" className={styles.formInput} min="0" max="7" value={form.sessions} onChange={e => setForm(p => ({ ...p, sessions: Number(e.target.value) }))} />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Notes</label>
              <textarea className={styles.formTextarea} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any observations..." />
            </div>
          </div>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save entry"}
          </button>
        </Card>
      )}

      {entries.length === 0 && !showForm && (
        <div style={{ color: "var(--text3)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
          No rehab entries yet. Log your first session above.
        </div>
      )}
    </div>
  )
}
