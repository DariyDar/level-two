import { useGameStore } from './store/gameStore';
import './App.css';

function App() {
  const { phase, currentLevel, currentDay, degradation } = useGameStore();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚢 Port Management</h1>
        <div className="status-bar">
          <span>Phase: {phase}</span>
          <span>Day: {currentDay}</span>
          {currentLevel && <span>Level: {currentLevel.name}</span>}
        </div>
      </header>

      <main className="app-main">
        {phase === 'Planning' && <PlanningPlaceholder />}
        {phase === 'Simulation' && <SimulationPlaceholder />}
        {phase === 'Results' && <ResultsPlaceholder />}
      </main>

      <footer className="app-footer">
        <div className="degradation-status">
          <span>🫀 Liver: {degradation.liver}</span>
          <span>🫁 Pancreas: {degradation.pancreas}</span>
          <span>🫘 Kidney: {degradation.kidney}</span>
        </div>
      </footer>
    </div>
  );
}

// Placeholder components - will be replaced with real implementations
function PlanningPlaceholder() {
  const { setPhase } = useGameStore();

  return (
    <div className="phase-placeholder">
      <h2>📋 Planning Phase</h2>
      <p>Drag food ships to timeline slots</p>
      <button onClick={() => setPhase('Simulation')}>
        Start Simulation →
      </button>
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
  const { setPhase, startNextDay } = useGameStore();

  return (
    <div className="phase-placeholder">
      <h2>📊 Results Phase</h2>
      <p>View your performance</p>
      <div className="button-group">
        <button onClick={() => { startNextDay(); setPhase('Planning'); }}>
          Continue →
        </button>
        <button onClick={() => setPhase('Planning')}>
          Retry
        </button>
      </div>
    </div>
  );
}

export default App;
