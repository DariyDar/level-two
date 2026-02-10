import './OrganTierCircles.css'

interface OrganTierCirclesProps {
  maxCircles: number       // total visible circles (e.g. 4)
  degradedCircles: number  // degraded from right (pink)
  colorScheme?: 'orange' | 'green'
}

/**
 * Circle indicators for organ health in planning phase.
 * Healthy circles: yellow/green. Degraded: pink (from right).
 */
export function OrganTierCircles({
  maxCircles,
  degradedCircles,
  colorScheme = 'orange',
}: OrganTierCirclesProps) {
  const circles = []

  for (let i = 0; i < maxCircles; i++) {
    const isDegraded = i >= maxCircles - degradedCircles

    let stateClass = ''
    if (isDegraded) {
      stateClass = 'otc--degraded'
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
