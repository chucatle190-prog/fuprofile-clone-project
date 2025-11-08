import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import CreateStoryDialog from "./CreateStoryDialog";
import StoryViewer from "./StoryViewer";

interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  music_name?: string | null;
  music_artist?: string | null;
  music_url?: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
}

interface GroupedStories {
  user_id: string;
  username: string;
  avatar_url: string | null;
  full_name: string | null;
  stories: Story[];
}

interface StoryCarouselProps {
  currentUserId?: string;
}

const StoryCarousel = ({ currentUserId }: StoryCarouselProps) => {
  const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);
  const [myStories, setMyStories] = useState<GroupedStories | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStories, setSelectedStories] = useState<Story[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetchStories();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories'
        },
        () => {
          fetchStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchStories = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        profiles!user_id (username, avatar_url, full_name)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      // Group stories by user
      const grouped = data.reduce((acc: GroupedStories[], story: any) => {
        const existing = acc.find(g => g.user_id === story.user_id);
        if (existing) {
          existing.stories.push(story);
        } else {
          acc.push({
            user_id: story.user_id,
            username: story.profiles.username,
            avatar_url: story.profiles.avatar_url,
            full_name: story.profiles.full_name,
            stories: [story],
          });
        }
        return acc;
      }, []);

      // Separate current user's stories from others
      const myStoriesGroup = grouped.find(g => g.user_id === currentUserId);
      const otherStories = grouped.filter(g => g.user_id !== currentUserId);
      
      setMyStories(myStoriesGroup || null);
      setGroupedStories(otherStories);
    }
  };

  const handleStoryClick = (group: GroupedStories) => {
    setSelectedStories(group.stories);
    setSelectedIndex(0);
    setViewerOpen(true);
  };

  return (
    <>
      <Card className="p-4 mb-4 shadow-soft">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {/* Your Story / Create Story */}
          <div className="flex-shrink-0">
            {myStories ? (
              <button
                onClick={() => handleStoryClick(myStories)}
                className="relative w-28 h-44 rounded-lg overflow-hidden group"
              >
                <img
                  src={myStories.stories[0].image_url}
                  alt="Your story"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
                <div className="absolute top-2 left-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-accent to-primary p-0.5">
                    <Avatar className="w-full h-full border-2 border-card">
                      <AvatarImage src={myStories.avatar_url || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {myStories.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-medium text-white drop-shadow-lg truncate">
                    Tin của bạn
                  </p>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="relative w-28 h-44 rounded-lg overflow-hidden bg-secondary hover:bg-secondary/80 transition-colors border border-border"
              >
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
            )}
          </div>

          {/* Other Users' Story Items */}
          {groupedStories.map((group) => (
            <div key={group.user_id} className="flex-shrink-0">
              <button
                onClick={() => handleStoryClick(group)}
                className="relative w-28 h-44 rounded-lg overflow-hidden group"
              >
                <img
                  src={group.stories[0].image_url}
                  alt={group.username}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
                <div className="absolute top-2 left-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-accent to-primary p-0.5">
                    <Avatar className="w-full h-full border-2 border-card">
                      <AvatarImage src={group.avatar_url || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {group.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs font-medium text-white drop-shadow-lg truncate">
                    {group.full_name || group.username}
                  </p>
                </div>
              </button>
            </div>
          ))}
        </div>
      </Card>

      {currentUserId && (
        <CreateStoryDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          userId={currentUserId}
          onStoryCreated={fetchStories}
        />
      )}

      {viewerOpen && (
        <StoryViewer
          stories={selectedStories}
          initialIndex={selectedIndex}
          onClose={() => setViewerOpen(false)}
          currentUserId={currentUserId}
          onStoryDelete={fetchStories}
        />
      )}
    </>
  );
};

export default StoryCarousel;