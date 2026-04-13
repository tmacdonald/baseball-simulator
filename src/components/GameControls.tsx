import styles from './GameControls.module.css'

interface Props {
  inning: number
  halfInning: 'top' | 'bottom'
  outs: number
  isRolling: boolean
  gameOver: boolean
  onRoll: () => void
  onSimulateInning: () => void
  onSimulateGame: () => void
  onNewGame: () => void
}

const OUT_DOTS = ['○', '○', '○']

export default function GameControls({ inning, halfInning, outs, isRolling, gameOver, onRoll, onSimulateInning, onSimulateGame, onNewGame }: Props) {
  const half = halfInning === 'top' ? '▲' : '▼'
  const outDisplay = OUT_DOTS.map((d, i) => (i < outs ? '●' : d)).join(' ')

  return (
    <div className={styles.wrap}>
      <div className={styles.context}>
        <span id="inning-indicator">Inning {inning} {half}</span>
        <span id="outs-indicator" aria-label={`${outs} outs`}>{outDisplay} Outs</span>
      </div>
      <div className={styles.buttons}>
        {!gameOver && (
          <>
            <button
              id="roll-btn"
              className={styles.rollBtn}
              onClick={onRoll}
              disabled={isRolling}
              aria-label="Simulate at bat"
            >
              {isRolling ? 'Simulating…' : '⚾ Simulate at bat'}
            </button>
            <button
              id="simulate-inning-btn"
              className={styles.rollBtn}
              onClick={onSimulateInning}
              disabled={isRolling}
              aria-label="Simulate inning"
              style={{ marginLeft: '8px' }}
            >
              ⏩ Simulate inning
            </button>
            <button
              id="simulate-game-btn"
              className={styles.rollBtn}
              onClick={onSimulateGame}
              disabled={isRolling}
              aria-label="Simulate game"
              style={{ marginLeft: '8px' }}
            >
              ⏭️ Simulate game
            </button>
          </>
        )}
        {gameOver && (
          <button
            id="new-game-btn"
            className={styles.rollBtn}
            onClick={onNewGame}
            aria-label="Start a new game"
          >
            New Game
          </button>
        )}
      </div>
    </div>
  )
}
