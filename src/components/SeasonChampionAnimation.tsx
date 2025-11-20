import { useEffect, useState } from "react";
import { Trophy, Award, Medal } from "lucide-react";
import { Confetti } from "@/components/games/Confetti";

interface SeasonChampionAnimationProps {
  rank: number;
  category: "holder" | "receiver" | "sender";
  season: number;
  onComplete: () => void;
}

const SeasonChampionAnimation = ({ rank, category, season, onComplete }: SeasonChampionAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    // Play celebration sound
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3");
    audio.volume = 0.5;
    audio.play().catch(console.error);

    const timer = setTimeout(() => {
      setShowAnimation(false);
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(timer);
      audio.pause();
    };
  }, [onComplete]);

  if (!showAnimation) return null;

  const getRankTitle = (rank: number) => {
    if (rank === 1) return "Quán quân";
    if (rank === 2) return "Á vua";
    if (rank === 3) return "Á quân";
    return "";
  };

  const getCategoryTitle = (category: string) => {
    if (category === 'holder') return "Giữ CAMLY";
    if (category === 'receiver') return "Nhận CAMLY";
    if (category === 'sender') return "Chuyển CAMLY";
    return "";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-24 h-24" />;
    if (rank === 2) return <Award className="w-20 h-20" />;
    if (rank === 3) return <Medal className="w-20 h-20" />;
    return null;
  };

  const getRankStyles = (rank: number) => {
    if (rank === 1) {
      return "from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900";
    }
    if (rank === 2) {
      return "from-gray-300 via-gray-400 to-gray-500 text-gray-900";
    }
    if (rank === 3) {
      return "from-orange-400 via-orange-500 to-orange-600 text-orange-900";
    }
    return "";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <Confetti active={true} />
      
      <div className="relative">
        {/* Main card */}
        <div className={`
          relative
          bg-gradient-to-br ${getRankStyles(rank)}
          p-8 rounded-3xl shadow-2xl
          border-4 border-white/50
          max-w-md w-full mx-4
          animate-scale-in
        `}>
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-pulse rounded-3xl" />
          
          {/* Content */}
          <div className="relative z-10 text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center animate-bounce">
              <div className="bg-white/90 rounded-full p-6 shadow-2xl">
                {getRankIcon(rank)}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-4xl font-black drop-shadow-lg animate-pulse">
                🎉 CHÚC MỪNG! 🎉
              </h2>
              <p className="text-2xl font-bold drop-shadow-md">
                Bạn đã đạt danh hiệu
              </p>
              <p className="text-3xl font-black drop-shadow-lg">
                {getRankTitle(rank).toUpperCase()}
              </p>
            </div>

            {/* Details */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 space-y-2">
              <p className="text-xl font-bold">Mùa {season}</p>
              <p className="text-lg font-semibold">{getCategoryTitle(category)}</p>
            </div>

            {/* Message */}
            <div className="bg-white/90 rounded-xl p-4">
              <p className="text-base font-medium text-gray-800 leading-relaxed">
                {rank === 1 && category === 'holder' && "🏆 Wow! Bạn là Vua CAMLY! Tỷ phú hàng đầu của mùa giải!"}
                {rank === 1 && category === 'receiver' && "💝 Chúc mừng! Bạn là người nhận được yêu thương nhiều nhất!"}
                {rank === 1 && category === 'sender' && "💖 Tuyệt vời! Bạn là đại sứ tình yêu thương của mùa giải!"}
                {rank === 2 && "🥈 Xuất sắc! Bạn đã chinh phục vị trí Á vua!"}
                {rank === 3 && "🥉 Tuyệt vời! Bạn đã đạt danh hiệu Á quân!"}
              </p>
            </div>
          </div>

          {/* Sparkles */}
          <div className="absolute -top-4 -left-4 text-4xl animate-bounce">✨</div>
          <div className="absolute -top-4 -right-4 text-4xl animate-bounce delay-100">✨</div>
          <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce delay-200">⭐</div>
          <div className="absolute -bottom-4 -right-4 text-4xl animate-bounce delay-300">⭐</div>
        </div>
      </div>
    </div>
  );
};

export default SeasonChampionAnimation;