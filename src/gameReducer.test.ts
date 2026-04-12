import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { gameReducer, createInitialState, rollDice, outcomeForRoll, outcomeForDice, resolveOutcome } from './gameReducer'
import type { GameState, GameAction, DiceScheme, Outcome } from './types'

describe('gameReducer', () => {

  describe('helpers', () => {
    it('outcomeForRoll correctly maps sums to outcomes', () => {
      expect(outcomeForRoll(2)).toBe('Home Run')
      expect(outcomeForRoll(3)).toBe('Triple')
      expect(outcomeForRoll(4)).toBe('Double')
      expect(outcomeForRoll(7)).toBe('Out (fly out)')
      expect(outcomeForRoll(11)).toBe('Double Play')
    })
    
    it('outcomeForDice matches pairs order-independently', () => {
      // It should check doubles first
      expect(outcomeForDice(1, 1, false, 0)).toBe('Home Run')
      expect(outcomeForDice(6, 6, false, 0)).toBe('Triple')
      expect(outcomeForDice(4, 4, false, 0)).toBe('Walk')
      
      // Order-independent
      expect(outcomeForDice(1, 2, false, 0)).toBe('Double')
      expect(outcomeForDice(2, 1, false, 0)).toBe('Double')
      expect(outcomeForDice(1, 3, false, 0)).toBe('Single')
      expect(outcomeForDice(3, 1, false, 0)).toBe('Single')
    })
    
    it('resolveOutcome dispatches to correct scheme logic', () => {
      expect(resolveOutcome([1, 1], 'numeric', false, 0)).toBe('Home Run')
      expect(resolveOutcome([1, 1], 'classic', false, 0)).toBe('Home Run')
      
      // Real scheme behavior
      expect(resolveOutcome([1, 5], 'realistic', false, 0)).toMatch(/^Out/)
    })
  })

  describe('reducer logic', () => {
    let mockMathRandom: any

    beforeEach(() => {
      mockMathRandom = vi.spyOn(Math, 'random')
    })

    afterEach(() => {
      mockMathRandom.mockRestore()
    })

    it('NEW_GAME correctly resets state', () => {
      const state = createInitialState()
      const modifiedState = { ...state, inning: 5, outs: 2 }
      
      const nextState = gameReducer(modifiedState, { type: 'NEW_GAME', scheme: 'classic' })
      expect(nextState.inning).toBe(1)
      expect(nextState.outs).toBe(0)
      expect(nextState.diceScheme).toBe('classic')
    })

    it('SET_SCHEME updates diceScheme', () => {
      const state = createInitialState()
      const nextState = gameReducer(state, { type: 'SET_SCHEME', scheme: 'realistic' })
      expect(nextState.diceScheme).toBe('realistic')
    })

    it('ROLL dispatches a hit and increments runs and batter index', () => {
      const state = createInitialState('classic')
      // For classic scheme, if sum is 2, it's a Home Run.
      // rollDice does Math.floor(Math.random() * 6) + 1
      // If random returns ~0, we get 1. (1+1=2) -> Home Run.
      mockMathRandom.mockReturnValue(0.0) 

      const nextState = gameReducer(state, { type: 'ROLL' })
      
      // The batter is away, 1st player (idx 0)
      expect(nextState.score.away[0]).toBe(1) // 1 run scored
      // Bases should be empty after a home run
      expect(nextState.bases).toEqual([null, null, null])
      // Stats should be updated
      expect(nextState.playerStats.away[0].ab).toBe(1)
      expect(nextState.playerStats.away[0].hits).toBe(1)
      expect(nextState.playerStats.away[0].hr).toBe(1)
      expect(nextState.playerStats.away[0].rbi).toBe(1)
      expect(nextState.playerStats.away[0].runs).toBe(1)
      
      // Next batter should be up
      expect(nextState.batterIndex.away).toBe(1)
    })
    
    it('ROLL handles 3 outs and inning transition', () => {
      // Mock math to always return 0.99 -> 6 -> roll [6,6] -> sum = 12 -> Out (foul out)
      mockMathRandom.mockReturnValue(0.99)
      
      let state = createInitialState('classic')
      
      // Roll 1: Out
      state = gameReducer(state, { type: 'ROLL' })
      expect(state.outs).toBe(1)
      
      // Roll 2: Out
      state = gameReducer(state, { type: 'ROLL' })
      expect(state.outs).toBe(2)
      
      // Roll 3: Out, should transition to bottom of 1st
      state = gameReducer(state, { type: 'ROLL' })
      expect(state.outs).toBe(0)
      expect(state.halfInning).toBe('bottom')
      expect(state.inning).toBe(1)
    })

    it('ROLL ends game on walk-off', () => {
      let state = createInitialState('classic')
      // Setup bottom of 9th, tied game
      state.inning = 9
      state.halfInning = 'bottom'
      state.score = { away: [0,0,0,0,0,0,0,0,1], home: [0,0,0,0,0,0,0,0,1] }
      
      // Hit a home run
      mockMathRandom.mockReturnValue(0.0) // 1,1 -> 2 -> Home Run
      
      const nextState = gameReducer(state, { type: 'ROLL' })
      expect(nextState.gameOver).toBe(true)
      expect(nextState.score.home[8]).toBe(2) // Run scored
    })
    
    it('ROLL skips bottom of 9th if home team leads', () => {
      let state = createInitialState('classic')
      // Top of 9th, 2 outs. Home leads 1-0.
      state.inning = 9
      state.halfInning = 'top'
      state.outs = 2
      state.score = { away: [0,0,0,0,0,0,0,0,0], home: [1,0,0,0,0,0,0,0,0] } // Home leads 1-0
      
      // Away hits foul out [6,6] -> 12
      mockMathRandom.mockReturnValue(0.99)
      
      const nextState = gameReducer(state, { type: 'ROLL' })
      
      // Transitions directly to game over instead of bottom of 9th
      expect(nextState.gameOver).toBe(true)
      expect(nextState.halfInning).toBe('bottom')
    })
    
    it('ROLL tracking runners and Double Plays', () => {
      let state = createInitialState('classic')
      state.outs = 0
      state.bases = [0, null, null] // Runner on first (batter idx 0)
      state.batterIndex.away = 1 // Batter is idx 1
      
      // classic sum 11 = Double Play
      // Let's force sum 11: roll 5, 6
      mockMathRandom.mockReturnValueOnce(5/6 - 0.05) // -> floor(4.something) + 1 = 5
      mockMathRandom.mockReturnValueOnce(0.99) // -> 6
      // Output: 5 + 6 = 11 -> Double Play
      
      const nextState = gameReducer(state, { type: 'ROLL' })
      
      // State should have 2 outs and empty bases
      expect(nextState.outs).toBe(2)
      expect(nextState.bases).toEqual([null, null, null])
      
      // And the label should be 'Double Play'
      expect(nextState.lastResult).toBe('Double Play')
    })
  })

  describe('player stats tracking', () => {
    let mockMathRandom: any

    beforeEach(() => {
      mockMathRandom = vi.spyOn(Math, 'random')
    })

    afterEach(() => {
      mockMathRandom.mockRestore()
    })

    it('updates walks but not ABs on a Walk', () => {
      const state = createInitialState('classic')
      state.batterIndex.away = 2 // 3rd batter
      
      // Roll sum 10 (e.g. 5 + 5) -> Walk
      mockMathRandom.mockReturnValue(4/6 + 0.01) // math.floor ~ 4 + 1 = 5

      const nextState = gameReducer(state, { type: 'ROLL' })
      const stats = nextState.playerStats.away[2]
      
      expect(stats.walks).toBe(1)
      expect(stats.ab).toBe(0) // Walk does not count as official at-bat
      expect(stats.hits).toBe(0)
    })

    it('credits runs to baserunners and RBIs to batter when runners score', () => {
      const state = createInitialState('classic')
      // Bases loaded: runners at indices 0, 1, 2
      state.bases = [0, 1, 2]
      // Current batter is idx 3
      state.batterIndex.away = 3
      
      // Roll sum 2 (e.g. 1 + 1) -> Home Run (Grand Slam!)
      mockMathRandom.mockReturnValue(0.0) 

      const nextState = gameReducer(state, { type: 'ROLL' })
      const stats = nextState.playerStats.away
      
      // All three runners should score
      expect(stats[0].runs).toBe(1)
      expect(stats[1].runs).toBe(1)
      expect(stats[2].runs).toBe(1)
      
      // Batter (idx 3) should get HR, run, and 4 RBIs
      const batterStats = stats[3]
      expect(batterStats.ab).toBe(1)
      expect(batterStats.hits).toBe(1)
      expect(batterStats.hr).toBe(1)
      expect(batterStats.runs).toBe(1)
      expect(batterStats.rbi).toBe(4) // 3 runners + themselves
    })

    it('updates AB but not hits on an Out', () => {
      const state = createInitialState('classic')
      state.batterIndex.away = 5 // 6th batter
      
      // Roll sum 7 (e.g. 3 + 4) -> Out (fly out)
      mockMathRandom.mockReturnValueOnce(2/6 + 0.01) // 3
      mockMathRandom.mockReturnValueOnce(3/6 + 0.01) // 4
      
      const nextState = gameReducer(state, { type: 'ROLL' })
      const stats = nextState.playerStats.away[5]
      
      expect(stats.ab).toBe(1)
      expect(stats.hits).toBe(0)
      expect(stats.walks).toBe(0)
    })
  })
})
