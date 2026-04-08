import { useEffect, useState } from "react"
import { Card, Pill, SectionNote, LoadingSpinner } from "../components/Components"
import styles from "./Tabs.module.css"

const ROUTES = ["SC", "IM", "Oral", "Intranasal", "Topical"]
const FREQUENCIES = ["Once daily", "Twice daily", "EOD", "2x/week", "3x/week", "Weekly", "PRN"]

export default function PeptidesTab() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    compound: "", dose: "", unit: "mcg", route: "SC", frequency: "Once daily",
    cycleStart: new Date().toISOString().split("T")[0], cycleLengthDays: 60,
    purpose: "", active: true, notes: ""
  })

  useEffect(() => {
    fetch("/api/manual?type=peptides")
      .then(r => r.json())
      .then(d => setEntries(d || []))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    if (!form.compound) return
    setSaving(true)
    const res = await fetch("/api/manual?type=peptides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const entry = await res.json()
    setEntries(prev => [entry, ...prev])
    setShowForm(false)
    setSaving(false)
    setForm({ compound: "", dose: "", unit: "mcg", route: "SC", frequency: "Once daily", cycleStart: new Date().toISOString().split("T")[0], cycleLengthDays: 60, purpose: "", active: true, notes: "" })
  }

  async function toggleActive(entry) {
    const updated = { ...entry, active: !entry.active }
    await fetch("/api/manual?type=peptides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) })
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, active: !e.active } : e))
  }

  function cycleDay(startDate, lengthDays) {
    const start = new Date(startDate)
    const now = new Date()
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
    if (diff < 0) return null
    if (diff >= lengthDays) return { done: true, day: diff }
    return { done: false, day: diff + 1, total: lengthDays }
  }

  const active = entries.filter(e => e.active)
  const inactive = entries.filter(e => !e.active)

  return (
    <div>
      {active.length > 0 && (
        <Card title="Active protocols">
          <div className={styles.pepList}>
            {active.map(e => {
              const cd = cycleDay(e.cycleStart, e.cycleLengthDays)
              return (
                <div key={e.id} className={styles.pepRow}>
                  <div style={{ flex: 1 }}>
                    <div className={styles.pepName}>{e.compound}</div>
                    <div className={styles.pepDetail}>
                      {e.dose}{e.unit} · {e.route} · {e.frequency}
                      {cd && !cd.done ? ` · day ${cd.day} of ${cd.total}` : cd?.done ? " · cycle complete" : ""}
                    </div>
                    {e.purpose && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{e.purpose}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <Pill label="Active" type="active" />
                    <button className={styles.microBtn} onClick={() => toggleActive(e)}>Mark off</button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {inactive.length > 0 && (
        <Card title="Off cycle / completed">
          <div className={styles.pepList}>
            {inactive.slice(0, 5).map(e => (
              <div key={e.id} className={styles.pepRow}>
                <div style={{ flex: 1 }}>
                  <div className={styles.pepName} style={{ color: "var(--text2)" }}>{e.compound}</div>
                  <div className={styles.pepDetail}>{e.dose}{e.unit} · {e.route} · {e.frequency}</div>
                  {e.notes && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{e.notes}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <Pill label="Off cycle" type="off" />
                  <button className={styles.microBtn} onClick={() => toggleActive(e)}>Reactivate</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "+ Add protocol"}
      </button>

      {showForm && (
        <Card title="New protocol">
          <div className={styles.formGrid}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Compound *</label>
              <input className={styles.formInput} placeholder="e.g. BPC-157, TB-500..." value={form.compound} onChange={e => setForm(p => ({ ...p, compound: e.target.value }))} />
            </div>
            <div className={styles.formRowInline}>
              <div className={styles.formRow} style={{ flex: 1 }}>
                <label className={styles.formLabel}>Dose</label>
                <input className={styles.formInput} placeholder="250" value={form.dose} onChange={e => setForm(p => ({ ...p, dose: e.target.value }))} />
              </div>
              <div className={styles.formRow} style={{ width: 80 }}>
                <label className={styles.formLabel}>Unit</label>
                <select className={styles.formSelect} value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                  {["mcg", "mg", "IU", "ml"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.formRowInline}>
              <div className={styles.formRow} style={{ flex: 1 }}>
                <label className={styles.formLabel}>Route</label>
                <select className={styles.formSelect} value={form.route} onChange={e => setForm(p => ({ ...p, route: e.target.value }))}>
                  {ROUTES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className={styles.formRow} style={{ flex: 1 }}>
                <label className={styles.formLabel}>Frequency</label>
                <select className={styles.formSelect} value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
                  {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.formRowInline}>
              <div className={styles.formRow} style={{ flex: 1 }}>
                <label className={styles.formLabel}>Cycle start</label>
                <input type="date" className={styles.formInput} value={form.cycleStart} onChange={e => setForm(p => ({ ...p, cycleStart: e.target.value }))} />
              </div>
              <div className={styles.formRow} style={{ width: 100 }}>
                <label className={styles.formLabel}>Cycle (days)</label>
                <input type="number" className={styles.formInput} value={form.cycleLengthDays} onChange={e => setForm(p => ({ ...p, cycleLengthDays: Number(e.target.value) }))} />
              </div>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Purpose / rationale</label>
              <input className={styles.formInput} placeholder="e.g. Knee rehab, sleep quality..." value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Notes</label>
              <textarea className={styles.formTextarea} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Subjective response, batch info, observations..." />
            </div>
          </div>
          <button className={styles.saveBtn} onClick={save} disabled={saving || !form.compound}>
            {saving ? "Saving..." : "Save protocol"}
          </button>
        </Card>
      )}

      {entries.length === 0 && !showForm && (
        <div style={{ color: "var(--text3)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
          No protocols logged yet. Add your current stack above.
        </div>
      )}
    </div>
  )
}
