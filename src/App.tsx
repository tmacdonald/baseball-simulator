import { useReducer, useCallback, useState, useEffect } from 'react'
import { gameReducer, initialState } from './gameReducer'
import Scoreboard from './components/Scoreboard'
import Diamond from './components/Diamond'
import Dice from './components/Dice'
import AtBatResult from './components/AtBatResult'
import GameControls from './components/GameControls'
import GameLog from './components/GameLog'
import styles from './App.module.css'

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const [overlayOpen, setOverlayOpen] = useState(false)

  // Open the overlay whenever the game ends
  useEffect(() => {
    if (state.gameOver) setOverlayOpen(true)
  }, [state.gameOver])

  const handleRoll = useCallback(() => {
    dispatch({ type: 'ROLL' })
  }, [])

  const handleNewGame = useCallback(() => {
    setOverlayOpen(false)
    dispatch({ type: 'NEW_GAME' })
  }, [])

  const handleDismissOverlay = useCallback(() => {
    setOverlayOpen(false)
  }, [])

  const awayTotal = state.score.away.reduce((a, b) => a + b, 0)
  const homeTotal = state.score.home.reduce((a, b) => a + b, 0)

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚾</span>
          <h1 className={styles.logoTitle}>Dice Baseball</h1>
        </div>
        <div className={styles.headerScore}>
          <span className={styles.teamScore}>
            Away <strong>{awayTotal}</strong>
          </span>
          <span className={styles.scoreSep}>–</span>
          <span className={styles.teamScore}>
            <strong>{homeTotal}</strong> Home
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {/* Left: Diamond + context */}
        <section className={styles.fieldSection} aria-label="Field">
          <div className={styles.sectionLabel}>Field</div>
          <Diamond bases={state.bases} />
        </section>

        {/* Center: Dice + result */}
        <section className={styles.centerSection} aria-label="Dice roll">
          <AtBatResult result={state.lastResult} />
          <Dice roll={state.currentRoll} isRolling={state.isRolling} />
          <GameControls
            inning={state.inning}
            halfInning={state.halfInning}
            outs={state.outs}
            isRolling={state.isRolling}
            gameOver={state.gameOver}
            onRoll={handleRoll}
            onNewGame={handleNewGame}
          />
        </section>
      </main>

      {/* Scoreboard */}
      <section className={styles.scoreboardSection} aria-label="Scoreboard">
        <Scoreboard
          score={state.score}
          hits={state.hits}
          inning={state.inning}
          halfInning={state.halfInning}
          gameOver={state.gameOver}
        />
      </section>

      {/* Game Log */}
      <section className={styles.logSection} aria-label="Play log">
        <div className={styles.sectionLabel}>Play-by-Play</div>
        <GameLog log={state.log} />
      </section>

      {/* Game Over Overlay */}
      {state.gameOver && overlayOpen && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Game over"
          onClick={(e) => { if (e.target === e.currentTarget) handleDismissOverlay() }}
        >
          <div className={styles.overlayCard}>
            <button
              id="close-overlay-btn"
              className={styles.overlayClose}
              onClick={handleDismissOverlay}
              aria-label="Close and review game"
            >
              ✕
            </button>
            <div className={styles.overlayIcon}>⚾</div>
            <h2 className={styles.overlayTitle}>Game Over!</h2>
            <div className={styles.overlayScore}>
              {awayTotal > homeTotal
                ? `Away wins ${awayTotal}–${homeTotal}`
                : awayTotal < homeTotal
                ? `Home wins ${homeTotal}–${awayTotal}`
                : `Tied ${awayTotal}–${homeTotal}`}
            </div>
            <p className={styles.overlayResult}>
              {awayTotal > homeTotal
                ? '🏆 Away team takes the win!'
                : awayTotal < homeTotal
                ? '🏆 Home team takes the win!'
                : "It's a tie game!"}
            </p>
            <div className={styles.overlayActions}>
              <button
                id="play-again-btn"
                className={styles.overlayBtn}
                onClick={handleNewGame}
              >
                Play Again
              </button>
              <button
                id="review-game-btn"
                className={styles.overlayReviewBtn}
                onClick={handleDismissOverlay}
              >
                Review Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
