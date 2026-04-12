export type Outcome =
  | 'Home Run'
  | 'Triple'
  | 'Double'
  | 'Single'
  | 'Out (fly out)'
  | 'Out (ground out)'
  | 'Out (strikeout)'
  | 'Walk'
  | 'Double Play'
  | 'Foul Out'

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
}

export type GameAction = { type: 'ROLL' } | { type: 'NEW_GAME' }
