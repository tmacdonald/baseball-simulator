import styles from './Dice.module.css'

// Pip layout for each face: 9 cells (3x3 grid), true = show pip
// Cells: [top-left, top-center, top-right, mid-left, mid-center, mid-right, bot-left, bot-center, bot-right]
const PIP_LAYOUTS: Record<number, boolean[]> = {
  1: [false, false, false, false, true,  false, false, false, false],
  2: [true,  false, false, false, false, false, false, false, true ],
  3: [true,  false, false, false, true,  false, false, false, true ],
  4: [true,  false, true,  false, false, false, true,  false, true ],
  5: [true,  false, true,  false, true,  false, true,  false, true ],
  6: [true,  false, true,  true,  false, true,  true,  false, true ],
}

interface DieProps {
  face: number
  rolling: boolean
}

function Die({ face, rolling }: DieProps) {
  const pips = PIP_LAYOUTS[face] ?? PIP_LAYOUTS[1]
  return (
    <div className={`${styles.die} ${rolling ? styles.rolling : ''}`} aria-label={`Die showing ${face}`}>
      {pips.map((show, i) => (
        <div key={i} className={`${styles.pip} ${show ? '' : styles.empty}`} />
      ))}
    </div>
  )
}

interface Props {
  roll: [number, number] | null
  isRolling: boolean
}

export default function Dice({ roll, isRolling }: Props) {
  if (!roll && !isRolling) {
    return (
      <div className={styles.diceContainer}>
        <div className={styles.placeholder}>⚄</div>
        <div className={styles.placeholder}>⚄</div>
      </div>
    )
  }

  const face1 = isRolling ? Math.floor(Math.random() * 6) + 1 : (roll?.[0] ?? 1)
  const face2 = isRolling ? Math.floor(Math.random() * 6) + 1 : (roll?.[1] ?? 1)

  return (
    <div className={styles.diceContainer}>
      <Die face={face1} rolling={isRolling} />
      <Die face={face2} rolling={isRolling} />
    </div>
  )
}
