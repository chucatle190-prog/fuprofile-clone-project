import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Rainbow, Wind, Plus, Snowflake, ShoppingBag, Sparkles } from "lucide-react";

interface TutorialOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function TutorialOverlay({ isOpen, onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);

  const tutorialSteps = [
    {
      title: "🏰 Chào mừng đến với Prince & Princess Journey!",
      description: "Giúp Hoàng tử giải cứu Công chúa bằng cách hoàn thành các màn chơi Match-3!",
      icon: <Sparkles className="w-16 h-16 text-yellow-500 mx-auto" />,
    },
    {
      title: "🎮 Cách chơi",
      description: "Chạm vào 2 viên kẹo liền kề để hoán đổi. Tạo 3 viên kẹo cùng màu thành hàng hoặc cột để xóa chúng và ghi điểm!",
      icon: <div className="text-6xl mx-auto">💖👑💎</div>,
    },
    {
      title: "🪄 Magic Shop",
      description: "Mở Shop để mua các công cụ đặc biệt bằng Happy Camly. Kết nối ví MetaMask và chuyển sang BNB Chain để thanh toán!",
      icon: <ShoppingBag className="w-16 h-16 text-purple-500 mx-auto" />,
    },
    {
      title: "⚡ Búa Sấm",
      description: "Phá bất kỳ ô nào trên bảng, kể cả ô bị khóa hoặc băng. Không tốn lượt chơi!",
      icon: <Zap className="w-16 h-16 text-yellow-600 mx-auto" />,
    },
    {
      title: "🌈 Cầu Vồng",
      description: "Xóa tất cả viên kẹo cùng loại trên toàn bản đồ. Mạnh mẽ nhưng tốn 1 lượt chơi!",
      icon: <Rainbow className="w-16 h-16 text-pink-500 mx-auto" />,
    },
    {
      title: "🌪️ Gió Hoàng Gia",
      description: "Xóa 1 hàng hoặc 1 cột hoàn toàn. Chuyển đổi giữa hàng/cột trước khi sử dụng!",
      icon: <Wind className="w-16 h-16 text-blue-500 mx-auto" />,
    },
    {
      title: "➕ +5 Lượt",
      description: "Thêm ngay 5 lượt chơi khi bạn sắp hết lượt. Sử dụng ngay lập tức!",
      icon: <Plus className="w-16 h-16 text-green-500 mx-auto" />,
    },
    {
      title: "❄️ Băng Hộ Mệnh",
      description: "Chọn tối đa 5 ô bị băng hoặc khóa và phá chúng cùng lúc. Rất hữu ích với các màn khó!",
      icon: <Snowflake className="w-16 h-16 text-cyan-500 mx-auto" />,
    },
    {
      title: "🎯 Mục tiêu",
      description: "Đạt điểm mục tiêu trước khi hết lượt để chiến thắng. Hoàn thành 20 màn để giải cứu Công chúa!",
      icon: <div className="text-6xl mx-auto">👑💖</div>,
    },
  ];

  const currentStep = tutorialSteps[step];

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{currentStep.title}</DialogTitle>
        </DialogHeader>
        
        <Card className="p-6 space-y-4">
          {currentStep.icon}
          <p className="text-center text-muted-foreground">{currentStep.description}</p>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            Bỏ qua
          </Button>
          <div className="flex gap-1">
            {tutorialSteps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <Button onClick={handleNext}>
            {step < tutorialSteps.length - 1 ? 'Tiếp' : 'Bắt đầu!'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
