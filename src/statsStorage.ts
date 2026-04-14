import type { PlayerStats } from './types'

const CAREER_STATS_KEY = 'dice_baseball_career_stats'

export interface CareerStatsData {
  away: PlayerStats[]
  home: PlayerStats[]
}

function createEmptyStats(): PlayerStats[] {
  return Array.from({ length: 9 }, () => ({
    ab: 0,
    hits: 0,
    singles: 0,
    doubles: 0,
    triples: 0,
    walks: 0,
    hr: 0,
    rbi: 0,
    runs: 0,
  }))
}

export function getCareerStats(): CareerStatsData {
  const data = localStorage.getItem(CAREER_STATS_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error('Failed to parse career stats from localStorage', e)
    }
  }
  return {
    away: createEmptyStats(),
    home: createEmptyStats(),
  }
}

function combinePlayerStats(base: PlayerStats, added: PlayerStats): PlayerStats {
  return {
    ab: base.ab + added.ab,
    hits: base.hits + added.hits,
    singles: base.singles + added.singles,
    doubles: base.doubles + added.doubles,
    triples: base.triples + added.triples,
    walks: base.walks + added.walks,
    hr: base.hr + added.hr,
    rbi: base.rbi + added.rbi,
    runs: base.runs + added.runs,
  }
}

export function saveGameStats(gameStats: { away: PlayerStats[]; home: PlayerStats[] }) {
  const career = getCareerStats()
  
  const updatedAway = career.away.map((p, i) => combinePlayerStats(p, gameStats.away[i]))
  const updatedHome = career.home.map((p, i) => combinePlayerStats(p, gameStats.home[i]))
  
  const updatedCareer = { away: updatedAway, home: updatedHome }
  localStorage.setItem(CAREER_STATS_KEY, JSON.stringify(updatedCareer))
}

export function clearCareerStats() {
  localStorage.removeItem(CAREER_STATS_KEY)
}
