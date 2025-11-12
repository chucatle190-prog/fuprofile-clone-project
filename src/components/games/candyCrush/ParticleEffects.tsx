import { useEffect, useState } from "react";

export type ParticleType = 'lightning' | 'rainbow' | 'wind' | 'stars' | 'ice';

interface Particle {
  id: string;
  x: number;
  y: number;
  type: ParticleType;
  timestamp: number;
}

interface ParticleEffectsProps {
  particles: Particle[];
}

export default function ParticleEffects({ particles }: ParticleEffectsProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {particles.map((particle) => (
        <ParticleAnimation key={particle.id} particle={particle} />
      ))}
    </div>
  );
}

function ParticleAnimation({ particle }: { particle: Particle }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const getParticleContent = () => {
    switch (particle.type) {
      case 'lightning':
        return (
          <div className="animate-ping">
            <div className="text-6xl">⚡</div>
            <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-50 blur-xl animate-pulse" />
          </div>
        );
      case 'rainbow':
        return (
          <div className="animate-bounce">
            <div className="text-6xl">🌈</div>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-ping"
                style={{
                  left: `${Math.cos((i / 8) * Math.PI * 2) * 50}px`,
                  top: `${Math.sin((i / 8) * Math.PI * 2) * 50}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                ✨
              </div>
            ))}
          </div>
        );
      case 'wind':
        return (
          <div className="animate-spin">
            <div className="text-6xl">🌪️</div>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute text-xl opacity-70"
                style={{
                  left: `${Math.cos((i / 12) * Math.PI * 2) * 40}px`,
                  top: `${Math.sin((i / 12) * Math.PI * 2) * 40}px`,
                  animation: `spin 1s linear infinite`,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                💨
              </div>
            ))}
          </div>
        );
      case 'stars':
        return (
          <div>
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute text-3xl animate-bounce"
                style={{
                  left: `${Math.random() * 100 - 50}px`,
                  top: `${Math.random() * 100 - 50}px`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              >
                ⭐
              </div>
            ))}
          </div>
        );
      case 'ice':
        return (
          <div>
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-ping"
                style={{
                  left: `${(Math.random() - 0.5) * 100}px`,
                  top: `${(Math.random() - 0.5) * 100}px`,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                ❄️
              </div>
            ))}
            <div className="absolute inset-0 bg-blue-400 rounded-full opacity-30 blur-2xl animate-pulse" />
          </div>
        );
    }
  };

  return (
    <div
      className="absolute animate-fade-out"
      style={{
        left: particle.x,
        top: particle.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {getParticleContent()}
    </div>
  );
}
