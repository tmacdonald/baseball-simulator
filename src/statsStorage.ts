import type { PlayerStats, Player } from './types'
import { generateRoster } from './names'

const CAREER_STATS_KEY = 'dice_baseball_career_stats'

export interface TeamStats {
  wins: number
  losses: number
}

export interface CareerStatsData {
  team: {
    away: TeamStats
    home: TeamStats
  }
  rosters: {
    away: Player[]
    home: Player[]
  }
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

function createEmptyTeamStats(): TeamStats {
  return { wins: 0, losses: 0 }
}

export function getCareerStats(): CareerStatsData {
  const data = localStorage.getItem(CAREER_STATS_KEY)
  if (data) {
    try {
      const parsed = JSON.parse(data) as Partial<CareerStatsData>
      if (!parsed.team) {
        parsed.team = {
          away: createEmptyTeamStats(),
          home: createEmptyTeamStats(),
        }
      }
      if (!parsed.rosters) {
        parsed.rosters = {
          away: generateRoster(),
          home: generateRoster(),
        }
        localStorage.setItem(CAREER_STATS_KEY, JSON.stringify(parsed))
      }
      return parsed as CareerStatsData
    } catch (e) {
      console.error('Failed to parse career stats from localStorage', e)
    }
  }
  
  const defaultStats: CareerStatsData = {
    team: {
      away: createEmptyTeamStats(),
      home: createEmptyTeamStats(),
    },
    rosters: {
      away: generateRoster(),
      home: generateRoster(),
    },
    away: createEmptyStats(),
    home: createEmptyStats(),
  }
  
  localStorage.setItem(CAREER_STATS_KEY, JSON.stringify(defaultStats))
  return defaultStats
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

export function saveGameStats(
  gameStats: { away: PlayerStats[]; home: PlayerStats[] },
  awayRuns: number,
  homeRuns: number
) {
  const career = getCareerStats()
  
  const updatedAway = career.away.map((p, i) => combinePlayerStats(p, gameStats.away[i]))
  const updatedHome = career.home.map((p, i) => combinePlayerStats(p, gameStats.home[i]))
  
  const newAwayTeam = { ...career.team.away }
  const newHomeTeam = { ...career.team.home }

  if (awayRuns > homeRuns) {
    newAwayTeam.wins++
    newHomeTeam.losses++
  } else if (homeRuns > awayRuns) {
    newHomeTeam.wins++
    newAwayTeam.losses++
  }
  
  const updatedCareer: CareerStatsData = {
    team: {
      away: newAwayTeam,
      home: newHomeTeam,
    },
    rosters: career.rosters,
    away: updatedAway,
    home: updatedHome,
  }
  
  localStorage.setItem(CAREER_STATS_KEY, JSON.stringify(updatedCareer))
}

export function clearCareerStats() {
  localStorage.removeItem(CAREER_STATS_KEY)
}
