import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, Player, Territory, Question, TerritoryAnimation, Answer } from '@/types/game';
import { initialTerritories } from '@/data/territories';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Json } from '@/integrations/supabase/types';

// Helper to safely cast JSON to typed arrays
const parseJsonArray = <T,>(json: Json | null | undefined, fallback: T[]): T[] => {
  if (Array.isArray(json)) return json as unknown as T[];
  return fallback;
};

const parseJsonObject = <T,>(json: Json | null | undefined): T | null => {
  if (json && typeof json === 'object' && !Array.isArray(json)) return json as unknown as T;
  if (json === null || json === undefined) return null;
  return null;
};

// Database row type with Json fields
interface DbGameSession {
  id: string;
  code: string;
  host_player_id: string;
  map_state: Json;
  players: Json;
  phase: string;
  current_turn: string | null;
  current_question: Json;
  round_number: number;
  attacking_player: string | null;
  defending_player: string | null;
  target_territory: string | null;
  capital_battle_round: number;
  answers: Json;
  current_animation: Json;
  winner: Json;
}

export function useMultiplayer() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Generate a random 6-character code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  // Convert DB session to GameState
  const updateGameStateFromSession = useCallback((session: DbGameSession) => {
    setGameState({
      phase: session.phase as GameState['phase'],
      players: parseJsonArray<Player>(session.players, []),
      territories: parseJsonArray<Territory>(session.map_state, initialTerritories),
      currentQuestion: parseJsonObject<Question>(session.current_question),
      currentTurnPlayerId: session.current_turn,
      attackingPlayerId: session.attacking_player,
      defendingPlayerId: session.defending_player,
      targetTerritoryId: session.target_territory,
      roundNumber: session.round_number || 0,
      capitalBattleRound: session.capital_battle_round || 0,
      winner: parseJsonObject<Player>(session.winner),
      currentAnimation: parseJsonObject<TerritoryAnimation>(session.current_animation),
      settlementSelections: [],
      isSelectingSettlementTerritory: false,
    });
  }, []);

  // Subscribe to realtime updates
  const subscribeToSession = useCallback((id: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`game_session_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            updateGameStateFromSession(payload.new as DbGameSession);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  }, [updateGameStateFromSession]);

  // Create a new game session
  const createSession = async (hostPlayer: Omit<Player, 'territories' | 'capitalId' | 'isEliminated' | 'score'>) => {
    setError(null);
    const code = generateCode();
    const playerId = hostPlayer.id;
    
    const newPlayer: Player = {
      ...hostPlayer,
      territories: [],
      capitalId: null,
      isEliminated: false,
      score: 0,
    };

    const insertData = {
      code,
      host_player_id: playerId,
      players: [newPlayer] as unknown as Json,
      map_state: initialTerritories.map(t => ({ ...t, ownerId: null, isCapital: false })) as unknown as Json,
      phase: 'waiting',
      round_number: 0,
      capital_battle_round: 0,
      answers: [] as unknown as Json,
    };

    const { data, error: insertError } = await supabase
      .from('game_sessions')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      setError('Не удалось создать сессию: ' + insertError.message);
      return null;
    }

    setSessionId(data.id);
    setSessionCode(code);
    setLocalPlayerId(playerId);
    setIsHost(true);
    updateGameStateFromSession(data as DbGameSession);
    subscribeToSession(data.id);

    return code;
  };

  // Get next available color based on existing players
  const getNextAvailableColor = (existingPlayers: Player[]): Player['color'] => {
    const usedColors = existingPlayers.map(p => p.color);
    const allColors: Player['color'][] = ['red', 'blue', 'green', 'yellow'];
    return allColors.find(c => !usedColors.includes(c)) || 'red';
  };

  // Join an existing session
  const joinSession = async (code: string, player: Omit<Player, 'territories' | 'capitalId' | 'isEliminated' | 'score'>) => {
    setError(null);
    
    const { data: session, error: fetchError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (fetchError || !session) {
      setError('Сессия не найдена');
      return false;
    }

    if (session.phase !== 'waiting') {
      setError('Игра уже началась');
      return false;
    }

    const existingPlayers = parseJsonArray<Player>(session.players, []);
    if (existingPlayers.length >= 4) {
      setError('Сессия заполнена');
      return false;
    }

    // Check if player already exists
    if (existingPlayers.some(p => p.id === player.id)) {
      setSessionId(session.id);
      setSessionCode(code.toUpperCase());
      setLocalPlayerId(player.id);
      setIsHost(session.host_player_id === player.id);
      updateGameStateFromSession(session as DbGameSession);
      subscribeToSession(session.id);
      return true;
    }

    // Assign unique color based on existing players
    const availableColor = getNextAvailableColor(existingPlayers);

    const newPlayer: Player = {
      ...player,
      color: availableColor, // Override with available color
      territories: [],
      capitalId: null,
      isEliminated: false,
      score: 0,
    };

    const updatedPlayers = [...existingPlayers, newPlayer];

    const { data: updatedSession, error: updateError } = await supabase
      .from('game_sessions')
      .update({ players: updatedPlayers as unknown as Json })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError) {
      setError('Не удалось присоединиться: ' + updateError.message);
      return false;
    }

    setSessionId(session.id);
    setSessionCode(code.toUpperCase());
    setLocalPlayerId(player.id);
    setIsHost(false);
    
    // Update game state with fresh data BEFORE subscribing
    if (updatedSession) {
      updateGameStateFromSession(updatedSession as DbGameSession);
    }
    
    subscribeToSession(session.id);

    return true;
  };

  // Update session state
  const updateSession = async (updates: Record<string, unknown>) => {
    if (!sessionId) return;

    const { error: updateError } = await supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session:', updateError);
    }
  };

  // Sync full game state to session
  const syncGameState = async (state: GameState) => {
    if (!sessionId) return;

    await updateSession({
      map_state: state.territories as unknown as Json,
      players: state.players as unknown as Json,
      phase: state.phase,
      current_turn: state.currentTurnPlayerId,
      current_question: state.currentQuestion as unknown as Json,
      round_number: state.roundNumber,
      attacking_player: state.attackingPlayerId,
      defending_player: state.defendingPlayerId,
      target_territory: state.targetTerritoryId,
      capital_battle_round: state.capitalBattleRound,
      current_animation: state.currentAnimation as unknown as Json,
      winner: state.winner as unknown as Json,
    });
  };

  // Submit answer (any player)
  const submitAnswerToSession = async (answer: Answer) => {
    if (!sessionId) return;

    const { data: session } = await supabase
      .from('game_sessions')
      .select('answers')
      .eq('id', sessionId)
      .single();

    if (!session) return;

    const currentAnswers = parseJsonArray<Answer>(session.answers, []);
    const updatedAnswers = [...currentAnswers, answer];

    await updateSession({ answers: updatedAnswers as unknown as Json });
  };

  // Clear answers
  const clearAnswers = async () => {
    if (!sessionId) return;
    await updateSession({ answers: [] as unknown as Json });
  };

  // Leave session
  const leaveSession = async () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    setSessionId(null);
    setSessionCode(null);
    setLocalPlayerId(null);
    setIsHost(false);
    setIsConnected(false);
    setGameState({
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
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Check if it's the local player's turn
  const isMyTurn = gameState.currentTurnPlayerId === localPlayerId;
  
  // Check if local player is in a battle
  const isInBattle = 
    gameState.attackingPlayerId === localPlayerId || 
    gameState.defendingPlayerId === localPlayerId;

  return {
    // State
    sessionId,
    sessionCode,
    localPlayerId,
    isHost,
    isConnected,
    error,
    gameState,
    isMyTurn,
    isInBattle,
    
    // Actions
    createSession,
    joinSession,
    updateSession,
    syncGameState,
    submitAnswerToSession,
    clearAnswers,
    leaveSession,
    setLocalPlayerId,
  };
}
