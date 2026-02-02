import { useGameStore } from './store/gameStore';
import { PlanningPhase } from './components/planning';
import { SimulationPhase } from './components/simulation';
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
        {phase === 'Simulation' && <SimulationPhase />}
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
