import styles from "./Components.module.css"

export function MetricTile({ label, value, sub, subType = "flat", accentColor = "blue" }) {
  return (
    <div className={`${styles.metricTile} ${styles[`accent_${accentColor}`]}`}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
      {sub && <div className={`${styles.metricSub} ${styles[subType]}`}>{sub}</div>}
    </div>
  )
}

export function Card({ title, children, style }) {
  return (
    <div className={styles.card} style={style}>
      {title && <div className={styles.cardTitle}>{title}</div>}
      {children}
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <div className={styles.spinnerWrap}>
      <div className={styles.spinner} />
    </div>
  )
}

export function ErrorMsg({ msg }) {
  return <div className={styles.errorMsg}>{msg}</div>
}

export function SectionNote({ children }) {
  return <div className={styles.sectionNote}>{children}</div>
}

export function Pill({ label, type = "neutral" }) {
  return <span className={`${styles.pill} ${styles[`pill_${type}`]}`}>{label}</span>
}

export function NRSBar({ value, max = 10 }) {
  const pct = Math.round((value / max) * 100)
  const color = value <= 3 ? "var(--green)" : value <= 6 ? "var(--amber)" : "var(--red)"
  return (
    <div className={styles.nrsWrap}>
      <div className={styles.nrsTrack}>
        <div className={styles.nrsFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.nrsVal}>{value}</span>
    </div>
  )
}
