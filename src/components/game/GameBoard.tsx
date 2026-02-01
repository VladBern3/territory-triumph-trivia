import { GameState, Answer, SettlementSelection } from '@/types/game';
import { CzechoslovakiaMap } from './CzechoslovakiaMap';
import { PlayerPanel } from './PlayerPanel';
import { QuestionModal } from './QuestionModal';
import { BattleInfo } from './BattleInfo';
import { Swords, Target, Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  gameState: GameState;
  onSubmitAnswer: (answer: Answer) => void;
  onSelectTarget: (territoryId: string) => void;
  onSelectSettlementTerritory: (territoryId: string) => void;
  attackableTerritories: string[];
  selectableSettlementTerritories: string[];
  neighborSettlementTerritories: string[]; // Territories adjacent to current player
  waitingForAnswers: boolean;
  collectedAnswers?: Answer[];
  questionStartTime?: number;
  localPlayerId?: string | null;
}

export function GameBoard({
  gameState,
  onSubmitAnswer,
  onSelectTarget,
  onSelectSettlementTerritory,
  attackableTerritories,
  selectableSettlementTerritories,
  neighborSettlementTerritories,
  waitingForAnswers,
  collectedAnswers = [],
  questionStartTime = Date.now(),
  localPlayerId,
}: GameBoardProps) {
  const {
    phase,
    players,
    territories,
    currentQuestion,
    currentTurnPlayerId,
    attackingPlayerId,
    defendingPlayerId,
    targetTerritoryId,
    roundNumber,
    capitalBattleRound,
    currentAnimation,
    isSelectingSettlementTerritory,
    settlementSelections,
  } = gameState;

  const currentPlayer = players.find(p => p.id === currentTurnPlayerId);
  const attacker = players.find(p => p.id === attackingPlayerId);
  const defender = players.find(p => p.id === defendingPlayerId);
  const targetTerritory = territories.find(t => t.id === targetTerritoryId);

  const isInitializing = phase === 'initializing';
  const isSelectingWarTarget = phase === 'war' && !targetTerritoryId && currentTurnPlayerId && !isSelectingSettlementTerritory;
  const isBattleActive = (phase === 'war' || phase === 'capital_battle') && targetTerritoryId;
  
  // Check if it's the local player's turn
  const isMyTurn = localPlayerId ? currentTurnPlayerId === localPlayerId : true;
  
  // Get current selector info for settlement
  const currentSelector = settlementSelections.find(s => s.playerId === currentTurnPlayerId && s.territoriesRemaining > 0);
  
  // Show question modal when there's a question and not selecting target and not initializing
  const showQuestionModal = currentQuestion && !isSelectingWarTarget && !isInitializing && !isSelectingSettlementTerritory;

  // Determine which territories are selectable (for click handling)
  // During settlement: only neutral neighbor territories are selectable
  // During war: only attackable territories are selectable
  const selectableTerritories = isSelectingSettlementTerritory 
    ? (isMyTurn ? neighborSettlementTerritories : [])
    : isSelectingWarTarget 
      ? (isMyTurn ? attackableTerritories : [])
      : [];
  
  // Show unavailable mask only during selection phases and when it's my turn
  const showUnavailableMask = isMyTurn && (isSelectingSettlementTerritory || isSelectingWarTarget);

  // Determine click handler
  const handleTerritoryClick = isSelectingSettlementTerritory
    ? onSelectSettlementTerritory
    : isSelectingWarTarget
      ? onSelectTarget
      : () => {};

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden parchment-texture">
      {/* Header - minimal, floating */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-card/90 backdrop-blur-sm px-6 py-2 rounded-full medieval-border shadow-lg">
          <h1 className="font-display text-xl md:text-2xl gold-text">Quiz Empire</h1>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg medieval-border">
          <p className="text-sm text-muted-foreground">
            {phase === 'initializing' && 'Распределение территорий...'}
            {phase === 'settlement' && !isSelectingSettlementTerritory && 'Фаза расселения'}
            {phase === 'settlement' && isSelectingSettlementTerritory && 'Выбор территорий'}
            {phase === 'war' && 'Фаза войны'}
            {phase === 'capital_battle' && 'Битва за столицу!'}
          </p>
        </div>
      </div>

      {/* Initializing overlay */}
      {isInitializing && currentAnimation && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
          <div className="bg-card/95 backdrop-blur-sm px-6 py-3 rounded-lg medieval-border shadow-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-gold-accent" />
              <p className="font-display text-lg">
                {players.find(p => p.id === currentAnimation.playerId)?.name} получает начальную территорию...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Battle Info - top left when active */}
      {(phase === 'settlement' || isBattleActive) && !isInitializing && !isSelectingSettlementTerritory && (
        <div className="absolute top-4 left-4 z-10">
          <BattleInfo
            phase={phase}
            roundNumber={roundNumber}
            capitalBattleRound={capitalBattleRound}
            attackerName={attacker?.name}
            defenderName={defender?.name}
            targetTerritoryName={targetTerritory?.name}
            attackerColor={attacker?.color}
            defenderColor={defender?.color}
          />
        </div>
      )}

      {/* Full-screen Map */}
      <div className="flex-1 flex items-center justify-center p-4 pt-16 pb-24">
        <CzechoslovakiaMap
          territories={territories}
          players={players}
          selectedTerritoryId={targetTerritoryId}
          onTerritoryClick={handleTerritoryClick}
          selectableTerritories={selectableTerritories}
          highlightedTerritories={isBattleActive && targetTerritoryId ? [targetTerritoryId] : []}
          currentAnimation={currentAnimation}
          isMyTurn={isMyTurn}
          showUnavailableMask={showUnavailableMask}
        />
      </div>

      {/* Settlement Territory Selection Prompt */}
      {isSelectingSettlementTerritory && currentSelector && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
          <div className={cn(
            "bg-primary/90 backdrop-blur-sm text-primary-foreground px-6 py-3 rounded-lg shadow-lg",
            "flex items-center gap-3"
          )}>
            <MapPin className="w-5 h-5 animate-pulse" />
            <p className="font-display">
              <span className="font-semibold">{currentPlayer?.name}</span>, выберите территорию 
              <span className="ml-1 text-sm opacity-80">
                (осталось: {currentSelector.territoriesRemaining})
              </span>
            </p>
          </div>
        </div>
      )}

      {/* War Target Selection Prompt */}
      {isSelectingWarTarget && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
          <div className={cn(
            "bg-primary/90 backdrop-blur-sm text-primary-foreground px-6 py-3 rounded-lg shadow-lg",
            "flex items-center gap-3"
          )}>
            <Target className="w-5 h-5 animate-pulse" />
            <p className="font-display">
              <span className="font-semibold">{currentPlayer?.name}</span>, выберите территорию для атаки
            </p>
            <Swords className="w-5 h-5" />
          </div>
          {attackableTerritories.length === 0 && (
            <p className="text-sm text-center mt-2 text-muted-foreground bg-card/80 px-3 py-1 rounded">
              Нет доступных территорий для атаки
            </p>
          )}
        </div>
      )}

      {/* Player Panel - fixed at bottom, transparent */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="bg-transparent px-4 py-3">
          <PlayerPanel 
            players={players} 
            currentPlayerId={currentTurnPlayerId} 
            roundNumber={roundNumber}
            phase={phase}
            capitalBattleRound={capitalBattleRound}
          />
        </div>
      </div>

      {/* Question Modal */}
      <QuestionModal
        isOpen={showQuestionModal}
        question={currentQuestion}
        phase={phase === 'capital_battle' ? 'capital_battle' : phase === 'settlement' ? 'settlement' : 'war'}
        attacker={attacker}
        defender={defender}
        onSubmitAnswer={onSubmitAnswer}
        capitalBattleRound={capitalBattleRound}
        currentPlayerId={currentTurnPlayerId}
        localPlayerId={localPlayerId}
        players={players}
        collectedAnswers={collectedAnswers}
        questionStartTime={questionStartTime}
      />
    </div>
  );
}
