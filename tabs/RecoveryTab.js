import { useEffect, useState } from "react"
import { MetricTile, Card, LoadingSpinner, ErrorMsg, SectionNote } from "../components/Components"
import styles from "./Tabs.module.css"

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
      <line x1={pad} y1={avgY} x2={w - pad} y2={avgY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 4" />
      <text x={pad} y={height + 14} fontSize="9" fill="#4a5060">{data[0]?.date}</text>
      <text x={w - pad} y={height + 14} fontSize="9" fill="#4a5060" textAnchor="end">Today</text>
      <text x={w - pad} y={Math.max(14, Math.round(height - pad - ((latest - min) / range) * (height - pad * 2)) - 6)} fontSize="10" fill={color} textAnchor="end" fontWeight="500">{Math.round(latest)}</text>
    </svg>
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

  const latest = sleep?.[sleep.length - 1]
  const latestR = readiness?.[readiness.length - 1]

  const totalSleepHrs = latest ? (latest.total_sleep_duration / 3600).toFixed(1) : "—"
  const deepMins = latest ? Math.round(latest.deep_sleep_duration / 60) : 0
  const remMins = latest ? Math.round(latest.rem_sleep_duration / 60) : 0
  const lightMins = latest ? Math.round(latest.light_sleep_duration / 60) : 0
  const awakeMins = latest ? Math.round(latest.awake_time / 60) : 0
  const sleepScore = latest?.score ?? "—"
  const readinessScore = latestR?.score ?? "—"
  const hrvAvg = latest?.average_hrv ?? "—"
  const restingHR = latest?.lowest_heart_rate ?? "—"

  const readinessTrend = readiness?.slice(-30).map(d => ({ date: d.day, value: d.score })) || []
  const hrvTrend = sleep?.slice(-30).filter(d => d.average_hrv).map(d => ({ date: d.day, value: d.average_hrv })) || []

  const avgReadiness = readinessTrend.length ? Math.round(readinessTrend.reduce((a, b) => a + b.value, 0) / readinessTrend.length) : null
  const readinessDelta = avgReadiness ? readinessScore - avgReadiness : null

  return (
    <div>
      <div className={styles.metricsStrip}>
        <MetricTile label="HRV" value={hrvAvg !== "—" ? `${Math.round(hrvAvg)}` : "—"} sub="ms RMSSD" subType="flat" accentColor="green" />
        <MetricTile label="Readiness" value={readinessScore} sub={readinessDelta !== null ? `${readinessDelta >= 0 ? "+" : ""}${readinessDelta} vs avg` : null} subType={readinessDelta >= 0 ? "up" : "down"} accentColor="blue" />
        <MetricTile label="Sleep" value={`${totalSleepHrs}h`} sub={sleepScore !== "—" ? `Score ${sleepScore}` : null} subType="flat" accentColor="purple" />
        <MetricTile label="Resting HR" value={restingHR !== "—" ? `${restingHR}` : "—"} sub="bpm" subType="flat" accentColor="amber" />
      </div>

      {hrvTrend.length > 0 && (
        <Card title="HRV — 30 day trend">
          <SparkLine data={hrvTrend} color="#3ecf8e" height={65} />
        </Card>
      )}

      {readinessTrend.length > 0 && (
        <Card title="Readiness — 30 day trend">
          <SparkLine data={readinessTrend} color="#4a9eff" height={55} />
        </Card>
      )}

      <Card title="Last night — sleep architecture">
        <div className={styles.sleepArc}>
          <div className={styles.sleepItem}>
            <div className={styles.sleepDot} style={{ background: "#a78bfa" }} />
            <span className={styles.sleepLbl}>Deep (N3)</span>
            <span className={styles.sleepVal} style={{ color: "#a78bfa" }}>
              {deepMins > 0 ? `${Math.floor(deepMins / 60)}h ${deepMins % 60}m` : "—"}
            </span>
          </div>
          <div className={styles.sleepItem}>
            <div className={styles.sleepDot} style={{ background: "#4a9eff" }} />
            <span className={styles.sleepLbl}>REM</span>
            <span className={styles.sleepVal} style={{ color: "#4a9eff" }}>
              {remMins > 0 ? `${Math.floor(remMins / 60)}h ${remMins % 60}m` : "—"}
            </span>
          </div>
          <div className={styles.sleepItem}>
            <div className={styles.sleepDot} style={{ background: "#2a3040" }} />
            <span className={styles.sleepLbl}>Light</span>
            <span className={styles.sleepVal} style={{ color: "#8a909a" }}>
              {lightMins > 0 ? `${Math.floor(lightMins / 60)}h ${lightMins % 60}m` : "—"}
            </span>
          </div>
          <div className={styles.sleepItem}>
            <div className={styles.sleepDot} style={{ background: "#ff5e5e" }} />
            <span className={styles.sleepLbl}>Awake</span>
            <span className={styles.sleepVal} style={{ color: "#ff5e5e" }}>{awakeMins > 0 ? `${awakeMins}m` : "—"}</span>
          </div>
        </div>
        {deepMins > 0 && deepMins < 90 && (
          <SectionNote>Deep sleep below 90 min target — consider earlier sleep time or reducing evening training load.</SectionNote>
        )}
      </Card>
    </div>
  )
}
