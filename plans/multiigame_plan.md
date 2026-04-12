# Support Side-by-Side Games

Refactor the main application structure to support playing two separate games of Dice Baseball side-by-side. The state logic has already been nicely encapsulated via `useReducer`, making this an easy structural update.

## Proposed Changes

### Component Restructuring

#### [MODIFY] `src/App.tsx`
- Rename the current default `App` export to `GameInstance`.
- Do not pass props to `GameInstance`. It will initialize its own independent state using `useReducer(gameReducer, initialState)`.
- Create a new default `App` component at the bottom of the file.
- Have the new `App` render a wrapper `<div>` containing exactly two `<GameInstance />` elements.

### Layout Adjustments

#### [MODIFY] `src/App.module.css`
- Add a new `.dualGameWrapper` class (or similar name) to hold the new application structure.
    - Use `display: flex; flex-direction: row; align-items: flex-start; justify-content: center; gap: 40px;` to put the games adjacently.
    - Add `flex-wrap: wrap;` so that on smaller screens, they stack instead of breaking layout.
- Update `.app` slightly if necessary (e.g., removing `margin: 0 auto;` or allowing it to `flex-shrink: 0` / minimum width depending on layout testing) to ensure each inner game renders correctly without being deformed.

## Open Questions
- Do you want separate headers or a single unified "Dice Baseball" header at the very top of the page, with the games below it? The current plan replicates the entire game interface (including header/logos/score).

## Verification Plan

### Manual Verification
- Run `npm run dev`.
- Verify two independent instances of the game appear side-by-side in a wide browser window.
- Verify clicking "Roll" on one game doesn't affect the state or logs of the other game.
- Verify screen resizing wraps appropriately, ensuring usability on smaller monitors.
