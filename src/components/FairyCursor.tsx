import { useEffect, useState } from 'react';
import fairyCursor from '@/assets/fairy-cursor.png';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export default function FairyCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [sparkleId, setSparkleId] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      // Add sparkles periodically
      const currentTime = Date.now();
      if (currentTime - lastTime > 50) {
        const newSparkle: Sparkle = {
          id: sparkleId,
          x: e.clientX + (Math.random() - 0.5) * 30,
          y: e.clientY + (Math.random() - 0.5) * 30,
          size: Math.random() * 8 + 4,
          delay: Math.random() * 0.3,
        };
        
        setSparkles(prev => [...prev, newSparkle]);
        setSparkleId(prev => prev + 1);
        lastTime = currentTime;

        // Remove old sparkles
        setTimeout(() => {
          setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
        }, 1500);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [sparkleId]);

  return (
    <>
      {/* Fairy character */}
      <div
        className="fixed pointer-events-none z-[9999] transition-all duration-100 ease-out"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="relative animate-bounce">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-xl bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60 rounded-full scale-150 animate-pulse" />
          
          {/* Fairy image */}
          <img
            src={fairyCursor}
            alt="fairy"
            className="relative w-20 h-20 object-contain animate-pulse drop-shadow-2xl"
            style={{
              animation: 'bounce 0.6s ease-in-out infinite, pulse 1.5s ease-in-out infinite',
              filter: 'drop-shadow(0 0 20px rgba(255, 192, 203, 0.8))',
            }}
          />
          
          {/* Wings flapping */}
          <div 
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-br from-purple-300/80 to-pink-300/80 rounded-full blur-sm"
            style={{
              animation: 'flapLeft 0.3s ease-in-out infinite',
              transformOrigin: 'right center',
            }}
          />
          <div 
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-bl from-purple-300/80 to-pink-300/80 rounded-full blur-sm"
            style={{
              animation: 'flapRight 0.3s ease-in-out infinite',
              transformOrigin: 'left center',
            }}
          />
        </div>
      </div>

      {/* Sparkle trail */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="fixed pointer-events-none z-[9998]"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
          }}
        >
          <div
            className="w-full h-full animate-ping"
            style={{
              background: `radial-gradient(circle, ${
                ['#FFD700', '#FFC0CB', '#DDA0DD', '#87CEEB', '#FF69B4'][
                  Math.floor(Math.random() * 5)
                ]
              } 0%, transparent 70%)`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: '1.5s',
            }}
          />
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background: 'radial-gradient(circle, white 0%, transparent 60%)',
              animationDelay: `${sparkle.delay}s`,
              animationDuration: '1s',
            }}
          >
            ✨
          </div>
        </div>
      ))}

      <style>{`
        @keyframes flapLeft {
          0%, 100% { transform: translateY(-50%) rotateY(0deg) scaleX(1); }
          50% { transform: translateY(-50%) rotateY(-30deg) scaleX(0.8); }
        }
        @keyframes flapRight {
          0%, 100% { transform: translateY(-50%) rotateY(0deg) scaleX(1); }
          50% { transform: translateY(-50%) rotateY(30deg) scaleX(0.8); }
        }
      `}</style>
    </>
  );
}
