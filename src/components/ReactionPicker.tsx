import { Heart, Laugh, Frown, Angry, Sparkles, ThumbsUp } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface ReactionPickerProps {
  onReact: (reaction: string) => void;
  currentReaction?: string;
}

const reactions = [
  { type: "like", icon: ThumbsUp, label: "Thích", color: "text-primary" },
  { type: "love", icon: Heart, label: "Yêu thích", color: "text-red-500" },
  { type: "haha", icon: Laugh, label: "Haha", color: "text-yellow-500" },
  { type: "wow", icon: Sparkles, label: "Wow", color: "text-yellow-600" },
  { type: "sad", icon: Frown, label: "Buồn", color: "text-yellow-600" },
  { type: "angry", icon: Angry, label: "Phẫn nộ", color: "text-orange-600" },
];

const ReactionPicker = ({ onReact, currentReaction }: ReactionPickerProps) => {
  const CurrentIcon = reactions.find((r) => r.type === currentReaction)?.icon || ThumbsUp;
  const currentColor = reactions.find((r) => r.type === currentReaction)?.color || "text-muted-foreground";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${currentReaction ? currentColor : "text-muted-foreground"} hover:${currentColor}`}
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {currentReaction ? reactions.find((r) => r.type === currentReaction)?.label : "Thích"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {reactions.map((reaction) => {
            const Icon = reaction.icon;
            return (
              <Button
                key={reaction.type}
                variant="ghost"
                size="icon"
                className={`${reaction.color} hover:scale-125 transition-transform`}
                onClick={() => onReact(reaction.type)}
                title={reaction.label}
              >
                <Icon className="h-6 w-6" />
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReactionPicker;