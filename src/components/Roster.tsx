import { useState, useEffect } from 'react'
import type { Player, PlayerStats } from '../types'
import styles from './Roster.module.css'

interface Props {
  rosters: { away: Player[]; home: Player[] }
  playerStats: { away: PlayerStats[]; home: PlayerStats[] }
  batterIndex: { away: number; home: number }
  halfInning: 'top' | 'bottom'
}

export default function Roster({ rosters, playerStats, batterIndex, halfInning }: Props) {
  const [activeTab, setActiveTab] = useState<'away' | 'home'>(
    halfInning === 'top' ? 'away' : 'home'
  )

  // Auto-switch tabs when inning half changes
  useEffect(() => {
    setActiveTab(halfInning === 'top' ? 'away' : 'home')
  }, [halfInning])

  const roster = activeTab === 'away' ? rosters.away : rosters.home
  const stats = activeTab === 'away' ? playerStats.away : playerStats.home
  const currentBatter = activeTab === 'away' ? batterIndex.away : batterIndex.home
  const isBatting = (activeTab === 'away' && halfInning === 'top') || (activeTab === 'home' && halfInning === 'bottom')

  function renderAvg(ab: number, hits: number) {
    if (ab === 0) return '---'
    const avg = hits / ab
    return avg.toFixed(3).replace(/^0/, '')
  }

  return (
    <div className={styles.rosterContainer}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'away' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('away')}
        >
          Away Roster
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'home' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('home')}
        >
          Home Roster
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.rosterTable}>
          <thead>
            <tr>
              <th className={styles.numCol}>#</th>
              <th className={styles.posCol}>Pos</th>
              <th className={styles.nameCol}>Name</th>
              <th>AB</th>
              <th>H</th>
              <th>BB</th>
              <th>HR</th>
              <th>RBI</th>
              <th>AVG</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((p, i) => {
              const s = stats[i]
              const isCurrent = isBatting && i === currentBatter
              return (
                <tr key={i} className={isCurrent ? styles.currentBatter : ''}>
                  <td className={styles.numCol}>{i + 1}</td>
                  <td className={styles.posCol}>{p.position}</td>
                  <td className={styles.nameCol}>
                    {p.name} {isCurrent && <span className={styles.batterIcon}>⚾</span>}
                  </td>
                  <td>{s.ab}</td>
                  <td>{s.hits}</td>
                  <td>{s.walks}</td>
                  <td>{s.hr}</td>
                  <td>{s.rbi}</td>
                  <td>{renderAvg(s.ab, s.hits)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
