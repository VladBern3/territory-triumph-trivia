import { GameState, Answer, SettlementSelection } from '@/types/game';
import { CzechoslovakiaMap } from './CzechoslovakiaMap';
import { PlayerPanel } from './PlayerPanel';
import { QuestionModal } from './QuestionModal';
import { BattleInfo } from './BattleInfo';
import { TerritorySelectionTimer } from './TerritorySelectionTimer';
import { Loader2, MapPin } from 'lucide-react';
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
  onSelectionTimeout?: () => void;
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
  onSelectionTimeout,
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

  // Show territory selection timer when selecting settlement territory or war target
  const showSelectionTimer = (isSelectingSettlementTerritory || isSelectingWarTarget) && currentPlayer;

  // Determine which territories are selectable (for click handling)
  // During settlement: only neutral neighbor territories are selectable
  // During war: only attackable territories are selectable
  // Show selectable territories to ALL players so everyone sees what's available
  const selectableTerritories = isSelectingSettlementTerritory 
    ? neighborSettlementTerritories
    : isSelectingWarTarget 
      ? attackableTerritories
      : [];
  
  // Only allow clicking if it's my turn
  const canClick = isMyTurn;
  
  // Show unavailable mask to ALL players during selection phases
  const showUnavailableMask = isSelectingSettlementTerritory || isSelectingWarTarget;

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

      {/* Territory Selection Timer */}
      {showSelectionTimer && currentPlayer && onSelectionTimeout && (
        <TerritorySelectionTimer
          playerId={currentPlayer.id}
          playerName={currentPlayer.name}
          playerColor={currentPlayer.color}
          isActive={true}
          duration={15}
          remainingSelections={currentSelector?.territoriesRemaining ?? 1}
          onTimeout={onSelectionTimeout}
        />
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
          isMyTurn={canClick}
          showUnavailableMask={showUnavailableMask}
        />
      </div>

      {/* Settlement Territory Selection - remaining count indicator */}
      {isSelectingSettlementTerritory && currentSelector && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
          <div className={cn(
            "bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg medieval-border",
            "flex items-center gap-2 text-sm"
          )}>
            <MapPin className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-muted-foreground">
              Осталось выбрать: <span className="font-semibold text-foreground">{currentSelector.territoriesRemaining}</span>
            </span>
          </div>
        </div>
      )}

      {/* War Target Selection - no attackable territories warning */}
      {isSelectingWarTarget && attackableTerritories.length === 0 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
          <div className="bg-destructive/90 backdrop-blur-sm text-destructive-foreground px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm">Нет доступных территорий для атаки</p>
          </div>
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
