# Add Player Names

This plan details the implementation for generating unique, randomized player names to differentiate them from their generic positions. These names will be associated with players during gameplay and tracked correctly in their career history.

## User Review Required

Please review the proposed approach for tracking names across career stats. Are you okay with first and last names being randomly rolled from a predefined list (e.g., "John Smith", "David Ortiz")? When the application loads without existing stats, unique rosters will be generated once and persisted across sessions.

## Proposed Changes

---

### Name Generation

#### [NEW] `src/names.ts`
- Create a new utility file containing arrays of common baseball first names and last names.
- Export a helper function `generatePlayer(number, position)` that returns a `Player` object with a randomized name.
- Export a helper function `generateRoster()` that creates a 9-player line-up with default standard positions (P, C, 1B, 2B, 3B, SS, LF, CF, RF) and randomly assigned names.

---

### Stats Storage

#### [MODIFY] `src/statsStorage.ts`
- **Update Interface**: Add `rosters: { away: Player[]; home: Player[] }` to the `CareerStatsData` interface.
- **Initialize & Hydrate**: Modify `getCareerStats()`:
  - If a user's `localStorage` has existing stats but no `rosters` key, dynamically generate names using `generateRoster()` and attach them for backwards compatibility.
  - If initialized from scratch, generate full default stats alongside new randomized rosters.
  - Ensure any new changes persist accurately via `saveGameStats()`.

---

### Game Logic

#### [MODIFY] `src/gameReducer.ts`
- **Dynamic Initialization**: Modify `createInitialState(rosters)` to accept externally provided rosters rather than a hardcoded `DEFAULT_ROSTER`.
- **Game Reset Fix & Bonuses**: In the `NEW_GAME` action, the current behavior retains the previous game's players but accidentally compounds or rigidly preserves their bonuses. Update `NEW_GAME` to strip out all old bonuses from the rosters and freshly apply `assignBonuses` so the team resets correctly with a new pair of advantaged random players.

---

### Application Core and UI

#### [MODIFY] `src/App.tsx`
- **Lazy Initialization**: Update the generic `useReducer` call. Instead of importing a static `initialState`, use React's lazy initializer `useReducer(gameReducer, undefined, () => createInitialState(getCareerStats().rosters))`.
- Update the `NEW_GAME` dispatch. If the player clicks "Clear Stats", the local storage is wiped. To ensure sync, `NEW_GAME` should be updated to accept `getCareerStats().rosters` as a payload or strictly reset via the latest career state.

#### [MODIFY] `src/components/CareerStats.tsx`
- Refactor the component to extract player details (name and position) directly from `careerStats.rosters` rather than the `rosters` prop of the active game. This creates a stronger link to the persistent data layer.

## Open Questions

- Should "Clear Career Stats" *also* immediately rename all players to new randomly generated names in the current active game, or let the current game finish uninterrupted with the standing names?
- Do you have any preferences for specific player names, or should I generate a generic list of standard baseball names?

## Verification Plan

### Automated Tests
- Test that initializing stats without a `localStorage` cache generates exactly 9 unique players for both Home and Away with randomized strings.
- Validate the reducer correctly spins up `createInitialState` with the proper payloads via unit tests.

### Manual Verification
- Start the dev server (`npm run dev`).
- Verify players appear in the "Roster" tab with names like "Mike Trout" alongside their position (CF).
- Play a game or simulate innings. 
- Ensure that in the "Career Stats" overview tab, the player names correlate perfectly with the gameplay names.
- Refresh the browser, ensure the same player names and accumulated career statistics load seamlessly from `localStorage`.
