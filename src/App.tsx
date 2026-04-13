import { useReducer, useCallback, useState, useEffect } from 'react'
import { gameReducer, initialState } from './gameReducer'
import { rollDice, resolveOutcome } from './diceLogic'
import type { DiceScheme } from './types'
import Scoreboard from './components/Scoreboard'
import Diamond from './components/Diamond'
import Dice from './components/Dice'
import AtBatResult from './components/AtBatResult'
import GameControls from './components/GameControls'
import GameLog from './components/GameLog'
import Roster from './components/Roster'
import CareerStats from './components/CareerStats'
import { getCareerStats, saveGameStats } from './statsStorage'
import type { CareerStatsData } from './statsStorage'
import styles from './App.module.css'

export function GameInstance() {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const [diceScheme, setDiceScheme] = useState<DiceScheme>('d20')
  const [currentRoll, setCurrentRoll] = useState<[number, number] | null>(null)

  // We keep isRolling just to support the Dice UI or potential future UI delays,
  // but currently we do logic synchronously.
  const [isRolling, setIsRolling] = useState(false)

  const [careerStats, setCareerStats] = useState<CareerStatsData | null>(null)
  const [hasSavedStats, setHasSavedStats] = useState(false)

  // Save stats when game is over
  useEffect(() => {
    if (state.gameOver && !hasSavedStats) {
      saveGameStats(state.playerStats)
      setCareerStats(getCareerStats())
      setHasSavedStats(true)
    } else if (!state.gameOver && hasSavedStats) {
      // Reset when a new game starts
      setHasSavedStats(false)
      setCareerStats(null)
    }
  }, [state.gameOver, hasSavedStats, state.playerStats])

  const handleRoll = useCallback(() => {
    if (state.gameOver || isRolling) return

    const team = state.halfInning === 'top' ? 'away' : 'home'
    const batterIdx = state.batterIndex[team]
    const batter = state.rosters[team][batterIdx]
    const roll = rollDice(diceScheme, batter.bonus)
    setCurrentRoll(roll)

    const hasRunner = state.bases[0] !== null || state.bases[1] !== null || state.bases[2] !== null
    const outcome = resolveOutcome(roll, diceScheme, hasRunner, state.outs)

    dispatch({ type: 'PLAY', outcome })
  }, [state.bases, state.outs, state.gameOver, diceScheme, isRolling])

  const handleSimulateInning = useCallback(() => {
    if (state.gameOver || isRolling) return

    let s = state
    const startInning = s.inning
    const startHalf = s.halfInning

    while (!s.gameOver && s.inning === startInning && s.halfInning === startHalf) {
      const team = s.halfInning === 'top' ? 'away' : 'home'
      const batterIdx = s.batterIndex[team]
      const batter = s.rosters[team][batterIdx]
      const roll = rollDice(diceScheme, batter.bonus)
      const hasRunner = s.bases[0] !== null || s.bases[1] !== null || s.bases[2] !== null
      const outcome = resolveOutcome(roll, diceScheme, hasRunner, s.outs)
      s = gameReducer(s, { type: 'PLAY', outcome })
    }

    setCurrentRoll(null)
    dispatch({ type: 'REPLACE_STATE', state: s })
  }, [state, diceScheme, isRolling])

  const handleSimulateGame = useCallback(() => {
    if (state.gameOver || isRolling) return

    let s = state

    while (!s.gameOver) {
      const team = s.halfInning === 'top' ? 'away' : 'home'
      const batterIdx = s.batterIndex[team]
      const batter = s.rosters[team][batterIdx]
      const roll = rollDice(diceScheme, batter.bonus)
      const hasRunner = s.bases[0] !== null || s.bases[1] !== null || s.bases[2] !== null
      const outcome = resolveOutcome(roll, diceScheme, hasRunner, s.outs)
      s = gameReducer(s, { type: 'PLAY', outcome })
    }

    setCurrentRoll(null)
    dispatch({ type: 'REPLACE_STATE', state: s })
  }, [state, diceScheme, isRolling])

  const handleNewGame = useCallback(() => {
    setCurrentRoll(null)
    dispatch({ type: 'NEW_GAME' })
  }, [])

  const handleSchemeChange = useCallback((scheme: DiceScheme) => {
    setDiceScheme(scheme)
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
              className={`${styles.schemeBtn} ${diceScheme === 'classic' ? styles.schemeBtnActive : ''}`}
              onClick={() => handleSchemeChange('classic')}
              disabled={state.log.length > 0 && !state.gameOver}
              title="Sum-based: higher batting average"
            >
              Classic
            </button>
            <button
              className={`${styles.schemeBtn} ${diceScheme === 'realistic' ? styles.schemeBtnActive : ''}`}
              onClick={() => handleSchemeChange('realistic')}
              disabled={state.log.length > 0 && !state.gameOver}
              title="Combination-based: realistic batting average"
            >
              Realistic
            </button>
            <button
              className={`${styles.schemeBtn} ${diceScheme === 'd20' ? styles.schemeBtnActive : ''}`}
              onClick={() => handleSchemeChange('d20')}
              disabled={state.log.length > 0 && !state.gameOver}
              title="D20-based: classic tabletop mechanics"
            >
              D20
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
            batter={state.halfInning === 'top' ? state.batterIndex.away : state.batterIndex.home}
          />
        </section>

        {/* Center: Dice + result */}
        <section className={styles.centerSection} aria-label="Dice roll">
          <AtBatResult result={state.lastResult} />
          <Dice roll={currentRoll} isRolling={isRolling} faces={diceScheme === 'd20' ? 20 : 6} />
          <GameControls
            inning={state.inning}
            halfInning={state.halfInning}
            outs={state.outs}
            isRolling={isRolling}
            gameOver={state.gameOver}
            onRoll={handleRoll}
            onSimulateInning={handleSimulateInning}
            onSimulateGame={handleSimulateGame}
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

      {/* Career Stats */}
      {state.gameOver && careerStats && (
        <section className={styles.logSection} aria-label="Career Stats">
          <div className={styles.sectionLabel}>Career Stats</div>
          <CareerStats
            rosters={state.rosters}
            careerStats={careerStats}
          />
        </section>
      )}

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
      </div>
    </div>
  )
}
