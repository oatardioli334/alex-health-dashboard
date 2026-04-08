import { getServerSession } from "next-auth"
import { authOptions } from "./auth/[...nextauth]"

const BASE = "https://api.ouraring.com/v2/usercollection"

async function fetchOura(path, accessToken) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Oura API error: ${res.status}`)
  return res.json()
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.accessToken) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  const { endpoint } = req.query
  const token = session.accessToken

  try {
    const today = new Date().toISOString().split("T")[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    if (endpoint === "sleep") {
      const data = await fetchOura(
        `/sleep?start_date=${thirtyDaysAgo}&end_date=${today}`,
        token
      )
      res.json(data)
    } else if (endpoint === "readiness") {
      const data = await fetchOura(
        `/daily_readiness?start_date=${thirtyDaysAgo}&end_date=${today}`,
        token
      )
      res.json(data)
    } else if (endpoint === "hrv") {
      const data = await fetchOura(
        `/daily_cardiovascular_age?start_date=${thirtyDaysAgo}&end_date=${today}`,
        token
      )
      res.json(data)
    } else if (endpoint === "heartrate") {
      const data = await fetchOura(
        `/heartrate?start_datetime=${thirtyDaysAgo}T00:00:00&end_datetime=${today}T23:59:59`,
        token
      )
      res.json(data)
    } else {
      res.status(400).json({ error: "Unknown endpoint" })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
