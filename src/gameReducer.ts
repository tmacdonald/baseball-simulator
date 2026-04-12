import type { GameState, GameAction, Outcome } from './types'

// ─── Helpers ────────────────────────────────────────────────────────────────

export function rollDice(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ]
}

export function outcomeForRoll(sum: number): Outcome {
  switch (sum) {
    case 2:  return 'Home Run'
    case 3:  return 'Triple'
    case 4:  return 'Double'
    case 5:  return 'Single'
    case 6:  return 'Single'
    case 7:  return 'Out (fly out)'
    case 8:  return 'Out (ground out)'
    case 9:  return 'Out (strikeout)'
    case 10: return 'Walk'
    case 11: return 'Double Play'
    case 12: return 'Foul Out'
    default: return 'Out (fly out)'
  }
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
  runsScored: number
}

// ─── Baserunning ─────────────────────────────────────────────────────────────

function applyBaserunning(state: GameState, outcome: Outcome): BaserunningResult {
  let s = { ...state, bases: [...state.bases] as [boolean, boolean, boolean] }
  let runsScored = 0

  switch (outcome) {
    case 'Out (fly out)':
    case 'Out (ground out)':
    case 'Out (strikeout)':
    case 'Foul Out':
      s.outs++
      break

    case 'Double Play': {
      const hasRunner = s.bases[0] || s.bases[1] || s.bases[2]
      if (hasRunner && s.outs < 2) {
        if (s.bases[2]) s.bases[2] = false
        else if (s.bases[1]) s.bases[1] = false
        else s.bases[0] = false
        s.outs += 2
      } else {
        s.outs++
      }
      break
    }

    case 'Walk': {
      if (s.bases[0] && s.bases[1] && s.bases[2]) {
        runsScored += 1
        s = scoreRuns(s, 1)
      } else if (s.bases[0] && s.bases[1]) {
        s.bases[2] = true
      } else if (s.bases[0]) {
        s.bases[1] = true
      }
      s.bases[0] = true
      break
    }

    case 'Single': {
      const runs = s.bases[2] ? 1 : 0
      s.bases[2] = s.bases[1]
      s.bases[1] = s.bases[0]
      s.bases[0] = true
      if (runs > 0) { runsScored += runs; s = scoreRuns(s, runs) }
      break
    }

    case 'Double': {
      let runs = 0
      if (s.bases[2]) runs++
      if (s.bases[1]) runs++
      s.bases[2] = s.bases[0]
      s.bases[1] = true
      s.bases[0] = false
      if (runs > 0) { runsScored += runs; s = scoreRuns(s, runs) }
      break
    }

    case 'Triple': {
      let runs = 0
      if (s.bases[0]) runs++
      if (s.bases[1]) runs++
      if (s.bases[2]) runs++
      s.bases = [false, false, true]
      if (runs > 0) { runsScored += runs; s = scoreRuns(s, runs) }
      break
    }

    case 'Home Run': {
      let runs = 1
      if (s.bases[0]) runs++
      if (s.bases[1]) runs++
      if (s.bases[2]) runs++
      s.bases = [false, false, false]
      runsScored += runs
      s = scoreRuns(s, runs)
      break
    }
  }

  return { state: s, runsScored }
}

// ─── Inning transitions ──────────────────────────────────────────────────────

function awayTotal(score: GameState['score']): number {
  return score.away.reduce((a, b) => a + b, 0)
}
function homeTotal(score: GameState['score']): number {
  return score.home.reduce((a, b) => a + b, 0)
}

function advanceInning(state: GameState): GameState {
  let s = { ...state, outs: 0, bases: [false, false, false] as [boolean, boolean, boolean] }

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
    const hasRunner = state.bases[0] || state.bases[1] || state.bases[2]
    if (!hasRunner || state.outs >= 2) return 'Out (ground out)'
  }
  return outcome
}

// ─── Log helper ──────────────────────────────────────────────────────────────

function logEntry(state: GameState, label: string, roll: [number, number], runsScored: number): string {
  const half = state.halfInning === 'top' ? '▲' : '▼'
  const team = state.halfInning === 'top' ? 'Away' : 'Home'
  const runsSuffix = runsScored === 1
    ? ' · 1 run scores'
    : runsScored > 1
    ? ` · ${runsScored} runs score`
    : ''
  return `${half}${state.inning} · ${team} · Roll ${roll[0] + roll[1]} (${roll[0]}+${roll[1]}) → ${label}${runsSuffix}`
}

// ─── Initial state ────────────────────────────────────────────────────────────

export const initialState: GameState = {
  inning: 1,
  halfInning: 'top',
  outs: 0,
  bases: [false, false, false],
  score: { away: [0], home: [0] },
  hits: { away: 0, home: 0 },
  gameOver: false,
  currentRoll: null,
  lastResult: null,
  log: [],
  isRolling: false,
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return initialState

    case 'ROLL': {
      if (state.gameOver || state.isRolling) return state

      const roll = rollDice()
      const outcome = outcomeForRoll(roll[0] + roll[1])
      const label = effectiveOutcome(state, outcome)
      const { state: nextState, runsScored } = applyBaserunning(state, outcome)
      const entry = logEntry(state, label, roll, runsScored)

      // Track hits
      const isHit = outcome === 'Single' || outcome === 'Double' || outcome === 'Triple' || outcome === 'Home Run'
      const hits = isHit
        ? {
            away: state.halfInning === 'top'    ? state.hits.away + 1 : state.hits.away,
            home: state.halfInning === 'bottom' ? state.hits.home + 1 : state.hits.home,
          }
        : state.hits

      let s: GameState = { ...nextState, currentRoll: roll, lastResult: label, log: [...state.log, entry], isRolling: false, hits }

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
