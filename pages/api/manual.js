import fs from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "manual.json")

function readData() {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial = { rehab: [], peptides: [], bodyComp: [] }
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2))
      return initial
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"))
  } catch {
    return { rehab: [], peptides: [], bodyComp: [] }
  }
}

function writeData(data) {
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

export default function handler(req, res) {
  const { type } = req.query

  if (req.method === "GET") {
    const data = readData()
    if (type) {
      res.json(data[type] || [])
    } else {
      res.json(data)
    }
  } else if (req.method === "POST") {
    const data = readData()
    const entry = { ...req.body, id: Date.now(), createdAt: new Date().toISOString() }
    if (!data[type]) data[type] = []
    data[type].unshift(entry)
    writeData(data)
    res.json(entry)
  } else if (req.method === "DELETE") {
    const { id } = req.body
    const data = readData()
    if (data[type]) {
      data[type] = data[type].filter((e) => e.id !== id)
      writeData(data)
    }
    res.json({ ok: true })
  } else {
    res.status(405).json({ error: "Method not allowed" })
  }
}
