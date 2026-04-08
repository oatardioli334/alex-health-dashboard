const HEVY_API_KEY = process.env.HEVY_API_KEY
const BASE = "https://api.hevyapp.com/v1"

async function fetchHevy(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "api-key": HEVY_API_KEY,
      "Content-Type": "application/json",
    },
  })
  if (!res.ok) throw new Error(`Hevy API error: ${res.status}`)
  return res.json()
}

export default async function handler(req, res) {
  const { endpoint } = req.query
  try {
    if (endpoint === "workouts") {
      const data = await fetchHevy("/workouts?page=1&pageSize=20")
      res.json(data)
    } else if (endpoint === "routines") {
      const data = await fetchHevy("/routines?page=1&pageSize=10")
      res.json(data)
    } else if (endpoint === "exercise_templates") {
      const data = await fetchHevy("/exercise_templates?page=1&pageSize=100")
      res.json(data)
    } else {
      res.status(400).json({ error: "Unknown endpoint" })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
