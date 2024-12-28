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
  type: 'normal' | 'slime' | 'mini';
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
  const soundCloudRef = useRef<HTMLIFrameElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [soundCloudWidget, setSoundCloudWidget] = useState<any>(null);

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
    { id: 1, name: 'Lo-Fi Chill Beats', src: 'https://soundcloud.com/oxinym/sets/lofi-beats-royalty-free' },
    { id: 2, name: 'Song 1', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 3, name: 'Song 2', src: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Algorithms.mp3' },
    { id: 4, name: 'Song 3', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
    { id: 5, name: 'Song 4', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 6, name: 'Song 5', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
  ];

  const [selectedSong, setSelectedSong] = useState(songs[0]);

  // Load SoundCloud SDK and initialize widget
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;

    script.onload = () => {
      if (soundCloudRef.current) {
        const widget = (window as any).SC.Widget(soundCloudRef.current);
        setSoundCloudWidget(widget);
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Handle song change
  useEffect(() => {
    if (gameStarted) {
      stopMusic();
      setTimeout(() => {
        startMusic();
      }, 100);
    }
  }, [selectedSong]);

  const handleSongChange = (id: number) => {
    const song = songs.find((song) => song.id === id);
    if (song) {
      setSelectedSong(song);
    }
  };

  const startMusic = () => {
    if (selectedSong.id === 1) {
      if (soundCloudRef.current) {
        const widget = (window as any).SC.Widget(soundCloudRef.current);
        setSoundCloudWidget(widget);
        setTimeout(() => {
          widget.load(selectedSong.src, {
            auto_play: true,
          });
        }, 100);
      }
    } else if (audioPlayerRef.current) {
      audioPlayerRef.current.audio.current.play();
    }
  };

  const stopMusic = () => {
    if (selectedSong.id === 1) {
      if (soundCloudWidget) {
        soundCloudWidget.pause();
      }
    } else if (audioPlayerRef.current) {
      audioPlayerRef.current.audio.current.pause();
    }
  };

  const startGame = () => {
    setScore(0);
    setLives(difficulty === 'easy' ? 10 : difficulty === 'normal' ? 3 : 1);
    setGameOver(false);
    setTargets([]);
    setPowerUps([]);
    setCombo(0);
    setGameStarted(true);
    startMusic();
  };

  const resetGame = () => {
    setGameStarted(false);
    setScore(0);
    setLives(difficulty === 'easy' ? 10 : difficulty === 'normal' ? 3 : 1);
    setGameOver(false);
    setTargets([]);
    setPowerUps([]);
    setCombo(0);
    stopMusic();
  };

  // ... (rest of the game logic remains the same)

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
        {selectedSong.id === 1 && (
          <iframe
            key={`soundcloud-${Date.now()}`} // Force iframe refresh on every render
            ref={soundCloudRef}
            width="0"
            height="0"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(selectedSong.src)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
          ></iframe>
        )}
        {selectedSong.id !== 1 && (
          <AudioPlayer
            ref={audioPlayerRef}
            src={selectedSong.src}
            autoPlay={false}
            loop={true}
            volume={0.5}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
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
