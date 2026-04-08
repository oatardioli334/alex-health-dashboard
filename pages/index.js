import { useSession, signIn, signOut } from "next-auth/react"
import { useState } from "react"
import Head from "next/head"
import RecoveryTab from "../tabs/RecoveryTab"
import TrainingTab from "../tabs/TrainingTab"
import StrengthTab from "../tabs/StrengthTab"
import RehabTab from "../tabs/RehabTab"
import PeptidesTab from "../tabs/PeptidesTab"
import styles from "./index.module.css"

const TABS = [
  { id: "recovery", label: "Recovery" },
  { id: "training", label: "Training" },
  { id: "strength", label: "Strength" },
  { id: "rehab", label: "Rehab" },
  { id: "peptides", label: "Peptides" },
]

function LiveDot() {
  return <span className={styles.liveDot} />
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("recovery")
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  if (status === "loading") {
    return (
      <div className={styles.loadScreen}>
        <div className={styles.loadSpinner} />
      </div>
    )
  }

  if (!session) {
    return (
      <div className={styles.loginScreen}>
        <Head><title>Alex — Health Dashboard</title></Head>
        <div className={styles.loginCard}>
          <div className={styles.loginTitle}>Alex Tardioli</div>
          <div className={styles.loginSub}>Health & Performance Dashboard</div>
          <div className={styles.loginMeta}>Connect Oura to load your recovery data</div>
          <button className={styles.loginBtn} onClick={() => signIn("oura")}>
            Connect Oura Ring
          </button>
          <div className={styles.loginNote}>
            Intervals.icu and Hevy data loads automatically after sign-in
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dash}>
      <Head>
        <title>Alex — Health Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <LiveDot />
          <span className={styles.headerName}>Alex Tardioli</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.headerDate}>{today}</span>
          <button className={styles.signOutBtn} onClick={() => signOut()}>Sign out</button>
        </div>
      </div>

      <div className={styles.tabRow}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === "recovery" && <RecoveryTab />}
        {activeTab === "training" && <TrainingTab />}
        {activeTab === "strength" && <StrengthTab />}
        {activeTab === "rehab" && <RehabTab />}
        {activeTab === "peptides" && <PeptidesTab />}
      </div>
    </div>
  )
}
