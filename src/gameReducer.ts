import type { GameState, GameAction, Outcome, Player, PlayerStats } from './types'

// ─── Helpers ────────────────────────────────────────────────────────────────

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
    s.halfInning = 'bottom'
  } else {
    const away = awayTotal(s.score)
    const home = homeTotal(s.score)

    if (s.inning >= 9 && home !== away) {
      return { ...s, gameOver: true }
    }

    s.inning++
    s.halfInning = 'top'

    while (s.score.away.length < s.inning) s.score = { ...s.score, away: [...s.score.away, 0], home: [...s.score.home, 0] }
  }

  return s
}

function checkWalkOff(state: GameState): GameState {
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

export function effectiveOutcome(state: GameState, outcome: Outcome): string {
  if (outcome === 'Double Play') {
    const hasRunner = state.bases[0] !== null || state.bases[1] !== null || state.bases[2] !== null
    if (!hasRunner || state.outs >= 2) return 'Out (ground out)'
  }
  return outcome
}

// ─── Log helper ──────────────────────────────────────────────────────────────

function formatAction(batterName: string, label: string): string {
  switch (label) {
    case 'Home Run': return `${batterName} hits a home run`
    case 'Triple': return `${batterName} hits a triple`
    case 'Double': return `${batterName} hits a double`
    case 'Single': return `${batterName} hits a single`
    case 'Walk': return `${batterName} draws a walk`
    case 'Out (fly out)': return `${batterName} flies out`
    case 'Out (ground out)': return `${batterName} grounds out`
    case 'Out (strikeout)': return `${batterName} strikes out`
    case 'Out (foul out)': return `${batterName} fouls out`
    case 'Double Play': return `${batterName} hits into a double play`
    default: return `${batterName}: ${label}`
  }
}

function logEntry(
  prevState: GameState,
  nextState: GameState,
  batterName: string,
  label: string,
  runsScored: number,
): string {
  const half = prevState.halfInning === 'top' ? '▲' : '▼'
  
  let actionText = formatAction(batterName, label)

  if (runsScored === 1) {
    if (label.includes('Out') || label === 'Double Play') {
      actionText += ', but 1 run scores'
    } else {
      actionText += ', scoring one'
    }
  } else if (runsScored > 1) {
    const numWords: Record<number, string> = { 2: 'two', 3: 'three', 4: 'four' }
    if (label.includes('Out') || label === 'Double Play') {
      actionText += `, but ${runsScored} runs score`
    } else {
      actionText += `, scoring ${numWords[runsScored] || runsScored}`
    }
  }

  if (nextState.outs >= 3) {
    actionText += ' to end the inning'
  }

  let finalAction = actionText + '.'

  if (runsScored > 0) {
    const away = awayTotal(nextState.score)
    const home = homeTotal(nextState.score)
    if (away > home) finalAction += ` Away team leads ${away}-${home}.`
    else if (home > away) finalAction += ` Home team leads ${home}-${away}.`
    else finalAction += ` Game tied ${away}-${home}.`
  }

  return `${half}${prevState.inning} · ${finalAction}`
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

export function createInitialState(): GameState {
  return {
    inning: 1,
    halfInning: 'top',
    outs: 0,
    bases: [null, null, null],
    score: { away: [0], home: [0] },
    hits: { away: 0, home: 0 },
    gameOver: false,
    lastResult: null,
    log: [],
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
      return createInitialState()

    case 'PLAY': {
      if (state.gameOver) return state

      const team = state.halfInning === 'top' ? 'away' : 'home'
      const batterIdx = state.batterIndex[team]
      const currentStats = state.playerStats[team]
      const newStats = [...currentStats]
      const statsForBatter = { ...newStats[batterIdx] }

      const outcome = action.outcome
      const label = effectiveOutcome(state, outcome)
      const { state: nextState, scoringRunners } = applyBaserunning(state, outcome, batterIdx)
      const runsScored = scoringRunners.length
      const batterName = state.rosters[team][batterIdx].name
      const entry = logEntry(state, nextState, batterName, label, runsScored)

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
        lastResult: label, 
        log: [...state.log, entry], 
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
