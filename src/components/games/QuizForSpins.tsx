import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

interface QuizForSpinsProps {
  groupId: string;
  userId: string;
  onComplete: () => void;
}

const QUESTIONS = [
  {
    id: 1,
    question: "Bạn là em bé Angel phải không?",
    options: ["Có", "Không"],
    correctAnswer: "Có",
  },
  {
    id: 2,
    question: "Cha vũ trụ là tất cả đúng không?",
    options: ["Có", "Không"],
    correctAnswer: "Có",
  },
  {
    id: 3,
    question: "Bạn có muốn đi theo Cha và Bé Ly suốt đời không?",
    options: ["Có", "Không"],
    correctAnswer: "Có",
  },
];

const QuizForSpins = ({ groupId, userId, onComplete }: QuizForSpinsProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      checkAnswers();
    }
  };

  const checkAnswers = async () => {
    const allCorrect = QUESTIONS.every(
      (q) => answers[q.id - 1] === q.correctAnswer
    );

    if (!allCorrect) {
      toast.error("❌ Câu trả lời chưa đúng! Hãy thử lại.");
      setAnswers({});
      setCurrentQuestion(0);
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user already completed quiz today
      const { data: existingCompletion } = await supabase
        .from("quiz_completions")
        .select("*")
        .eq("user_id", userId)
        .eq("group_id", groupId)
        .eq("completion_date", new Date().toISOString().split("T")[0])
        .maybeSingle();

      if (existingCompletion) {
        toast.warning("Bạn đã hoàn thành quiz hôm nay rồi! Quay lại vào ngày mai nhé.");
        setIsSubmitting(false);
        return;
      }

      // Award spins
      const { error: quizError } = await supabase
        .from("quiz_completions")
        .insert({
          user_id: userId,
          group_id: groupId,
          spins_awarded: 3,
        });

      if (quizError) throw quizError;

      // Update user spins
      const { data: existingSpins } = await supabase
        .from("user_game_spins")
        .select("*")
        .eq("user_id", userId)
        .eq("group_id", groupId)
        .maybeSingle();

      if (existingSpins) {
        await supabase
          .from("user_game_spins")
          .update({
            remaining_spins: existingSpins.remaining_spins + 3,
          })
          .eq("id", existingSpins.id);
      } else {
        await supabase.from("user_game_spins").insert({
          user_id: userId,
          group_id: groupId,
          remaining_spins: 8, // 5 default + 3 from quiz
        });
      }

      // Update level and experience
      const { data: userLevel } = await supabase
        .from("user_levels")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const newXP = (userLevel?.experience_points || 0) + 50;
      const newLevel = Math.floor(newXP / 100) + 1;

      if (userLevel) {
        await supabase
          .from("user_levels")
          .update({
            experience_points: newXP,
            level: newLevel,
          })
          .eq("id", userLevel.id);
      } else {
        await supabase.from("user_levels").insert({
          user_id: userId,
          experience_points: newXP,
          level: newLevel,
        });
      }

      // Check for new badges
      await checkAndAwardBadges(userId);

      setShowResults(true);
      toast.success("🎉 Chúc mừng! Bạn nhận được 3 lượt quay!");
      
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error("Error completing quiz:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkAndAwardBadges = async (userId: string) => {
    // Check quiz count for badges
    const { data: quizCount } = await supabase
      .from("quiz_completions")
      .select("id", { count: "exact" })
      .eq("user_id", userId);

    const count = quizCount?.length || 0;

    // Get all badges
    const { data: allBadges } = await supabase
      .from("badges")
      .select("*")
      .eq("requirement_type", "quiz");

    if (!allBadges) return;

    // Award badges based on quiz count
    for (const badge of allBadges) {
      if (count >= badge.requirement_value) {
        const { data: existingBadge } = await supabase
          .from("user_badges")
          .select("*")
          .eq("user_id", userId)
          .eq("badge_id", badge.id)
          .maybeSingle();

        if (!existingBadge) {
          await supabase.from("user_badges").insert({
            user_id: userId,
            badge_id: badge.id,
          });
          toast.success(`🏆 Bạn nhận được huy hiệu: ${badge.icon} ${badge.name}!`);
        }
      }
    }
  };

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  if (showResults) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h3 className="text-2xl font-bold">Hoàn thành!</h3>
          <p className="text-muted-foreground">
            Bạn đã trả lời đúng tất cả các câu hỏi
          </p>
          <div className="p-4 bg-primary/10 rounded-lg">
            <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-bold text-lg">+3 lượt quay</p>
            <p className="text-sm text-muted-foreground">+50 kinh nghiệm</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Câu hỏi {currentQuestion + 1}/{QUESTIONS.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">{question.question}</h3>

          <RadioGroup
            value={answers[currentQuestion]}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:border-primary transition-colors cursor-pointer"
              >
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex-1 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion] || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting
            ? "Đang xử lý..."
            : currentQuestion === QUESTIONS.length - 1
            ? "Hoàn thành"
            : "Tiếp theo"}
        </Button>
      </div>
    </Card>
  );
};

export default QuizForSpins;
