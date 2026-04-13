export type DiceScheme = 'classic' | 'realistic' | 'd20'

export type Outcome =
  | 'Home Run'
  | 'Triple'
  | 'Double'
  | 'Single'
  | 'Out (fly out)'
  | 'Out (ground out)'
  | 'Out (strikeout)'
  | 'Out (foul out)'
  | 'Walk'
  | 'Double Play'

export interface Player {
  number: number
  name: string
  position: string
  bonus?: 'plus_one' | 'advantage'
}

export interface PlayerStats {
  ab: number
  hits: number
  walks: number
  hr: number
  rbi: number
  runs: number
}

export interface GameState {
  inning: number
  halfInning: 'top' | 'bottom'
  outs: number
  bases: [number | null, number | null, number | null] // 1st, 2nd, 3rd (batter index)
  score: { away: number[]; home: number[] }
  hits: { away: number; home: number }
  gameOver: boolean
  lastResult: string | null
  log: string[]
  rosters: { away: Player[]; home: Player[] }
  playerStats: { away: PlayerStats[]; home: PlayerStats[] }
  batterIndex: { away: number; home: number }
}

export type GameAction =
  | { type: 'PLAY'; outcome: Outcome }
  | { type: 'NEW_GAME' }
  | { type: 'REPLACE_STATE'; state: GameState }
