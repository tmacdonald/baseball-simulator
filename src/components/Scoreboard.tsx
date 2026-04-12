import styles from './Scoreboard.module.css'

interface Props {
  score: { away: number[]; home: number[] }
  hits: { away: number; home: number }
  inning: number
  halfInning: 'top' | 'bottom'
  gameOver: boolean
}


export default function Scoreboard({ score, hits, inning, halfInning, gameOver }: Props) {
  const totalInnings = Math.max(9, score.away.length)
  const cols = Array.from({ length: totalInnings }, (_, i) => i + 1)

  function awayCell(arr: number[], i: number, col: number) {
    const isCurrentCol = !gameOver && col === inning
    if (arr[i] === undefined) {
      return (
        <td key={col} className={`${styles.unplayed} ${isCurrentCol ? styles.activeCol : ''}`}>–</td>
      )
    }
    return (
      <td key={col} className={isCurrentCol ? styles.activeCol : ''}>{arr[i]}</td>
    )
  }

  function homeCell(arr: number[], i: number, col: number) {
    const isCurrentCol = !gameOver && col === inning
    // Home team hasn't batted yet this inning while it's still the top half
    const notYetBatted = isCurrentCol && halfInning === 'top'
    if (arr[i] === undefined || notYetBatted) {
      return (
        <td key={col} className={`${styles.unplayed} ${isCurrentCol ? styles.activeCol : ''}`}>–</td>
      )
    }
    return (
      <td key={col} className={isCurrentCol ? styles.activeCol : ''}>{arr[i]}</td>
    )
  }

  const awayTotal = score.away.reduce((a, b) => a + b, 0)
  const homeTotal = score.home.reduce((a, b) => a + b, 0)

  return (
    <table className={styles.scoreboard} aria-label="Scoreboard">
      <thead>
        <tr>
          <th></th>
          {cols.map((c) => (
            <th
              key={c}
              className={!gameOver && c === inning ? styles.activeCol : ''}
            >
              {c}
            </th>
          ))}
          <th>R</th>
          <th>H</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className={styles.teamName}>
            {halfInning === 'top' && !gameOver ? '▶ Away' : 'Away'}
          </td>
          {cols.map((c, i) => awayCell(score.away, i, c))}
          <td className={styles.totalRuns}>{awayTotal}</td>
          <td className={styles.totalHits}>{hits.away}</td>
        </tr>
        <tr>
          <td className={styles.teamName}>
            {halfInning === 'bottom' && !gameOver ? '▶ Home' : 'Home'}
          </td>
          {cols.map((c, i) => homeCell(score.home, i, c))}
          <td className={styles.totalRuns}>{homeTotal}</td>
          <td className={styles.totalHits}>{hits.home}</td>
        </tr>
      </tbody>
    </table>
  )
}
