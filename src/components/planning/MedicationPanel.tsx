import type { Medication } from '../../core/types';
import './MedicationPanel.css';

interface MedicationPanelProps {
  allMedications: Medication[];
  availableMedicationIds: string[];
  activeMedications: string[];
  onToggle: (medicationId: string) => void;
}

export function MedicationPanel({
  allMedications,
  availableMedicationIds,
  activeMedications,
  onToggle,
}: MedicationPanelProps) {
  if (availableMedicationIds.length === 0) return null;

  return (
    <div className="medication-panel">
      <div className="medication-panel__title">Medications</div>
      <div className="medication-panel__grid">
        {availableMedicationIds.map(medId => {
          const med = allMedications.find(m => m.id === medId);
          if (!med) return null;
          const isActive = activeMedications.includes(medId);
          return (
            <button
              key={medId}
              className={`medication-toggle ${isActive ? 'medication-toggle--active' : ''}`}
              onClick={() => onToggle(medId)}
              data-tooltip={med.description}
            >
              <span className="medication-toggle__emoji">{med.emoji}</span>
              <div className="medication-toggle__details">
                <span className="medication-toggle__name">{med.name}</span>
                <span className="medication-toggle__desc">{med.description}</span>
              </div>
              <span className="medication-toggle__status">
                {isActive ? 'ON' : 'OFF'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
