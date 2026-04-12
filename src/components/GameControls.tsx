import styles from './GameControls.module.css'

interface Props {
  inning: number
  halfInning: 'top' | 'bottom'
  outs: number
  isRolling: boolean
  gameOver: boolean
  onRoll: () => void
  onNewGame: () => void
}

const OUT_DOTS = ['○', '○', '○']

export default function GameControls({ inning, halfInning, outs, isRolling, gameOver, onRoll, onNewGame }: Props) {
  const half = halfInning === 'top' ? '▲' : '▼'
  const outDisplay = OUT_DOTS.map((d, i) => (i < outs ? '●' : d)).join(' ')

  return (
    <div className={styles.wrap}>
      <div className={styles.context}>
        <span id="inning-indicator">Inning {inning} {half}</span>
        <span id="outs-indicator" aria-label={`${outs} outs`}>{outDisplay} Outs</span>
      </div>
      <div className={styles.buttons}>
        <button
          id="roll-btn"
          className={styles.rollBtn}
          onClick={onRoll}
          disabled={isRolling || gameOver}
          aria-label="Roll the dice"
        >
          {isRolling ? 'Rolling…' : '🎲 Roll'}
        </button>
        <button
          id="new-game-btn"
          className={styles.newGameBtn}
          onClick={onNewGame}
          aria-label="Start a new game"
        >
          New Game
        </button>
      </div>
    </div>
  )
}
