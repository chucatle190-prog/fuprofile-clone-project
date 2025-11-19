import { useEffect } from "react";

interface RankUpAnimationProps {
  show: boolean;
  category: 'holder' | 'receiver' | 'sender';
  rank: number;
  previousRank: number | null;
  type: 'up' | 'down'; // New: type of rank change
  onComplete?: () => void;
}

export default function RankUpAnimation({ 
  show, 
  category, 
  rank, 
  previousRank,
  type,
  onComplete 
}: RankUpAnimationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const getMessage = () => {
    // Rank down messages
    if (type === 'down') {
      if (category === 'holder') {
        return {
          title: "⚠️ Ai đó đã vượt qua bạn!",
          subtitle: `Bạn đã xuống từ hạng ${previousRank} xuống hạng ${rank}`,
          emoji: "😮",
          color: "from-red-400 via-orange-500 to-red-600"
        };
      } else if (category === 'receiver') {
        return {
          title: "⚠️ Ai đó đã nhận nhiều CAMLY hơn bạn!",
          subtitle: `Bạn đã xuống từ hạng ${previousRank} xuống hạng ${rank}`,
          emoji: "📉",
          color: "from-red-400 via-orange-500 to-red-600"
        };
      } else {
        return {
          title: "⚠️ Ai đó đã chuyển nhiều CAMLY hơn bạn!",
          subtitle: `Bạn đã xuống từ hạng ${previousRank} xuống hạng ${rank}`,
          emoji: "📊",
          color: "from-red-400 via-orange-500 to-red-600"
        };
      }
    }
    
    // Rank up messages (original logic)
    if (category === 'holder') {
      if (rank === 1) {
        return {
          title: "🎉 Wow bạn đã là tỷ phú hàng đầu!",
          subtitle: "Bạn có thể cho tôi một ít không 😊",
          emoji: "💰",
          color: "from-yellow-400 via-amber-500 to-yellow-600"
        };
      } else {
        return {
          title: "🎊 Wowwww bạn đã vượt qua tỷ phú đầu tiên!",
          subtitle: `Bạn đang ở hạng ${rank}`,
          emoji: "🚀",
          color: "from-yellow-400 via-amber-500 to-yellow-600"
        };
      }
    }
    
    if (category === 'receiver') {
      if (rank === 1) {
        return {
          title: "✨ Wow năng lượng yêu thương của bé thật tuyệt!",
          subtitle: "Bạn nhận nhiều CAMLY nhất",
          emoji: "💝",
          color: "from-yellow-400 via-amber-500 to-yellow-600"
        };
      } else {
        return {
          title: "🌟 Wow bạn vừa nhận token nhiều hơn một người!",
          subtitle: `Bạn đang ở hạng ${rank}`,
          emoji: "🎁",
          color: "from-yellow-400 via-amber-500 to-yellow-600"
        };
      }
    }
    
    if (category === 'sender') {
      if (rank === 1) {
        return {
          title: "👑 Wow bạn là một đại tỷ phú về lòng yêu thương thuần khiết!",
          subtitle: "Bạn chuyển nhiều CAMLY nhất",
          emoji: "💖",
          color: "from-yellow-400 via-amber-500 to-yellow-600"
        };
      } else {
        return {
          title: "💫 Wow dòng Camly coin của bạn chuyển đi đã nhiều hơn một người!",
          subtitle: `Bạn đang ở hạng ${rank}`,
          emoji: "🌊",
          color: "from-yellow-400 via-amber-500 to-yellow-600"
        };
      }
    }
    
    return { title: "", subtitle: "", emoji: "", color: "from-yellow-400 via-amber-500 to-yellow-600" };
  };

  const { title, subtitle, emoji, color } = getMessage();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Backdrop with fade */}
      <div 
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-500"
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Main content */}
      <div className="relative z-10 text-center animate-in zoom-in-95 duration-700 px-4 max-w-md">
        {/* Large emoji with bounce */}
        <div className="text-8xl mb-6 animate-in zoom-in duration-1000 animate-bounce">
          {emoji}
        </div>
        
        {/* Title with gradient */}
        <h2 className={`text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r ${color} bg-clip-text text-transparent drop-shadow-2xl animate-in slide-in-from-bottom-4 duration-700`}>
          {title}
        </h2>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-white font-bold drop-shadow-lg animate-in slide-in-from-bottom-3 duration-700 delay-200">
          {subtitle}
        </p>
        
        {/* Rank badge */}
        <div className={`mt-6 inline-block bg-gradient-to-br ${color} text-white px-8 py-3 rounded-full font-black text-2xl shadow-2xl animate-in zoom-in duration-700 delay-300`}>
          {type === 'down' ? '⬇️' : '⬆️'} TOP {rank}
        </div>
      </div>
      
      {/* Confetti effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            {['🎉', '⭐', '💫', '✨', '🌟'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>
      
      {/* Stars burst */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute top-1/2 left-1/2 text-4xl animate-star-burst"
            style={{
              transform: `rotate(${i * 30}deg)`,
              animationDelay: `${i * 0.1}s`,
            }}
          >
            ⭐
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes star-burst {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateX(200px) scale(1) rotate(360deg);
            opacity: 0;
          }
        }
        
        .animate-fall {
          animation: fall linear infinite;
        }
        
        .animate-star-burst {
          animation: star-burst 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
