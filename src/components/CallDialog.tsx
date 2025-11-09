import { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { CallState, CallType } from '@/hooks/useWebRTC';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CallDialogProps {
  open: boolean;
  callState: CallState;
  callType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  otherUser: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

const CallDialog = ({
  open,
  callState,
  callType,
  localStream,
  remoteStream,
  otherUser,
  onAccept,
  onReject,
  onEnd,
  onToggleAudio,
  onToggleVideo,
}: CallDialogProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const displayName = otherUser?.full_name || otherUser?.username || 'Người dùng';

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onEnd()}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="relative w-full h-[500px] bg-background flex flex-col">
          {/* Video area */}
          <div className="flex-1 relative bg-muted">
            {callType === 'video' && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={otherUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-xl font-semibold">{displayName}</h3>
                  <p className="text-muted-foreground">
                    {callState === 'calling' && 'Đang gọi...'}
                    {callState === 'ringing' && 'Cuộc gọi đến'}
                    {callState === 'connected' && 'Đang kết nối'}
                  </p>
                </div>
              </div>
            )}

            {/* Local video preview (when in video call) */}
            {callType === 'video' && localStream && callState === 'connected' && (
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-6 flex items-center justify-center gap-4">
            {callState === 'ringing' ? (
              <>
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full h-14 w-14"
                  onClick={onReject}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
                  onClick={onAccept}
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 w-12"
                  onClick={onToggleAudio}
                >
                  {localStream?.getAudioTracks()[0]?.enabled ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                </Button>

                {callType === 'video' && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full h-12 w-12"
                    onClick={onToggleVideo}
                  >
                    {localStream?.getVideoTracks()[0]?.enabled ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <VideoOff className="h-5 w-5" />
                    )}
                  </Button>
                )}

                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full h-14 w-14"
                  onClick={onEnd}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallDialog;
