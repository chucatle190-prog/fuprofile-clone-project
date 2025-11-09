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
  const signalingReadyRef = useRef(false);
  const { toast } = useToast();

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const setupSignaling = useCallback(() => {
    console.log('Setting up signaling channel for conversation:', conversationId);
    
    signalingChannel.current = supabase
      .channel(`call:${conversationId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        console.log('Received offer:', payload);
        if (payload.from === currentUserId) return;
        
        setCallState('ringing');
        setCallType(payload.callType);
        
        // Store offer to process after user accepts
        signalingChannel.current.offer = payload.offer;
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        console.log('Received answer:', payload);
        if (payload.from === currentUserId || !peerConnection.current) return;
        
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(payload.answer)
        );
        setCallState('connected');
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        console.log('Received ICE candidate:', payload);
        if (payload.from === currentUserId || !peerConnection.current) return;
        
        if (payload.candidate) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(payload.candidate)
          );
        }
      })
      .on('broadcast', { event: 'end-call' }, ({ payload }) => {
        console.log('Received end-call:', payload);
        if (payload.from === currentUserId) return;
        endCall();
      })
      .subscribe((status) => {
        console.log('Signaling channel status:', status);
        if (status === 'SUBSCRIBED') signalingReadyRef.current = true;
      });
  }, [conversationId, currentUserId]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
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

  const ensureSignalingReady = async () => {
    if (signalingReadyRef.current) return;
    console.log('Waiting for signaling channel to be ready...');
    const start = Date.now();
    while (!signalingReadyRef.current && Date.now() - start < 5000) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!signalingReadyRef.current) {
      throw new Error('Kênh tín hiệu chưa sẵn sàng. Vui lòng thử lại sau.');
    }
  };

  const startCall = async (type: CallType) => {
    try {
      console.log('Starting call, type:', type);
      await ensureSignalingReady();
      setCallType(type);
      setCallState('calling');

      console.log('Requesting media permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      console.log('Media stream obtained:', stream);

      setLocalStream(stream);

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => {
        console.log('Adding track:', track.kind);
        pc.addTrack(track, stream);
      });

      console.log('Creating offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('Offer created, sending...');

      await signalingChannel.current?.send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          offer,
          callType: type,
          from: currentUserId,
        },
      });
      console.log('Offer sent successfully');
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể bắt đầu cuộc gọi',
        variant: 'destructive',
      });
      setCallState('idle');
    }
  };

  const acceptCall = async () => {
    try {
      console.log('Accepting call...');
      await ensureSignalingReady();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      console.log('Media stream obtained for answer');

      setLocalStream(stream);

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = signalingChannel.current.offer;
      console.log('Setting remote description from stored offer');
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      console.log('Creating answer...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('Sending answer...');
      await signalingChannel.current?.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          answer,
          from: currentUserId,
        },
      });

      setCallState('connected');
      console.log('Call accepted successfully');
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể chấp nhận cuộc gọi',
        variant: 'destructive',
      });
      endCall();
    }
  };

  const rejectCall = () => {
    console.log('Rejecting call');
    signalingChannel.current?.send({
      type: 'broadcast',
      event: 'end-call',
      payload: { from: currentUserId },
    });
    endCall();
  };

  const endCall = useCallback(() => {
    console.log('Ending call');
    localStream?.getTracks().forEach((track) => {
      console.log('Stopping local track:', track.kind);
      track.stop();
    });
    remoteStream?.getTracks().forEach((track) => {
      console.log('Stopping remote track:', track.kind);
      track.stop();
    });
    
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
