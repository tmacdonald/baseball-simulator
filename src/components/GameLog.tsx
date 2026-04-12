import { useEffect, useRef } from 'react'
import styles from './GameLog.module.css'

interface Props {
  log: string[]
}

export default function GameLog({ log }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [log])

  return (
    <div ref={containerRef} className={styles.logPanel} id="game-log" aria-label="Play-by-play log" aria-live="polite">
      {log.length === 0 ? (
        <p className={styles.empty}>Play-by-play will appear here…</p>
      ) : (
        log.map((entry, i) => (
          <div key={i} className={styles.entry}>{entry}</div>
        ))
      )}
    </div>
  )
}
