import { GameState, Player, Territory } from '@/types/game';
import { CzechMap } from './CzechMap';
import { PlayerPanel } from './PlayerPanel';
import { QuestionCard } from './QuestionCard';
import { BattleInfo } from './BattleInfo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Swords, Target, Info } from 'lucide-react';
import { Answer } from '@/types/game';

interface GameBoardProps {
  gameState: GameState;
  onSubmitAnswer: (answer: Answer) => void;
  onSelectTarget: (territoryId: string) => void;
  attackableTerritories: string[];
  waitingForAnswers: boolean;
}

export function GameBoard({
  gameState,
  onSubmitAnswer,
  onSelectTarget,
  attackableTerritories,
  waitingForAnswers,
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
  } = gameState;

  const currentPlayer = players.find(p => p.id === currentTurnPlayerId);
  const attacker = players.find(p => p.id === attackingPlayerId);
  const defender = players.find(p => p.id === defendingPlayerId);
  const targetTerritory = territories.find(t => t.id === targetTerritoryId);

  const isSelectingTarget = (phase === 'war' && !targetTerritoryId && currentTurnPlayerId);
  const isBattleActive = (phase === 'war' || phase === 'capital_battle') && targetTerritoryId;

  // Determine which player should see the question
  const shouldShowQuestion = (playerId: string) => {
    if (phase === 'settlement') return true;
    if (isBattleActive) {
      return playerId === attackingPlayerId || playerId === defendingPlayerId;
    }
    return false;
  };

  return (
    <div className="min-h-screen parchment-texture p-4 space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="font-display text-3xl md:text-4xl gold-text mb-2">Conquiztador</h1>
        <p className="text-muted-foreground">
          {phase === 'settlement' && 'Фаза расселения — отвечайте на вопросы, чтобы захватить свободные земли'}
          {phase === 'war' && !isSelectingTarget && 'Фаза войны — атакуйте соседние территории'}
          {phase === 'war' && isSelectingTarget && `Ход ${currentPlayer?.name} — выберите территорию для атаки`}
          {phase === 'capital_battle' && 'Битва за столицу!'}
        </p>
      </div>

      {/* Player Panel */}
      <PlayerPanel players={players} currentPlayerId={currentTurnPlayerId} />

      {/* Battle Info */}
      {(phase === 'settlement' || isBattleActive) && (
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
      )}

      {/* Map */}
      <Card className="medieval-border bg-card/80 backdrop-blur overflow-hidden">
        <CardContent className="p-4">
          <CzechMap
            territories={territories}
            players={players}
            selectedTerritoryId={targetTerritoryId}
            onTerritoryClick={isSelectingTarget ? onSelectTarget : () => {}}
            selectableTerritories={isSelectingTarget ? attackableTerritories : []}
            highlightedTerritories={isBattleActive && targetTerritoryId ? [targetTerritoryId] : []}
          />
        </CardContent>
      </Card>

      {/* Target Selection Prompt */}
      {isSelectingTarget && (
        <Card className="medieval-border bg-primary/10 border-primary animate-fade-in">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-3">
              <Target className="w-5 h-5 text-primary animate-pulse" />
              <p className="font-display">
                <span className="font-semibold">{currentPlayer?.name}</span>, выберите территорию для атаки
              </p>
              <Swords className="w-5 h-5 text-primary" />
            </div>
            {attackableTerritories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Нет доступных территорий для атаки. Нужна общая граница с противником.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Question Area */}
      {currentQuestion && !isSelectingTarget && (
        <div className="space-y-4">
          {phase === 'settlement' ? (
            // Settlement phase - all players answer
            <div className="max-w-2xl mx-auto">
              <QuestionCard
                question={currentQuestion}
                onAnswer={onSubmitAnswer}
                playerId={currentTurnPlayerId || players[0]?.id || ''}
                timeLimit={20}
                showHint={true}
              />
              {waitingForAnswers && (
                <Card className="mt-4 bg-secondary/50">
                  <CardContent className="py-3 text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Info className="w-4 h-4" />
                      В полной версии все игроки отвечают одновременно
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : isBattleActive ? (
            // War phase - attacker and defender answer
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {attacker && (
                <div className="space-y-2">
                  <p className="font-display text-center font-semibold flex items-center justify-center gap-2">
                    <Swords className="w-4 h-4" />
                    {attacker.name} (Атакующий)
                  </p>
                  <QuestionCard
                    question={currentQuestion}
                    onAnswer={onSubmitAnswer}
                    playerId={attacker.id}
                    timeLimit={15}
                  />
                </div>
              )}
              {defender && (
                <div className="space-y-2">
                  <p className="font-display text-center font-semibold flex items-center justify-center gap-2">
                    <Target className="w-4 h-4" />
                    {defender.name} (Защитник)
                  </p>
                  <QuestionCard
                    question={currentQuestion}
                    onAnswer={onSubmitAnswer}
                    playerId={defender.id}
                    timeLimit={15}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
