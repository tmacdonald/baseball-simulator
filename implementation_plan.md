# Dice Baseball — Web Game

## Rules of Dice Baseball

Dice baseball is a tabletop simulation of baseball using two six-sided dice. Two players (or one player vs. the computer) take turns batting through 9 innings. Each half-inning, the batting team rolls dice until they accumulate 3 outs.

### Dice Roll Outcomes

Each at-bat, the batter rolls **two six-sided dice** and sums them. The outcome is determined by the total:

| Roll | Result |
|------|--------|
| 2 | Home Run |
| 3 | Triple |
| 4 | Double |
| 5 | Single |
| 6 | Single |
| 7 | Out (fly out) |
| 8 | Out (ground out) |
| 9 | Out (strikeout) |
| 10 | Walk (batter takes first base) |
| 11 | Double play (if runner on base & < 2 outs; otherwise just an out) |
| 12 | Foul out |

### Baserunning

- **Single**: All runners advance 1 base; runner on 3rd scores.
- **Double**: All runners advance 2 bases; runners on 2nd and 3rd score.
- **Triple**: All runners advance 3 bases (effectively all score); batter on 3rd.
- **Home Run**: All runners and batter score.
- **Walk**: Batter goes to 1st; runners only advance if forced (bases loaded pushes a run in, etc.).

### Game Flow

1. The game lasts **9 innings** (or more if tied after 9 — extra innings).
2. Each inning has a **top half** (away team bats) and **bottom half** (home team bats).
3. An at-bat ends when the roll produces a result; the half-inning ends after 3 outs.
4. The team with more runs after 9 complete innings wins.
5. If the home team is leading after the top of the 9th, the bottom of the 9th is skipped.

---

## Architecture

This will be a **single-player vs. AI** game (both teams controlled by dice rolls — the player clicks "Roll" for their team, and triggers the AI roll for the opposing team). We'll build it as a Vite + React TypeScript app with CSS Modules.

### Project Setup

Write a Vite React web app since the user wants the web game to live in this workspace. 

### Component Tree

```
App
├── Header (game title, inning indicator)
├── Scoreboard (inning-by-inning score table)
├── GameField (baseball diamond visualization with runners)
├── DiceRoll (animated dice display)
├── AtBatResult (shows what happened — "Single!", "Home Run!", etc.)
├── GameControls (Roll button, New Game)
└── GameLog (scrollable log of plays)
```

### State Management

A single `useReducer` hook in `App` managing:

```ts
interface GameState {
  inning: number;               // 1-9+
  halfInning: 'top' | 'bottom';
  outs: number;                 // 0-3
  bases: [boolean, boolean, boolean]; // 1st, 2nd, 3rd
  score: { away: number[]; home: number[] }; // runs per inning
  gameOver: boolean;
  currentRoll: [number, number] | null;
  lastResult: string | null;
  log: string[];
  isRolling: boolean;           // for dice animation
}
```

---

## Proposed Changes

### Project Configuration

#### [NEW] [package.json](file:///Users/tim/work/dice-baseball/package.json)
- Add `vite`, `@vitejs/plugin-react`, `react`, `react-dom`
- Add dev deps: `@types/react`, `@types/react-dom`, `typescript`
- Scripts: `"dev": "vite"`, `"build": "tsc && vite build"`, `"preview": "vite preview"`

#### [NEW] [vite.config.ts](file:///Users/tim/work/dice-baseball/vite.config.ts)
- Standard Vite React plugin config; CSS modules work out of the box

#### [NEW] [tsconfig.json](file:///Users/tim/work/dice-baseball/tsconfig.json)
- `"jsx": "react-jsx"`, `"moduleResolution": "bundler"`, `"strict": true`

#### [NEW] [index.html](file:///Users/tim/work/dice-baseball/index.html)
- Vite entry HTML; `<div id="root">`, Google Fonts link for Outfit + JetBrains Mono, page title "Dice Baseball"

---

### Source Files

#### [NEW] [main.tsx](file:///Users/tim/work/dice-baseball/src/main.tsx)
- `ReactDOM.createRoot(document.getElementById('root')!).render(<App />)`

#### [NEW] [types.ts](file:///Users/tim/work/dice-baseball/src/types.ts)
- Export `GameState` interface (inning, halfInning, outs, bases, score, gameOver, currentRoll, lastResult, log, isRolling)
- Export `GameAction` discriminated union (e.g. `ROLL`, `NEW_GAME`)

#### [NEW] [gameReducer.ts](file:///Users/tim/work/dice-baseball/src/gameReducer.ts)
- `rollDice()` — returns `[number, number]`
- `outcomeForRoll(sum)` — maps sums 2–12 to result strings per the rules table
- `applyBaserunning(state, outcome)` — advances runners, scores runs, increments outs; handles walk-force and double-play edge cases
- `advanceInning(state)` — resets bases/outs, toggles top/bottom, increments inning; handles walk-off (skip bottom 9th if home leads)
- `initialState` export
- `gameReducer(state, action)` — handles `ROLL` (sets `isRolling`, then resolves after fixed delay) and `NEW_GAME`

#### [NEW] [App.tsx](file:///Users/tim/work/dice-baseball/src/App.tsx)
- `useReducer(gameReducer, initialState)`
- Layout: header row, center panel (Diamond + Dice side by side), Scoreboard below, AtBatResult banner, GameControls, GameLog
- Pass only needed slices of state to each child (avoid prop drilling the whole state)
- Show "Game Over" overlay when `gameOver === true`

#### [NEW] [Scoreboard.tsx](file:///Users/tim/work/dice-baseball/src/components/Scoreboard.tsx)
- Table with columns: Team | 1 2 3 4 5 6 7 8 9 | R
- Highlight the current inning column
- Show `–` for innings not yet played; show totals in the R column

#### [NEW] [Scoreboard.module.css](file:///Users/tim/work/dice-baseball/src/components/Scoreboard.module.css)
- Dark background, amber/white numbers; monospace font
- `.active` column highlight; header row in muted green

#### [NEW] [Diamond.tsx](file:///Users/tim/work/dice-baseball/src/components/Diamond.tsx)
- SVG viewBox 200×200; draw four base squares rotated 45°
- Props: `bases: [boolean, boolean, boolean]`
- Filled circle on each occupied base; glowing animation on newly-occupied base

#### [NEW] [Diamond.module.css](file:///Users/tim/work/dice-baseball/src/components/Diamond.module.css)
- Base `fill` transitions; `@keyframes glow` pulse for runner dots

#### [NEW] [Dice.tsx](file:///Users/tim/work/dice-baseball/src/components/Dice.tsx)
- Props: `roll: [number, number] | null`, `isRolling: boolean`
- Render two `<Die>` sub-components; each shows pips in a 3×3 grid
- When `isRolling`, apply `tumble` CSS animation (random rotate + translate)
- Use `useEffect` to stop animation once `isRolling` goes false

#### [NEW] [Dice.module.css](file:///Users/tim/work/dice-baseball/src/components/Dice.module.css)
- 3D-feel: `box-shadow` for depth, white face, dark pips
- `@keyframes tumble` — short rotation/translation loop (~300 ms)

#### [NEW] [AtBatResult.tsx](file:///Users/tim/work/dice-baseball/src/components/AtBatResult.tsx)
- Props: `result: string | null`
- Large, centered text that fades in on each new result
- Color-code by outcome: green for hits, blue for walk, red for outs, gold for HR

#### [NEW] [AtBatResult.module.css](file:///Users/tim/work/dice-baseball/src/components/AtBatResult.module.css)
- `@keyframes fadeSlideIn` — slides up and fades in; key on `result` to retrigger

#### [NEW] [GameControls.tsx](file:///Users/tim/work/dice-baseball/src/components/GameControls.tsx)
- Props: `onRoll`, `onNewGame`, `isRolling`, `gameOver`
- "Roll" button disabled while `isRolling` or `gameOver`; "New Game" always enabled
- Show inning / half-inning / outs context line above buttons

#### [NEW] [GameControls.module.css](file:///Users/tim/work/dice-baseball/src/components/GameControls.module.css)
- Large primary Roll button with green glow; secondary New Game button

#### [NEW] [GameLog.tsx](file:///Users/tim/work/dice-baseball/src/components/GameLog.tsx)
- Props: `log: string[]`
- `useEffect` to scroll to bottom on each new entry
- Each entry prefixed with inning/half icon (▲/▼)

#### [NEW] [GameLog.module.css](file:///Users/tim/work/dice-baseball/src/components/GameLog.module.css)
- Fixed-height scrollable panel; newest entries at bottom; subtle alternating row tint

#### [NEW] [index.css](file:///Users/tim/work/dice-baseball/src/index.css)
- CSS custom properties: `--green`, `--amber`, `--bg`, `--surface`, `--text`, `--muted`
- Outfit for headings/UI; JetBrains Mono for scoreboard; dark base theme
- Reset, `box-sizing: border-box`, smooth scroll

---

## Design Direction

- **Dark theme** with a baseball-green accent palette
- Baseball diamond rendered as an **SVG** with animated runner dots
- Dice with **3D-feel CSS** and a tumble animation on roll
- Scoreboard styled like a **classic ballpark scoreboard** (dark bg, bright numbers)
- Smooth transitions for all state changes
- Google Font: **"Outfit"** for display, **monospace** for the scoreboard

---

## Verification Plan

### Browser Testing
1. Run `npm run dev` to start the Vite dev server
2. Open the app in the browser using the browser subagent
3. Verify:
   - Initial state shows inning 1, top half, 0 outs, empty bases, score 0-0
   - Clicking "Roll" produces a dice animation, then resolves to a valid outcome
   - Runners appear/move correctly on the diamond after hits/walks
   - Outs increment correctly; after 3 outs, the half-inning switches
   - Score updates correctly when runners cross home
   - Game progresses through all 9 innings
   - Game-over screen appears at the end with the winner
   - "New Game" resets everything
   - Walk forcing logic works (bases loaded walk scores a run)
   - Double-play logic works correctly

### Manual Verification
- User can play through a full game and confirm the experience feels polished and correct

---

## Tasks

### 1. Project Scaffolding
- [ ] Run `npm create vite@latest . -- --template react-ts` inside `/Users/tim/work/dice-baseball`
- [ ] Verify `package.json` has correct name (`dice-baseball`), scripts (`dev`, `build`, `preview`)
- [ ] Remove Vite boilerplate files: `src/App.css`, `src/assets/react.svg`, `public/vite.svg`
- [ ] Update `index.html`: set `<title>Dice Baseball</title>`; add Google Fonts preconnect + stylesheet for **Outfit** and **JetBrains Mono**
- [ ] Confirm `tsconfig.json` has `"strict": true` and `"moduleResolution": "bundler"`
- [ ] Run `npm install` and confirm `npm run dev` starts without errors

### 2. Design Tokens & Global CSS (`src/index.css`)
- [ ] Define CSS custom properties: `--green`, `--green-glow`, `--amber`, `--bg`, `--surface`, `--surface-2`, `--text`, `--muted`, `--danger`, `--radius`
- [ ] Set `html, body { background: var(--bg); color: var(--text); font-family: 'Outfit', sans-serif; }`
- [ ] Add `*, *::before, *::after { box-sizing: border-box; margin: 0; }`
- [ ] Add `html { scroll-behavior: smooth; }`

### 3. Types (`src/types.ts`)
- [ ] Define and export `GameState` interface with all fields
- [ ] Define and export `GameAction` discriminated union: `{ type: 'ROLL' }` and `{ type: 'NEW_GAME' }`
- [ ] Define and export `Outcome` type (union of all result strings)

### 4. Game Logic (`src/gameReducer.ts`)
- [ ] Implement `rollDice(): [number, number]` using `Math.random()`
- [ ] Implement `outcomeForRoll(sum: number): Outcome` — exact mapping from the rules table
- [ ] Implement `applyBaserunning(state, outcome)`:
  - [ ] **Out (fly out / ground out / strikeout / foul out)**: increment `outs`
  - [ ] **Double play**: if runner on base and `outs < 2`, consume a runner + increment `outs` twice; else just `outs++`
  - [ ] **Walk**: advance batter to 1st; force-advance runners only if path is blocked; if bases loaded, push in a run
  - [ ] **Single**: advance all runners 1 base; runner scoring from 3rd; batter to 1st
  - [ ] **Double**: advance all runners 2 bases; runners on 2nd/3rd score; batter to 2nd
  - [ ] **Triple**: all runners score; batter to 3rd
  - [ ] **Home Run**: all runners + batter score; bases cleared
  - [ ] After each at-bat: if `outs >= 3`, call `advanceInning()`; else return updated state
- [ ] Implement `advanceInning(state)`:
  - [ ] Toggle `halfInning`; if switching from bottom to top, increment `inning`
  - [ ] Reset `outs = 0`, `bases = [false, false, false]`
  - [ ] **Walk-off**: if `inning === 9` and `halfInning === 'top'` already played, check if home team leads → set `gameOver = true`, skip bottom
  - [ ] If `inning > 9` and score is tied, continue (extra innings)
  - [ ] If `inning > 9` and not tied after a completed bottom half, set `gameOver = true`
- [ ] Define `initialState: GameState`
- [ ] Implement `gameReducer(state, action)`:
  - [ ] `ROLL`: if `gameOver` or `isRolling`, return state unchanged; else roll dice, compute outcome, apply baserunning, append to `log`, set `currentRoll` and `lastResult`
  - [ ] `NEW_GAME`: return `initialState`

### 5. App Shell (`src/App.tsx`)
- [ ] Wire `useReducer(gameReducer, initialState)`
- [ ] Derive display values: `awayTotal`, `homeTotal`, current team label ("Away" / "Home")
- [ ] Render layout grid: header | main-panel (Diamond + Dice) | Scoreboard | AtBatResult | GameControls | GameLog
- [ ] Render `<GameOverOverlay>` (inline or separate component) when `gameOver === true`: show winner, final score, and "Play Again" button dispatching `NEW_GAME`
- [ ] Pass `dispatch` callbacks (not the whole dispatch) to `GameControls`

### 6. Scoreboard Component
- [ ] `Scoreboard.tsx`: render `<table>` with header row (1–9 + R) and two data rows (Away, Home)
- [ ] Show `–` for unplayed innings; show run total in R column
- [ ] Add `.active` class to the column matching `currentInning`
- [ ] `Scoreboard.module.css`: dark bg, amber numbers, monospace font, active column highlight

### 7. Diamond Component
- [ ] `Diamond.tsx`: SVG 200×200; home plate at bottom-center, bases at cardinal rotated-45° positions
- [ ] Draw base squares (unfilled) and runner circles (filled + glow) conditionally per `bases` prop
- [ ] `Diamond.module.css`: `@keyframes glow` for occupied bases; smooth `fill` transitions

### 8. Dice Component
- [ ] `Dice.tsx`: render two `<Die face={n}>` sub-components
- [ ] `Die`: render a 3×3 grid; show filled circles in the correct pip positions for faces 1–6
- [ ] Apply `tumble` CSS animation class when `isRolling === true`; remove when false
- [ ] `Dice.module.css`: white face, `box-shadow` depth, dark pip dots; `@keyframes tumble` (~300 ms rotate + translate loop)

### 9. AtBatResult Component
- [ ] `AtBatResult.tsx`: display `result` in a large banner; use `key={result}` to retrigger animation on every new result
- [ ] Color map: hits → `--green`, walk → `#6ea8fe`, out variants → `--danger`, home run → `--amber`
- [ ] `AtBatResult.module.css`: `@keyframes fadeSlideIn` — translateY(-12px)→0, opacity 0→1

### 10. GameControls Component
- [ ] `GameControls.tsx`: show context line "Inning N ▲/▼ · X Outs"; render Roll + New Game buttons
- [ ] Disable Roll when `isRolling === true` or `gameOver === true`
- [ ] `GameControls.module.css`: Roll button with `--green` background + glow on hover; New Game as ghost button

### 11. GameLog Component
- [ ] `GameLog.tsx`: `useRef` on the list container; `useEffect` to `scrollTop = scrollHeight` after each `log` update
- [ ] Prefix each entry with ▲ (top) or ▼ (bottom) based on the inning half embedded in the log string (or pass half separately)
- [ ] `GameLog.module.css`: fixed height (~200 px), `overflow-y: auto`; alternating row tint for readability

### 12. Polish & Integration
- [ ] Ensure `isRolling` delay (e.g. 600 ms) is consistent with the dice tumble animation duration
- [ ] Add a subtle entrance animation to the whole app (`@keyframes fadeIn` on `#root`)
- [ ] Test responsiveness: layout should not break below 800 px wide
- [ ] Verify all interactive elements have unique `id` attributes for browser testing

### 13. Verification
- [ ] Run `npm run dev`, open in browser subagent
- [ ] Walk through every checklist item in the Browser Testing section above
- [ ] Fix any logic bugs found during play-through
- [ ] Run `npm run build` and confirm no TypeScript errors
