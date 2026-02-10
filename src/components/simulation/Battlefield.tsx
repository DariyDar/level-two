import type { SimulationState } from '../../types'
import { SIM_CONSTANTS } from '../../types'
import './Battlefield.css'

interface BattlefieldProps {
  state: SimulationState
}

const SLOT_COLORS = ['#f97316', '#3b82f6', '#a855f7'] // orange, blue, purple

const SVG_WIDTH = 400
const SVG_HEIGHT = 700

function posToY(position: number): number {
  return 40 + position * (SVG_HEIGHT - 80)
}

export function Battlefield({ state }: BattlefieldProps) {
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
              x2={60 + (p.sourceSlot * 100)}
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
              x2={60 + (p.sourceSlot * 100)}
              y2={posToY(p.position)}
              stroke="rgba(234, 179, 8, 0.4)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )
        })}

        {/* Projectiles */}
        {projectiles.map(p => {
          const x = 60 + (p.sourceSlot * 120) + Math.sin(parseInt(p.id.slice(1)) * 1.7) * 30
          const y = posToY(p.position)
          const color = SLOT_COLORS[p.sourceSlot] ?? '#fff'
          const isTargeted = muscleTargetSet.has(p.id) || kidneyTargetSet.has(p.id)
          const radius = Math.max(3, Math.min(6, p.glucose / SIM_CONSTANTS.PROJECTILE_SIZE * 1.5))

          return (
            <circle
              key={p.id}
              cx={x}
              cy={y}
              r={radius}
              fill={color}
              opacity={isTargeted ? 1 : 0.8}
              className={isTargeted ? 'projectile projectile--targeted' : 'projectile'}
            />
          )
        })}

        {/* Spawn indicators */}
        {state.slotSpawnStates.map(ss => (
          <rect
            key={`spawn-${ss.slotIndex}`}
            x={40 + ss.slotIndex * 120}
            y={20}
            width={40}
            height={8}
            rx={4}
            fill={SLOT_COLORS[ss.slotIndex]}
            opacity={0.6}
          />
        ))}
      </svg>
    </div>
  )
}
