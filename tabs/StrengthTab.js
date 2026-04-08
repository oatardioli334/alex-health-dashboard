import { useEffect, useState } from "react"
import { MetricTile, Card, LoadingSpinner, ErrorMsg, SectionNote } from "../components/Components"
import styles from "./Tabs.module.css"

function calcE1RM(weight, reps) {
  if (!weight || !reps) return 0
  return Math.round(weight * (1 + reps / 30))
}

export default function StrengthTab() {
  const [workouts, setWorkouts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/hevy?endpoint=workouts")
        if (!res.ok) throw new Error(`Hevy error ${res.status}`)
        const data = await res.json()
        setWorkouts(data?.workouts || data || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMsg msg={`Hevy connection issue: ${error}`} />

  const allWorkouts = workouts || []
  const thisWeek = allWorkouts.filter(w => {
    const d = new Date(w.start_time * 1000 || w.created_at)
    return (Date.now() - d) / (1000 * 60 * 60 * 24) <= 7
  })

  const exerciseMap = {}
  allWorkouts.forEach(w => {
    const exercises = w.exercises || []
    exercises.forEach(ex => {
      const name = ex.title || ex.exercise_template_id
      if (!exerciseMap[name]) exerciseMap[name] = []
      const sets = ex.sets || []
      sets.forEach(s => {
        if (s.weight_kg && s.reps) {
          exerciseMap[name].push({
            date: w.start_time ? new Date(w.start_time * 1000) : new Date(w.created_at),
            weight: s.weight_kg,
            reps: s.reps,
            e1rm: calcE1RM(s.weight_kg, s.reps)
          })
        }
      })
    })
  })

  const keyLifts = Object.entries(exerciseMap)
    .filter(([_, sets]) => sets.length >= 2)
    .map(([name, sets]) => {
      const sorted = [...sets].sort((a, b) => b.date - a.date)
      const recent = sorted[0]
      const prev = sorted.find(s => s.date < recent.date)
      const delta = prev ? recent.e1rm - prev.e1rm : null
      return { name, recent, delta, count: sets.length }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const recentWorkouts = allWorkouts.slice(0, 4)

  return (
    <div>
      <div className={styles.metricsStrip} style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
        <MetricTile label="Sessions this week" value={thisWeek.length} sub="workouts logged" subType="flat" accentColor="green" />
        <MetricTile label="Total logged" value={allWorkouts.length} sub="all time" subType="flat" accentColor="blue" />
      </div>

      {keyLifts.length > 0 && (
        <Card title="Key lifts — estimated 1RM trend">
          <div className={styles.liftList}>
            {keyLifts.map(lift => (
              <div key={lift.name} className={styles.liftRow}>
                <span className={styles.liftName}>{lift.name}</span>
                <div className={styles.liftRight}>
                  <span className={styles.liftVal}>{lift.recent.weight}kg</span>
                  {lift.delta !== null && (
                    <span className={`${styles.liftDelta} ${lift.delta > 0 ? styles.up : lift.delta < 0 ? styles.down : styles.flat}`}>
                      {lift.delta > 0 ? `+${lift.delta}` : lift.delta < 0 ? lift.delta : "—"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <SectionNote>Deltas show estimated 1RM change vs previous recorded session for each lift.</SectionNote>
        </Card>
      )}

      {recentWorkouts.length > 0 && (
        <Card title="Recent sessions">
          <div className={styles.activityList}>
            {recentWorkouts.map((w, i) => {
              const date = w.start_time ? new Date(w.start_time * 1000) : new Date(w.created_at)
              const exercises = w.exercises || []
              const totalSets = exercises.reduce((s, e) => s + (e.sets?.length || 0), 0)
              const dur = w.duration ? Math.round(w.duration / 60) : null
              return (
                <div key={i} className={styles.activityRow}>
                  <div className={styles.actIcon} style={{ background: "var(--green-dim)" }}>🏋️</div>
                  <div className={styles.actInfo}>
                    <div className={styles.actName}>{w.title || w.name || "Strength session"}</div>
                    <div className={styles.actMeta}>
                      {date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                      {totalSets > 0 ? ` · ${totalSets} sets` : ""}
                      {dur ? ` · ${dur}m` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
                    {exercises.length} ex
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {allWorkouts.length === 0 && (
        <div style={{ color: "var(--text3)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
          No workouts found. Make sure your Hevy API key is active and you have logged sessions.
        </div>
      )}
    </div>
  )
}
