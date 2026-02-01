import { useState, useCallback, useEffect, useRef } from 'react';
import { MultiplayerLobby } from '@/components/game/MultiplayerLobby';
import { GameBoard } from '@/components/game/GameBoard';
import { GameOverScreen } from '@/components/game/GameOverScreen';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useGameState } from '@/hooks/useGameState';
import { useBotPlayer } from '@/hooks/useBotPlayer';
import { useQuestions } from '@/hooks/useQuestions';
import { Player, Answer } from '@/types/game';

const Index = () => {
  const multiplayer = useMultiplayer();
  const questions = useQuestions();
  const localGame = useGameState({
    getRandomNumericQuestion: questions.getRandomNumericQuestion,
    getRandomChoiceQuestion: questions.getRandomChoiceQuestion,
  });
  const botPlayer = useBotPlayer();
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const humanPlayerIdRef = useRef<string | null>(null);
  
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
    
    // Ensure questions are loaded before starting
    await questions.loadQuestions();
    
    // Use localGame to start and sync state
    localGame.startGame(players.map(p => ({ id: p.id, name: p.name, color: p.color, isBot: p.isBot })));
  }, [isHost, players, localGame, questions]);

  // Handle starting single player game with bots
  const handleStartSinglePlayer = useCallback(async (playerName: string) => {
    // Ensure questions are loaded before starting
    await questions.loadQuestions();
    
    const humanPlayer = {
      id: `player_${Date.now()}`,
      name: playerName,
      color: 'red' as const,
      isBot: false,
    };
    
    humanPlayerIdRef.current = humanPlayer.id;
    
    // Create 2 bots with different colors
    const bots = botPlayer.createBots(2, [humanPlayer.color]);
    
    setIsSinglePlayer(true);
    localGame.startGame([humanPlayer, ...bots]);
  }, [botPlayer, localGame, questions]);

  // Sync local game state changes to multiplayer session
  useEffect(() => {
    if (isInSession && isHost && localGame.gameState.phase !== 'lobby') {
      syncGameState(localGame.gameState);
    }
  }, [isInSession, isHost, localGame.gameState, syncGameState]);

  // Schedule bot answers when in single player mode and question changes
  useEffect(() => {
    if (!isSinglePlayer) return;
    
    const { currentQuestion, phase: currentPhase, attackingPlayerId, defendingPlayerId } = localGame.gameState;
    if (!currentQuestion) return;
    
    // Get bots that should answer this question
    let botsToAnswer: Player[] = [];
    
    if (currentPhase === 'settlement') {
      // All bots answer in settlement phase
      botsToAnswer = localGame.gameState.players.filter(p => p.isBot && !p.isEliminated);
    } else if (currentPhase === 'war' || currentPhase === 'capital_battle') {
      // Only bots involved in battle answer
      botsToAnswer = localGame.gameState.players.filter(p => 
        p.isBot && !p.isEliminated && 
        (p.id === attackingPlayerId || p.id === defendingPlayerId)
      );
    }
    
    if (botsToAnswer.length > 0) {
      botPlayer.scheduleBotAnswers(
        botsToAnswer,
        currentQuestion,
        'medium',
        (answer) => localGame.submitAnswer(answer)
      );
    }
    
    return () => {
      botPlayer.cancelPendingAnswers();
    };
  }, [isSinglePlayer, localGame.gameState.currentQuestion, localGame.gameState.phase, botPlayer, localGame]);

  // Auto-select attack target for bot's turn in war phase
  useEffect(() => {
    if (!isSinglePlayer) return;
    
    const { phase: currentPhase, currentTurnPlayerId, attackingPlayerId } = localGame.gameState;
    
    // Only auto-attack if it's a bot's turn and we're waiting for target selection
    if (currentPhase === 'war' && currentTurnPlayerId && !attackingPlayerId) {
      const currentPlayer = localGame.gameState.players.find(p => p.id === currentTurnPlayerId);
      
      if (currentPlayer?.isBot) {
        // Bot selects a random attackable territory after a short delay
        const attackable = localGame.getAttackableTerritories();
        if (attackable.length > 0) {
          const delay = 1000 + Math.random() * 1500;
          const timeoutId = setTimeout(() => {
            const targetId = attackable[Math.floor(Math.random() * attackable.length)];
            localGame.selectAttackTarget(targetId);
          }, delay);
          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [isSinglePlayer, localGame.gameState.phase, localGame.gameState.currentTurnPlayerId, localGame.gameState.attackingPlayerId, localGame]);

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
    setIsSinglePlayer(false);
    humanPlayerIdRef.current = null;
    botPlayer.cancelPendingAnswers();
    questions.resetUsedQuestions();
    localGame.resetGame();
  }, [isInSession, leaveSession, localGame, botPlayer, questions]);

  // Waiting room / Lobby - check if not in active game or multiplayer waiting
  const isWaitingPhase = phase === 'lobby' || (mpGameState.phase as string) === 'waiting';
  
  if (!isSinglePlayer && (!isInSession || isWaitingPhase)) {
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
        onStartSinglePlayer={handleStartSinglePlayer}
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
      collectedAnswers={localGame.answers}
    />
  );
};

export default Index;
