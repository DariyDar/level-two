import type { SimulationState, FoodCard } from '../../types'
import { SIM_CONSTANTS } from '../../types'
import './Battlefield.css'

interface BattlefieldProps {
  state: SimulationState
  mealCards: FoodCard[]
}

const SVG_WIDTH = 400
const SVG_HEIGHT = 700

// Trail: length in position-units = speed × TRAIL_SECONDS
const TRAIL_SECONDS = 2.5

function posToY(position: number): number {
  return 40 + position * (SVG_HEIGHT - 80)
}

function Trail({ x, y, speed }: { x: number; y: number; speed: number }) {
  const trailLen = speed * TRAIL_SECONDS * (SVG_HEIGHT - 80)
  if (trailLen < 2) return null

  const seg = trailLen / 3
  return (
    <>
      <line x1={x} y1={y} x2={x} y2={y - seg} stroke="#fff" strokeWidth={2} opacity={0.35} strokeLinecap="round" />
      <line x1={x} y1={y - seg} x2={x} y2={y - seg * 2} stroke="#fff" strokeWidth={1.5} opacity={0.15} strokeLinecap="round" />
      <line x1={x} y1={y - seg * 2} x2={x} y2={y - seg * 3} stroke="#fff" strokeWidth={1} opacity={0.06} strokeLinecap="round" />
    </>
  )
}

export function Battlefield({ state, mealCards }: BattlefieldProps) {
  const { projectiles, organs } = state

  const muscleTargetSet = new Set(organs.muscles.targets)
  const kidneyTargetSet = new Set(organs.kidneys.targets)

  return (
    <div className="battlefield">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="battlefield__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Liver zone */}
        <rect
          x={0}
          y={posToY(SIM_CONSTANTS.LIVER_ZONE_START)}
          width={SVG_WIDTH}
          height={posToY(SIM_CONSTANTS.LIVER_ZONE_END) - posToY(SIM_CONSTANTS.LIVER_ZONE_START)}
          fill="rgba(59, 130, 246, 0.08)"
        />
        <text x={10} y={posToY(SIM_CONSTANTS.LIVER_ZONE_START) + 16} className="zone-label">
          LIVER
        </text>

        {/* Muscle zone */}
        <rect
          x={0}
          y={posToY(SIM_CONSTANTS.MUSCLE_RANGE_START)}
          width={SVG_WIDTH}
          height={posToY(SIM_CONSTANTS.MUSCLE_RANGE_END) - posToY(SIM_CONSTANTS.MUSCLE_RANGE_START)}
          fill="rgba(34, 197, 94, 0.06)"
        />
        <text x={10} y={posToY(SIM_CONSTANTS.MUSCLE_RANGE_START) + 16} className="zone-label">
          MUSCLES
        </text>

        {/* Kidney zone */}
        <rect
          x={0}
          y={posToY(SIM_CONSTANTS.KIDNEY_RANGE_START)}
          width={SVG_WIDTH}
          height={posToY(SIM_CONSTANTS.KIDNEY_RANGE_END) - posToY(SIM_CONSTANTS.KIDNEY_RANGE_START)}
          fill="rgba(234, 179, 8, 0.08)"
        />
        <text x={10} y={posToY(SIM_CONSTANTS.KIDNEY_RANGE_START) + 16} className="zone-label">
          KIDNEYS
        </text>

        {/* Base line */}
        <line
          x1={0} y1={posToY(1.0)}
          x2={SVG_WIDTH} y2={posToY(1.0)}
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="8 4"
        />
        <text x={SVG_WIDTH / 2} y={posToY(1.0) + 18} className="base-label">
          BASE
        </text>

        {/* Organ icons */}
        <text x={SVG_WIDTH - 10} y={posToY((SIM_CONSTANTS.LIVER_ZONE_START + SIM_CONSTANTS.LIVER_ZONE_END) / 2) + 5} className="organ-icon" textAnchor="end">
          🫘
        </text>
        <text x={SVG_WIDTH - 10} y={posToY((SIM_CONSTANTS.MUSCLE_RANGE_START + SIM_CONSTANTS.MUSCLE_RANGE_END) / 2) + 5} className="organ-icon" textAnchor="end">
          💪
        </text>
        <text x={SVG_WIDTH - 10} y={posToY((SIM_CONSTANTS.KIDNEY_RANGE_START + SIM_CONSTANTS.KIDNEY_RANGE_END) / 2) + 5} className="organ-icon" textAnchor="end">
          🫘
        </text>

        {/* Targeting lines */}
        {organs.muscles.targets.map(targetId => {
          const p = projectiles.find(proj => proj.id === targetId)
          if (!p) return null
          const muscleX = SVG_WIDTH - 40
          const muscleY = posToY((SIM_CONSTANTS.MUSCLE_RANGE_START + SIM_CONSTANTS.MUSCLE_RANGE_END) / 2)
          return (
            <line
              key={`mt-${targetId}`}
              x1={muscleX}
              y1={muscleY}
              x2={60 + (p.sourceSlot * 120) + Math.sin(parseInt(p.id.slice(1)) * 1.7) * 30}
              y2={posToY(p.position)}
              stroke="rgba(34, 197, 94, 0.4)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )
        })}

        {organs.kidneys.targets.map(targetId => {
          const p = projectiles.find(proj => proj.id === targetId)
          if (!p) return null
          const kidneyX = SVG_WIDTH - 40
          const kidneyY = posToY((SIM_CONSTANTS.KIDNEY_RANGE_START + SIM_CONSTANTS.KIDNEY_RANGE_END) / 2)
          return (
            <line
              key={`kt-${targetId}`}
              x1={kidneyX}
              y1={kidneyY}
              x2={60 + (p.sourceSlot * 120) + Math.sin(parseInt(p.id.slice(1)) * 1.7) * 30}
              y2={posToY(p.position)}
              stroke="rgba(234, 179, 8, 0.4)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )
        })}

        {/* Projectile trails */}
        {projectiles.map(p => {
          const x = 60 + (p.sourceSlot * 120) + Math.sin(parseInt(p.id.slice(1)) * 1.7) * 30
          const y = posToY(p.position)
          return <Trail key={`trail-${p.id}`} x={x} y={y} speed={p.speed} />
        })}

        {/* Projectiles — white */}
        {projectiles.map(p => {
          const x = 60 + (p.sourceSlot * 120) + Math.sin(parseInt(p.id.slice(1)) * 1.7) * 30
          const y = posToY(p.position)
          const isTargeted = muscleTargetSet.has(p.id) || kidneyTargetSet.has(p.id)
          const radius = Math.max(3, Math.min(6, p.glucose / SIM_CONSTANTS.PROJECTILE_SIZE * 1.5))

          return (
            <circle
              key={p.id}
              cx={x}
              cy={y}
              r={radius}
              fill="#fff"
              opacity={isTargeted ? 1 : 0.85}
              className={isTargeted ? 'projectile projectile--targeted' : 'projectile'}
            />
          )
        })}

        {/* Spawn platforms — white with food emoji above */}
        {state.slotSpawnStates.map(ss => {
          const px = 40 + ss.slotIndex * 120
          const emoji = mealCards[ss.slotIndex]?.emoji ?? '🍽'
          return (
            <g key={`spawn-${ss.slotIndex}`}>
              <rect
                x={px}
                y={22}
                width={40}
                height={8}
                rx={4}
                fill="#fff"
                opacity={0.7}
              />
              <text x={px + 20} y={16} textAnchor="middle" className="spawn-emoji">
                {emoji}
              </text>
            </g>
          )
        })}

        {/* Inactive platform labels (slots activated but done spawning) */}
        {mealCards.map((card, i) => {
          const isSpawning = state.slotSpawnStates.some(ss => ss.slotIndex === i)
          const isActivated = i < state.nextSlotToActivate
          if (isSpawning || !isActivated) return null
          const px = 40 + i * 120
          return (
            <g key={`done-${i}`}>
              <rect x={px} y={22} width={40} height={8} rx={4} fill="#fff" opacity={0.2} />
              <text x={px + 20} y={16} textAnchor="middle" className="spawn-emoji spawn-emoji--done">
                {card.emoji}
              </text>
            </g>
          )
        })}

        {/* Base impact explosions */}
        {state.impacts.map(imp => {
          const x = 60 + (imp.sourceSlot * 120) + Math.sin(parseInt(imp.id.slice(1)) * 1.7) * 30
          const y = posToY(1.0)
          return (
            <text
              key={`boom-${imp.id}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="impact-boom"
            >
              💥
            </text>
          )
        })}
      </svg>
    </div>
  )
}
