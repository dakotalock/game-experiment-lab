import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './App.css';

interface Target {
  x: number;
  y: number;
  dx: number;
  dy: number;
  id: number;
  color: string;
  rotation: number;
}

type PowerUpType = 'extra-life' | 'time-freeze' | 'double-points' | 'skull' | 'lightning' | 'lava-shield';

interface PowerUp {
  x: number;
  y: number;
  id: number;
  type: PowerUpType;
  isRemoving?: boolean;
  isAnimating?: boolean;
}

const Game: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [targets, setTargets] = useState<Target[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [combo, setCombo] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const audioPlayerRef = useRef<any>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const targetSize: number = 30;
  const gameWidth: number = 600;
  const gameHeight: number = 400;
  const targetSpeed: number = 2;
  const targetSpawnInterval: number = 1500 / 2;
  const powerUpSpawnInterval: number = 5000 / 2;
  const powerUpDuration: number = 5000;
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const targetRotationSpeed: number = 2;

  const getRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleTargetClick = (id: number) => {
    if (gameOver) return;
    setTargets((prevTargets) => prevTargets.filter((target) => target.id !== id));
    setScore((prevScore) => prevScore + (combo > 5 ? 2 : 1));
    setCombo((prevCombo) => prevCombo + 1);
  };

  const handlePowerUpClick = (id: number) => {
    if (gameOver) return;
    const clickedPowerUp = powerUps.find((pu) => pu.id === id);
    if (!clickedPowerUp) return;

    if (clickedPowerUp.type === 'lightning') {
      setTargets([]);
      setScore((prevScore) => prevScore + targets.length);
      setPowerUps((prevPowerUps) => prevPowerUps.map(pu => pu.id === id ? { ...pu, isAnimating: true } : pu));
      setTimeout(() => {
        setPowerUps((prevPowerUps) => prevPowerUps.filter(pu => pu.id !== id));
      }, 500);
    } else {
      // Handle other power-ups
      setPowerUps((prevPowerUps) => prevPowerUps.filter(pu => pu.id !== id));
    }
  };

  const spawnTarget = () => {
    const x = Math.random() * (gameWidth - targetSize);
    const y = Math.random() * (gameHeight - targetSize);
    const dx = (Math.random() - 0.5) * targetSpeed;
    const dy = (Math.random() - 0.5) * targetSpeed;
    const color = getRandomColor();
    const newTarget: Target = {
      x,
      y,
      dx,
      dy,
      id: Date.now() + Math.random(),
      color,
      rotation: 0,
    };
    setTargets((prevTargets) => [...prevTargets, newTarget]);
  };

  const spawnPowerUp = () => {
    const x = Math.random() * (gameWidth - targetSize);
    const y = Math.random() * (gameHeight - targetSize);
    const powerUpTypes: PowerUpType[] = ['extra-life', 'time-freeze', 'double-points', 'skull', 'lightning', 'lava-shield'];
    const type: PowerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const newPowerUp: PowerUp = {
      x,
      y,
      id: Date.now() + Math.random(),
      type,
    };
    setPowerUps((prevPowerUps) => [...prevPowerUps, newPowerUp]);

    setTimeout(() => {
      setPowerUps((prevPowerUps) => prevPowerUps.filter((powerUp) => powerUp.id !== newPowerUp.id));
    }, powerUpDuration);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleGameAreaClick = () => {
    if (gameOver) return;
    setLives((prevLives) => {
      const newLives = prevLives - 1;
      if (newLives <= 0) {
        setGameOver(true);
        setGameStarted(false);
        audioPlayerRef.current?.audio.current?.pause();
      }
      return newLives;
    });
  };

  const startGame = () => {
    setScore(0);
    setLives(difficulty === 'easy' ? 5 : difficulty === 'normal' ? 3 : 1);
    setGameOver(false);
    setTargets([]);
    setPowerUps([]);
    setCombo(0);
    setGameStarted(true);

    if (audioPlayerRef.current) {
      audioPlayerRef.current.audio.current.play();
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setScore(0);
    setLives(5);
    setGameOver(false);
    setTargets([]);
    setPowerUps([]);
    setCombo(0);

    if (audioPlayerRef.current) {
      audioPlayerRef.current.audio.current.pause();
      audioPlayerRef.current.audio.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const movementInterval = setInterval(() => {
        setTargets((prevTargets) => {
          const updatedTargets = prevTargets.map((target) => ({
            ...target,
            x: target.x + target.dx,
            y: target.y + target.dy,
            rotation: (target.rotation + targetRotationSpeed) % 360,
          }));

          const filteredTargets = updatedTargets.filter(
            (target) =>
              target.x > -targetSize &&
              target.x < gameWidth &&
              target.y > -targetSize &&
              target.y < gameHeight
          );

          return filteredTargets;
        });
      }, 20);

      const spawnIntervalId = setInterval(() => {
        if (!gameOver) spawnTarget();
      }, targetSpawnInterval);

      const powerUpIntervalId = setInterval(() => {
        if (!gameOver) spawnPowerUp();
      }, powerUpSpawnInterval);

      return () => {
        clearInterval(movementInterval);
        clearInterval(spawnIntervalId);
        clearInterval(powerUpIntervalId);
      };
    }
  }, [gameStarted, gameOver]);

  return (
    <div className="flex-container">
      <h1 className="text-5xl font-extrabold mb-8 text-white">Gabriel's Game</h1>
      <h2 className="text-xl text-gray-400 mt-4">Created by Dakota Lock for Gabriel</h2>

      <div className="hidden">
        <AudioPlayer
          ref={audioPlayerRef}
          src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
          autoPlay={false}
          loop={true}
          volume={0.5}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>

      <div
        ref={gameAreaRef}
        className="game-area"
        style={{
          width: gameWidth,
          height: gameHeight,
        }}
        onMouseMove={handleMouseMove}
        onClick={handleGameAreaClick}
      >
        {targets.map((target) => (
          <div
            key={target.id}
            className="target"
            style={{
              left: target.x,
              top: target.y,
              backgroundColor: target.color,
              transform: `rotate(${target.rotation}deg)`,
              boxShadow: `0 0 10px ${target.color}`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleTargetClick(target.id);
            }}
          />
        ))}

        {powerUps.map(powerUp => (
          <div
            key={powerUp.id}
            className={`power-up power-up-${powerUp.type} ${powerUp.isAnimating && powerUp.type === 'lightning' ? 'active' : ''} ${powerUp.isRemoving ? 'fade-out' : ''}`}
            style={{
              left: powerUp.x,
              top: powerUp.y,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePowerUpClick(powerUp.id);
            }}
          >
            {powerUp.type === 'extra-life' ? '+' :
             powerUp.type === 'time-freeze' ? '❄️' :
             powerUp.type === 'double-points' ? '2x' :
             powerUp.type === 'lightning' ? '⚡️' :
             powerUp.type === 'lava-shield' ? '🛡️' : '💀'}
          </div>
        ))}

        <div
          className="crosshair"
          style={{
            left: mousePosition.x - 6,
            top: mousePosition.y - 6,
          }}
        />
      </div>

      <div className="score-display">
        <div className="text-xl text-white">Score: {score}</div>
        <div className="text-xl text-white">Lives: {lives}</div>
        <div className="text-xl text-white">Combo: x{combo}</div>
      </div>

      <div className="mt-6">
        {!gameStarted && !gameOver && (
          <div className="flex flex-col items-center space-y-4">
            <button
              className="game-button"
              onClick={startGame}
            >
              Start Game
            </button>
            <div className="flex space-x-4">
              <button
                className={`difficulty-button ${difficulty === 'easy' ? 'active' : ''}`}
                onClick={() => setDifficulty('easy')}
              >
                Easy
              </button>
              <button
                className={`difficulty-button ${difficulty === 'normal' ? 'active' : ''}`}
                onClick={() => setDifficulty('normal')}
              >
                Normal
              </button>
              <button
                className={`difficulty-button ${difficulty === 'hard' ? 'active' : ''}`}
                onClick={() => setDifficulty('hard')}
              >
                Hard
              </button>
            </div>
          </div>
        )}
        {gameOver && (
          <div className="game-over">
            <p className="text-3xl font-bold text-red-500">Game Over!</p>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                className="game-button"
                onClick={startGame}
              >
                Play Again
              </button>
              <button
                className="game-button reset"
                onClick={resetGame}
              >
                Reset Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
