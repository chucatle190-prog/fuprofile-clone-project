import { useEffect, useState, useRef } from 'react';
import fairyCursor from '@/assets/fairy-cursor-transparent.png';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export default function FairyCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [sparkleId, setSparkleId] = useState(0);
  const animationFrameRef = useRef<number>();

  // Smooth follow animation
  useEffect(() => {
    const animate = () => {
      setPosition(prev => {
        const dx = targetPosition.x - prev.x;
        const dy = targetPosition.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 1) return targetPosition;
        
        // Smooth easing
        const easing = 0.15;
        return {
          x: prev.x + dx * easing,
          y: prev.y + dy * easing,
        };
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetPosition]);

  useEffect(() => {
    let lastTime = Date.now();

    const handleMouseMove = (e: MouseEvent) => {
      setTargetPosition({ x: e.clientX, y: e.clientY });

      // Add sparkles periodically
      const currentTime = Date.now();
      if (currentTime - lastTime > 40) {
        const newSparkle: Sparkle = {
          id: sparkleId,
          x: position.x + (Math.random() - 0.5) * 40,
          y: position.y + (Math.random() - 0.5) * 40,
          size: Math.random() * 10 + 6,
          delay: Math.random() * 0.2,
        };
        
        setSparkles(prev => [...prev, newSparkle]);
        setSparkleId(prev => prev + 1);
        lastTime = currentTime;

        // Remove old sparkles
        setTimeout(() => {
          setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
        }, 2000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [sparkleId, position]);

  return (
    <>
      {/* Fairy character */}
      <div
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          transition: 'none',
        }}
      >
        <div className="relative">
          {/* Multiple glow layers */}
          <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-pink-300 via-purple-300 to-yellow-300 opacity-50 rounded-full scale-[2.5] animate-pulse" />
          <div className="absolute inset-0 blur-xl bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60 rounded-full scale-[2] animate-pulse" 
               style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          
          {/* Magic circle */}
          <div className="absolute inset-0 rounded-full border-2 border-pink-300/30 scale-150 animate-ping" 
               style={{ animationDuration: '2s' }} />
          
          {/* Fairy image */}
          <img
            src={fairyCursor}
            alt="fairy"
            className="relative w-24 h-24 object-contain drop-shadow-2xl"
            style={{
              animation: 'gentleBounce 1.2s ease-in-out infinite, gentleSway 2s ease-in-out infinite',
              filter: 'drop-shadow(0 0 15px rgba(255, 192, 203, 0.9)) drop-shadow(0 0 30px rgba(255, 192, 203, 0.5))',
            }}
          />
          
          {/* Enhanced wings */}
          <div 
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-16 rounded-full blur-sm"
            style={{
              background: 'radial-gradient(ellipse, rgba(255, 192, 203, 0.6) 0%, rgba(221, 160, 221, 0.4) 50%, transparent 70%)',
              animation: 'flapLeft 0.4s ease-in-out infinite',
              transformOrigin: 'right center',
            }}
          />
          <div 
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-16 rounded-full blur-sm"
            style={{
              background: 'radial-gradient(ellipse, rgba(255, 192, 203, 0.6) 0%, rgba(221, 160, 221, 0.4) 50%, transparent 70%)',
              animation: 'flapRight 0.4s ease-in-out infinite',
              transformOrigin: 'left center',
            }}
          />

          {/* Sparkle ring */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-yellow-300 text-lg animate-ping"
              style={{
                left: `calc(50% + ${Math.cos((i / 8) * Math.PI * 2) * 45}px)`,
                top: `calc(50% + ${Math.sin((i / 8) * Math.PI * 2) * 45}px)`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s',
              }}
            >
              ✨
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced sparkle trail */}
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
          {/* Multiple sparkle layers */}
          <div
            className="absolute inset-0 animate-ping"
            style={{
              background: `radial-gradient(circle, ${
                ['#FFD700', '#FFC0CB', '#DDA0DD', '#87CEEB', '#FF69B4', '#FFFFE0'][
                  Math.floor(Math.random() * 6)
                ]
              } 0%, transparent 70%)`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: '2s',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, transparent 50%)',
              animation: 'twinkle 1.5s ease-in-out infinite',
              animationDelay: `${sparkle.delay}s`,
            }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center text-yellow-200"
            style={{
              animation: 'spin 2s linear infinite, pulse 1s ease-in-out infinite',
              animationDelay: `${sparkle.delay}s`,
              fontSize: `${sparkle.size * 0.8}px`,
            }}
          >
            ✨
          </div>
        </div>
      ))}

      <style>{`
        @keyframes flapLeft {
          0%, 100% { transform: translateY(-50%) rotateY(0deg) scaleX(1) scaleY(1); }
          50% { transform: translateY(-50%) rotateY(-25deg) scaleX(0.7) scaleY(1.1); }
        }
        @keyframes flapRight {
          0%, 100% { transform: translateY(-50%) rotateY(0deg) scaleX(1) scaleY(1); }
          50% { transform: translateY(-50%) rotateY(25deg) scaleX(0.7) scaleY(1.1); }
        }
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes gentleSway {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(5px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.5); }
        }
      `}</style>
    </>
  );
}
