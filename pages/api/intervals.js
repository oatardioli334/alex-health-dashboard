const ATHLETE_ID = process.env.INTERVALS_ATHLETE_ID
const API_KEY = process.env.INTERVALS_API_KEY
const BASE = "https://intervals.icu/api/v1"

function authHeader() {
  const creds = Buffer.from(`API_KEY:${API_KEY}`).toString("base64")
  return { Authorization: `Basic ${creds}` }
}

async function fetchIntervals(path) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeader() })
  if (!res.ok) throw new Error(`Intervals API error: ${res.status}`)
  return res.json()
}

export default async function handler(req, res) {
  const { endpoint } = req.query
  try {
    const today = new Date().toISOString().split("T")[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    if (endpoint === "wellness") {
      const data = await fetchIntervals(
        `/athlete/${ATHLETE_ID}/wellness?oldest=${thirtyDaysAgo}&newest=${today}`
      )
      res.json(data)
    } else if (endpoint === "activities") {
      const data = await fetchIntervals(
        `/athlete/${ATHLETE_ID}/activities?oldest=${thirtyDaysAgo}&newest=${today}`
      )
      res.json(data)
    } else if (endpoint === "fitness") {
      const data = await fetchIntervals(
        `/athlete/${ATHLETE_ID}/fitness-indicator?oldest=${ninetyDaysAgo}&newest=${today}`
      )
      res.json(data)
    } else if (endpoint === "zones") {
      const data = await fetchIntervals(
        `/athlete/${ATHLETE_ID}/activities?oldest=${thirtyDaysAgo}&newest=${today}&fields=id,name,type,moving_time,icu_zone_times`
      )
      res.json(data)
    } else {
      res.status(400).json({ error: "Unknown endpoint" })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
