import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Gamepad2,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCollabStore } from '../../store/useCollabStore';
import {
  checkAABBCollision,
  checkCircleRectCollision,
  calculateScoreWithMultiplier,
  calculatePaddleBounce,
  generateBrickGrid,
  getLeaderboardWithPlayer,
  Brick,
} from '../../utils/gameLogic';
import { gameAudio } from '../../utils/gameAudio';

export const BreakGameModal: React.FC = () => {
  const { isGameOpen, setGameOpen, currentUser, soundEnabled, setSoundEnabled } = useCollabStore();

  const [selectedGame, setSelectedGame] = useState<'runner' | 'breakout'>('runner');
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard'>('play');

  // Common Game States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window === 'undefined') return 1200;
    const saved = localStorage.getItem('collabflow_breakgame_highscore');
    return saved ? parseInt(saved, 10) : 1200;
  });
  const [comboStreak, setComboStreak] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ==========================================
  // GAME 1: WALL-E'S SOLAR DASH STATE & ENGINE
  // ==========================================
  const runnerState = useRef<{
    walleY: number;
    walleVelocityY: number;
    isGrounded: boolean;
    isDucking: boolean;
    distance: number;
    speed: number;
    obstacles: Array<{
      id: number;
      x: number;
      y: number;
      width: number;
      height: number;
      type: 'bug' | 'spike' | 'cable';
    }>;
    items: Array<{
      id: number;
      x: number;
      y: number;
      width: number;
      height: number;
      type: 'battery' | 'gem';
      collected: boolean;
    }>;
    particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
    }>;
    nextSpawn: number;
    nextItemSpawn: number;
  }>({
    walleY: 210,
    walleVelocityY: 0,
    isGrounded: true,
    isDucking: false,
    distance: 0,
    speed: 5.5,
    obstacles: [],
    items: [],
    particles: [],
    nextSpawn: 60,
    nextItemSpawn: 30,
  });

  // ==========================================
  // GAME 2: COLLAB BUG BLASTER (BREAKOUT)
  // ==========================================
  const breakoutState = useRef<{
    paddleX: number;
    paddleWidth: number;
    paddleHeight: number;
    balls: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }>;
    bricks: Brick[];
    powerups: Array<{
      id: number;
      x: number;
      y: number;
      type: 'multiball' | 'wide' | 'shield';
    }>;
    lives: number;
  }>({
    paddleX: 250,
    paddleWidth: 90,
    paddleHeight: 14,
    balls: [{ x: 300, y: 240, vx: 4, vy: -4, radius: 6 }],
    bricks: [],
    powerups: [],
    lives: 3,
  });

  // Reset or Start Game
  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setIsNewRecord(false);
    setScore(0);
    setComboStreak(0);

    if (selectedGame === 'runner') {
      runnerState.current = {
        walleY: 210,
        walleVelocityY: 0,
        isGrounded: true,
        isDucking: false,
        distance: 0,
        speed: 5.5,
        obstacles: [],
        items: [],
        particles: [],
        nextSpawn: 40,
        nextItemSpawn: 20,
      };
    } else {
      breakoutState.current = {
        paddleX: 250,
        paddleWidth: 90,
        paddleHeight: 14,
        balls: [{ x: 300, y: 240, vx: 4, vy: -4, radius: 6 }],
        bricks: generateBrickGrid(4, 7, 580, 180),
        powerups: [],
        lives: 3,
      };
    }
  };

  // Keyboard controls
  useEffect(() => {
    if (!isGameOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!isPlaying && !isGameOver) {
          startGame();
          return;
        }
        if (selectedGame === 'runner') {
          if (runnerState.current.isGrounded) {
            runnerState.current.walleVelocityY = -12.5;
            runnerState.current.isGrounded = false;
            if (soundEnabled) gameAudio.playJump();
          }
        }
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (selectedGame === 'runner') {
          runnerState.current.isDucking = true;
        }
      } else if (e.code === 'ArrowLeft') {
        if (selectedGame === 'breakout') {
          breakoutState.current.paddleX = Math.max(0, breakoutState.current.paddleX - 25);
        }
      } else if (e.code === 'ArrowRight') {
        if (selectedGame === 'breakout') {
          breakoutState.current.paddleX = Math.min(
            580 - breakoutState.current.paddleWidth,
            breakoutState.current.paddleX + 25
          );
        }
      } else if (e.code === 'Escape') {
        setGameOpen(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        if (selectedGame === 'runner') {
          runnerState.current.isDucking = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameOpen, isPlaying, isGameOver, selectedGame, soundEnabled]);

  // Main 60fps Game Loop
  useEffect(() => {
    if (!isGameOpen || !isPlaying || isGameOver) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // ==========================================
      // RUNNER ENGINE
      // ==========================================
      if (selectedGame === 'runner') {
        const s = runnerState.current;
        s.distance += 1;
        s.speed = 5.5 + Math.min(5, s.distance * 0.002);

        // Ground line
        const groundY = 250;

        // Draw parallax cyber background
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, width, height);

        // Background grid lines
        ctx.strokeStyle = '#1e1b4b';
        ctx.lineWidth = 1;
        for (let x = -(s.distance % 40); x < width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, groundY);
          ctx.stroke();
        }

        // Draw Ground platform
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, groundY, width, height - groundY);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(width, groundY);
        ctx.stroke();

        // Gravity & Physics on WALL-E
        s.walleVelocityY += 0.65; // gravity
        s.walleY += s.walleVelocityY;
        if (s.walleY >= groundY - 40) {
          s.walleY = groundY - 40;
          s.walleVelocityY = 0;
          s.isGrounded = true;
        }

        // WALL-E Player Bounding Box
        const walleHeight = s.isDucking ? 24 : 40;
        const walleWidth = 36;
        const walleX = 80;
        const playerBox = {
          x: walleX,
          y: s.walleY + (s.isDucking ? 16 : 0),
          width: walleWidth,
          height: walleHeight,
        };

        // Draw cute 2D WALL-E sprite
        // Treads
        ctx.fillStyle = '#27272a';
        ctx.fillRect(walleX - 2, s.walleY + (s.isDucking ? 14 : 26), 40, 14);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(walleX + 4, s.walleY + (s.isDucking ? 6 : 10), 28, s.isDucking ? 14 : 20);

        // Solar gauge on chest
        ctx.fillStyle = '#10b981';
        ctx.fillRect(walleX + 8, s.walleY + (s.isDucking ? 8 : 14), 10, 4);

        // Binocular Eyes
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(walleX + 10, s.walleY + (s.isDucking ? 4 : 4), 6, 0, Math.PI * 2);
        ctx.arc(walleX + 24, s.walleY + (s.isDucking ? 4 : 4), 6, 0, Math.PI * 2);
        ctx.fill();

        // Eye lens glow
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(walleX + 11, s.walleY + (s.isDucking ? 4 : 4), 3, 0, Math.PI * 2);
        ctx.arc(walleX + 25, s.walleY + (s.isDucking ? 4 : 4), 3, 0, Math.PI * 2);
        ctx.fill();

        // Spawning obstacles
        s.nextSpawn -= 1;
        if (s.nextSpawn <= 0) {
          const type = Math.random() > 0.4 ? 'bug' : Math.random() > 0.5 ? 'cable' : 'spike';
          let obsY = groundY - 32;
          let obsW = 28;
          let obsH = 32;
          if (type === 'cable') {
            obsY = groundY - 58; // Overhead cable, must duck!
            obsW = 40;
            obsH = 20;
          }
          s.obstacles.push({
            id: Date.now() + Math.random(),
            x: width + 20,
            y: obsY,
            width: obsW,
            height: obsH,
            type,
          });
          s.nextSpawn = Math.floor(Math.random() * 50) + 65;
        }

        // Spawning collectible solar batteries & gems
        s.nextItemSpawn -= 1;
        if (s.nextItemSpawn <= 0) {
          s.items.push({
            id: Date.now() + Math.random(),
            x: width + 20,
            y: groundY - (Math.random() > 0.5 ? 30 : 65),
            width: 20,
            height: 20,
            type: Math.random() > 0.3 ? 'battery' : 'gem',
            collected: false,
          });
          s.nextItemSpawn = Math.floor(Math.random() * 40) + 40;
        }

        // Update & Render Obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          // Draw obstacle
          if (obs.type === 'bug') {
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.fillText('BUG', obs.x + 4, obs.y + 18);
          } else if (obs.type === 'cable') {
            ctx.fillStyle = '#eab308';
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.fillStyle = '#000000';
            ctx.font = '9px monospace';
            ctx.fillText('⚡CABLE', obs.x + 2, obs.y + 14);
          } else {
            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width / 2, obs.y);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
            ctx.fill();
          }

          // Check Collision
          if (checkAABBCollision(playerBox, obs, 4)) {
            // Player hit!
            if (soundEnabled) gameAudio.playHit();
            handleGameOver();
            return;
          }

          if (obs.x < -50) {
            s.obstacles.splice(i, 1);
          }
        }

        // Update & Render Items
        for (let i = s.items.length - 1; i >= 0; i--) {
          const item = s.items[i];
          item.x -= s.speed;

          if (!item.collected) {
            if (item.type === 'battery') {
              // Solar Battery
              ctx.fillStyle = '#10b981';
              ctx.fillRect(item.x, item.y, item.width, item.height);
              ctx.fillStyle = '#ffffff';
              ctx.font = '12px sans-serif';
              ctx.fillText('🔋', item.x + 2, item.y + 15);
            } else {
              // Gem
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(item.x, item.y, item.width, item.height);
              ctx.fillStyle = '#ffffff';
              ctx.font = '12px sans-serif';
              ctx.fillText('💎', item.x + 2, item.y + 15);
            }

            // Collection check
            if (checkAABBCollision(playerBox, item, 2)) {
              item.collected = true;
              const addedStreak = comboStreak + 1;
              setComboStreak(addedStreak);
              const scored = calculateScoreWithMultiplier(
                item.type === 'battery' ? 100 : 250,
                addedStreak
              );
              setScore((prev) => {
                const nextScore = prev + scored.points;
                if (nextScore > highScore) {
                  setHighScore(nextScore);
                  setIsNewRecord(true);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('collabflow_breakgame_highscore', nextScore.toString());
                  }
                }
                return nextScore;
              });

              if (soundEnabled) gameAudio.playCollect();

              // Spawn particles
              for (let p = 0; p < 8; p++) {
                s.particles.push({
                  x: item.x + 10,
                  y: item.y + 10,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  life: 1.0,
                  color: item.type === 'battery' ? '#10b981' : '#38bdf8',
                });
              }
            }
          }

          if (item.x < -30) {
            s.items.splice(i, 1);
          }
        }

        // Update & Render Particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillRect(p.x, p.y, 4, 4);
          ctx.globalAlpha = 1.0;
          if (p.life <= 0) s.particles.splice(i, 1);
        }
      }

      // ==========================================
      // BREAKOUT ENGINE
      // ==========================================
      else if (selectedGame === 'breakout') {
        const b = breakoutState.current;

        // Background
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, width, height);

        // Draw Paddle
        const paddleY = height - 28;
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.roundRect(b.paddleX, paddleY, b.paddleWidth, b.paddleHeight, 6);
        ctx.fill();

        // Draw Bricks
        b.bricks.forEach((brick) => {
          if (brick.health > 0) {
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            ctx.strokeStyle = '#1e1b4b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

            // Brick text label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(brick.label, brick.x + 4, brick.y + 16);
          }
        });

        // Update & Draw Balls
        for (let i = b.balls.length - 1; i >= 0; i--) {
          const ball = b.balls[i];
          ball.x += ball.vx;
          ball.y += ball.vy;

          // Wall bounces
          if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx);
          } else if (ball.x + ball.radius >= width) {
            ball.x = width - ball.radius;
            ball.vx = -Math.abs(ball.vx);
          }

          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
          }

          // Paddle bounce
          const paddleRect = {
            x: b.paddleX,
            y: paddleY,
            width: b.paddleWidth,
            height: b.paddleHeight,
          };
          const paddleHit = checkCircleRectCollision(ball, paddleRect);
          if (paddleHit.collided && ball.vy > 0) {
            const hitRatio = (ball.x - (b.paddleX + b.paddleWidth / 2)) / (b.paddleWidth / 2);
            const bounced = calculatePaddleBounce(hitRatio, 6);
            ball.vx = bounced.vx;
            ball.vy = bounced.vy;
            if (soundEnabled) gameAudio.playJump();
          }

          // Brick collisions
          let hitBrick = false;
          for (let k = 0; k < b.bricks.length; k++) {
            const brick = b.bricks[k];
            if (brick.health > 0) {
              const res = checkCircleRectCollision(ball, brick);
              if (res.collided) {
                brick.health -= 1;
                hitBrick = true;
                if (res.normalX !== 0) ball.vx = -ball.vx;
                if (res.normalY !== 0) ball.vy = -ball.vy;

                if (brick.health <= 0) {
                  setScore((prev) => {
                    const next = prev + brick.points;
                    if (next > highScore) {
                      setHighScore(next);
                      setIsNewRecord(true);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('collabflow_breakgame_highscore', next.toString());
                      }
                    }
                    return next;
                  });
                  if (soundEnabled) gameAudio.playHit();
                }
                break;
              }
            }
          }

          // Ball falls below screen
          if (ball.y > height) {
            b.balls.splice(i, 1);
            if (b.balls.length === 0) {
              b.lives -= 1;
              if (b.lives <= 0) {
                handleGameOver();
                return;
              } else {
                b.balls.push({ x: b.paddleX + b.paddleWidth / 2, y: paddleY - 20, vx: 4, vy: -4, radius: 6 });
              }
            }
          }

          // Draw ball
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Check victory (all bricks destroyed)
        if (b.bricks.every((br) => br.health <= 0)) {
          // You cleared all bugs!
          if (soundEnabled) gameAudio.playPowerup();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          b.bricks = generateBrickGrid(4, 7, width, 180);
        }
      }
    };

    const handleGameOver = () => {
      setIsGameOver(true);
      setIsPlaying(false);
      if (soundEnabled) gameAudio.playGameOver();

      if (score > 1800) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    };

    renderLoop();
    return () => cancelAnimationFrame(animId);
  }, [isGameOpen, isPlaying, isGameOver, selectedGame, comboStreak, highScore, soundEnabled]);

  // Handle paddle tracking with mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedGame !== 'breakout') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    breakoutState.current.paddleX = Math.max(
      0,
      Math.min(canvas.width - breakoutState.current.paddleWidth, mouseX - breakoutState.current.paddleWidth / 2)
    );
  };

  if (!isGameOpen) return null;

  const leaderboard = getLeaderboardWithPlayer(
    score,
    currentUser?.name || 'You',
    selectedGame === 'runner' ? 'walle_runner' : 'bug_blaster'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#0d121f] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* TOP HEADER */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  CollabFlow Break Time Arcade
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Free Time Zone
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Relax, recharge, and blast workspace bugs during team breaks!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={soundEnabled ? 'Mute Game Audio' : 'Unmute Game Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setGameOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Arcade (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* GAME & TAB SELECTOR */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {/* Game Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setSelectedGame('runner');
                setIsPlaying(false);
                setIsGameOver(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedGame === 'runner'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🤖 WALL-E's Solar Dash</span>
            </button>
            <button
              onClick={() => {
                setSelectedGame('breakout');
                setIsPlaying(false);
                setIsGameOver(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedGame === 'breakout'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🧱 Collab Bug Blaster</span>
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('play')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'play'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Game Screen
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                activeTab === 'leaderboard'
                  ? 'bg-slate-800 text-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PLAY VIEW */}
        {activeTab === 'play' && (
          <div className="p-4 flex flex-col items-center">
            {/* HUD: Score, Streak, High Score */}
            <div className="w-full max-w-[580px] grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Current Score</span>
                <span className="text-lg font-mono font-extrabold text-cyan-400">{score.toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Combo Streak</span>
                <span className="text-lg font-mono font-extrabold text-amber-400">
                  {comboStreak > 0 ? `${comboStreak}x` : '—'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" /> High Score
                </span>
                <span className="text-lg font-mono font-extrabold text-emerald-400">
                  {highScore.toLocaleString()}
                </span>
              </div>
            </div>

            {/* CANVAS CONTAINER */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
              <canvas
                ref={canvasRef}
                width={580}
                height={280}
                onMouseMove={handleMouseMove}
                className="block select-none cursor-crosshair"
              />

              {/* OVERLAY: START / GAME OVER SCREENS */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                  {isGameOver ? (
                    <div className="space-y-3">
                      <span className="text-3xl">💥</span>
                      <h3 className="text-xl font-extrabold text-white">Break's Over!</h3>
                      <p className="text-sm text-slate-300">
                        Final Score:{' '}
                        <span className="font-mono font-bold text-cyan-400">{score}</span>
                        {isNewRecord && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            🎉 NEW RECORD!
                          </span>
                        )}
                      </p>
                      <button
                        onClick={startGame}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 mx-auto transition-transform active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Play Again</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-w-sm">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto text-xl shadow-lg">
                        {selectedGame === 'runner' ? '🤖' : '🧱'}
                      </div>
                      <h3 className="text-lg font-extrabold text-white">
                        {selectedGame === 'runner'
                          ? "WALL-E's Solar Dash"
                          : 'Collab Bug Blaster'}
                      </h3>
                      <p className="text-xs text-slate-300">
                        {selectedGame === 'runner'
                          ? 'Guide WALL-E to collect solar batteries and gems. Jump over red bugs and duck under low voltage cables!'
                          : 'Control the paddle to bounce the ball and smash blockers, memory leaks, and stale PRs!'}
                      </p>
                      <button
                        onClick={startGame}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 mx-auto transition-transform active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Playing</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CONTROLS FOOTER HINT */}
            <div className="w-full max-w-[580px] mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-300">Controls:</span>
                {selectedGame === 'runner' ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200">
                      Space / ↑
                    </span>
                    <span>Jump</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200">
                      ↓
                    </span>
                    <span>Duck</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200">
                      Mouse / ← →
                    </span>
                    <span>Move Paddle</span>
                  </div>
                )}
              </div>

              {/* On-screen touch/mouse jump & duck buttons for mobile */}
              {selectedGame === 'runner' && isPlaying && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (runnerState.current.isGrounded) {
                        runnerState.current.walleVelocityY = -12.5;
                        runnerState.current.isGrounded = false;
                        if (soundEnabled) gameAudio.playJump();
                      }
                    }}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                  >
                    <ArrowUp className="w-3.5 h-3.5" /> Jump
                  </button>
                  <button
                    onMouseDown={() => (runnerState.current.isDucking = true)}
                    onMouseUp={() => (runnerState.current.isDucking = false)}
                    onTouchStart={() => (runnerState.current.isDucking = true)}
                    onTouchEnd={() => (runnerState.current.isDucking = false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 shadow"
                  >
                    <ArrowDown className="w-3.5 h-3.5" /> Duck
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TEAM LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>CollabFlow Team High Scores</span>
                </h3>
                <p className="text-xs text-slate-400">
                  See how your break-time reflexes compare with your engineering teammates!
                </p>
              </div>
              <span className="text-xs font-mono text-indigo-400">
                Game: {selectedGame === 'runner' ? "WALL-E's Solar Dash" : 'Bug Blaster'}
              </span>
            </div>

            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={`${entry.rank}-${entry.name}`}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    entry.isCurrentUser
                      ? 'bg-indigo-950/70 border-indigo-500/50 shadow-md shadow-indigo-600/10'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 text-center font-mono font-extrabold text-sm ${
                        entry.rank === 1
                          ? 'text-amber-400'
                          : entry.rank === 2
                          ? 'text-slate-300'
                          : entry.rank === 3
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      #{entry.rank}
                    </span>

                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {entry.avatar}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{entry.name}</span>
                        {entry.isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500 text-white">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{entry.role}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-cyan-400">
                      {entry.score.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
