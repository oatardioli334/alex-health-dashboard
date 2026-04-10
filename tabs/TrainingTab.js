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

function fmtDate(iso) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y.slice(2)}`
}

function getWeekStart(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d)
  mon.setDate(diff)
  return mon.toISOString().split("T")[0]
}

const HR_ZONE_COLORS = ["#3a4050", "#4a9eff", "#f5a623", "#ff8c42", "#ff5e5e"]
const HR_ZONE_LABELS = ["Z1 Easy", "Z2 Aerobic", "Z3 Tempo", "Z4 Threshold", "Z5+ Hard"]
const PWR_ZONE_COLORS = ["#3a4050", "#4a9eff", "#7ed321", "#f0c040", "#f5a623", "#ff8c42", "#ff5e5e", "#cc44cc"]
const PWR_ZONE_LABELS = ["Z1 Recovery", "Z2 Endurance", "Z3 Tempo", "SS Sweet Spot", "Z4 Threshold", "Z5 VO2", "Z6 Anaerobic", "Z7 Neuro"]

function StackedBarChart({ data, zoneLabels, zoneColors }) {
  if (!data || data.length === 0) return null
  const W = 310
  const H = 110
  const padL = 28
  const padB = 26
  const padT = 6
  const chartW = W - padL - 4
  const chartH = H - padT - padB
  const maxTotal = Math.max(...data.map(d => d.values.reduce((s, v) => s + v, 0)))
  if (maxTotal === 0) return <div style={{fontSize:"10px",color:"var(--text2)"}}>No zone data this period</div>
  const bw = Math.floor(chartW / data.length) - 3
  return (
    <div>
      <svg width={W} height={H} style={{overflow:"visible",display:"block"}}>
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = padT + chartH - frac * chartH
          const val = Math.round(frac * maxTotal)
          return (
            <g key={frac}>
              <line x1={padL} y1={y} x2={W - 4} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={padL - 3} y={y + 3} fontSize="7" fill="#4a5060" textAnchor="end">{val}</text>
            </g>
          )
        })}
        {data.map((week, wi) => {
          const x = padL + wi * (chartW / data.length)
          let yOff = padT + chartH
          return (
            <g key={wi}>
              {week.values.map((v, zi) => {
                if (v === 0) return null
                const bh = Math.max(1, (v / maxTotal) * chartH)
                yOff -= bh
                const yPos = yOff
                return <rect key={zi} x={x + 1} y={yPos} width={bw} height={bh} fill={zoneColors[zi]} opacity="0.85" rx="1" />
              })}
              <text x={x + bw / 2 + 1} y={H - 6} fontSize="8" fill="#4a5060" textAnchor="middle">{week.label}</text>
            </g>
          )
        })}
      </svg>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
        {zoneLabels.map((lbl, i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:3,fontSize:"9px",color:"var(--text2)"}}>
            <div style={{width:8,height:8,background:zoneColors[i],borderRadius:1,flexShrink:0}} />
            {lbl}
          </div>
        ))}
      </div>
    </div>
  )
}

function EfficiencyLine({ data }) {
  if (!data || data.length < 2) return null
  const W = 310
  const H = 60
  const pad = 4
  const vals = data.map(d => d.value)
  const min = Math.min(...vals) * 0.95
  const max = Math.max(...vals) * 1.05
  const range = max - min || 0.1
  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (W - pad * 2)
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return `${Math.round(x)},${Math.round(y)}`
  }).join(" ")
  const latest = vals[vals.length - 1]
  return (
    <svg width={W} height={H + 16} style={{overflow:"visible",display:"block"}}>
      <polyline fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {vals.map((v, i) => {
        const x = pad + (i / (vals.length - 1)) * (W - pad * 2)
        const y = H - pad - ((v - min) / range) * (H - pad * 2)
        return <circle key={i} cx={Math.round(x)} cy={Math.round(y)} r="2.5" fill="var(--amber)" />
      })}
      <text x={pad} y={H + 12} fontSize="9" fill="#4a5060">{fmtDate(data[0].date)}</text>
      <text x={W - pad} y={H + 12} fontSize="9" fill="#4a5060" textAnchor="end">Today</text>
      <text x={W - pad} y={H - pad - 4} fontSize="10" fill="var(--amber)" textAnchor="end" fontWeight="500">{latest.toFixed(2)}</text>
    </svg>
  )
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

  // Fitness trend
  const fitnessTrend = (fitness || []).slice(-30)
  const w = 310
  const ctlVals = fitnessTrend.map(f => f.ctl || 0)
  const atlVals = fitnessTrend.map(f => f.atl || 0)
  const allVals = [...ctlVals, ...atlVals].filter(v => v > 0)
  const minV = allVals.length ? Math.min(...allVals) : 0
  const maxV = allVals.length ? Math.max(...allVals) : 100
  const fRange = maxV - minV || 1
  const fH = 70
  function toPoints(vals) {
    return vals.map((v, i) => {
      const x = Math.round(4 + (i / Math.max(vals.length - 1, 1)) * (w - 8))
      const y = Math.round(fH - 4 - ((v - minV) / fRange) * (fH - 8))
      return `${x},${y}`
    }).join(" ")
  }

  // Weekly HR zone aggregation (last 5 weeks, merged to 5 zones)
  const weekHrMap = {}
  const weekPwrMap = {};
  (activities || []).forEach(a => {
    const wk = getWeekStart(a.start_date_local)
    if (a.icu_hr_zone_times) {
      const z = a.icu_hr_zone_times
      const merged = [z[0]||0, z[1]||0, z[2]||0, z[3]||0, (z[4]||0)+(z[5]||0)+(z[6]||0)]
      if (!weekHrMap[wk]) weekHrMap[wk] = [0,0,0,0,0]
      merged.forEach((v, i) => { weekHrMap[wk][i] += v })
    }
    if (a.icu_zone_times && a.icu_zone_times.length > 0) {
      if (!weekPwrMap[wk]) weekPwrMap[wk] = {}
      a.icu_zone_times.forEach(z => { weekPwrMap[wk][z.id] = (weekPwrMap[wk][z.id] || 0) + z.secs })
    }
  })

  const sortedHrWeeks = Object.keys(weekHrMap).sort().slice(-5)
  const hrWeekData = sortedHrWeeks.map(wk => ({
    label: fmtDate(wk),
    values: weekHrMap[wk].map(v => Math.round(v / 60))
  }))

  const pwrZoneOrder = ["Z1","Z2","Z3","SS","Z4","Z5","Z6","Z7"]
  const sortedPwrWeeks = Object.keys(weekPwrMap).sort().slice(-5)
  const pwrWeekData = sortedPwrWeeks.map(wk => ({
    label: fmtDate(wk),
    values: pwrZoneOrder.map(z => Math.round((weekPwrMap[wk][z] || 0) / 60))
  }))

  // Aerobic efficiency trend (watts/HR for cycling)
  const effData = (activities || [])
    .filter(a => a.icu_power_hr && a.icu_power_hr > 0)
    .map(a => ({ date: a.start_date_local.split("T")[0], value: a.icu_power_hr }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Overall zone totals for summary
  const zoneTotals = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 }
  ;(activities || []).forEach(a => {
    if (a.icu_hr_zone_times) {
      const z = a.icu_hr_zone_times
      zoneTotals.z1 += z[0]||0; zoneTotals.z2 += z[1]||0; zoneTotals.z3 += z[2]||0
      zoneTotals.z4 += z[3]||0; zoneTotals.z5 += (z[4]||0)+(z[5]||0)+(z[6]||0)
    }
  })
  const zoneTotal = Object.values(zoneTotals).reduce((s, v) => s + v, 0)
  const zonePcts = Object.entries(zoneTotals).map(([k, v]) => ({
    label: k.toUpperCase().replace("Z", "Zone "),
    pct: zoneTotal > 0 ? Math.round((v / zoneTotal) * 100) : 0,
    color: { z1: "#3a4050", z2: "#4a9eff", z3: "#f5a623", z4: "#ff8c42", z5: "#ff5e5e" }[k]
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

      {fitnessTrend.length >= 2 && (
        <Card title="Fitness & Fatigue (30d)">
          <svg width={w} height={fH + 16} style={{overflow:"visible",display:"block"}}>
            <polyline fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" points={toPoints(ctlVals)} />
            <polyline fill="none" stroke="var(--red)" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" points={toPoints(atlVals)} />
            <text x={4} y={fH + 12} fontSize="9" fill="#4a5060">{fmtDate(fitnessTrend[0]?.id)}</text>
            <text x={w} y={fH + 12} fontSize="9" fill="#4a5060" textAnchor="end">Today</text>
            <text x={4} y={12} fontSize="8" fill="var(--blue)">CTL (fitness)</text>
            <text x={4} y={22} fontSize="8" fill="var(--red)">ATL (fatigue)</text>
          </svg>
        </Card>
      )}

      {hrWeekData.length > 0 && (
        <Card title="Weekly HR Zones">
          <SectionNote>Minutes per HR zone per week. Z1 = easy recovery, Z5 = maximal effort.</SectionNote>
          <StackedBarChart data={hrWeekData} zoneLabels={HR_ZONE_LABELS} zoneColors={HR_ZONE_COLORS} />
        </Card>
      )}

      {pwrWeekData.length > 0 && (
        <Card title="Weekly Power Zones (Cycling)">
          <SectionNote>Minutes per power zone per week. Based on % of FTP.</SectionNote>
          <StackedBarChart data={pwrWeekData} zoneLabels={PWR_ZONE_LABELS} zoneColors={PWR_ZONE_COLORS} />
        </Card>
      )}

      {effData.length >= 2 && (
        <Card title="Aerobic Efficiency (Watts / bpm)">
          <SectionNote>Power-to-HR ratio from cycling sessions. Upward trend = improving cardiovascular fitness.</SectionNote>
          <EfficiencyLine data={effData} />
        </Card>
      )}

      <Card title="HR Zone Distribution (All Activities)">
        <div style={{display:"flex",gap:6,alignItems:"flex-end",height:54}}>
          {zonePcts.map((z, i) => (
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{fontSize:"9px",color:"var(--text2)"}}>{z.pct}%</div>
              <div style={{width:"100%",background:z.color,borderRadius:2,minHeight:2,height:`${Math.max(4, z.pct * 0.85)}%`}} />
              <div style={{fontSize:"8px",color:"var(--text2)",textAlign:"center"}}>{z.label}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:"10px",color:"var(--text2)",marginTop:10}}>
          Polarised ratio (Z2 + Z5): <span style={{color:"var(--text1)"}}>{polarisedRatio}%</span>
        </div>
      </Card>

      <Card title="Recent Activities">
        {recentActivities.length === 0
          ? <SectionNote>No activities found.</SectionNote>
          : recentActivities.map(a => {
              const icon = ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.default
              const bg = ACTIVITY_COLORS[a.type] || ACTIVITY_COLORS.default
              const dist = formatDistance(a.distance)
              const dur = formatDuration(a.moving_time)
              const tss = a.icu_training_load ? Math.round(a.icu_training_load) : null
              const hr = a.average_heartrate ? Math.round(a.average_heartrate) : null
              return (
                <div key={a.id} className={styles.activityRow}>
                  <div className={styles.actIcon} style={{background: bg}}>{icon}</div>
                  <div className={styles.actInfo}>
                    <div className={styles.actName}>{a.name}</div>
                    <div className={styles.actMeta}>{dur}{dist ? ` · ${dist}` : ""}{tss ? ` · ${tss} TSS` : ""}{hr ? ` · ${hr} bpm` : ""}</div>
                  </div>
                </div>
              )
            })
        }
      </Card>
    </div>
  )
}
