import type { Outcome, DiceScheme, DiceSchemeName, PlayerBonus, ProjectedRoll } from './types'

function rollDiceInternal(sides: number, bonus?: PlayerBonus): [number, number] {
  let d1 = Math.floor(Math.random() * sides) + 1
  if (bonus === 'plus_one') {
    d1 = Math.min(sides, d1 + 1)
  } else if (bonus === 'advantage') {
    d1 = Math.max(d1, Math.floor(Math.random() * sides) + 1)
  }
  return [d1, Math.floor(Math.random() * sides) + 1]
}

function sortedPair(a: number, b: number): string {
  return a <= b ? `${a}-${b}` : `${b}-${a}`
}

const RANDOM_OUT_TYPES: Outcome[] = [
  'Out (ground out)',
  'Out (fly out)',
  'Out (foul out)',
  'Out (strikeout)',
]

export const classicScheme: DiceScheme = (bonus?: PlayerBonus): ProjectedRoll => {
  const roll = rollDiceInternal(6, bonus)
  const sum = roll[0] + roll[1]
  let outcome: Outcome
  switch (sum) {
    case 2: outcome = 'Home Run'; break;
    case 3: outcome = 'Triple'; break;
    case 4: outcome = 'Double'; break;
    case 5: outcome = 'Single'; break;
    case 6: outcome = 'Single'; break;
    case 7: outcome = 'Out (fly out)'; break;
    case 8: outcome = 'Out (ground out)'; break;
    case 9: outcome = 'Out (strikeout)'; break;
    case 10: outcome = 'Walk'; break;
    case 11: outcome = 'Double Play'; break;
    case 12: outcome = 'Out (foul out)'; break;
    default: outcome = 'Out (fly out)'; break;
  }
  return { roll, outcome }
}

export const realisticScheme: DiceScheme = (bonus?: PlayerBonus): ProjectedRoll => {
  const roll = rollDiceInternal(6, bonus)
  const [d1, d2] = roll
  let outcome: Outcome

  if (d1 === 1 && d2 === 1) outcome = 'Home Run'
  else if (d1 === 6 && d2 === 6) outcome = 'Triple'
  else if (d1 === 4 && d2 === 4) outcome = 'Walk'
  else if (d1 === 2 && d2 === 2) outcome = 'Single'
  else {
    const pair = sortedPair(d1, d2)
    switch (pair) {
      case '1-2': outcome = 'Double'; break;
      case '1-3': outcome = 'Single'; break;
      case '5-6': outcome = 'Single'; break;
      default:
        if (Math.random() < 0.15) {
          outcome = 'Double Play'
        } else {
          outcome = RANDOM_OUT_TYPES[Math.floor(Math.random() * RANDOM_OUT_TYPES.length)]
        }
    }
  }
  return { roll, outcome }
}

export const d20Scheme: DiceScheme = (bonus?: PlayerBonus): ProjectedRoll => {
  const roll = rollDiceInternal(20, bonus)
  const [d1, d2] = roll
  let outcome: Outcome

  if (d1 <= 14) {
    // Out Roll Map
    if (d2 <= 5) outcome = 'Out (strikeout)'
    else if (d2 <= 10) outcome = 'Out (ground out)'
    else if (d2 <= 15) outcome = 'Out (fly out)'
    else if (d2 <= 18) outcome = 'Out (foul out)'
    else outcome = 'Double Play'
  } else if (d1 === 15) {
    outcome = 'Walk'
  } else {
    // Hit Roll Map
    if (d2 <= 13) outcome = 'Single'
    else if (d2 <= 17) outcome = 'Double'
    else if (d2 === 18) outcome = 'Triple'
    else outcome = 'Home Run'
  }
  return { roll, outcome }
}

export function resolveOutcome(
  projectedOutcome: Outcome,
  hasRunner: boolean,
  outs: number
): Outcome {
  if (projectedOutcome === 'Double Play') {
    if (!hasRunner || outs >= 2) {
      // Fallback if Double Play is not possible
      return 'Out (ground out)'
    }
  }
  return projectedOutcome
}

export function getDiceScheme(name: DiceSchemeName): DiceScheme {
  switch (name) {
    case 'classic': return classicScheme
    case 'realistic': return realisticScheme
    case 'd20': return d20Scheme
  }
}
