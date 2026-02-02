import { useGameStore } from './store/gameStore';
import { PlanningPhase } from './components/planning';
import './App.css';

function App() {
  const { phase, currentLevel, currentDay, degradation } = useGameStore();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚢 Port Management</h1>
        <div className="status-bar">
          <span>Day {currentDay}</span>
          {currentLevel && <span>{currentLevel.name}</span>}
        </div>
      </header>

      <main className="app-main">
        {phase === 'Planning' && <PlanningPhase />}
        {phase === 'Simulation' && <SimulationPlaceholder />}
        {phase === 'Results' && <ResultsPlaceholder />}
      </main>

      <footer className="app-footer">
        <div className="degradation-status">
          <span>🫀 Liver: {degradation.liver}%</span>
          <span>🫁 Pancreas: {degradation.pancreas}%</span>
        </div>
      </footer>
    </div>
  );
}

function SimulationPlaceholder() {
  const { setPhase } = useGameStore();

  return (
    <div className="phase-placeholder">
      <h2>⚡ Simulation Phase</h2>
      <p>Watch the day unfold...</p>
      <button onClick={() => setPhase('Results')}>
        End Simulation →
      </button>
    </div>
  );
}

function ResultsPlaceholder() {
  const { startNextDay, retryDay } = useGameStore();

  return (
    <div className="phase-placeholder">
      <h2>📊 Results Phase</h2>
      <p>View your performance</p>
      <div className="button-group">
        <button onClick={startNextDay}>
          Continue →
        </button>
        <button onClick={retryDay}>
          Retry
        </button>
      </div>
    </div>
  );
}

export default App;
