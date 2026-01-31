import { useState, useCallback, useMemo, useRef } from 'react';
import { GameState, Player, Territory, Answer, Question, TerritoryAnimation } from '@/types/game';
import { initialTerritories, getMaximallyDistantTerritories } from '@/data/territories';
import { getRandomNumericQuestion, getRandomMultipleChoiceQuestion } from '@/data/questions';

const ANIMATION_DURATION = 800; // ms for capture animation

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    players: [],
    territories: initialTerritories,
    currentQuestion: null,
    currentTurnPlayerId: null,
    attackingPlayerId: null,
    defendingPlayerId: null,
    targetTerritoryId: null,
    roundNumber: 0,
    capitalBattleRound: 0,
    winner: null,
    currentAnimation: null,
  });

  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const animationQueueRef = useRef<{ territoryId: string; playerId: string; isCapital: boolean }[]>([]);

  // Get unowned territories
  const neutralTerritories = useMemo(() => 
    gameState.territories.filter(t => t.ownerId === null),
    [gameState.territories]
  );

  // Animate territory capture
  const animateCapture = useCallback((territoryId: string, playerId: string, isCapital: boolean = false): Promise<void> => {
    return new Promise((resolve) => {
      const animation: TerritoryAnimation = {
        territoryId,
        playerId,
        startTime: Date.now(),
        duration: ANIMATION_DURATION,
        isCapital,
      };

      setGameState(prev => ({
        ...prev,
        currentAnimation: animation,
      }));

      setTimeout(() => {
        // Update territory ownership after animation
        setGameState(prev => {
          const newTerritories = prev.territories.map(t => 
            t.id === territoryId 
              ? { ...t, ownerId: playerId, isCapital } 
              : t
          );
          const newPlayers = prev.players.map(p => 
            p.id === playerId 
              ? { 
                  ...p, 
                  territories: [...p.territories, territoryId],
                  capitalId: isCapital ? territoryId : p.capitalId,
                } 
              : p
          );

          return {
            ...prev,
            territories: newTerritories,
            players: newPlayers,
            currentAnimation: null,
          };
        });
        resolve();
      }, ANIMATION_DURATION);
    });
  }, []);

  // Process initial territory assignments sequentially
  const processInitialAssignments = useCallback(async (
    players: Player[], 
    startingTerritoryIds: string[]
  ) => {
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const territoryId = startingTerritoryIds[i];
      
      if (territoryId) {
        await animateCapture(territoryId, player.id, true);
      }
    }

    // After all initial animations, start the settlement phase
    const firstQuestion = getRandomNumericQuestion([]);
    
    setGameState(prev => ({
      ...prev,
      phase: 'settlement',
      currentQuestion: firstQuestion,
      currentTurnPlayerId: prev.players[0].id,
      roundNumber: 1,
    }));
    
    if (firstQuestion) {
      setUsedQuestionIds([firstQuestion.id]);
    }
  }, [animateCapture]);

  // Initialize game with players - auto-assign starting territories maximally apart
  const startGame = useCallback((playerData: Omit<Player, 'territories' | 'capitalId' | 'isEliminated' | 'score'>[]) => {
    // Get starting territories that are maximally far apart
    const startingTerritoryIds = getMaximallyDistantTerritories(playerData.length);
    
    // Create a fresh copy of territories - all neutral at start
    const newTerritories = initialTerritories.map(t => ({ ...t, ownerId: null, isCapital: false }));
    
    // Create players WITHOUT territories yet (they'll be assigned via animation)
    const players: Player[] = playerData.map((p) => ({
      ...p,
      territories: [],
      capitalId: null,
      isEliminated: false,
      score: 0,
    }));

    // Set initial state with empty map
    setGameState(prev => ({
      ...prev,
      phase: 'initializing',
      players,
      territories: newTerritories,
      currentQuestion: null,
      currentTurnPlayerId: null,
      roundNumber: 0,
    }));
    
    setAnswers([]);

    // Start the animation sequence
    setTimeout(() => {
      processInitialAssignments(players, startingTerritoryIds);
    }, 500);
  }, [processInitialAssignments]);

  // Handle answer submission
  const submitAnswer = useCallback((answer: Answer) => {
    setAnswers(prev => {
      const newAnswers = [...prev, answer];
      
      // Check if all active players have answered
      const activePlayers = gameState.players.filter(p => !p.isEliminated);
      
      if (newAnswers.length >= activePlayers.length) {
        // Process all answers
        setTimeout(() => processAnswers(newAnswers), 500);
      }
      
      return newAnswers;
    });
  }, [gameState.players]);

  // Process answers after all players respond
  const processAnswers = useCallback((submittedAnswers: Answer[]) => {
    const { currentQuestion, phase } = gameState;
    
    if (!currentQuestion) return;
    
    if (phase === 'settlement') {
      processSettlementAnswers(submittedAnswers, currentQuestion);
    } else if (phase === 'war' || phase === 'capital_battle') {
      processWarAnswers(submittedAnswers, currentQuestion);
    }
  }, [gameState]);

  const processSettlementAnswers = async (submittedAnswers: Answer[], question: Question) => {
    const correctAnswer = Number(question.correctAnswer);
    
    // Sort by distance to correct answer, then by timestamp
    const sorted = [...submittedAnswers].sort((a, b) => {
      const distA = Math.abs(Number(a.answer) - correctAnswer);
      const distB = Math.abs(Number(b.answer) - correctAnswer);
      if (distA !== distB) return distA - distB;
      return a.timestamp - b.timestamp;
    });

    // Get available neutral territories
    const available = gameState.territories.filter(t => t.ownerId === null);
    
    // First place gets 2 territories
    if (sorted[0] && available.length > 0) {
      await animateCapture(available[0].id, sorted[0].playerId, false);
      
      const remainingAfterFirst = gameState.territories.filter(t => t.ownerId === null);
      if (remainingAfterFirst.length > 0) {
        await animateCapture(remainingAfterFirst[0].id, sorted[0].playerId, false);
      }
    }
    
    // Second place gets 1 territory
    setGameState(prev => {
      const remainingAvailable = prev.territories.filter(t => t.ownerId === null);
      if (sorted[1] && remainingAvailable.length > 0) {
        // This will be handled by animateCapture
      }
      
      // Check if settlement phase is over
      const stillNeutral = prev.territories.filter(t => t.ownerId === null);
      const newPhase = stillNeutral.length <= 1 ? 'war' : 'settlement';
      
      // Get next question
      const nextQuestion = newPhase === 'war' 
        ? getRandomMultipleChoiceQuestion(usedQuestionIds)
        : getRandomNumericQuestion(usedQuestionIds);
      
      if (nextQuestion) {
        setUsedQuestionIds(ids => [...ids, nextQuestion.id]);
      }
      
      setAnswers([]);
      
      const activePlayers = prev.players.filter(p => !p.isEliminated);
      const nextPlayer = activePlayers[prev.roundNumber % activePlayers.length];
      
      return {
        ...prev,
        phase: newPhase,
        currentQuestion: nextQuestion,
        roundNumber: prev.roundNumber + 1,
        currentTurnPlayerId: nextPlayer?.id || null,
      };
    });
  };

  const processWarAnswers = (submittedAnswers: Answer[], question: Question) => {
    const correctAnswer = question.correctAnswer;
    const { attackingPlayerId, defendingPlayerId, targetTerritoryId, phase } = gameState;
    
    const attackerAnswer = submittedAnswers.find(a => a.playerId === attackingPlayerId);
    const defenderAnswer = submittedAnswers.find(a => a.playerId === defendingPlayerId);
    
    if (!attackerAnswer || !defenderAnswer || !targetTerritoryId) {
      setAnswers([]);
      return;
    }
    
    const attackerCorrect = attackerAnswer.answer === correctAnswer;
    const defenderCorrect = defenderAnswer.answer === correctAnswer;
    
    // Determine winner
    let attackerWins = false;
    
    if (attackerCorrect && !defenderCorrect) {
      attackerWins = true;
    } else if (attackerCorrect && defenderCorrect) {
      attackerWins = attackerAnswer.timestamp < defenderAnswer.timestamp - 500;
    }
    
    setGameState(prev => {
      if (!attackerWins) {
        // Attack failed
        const nextQuestion = getRandomMultipleChoiceQuestion(usedQuestionIds);
        if (nextQuestion) {
          setUsedQuestionIds(ids => [...ids, nextQuestion.id]);
        }
        setAnswers([]);
        
        const activePlayers = prev.players.filter(p => !p.isEliminated);
        const currentIndex = activePlayers.findIndex(p => p.id === prev.currentTurnPlayerId);
        const nextPlayer = activePlayers[(currentIndex + 1) % activePlayers.length];
        
        return {
          ...prev,
          currentQuestion: nextQuestion,
          currentTurnPlayerId: nextPlayer.id,
          attackingPlayerId: null,
          defendingPlayerId: null,
          targetTerritoryId: null,
          capitalBattleRound: 0,
        };
      }
      
      // Attack succeeded - animate capture
      const targetTerritory = prev.territories.find(t => t.id === targetTerritoryId)!;
      const isCapitalBattle = targetTerritory.isCapital;
      
      if (isCapitalBattle && phase === 'capital_battle' && prev.capitalBattleRound < 3) {
        const nextQuestion = getRandomMultipleChoiceQuestion(usedQuestionIds);
        if (nextQuestion) {
          setUsedQuestionIds(ids => [...ids, nextQuestion.id]);
        }
        setAnswers([]);
        
        return {
          ...prev,
          currentQuestion: nextQuestion,
          capitalBattleRound: prev.capitalBattleRound + 1,
        };
      }
      
      // Transfer territory
      const newTerritories = [...prev.territories];
      const newPlayers = [...prev.players];
      const territory = newTerritories.find(t => t.id === targetTerritoryId)!;
      const defender = newPlayers.find(p => p.id === defendingPlayerId)!;
      const attacker = newPlayers.find(p => p.id === attackingPlayerId)!;
      
      territory.ownerId = attackingPlayerId;
      defender.territories = defender.territories.filter(id => id !== targetTerritoryId);
      attacker.territories.push(targetTerritoryId);
      
      if (isCapitalBattle) {
        defender.isEliminated = true;
        territory.isCapital = false;
        
        defender.territories.forEach(tId => {
          const t = newTerritories.find(t => t.id === tId);
          if (t) {
            t.ownerId = attackingPlayerId;
            attacker.territories.push(tId);
          }
        });
        defender.territories = [];
      }
      
      const activePlayers = newPlayers.filter(p => !p.isEliminated);
      if (activePlayers.length === 1) {
        return {
          ...prev,
          territories: newTerritories,
          players: newPlayers,
          phase: 'game_over',
          winner: activePlayers[0],
          currentQuestion: null,
        };
      }
      
      const nextQuestion = getRandomMultipleChoiceQuestion(usedQuestionIds);
      if (nextQuestion) {
        setUsedQuestionIds(ids => [...ids, nextQuestion.id]);
      }
      setAnswers([]);
      
      const currentIndex = activePlayers.findIndex(p => p.id === prev.currentTurnPlayerId);
      const nextPlayer = activePlayers[(currentIndex + 1) % activePlayers.length];
      
      return {
        ...prev,
        territories: newTerritories,
        players: newPlayers,
        phase: 'war',
        currentQuestion: nextQuestion,
        currentTurnPlayerId: nextPlayer.id,
        attackingPlayerId: null,
        defendingPlayerId: null,
        targetTerritoryId: null,
        capitalBattleRound: 0,
      };
    });
  };

  // Select target for attack
  const selectAttackTarget = useCallback((territoryId: string) => {
    const territory = gameState.territories.find(t => t.id === territoryId);
    if (!territory || !territory.ownerId || territory.ownerId === gameState.currentTurnPlayerId) {
      return;
    }
    
    const isCapital = territory.isCapital;
    
    setGameState(prev => ({
      ...prev,
      phase: isCapital ? 'capital_battle' : 'war',
      attackingPlayerId: prev.currentTurnPlayerId,
      defendingPlayerId: territory.ownerId,
      targetTerritoryId: territoryId,
      capitalBattleRound: isCapital ? 1 : 0,
    }));
  }, [gameState.territories, gameState.currentTurnPlayerId]);

  // Get attackable territories
  const getAttackableTerritories = useCallback(() => {
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurnPlayerId);
    if (!currentPlayer) return [];
    
    const playerTerritoryIds = new Set(currentPlayer.territories);
    const attackable: string[] = [];
    
    gameState.territories.forEach(territory => {
      if (territory.ownerId && territory.ownerId !== currentPlayer.id) {
        const hasAdjacentTerritory = territory.neighbors.some(nId => playerTerritoryIds.has(nId));
        if (hasAdjacentTerritory) {
          attackable.push(territory.id);
        }
      }
    });
    
    return attackable;
  }, [gameState.players, gameState.territories, gameState.currentTurnPlayerId]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState({
      phase: 'lobby',
      players: [],
      territories: initialTerritories.map(t => ({ ...t, ownerId: null, isCapital: false })),
      currentQuestion: null,
      currentTurnPlayerId: null,
      attackingPlayerId: null,
      defendingPlayerId: null,
      targetTerritoryId: null,
      roundNumber: 0,
      capitalBattleRound: 0,
      winner: null,
      currentAnimation: null,
    });
    setUsedQuestionIds([]);
    setAnswers([]);
  }, []);

  return {
    gameState,
    startGame,
    submitAnswer,
    selectAttackTarget,
    getAttackableTerritories,
    resetGame,
    neutralTerritories,
    answers,
  };
}
