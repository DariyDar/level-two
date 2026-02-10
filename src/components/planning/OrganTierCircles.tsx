import './OrganTierCircles.css'

interface OrganTierCirclesProps {
  maxCircles: number       // total visible circles (e.g. 4)
  degradedCircles: number  // degraded from right (pink)
  activeCircles?: number   // active tiers flashing (from left, 0 = none)
  colorScheme?: 'orange' | 'green'
}

/**
 * Circle indicators for organ health.
 * Active circles: flash animation. Healthy: green. Degraded: pink (from right).
 */
export function OrganTierCircles({
  maxCircles,
  degradedCircles,
  activeCircles = 0,
  colorScheme = 'green',
}: OrganTierCirclesProps) {
  const circles = []

  for (let i = 0; i < maxCircles; i++) {
    const tierNumber = i + 1
    const isDegraded = i >= maxCircles - degradedCircles
    const isActive = tierNumber <= activeCircles && !isDegraded

    let stateClass = ''
    if (isDegraded) {
      stateClass = 'otc--degraded'
    } else if (isActive) {
      stateClass = 'otc--active'
    } else {
      stateClass = colorScheme === 'green' ? 'otc--healthy-green' : 'otc--healthy'
    }

    circles.push(
      <div key={i} className={`otc ${stateClass}`} />
    )
  }

  return (
    <div className="otc-row">
      {circles}
    </div>
  )
}
