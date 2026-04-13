import { describe, it, expect } from 'vitest'
import { gameReducer, createInitialState } from './gameReducer'
import { outcomeForRoll, outcomeForDice, resolveOutcome } from './diceLogic'

describe('diceLogic', () => {
  describe('helpers', () => {
    it('outcomeForRoll correctly maps sums to outcomes', () => {
      expect(outcomeForRoll(2)).toBe('Home Run')
      expect(outcomeForRoll(3)).toBe('Triple')
      expect(outcomeForRoll(4)).toBe('Double')
      expect(outcomeForRoll(7)).toBe('Out (fly out)')
      expect(outcomeForRoll(11)).toBe('Double Play')
    })
    
    it('outcomeForDice matches pairs order-independently', () => {
      expect(outcomeForDice(1, 1, false, 0)).toBe('Home Run')
      expect(outcomeForDice(6, 6, false, 0)).toBe('Triple')
      expect(outcomeForDice(4, 4, false, 0)).toBe('Walk')
      
      expect(outcomeForDice(1, 2, false, 0)).toBe('Double')
      expect(outcomeForDice(2, 1, false, 0)).toBe('Double')
      expect(outcomeForDice(1, 3, false, 0)).toBe('Single')
      expect(outcomeForDice(3, 1, false, 0)).toBe('Single')
    })
    
    it('resolveOutcome dispatches to correct scheme logic', () => {
      expect(resolveOutcome([1, 1], 'numeric' as any, false, 0)).toBe('Home Run') // Fallback to sum (2)
      expect(resolveOutcome([1, 1], 'classic', false, 0)).toBe('Home Run')
      expect(resolveOutcome([1, 5], 'realistic', false, 0)).toMatch(/^Out/)
    })
  })
})

describe('gameReducer', () => {
  describe('reducer logic', () => {
    it('NEW_GAME correctly resets state', () => {
      const state = createInitialState()
      const modifiedState = { ...state, inning: 5, outs: 2 }
      
      const nextState = gameReducer(modifiedState, { type: 'NEW_GAME' })
      expect(nextState.inning).toBe(1)
      expect(nextState.outs).toBe(0)
    })

    it('PLAY dispatches a hit and increments runs and batter index', () => {
      const state = createInitialState()

      const nextState = gameReducer(state, { type: 'PLAY', outcome: 'Home Run' })
      
      expect(nextState.score.away[0]).toBe(1)
      expect(nextState.bases).toEqual([null, null, null])
      expect(nextState.playerStats.away[0].ab).toBe(1)
      expect(nextState.playerStats.away[0].hits).toBe(1)
      expect(nextState.playerStats.away[0].hr).toBe(1)
      expect(nextState.playerStats.away[0].rbi).toBe(1)
      expect(nextState.playerStats.away[0].runs).toBe(1)
      expect(nextState.batterIndex.away).toBe(1)
    })
    
    it('PLAY handles 3 outs and inning transition', () => {
      let state = createInitialState()
      
      state = gameReducer(state, { type: 'PLAY', outcome: 'Out (fly out)' })
      expect(state.outs).toBe(1)
      
      state = gameReducer(state, { type: 'PLAY', outcome: 'Out (fly out)' })
      expect(state.outs).toBe(2)
      
      state = gameReducer(state, { type: 'PLAY', outcome: 'Out (fly out)' })
      expect(state.outs).toBe(0)
      expect(state.halfInning).toBe('bottom')
      expect(state.inning).toBe(1)
    })

    it('PLAY ends game on walk-off', () => {
      let state = createInitialState()
      state.inning = 9
      state.halfInning = 'bottom'
      state.score = { away: [0,0,0,0,0,0,0,0,1], home: [0,0,0,0,0,0,0,0,1] }
      
      const nextState = gameReducer(state, { type: 'PLAY', outcome: 'Home Run' })
      expect(nextState.gameOver).toBe(true)
      expect(nextState.score.home[8]).toBe(2)
    })
    
    it('PLAY skips bottom of 9th if home team leads', () => {
      let state = createInitialState()
      state.inning = 9
      state.halfInning = 'top'
      state.outs = 2
      state.score = { away: [0,0,0,0,0,0,0,0,0], home: [1,0,0,0,0,0,0,0,0] }
      
      const nextState = gameReducer(state, { type: 'PLAY', outcome: 'Out (fly out)' })
      
      expect(nextState.gameOver).toBe(true)
      expect(nextState.halfInning).toBe('bottom')
    })
    
    it('PLAY tracking runners and Double Plays', () => {
      let state = createInitialState()
      state.outs = 0
      state.bases = [0, null, null]
      state.batterIndex.away = 1
      
      const nextState = gameReducer(state, { type: 'PLAY', outcome: 'Double Play' })
      
      expect(nextState.outs).toBe(2)
      expect(nextState.bases).toEqual([null, null, null])
      expect(nextState.lastResult).toBe('Double Play')
    })
  })

  describe('player stats tracking', () => {
    it('updates walks but not ABs on a Walk', () => {
      const state = createInitialState()
      state.batterIndex.away = 2
      
      const nextState = gameReducer(state, { type: 'PLAY', outcome: 'Walk' })
      const stats = nextState.playerStats.away[2]
      
      expect(stats.walks).toBe(1)
      expect(stats.ab).toBe(0)
      expect(stats.hits).toBe(0)
    })

    it('credits runs to baserunners and RBIs to batter when runners score', () => {
      const state = createInitialState()
      state.bases = [0, 1, 2]
      state.batterIndex.away = 3
      
      const nextState = gameReducer(state, { type: 'PLAY', outcome: 'Home Run' })
      const stats = nextState.playerStats.away
      
      expect(stats[0].runs).toBe(1)
      expect(stats[1].runs).toBe(1)
      expect(stats[2].runs).toBe(1)
      
      const batterStats = stats[3]
      expect(batterStats.ab).toBe(1)
      expect(batterStats.hits).toBe(1)
      expect(batterStats.hr).toBe(1)
      expect(batterStats.runs).toBe(1)
      expect(batterStats.rbi).toBe(4)
    })

    it('updates AB but not hits on an Out', () => {
      const state = createInitialState()
      state.batterIndex.away = 5
      
      const nextState = gameReducer(state, { type: 'PLAY', outcome: 'Out (fly out)' })
      const stats = nextState.playerStats.away[5]
      
      expect(stats.ab).toBe(1)
      expect(stats.hits).toBe(0)
      expect(stats.walks).toBe(0)
    })
  })
})
