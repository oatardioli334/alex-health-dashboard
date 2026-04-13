import { useEffect, useState } from "react"
import { MetricTile, Card, LoadingSpinner, ErrorMsg, SectionNote } from "../components/Components"
import styles from "./Tabs.module.css"

function fmtDate(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
}

function fmtSets(sets) {
  if (!sets || sets.length === 0) return "—"
  return sets
    .filter(s => s.weight_kg || s.reps)
    .map(s => {
      const w = s.weight_kg ? `${s.weight_kg}kg` : "BW"
      const r = s.reps ? `×${s.reps}` : ""
      return `${w}${r}`
    })
    .join(" | ")
}

const CHEST_EXERCISES = [
  "Incline Bench Press (Dumbbell)",
  "Cable Fly Crossovers",
  "Chest Press (Machine)",
  "Pullover (Machine)",
  "Incline Chest Fly (Dumbbell)",
  "Incline Chest Press (Machine)",
  "Chest Fly (Machine)",
  "Decline Bench Press (Machine)",
]

const BACK_EXERCISES = [
  "Chest Supported Dumbell Row",
  "Iso-Lateral Row (Machine)",
  "Single Arm Cable Row",
  "Deadlift (Trap bar)",
  "Lat Pulldown - Close Grip (Cable)",
  "Iso-Lateral Low Row",
  "Back Deltoids",
  "Rear Delt Reverse Fly (Machine)",
]

const LEGS_EXERCISES = [
  "Barbell Squat",
  "Leg Extension",
  "Leg Extension Single Leg",
  "Leg Curl",
  "Leg Curl (Machine)",
  "Seated Leg Curl Single Leg",
  "Smith Machine Calf Raise",
  "Standing Calf Raise (Smith Machine)",
]

function MuscleGroupCard({ title, exercises, workouts, color }) {
  // Find most recent workout containing any exercise from this group
  const lastSession = workouts
    .map(w => {
      const matches = (w.exercises || []).filter(e => exercises.includes(e.title))
      return { workout: w, matches, date: w.start_time || w.created_at }
    })
    .filter(x => x.matches.length > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]

  if (!lastSession) {
    return (
      <Card title={title}>
        <SectionNote>No sessions logged yet.</SectionNote>
      </Card>
    )
  }

  const sessionDate = fmtDate(lastSession.date)
  // Show exercises in the defined order, only those that appear in the session
  const sessionExercises = exercises
    .map(name => lastSession.matches.find(e => e.title === name))
    .filter(Boolean)

  return (
    <Card title={`${title} — ${sessionDate}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sessionExercises.map(ex => {
          const validSets = (ex.sets || []).filter(s => s.weight_kg || s.reps)
          return (
            <div key={ex.title}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: color, marginBottom: 5 }}>
                {ex.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {validSets.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      fontSize: "9px", color: "var(--text2)", width: 28, flexShrink: 0
                    }}>
                      Set {i + 1}
                    </div>
                    <div style={{
                      fontSize: "11px", color: "var(--text1)",
                      background: "var(--bg3)", borderRadius: 4,
                      padding: "2px 8px"
                    }}>
                      {s.weight_kg ? `${s.weight_kg}kg` : "BW"} × {s.reps || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
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
  if (error) return <ErrorMsg msg={`Hevy error: ${error}`} />

  const allWorkouts = workouts || []

  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const thisWeek = allWorkouts.filter(w => {
    const d = new Date(w.start_time || w.created_at)
    return d >= sevenDaysAgo
  })

  return (
    <div>
      <div className={styles.metricsStrip} style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
        <MetricTile label="Sessions (last 7 days)" value={thisWeek.length} sub="workouts logged" subType="flat" accentColor="green" />
        <MetricTile label="Total logged" value={allWorkouts.length} sub="all time" subType="flat" accentColor="blue" />
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <MuscleGroupCard
            title="Chest"
            exercises={CHEST_EXERCISES}
            workouts={allWorkouts}
            color="var(--amber)"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <MuscleGroupCard
            title="Back"
            exercises={BACK_EXERCISES}
            workouts={allWorkouts}
            color="var(--blue)"
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <MuscleGroupCard
            title="Legs"
            exercises={LEGS_EXERCISES}
            workouts={allWorkouts}
            color="var(--green)"
          />
        </div>
      </div>
    </div>
  )
}
