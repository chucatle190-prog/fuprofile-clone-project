import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseWebRTCProps {
  conversationId: string;
  currentUserId: string;
  onCallEnd?: () => void;
}

export type CallType = 'audio' | 'video';
export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export const useWebRTC = ({ conversationId, currentUserId, onCallEnd }: UseWebRTCProps) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const signalingChannel = useRef<any>(null);
  const { toast } = useToast();

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const setupSignaling = useCallback(() => {
    signalingChannel.current = supabase
      .channel(`call:${conversationId}`)
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.from === currentUserId) return;
        
        setCallState('ringing');
        setCallType(payload.callType);
        
        // Store offer to process after user accepts
        signalingChannel.current.offer = payload.offer;
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.from === currentUserId || !peerConnection.current) return;
        
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(payload.answer)
        );
        setCallState('connected');
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.from === currentUserId || !peerConnection.current) return;
        
        if (payload.candidate) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(payload.candidate)
          );
        }
      })
      .on('broadcast', { event: 'end-call' }, ({ payload }) => {
        if (payload.from === currentUserId) return;
        endCall();
      })
      .subscribe();
  }, [conversationId, currentUserId]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingChannel.current?.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            from: currentUserId,
          },
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [currentUserId]);

  const startCall = async (type: CallType) => {
    try {
      setCallType(type);
      setCallState('calling');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      setLocalStream(stream);

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await signalingChannel.current?.send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          offer,
          callType: type,
          from: currentUserId,
        },
      });
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể bắt đầu cuộc gọi',
        variant: 'destructive',
      });
      setCallState('idle');
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      setLocalStream(stream);

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = signalingChannel.current.offer;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await signalingChannel.current?.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          answer,
          from: currentUserId,
        },
      });

      setCallState('connected');
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể chấp nhận cuộc gọi',
        variant: 'destructive',
      });
      endCall();
    }
  };

  const rejectCall = () => {
    signalingChannel.current?.send({
      type: 'broadcast',
      event: 'end-call',
      payload: { from: currentUserId },
    });
    endCall();
  };

  const endCall = useCallback(() => {
    localStream?.getTracks().forEach((track) => track.stop());
    remoteStream?.getTracks().forEach((track) => track.stop());
    
    peerConnection.current?.close();
    peerConnection.current = null;
    
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    
    onCallEnd?.();
  }, [localStream, remoteStream, onCallEnd]);

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  useEffect(() => {
    setupSignaling();

    return () => {
      endCall();
      signalingChannel.current?.unsubscribe();
    };
  }, [setupSignaling, endCall]);

  return {
    callState,
    callType,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
};
