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
  spawnTime: number;
  type: 'normal' | 'slime' | 'mini'; // Updated to include 'mini'
  size: number;
}

type PowerUpType = 'extra-life' | 'time-freeze' | 'double-points' | 'skull' | 'lightning' | 'lava-shield';

interface PowerUp {
  x: number;
  y: number;
  dx: number;
  dy: number;
  id: number;
  type: PowerUpType;
  spawnTime: number;
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
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
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

  const songs = [
    { id: 1, name: 'Lo-Fi Chill Beats', src: 'https://streamingpulsar.net/lofi-radio' }, // Default song
    { id: 2, name: 'Song 1', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 3, name: 'Song 2', src: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Algorithms.mp3' },
    { id: 4, name: 'Song 3', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
    { id: 5, name: 'Song 4', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 6, name: 'Song 5', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
  ];

  const [selectedSong, setSelectedSong] = useState(songs[0]); // Default to first song in the list

  const handleSongChange = (id: number) => {
    const song = songs.find((song) => song.id === id);
    if (song) {
      setSelectedSong(song);
    }
  };

  const getRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const spawnTarget = () => {
    const x = Math.random() * (gameWidth - targetSize);
    const y = Math.random() * (gameHeight - targetSize);
    const dx = (Math.random() - 0.5) * targetSpeed;
    const dy = (Math.random() - 0.5) * targetSpeed;
    const color = getRandomColor();
    let type: 'normal' | 'slime' | 'mini' = 'normal';
    const random = Math.random();
    if (random < 0.1) {
      type = 'slime';
    } else if (random < 0.2) {
      type = 'mini';
    }
    let size: number;
    switch (type) {
      case 'slime':
        size = targetSize * 1.2;
        break;
      case 'mini':
        size = targetSize / 2;
        break;
      case 'normal':
        size = targetSize;
        break;
      default:
        size = targetSize;
        break;
    }
    const newTarget: Target = {
      x,
      y,
      dx,
      dy,
      id: Date.now() + Math.random(),
      color,
      rotation: 0,
      spawnTime: Date.now(),
      type,
      size,
    };
    setTargets((prevTargets) => [...prevTargets, newTarget]);
  };

  const handleTargetClick = (id: number) => {
    if (gameOver) return;
    setTargets((prevTargets) => {
      const updatedTargets = prevTargets.filter((target) => target.id !== id);
      const clickedTarget = prevTargets.find((target) => target.id === id);
      if (clickedTarget) {
        switch (clickedTarget.type) {
          case 'slime':
            // Split into two mini targets
            const newMiniTarget1: Target = {
              x: clickedTarget.x,
              y: clickedTarget.y,
              dx: (Math.random() - 0.5) * targetSpeed,
              dy: (Math.random() - 0.5) * targetSpeed,
              id: Date.now() + Math.random(),
              color: getRandomColor(),
              rotation: 0,
              spawnTime: Date.now(),
              type: 'mini',
              size: targetSize / 2,
            };
            const newMiniTarget2: Target = {
              x: clickedTarget.x,
              y: clickedTarget.y,
              dx: (Math.random() - 0.5) * targetSpeed,
              dy: (Math.random() - 0.5) * targetSpeed,
              id: Date.now() + Math.random(),
              color: getRandomColor(),
              rotation: 0,
              spawnTime: Date.now(),
              type: 'mini',
              size: targetSize / 2,
            };
            return [...updatedTargets, newMiniTarget1, newMiniTarget2];
          case 'mini':
            // Handle mini target click
            return updatedTargets;
          case 'normal':
            // Handle normal target click
            return updatedTargets;
          default:
            // This should never happen
            return updatedTargets;
        }
      }
      return updatedTargets;
    });
    setScore((prevScore) => prevScore + (combo > 5 ? 2 : 1));
    setCombo((prevCombo) => prevCombo + 1);
  };

  const handlePowerUpClick = (id: number) => {
    if (gameOver) return;
    const clickedPowerUp = powerUps.find((pu) => pu.id === id);
    if (!clickedPowerUp) return;
    setPowerUps((prevPowerUps) => prevPowerUps.filter((powerUp) => powerUp.id !== id));

    switch (clickedPowerUp.type) {
      case 'extra-life':
        setLives((prevLives) => prevLives + 1);
        break;
      case 'time-freeze':
        setCombo(0);
        setTargets((prevTargets) =>
          prevTargets.map((target) => ({
            ...target,
            dx: 0,
            dy: 0,
          }))
        );
        setTimeout(() => {
          setTargets((prevTargets) =>
            prevTargets.map((target) => ({
              ...target,
              dx: (Math.random() - 0.5) * targetSpeed,
              dy: (Math.random() - 0.5) * targetSpeed,
            }))
          );
        }, 3000);
        break;
      case 'double-points':
        setScore((prevScore) => prevScore + 10);
        break;
      case 'skull':
        setLives((prevLives) => Math.max(prevLives - 1, 0));
        if (lives <= 1) {
          setGameOver(true);
          setGameStarted(false);
          audioPlayerRef.current?.audio.current?.pause();
        }
        break;
      case 'lightning':
        const pointsToAddLightning = targets.length;
        setTargets([]);
        setScore((prevScore) => prevScore + pointsToAddLightning);
        break;
      case 'lava-shield':
        const halfLength = Math.ceil(targets.length / 2);
        const pointsToAddLavaShield = halfLength;
        setTargets((prevTargets) => prevTargets.slice(halfLength));
        setScore((prevScore) => prevScore + pointsToAddLavaShield);
        setLives((prevLives) => prevLives + 2);
        break;
      default:
        break;
    }
  };

  const spawnPowerUp = () => {
    const x = Math.random() * (gameWidth - targetSize);
    const y = Math.random() * (gameHeight - targetSize);
    const dx = (Math.random() - 0.5) * targetSpeed;
    const dy = (Math.random() - 0.5) * targetSpeed;
    const powerUpTypes: PowerUpType[] = ['extra-life', 'time-freeze', 'double-points', 'skull', 'lightning', 'lava-shield'];
    const type: PowerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const newPowerUp: PowerUp = {
      x,
      y,
      dx,
      dy,
      id: Date.now() + Math.random(),
      type,
      spawnTime: Date.now(),
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
    setLives(difficulty === 'easy' ? 10 : difficulty === 'normal' ? 3 : 1);
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
    setLives(difficulty === 'easy' ? 10 : difficulty === 'normal' ? 3 : 1);
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
          const updatedTargets = prevTargets.map((target) => {
            let { x, y, dx, dy } = target;

            // Update position
            x += dx;
            y += dy;

            // Bounce off walls
            if (x < 0 || x > gameWidth - target.size) {
              dx = -dx;
              x = x < 0 ? 0 : gameWidth - target.size;
            }
            if (y < 0 || y > gameHeight - target.size) {
              dy = -dy;
              y = y < 0 ? 0 : gameHeight - target.size;
            }

            return {
              ...target,
              x,
              y,
              dx,
              dy,
              rotation: (target.rotation + targetRotationSpeed) % 360,
            };
          });

          // Check for expired targets (45 seconds)
          const expiredTargets = updatedTargets.filter(
            (target) => Date.now() - target.spawnTime > 45000
          );
          if (expiredTargets.length > 0) {
            setLives((prevLives) => {
              const newLives = prevLives - expiredTargets.length;
              if (newLives <= 0) {
                setGameOver(true);
                setGameStarted(false);
                audioPlayerRef.current?.audio.current?.pause();
              }
              return Math.max(newLives, 0);
            });
          }

          const filteredTargets = updatedTargets.filter(
            (target) => Date.now() - target.spawnTime <= 45000
          );

          return filteredTargets;
        });

        // Add movement for power-ups
        setPowerUps((prevPowerUps) => {
          const updatedPowerUps = prevPowerUps.map((powerUp) => {
            let { x, y, dx, dy } = powerUp;

            // Update position
            x += dx;
            y += dy;

            // Bounce off walls for power-ups
            if (x < 0 || x > gameWidth - targetSize) {
              dx = -dx;
              x = x < 0 ? 0 : gameWidth - targetSize;
            }
            if (y < 0 || y > gameHeight - targetSize) {
              dy = -dy;
              y = y < 0 ? 0 : gameHeight - targetSize;
            }

            return { ...powerUp, x, y };
          });

          const filteredPowerUps = updatedPowerUps.filter(
            (powerUp) => Date.now() - powerUp.spawnTime <= powerUpDuration
          );

          return filteredPowerUps;
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

      <button
        className="instructions-button"
        onClick={() => setShowInstructions(!showInstructions)}
      >
        Instructions
      </button>

      {showInstructions && (
        <div className="instructions-modal">
          <h3>How to Play</h3>
          <ul>
            <li>Click on the moving targets to score points.</li>
            <li>If a target despawns without being clicked, you lose a life.</li>
            <li>Use power-ups to gain advantages or face penalties.</li>
          </ul>
          <h3>Power-Ups</h3>
          <ul>
            <li><strong>+</strong>: Extra life</li>
            <li><strong>❄️</strong>: Freeze targets for 3 seconds</li>
            <li><strong>+10</strong>: Gain 10 points</li>
            <li><strong>⚡️</strong>: Destroy all targets and gain points</li>
            <li><strong>🛡️</strong>: Destroy half the targets, gain points, and gain 2 lives</li>
            <li><strong>🧙‍♀️</strong>: Lose a life</li>
          </ul>
          <button
            className="close-instructions-button"
            onClick={() => setShowInstructions(false)}
          >
            Close
          </button>
        </div>
      )}

      <div className="hidden">
        <AudioPlayer
          ref={audioPlayerRef}
          src={selectedSong.src}
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
        {targets.map((target) => {
          const backgroundColor = target.type === 'slime' ? '#66CCFF' : target.type === 'mini' ? '#FF66CC' : target.color;
          const borderRadius = target.type === 'slime' || target.type === 'mini' ? '50%' : '10%';
          return (
            <div
              key={target.id}
              className="target"
              style={{
                position: 'absolute',
                left: target.x,
                top: target.y,
                width: target.size,
                height: target.size,
                backgroundColor: backgroundColor,
                borderRadius: borderRadius,
                transform: `rotate(${target.rotation}deg)`,
                boxShadow: `0 0 10px ${target.color}`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleTargetClick(target.id);
              }}
            />
          );
        })}

        {powerUps.map((powerUp) => (
          <div
            key={powerUp.id}
            className={`power-up power-up-${powerUp.type}`}
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
             powerUp.type === 'double-points' ? '+10' :
             powerUp.type === 'skull' ? '🧙‍♀️' :
             powerUp.type === 'lightning' ? '⚡️' : '🛡️'}
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

      <select
        value={selectedSong.id}
        onChange={(e) => {
          const selectedId = parseInt(e.target.value);
          setSelectedSong(songs.find(song => song.id === selectedId) || songs[0]);
        }}
        className="song-selector"
      >
        {songs.map(song => (
          <option key={song.id} value={song.id}>{song.name}</option>
        ))}
      </select>
    </div>
  );
};

export default Game;
