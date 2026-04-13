# Track Player Stats Across Games

Currently, games are played with a default 9-player roster per team ("Pitcher", "Catcher", etc.). We need to persist these stats to `localStorage` when a game is successfully completed, and display the lifetime stats.

## Proposed Changes

1. **Utility File for Stats (`src/statsStorage.ts`)**
   - Create a service to read and write to `localStorage`.
   - Function: `saveGameStats(awayRoster, homeRoster, awayStats, homeStats)`
   - Function: `getLifetimeStats(): Record<string, PlayerStats>`
   - The key for players will be their `name` (e.g., "Pitcher", "Catcher").

2. **App Component Updates (`src/App.tsx`)**
   - Use a `useEffect` hook to watch for `state.gameOver == true`. When true, check a `gameSaved` flag (or ensure we only save once per game), and then call `saveGameStats(...)`.
   - Ensure the call happens right after `gameOver` flips to true. We should probably reset our "already saved" ref on `NEW_GAME`.

3. **Lifetime Stats Display**
   - Add a new "Lifetime Stats" section or tab.
   - For simplicity, we could add a `LifetimeStats` component that pulls the aggregated stats from `localStorage` and displays them in a table similar to the Roster table.
   - Alternatively, we could add a third tab in `Roster.tsx` for "Lifetime Stats". 

## Open Questions

Before proceeding, please clarify the following points:

1. **Stats Grouping Strategy**: Since both "Away" and "Home" teams use the identical player names (e.g., both use "Pitcher", "Catcher"), should we group their lifetime stats by just the position name (e.g. combining the Away Pitcher and Home Pitcher stats), or should we give teams distinct names / track "Home" and "Away" differently?
2. **Displaying Lifetime Stats**: How would you like the lifetime stats displayed? Should we add a third tab ("Career Stats") next to the "Away Roster" and "Home Roster" tabs in the UI, or build a totally separate panel below the rosters section?
