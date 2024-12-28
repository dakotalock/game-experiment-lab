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

  // Define the songs array with real, directly usable URLs
  const songs = [
    { id: 1, name: 'Song 1', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 2, name: 'Song 2', src: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Algorithms.mp3' },
    { id: 3, name: 'Song 3', src: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3' },
    { id: 4, name: 'Song 4', src: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Drifting.mp3' },
    { id: 5, name: 'Song 5', src: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_03_-_Electro_Beat.mp3' },
  ];

  const [selectedSong, setSelectedSong] = useState(songs[0]);

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
    setPowerUps((prevPowerUps) => prevPowerUps.filter((powerUp) => powerUp.id !== id));

    if (clickedPowerUp.type === 'extra-life') {
      setLives((prevLives) => prevLives + 1);
    } else if (clickedPowerUp.type === 'time-freeze') {
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
    } else if (clickedPowerUp.type === 'double-points') {
      setScore((prevScore) => prevScore + 10);
    } else if (clickedPowerUp.type === 'skull') {
      setLives((prevLives) => Math.max(prevLives - 1, 0));
    } else if (clickedPowerUp.type === 'lightning') {
      const pointsToAdd = targets.length;
      setTargets([]);
      setScore((prevScore) => prevScore + pointsToAdd);
    } else if (clickedPowerUp.type === 'lava-shield') {
      const halfLength = Math.ceil(targets.length / 2);
      const pointsToAdd = halfLength;
      setTargets((prevTargets) => prevTargets.slice(halfLength));
      setScore((prevScore) => prevScore + pointsToAdd);
      setLives((prevLives) => prevLives + 2);
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
    setPowerUps((prevPowerUps) => [...prevPowerU
