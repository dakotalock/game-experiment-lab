import React, { useState, useEffect, useRef, MouseEvent } from 'react';
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
  type: 'normal' | 'slime' | 'mini' | 'boss';
  size: number;
  isPopping?: boolean;
  health?: number;
  isImmune?: boolean;
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
  const [difficulty, setDifficulty] = useState<'gabriel' | 'easy' | 'normal' | 'hard'>('normal');
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [bossSpawnRate, setBossSpawnRate] = useState<number>(0.03);
  const soundCloudRef = useRef<HTMLIFrameElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const targetSize: number = 30;
  const [gameWidth, setGameWidth] = useState<number>(600);
  const [gameHeight, setGameHeight] = useState<number>(400);
  const targetSpeed: number = 2;
  const targetSpawnInterval: number = 1500 / 2;
  const powerUpSpawnInterval: number = 5000 / 2;
  const powerUpDuration: number = 3000;
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRotationSpeed: number = 2;

  const [laser, setLaser] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    timestamp: number;
  } | null>(null);

  const songs = [
    { id: 1, name: 'Lo-Fi Chill Beats', src: 'https://soundcloud.com/oxinym/sets/lofi-beats-royalty-free' },
    { id: 2, name: 'Chillhop Essentials', src: 'https://soundcloud.com/chillhopdotcom/sets/chillhop-essentials-spring-2023' },
    { id: 3, name: 'Jazz Vibes', src: 'https://soundcloud.com/jazzvibes/sets/jazz-vibes-2023' }
  ];

  const [selectedSong, setSelectedSong] = useState(songs[0]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const startMusic = () => {
    if (soundCloudRef.current) {
      try {
        const widget = (window as any).SC.Widget(soundCloudRef.current);
        widget.play();
      } catch (error) {
        console.warn('Failed to start music:', error);
      }
    }
  };

  const stopMusic = () => {
    if (soundCloudRef.current) {
      try {
        const widget = (window as any).SC.Widget(soundCloudRef.current);
        widget.pause();
      } catch (error) {
        console.warn('Failed to stop music:', error);
      }
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
    setGameStarted(false);
    stopMusic();
  };

  const handleMouseClick = (e: MouseEvent<HTMLDivElement>) => {
    if (gameOver || !gameStarted) return;

    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const hitTarget = targets.some((target) => {
      const targetCenterX = target.x + target.size / 2;
      const targetCenterY = target.y + target.size / 2;
      const distance = Math.sqrt(
        Math.pow(clickX - targetCenterX, 2) + Math.pow(clickY - targetCenterY, 2)
      );
      return distance <= target.size / 2;
    });

    const hitPowerUp = powerUps.some((powerUp) => {
      const powerUpCenterX = powerUp.x + targetSize / 2;
      const powerUpCenterY = powerUp.y + targetSize / 2;
      const distance = Math.sqrt(
        Math.pow(clickX - powerUpCenterX, 2) + Math.pow(clickY - powerUpCenterY, 2)
      );
      return distance <= targetSize / 2;
    });

    if (!hitTarget && !hitPowerUp) {
      setLives((prevLives) => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          handleGameOver();
        }
        return newLives;
      });
    }

    setLaser({
      startX: mousePosition.x,
      startY: mousePosition.y,
      endX: clickX,
      endY: clickY,
      timestamp: Date.now(),
    });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const renderLaser = () => {
    if (!laser) return null;
    const duration = 300;
    if (Date.now() - laser.timestamp > duration) return null;

    return (
      <div
        className="laser"
        style={{
          position: 'absolute',
          left: laser.startX,
          top: laser.startY,
          width: Math.sqrt(
            Math.pow(laser.endX - laser.startX, 2) +
            Math.pow(laser.endY - laser.startY, 2)
          ),
          height: 2,
          transform: `rotate(${Math.atan2(
            laser.endY - laser.startY,
            laser.endX - laser.startX
          )}rad)`,
          transformOrigin: '0 0',
          backgroundColor: 'red',
        }}
      />
    );
  };

  const spawnTarget = () => {
    const size = Math.random() < bossSpawnRate ? 80 : targetSize;
    const type = Math.random() < bossSpawnRate ? 'boss' : 'normal';
    const health = type === 'boss' ? 5 : undefined;
    
    const newTarget: Target = {
      x: Math.random() * (gameWidth - size),
      y: Math.random() * (gameHeight - size),
      dx: (Math.random() - 0.5) * targetSpeed,
      dy: (Math.random() - 0.5) * targetSpeed,
      id: Date.now(),
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      rotation: 0,
      spawnTime: Date.now(),
      type,
      size,
      health,
    };
    
    setTargets((prev) => [...prev, newTarget]);
  };

  const spawnPowerUp = () => {
    const types: PowerUpType[] = [
      'extra-life',
      'time-freeze',
      'double-points',
      'skull',
      'lightning',
      'lava-shield',
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const newPowerUp: PowerUp = {
      x: Math.random() * (gameWidth - targetSize),
      y: Math.random() * (gameHeight - targetSize),
      dx: (Math.random() - 0.5) * targetSpeed,
      dy: (Math.random() - 0.5) * targetSpeed,
      id: Date.now(),
      type,
      spawnTime: Date.now(),
    };
    
    setPowerUps((prev) => [...prev, newPowerUp]);
  };

  const handleTargetClick = (id: number, e: MouseEvent) => {
    e.stopPropagation();
    setTargets((prev) =>
      prev.map((target) =>
        target.id === id
          ? { ...target, isPopping: true }
          : target
      )
    );
    
    setTimeout(() => {
      setTargets((prev) => prev.filter((t) => t.id !== id));
      setScore((prev) => prev + 10);
      setCombo((prev) => prev + 1);
    }, 300);
  };

  const handlePowerUpClick = (id: number, e: MouseEvent) => {
    e.stopPropagation();
    const powerUp = powerUps.find((p) => p.id === id);
    if (!powerUp) return;

    switch (powerUp.type) {
      case 'extra-life':
        setLives((prev) => prev + 1);
        break;
      case 'time-freeze':
        // Implement time freeze logic
        break;
      case 'double-points':
        setScore((prev) => prev + 20);
        break;
      case 'skull':
        setLives((prev) => Math.max(0, prev - 1));
        break;
      case 'lightning':
        setTargets([]);
        setScore((prev) => prev + 50);
        break;
      case 'lava-shield':
        setLives((prev) => prev + 2);
        setScore((prev) => prev + 30);
        setTargets((prev) => prev.filter((_, i) => i % 2 === 0));
        break;
    }

    setPowerUps((prev) => prev.filter((p) => p.id !== id));
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setCombo(0);
    setGameOver(false);
    setGameStarted(true);
    setTargets([]);
    setPowerUps([]);
    setBossSpawnRate(0.03);
    startMusic();
  };

  const resetGame = () => {
    setScore(0);
    setLives(0);
    setCombo(0);
    setGameOver(false);
    setGameStarted(false);
    setTargets([]);
    setPowerUps([]);
    setBossSpawnRate(0.03);
    stopMusic();
  };

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const movementInterval = setInterval(() => {
        setTargets((prevTargets) => {
          const updatedTargets = prevTargets.map((target) => {
            let { x, y, dx, dy } = target;

            x += dx;
            y += dy;

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

          const expiredTargets = updatedTargets.filter(
            (target) => Date.now() - target.spawnTime > 30000
          );

          if (expiredTargets.length > 0) {
            updatedTargets.forEach((target) => {
              if (expiredTargets.find((et) => et.id === target.id)) {
                target.isPopping = true;
              }
            });

            setTimeout(() => {
              setTargets((current) =>
                current.filter((t) => !expiredTargets.find((et) => et.id === t.id))
              );

              const newLives = lives - expiredTargets.length;
              setLives(newLives);
              if (newLives <= 0) {
                handleGameOver();
              }
            }, 300);
          }

          return updatedTargets;
        });

        setPowerUps((prevPowerUps) => {
          const updatedPowerUps = prevPowerUps.map((powerUp) => {
            let { x, y, dx, dy } = powerUp;

            x += dx;
            y += dy;

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
  }, [gameStarted, gameOver, lives]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const bossRateInterval = setInterval(() => {
        setBossSpawnRate((prev) => Math.min(prev + 0.01, 0.2));
      }, 30000);

      return () => clearInterval(bossRateInterval);
    }
  }, [gameStarted, gameOver]);

  const renderTarget = (target: Target) => {
    if (target.type === 'boss') {
      return (
        <div
          key={target.id}
          className={`target ${target.isPopping ? 'popping' : ''}`}
          style={{
            position: 'absolute',
            left: `${target.x}px`,
            top: `${target.y}px`,
            width: `${target.size}px`,
            height: `${target.size}px`,
            transform: `rotate(${target.rotation}deg)`,
            cursor: 'pointer',
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleTargetClick(target.id, e);
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <path
              d="M50 0 L61 35 L97 35 L68 57 L79 91 L50 70 L21 91 L32 57 L3 35 L39 35 Z"
              fill="#FFD700"
              stroke="#FFA500"
              strokeWidth="2"
            />
            <text
              x="50"
              y="55"
              textAnchor="middle"
              fill="black"
              fontSize="30"
              fontWeight="bold"
              style={{ userSelect: 'none' }}
            >
              {target.health}
            </text>
          </svg>
        </div>
      );
    }

    return (
      <div
        key={target.id}
        className={`target ${target.isPopping ? 'popping' : ''}`}
        style={{
          position: 'absolute',
          left: `${target.x}px`,
          top: `${target.y}px`,
          width: `${target.size}px`,
          height: `${target.size}px`,
          backgroundColor: target.type === 'slime' ? '#66CCFF' : target.type === 'mini' ? '#FF66CC' : target.color,
          borderRadius: target.type === 'slime' || target.type === 'mini' ? '50%' : '10%',
          transform: `rotate(${target.rotation}deg)`,
          boxShadow: `0 0 10px ${target.color}`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleTargetClick(target.id, e);
        }}
      />
    );
  };

  return (
    <div className="flex-container" style={{ padding: '20px', maxHeight: '100vh', overflow: 'hidden' }}>
      <h1 className="text-5xl font-extrabold mb-4 text-white">Gabriel's Game</h1>
      <h2 className="text-xl text-gray-400 mb-6">Created by Dakota Lock for Gabriel</h2>

      <button
        className="instructions-button mb-4"
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
            <li><strong>❄️</strong>: Freeze targets for 5 seconds</li>
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
        <iframe
          ref={soundCloudRef}
          width="0"
          height="0"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(selectedSong.src)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
        ></iframe>
      </div>

      <div
        ref={gameAreaRef}
        className="game-area"
        style={{
          width: gameWidth,
          height: gameHeight,
          position: 'relative',
          margin: '0 auto',
          touchAction: 'none',
        }}
        onMouseMove={handleMouseMove}
        onClick={handleMouseClick}
      >
        {targets.map((target) => renderTarget(target))}

        {powerUps.map((powerUp) => (
          <div
            key={powerUp.id}
            className={`power-up power-up-${powerUp.type}`}
            style={{
              position: 'absolute',
              left: `${powerUp.x}px`,
              top: `${powerUp.y}px`,
              backgroundColor: powerUp.type === 'time-freeze' ? 'black' : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePowerUpClick(powerUp.id, e);
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
            position: 'absolute',
            left: `${mousePosition.x - 6}px`,
            top: `${mousePosition.y - 6}px`,
          }}
        />
        {renderLaser()}
      </div>

      <div className="score-display mt-4">
        <div className="text-xl text-white">Score: {score}</div>
        <div className="text-xl text-white">Lives: {lives}</div>
        <div className="text-xl text-white">Combo: x{combo}</div>
      </div>

      <div className="mt-4">
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
                className={`difficulty-button ${difficulty === 'gabriel' ? 'active' : ''}`}
                onClick={() => setDifficulty('gabriel')}
              >
                Gabriel Mode
              </button>
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

      <div className="mt-4">
        <select
          value={selectedSong.id.toString()}
          onChange={(e) => {
            const selectedId = parseInt(e.target.value);
            setSelectedSong(songs.find((song) => song.id === selectedId) || songs[0]);
          }}
          className="song-selector"
        >
          {songs.map((song) => (
            <option key={song.id} value={song.id.toString()}>{song.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Game;
