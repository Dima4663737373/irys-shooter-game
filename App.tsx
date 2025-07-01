import React, { useEffect, useRef, useState } from "react";
import robotImg from "./assets/robot.webp";
import lnraImg from "./assets/lnra.png";
import MarioGame from "./MarioGame";
import WalletConnect from "./irys/WalletConnect";

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

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number | null>(null);
  const [signer, setSigner] = useState<any>(null);

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

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#222",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ color: "#eee", margin: "20px 0" }}>Super Mario на Irys</h1>
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
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              background: "rgba(34,34,34,0.85)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              border: "4px solid #eee",
              borderRadius: "16px",
              zIndex: 2,
            }}
          >
            <h2 style={{ color: "#fff", marginBottom: 24 }}>Ready to play?</h2>
            <button
              style={{
                fontSize: 24,
                padding: "12px 32px",
                borderRadius: 8,
                border: "none",
                background: "#388e3c",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "bold",
                boxShadow: "0 2px 8px #0006",
              }}
              onClick={() => setIsStarted(true)}
            >
              Start
            </button>
          </div>
        )}
      </div>
      <p style={{ color: "#eee" }}>
        Use ← → arrows or A/D. Collect LNRA tokens!
      </p>
    </div>
  );
}

export default App; 