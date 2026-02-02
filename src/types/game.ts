export interface Player {
  id: string;
  name: string;
  color: 'red' | 'blue' | 'green' | 'yellow';
  territories: string[];
  capitalId: string | null;
  isEliminated: boolean;
  score: number;
  isBot?: boolean;
}

export interface Territory {
  id: string;
  name: string;
  ownerId: string | null;
  isCapital: boolean;
  neighbors: string[];
  position: { x: number; y: number };
  path: string; // SVG path for the territory shape
}

export interface TerritoryAnimation {
  territoryId: string;
  playerId: string;
  startTime: number;
  duration: number;
  isCapital?: boolean;
}

export interface Question {
  id: string;
  type: 'numeric' | 'multiple_choice';
  text: string;
  correctAnswer: number | string;
  options?: string[]; // For multiple choice
  hint?: string;
  category?: string;
  difficulty?: number;
}

export interface SettlementSelection {
  playerId: string;
  rank: number; // 1, 2, or 3
  territoriesRemaining: number; // How many they can still pick
}

export interface GameState {
  phase: 'lobby' | 'initializing' | 'settlement' | 'war' | 'capital_battle' | 'game_over';
  players: Player[];
  territories: Territory[];
  currentQuestion: Question | null;
  currentTurnPlayerId: string | null;
  attackingPlayerId: string | null;
  defendingPlayerId: string | null;
  targetTerritoryId: string | null;
  roundNumber: number;
  capitalBattleRound: number; // 1, 2, or 3 for capital battles
  winner: Player | null;
  currentAnimation: TerritoryAnimation | null;
  // Settlement phase specific
  settlementSelections: SettlementSelection[];
  isSelectingSettlementTerritory: boolean;
}

export interface Answer {
  playerId: string;
  answer: number | string | null; // null means no answer / timeout
  timestamp: number;
}

export type GamePhase = GameState['phase'];
