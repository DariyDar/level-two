import { useGameStore } from './store/gameStore';
import { PlanningPhase } from './components/planning';
import { SimulationPhase } from './components/simulation';
import { ResultsPhase } from './components/results';
import './App.css';

function App() {
  const { phase, currentLevel, currentDay, degradation, bgHistory } = useGameStore();

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
        {phase === 'Results' && <ResultsPhase bgHistory={bgHistory} />}
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

export default App;
