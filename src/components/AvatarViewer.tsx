import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatarUrl: string | null;
  username: string;
  fullName?: string | null;
}

const AvatarViewer = ({ open, onOpenChange, avatarUrl, username, fullName }: AvatarViewerProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-background/95 backdrop-blur">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName || username}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Avatar className="h-64 w-64">
                <AvatarFallback className="bg-primary text-primary-foreground text-9xl">
                  {username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-6">
            <h3 className="text-xl font-semibold text-foreground">
              {fullName || username}
            </h3>
            <p className="text-muted-foreground">@{username}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarViewer;
