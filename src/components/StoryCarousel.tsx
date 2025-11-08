import { Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";

const StoryCarousel = () => {
  const stories = [
    { id: 1, username: "user1", hasStory: true },
    { id: 2, username: "user2", hasStory: true },
    { id: 3, username: "user3", hasStory: true },
    { id: 4, username: "user4", hasStory: true },
  ];

  return (
    <Card className="p-4 mb-4 shadow-soft">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {/* Create Story */}
        <div className="flex-shrink-0">
          <button className="relative w-28 h-44 rounded-lg overflow-hidden bg-secondary hover:bg-secondary/80 transition-colors border border-border">
            <div className="h-32 bg-gradient-to-b from-secondary to-background"></div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-4 border-card">
                <Plus className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <p className="text-xs font-medium px-1">Tạo tin</p>
            </div>
          </button>
        </div>

        {/* Story Items */}
        {stories.map((story) => (
          <div key={story.id} className="flex-shrink-0">
            <button className="relative w-28 h-44 rounded-lg overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background"></div>
              <div className="absolute top-2 left-2">
                <div className="w-10 h-10 rounded-full bg-primary p-0.5">
                  <Avatar className="w-full h-full border-2 border-card">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {story.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-xs font-medium text-white drop-shadow-lg">
                  {story.username}
                </p>
              </div>
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default StoryCarousel;