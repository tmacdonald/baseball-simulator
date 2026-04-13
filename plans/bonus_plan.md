# Implementation Plan: Player Bonuses

We will introduce a new mechanic where two randomly selected batters per team receive permanent gameplay bonuses at the start of a game. These bonuses affect their **first die (D1)** during an at-bat, increasing their chances of getting on base.

## 1. Data Structure Updates
- **`types.ts`**: Add a `bonus?: 'plus_one' | 'advantage'` property to the `Player` interface.

## 2. Game Initialization (`gameReducer.ts`)
- Implement a helper function `assignBonuses(roster: Player[]): Player[]` that:
  1. Clones the base roster.
  2. Selects two random, distinct indices between 0 and 8.
  3. Assigns `bonus: 'plus_one'` to the first index and `bonus: 'advantage'` to the second.
- Update `createInitialState()` to map the `DEFAULT_ROSTER` through `assignBonuses` for both the away and home teams, so each new game randomizes the blessed players.

## 3. Dice Logic Updates (`diceLogic.ts`)
- Update `rollDice` signature to accept the bonus: `rollDice(scheme: DiceScheme = 'classic', bonus?: 'plus_one' | 'advantage'): [number, number]`.
- Inside `rollDice`, compute `d1` normally. 
- Apply the bonus modifications to `d1`:
  - **`plus_one`**: `d1 = Math.min(sides, d1 + 1)`
  - **`advantage`**: `d1 = Math.max(d1, Math.floor(Math.random() * sides) + 1)`
- Return `[d1, d2]` as usual.

## 4. Hooking it Up (`App.tsx`)
- In `handleRoll` and `handleSimulateInning`, lookup the current batter (based on `state.halfInning` and `state.batterIndex`).
- Extract the batter's `bonus` flag.
- Pass the bonus to `rollDice(diceScheme, currentBatter.bonus)`.

## 5. UI Visibility (`Roster.tsx`)
- Update the roster table to visualize which players have bonuses next to their name. 
- E.g., appending a `[+1]` badge for the plus one bonus, and a `[Adv]` badge for the advantage bonus.

## User Review Required
> [!IMPORTANT]
> The plan above adds randomness to the roster initialization and pipes those state bonuses seamlessly into the dice thrower. Please let me know if this implementation strategy makes sense or if you would prefer bonuses to strictly be manual user assignments rather than randomized per game!
