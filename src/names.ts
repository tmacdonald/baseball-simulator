import type { Player } from './types'

const FIRST_NAMES = [
  'Mike', 'Aaron', 'Babe', 'Barry', 'Willie', 'Ken', 'Alex', 'Lou', 'Ty', 'Ted',
  'Mookie', 'Clayton', 'Max', 'Justin', 'Bryce', 'Nolan', 'Ronald', 'Freddie', 'Shohei', 'Manny',
  'David', 'Albert', 'Derek', 'Giancarlo', 'Pete', 'Miguel', 'Stan', 'Ernie', 'Frank', 'Jackie',
  'Chipper', 'Reggie', 'Harmon', 'Roy', 'Randy', 'Pedro', 'Greg', 'Bob', 'Joe', 'Sandy',
  'Yogi', 'Hank', 'Rickey', 'Brooks', 'Cal', 'Johnny', 'Nolan', 'George', 'Roberto', 'Honus'
]

const LAST_NAMES = [
  'Trout', 'Judge', 'Ruth', 'Bonds', 'Mays', 'Griffey', 'Rodriguez', 'Gehrig', 'Cobb', 'Williams',
  'Betts', 'Kershaw', 'Scherzer', 'Verlander', 'Harper', 'Arenado', 'Acuna', 'Freeman', 'Ohtani', 'Machado',
  'Ortiz', 'Pujols', 'Jeter', 'Stanton', 'Rose', 'Cabrera', 'Musial', 'Banks', 'Thomas', 'Robinson',
  'Jones', 'Jackson', 'Killebrew', 'Halladay', 'Johnson', 'Martinez', 'Maddux', 'Gibson', 'DiMaggio', 'Koufax',
  'Berra', 'Aaron', 'Henderson', 'Robinson', 'Ripken', 'Bench', 'Ryan', 'Brett', 'Clemente', 'Wagner'
]

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF']

export function generateName(): string {
  const f = Math.floor(Math.random() * FIRST_NAMES.length)
  const l = Math.floor(Math.random() * LAST_NAMES.length)
  return `${FIRST_NAMES[f]} ${LAST_NAMES[l]}`
}

export function generateRoster(): Player[] {
  return POSITIONS.map((pos, index) => ({
    number: index + 1,
    name: generateName(),
    position: pos
  }))
}
