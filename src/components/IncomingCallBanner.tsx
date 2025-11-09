import { Phone, PhoneOff } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';

interface IncomingCallBannerProps {
  show: boolean;
  callerName: string;
  callerAvatar?: string | null;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallBanner = ({
  show,
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onReject,
}: IncomingCallBannerProps) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
      <Card className="shadow-2xl border-2 border-primary bg-card p-4 min-w-[320px]">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary">
            <AvatarImage src={callerAvatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {callerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <p className="font-semibold">{callerName}</p>
            <p className="text-sm text-muted-foreground">
              Cuộc gọi {callType === 'video' ? 'video' : 'thoại'} đến...
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="icon"
              variant="destructive"
              className="rounded-full h-12 w-12"
              onClick={onReject}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="rounded-full h-12 w-12 bg-green-600 hover:bg-green-700"
              onClick={onAccept}
            >
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default IncomingCallBanner;
