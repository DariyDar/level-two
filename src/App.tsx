import { useGameStore } from './store/gameStore';
import { PlanningPhase } from './components/planning';
import { SimulationPhase } from './components/simulation';
import { ResultsPhase } from './components/results';
import { EyeToggle } from './components/ui/EyeToggle';
import { PreGameModal } from './components/ui/PreGameModal';
import { PhaseBanner } from './components/ui/PhaseBanner';
import { VERSION } from './version';
import './App.css';

function App() {
  const { phase, currentDay, currentLevel, mood, degradation, bgHistory, setPhase } = useGameStore();

  const totalDays = currentLevel?.days ?? 3;
  const remainingDays = totalDays - currentDay;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Port Planner</h1>
      </header>

      {phase === 'PreGame' && (
        <PreGameModal
          currentDay={currentDay}
          totalDays={totalDays}
          mood={mood}
          onStart={() => setPhase('Planning')}
        />
      )}

      {phase !== 'PreGame' && (
        <PhaseBanner
          phase={phase}
          mood={mood}
          remainingDays={remainingDays}
        />
      )}

      <main className="app-main">
        {phase === 'Planning' && <PlanningPhase />}
        {phase === 'Simulation' && <SimulationPhase />}
        {phase === 'Results' && <ResultsPhase bgHistory={bgHistory} />}
      </main>

      <EyeToggle />

      <footer className="app-footer">
        <div className="degradation-status">
          <span>Liver: {degradation.liver}%</span>
          <span>Pancreas: {degradation.pancreas}%</span>
        </div>
        <div className="version-badge">{VERSION}</div>
      </footer>
    </div>
  );
}

export default App;
