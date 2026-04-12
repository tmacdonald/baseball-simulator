import type { Outcome } from '../types'
import styles from './AtBatResult.module.css'

interface Props {
  result: string | null
}

const HITS = new Set<Outcome>(['Single', 'Double', 'Triple'])
const OUTS = new Set<Outcome>(['Out (fly out)', 'Out (ground out)', 'Out (strikeout)', 'Foul Out', 'Double Play'])

function colorClass(result: string | null): string {
  if (!result) return ''
  if (result === 'Home Run') return styles.hrColor
  if (HITS.has(result as Outcome)) return styles.hitColor
  if (result === 'Walk') return styles.walkColor
  if (OUTS.has(result as Outcome)) return styles.outColor
  return ''
}

export default function AtBatResult({ result }: Props) {
  return (
    <div className={styles.wrap}>
      {result && (
        <span
          key={result + Date.now()}
          className={`${styles.result} ${colorClass(result)}`}
          aria-live="assertive"
          aria-atomic="true"
        >
          {result}
        </span>
      )}
    </div>
  )
}
