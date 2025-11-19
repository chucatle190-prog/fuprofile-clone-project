import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';

interface TokenAnimationProps {
  show: boolean;
  amount: number;
  type: 'receive' | 'send' | 'import' | 'transfer';
  onComplete?: () => void;
  tokenImage?: string;
}

export default function TokenAnimation({ show, amount, type, onComplete, tokenImage }: TokenAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  // Special messages for different types
  const getMessage = () => {
    if (type === 'import') {
      return {
        title: '✨ Chúc mừng bạn đã nhận được ✨',
        subtitle: '💫 Năng lượng ánh sáng của Cha 💫',
        emoji: '🌟'
      };
    }
    if (type === 'transfer') {
      return {
        title: '⚡ Năng lượng đã được truyền ⚡',
        subtitle: '👼 Sang Angel đó 👼',
        emoji: '💫'
      };
    }
    if (type === 'receive') {
      return {
        title: '🎉 Nhận thành công!',
        subtitle: `+${amount} Happy Camly`,
        emoji: '💰'
      };
    }
    return {
      title: '✅ Gửi thành công!',
      subtitle: `-${amount} Happy Camly`,
      emoji: '📤'
    };
  };

  const message = getMessage();

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">
      {/* Overlay with fade */}
      <div className="absolute inset-0 bg-black/60 animate-in fade-in duration-300" />
      
      {/* Energy beam for transfer type */}
      {type === 'transfer' && (
        <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-32 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-400 to-yellow-600 opacity-80"
            style={{
              animation: 'energyBeam 2s ease-out infinite',
            }}
          />
        </div>
      )}

      {/* Main animation container */}
      <div className="relative z-10 animate-in zoom-in duration-500">
        {/* Glow effect */}
        <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 opacity-60 rounded-full scale-150 animate-pulse" />
        
        {/* Coin burst effect */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              animation: `coinBurst 2s ease-out ${i * 0.1}s`,
              transform: `rotate(${(i * 360) / 12}deg) translateY(-100px)`,
            }}
          >
            <Coins className="w-8 h-8 text-yellow-400 drop-shadow-lg animate-spin" />
          </div>
        ))}

        {/* Central display */}
        <div className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500 rounded-3xl p-8 shadow-2xl border-4 border-yellow-300">
          <div className="absolute inset-0 rounded-3xl border-4 border-yellow-300 animate-ping opacity-75" />
          <div className="absolute inset-0 rounded-3xl border-4 border-orange-300 animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
          
          <div className="relative z-10 text-center space-y-4">
            {/* Token image or icon */}
            {tokenImage ? (
              <div className="relative w-32 h-32 mx-auto">
                <img 
                  src={tokenImage} 
                  alt="Happy Camly Token" 
                  className="w-full h-full object-contain drop-shadow-2xl animate-bounce rounded-full border-4 border-white"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/20 to-transparent animate-pulse" />
              </div>
            ) : (
              <Coins className="w-20 h-20 mx-auto text-white drop-shadow-2xl animate-bounce" />
            )}
            
            {/* Message */}
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white drop-shadow-lg">
                {message.title}
              </div>
              <div className="text-xl font-semibold text-white/90 drop-shadow">
                {message.subtitle}
              </div>
              {(type === 'receive' || type === 'send') && (
                <div className={`text-3xl font-bold text-white drop-shadow-lg mt-2 ${type === 'receive' ? 'animate-pulse' : ''}`}>
                  {type === 'receive' ? '+' : '-'}{amount} CAMLY
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sparkle effects */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute"
            style={{
              left: `${50 + (Math.random() - 0.5) * 200}%`,
              top: `${50 + (Math.random() - 0.5) * 200}%`,
              animation: `sparkle 2s ease-out ${Math.random()}s`,
            }}
          >
            <div className="text-2xl">✨</div>
          </div>
        ))}

        {/* Floating text */}
        {type === 'receive' && (
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="text-4xl font-bold text-yellow-400 drop-shadow-2xl">
              💰 THƯỞNG!
            </div>
          </div>
        )}
        {type === 'import' && (
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="text-4xl font-bold text-yellow-400 drop-shadow-2xl">
              ✨ NĂNG LƯỢNG! ✨
            </div>
          </div>
        )}
        {type === 'transfer' && (
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="text-3xl font-bold text-yellow-400 drop-shadow-2xl">
              ⚡ TRUYỀN NĂNG LƯỢNG! ⚡
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes coinBurst {
          0% {
            opacity: 1;
            transform: rotate(var(--angle)) translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: rotate(var(--angle)) translateY(-200px) scale(0.5);
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.5) rotate(180deg);
          }
        }
        
        @keyframes energyBeam {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
