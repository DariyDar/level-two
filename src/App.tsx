import { useEffect, useState } from 'react'
import { VERSION } from './version'
import { useGameStore } from './store/gameStore'
import { loadFoods, loadLevel } from './config/loader'
import { PlanningPhase } from './components/planning/PlanningPhase'
import { SimulationPhase } from './components/simulation/SimulationPhase'
import { ResultsPhase } from './components/results/ResultsPhase'
import './App.css'

function App() {
  const { phase, initLevel, currentLevel } = useGameStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const [foods, level] = await Promise.all([
          loadFoods(),
          loadLevel('level-01'),
        ])
        initLevel(level, foods)
        setLoading(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
        setLoading(false)
      }
    }
    if (!currentLevel) {
      init()
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="app app--loading">
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app app--error">
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Glucose TD</span>
        <span className="app-version">{VERSION}</span>
      </header>

      <main className="app-main">
        {phase === 'Planning' && <PlanningPhase />}
        {phase === 'Simulation' && <SimulationPhase />}
        {phase === 'Results' && <ResultsPhase />}
      </main>
    </div>
  )
}

export default App
