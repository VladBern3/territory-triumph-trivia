import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GameState, Player, Territory, Answer, Question, TerritoryAnimation } from '@/types/game';
import { initialTerritories } from '@/data/territories';

const ANIMATION_DURATION = 2000; // ms for capture animation (2 seconds)
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
    settlementSelections: [],
    isSelectingSettlementTerritory: false,
  });

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isShowingResults, setIsShowingResults] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const animationQueueRef = useRef<{ territoryId: string; playerId: string; isCapital: boolean }[]>([]);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameStateRef = useRef(gameState); // Ref to track latest gameState
  const answersRef = useRef(answers); // Ref to track latest answers
  const selectionInProgressRef = useRef(false); // Prevent duplicate selections
  const lastGeneratedQuestionIdRef = useRef<string | null>(null); // Track last question to prevent duplicates
  const QUESTION_TIME_LIMIT = 10; // seconds

  // Keep refs in sync with state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

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
    // Round timer will be started by the effect that watches currentQuestion
    
  }, [animateCapture, getNumericQuestion]);

  // Start a timer that force-completes the question when time expires
  const startQuestionTimer = useCallback(() => {
    // Clear any existing timer
    if (roundTimerRef.current) {
      clearTimeout(roundTimerRef.current);
      roundTimerRef.current = null;
    }
    
    roundTimerRef.current = setTimeout(() => {
      console.log('Question timer expired, force completing...');
      
      // Use refs to get latest state
      const { phase, currentQuestion, players, attackingPlayerId, defendingPlayerId } = gameStateRef.current;
      const currentAnswers = answersRef.current;
      
      if (!currentQuestion) return;
      
      const activePlayers = players.filter(p => !p.isEliminated);
      let expectedPlayers: string[] = [];
      
      if (phase === 'settlement') {
        expectedPlayers = activePlayers.map(p => p.id);
      } else if (phase === 'war' || phase === 'capital_battle') {
        if (attackingPlayerId) expectedPlayers.push(attackingPlayerId);
        if (defendingPlayerId) expectedPlayers.push(defendingPlayerId);
      }
      
      const answeredPlayerIds = new Set(currentAnswers.map(a => a.playerId));
      const missingAnswers: Answer[] = expectedPlayers
        .filter(id => !answeredPlayerIds.has(id))
        .map(playerId => ({
          playerId,
          answer: null,
          timestamp: Date.now(),
        }));
      
      if (missingAnswers.length > 0) {
        console.log('Force adding missing answers for:', missingAnswers.map(a => a.playerId));
        setAnswers(prev => [...prev, ...missingAnswers]);
      }
    }, (QUESTION_TIME_LIMIT + 0.5) * 1000); // +0.5 second buffer after UI timer
  }, []);

  // Get random non-neighboring capitals for all players
  const getRandomNonNeighboringCapitals = useCallback((playerCount: number, territories: Territory[]): string[] => {
    const selectedIds: string[] = [];
    const availableTerritories = [...territories];
    
    // Shuffle territories for randomness
    for (let i = availableTerritories.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableTerritories[i], availableTerritories[j]] = [availableTerritories[j], availableTerritories[i]];
    }
    
    for (let i = 0; i < playerCount; i++) {
      // Find a territory that is not a neighbor of any already selected capital
      const validTerritory = availableTerritories.find(t => {
        // Check if this territory is a neighbor of any selected capital
        const isNeighborOfSelected = selectedIds.some(selectedId => 
          t.neighbors.includes(selectedId)
        );
        // Also check if any selected capital is a neighbor of this territory
        const hasSelectedNeighbor = selectedIds.some(selectedId => {
          const selectedTerritory = territories.find(st => st.id === selectedId);
          return selectedTerritory?.neighbors.includes(t.id);
        });
        
        return !isNeighborOfSelected && !hasSelectedNeighbor && !selectedIds.includes(t.id);
      });
      
      if (validTerritory) {
        selectedIds.push(validTerritory.id);
        // Remove from available list
        const index = availableTerritories.findIndex(t => t.id === validTerritory.id);
        if (index > -1) availableTerritories.splice(index, 1);
      } else {
        // Fallback: if no valid territory found, just pick any remaining
        const fallbackTerritory = availableTerritories.find(t => !selectedIds.includes(t.id));
        if (fallbackTerritory) {
          selectedIds.push(fallbackTerritory.id);
          const index = availableTerritories.findIndex(t => t.id === fallbackTerritory.id);
          if (index > -1) availableTerritories.splice(index, 1);
        }
      }
    }
    
    return selectedIds;
  }, []);

  // Initialize game with players - auto-assign starting territories randomly (non-neighboring)
  const startGame = useCallback((playerData: Omit<Player, 'territories' | 'capitalId' | 'isEliminated' | 'score'>[]) => {
    // Create a fresh copy of territories - all neutral at start
    const newTerritories = initialTerritories.map(t => ({ ...t, ownerId: null, isCapital: false }));
    
    // Get random starting territories that don't neighbor each other
    const startingTerritoryIds = getRandomNonNeighboringCapitals(playerData.length, newTerritories);
    
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
  }, [processInitialAssignments, getRandomNonNeighboringCapitals]);

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

  // Effect to start question timer when question changes
  useEffect(() => {
    if (gameState.currentQuestion && !isShowingResults) {
      setQuestionStartTime(Date.now());
      startQuestionTimer();
    }
    
    return () => {
      if (roundTimerRef.current) {
        clearTimeout(roundTimerRef.current);
        roundTimerRef.current = null;
      }
    };
  }, [gameState.currentQuestion?.id, isShowingResults, startQuestionTimer]);

  // Effect to process answers when all players have responded
  useEffect(() => {
    const { phase, currentQuestion, players } = gameState;
    
    if (!currentQuestion || answers.length === 0 || isShowingResults) return;
    
    const activePlayers = players.filter(p => !p.isEliminated);
    console.log('Checking answers:', answers.length, 'vs active players:', activePlayers.length);
    
    if (phase === 'settlement' && answers.length >= activePlayers.length) {
      console.log('All answers collected, showing results...');
      // Clear round timer since all answered
      if (roundTimerRef.current) {
        clearTimeout(roundTimerRef.current);
        roundTimerRef.current = null;
      }
      setIsShowingResults(true);
      
      // Show results for 3 seconds, then process
      setTimeout(() => {
        console.log('Processing settlement answers...');
        processSettlementAnswers([...answers], currentQuestion);
      }, 3000);
    } else if ((phase === 'war' || phase === 'capital_battle') && answers.length >= 2) {
      console.log('Processing war answers...');
      // Clear round timer
      if (roundTimerRef.current) {
        clearTimeout(roundTimerRef.current);
        roundTimerRef.current = null;
      }
      processWarAnswers(answers, currentQuestion);
    }
  }, [answers, gameState.phase, gameState.currentQuestion, gameState.players, isShowingResults]);

  // Process settlement phase answers - prepare for territory selection
  const processSettlementAnswers = useCallback((submittedAnswers: Answer[], question: Question) => {
    const correctAnswer = Number(question.correctAnswer);
    console.log('Correct answer:', correctAnswer);
    
    // Sort by distance to correct answer, then by timestamp (closer = better)
    // null answers go to the end
    const sorted = [...submittedAnswers].sort((a, b) => {
      // null answers go last
      if (a.answer === null && b.answer !== null) return 1;
      if (a.answer !== null && b.answer === null) return -1;
      if (a.answer === null && b.answer === null) return a.timestamp - b.timestamp;
      
      const distA = Math.abs(Number(a.answer) - correctAnswer);
      const distB = Math.abs(Number(b.answer) - correctAnswer);
      if (distA !== distB) return distA - distB;
      return a.timestamp - b.timestamp;
    });

    console.log('Sorted answers:', sorted.map(s => ({ playerId: s.playerId, answer: s.answer, dist: Math.abs(Number(s.answer) - correctAnswer) })));

    // Create settlement selections based on ranking
    // 1st place: 2 territories, 2nd place: 1 territory, 3rd+: 0 territories
    const selections: { playerId: string; rank: number; territoriesRemaining: number }[] = [];
    
    if (sorted[0]) {
      selections.push({ playerId: sorted[0].playerId, rank: 1, territoriesRemaining: 2 });
    }
    if (sorted[1]) {
      selections.push({ playerId: sorted[1].playerId, rank: 2, territoriesRemaining: 1 });
    }
    // 3rd place gets nothing, so we don't add them

    // Clear answers and reset showing results flag
    setAnswers([]);
    setIsShowingResults(false);

    // Transition to territory selection mode
    setGameState(prev => {
      // Find the first player who needs to select
      const firstSelector = selections.find(s => s.territoriesRemaining > 0);
      
      return {
        ...prev,
        currentQuestion: null, // Hide the question modal
        settlementSelections: selections,
        isSelectingSettlementTerritory: true,
        currentTurnPlayerId: firstSelector?.playerId || null,
      };
    });
  }, []);

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
        // Attack failed - next player's turn, no question until they select target
        setAnswers([]);
        
        const activePlayers = prev.players.filter(p => !p.isEliminated);
        const currentIndex = activePlayers.findIndex(p => p.id === prev.currentTurnPlayerId);
        const nextPlayer = activePlayers[(currentIndex + 1) % activePlayers.length];
        
        return {
          ...prev,
          currentQuestion: null, // No question until target selected
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
      
      setAnswers([]);
      
      const currentIndex = activePlayers.findIndex(p => p.id === prev.currentTurnPlayerId);
      const nextPlayer = activePlayers[(currentIndex + 1) % activePlayers.length];
      
      return {
        ...prev,
        territories: newTerritories,
        players: newPlayers,
        phase: 'war',
        currentQuestion: null, // No question until target selected
        currentTurnPlayerId: nextPlayer.id,
        attackingPlayerId: null,
        defendingPlayerId: null,
        targetTerritoryId: null,
        capitalBattleRound: 0,
      };
    });
  };

  // Select territory during settlement phase
  const selectSettlementTerritory = useCallback(async (territoryId: string) => {
    // Prevent duplicate calls during animation
    if (selectionInProgressRef.current) {
      console.log('Selection already in progress, ignoring');
      return;
    }
    
    const territory = gameState.territories.find(t => t.id === territoryId);
    if (!territory || territory.ownerId !== null) {
      return; // Can only select neutral territories
    }

    const currentSelector = gameState.settlementSelections.find(
      s => s.playerId === gameState.currentTurnPlayerId && s.territoriesRemaining > 0
    );
    
    if (!currentSelector) return;

    // VALIDATE: Territory must be adjacent to player's existing territories
    // FALLBACK PRIORITY:
    // 1. Adjacent neutral territories
    // 2. Any neutral NOT adjacent to other players' capitals
    // 3. Any neutral (including near capitals - last resort)
    const currentPlayer = gameState.players.find(p => p.id === currentSelector.playerId);
    if (!currentPlayer) return;
    
    const playerTerritoryIds = new Set(currentPlayer.territories);
    const isAdjacent = territory.neighbors.some(nId => playerTerritoryIds.has(nId));
    
    // Check if there are ANY adjacent neutral territories
    const hasAnyAdjacentNeutral = gameState.territories.some(t => 
      t.ownerId === null && t.neighbors.some(nId => playerTerritoryIds.has(nId))
    );
    
    // If there are adjacent neutral territories, only allow adjacent selection
    if (hasAnyAdjacentNeutral) {
      if (!isAdjacent) {
        console.log('Territory is not adjacent to player territories, ignoring selection');
        return;
      }
    } else {
      // No adjacent neutral territories - use fallback logic
      // Get all other players' capital IDs
      const otherCapitalIds = new Set(
        gameState.players
          .filter(p => p.id !== currentPlayer.id && p.capitalId)
          .map(p => p.capitalId!)
      );
      
      // Check if this territory is adjacent to another player's capital
      const isAdjacentToOtherCapital = territory.neighbors.some(nId => otherCapitalIds.has(nId));
      
      // Check if there are any neutral territories NOT adjacent to other capitals
      const hasNeutralNotNearCapitals = gameState.territories.some(t => 
        t.ownerId === null && !t.neighbors.some(nId => otherCapitalIds.has(nId))
      );
      
      // If there are neutral territories not near capitals, don't allow selecting ones near capitals
      if (isAdjacentToOtherCapital && hasNeutralNotNearCapitals) {
        console.log('Territory is adjacent to another player capital, and safer options exist');
        return;
      }
      
      console.log('No adjacent neutral territories available, using fallback selection');
    }

    // Lock to prevent duplicate calls
    selectionInProgressRef.current = true;

    try {
      // Animate the capture
      await animateCapture(territoryId, currentSelector.playerId, false);

      // Calculate next state BEFORE setGameState to avoid issues with React StrictMode
      const updatedSelections = gameState.settlementSelections.map(s => 
        s.playerId === currentSelector.playerId
          ? { ...s, territoriesRemaining: s.territoriesRemaining - 1 }
          : s
      );

      const nextSelector = updatedSelections.find(s => s.territoriesRemaining > 0);
      
      if (nextSelector) {
        // More selections to make
        setGameState(prev => ({
          ...prev,
          settlementSelections: updatedSelections,
          currentTurnPlayerId: nextSelector.playerId,
        }));
        return;
      }
      
      // All selections done - move to next round
      const stillNeutral = gameState.territories.filter(t => t.ownerId === null && t.id !== territoryId);
      const newRound = gameState.roundNumber + 1;
      
      // Settlement lasts 5 rounds, then switch to war
      const newPhase = newRound > 5 || stillNeutral.length === 0 ? 'war' : 'settlement';
      
      console.log('Settlement round complete. Neutral left:', stillNeutral.length, 'New phase:', newPhase, 'Round:', newRound);
      
      // Get next question BEFORE setGameState - only for settlement phase
      // Also track the question ID to prevent duplicates
      let nextQuestion = newPhase === 'war' ? null : getNumericQuestion();
      
      // If we somehow got the same question as last time, try to get a new one
      if (nextQuestion && nextQuestion.id === lastGeneratedQuestionIdRef.current) {
        console.log('Duplicate question detected, getting new one');
        nextQuestion = getNumericQuestion();
      }
      
      if (nextQuestion) {
        lastGeneratedQuestionIdRef.current = nextQuestion.id;
      }
      
      const activePlayers = gameState.players.filter(p => !p.isEliminated);
      const nextPlayer = activePlayers[newRound % activePlayers.length];
      
      setGameState(prev => ({
        ...prev,
        phase: newPhase,
        currentQuestion: nextQuestion,
        roundNumber: newRound,
        currentTurnPlayerId: nextPlayer?.id || null,
        settlementSelections: [],
        isSelectingSettlementTerritory: false,
      }));
    } finally {
      // Release lock after state update
      selectionInProgressRef.current = false;
    }
  }, [gameState.territories, gameState.settlementSelections, gameState.currentTurnPlayerId, gameState.roundNumber, gameState.players, animateCapture, getNumericQuestion]);

  // Select target for attack
  const selectAttackTarget = useCallback((territoryId: string) => {
    const territory = gameState.territories.find(t => t.id === territoryId);
    if (!territory || !territory.ownerId || territory.ownerId === gameState.currentTurnPlayerId) {
      return;
    }
    
    const isCapital = territory.isCapital;
    
    // Get question for the battle
    const battleQuestion = getChoiceQuestion();
    
    setGameState(prev => ({
      ...prev,
      phase: isCapital ? 'capital_battle' : 'war',
      currentQuestion: battleQuestion,
      attackingPlayerId: prev.currentTurnPlayerId,
      defendingPlayerId: territory.ownerId,
      targetTerritoryId: territoryId,
      capitalBattleRound: isCapital ? 1 : 0,
    }));
  }, [gameState.territories, gameState.currentTurnPlayerId, getChoiceQuestion]);

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

  // Get neighbor territories for settlement (neutral territories adjacent to current player's territories)
  // FALLBACK PRIORITY:
  // 1. Adjacent neutral territories
  // 2. Any neutral NOT adjacent to other players' capitals
  // 3. Any neutral (including near capitals - last resort)
  const getNeighborSettlementTerritories = useCallback(() => {
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurnPlayerId);
    if (!currentPlayer) return [];
    
    const playerTerritoryIds = new Set(currentPlayer.territories);
    const neighborNeutral: string[] = [];
    const allNeutral: string[] = [];
    const neutralNotNearCapitals: string[] = [];
    
    // Get all other players' capital IDs
    const otherCapitalIds = new Set(
      gameState.players
        .filter(p => p.id !== currentPlayer.id && p.capitalId)
        .map(p => p.capitalId!)
    );
    
    gameState.territories.forEach(territory => {
      // Only include neutral territories
      if (territory.ownerId === null) {
        allNeutral.push(territory.id);
        
        // Check if any of its neighbors belong to the current player
        const hasAdjacentTerritory = territory.neighbors.some(nId => playerTerritoryIds.has(nId));
        if (hasAdjacentTerritory) {
          neighborNeutral.push(territory.id);
        }
        
        // Check if NOT adjacent to any other player's capital
        const isAdjacentToOtherCapital = territory.neighbors.some(nId => otherCapitalIds.has(nId));
        if (!isAdjacentToOtherCapital) {
          neutralNotNearCapitals.push(territory.id);
        }
      }
    });
    
    // Priority 1: Adjacent neutral territories
    if (neighborNeutral.length > 0) {
      return neighborNeutral;
    }
    
    // Priority 2: Neutral territories NOT near other capitals
    if (neutralNotNearCapitals.length > 0) {
      console.log('No adjacent neutral, allowing neutral NOT near other capitals');
      return neutralNotNearCapitals;
    }
    
    // Priority 3: Any neutral (including near capitals - last resort)
    if (allNeutral.length > 0) {
      console.log('No safe options, allowing all neutral including near capitals');
      return allNeutral;
    }
    
    return [];
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
      settlementSelections: [],
      isSelectingSettlementTerritory: false,
    });
    setAnswers([]);
  }, []);

  return {
    gameState,
    startGame,
    submitAnswer,
    selectAttackTarget,
    selectSettlementTerritory,
    getAttackableTerritories,
    getNeighborSettlementTerritories,
    resetGame,
    neutralTerritories,
    answers,
    isShowingResults,
    questionStartTime,
  };
}
