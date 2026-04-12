import { useState, useEffect } from 'react'

export default function RehabTab() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/rehab-schedule.json')
      .then(r => r.json())
      .then(data => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const upcoming = (data.sessions || [])
          .filter(s => new Date(s.date + 'T00:00:00') >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
        setSessions(upcoming)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  function fmtDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function isToday(dateStr) {
    const today = new Date()
    const d = new Date(dateStr + 'T00:00:00')
    return d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
  }

  function isNext(index) {
    return index === 0
  }

  if (loading) return (
    <div style={{ padding: 32, color: '#6b7280' }}>Loading rehab schedule...</div>
  )

  if (error) return (
    <div style={{ padding: 32, color: '#ef4444' }}>Error: {error}</div>
  )

  if (sessions.length === 0) return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Rehab Programme</h2>
      <p style={{ color: '#6b7280' }}>No upcoming sessions scheduled. Upload your next week's programme to add sessions.</p>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Rehab Programme</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sessions.map((session, idx) => (
          <div key={session.date} style={{
            background: isNext(idx) ? '#f0fdf4' : '#ffffff',
            border: isNext(idx) ? '2px solid #22c55e' : '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 20,
            boxShadow: isNext(idx) ? '0 2px 8px rgba(34,197,94,0.15)' : '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {isNext(idx) && (
                <span style={{
                  background: '#22c55e', color: '#fff', fontSize: 11, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 20, letterSpacing: '0.05em', textTransform: 'uppercase'
                }}>Next</span>
              )}
              {isToday(session.date) && (
                <span style={{
                  background: '#3b82f6', color: '#fff', fontSize: 11, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 20, letterSpacing: '0.05em', textTransform: 'uppercase'
                }}>Today</span>
              )}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{session.name}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{fmtDate(session.date)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {session.exercises.map((ex, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '6px 10px', borderRadius: 8,
                  background: ex.label === '🔥' ? 'rgba(251,191,36,0.08)' : 'rgba(0,0,0,0.02)'
                }}>
                  <span style={{
                    minWidth: 28, fontSize: 13, fontWeight: 700,
                    color: ex.label === '🔥' ? '#f59e0b' : '#6366f1',
                    paddingTop: 1
                  }}>{ex.label}</span>
                  <span style={{ fontSize: 14, color: '#374151' }}>{ex.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
