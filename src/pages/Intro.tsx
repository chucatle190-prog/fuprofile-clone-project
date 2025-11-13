import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import introVideo from "@/assets/intro-video.mov";
import logoAnimated from "@/assets/logo-animated.mp4";

const Intro = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkip, setShowSkip] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Try to auto-play video with sound first
    if (videoRef.current) {
      videoRef.current.muted = false; // Try with sound first
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log("Auto-play with sound prevented, trying muted:", err);
          // If autoplay with sound fails, fallback to muted
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(e => {
              console.error("Video play failed completely:", e);
              setVideoError(true);
              // Skip to auth after 2 seconds if video fails
              setTimeout(() => navigate("/auth"), 2000);
            });
          }
        });
      }
    }
  }, [navigate]);

  const handleVideoEnd = () => {
    setFadeOut(true);
    setTimeout(() => {
      navigate("/auth");
    }, 500);
  };

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(() => {
      navigate("/auth");
    }, 500);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={`relative h-screen w-screen overflow-hidden bg-black transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <video
        ref={videoRef}
        src={introVideo}
        className="h-full w-full object-contain"
        onEnded={handleVideoEnd}
        onError={(e) => {
          console.error("Video error:", e);
          setVideoError(true);
          setTimeout(() => navigate("/auth"), 2000);
        }}
        onLoadedData={() => console.log("Video loaded successfully")}
        playsInline
        preload="auto"
      />
      
      {/* Logo & Text Overlay */}
      <div className="absolute top-8 left-8 flex items-center gap-3 pointer-events-none animate-fade-in">
        <video
          src={logoAnimated}
          autoPlay
          loop
          muted
          playsInline
          className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]"
        />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(142,70%,45%)] to-[hsl(45,93%,47%)] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
          FUN Profile
        </h1>
      </div>
      
      {showSkip && (
        <div className="absolute top-8 right-8 flex gap-2 animate-fade-in">
          <Button
            onClick={toggleMute}
            variant="outline"
            size="icon"
            className="bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            onClick={handleSkip}
            variant="outline"
            className="bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all"
          >
            Bỏ qua →
          </Button>
        </div>
      )}
    </div>
  );
};

export default Intro;
