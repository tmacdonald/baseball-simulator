import type { GameState, GameAction, Outcome, DiceScheme, Player, PlayerStats } from './types'

// ─── Helpers ────────────────────────────────────────────────────────────────

export function rollDice(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ]
}

export function outcomeForRoll(sum: number): Outcome {
  switch (sum) {
    case 2: return 'Home Run'
    case 3: return 'Triple'
    case 4: return 'Double'
    case 5: return 'Single'
    case 6: return 'Single'
    case 7: return 'Out (fly out)'
    case 8: return 'Out (ground out)'
    case 9: return 'Out (strikeout)'
    case 10: return 'Walk'
    case 11: return 'Double Play'
    case 12: return 'Out (foul out)'
    default: return 'Out (fly out)'
  }
}

// ─── Realistic scheme ────────────────────────────────────────────────────────
// Maps specific dice *combinations* (not sums) to outcomes.
// Reach-base combinations (7 of 36 ≈ 19.4%):
//   1-1 → Home Run   |  6-6 → Triple   |  1-2 → Double
//   1-3, 2-2, 5-6 → Single            |  4-4 → Walk
// All other 29 combinations → Out (randomly varied)

function sortedPair(a: number, b: number): string {
  return a <= b ? `${a}-${b}` : `${b}-${a}`
}

const RANDOM_OUT_TYPES: Outcome[] = [
  'Out (ground out)',
  'Out (fly out)',
  'Out (foul out)',
  'Out (strikeout)',
]

function randomOut(hasRunner: boolean, outs: number): Outcome {
  // Double play only when there is a runner on base and fewer than 2 outs
  if (hasRunner && outs < 2 && Math.random() < 0.15) {
    return 'Double Play'
  }
  return RANDOM_OUT_TYPES[Math.floor(Math.random() * RANDOM_OUT_TYPES.length)]
}

export function outcomeForDice(
  d1: number,
  d2: number,
  hasRunner: boolean,
  outs: number,
): Outcome {
  // Check doubles first (order-independent)
  if (d1 === 1 && d2 === 1) return 'Home Run'
  if (d1 === 6 && d2 === 6) return 'Triple'
  if (d1 === 4 && d2 === 4) return 'Walk'
  if (d1 === 2 && d2 === 2) return 'Single'

  // Order-independent pair check
  const pair = sortedPair(d1, d2)
  switch (pair) {
    case '1-2': return 'Double'
    case '1-3': return 'Single'
    case '5-6': return 'Single'
    default: return randomOut(hasRunner, outs)
  }
}

export function resolveOutcome(
  roll: [number, number],
  scheme: DiceScheme,
  hasRunner: boolean,
  outs: number,
): Outcome {
  if (scheme === 'realistic') {
    return outcomeForDice(roll[0], roll[1], hasRunner, outs)
  }
  return outcomeForRoll(roll[0] + roll[1])
}

function scoreRuns(state: GameState, runs: number): GameState {
  const score = {
    away: [...state.score.away],
    home: [...state.score.home],
  }
  const idx = state.inning - 1
  if (state.halfInning === 'top') {
    score.away[idx] = (score.away[idx] ?? 0) + runs
  } else {
    score.home[idx] = (score.home[idx] ?? 0) + runs
  }
  return { ...state, score }
}

interface BaserunningResult {
  state: GameState
  scoringRunners: number[]
}

// ─── Baserunning ─────────────────────────────────────────────────────────────

function applyBaserunning(state: GameState, outcome: Outcome, batterIndex: number): BaserunningResult {
  let s = { ...state, bases: [...state.bases] as [number | null, number | null, number | null] }
  let scoringRunners: number[] = []
  let runsScored = 0

  switch (outcome) {
    case 'Out (fly out)':
    case 'Out (ground out)':
    case 'Out (strikeout)':
    case 'Out (foul out)':
      s.outs++
      break

    case 'Double Play': {
      const hasRunner = s.bases[0] !== null || s.bases[1] !== null || s.bases[2] !== null
      if (hasRunner && s.outs < 2) {
        if (s.bases[2] !== null) s.bases[2] = null
        else if (s.bases[1] !== null) s.bases[1] = null
        else s.bases[0] = null
        s.outs += 2
      } else {
        s.outs++
      }
      break
    }

    case 'Walk': {
      if (s.bases[0] !== null && s.bases[1] !== null && s.bases[2] !== null) {
        scoringRunners.push(s.bases[2])
        runsScored += 1
      } else if (s.bases[0] !== null && s.bases[1] !== null) {
        s.bases[2] = s.bases[1]
      } else if (s.bases[0] !== null) {
        s.bases[1] = s.bases[0]
      }
      s.bases[0] = batterIndex
      if (runsScored > 0) s = scoreRuns(s, runsScored)
      break
    }

    case 'Single': {
      if (s.bases[2] !== null) { scoringRunners.push(s.bases[2]); runsScored++ }
      s.bases[2] = s.bases[1]
      s.bases[1] = s.bases[0]
      s.bases[0] = batterIndex
      if (runsScored > 0) s = scoreRuns(s, runsScored)
      break
    }

    case 'Double': {
      if (s.bases[2] !== null) { scoringRunners.push(s.bases[2]); runsScored++ }
      if (s.bases[1] !== null) { scoringRunners.push(s.bases[1]); runsScored++ }
      s.bases[2] = s.bases[0]
      s.bases[1] = batterIndex
      s.bases[0] = null
      if (runsScored > 0) s = scoreRuns(s, runsScored)
      break
    }

    case 'Triple': {
      if (s.bases[0] !== null) { scoringRunners.push(s.bases[0]); runsScored++ }
      if (s.bases[1] !== null) { scoringRunners.push(s.bases[1]); runsScored++ }
      if (s.bases[2] !== null) { scoringRunners.push(s.bases[2]); runsScored++ }
      s.bases = [null, null, batterIndex]
      if (runsScored > 0) s = scoreRuns(s, runsScored)
      break
    }

    case 'Home Run': {
      if (s.bases[0] !== null) { scoringRunners.push(s.bases[0]); runsScored++ }
      if (s.bases[1] !== null) { scoringRunners.push(s.bases[1]); runsScored++ }
      if (s.bases[2] !== null) { scoringRunners.push(s.bases[2]); runsScored++ }
      scoringRunners.push(batterIndex)
      runsScored++
      s.bases = [null, null, null]
      s = scoreRuns(s, runsScored)
      break
    }
  }

  return { state: s, scoringRunners }
}

// ─── Inning transitions ──────────────────────────────────────────────────────

function awayTotal(score: GameState['score']): number {
  return score.away.reduce((a, b) => a + b, 0)
}
function homeTotal(score: GameState['score']): number {
  return score.home.reduce((a, b) => a + b, 0)
}

function advanceInning(state: GameState): GameState {
  let s = { ...state, outs: 0, bases: [null, null, null] as [number | null, number | null, number | null] }

  if (s.halfInning === 'top') {
    // Switch to bottom half
    s.halfInning = 'bottom'
    // Walk-off check: if inning >= 9 and home team already leads…
    // (won't trigger at top-switch unless away is still batting — home handled below)
  } else {
    // End of bottom half → new inning
    const away = awayTotal(s.score)
    const home = homeTotal(s.score)

    // Game over: home wins (extra innings or reg) after bottom half
    if (s.inning >= 9 && home !== away) {
      return { ...s, gameOver: true }
    }

    s.inning++
    s.halfInning = 'top'

    // Ensure score arrays have a slot for the new inning
    while (s.score.away.length < s.inning) s.score = { ...s.score, away: [...s.score.away, 0], home: [...s.score.home, 0] }
  }

  return s
}

function checkWalkOff(state: GameState): GameState {
  // After each play in the bottom half of inning 9+, if home team leads → game over
  if (state.halfInning === 'bottom' && state.inning >= 9) {
    const away = awayTotal(state.score)
    const home = homeTotal(state.score)
    if (home > away) {
      return { ...state, gameOver: true }
    }
  }
  return state
}

function checkSkipBottom9(state: GameState): GameState {
  // At the transition to bottom of inning 9, skip if home already leads
  if (state.halfInning === 'bottom' && state.inning === 9) {
    const away = awayTotal(state.score)
    const home = homeTotal(state.score)
    if (home > away) {
      return { ...state, gameOver: true }
    }
  }
  return state
}

// ─── Effective outcome label ─────────────────────────────────────────────────
//
// A "Double Play" roll (11) only produces an actual DP when there is at least
// one runner on base AND fewer than 2 outs.  Otherwise it is just an out.
// We compute the label BEFORE modifying state so that the display and log
// always reflect what truly happened.

function effectiveOutcome(state: GameState, outcome: Outcome): string {
  if (outcome === 'Double Play') {
    const hasRunner = state.bases[0] !== null || state.bases[1] !== null || state.bases[2] !== null
    if (!hasRunner || state.outs >= 2) return 'Out (ground out)'
  }
  return outcome
}

// ─── Log helper ──────────────────────────────────────────────────────────────

function logEntry(
  state: GameState,
  label: string,
  roll: [number, number],
  runsScored: number,
  newScore: GameState['score'],
): string {
  const half = state.halfInning === 'top' ? '▲' : '▼'
  const team = state.halfInning === 'top' ? 'Away' : 'Home'
  const runsSuffix = runsScored === 1
    ? ' · 1 run scores'
    : runsScored > 1
      ? ` · ${runsScored} runs score`
      : ''
  let scoreSuffix = ''
  if (runsScored > 0) {
    const away = newScore.away.reduce((a, b) => a + b, 0)
    const home = newScore.home.reduce((a, b) => a + b, 0)
    scoreSuffix = ` · Away ${away} – Home ${home}`
  }
  const rollLabel = state.diceScheme === 'realistic'
    ? `🎲 ${roll[0]}-${roll[1]}`
    : `Roll ${roll[0] + roll[1]} (${roll[0]}+${roll[1]})`
  return `${half}${state.inning} · ${team} · ${rollLabel} → ${label}${runsSuffix}${scoreSuffix}`
}

// ─── Initial state ────────────────────────────────────────────────────────────

const DEFAULT_ROSTER: Player[] = [
  { number: 1, name: 'Pitcher', position: 'P' },
  { number: 2, name: 'Catcher', position: 'C' },
  { number: 3, name: 'First Baseman', position: '1B' },
  { number: 4, name: 'Second Baseman', position: '2B' },
  { number: 5, name: 'Third Baseman', position: '3B' },
  { number: 6, name: 'Shortstop', position: 'SS' },
  { number: 7, name: 'Left Fielder', position: 'LF' },
  { number: 8, name: 'Center Fielder', position: 'CF' },
  { number: 9, name: 'Right Fielder', position: 'RF' },
]

function createEmptyStats(): PlayerStats[] {
  return Array.from({ length: 9 }, () => ({
    ab: 0,
    hits: 0,
    walks: 0,
    hr: 0,
    rbi: 0,
    runs: 0,
  }))
}

export function createInitialState(scheme: DiceScheme = 'classic'): GameState {
  return {
    inning: 1,
    halfInning: 'top',
    outs: 0,
    bases: [null, null, null],
    score: { away: [0], home: [0] },
    hits: { away: 0, home: 0 },
    gameOver: false,
    currentRoll: null,
    lastResult: null,
    log: [],
    isRolling: false,
    diceScheme: scheme,
    rosters: { away: [...DEFAULT_ROSTER], home: [...DEFAULT_ROSTER] },
    playerStats: { away: createEmptyStats(), home: createEmptyStats() },
    batterIndex: { away: 0, home: 0 },
  }
}

export const initialState: GameState = createInitialState()

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState(action.scheme ?? state.diceScheme)

    case 'SET_SCHEME':
      return { ...state, diceScheme: action.scheme }

    case 'ROLL': {
      if (state.gameOver || state.isRolling) return state

      const team = state.halfInning === 'top' ? 'away' : 'home'
      const batterIdx = state.batterIndex[team]
      const currentStats = state.playerStats[team]
      const newStats = [...currentStats]
      const statsForBatter = { ...newStats[batterIdx] }

      const roll = rollDice()
      const hasRunner = state.bases[0] !== null || state.bases[1] !== null || state.bases[2] !== null
      const outcome = resolveOutcome(roll, state.diceScheme, hasRunner, state.outs)
      const label = effectiveOutcome(state, outcome)
      const { state: nextState, scoringRunners } = applyBaserunning(state, outcome, batterIdx)
      const runsScored = scoringRunners.length
      const entry = logEntry(state, label, roll, runsScored, nextState.score)

      // Track hits
      const isHit = outcome === 'Single' || outcome === 'Double' || outcome === 'Triple' || outcome === 'Home Run'
      const hits = isHit
        ? {
          away: state.halfInning === 'top' ? state.hits.away + 1 : state.hits.away,
          home: state.halfInning === 'bottom' ? state.hits.home + 1 : state.hits.home,
        }
        : state.hits

      // Player stats updates
      const isWalk = outcome === 'Walk'

      if (isWalk) {
        statsForBatter.walks++
      } else {
        statsForBatter.ab++
      }
      if (isHit) {
        statsForBatter.hits++
        if (outcome === 'Home Run') {
          statsForBatter.hr++
        }
      }
      if (runsScored > 0) {
        statsForBatter.rbi += runsScored
      }
      
      newStats[batterIdx] = statsForBatter

      // Increment runs for scoring runners
      for (const rIdx of scoringRunners) {
        newStats[rIdx] = { ...newStats[rIdx], runs: newStats[rIdx].runs + 1 }
      }

      const playerStats = {
        ...state.playerStats,
        [team]: newStats,
      }

      // advance batter index
      const newBatterIndex = {
        ...state.batterIndex,
        [team]: (batterIdx + 1) % 9,
      }

      let s: GameState = { 
        ...nextState, 
        currentRoll: roll, 
        lastResult: label, 
        log: [...state.log, entry], 
        isRolling: false, 
        hits,
        playerStats,
        batterIndex: newBatterIndex,
      }

      // Walk-off check before processing outs
      s = checkWalkOff(s)
      if (s.gameOver) return s

      // 3 outs → advance inning
      if (s.outs >= 3) {
        s = advanceInning(s)
        s = checkSkipBottom9(s)
      }

      return s
    }

    default:
      return state
  }
}
