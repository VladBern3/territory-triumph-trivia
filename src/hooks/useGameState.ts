import { useState, useCallback, useMemo } from 'react';
import { GameState, Player, Territory, Answer, Question } from '@/types/game';
import { initialTerritories, getMaximallyDistantTerritories } from '@/data/territories';
import { getRandomNumericQuestion, getRandomMultipleChoiceQuestion } from '@/data/questions';

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
  });

  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Get unowned territories
  const neutralTerritories = useMemo(() => 
    gameState.territories.filter(t => t.ownerId === null),
    [gameState.territories]
  );

  // Initialize game with players - auto-assign starting territories maximally apart
  const startGame = useCallback((playerData: Omit<Player, 'territories' | 'capitalId' | 'isEliminated' | 'score'>[]) => {
    // Get starting territories that are maximally far apart
    const startingTerritoryIds = getMaximallyDistantTerritories(playerData.length);
    
    // Create a fresh copy of territories
    const newTerritories = initialTerritories.map(t => ({ ...t, ownerId: null, isCapital: false }));
    
    // Create players with their starting territories
    const players: Player[] = playerData.map((p, index) => {
      const startingTerritoryId = startingTerritoryIds[index];
      const territory = newTerritories.find(t => t.id === startingTerritoryId);
      
      if (territory) {
        territory.ownerId = p.id;
        territory.isCapital = true;
      }
      
      return {
        ...p,
        territories: startingTerritoryId ? [startingTerritoryId] : [],
        capitalId: startingTerritoryId || null,
        isEliminated: false,
        score: 0,
      };
    });

    const firstQuestion = getRandomNumericQuestion([]);
    
    setGameState(prev => ({
      ...prev,
      phase: 'settlement',
      players,
      territories: newTerritories,
      currentQuestion: firstQuestion,
      currentTurnPlayerId: players[0].id,
      roundNumber: 1,
    }));
    
    if (firstQuestion) {
      setUsedQuestionIds([firstQuestion.id]);
    }
    setAnswers([]);
  }, []);

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
    const { currentQuestion, phase, players, territories } = gameState;
    
    if (!currentQuestion) return;
    
    if (phase === 'settlement') {
      processSettlementAnswers(submittedAnswers, currentQuestion);
    } else if (phase === 'war' || phase === 'capital_battle') {
      processWarAnswers(submittedAnswers, currentQuestion);
    }
  }, [gameState]);

  const processSettlementAnswers = (submittedAnswers: Answer[], question: Question) => {
    const correctAnswer = Number(question.correctAnswer);
    
    // Sort by distance to correct answer, then by timestamp
    const sorted = [...submittedAnswers].sort((a, b) => {
      const distA = Math.abs(Number(a.answer) - correctAnswer);
      const distB = Math.abs(Number(b.answer) - correctAnswer);
      if (distA !== distB) return distA - distB;
      return a.timestamp - b.timestamp;
    });

    setGameState(prev => {
      const newTerritories = [...prev.territories];
      const newPlayers = [...prev.players];
      
      // Get available neutral territories
      const available = newTerritories.filter(t => t.ownerId === null);
      
      // First place gets 2 territories
      if (sorted[0] && available.length > 0) {
        const firstPlayer = newPlayers.find(p => p.id === sorted[0].playerId)!;
        const territory1 = available[0];
        territory1.ownerId = firstPlayer.id;
        firstPlayer.territories.push(territory1.id);
        
        // Set as capital if first territory
        if (firstPlayer.territories.length === 1) {
          territory1.isCapital = true;
          firstPlayer.capitalId = territory1.id;
        }
        
        if (available.length > 1) {
          const territory2 = available[1];
          territory2.ownerId = firstPlayer.id;
          firstPlayer.territories.push(territory2.id);
        }
      }
      
      // Second place gets 1 territory
      const remainingAvailable = newTerritories.filter(t => t.ownerId === null);
      if (sorted[1] && remainingAvailable.length > 0) {
        const secondPlayer = newPlayers.find(p => p.id === sorted[1].playerId)!;
        const territory = remainingAvailable[0];
        territory.ownerId = secondPlayer.id;
        secondPlayer.territories.push(territory.id);
        
        if (secondPlayer.territories.length === 1) {
          territory.isCapital = true;
          secondPlayer.capitalId = territory.id;
        }
      }
      
      // Check if settlement phase is over
      const stillNeutral = newTerritories.filter(t => t.ownerId === null);
      const newPhase = stillNeutral.length === 0 ? 'war' : 'settlement';
      
      // Get next question
      const nextQuestion = newPhase === 'war' 
        ? getRandomMultipleChoiceQuestion(usedQuestionIds)
        : getRandomNumericQuestion(usedQuestionIds);
      
      if (nextQuestion) {
        setUsedQuestionIds(prev => [...prev, nextQuestion.id]);
      }
      
      setAnswers([]);
      
      return {
        ...prev,
        territories: newTerritories,
        players: newPlayers,
        phase: newPhase,
        currentQuestion: nextQuestion,
        roundNumber: prev.roundNumber + 1,
        currentTurnPlayerId: newPlayers[prev.roundNumber % newPlayers.length].id,
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
    
    // Determine winner: correct answer wins, if both correct, faster wins (defender has slight advantage)
    let attackerWins = false;
    
    if (attackerCorrect && !defenderCorrect) {
      attackerWins = true;
    } else if (attackerCorrect && defenderCorrect) {
      // Defender gets 500ms advantage
      attackerWins = attackerAnswer.timestamp < defenderAnswer.timestamp - 500;
    }
    
    setGameState(prev => {
      if (!attackerWins) {
        // Attack failed, move to next turn
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
      
      // Attack succeeded!
      const newTerritories = [...prev.territories];
      const newPlayers = [...prev.players];
      const targetTerritory = newTerritories.find(t => t.id === targetTerritoryId)!;
      const defender = newPlayers.find(p => p.id === defendingPlayerId)!;
      const attacker = newPlayers.find(p => p.id === attackingPlayerId)!;
      
      // Check if this was a capital battle
      const isCapitalBattle = targetTerritory.isCapital;
      
      if (isCapitalBattle && phase === 'capital_battle' && prev.capitalBattleRound < 3) {
        // Need to win 3 rounds for capital
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
      targetTerritory.ownerId = attackingPlayerId;
      defender.territories = defender.territories.filter(id => id !== targetTerritoryId);
      attacker.territories.push(targetTerritoryId);
      
      // Check if defender is eliminated (lost capital)
      if (isCapitalBattle) {
        defender.isEliminated = true;
        targetTerritory.isCapital = false;
        
        // Transfer all defender's remaining territories
        defender.territories.forEach(tId => {
          const t = newTerritories.find(t => t.id === tId);
          if (t) {
            t.ownerId = attackingPlayerId;
            attacker.territories.push(tId);
          }
        });
        defender.territories = [];
      }
      
      // Check for game over
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
      
      // Next turn
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

  // Get attackable territories for current player
  const getAttackableTerritories = useCallback(() => {
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurnPlayerId);
    if (!currentPlayer) return [];
    
    const playerTerritoryIds = new Set(currentPlayer.territories);
    const attackable: string[] = [];
    
    gameState.territories.forEach(territory => {
      if (territory.ownerId && territory.ownerId !== currentPlayer.id) {
        // Check if any neighbor is owned by current player
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
