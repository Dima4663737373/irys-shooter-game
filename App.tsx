import React, { useEffect, useRef, useState } from "react";
import robotImg from "./assets/robot.webp";
import lnraImg from "./assets/lnra.png";
import MarioGame from "./MarioGame";
import WalletConnect from "./irys/WalletConnect";
import BubbleShooter from './game/bubbleShooter';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PLATFORM_WIDTH = 100;
const PLATFORM_HEIGHT = 20;
const ROBOT_WIDTH = 60;
const ROBOT_HEIGHT = 60;
const TOKEN_SIZE = 32;
const GRAVITY = 0.4;
const JUMP_POWER = -12.5;
const MOVE_SPEED = 5;
const PLATFORM_COUNT = 7;

type Platform = {
  x: number;
  y: number;
  hasToken: boolean;
  tokenCollected: boolean;
};

function getRandomX() {
  return Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH);
}

const MainMenu = ({ onStartGame, onShowLeaderboard, onShowSettings }) => {
  return (
    <div style={{
      background: 'white',
      padding: '40px',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      textAlign: 'center',
      width: '300px',
      border: '2px solid transparent',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.border = '2px solid white';
      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.border = '2px solid transparent';
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
    }}
    >
      <h1 style={{
        color: '#26A7DE',
        fontSize: '2.5rem',
        marginBottom: '40px',
        fontWeight: 'bold'
      }}>
        Irys Shooter
      </h1>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <button
          onClick={onStartGame}
          style={{
            padding: '15px',
            fontSize: '1.2rem',
            borderRadius: '15px',
            border: 'none',
            background: 'linear-gradient(to right, #43cea2, #185a9d)',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            ':hover': {
              transform: 'scale(1.05)'
            }
          }}
        >
          Play
        </button>
        <button
          onClick={onShowLeaderboard}
          style={{
            padding: '15px',
            fontSize: '1.2rem',
            borderRadius: '15px',
            border: 'none',
            background: 'linear-gradient(to right, #43cea2, #185a9d)',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            ':hover': {
              transform: 'scale(1.05)'
            }
          }}
        >
          Leaderboard
        </button>
        <button
          onClick={onShowSettings}
          style={{
            padding: '15px',
            fontSize: '1.2rem',
            borderRadius: '15px',
            border: 'none',
            background: 'linear-gradient(to right, #43cea2, #185a9d)',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            ':hover': {
              transform: 'scale(1.05)'
            }
          }}
        >
          Settings
        </button>
      </div>
    </div>
  );
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Robot
    let robotX = CANVAS_WIDTH / 2 - ROBOT_WIDTH / 2;
    let robotY = CANVAS_HEIGHT - PLATFORM_HEIGHT - ROBOT_HEIGHT;
    let vy = 0;
    let vx = 0;

    // Platforms with tokens
    let platforms: Platform[] = [];
    platforms.push({
      x: CANVAS_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: CANVAS_HEIGHT - PLATFORM_HEIGHT,
      hasToken: false,
      tokenCollected: false,
    });
    for (let i = 1; i < PLATFORM_COUNT; i++) {
      platforms.push({
        x: getRandomX(),
        y: CANVAS_HEIGHT - (i + 1) * (CANVAS_HEIGHT / PLATFORM_COUNT),
        hasToken: Math.random() < 0.7,
        tokenCollected: false,
      });
    }

    setScore(0);
    scoreRef.current = 0;

    // Load images
    const robot = new window.Image();
    robot.src = robotImg;
    const token = new window.Image();
    token.src = lnraImg;

    // Controls
    const keys: Record<string, boolean> = {};
    const keydown = (e: KeyboardEvent) => {
      keys[e.key] = true;
    };
    const keyup = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    function resetGame() {
      robotX = CANVAS_WIDTH / 2 - ROBOT_WIDTH / 2;
      robotY = CANVAS_HEIGHT - PLATFORM_HEIGHT - ROBOT_HEIGHT;
      vy = 0;
      vx = 0;
      platforms = [];
      platforms.push({
        x: CANVAS_WIDTH / 2 - PLATFORM_WIDTH / 2,
        y: CANVAS_HEIGHT - PLATFORM_HEIGHT,
        hasToken: false,
        tokenCollected: false,
      });
      for (let i = 1; i < PLATFORM_COUNT; i++) {
        platforms.push({
          x: getRandomX(),
          y: CANVAS_HEIGHT - (i + 1) * (CANVAS_HEIGHT / PLATFORM_COUNT),
          hasToken: Math.random() < 0.7,
          tokenCollected: false,
        });
      }
      setScore(0);
      scoreRef.current = 0;
    }

    function drawRoundedRect(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    }

    function draw() {
      // Background
      ctx.fillStyle = "#b3e5fc";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Platforms (rounded) and tokens
      platforms.forEach((p) => {
        ctx.fillStyle = "#388e3c";
        drawRoundedRect(ctx, p.x, p.y, PLATFORM_WIDTH, PLATFORM_HEIGHT, 10);

        // Draw token if present and not collected
        if (p.hasToken && !p.tokenCollected) {
          ctx.drawImage(
            token,
            p.x + PLATFORM_WIDTH / 2 - TOKEN_SIZE / 2,
            p.y - TOKEN_SIZE,
            TOKEN_SIZE,
            TOKEN_SIZE
          );
        }
      });

      // Robot
      ctx.drawImage(robot, robotX, robotY, ROBOT_WIDTH, ROBOT_HEIGHT);

      // LNRA collected (top left)
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = "#222";
      ctx.fillText(`LNRA collected: ${score}`, 16, 36);
    }

    function update() {
      if (isPaused) return;

      // Controls
      if (keys["ArrowLeft"] || keys["a"]) {
        vx = -MOVE_SPEED;
      } else if (keys["ArrowRight"] || keys["d"]) {
        vx = MOVE_SPEED;
      } else {
        vx = 0;
      }

      robotX += vx;

      // Horizontal wrap
      if (robotX < -ROBOT_WIDTH) robotX = CANVAS_WIDTH;
      if (robotX > CANVAS_WIDTH) robotX = -ROBOT_WIDTH;

      // Gravity
      vy += GRAVITY;
      robotY += vy;

      // Platform jump
      platforms.forEach((p) => {
        if (
          robotX + ROBOT_WIDTH > p.x &&
          robotX < p.x + PLATFORM_WIDTH &&
          robotY + ROBOT_HEIGHT > p.y &&
          robotY + ROBOT_HEIGHT - vy <= p.y &&
          vy > 0
        ) {
          vy = JUMP_POWER;
        }
      });

      // Token collection
      platforms.forEach((p) => {
        if (
          p.hasToken &&
          !p.tokenCollected &&
          robotX < p.x + PLATFORM_WIDTH &&
          robotX + ROBOT_WIDTH > p.x &&
          robotY < p.y &&
          robotY + ROBOT_HEIGHT > p.y - TOKEN_SIZE
        ) {
          p.tokenCollected = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
      });

      // Move platforms if robot is above half
      if (robotY < CANVAS_HEIGHT / 2) {
        const dy = CANVAS_HEIGHT / 2 - robotY;
        robotY = CANVAS_HEIGHT / 2;
        platforms.forEach((p) => {
          p.y += dy;
        });
      }

      // Generate new platforms
      platforms.forEach((p, i) => {
        if (p.y > CANVAS_HEIGHT) {
          if (i === 0) return;
          p.x = getRandomX();
          p.y = 0;
          p.hasToken = Math.random() < 0.7;
          p.tokenCollected = false;
        }
      });

      // Game over
      if (robotY > CANVAS_HEIGHT) {
        resetGame();
      }

      draw();
      animationRef.current = requestAnimationFrame(update);
    }

    robot.onload = () => {
      token.onload = () => {
        draw();
        setTimeout(() => {
          vy = JUMP_POWER;
          animationRef.current = requestAnimationFrame(update);
        }, 500);
      };
    };

    // Cleanup
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line
  }, [isStarted, isPaused]);

  // Resume logic
  useEffect(() => {
    if (isStarted && !isPaused && animationRef.current === null) {
      animationRef.current = requestAnimationFrame(function updateWrapper() {
        setIsPaused(false);
      });
    }
    // eslint-disable-next-line
  }, [isPaused, isStarted]);

  useEffect(() => {
    if (gameContainerRef.current) {
      new BubbleShooter(gameContainerRef.current);
    }
  }, []);

  return (
    <div className="game-container">
      <h1 style={{
        fontSize: '2.5rem',
        color: '#2C3E50',
        marginBottom: '24px',
        textAlign: 'center',
        fontWeight: 'bold',
        background: 'linear-gradient(90deg, #43cea2 0%, #185a9d 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
      }}>
        Irys Shooter
      </h1>
      <WalletConnect onConnect={setSigner} />
      {signer && <MarioGame />}
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ border: "1px solid #000", display: "block" }}
        />
        {/* Pause button only during game */}
        {isStarted && !isPaused && (
          <button
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 3,
              fontSize: 18,
              padding: "6px 18px",
              borderRadius: 8,
              border: "none",
              background: "#388e3c",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 8px #0006",
            }}
            onClick={() => {
              setIsPaused(true);
              if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
              }
            }}
          >
            Pause
          </button>
        )}
        {/* Resume button only during pause */}
        {isStarted && isPaused && (
          <button
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 3,
              fontSize: 18,
              padding: "6px 18px",
              borderRadius: 8,
              border: "none",
              background: "#1976d2",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 8px #0006",
            }}
            onClick={() => {
              setIsPaused(false);
              if (animationRef.current === null) {
                animationRef.current = requestAnimationFrame(() => {});
              }
            }}
          >
            Resume
          </button>
        )}
        {/* Start button only before game */}
        {!isStarted && (
          <MainMenu
            onStartGame={() => setIsStarted(true)}
            onShowLeaderboard={() => {}}
            onShowSettings={() => {}}
          />
        )}
      </div>
      <p style={{ color: "#eee" }}>
        Use ← → arrows or A/D. Collect LNRA tokens!
      </p>
      <div ref={gameContainerRef}></div>
    </div>
  );
}

export default App; 