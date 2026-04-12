export type DiceScheme = 'classic' | 'realistic'

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
}

export interface PlayerStats {
  ab: number
  hits: number
  walks: number
  hr: number
  rbi: number
}

export interface GameState {
  inning: number
  halfInning: 'top' | 'bottom'
  outs: number
  bases: [boolean, boolean, boolean] // 1st, 2nd, 3rd
  score: { away: number[]; home: number[] }
  hits: { away: number; home: number }
  gameOver: boolean
  currentRoll: [number, number] | null
  lastResult: string | null
  log: string[]
  isRolling: boolean
  diceScheme: DiceScheme
  rosters: { away: Player[]; home: Player[] }
  playerStats: { away: PlayerStats[]; home: PlayerStats[] }
  batterIndex: { away: number; home: number }
}

export type GameAction =
  | { type: 'ROLL' }
  | { type: 'NEW_GAME'; scheme?: DiceScheme }
  | { type: 'SET_SCHEME'; scheme: DiceScheme }
