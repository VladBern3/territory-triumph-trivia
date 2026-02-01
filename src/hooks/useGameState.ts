import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GameState, Player, Territory, Answer, Question, TerritoryAnimation } from '@/types/game';
import { initialTerritories, getMaximallyDistantTerritories } from '@/data/territories';

const ANIMATION_DURATION = 800; // ms for capture animation
const CAPITAL_POINTS = 1000;
const TERRITORY_POINTS = 200;

interface QuestionProviders {
  getRandomNumericQuestion: () => Question | null;
  getRandomChoiceQuestion: () => Question | null;
}

export function useGameState(questionProviders?: QuestionProviders) {
  // Use refs to always get the latest function from providers
  const questionProvidersRef = useRef(questionProviders);
  questionProvidersRef.current = questionProviders;
  
  const getNumericQuestion = useCallback(() => {
    return questionProvidersRef.current?.getRandomNumericQuestion() || null;
  }, []);
  
  const getChoiceQuestion = useCallback(() => {
    return questionProvidersRef.current?.getRandomChoiceQuestion() || null;
  }, []);
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
          const pointsToAdd = isCapital ? CAPITAL_POINTS : TERRITORY_POINTS;
          const newPlayers = prev.players.map(p => 
            p.id === playerId 
              ? { 
                  ...p, 
                  territories: [...p.territories, territoryId],
                  capitalId: isCapital ? territoryId : p.capitalId,
                  score: p.score + pointsToAdd,
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
    const firstQuestion = getNumericQuestion();
    
    setGameState(prev => ({
      ...prev,
      phase: 'settlement',
      currentQuestion: firstQuestion,
      currentTurnPlayerId: prev.players[0].id,
      roundNumber: 1,
    }));
    
  }, [animateCapture, getNumericQuestion]);

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

  // Handle answer submission - use functional update to get latest state
  const submitAnswer = useCallback((answer: Answer) => {
    console.log('submitAnswer called:', answer);
    
    setAnswers(prev => {
      // Avoid duplicate answers from same player
      if (prev.some(a => a.playerId === answer.playerId)) {
        console.log('Duplicate answer ignored');
        return prev;
      }
      
      const newAnswers = [...prev, answer];
      console.log('Current answers count:', newAnswers.length);
      
      return newAnswers;
    });
  }, []);

  // Effect to process answers when all players have responded
  useEffect(() => {
    const { phase, currentQuestion, players } = gameState;
    
    if (!currentQuestion || answers.length === 0) return;
    
    const activePlayers = players.filter(p => !p.isEliminated);
    console.log('Checking answers:', answers.length, 'vs active players:', activePlayers.length);
    
    if (phase === 'settlement' && answers.length >= activePlayers.length) {
      console.log('Processing settlement answers...');
      processSettlementAnswers(answers, currentQuestion);
    } else if ((phase === 'war' || phase === 'capital_battle') && answers.length >= 2) {
      console.log('Processing war answers...');
      processWarAnswers(answers, currentQuestion);
    }
  }, [answers, gameState.phase, gameState.currentQuestion, gameState.players]);

  // Process settlement phase answers
  const processSettlementAnswers = useCallback(async (submittedAnswers: Answer[], question: Question) => {
    const correctAnswer = Number(question.correctAnswer);
    console.log('Correct answer:', correctAnswer);
    
    // Sort by distance to correct answer, then by timestamp (closer = better)
    const sorted = [...submittedAnswers].sort((a, b) => {
      const distA = Math.abs(Number(a.answer) - correctAnswer);
      const distB = Math.abs(Number(b.answer) - correctAnswer);
      if (distA !== distB) return distA - distB;
      return a.timestamp - b.timestamp;
    });

    console.log('Sorted answers:', sorted.map(s => ({ playerId: s.playerId, answer: s.answer, dist: Math.abs(Number(s.answer) - correctAnswer) })));

    // Clear answers immediately to prevent reprocessing
    setAnswers([]);

    // Get current neutral territories from state
    let currentTerritories = [...gameState.territories];
    
    // First place gets 2 territories
    if (sorted[0]) {
      let available = currentTerritories.filter(t => t.ownerId === null);
      console.log('First place:', sorted[0].playerId, 'available territories:', available.length);
      
      if (available.length > 0) {
        await animateCapture(available[0].id, sorted[0].playerId, false);
        currentTerritories = currentTerritories.map(t => 
          t.id === available[0].id ? { ...t, ownerId: sorted[0].playerId } : t
        );
      }
      
      // Second territory for first place
      available = currentTerritories.filter(t => t.ownerId === null);
      if (available.length > 0) {
        await animateCapture(available[0].id, sorted[0].playerId, false);
        currentTerritories = currentTerritories.map(t => 
          t.id === available[0].id ? { ...t, ownerId: sorted[0].playerId } : t
        );
      }
    }
    
    // Second place gets 1 territory
    if (sorted[1]) {
      const available = currentTerritories.filter(t => t.ownerId === null);
      console.log('Second place:', sorted[1].playerId, 'available territories:', available.length);
      
      if (available.length > 0) {
        await animateCapture(available[0].id, sorted[1].playerId, false);
        currentTerritories = currentTerritories.map(t => 
          t.id === available[0].id ? { ...t, ownerId: sorted[1].playerId } : t
        );
      }
    }
    
    // Third place gets nothing
    console.log('Third place gets nothing');
    
    // After all animations, move to next round
    setGameState(prev => {
      const stillNeutral = prev.territories.filter(t => t.ownerId === null);
      const newRound = prev.roundNumber + 1;
      
      // Settlement lasts 5 rounds, then switch to war
      const newPhase = newRound > 5 || stillNeutral.length <= 1 ? 'war' : 'settlement';
      
      console.log('Settlement round complete. Neutral left:', stillNeutral.length, 'New phase:', newPhase, 'Round:', newRound);
      
      // Get next question
      const nextQuestion = newPhase === 'war' 
        ? getChoiceQuestion()
        : getNumericQuestion();
      
      const activePlayers = prev.players.filter(p => !p.isEliminated);
      const nextPlayer = activePlayers[newRound % activePlayers.length];
      
      return {
        ...prev,
        phase: newPhase,
        currentQuestion: nextQuestion,
        roundNumber: newRound,
        currentTurnPlayerId: nextPlayer?.id || null,
        attackingPlayerId: null,
        defendingPlayerId: null,
        targetTerritoryId: null,
      };
    });
  }, [animateCapture, gameState.territories, getChoiceQuestion, getNumericQuestion]);

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
        const nextQuestion = getChoiceQuestion();
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
        const nextQuestion = getChoiceQuestion();
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
      
      const nextQuestion = getChoiceQuestion();
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
