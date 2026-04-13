import type { Outcome, DiceScheme } from './types'

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
  if (d1 === 1 && d2 === 1) return 'Home Run'
  if (d1 === 6 && d2 === 6) return 'Triple'
  if (d1 === 4 && d2 === 4) return 'Walk'
  if (d1 === 2 && d2 === 2) return 'Single'

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
