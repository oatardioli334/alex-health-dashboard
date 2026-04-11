const API_KEY = process.env.HEVY_API_KEY
const BASE = "https://api.hevyapp.com/v1"

async function hevyFetch(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "api-key": API_KEY, "Content-Type": "application/json" }
  })
  if (!res.ok) throw new Error(`Hevy API error: ${res.status}`)
  return res.json()
}

async function fetchAllWorkouts() {
  const first = await hevyFetch("/workouts?pageSize=10&page=1")
  const pageCount = first.page_count || 1
  if (pageCount <= 1) return first.workouts || []
  const remaining = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, i) =>
      hevyFetch(`/workouts?pageSize=10&page=${i + 2}`)
    )
  )
  const allWorkouts = [
    ...(first.workouts || []),
    ...remaining.flatMap(r => r.workouts || [])
  ]
  return allWorkouts
}

export default async function handler(req, res) {
  const { endpoint } = req.query
  try {
    if (endpoint === "workouts") {
      const workouts = await fetchAllWorkouts()
      return res.status(200).json({ workouts })
    }
    if (endpoint === "exercise_templates") {
      const data = await hevyFetch("/exercise_templates?pageSize=10&page=1")
      return res.status(200).json(data)
    }
    res.status(400).json({ error: "Unknown endpoint" })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
