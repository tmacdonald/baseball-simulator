# Add Team Rosters with Player Stats

Add a 9-player roster to each team (Away & Home), track per-player stats (at-bats, hits, walks, home runs, RBI), and display a stats table that can be viewed in-game.

## Proposed Changes

### Types & Data (`src/types.ts`)
#### [MODIFY] [types.ts](file:///Users/tim/work/dice-baseball/src/types.ts)

Add new types:
- `Player` — `{ number: number; name: string; position: string }`
- `PlayerStats` — `{ ab: number; hits: number; walks: number; hr: number; rbi: number }`
- Extend `GameState` to include:
  - `rosters: { away: Player[]; home: Player[] }` — static lineup
  - `playerStats: { away: PlayerStats[]; home: PlayerStats[] }` — mutable per-at-bat
  - `batterIndex: { away: number; home: number }` — current batter position (0-8)

---

### Game Logic (`src/gameReducer.ts`)
#### [MODIFY] [gameReducer.ts](file:///Users/tim/work/dice-baseball/src/gameReducer.ts)

- Define 9-player default rosters for Away and Home teams. Lineup positions:

| # | Position |
|---|----------|
| 1 | Pitcher |
| 2 | Catcher |
| 3 | 1B |
| 4 | 2B |
| 5 | 3B |
| 6 | SS |
| 7 | LF |
| 8 | CF |
| 9 | RF |

- On each `ROLL`, attribute the outcome to the current batter (advancing `batterIndex` after each plate appearance).
- Update `playerStats` for: AB (all outcomes except walk), hits, walks, HR, RBI.

---

### New Component (`src/components/Roster.tsx` + `Roster.module.css`)
#### [NEW] [Roster.tsx](file:///Users/tim/work/dice-baseball/src/components/Roster.tsx)

A tabbed stats panel showing Away / Home team rosters with per-player stats. Columns: **#** · **Pos** · **Name** · **AB** · **H** · **BB** · **HR** · **RBI** · **AVG**

- Highlights the current batter's row.
- Tab toggle between Away / Home.

---

### App Integration (`src/App.tsx`)
#### [MODIFY] [App.tsx](file:///Users/tim/work/dice-baseball/src/App.tsx)

- Import and render `<Roster>` below the scoreboard (or as a collapsible panel).
- Pass `rosters`, `playerStats`, `batterIndex`, and `halfInning` props.

---

## Verification Plan

### Manual Verification
- Start a game, roll several times — confirm current batter row is highlighted and advances after each at-bat.
- Confirm pitcher (#1) and catcher (#2) appear correctly.
- Confirm AVG column updates correctly (H/AB, dashes when AB=0).
- Confirm switching between Away/Home tabs shows the correct lineup.
- Confirm walks do not count as AB but do count as BB.
