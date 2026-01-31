import { GameLobby } from '@/components/game/GameLobby';
import { GameBoard } from '@/components/game/GameBoard';
import { GameOverScreen } from '@/components/game/GameOverScreen';
import { useGameState } from '@/hooks/useGameState';

const Index = () => {
  const {
    gameState,
    startGame,
    submitAnswer,
    selectAttackTarget,
    getAttackableTerritories,
    resetGame,
    answers,
  } = useGameState();

  const { phase, winner } = gameState;

  // Lobby phase
  if (phase === 'lobby') {
    return <GameLobby onStartGame={startGame} />;
  }

  // Game over phase
  if (phase === 'game_over' && winner) {
    return <GameOverScreen winner={winner} onPlayAgain={resetGame} />;
  }

  // Active game phases
  return (
    <GameBoard
      gameState={gameState}
      onSubmitAnswer={submitAnswer}
      onSelectTarget={selectAttackTarget}
      attackableTerritories={getAttackableTerritories()}
      waitingForAnswers={answers.length > 0}
    />
  );
};

export default Index;
