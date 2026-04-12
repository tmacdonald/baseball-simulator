import styles from './Diamond.module.css'

interface Props {
  bases: [number | null, number | null, number | null] // 1st, 2nd, 3rd
}

// SVG coordinate layout (200×200 viewBox)
// Home plate: (100, 175)  1st: (160, 115)  2nd: (100, 55)  3rd: (40, 115)
const POSITIONS = {
  home:  { cx: 100, cy: 175 },
  first: { cx: 165, cy: 110 },
  second:{ cx: 100, cy: 48  },
  third: { cx: 35,  cy: 110 },
}

const BASE_SIZE = 14

export default function Diamond({ bases }: Props) {
  const [on1stVal, on2ndVal, on3rdVal] = bases
  
  const on1st = on1stVal !== null
  const on2nd = on2ndVal !== null
  const on3rd = on3rdVal !== null

  return (
    <div className={styles.field} style={{ width: 200, height: 200 }}>
      <svg viewBox="0 0 200 200" aria-label={`Baseball diamond. Bases occupied: ${[on1st && '1st', on2nd && '2nd', on3rd && '3rd'].filter(Boolean).join(', ') || 'none'}`}>
        {/* Dashed baseline lines */}
        <polygon
          className={styles.diamond}
          points={`${POSITIONS.home.cx},${POSITIONS.home.cy} ${POSITIONS.first.cx},${POSITIONS.first.cy} ${POSITIONS.second.cx},${POSITIONS.second.cy} ${POSITIONS.third.cx},${POSITIONS.third.cy}`}
        />

        {/* 2nd base */}
        <rect
          className={`${styles.base} ${on2nd ? styles.baseOccupied : ''}`}
          x={POSITIONS.second.cx - BASE_SIZE / 2}
          y={POSITIONS.second.cy - BASE_SIZE / 2}
          width={BASE_SIZE}
          height={BASE_SIZE}
          transform={`rotate(45, ${POSITIONS.second.cx}, ${POSITIONS.second.cy})`}
        />
        {on2nd && <circle className={styles.runner} cx={POSITIONS.second.cx} cy={POSITIONS.second.cy} r={7} />}

        {/* 3rd base */}
        <rect
          className={`${styles.base} ${on3rd ? styles.baseOccupied : ''}`}
          x={POSITIONS.third.cx - BASE_SIZE / 2}
          y={POSITIONS.third.cy - BASE_SIZE / 2}
          width={BASE_SIZE}
          height={BASE_SIZE}
          transform={`rotate(45, ${POSITIONS.third.cx}, ${POSITIONS.third.cy})`}
        />
        {on3rd && <circle className={styles.runner} cx={POSITIONS.third.cx} cy={POSITIONS.third.cy} r={7} />}

        {/* 1st base */}
        <rect
          className={`${styles.base} ${on1st ? styles.baseOccupied : ''}`}
          x={POSITIONS.first.cx - BASE_SIZE / 2}
          y={POSITIONS.first.cy - BASE_SIZE / 2}
          width={BASE_SIZE}
          height={BASE_SIZE}
          transform={`rotate(45, ${POSITIONS.first.cx}, ${POSITIONS.first.cy})`}
        />
        {on1st && <circle className={styles.runner} cx={POSITIONS.first.cx} cy={POSITIONS.first.cy} r={7} />}

        {/* Home plate (pentagon-ish as a small rotated rect) */}
        <rect
          className={styles.homePlate}
          x={POSITIONS.home.cx - 9}
          y={POSITIONS.home.cy - 9}
          width={18}
          height={18}
          transform={`rotate(45, ${POSITIONS.home.cx}, ${POSITIONS.home.cy})`}
        />
      </svg>
    </div>
  )
}
