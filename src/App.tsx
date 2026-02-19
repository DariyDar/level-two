import { PlanningPhase } from './components/planning';
import { VERSION } from './version';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>BG Planner</h1>
      </header>

      <main className="app-main">
        <PlanningPhase />
      </main>

      <div className="version-badge">{VERSION}</div>
    </div>
  );
}

export default App;
