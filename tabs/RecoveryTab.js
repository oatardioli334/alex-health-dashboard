import { useEffect, useState } from "react"
import { MetricTile, Card, LoadingSpinner, ErrorMsg, SectionNote } from "../components/Components"
import styles from "./Tabs.module.css"

// Simple sparkline with area fill and avg line
function SparkLine({ data, color, height = 60 }) {
  if (!data || data.length < 2) return null
  const vals = data.map(d => d.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const w = 320
  const pad = 4
  const points = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (w - pad * 2)
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return `${Math.round(x)},${Math.round(y)}`
  }).join(" ")
  const areaPoints = `${pad},${height - pad} ` + points + ` ${w - pad},${height - pad}`
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  const avgY = height - pad - ((avg - min) / range) * (height - pad * 2)
  const latest = vals[vals.length - 1]
  const latestX = pad + ((vals.length - 1) / (vals.length - 1)) * (w - pad * 2)
  const latestY = height - pad - ((latest - min) / range) * (height - pad * 2)

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height + 16}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#grad-${color.replace("#","")})`} points={areaPoints} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <line x1={pad} y1={avgY} x2={w - pad} y2={avgY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 4" />
      <text x={w - pad - 2} y={avgY - 4} fontSize="8" fill="rgba(255,255,255,0.3)" textAnchor="end">avg {Math.round(avg)}</text>
      <circle cx={latestX} cy={latestY} r="3" fill={color} />
      <text x={pad} y={height + 14} fontSize="9" fill="#4a5060">{data[0]?.date}</text>
      <text x={w - pad} y={height + 14} fontSize="9" fill="#4a5060" textAnchor="end">Today</text>
      <text x={latestX - 6} y={Math.max(14, latestY - 6)} fontSize="10" fill={color} textAnchor="end" fontWeight="500">{Math.round(latest)}</text>
    </svg>
  )
}

// Scatter plot for correlations
function ScatterPlot({ data, xKey, yKey, xLabel, yLabel, color = "#3ecf8e" }) {
  if (!data || data.length < 4) return (
    <div style={{ color: "#4a5060", fontSize: 12, padding: "12px 0" }}>Not enough data yet — needs ~4+ nights with both metrics recorded.</div>
  )

  const xs = data.map(d => d[xKey])
  const ys = data.map(d => d[yKey])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  const w = 300, h = 130, padL = 32, padR = 10, padT = 10, padB = 28

  const toSvg = (x, y) => ({
    sx: padL + ((x - minX) / rangeX) * (w - padL - padR),
    sy: padT + (1 - (y - minY) / rangeY) * (h - padT - padB),
  })

  const n = data.length
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  const ssXX = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0)
  const ssXY = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0)
  const slope = ssXY / (ssXX || 1)
  const intercept = meanY - slope * meanX
  const ssYY = ys.reduce((sum, y) => sum + (y - meanY) ** 2, 0)
  const r = ssXY / Math.sqrt((ssXX * ssYY) || 1)
  const rLabel = `r = ${r.toFixed(2)}`
  const trend = r > 0.3 ? "positive" : r < -0.3 ? "negative" : "weak"
  const r1 = toSvg(minX, intercept + slope * minX)
  const r2 = toSvg(maxX, intercept + slope * maxX)
  const yTicks = [minY, Math.round((minY + maxY) / 2), maxY]
  const xTicks = [minX, Math.round((minX + maxX) / 2), maxX]

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        {yTicks.map(v => {
          const { sy } = toSvg(minX, v)
          return <line key={v} x1={padL} y1={sy} x2={w - padR} y2={sy} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        })}
        {yTicks.map(v => {
          const { sy } = toSvg(minX, v)
          return <text key={v} x={padL - 4} y={sy + 3} fontSize="8" fill="#4a5060" textAnchor="end">{Math.round(v)}</text>
        })}
        {xTicks.map(v => {
          const { sx } = toSvg(v, minY)
          return <text key={v} x={sx} y={h - 6} fontSize="8" fill="#4a5060" textAnchor="middle">{v.toFixed(1)}h</text>
        })}
        <text x={padL - 2} y={padT - 2} fontSize="8" fill="#4a5060" textAnchor="start">{yLabel}</text>
        <text x={w - padR} y={h - 6} fontSize="8" fill="#4a5060" textAnchor="end">{xLabel}</text>
        <line x1={r1.sx} y1={r1.sy} x2={r2.sx} y2={r2.sy}
          stroke={color} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />
        {data.map((d, i) => {
          const { sx, sy } = toSvg(d[xKey], d[yKey])
          const isLatest = i === data.length - 1
          return (
            <circle key={i} cx={sx} cy={sy} r={isLatest ? 4 : 3}
              fill={color} fillOpacity={isLatest ? 1 : 0.55}
              stroke={isLatest ? "white" : "none"} strokeWidth="1" />
          )
        })}
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: trend === "positive" ? "#3ecf8e" : trend === "negative" ? "#ff5e5e" : "#8a909a" }}>{rLabel}</span>
        <span style={{ fontSize: 11, color: "#4a5060" }}>
          {trend === "positive" ? "More sleep \u2192 higher HRV" : trend === "negative" ? "Inverse relationship detected" : "No strong correlation found"}
        </span>
      </div>
    </div>
  )
}

export default function RecoveryTab() {
  const [sleep, setSleep] = useState(null)
  const [readiness, setReadiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [sleepRes, readinessRes] = await Promise.all([
          fetch("/api/oura?endpoint=sleep"),
          fetch("/api/oura?endpoint=readiness"),
        ])
        if (!sleepRes.ok) throw new Error("Oura not connected")
        const sleepData = await sleepRes.json()
        const readinessData = await readinessRes.json()
        setSleep(sleepData?.data || [])
        setReadiness(readinessData?.data || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMsg msg={`Oura connection issue: ${error}. Check your OAuth connection.`} />

  const longSleeps = sleep?.filter(d => d.type === "long_sleep") || []
  const latest = longSleeps[longSleeps.length - 1]
  const latestR = readiness?.[readiness.length - 1]

  const totalSleepHrs = latest ? (latest.total_sleep_duration / 3600).toFixed(1) : "\u2014"
  const deepMins = latest ? Math.round(latest.deep_sleep_duration / 60) : 0
  const remMins = latest ? Math.round(latest.rem_sleep_duration / 60) : 0
  const lightMins = latest ? Math.round(latest.light_sleep_duration / 60) : 0
  const awakeMins = latest ? Math.round(latest.awake_time / 60) : 0
  const sleepScore = latest?.readiness?.score ?? "\u2014"
  const readinessScore = latestR?.score ?? "\u2014"
  const hrvAvg = latest?.average_hrv ?? "\u2014"
  const restingHR = latest?.lowest_heart_rate ?? "\u2014"

  const last30 = longSleeps.slice(-30)
  const readinessTrend = readiness?.slice(-30).map(d => ({ date: d.day, value: d.score })) || []
  const hrvTrend = last30.filter(d => d.average_hrv).map(d => ({ date: d.day, value: d.average_hrv }))
  const rhrTrend = last30.filter(d => d.lowest_heart_rate).map(d => ({ date: d.day, value: d.lowest_heart_rate }))
  const sleepDurTrend = last30.filter(d => d.total_sleep_duration).map(d => ({
    date: d.day,
    value: parseFloat((d.total_sleep_duration / 3600).toFixed(2))
  }))
  const correlationData = last30
    .filter(d => d.average_hrv && d.total_sleep_duration)
    .map(d => ({
      sleepHrs: parseFloat((d.total_sleep_duration / 3600).toFixed(2)),
      hrv: d.average_hrv,
    }))

  const avgReadiness = readinessTrend.length ? Math.round(readinessTrend.reduce((a, b) => a + b.value, 0) / readinessTrend.length) : null
  const readinessDelta = avgReadiness !== null && readinessScore !== "\u2014" ? readinessScore - avgReadiness : null

  return (
    <div>
      <div className={styles.metricsStrip}>
        <MetricTile label="HRV" value={hrvAvg !== "\u2014" ? `${Math.round(hrvAvg)}` : "\u2014"} sub="ms RMSSD" subType="flat" accentColor="green" />
        <MetricTile label="Readiness" value={readinessScore} sub={readinessDelta !== null ? `${readinessDelta >= 0 ? "+" : ""}${readinessDelta} vs avg` : null} subType={readinessDelta !== null ? (readinessDelta >= 0 ? "up" : "down") : "flat"} accentColor="blue" />
        <MetricTile label="Sleep" value={`${totalSleepHrs}h`} sub={sleepScore !== "\u2014" ? `Score ${sleepScore}` : null} subType="flat" accentColor="purple" />
        <MetricTile label="Resting HR" value={restingHR !== "\u2014" ? `${restingHR}` : "\u2014"} sub="bpm" subType="flat" accentColor="amber" />
      </div>
      {hrvTrend.length > 0 && <Card title="HRV — 30 day trend"><SparkLine data={hrvTrend} color="#3ecf8e" height={65} /></Card>}
      {readinessTrend.length > 0 && <Card title="Readiness — 30 day trend"><SparkLine data={readinessTrend} color="#4a9eff" height={55} /></Card>}
      {rhrTrend.length > 0 && <Card title="Resting HR — 30 day trend"><SparkLine data={rhrTrend} color="#f59e0b" height={55} /></Card>}
      {sleepDurTrend.length > 0 && <Card title="Sleep duration — 30 day trend"><SparkLine data={sleepDurTrend} color="#a78bfa" height={55} /></Card>}
      <Card title="HRV vs Sleep hours — correlation">
        <ScatterPlot data={correlationData} xKey="sleepHrs" yKey="hrv" xLabel="Sleep" yLabel="HRV" color="#3ecf8e" />
      </Card>
      <Card title="Last night — sleep architecture">
        <div className={styles.sleepArc}>
          <div className={styles.sleepItem}><div className={styles.sleepDot} style={{ background: "#a78bfa" }} /><span className={styles.sleepLbl}>Deep (N3)</span><span className={styles.sleepVal} style={{ color: "#a78bfa" }}>{deepMins > 0 ? `${Math.floor(deepMins / 60)}h ${deepMins % 60}m` : "\u2014"}</span></div>
          <div className={styles.sleepItem}><div className={styles.sleepDot} style={{ background: "#4a9eff" }} /><span className={styles.sleepLbl}>REM</span><span className={styles.sleepVal} style={{ color: "#4a9eff" }}>{remMins > 0 ? `${Math.floor(remMins / 60)}h ${remMins % 60}m` : "\u2014"}</span></div>
          <div className={styles.sleepItem}><div className={styles.sleepDot} style={{ background: "#2a3040" }} /><span className={styles.sleepLbl}>Light</span><span className={styles.sleepVal} style={{ color: "#8a909a" }}>{lightMins > 0 ? `${Math.floor(lightMins / 60)}h ${lightMins % 60}m` : "\u2014"}</span></div>
          <div className={styles.sleepItem}><div className={styles.sleepDot} style={{ background: "#ff5e5e" }} /><span className={styles.sleepLbl}>Awake</span><span className={styles.sleepVal} style={{ color: "#ff5e5e" }}>{awakeMins > 0 ? `${awakeMins}m` : "\u2014"}</span></div>
        </div>
        {deepMins > 0 && deepMins < 90 && <SectionNote>Deep sleep below 90 min target — consider earlier sleep time or reducing evening training load.</SectionNote>}
      </Card>
    </div>
  )
}
