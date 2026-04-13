import { useReducer, useCallback } from 'react'
import { gameReducer, initialState } from './gameReducer'
import type { DiceScheme } from './types'
import Scoreboard from './components/Scoreboard'
import Diamond from './components/Diamond'
import Dice from './components/Dice'
import AtBatResult from './components/AtBatResult'
import GameControls from './components/GameControls'
import GameLog from './components/GameLog'
import Roster from './components/Roster'
import styles from './App.module.css'
export function GameInstance() {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const handleRoll = useCallback(() => {
    dispatch({ type: 'ROLL' })
  }, [])

  const handleNewGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])

  const handleSchemeChange = useCallback((scheme: DiceScheme) => {
    dispatch({ type: 'SET_SCHEME', scheme })
  }, [])

  const awayTotal = state.score.away.reduce((a, b) => a + b, 0)
  const homeTotal = state.score.home.reduce((a, b) => a + b, 0)

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.instanceHeader}>
        <div className={styles.headerRight}>
          <div className={styles.schemeToggle}>
            <button
              className={`${styles.schemeBtn} ${state.diceScheme === 'classic' ? styles.schemeBtnActive : ''}`}
              onClick={() => handleSchemeChange('classic')}
              disabled={state.log.length > 0 && !state.gameOver}
              title="Sum-based: higher batting average"
            >
              Classic
            </button>
            <button
              className={`${styles.schemeBtn} ${state.diceScheme === 'realistic' ? styles.schemeBtnActive : ''}`}
              onClick={() => handleSchemeChange('realistic')}
              disabled={state.log.length > 0 && !state.gameOver}
              title="Combination-based: realistic batting average"
            >
              Realistic
            </button>
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
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {/* Left: Diamond + context */}
        <section className={styles.fieldSection} aria-label="Field">
          <div className={styles.sectionLabel}>Field</div>
          <Diamond 
            bases={state.bases} 
            roster={state.halfInning === 'top' ? state.rosters.away : state.rosters.home} 
          />
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

      {/* Roster & Stats */}
      <section className={styles.logSection} aria-label="Team Rosters">
        <div className={styles.sectionLabel}>Team Rosters</div>
        <Roster
          rosters={state.rosters}
          playerStats={state.playerStats}
          batterIndex={state.batterIndex}
          halfInning={state.halfInning}
        />
      </section>

    </div>
  )
}

export default function App() {
  return (
    <div className={styles.rootContainer}>
      <header className={styles.mainHeader}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚾</span>
          <h1 className={styles.logoTitle}>Dice Baseball</h1>
        </div>
      </header>
      <div className={styles.dualGameWrapper}>
        <GameInstance />
        <GameInstance />
      </div>
    </div>
  )
}
