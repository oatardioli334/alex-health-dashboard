import { useEffect, useState } from "react"
import { MetricTile, Card, LoadingSpinner, ErrorMsg, SectionNote } from "../components/Components"
import styles from "./Tabs.module.css"

const ACTIVITY_ICONS = {
  Run: "🏃", Ride: "🚴", VirtualRide: "🚴", Swim: "🏊", WeightTraining: "🏋️",
  Walk: "🚶", Hike: "⛰️", Workout: "💪", default: "⚡"
}

const ACTIVITY_COLORS = {
  Run: "var(--blue-dim)", Ride: "var(--amber-dim)", WeightTraining: "var(--green-dim)",
  Swim: "var(--purple-dim)", default: "var(--bg3)"
}

function formatDuration(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDistance(metres) {
  if (!metres) return null
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)}km` : `${Math.round(metres)}m`
}

export default function TrainingTab() {
  const [activities, setActivities] = useState(null)
  const [fitness, setFitness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [actRes, fitRes] = await Promise.all([
          fetch("/api/intervals?endpoint=activities"),
          fetch("/api/intervals?endpoint=wellness"),
        ])
        const actData = await actRes.json()
        const fitData = await fitRes.json()
        setActivities(Array.isArray(actData) ? actData : [])
        setFitness(Array.isArray(fitData) ? fitData : [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMsg msg={`Intervals.icu error: ${error}`} />

  const recentActivities = (activities || []).slice(0, 6)
  const latestFitness = fitness?.[fitness.length - 1]
  const ctl = latestFitness?.ctl ? Math.round(latestFitness.ctl) : "—"
  const atl = latestFitness?.atl ? Math.round(latestFitness.atl) : "—"
  const tsb = latestFitness?.form ? Math.round(latestFitness.form) : "—"

  const weeklyTSS = (activities || []).reduce((sum, a) => {
    const date = new Date(a.start_date_local)
    const now = new Date()
    const diff = (now - date) / (1000 * 60 * 60 * 24)
    return diff <= 7 ? sum + (a.icu_training_load || 0) : sum
  }, 0)

  const tsbType = typeof tsb === "number" ? (tsb > 5 ? "up" : tsb < -20 ? "down" : "flat") : "flat"

  const fitnessTrend = (fitness || []).slice(-30)
  const w = 320

  const ctlVals = fitnessTrend.map(f => f.ctl || 0)
  const atlVals = fitnessTrend.map(f => f.atl || 0)
  const allVals = [...ctlVals, ...atlVals].filter(v => v > 0)
  const minV = allVals.length ? Math.min(...allVals) : 0
  const maxV = allVals.length ? Math.max(...allVals) : 100
  const range = maxV - minV || 1
  const h = 70

  function toPoints(vals) {
    return vals.map((v, i) => {
      const x = Math.round(4 + (i / Math.max(vals.length - 1, 1)) * (w - 8))
      const y = Math.round(h - 4 - ((v - minV) / range) * (h - 8))
      return `${x},${y}`
    }).join(" ")
  }

  const zoneTotals = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  ;(activities || []).forEach(a => {
    if (a.icu_zone_times) {
      a.icu_zone_times.forEach((t, i) => {
        const key = `z${i + 1}`
        if (zoneTotals[key] !== undefined) zoneTotals[key] += t
      })
    }
  })
  const zoneTotal = Object.values(zoneTotals).reduce((a, b) => a + b, 0)
  const zonePcts = Object.entries(zoneTotals).map(([k, v]) => ({
    label: k.toUpperCase().replace("Z", "Zone "),
    pct: zoneTotal > 0 ? Math.round((v / zoneTotal) * 100) : 0,
    color: { z1: "#4a5060", z2: "#4a9eff", z3: "#f5a623", z4: "#ff8c42", z5: "#ff5e5e" }[k]
  }))

  const polarisedRatio = zonePcts[1].pct + zonePcts[4].pct

  return (
    <div>
      <div className={styles.metricsStrip}>
        <MetricTile label="CTL" value={ctl} sub="Fitness" subType="flat" accentColor="blue" />
        <MetricTile label="ATL" value={atl} sub="Fatigue" subType="flat" accentColor="red" />
        <MetricTile label="TSB" value={typeof tsb === "number" ? (tsb >= 0 ? `+${tsb}` : `${tsb}`) : "—"} sub={tsb > 5 ? "Fresh" : tsb < -20 ? "Fatigued" : "Neutral"} subType={tsbType} accentColor="green" />
        <MetricTile label="TSS 7d" value={Math.round(weeklyTSS)} sub="This week" subType="flat" accentColor="amber" />
      </div>

      {fitnessTrend.length > 1 && (
        <Card title="CTL / ATL — 30 days">
          <div className={styles.loadLegend}>
            <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#4a9eff" }} />CTL (fitness)</span>
            <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#ff5e5e" }} />ATL (fatigue)</span>
          </div>
          <svg width="100%" viewBox={`0 0 ${w} ${h + 14}`} style={{ overflow: "visible" }}>
            <polyline fill="none" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={toPoints(ctlVals)} />
            <polyline fill="none" stroke="#ff5e5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" points={toPoints(atlVals)} />
            <text x="4" y={h + 12} fontSize="9" fill="#4a5060">{fitnessTrend[0]?.date}</text>
            <text x={w - 4} y={h + 12} fontSize="9" fill="#4a5060" textAnchor="end">Today</text>
          </svg>
        </Card>
      )}

      {zoneTotal > 0 && (
        <Card title="Heart rate zones — 30 days">
          <div className={styles.zoneList}>
            {zonePcts.map(z => (
              <div key={z.label} className={styles.zoneItem}>
                <span className={styles.zoneName}>{z.label}</span>
                <div className={styles.zoneTrack}>
                  <div className={styles.zoneFill} style={{ width: `${z.pct}%`, background: z.color }} />
                </div>
                <span className={styles.zonePct}>{z.pct}%</span>
              </div>
            ))}
          </div>
          {polarisedRatio > 0 && (
            <SectionNote>
              Polarised ratio (Z2 + Z5): {polarisedRatio}%
              {polarisedRatio >= 70 ? " — good distribution" : " — aim for 70%+ combined"}
              {zonePcts[2].pct > 15 ? ". Zone 3 elevated — push those sessions harder or easier." : ""}
            </SectionNote>
          )}
        </Card>
      )}

      <Card title="Recent activities">
        <div className={styles.activityList}>
          {recentActivities.length === 0 && <div style={{ color: "var(--text3)", fontSize: 12 }}>No recent activities</div>}
          {recentActivities.map(a => {
            const icon = ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.default
            const bg = ACTIVITY_COLORS[a.type] || ACTIVITY_COLORS.default
            const dist = formatDistance(a.distance)
            const dur = formatDuration(a.moving_time)
            const tss = a.icu_training_load ? Math.round(a.icu_training_load) : null
            const hr = a.average_heartrate ? Math.round(a.average_heartrate) : null
            return (
              <div key={a.id} className={styles.activityRow}>
                <div className={styles.actIcon} style={{ background: bg }}>{icon}</div>
                <div className={styles.actInfo}>
                  <div className={styles.actName}>{a.name}</div>
                  <div className={styles.actMeta}>
                    {[dist, dur, hr ? `avg HR ${hr}` : null].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {tss && <div className={styles.actTss} style={{ color: ACTIVITY_COLORS[a.type] !== ACTIVITY_COLORS.default ? Object.values(ACTIVITY_COLORS)[Object.keys(ACTIVITY_COLORS).indexOf(a.type)] : "var(--text2)" }}>{tss} TSS</div>}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
