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

  function renderOBP(ab: number, hits: number, walks: number) {
    if (ab + walks === 0) return '---'
    const obp = (hits + walks) / (ab + walks)
    return obp.toFixed(3).replace(/^0/, '')
  }

  function renderSLG(ab: number, singles: number, doubles: number, triples: number, hr: number) {
    if (ab === 0) return '---'
    const tb = singles + (2 * doubles) + (3 * triples) + (4 * hr)
    const slg = tb / ab
    return slg.toFixed(3).replace(/^0/, '')
  }

  const totalAB = stats.reduce((sum, s) => sum + s.ab, 0)
  const totalH = stats.reduce((sum, s) => sum + s.hits, 0)
  const totalSingles = stats.reduce((sum, s) => sum + s.singles, 0)
  const totalDoubles = stats.reduce((sum, s) => sum + s.doubles, 0)
  const totalTriples = stats.reduce((sum, s) => sum + s.triples, 0)
  const totalR = stats.reduce((sum, s) => sum + s.runs, 0)
  const totalBB = stats.reduce((sum, s) => sum + s.walks, 0)
  const totalHR = stats.reduce((sum, s) => sum + s.hr, 0)
  const totalRBI = stats.reduce((sum, s) => sum + s.rbi, 0)

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
              <th>R</th>
              <th>BB</th>
              <th>HR</th>
              <th>RBI</th>
              <th>AVG</th>
              <th>OBP</th>
              <th>SLG</th>
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
                    {p.name} 
                    {p.bonus === 'plus_one' && <span className={styles.bonusBadge} title="+1 Die Modifier">🎲+1</span>} 
                    {p.bonus === 'advantage' && <span className={styles.bonusBadge} title="Advantage (Roll twice, take max)">🎲Adv</span>} 
                    {isCurrent && <span className={styles.batterIcon}>⚾</span>}
                  </td>
                  <td>{s.ab}</td>
                  <td>{s.hits}</td>
                  <td>{s.runs}</td>
                  <td>{s.walks}</td>
                  <td>{s.hr}</td>
                  <td>{s.rbi}</td>
                  <td>{renderAvg(s.ab, s.hits)}</td>
                  <td>{renderOBP(s.ab, s.hits, s.walks)}</td>
                  <td>{renderSLG(s.ab, s.singles, s.doubles, s.triples, s.hr)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className={styles.totalsRow}>
              <td colSpan={3} className={styles.nameCol} style={{ textAlign: 'right', paddingRight: '1rem' }}>Totals</td>
              <td>{totalAB}</td>
              <td>{totalH}</td>
              <td>{totalR}</td>
              <td>{totalBB}</td>
              <td>{totalHR}</td>
              <td>{totalRBI}</td>
              <td>{renderAvg(totalAB, totalH)}</td>
              <td>{renderOBP(totalAB, totalH, totalBB)}</td>
              <td>{renderSLG(totalAB, totalSingles, totalDoubles, totalTriples, totalHR)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
