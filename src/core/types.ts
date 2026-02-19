// ============================================
// Core Types for BG Graph Planning Game
// ============================================

// === Enums / Unions ===

export type LoadType = 'Glucose' | 'Treatment';

// === Graph Configuration ===

export const GRAPH_CONFIG = {
  startHour: 8,       // 8 AM
  endHour: 20,        // 8 PM
  cellWidthMin: 15,   // minutes per column
  cellHeightMgDl: 20, // mg/dL per row
  bgMin: 60,          // Y axis minimum
  bgMax: 400,         // Y axis maximum
} as const;

// Derived constants
export const TOTAL_MINUTES = (GRAPH_CONFIG.endHour - GRAPH_CONFIG.startHour) * 60; // 720
export const TOTAL_COLUMNS = TOTAL_MINUTES / GRAPH_CONFIG.cellWidthMin; // 48
export const TOTAL_ROWS = (GRAPH_CONFIG.bgMax - GRAPH_CONFIG.bgMin) / GRAPH_CONFIG.cellHeightMgDl; // 17

// X axis tick marks (configurable)
export const DEFAULT_X_TICKS = [8, 11, 14, 17, 20]; // hours

// Y axis tick marks (configurable)
export const DEFAULT_Y_TICKS = [60, 100, 200, 300, 400]; // mg/dL

// === Game Settings ===

export interface GameSettings {
  timeFormat: '12h' | '24h';
  bgUnit: 'mg/dL' | 'mmol/L';
}

export const DEFAULT_SETTINGS: GameSettings = {
  timeFormat: '12h',
  bgUnit: 'mg/dL',
};

// mg/dL to mmol/L conversion factor
export const MGDL_TO_MMOL = 1 / 18;

// === Ship (Food/Intervention) Models ===

export interface Ship {
  id: string;
  name: string;
  emoji: string;
  load: number;           // Glucose amount in mg/dL
  carbs?: number;         // Carbohydrates in grams
  protein?: number;       // Protein in grams
  fat?: number;           // Fat in grams
  duration: number;       // Unload duration in minutes (determines pyramid width)
  kcal: number;           // Kilocalories
  loadType: LoadType;
  targetContainer: string;
  description?: string;
  wpCost?: number;        // Willpower cost (preserved for future use)
}

// === Placed Food on Graph ===

export interface PlacedFood {
  id: string;             // Unique placement ID
  shipId: string;         // Reference to Ship.id
  dropColumn: number;     // Column index where dropped (0 = start of graph)
}

// === Level Config ===

export interface AvailableFood {
  id: string;
  count: number;
}

export interface DayConfig {
  day: number;
  kcalBudget: number;
  wpBudget: number;
  availableFoods: AvailableFood[];
  availableInterventions?: AvailableFood[];
}

// === Kcal Assessment ===

export interface KcalAssessment {
  label: string;
  color: string;
}

export function getKcalAssessment(kcalUsed: number, kcalBudget: number): KcalAssessment {
  if (kcalUsed === 0) return { label: 'Fasting', color: '#718096' };
  const pct = (kcalUsed / kcalBudget) * 100;
  if (pct < 25) return { label: 'Starving', color: '#e53e3e' };
  if (pct < 50) return { label: 'Hungry', color: '#ed8936' };
  if (pct < 75) return { label: 'Light', color: '#ecc94b' };
  if (pct < 100) return { label: 'Well Fed', color: '#48bb78' };
  if (pct < 120) return { label: 'Full', color: '#38a169' };
  if (pct < 150) return { label: 'Overeating', color: '#ed8936' };
  return { label: 'Stuffed', color: '#e53e3e' };
}

export interface LevelConfig {
  id: string;
  name: string;
  description?: string;
  days: number;
  dayConfigs?: DayConfig[];
  // Legacy/fallback
  availableFoods?: AvailableFood[];
  kcalBudget?: number;
}

// === Type Guards ===

export function isGlucoseShip(ship: Ship): boolean {
  return ship.loadType === 'Glucose';
}

// === Utility Functions ===

/**
 * Convert column index to time string
 */
export function columnToTimeString(column: number, format: '12h' | '24h'): string {
  const totalMinutes = GRAPH_CONFIG.startHour * 60 + column * GRAPH_CONFIG.cellWidthMin;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const h12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';
  if (minutes === 0) return `${h12} ${ampm}`;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Convert mg/dL to mmol/L
 */
export function mgdlToMmol(mgdl: number): number {
  return Math.round(mgdl * MGDL_TO_MMOL * 10) / 10;
}

/**
 * Format BG value based on unit setting
 */
export function formatBgValue(mgdl: number, unit: 'mg/dL' | 'mmol/L'): string {
  if (unit === 'mmol/L') {
    return `${mgdlToMmol(mgdl)}`;
  }
  return `${mgdl}`;
}
