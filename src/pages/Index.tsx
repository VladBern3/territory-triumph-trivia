import { useState, useCallback, useEffect } from 'react';
import { MultiplayerLobby } from '@/components/game/MultiplayerLobby';
import { GameBoard } from '@/components/game/GameBoard';
import { GameOverScreen } from '@/components/game/GameOverScreen';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useGameState } from '@/hooks/useGameState';
import { Player, Answer } from '@/types/game';

const Index = () => {
  const multiplayer = useMultiplayer();
  const localGame = useGameState();
  
  const {
    sessionCode,
    localPlayerId,
    isHost,
    isConnected,
    error,
    gameState: mpGameState,
    isMyTurn,
    isInBattle,
    createSession,
    joinSession,
    syncGameState,
    submitAnswerToSession,
    leaveSession,
    setLocalPlayerId,
  } = multiplayer;

  // Use multiplayer game state when in a session, otherwise local state
  const isInSession = !!sessionCode;
  const gameState = isInSession ? mpGameState : localGame.gameState;
  const { phase, winner, players } = gameState;

  // Handle creating a session
  const handleCreateSession = useCallback(async (player: Omit<Player, 'territories' | 'capitalId' | 'isEliminated' | 'score'>) => {
    await createSession(player);
  }, [createSession]);

  // Handle joining a session
  const handleJoinSession = useCallback(async (code: string, player: Omit<Player, 'territories' | 'capitalId' | 'isEliminated' | 'score'>) => {
    await joinSession(code, player);
  }, [joinSession]);

  // Handle starting the game (host only)
  const handleStartGame = useCallback(async () => {
    if (!isHost || players.length < 2) return;
    
    // Use localGame to start and sync state
    localGame.startGame(players.map(p => ({ id: p.id, name: p.name, color: p.color })));
  }, [isHost, players, localGame]);

  // Sync local game state changes to multiplayer session
  useEffect(() => {
    if (isInSession && isHost && localGame.gameState.phase !== 'lobby') {
      syncGameState(localGame.gameState);
    }
  }, [isInSession, isHost, localGame.gameState, syncGameState]);

  // Handle answer submission
  const handleSubmitAnswer = useCallback((answer: Answer) => {
    if (isInSession) {
      // Check if this player should answer
      const canAnswer = phase === 'settlement' || 
        (phase === 'war' && isInBattle) || 
        (phase === 'capital_battle' && isInBattle);
      
      if (canAnswer) {
        submitAnswerToSession(answer);
        // Host processes answers locally
        if (isHost) {
          localGame.submitAnswer(answer);
        }
      }
    } else {
      localGame.submitAnswer(answer);
    }
  }, [isInSession, phase, isInBattle, isHost, submitAnswerToSession, localGame]);

  // Handle target selection (war phase)
  const handleSelectTarget = useCallback((territoryId: string) => {
    if (isInSession) {
      if (isMyTurn) {
        localGame.selectAttackTarget(territoryId);
      }
    } else {
      localGame.selectAttackTarget(territoryId);
    }
  }, [isInSession, isMyTurn, localGame]);

  // Handle role selection for testing
  const handleSelectRole = useCallback((playerId: string) => {
    setLocalPlayerId(playerId);
  }, [setLocalPlayerId]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (isInSession) {
      leaveSession();
    }
    localGame.resetGame();
  }, [isInSession, leaveSession, localGame]);

  // Waiting room / Lobby - check if not in active game or multiplayer waiting
  const isWaitingPhase = phase === 'lobby' || (mpGameState.phase as string) === 'waiting';
  
  if (!isInSession || isWaitingPhase) {
    return (
      <MultiplayerLobby
        sessionCode={sessionCode}
        players={players}
        localPlayerId={localPlayerId}
        isHost={isHost}
        isConnected={isConnected}
        error={error}
        onCreateSession={handleCreateSession}
        onJoinSession={handleJoinSession}
        onStartGame={handleStartGame}
        onLeaveSession={leaveSession}
        onSelectRole={handleSelectRole}
      />
    );
  }

  // Game over phase
  if (phase === 'game_over' && winner) {
    return <GameOverScreen winner={winner} onPlayAgain={handleReset} />;
  }

  // Active game phases
  return (
    <GameBoard
      gameState={gameState}
      onSubmitAnswer={handleSubmitAnswer}
      onSelectTarget={handleSelectTarget}
      attackableTerritories={localGame.getAttackableTerritories()}
      waitingForAnswers={localGame.answers.length > 0}
    />
  );
};

export default Index;
