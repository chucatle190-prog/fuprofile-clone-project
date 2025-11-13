import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import introVideo from "@/assets/intro-video.mov";
import logoAnimated from "@/assets/logo-animated.mp4";

const Intro = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkip, setShowSkip] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Auto-play video
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log("Auto-play prevented:", err);
      });
    }
  }, []);

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

  return (
    <div className={`relative h-screen w-screen overflow-hidden bg-black transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <video
        ref={videoRef}
        src={introVideo}
        className="h-full w-full object-contain"
        onEnded={handleVideoEnd}
        playsInline
      />
      
      {/* Logo & Text Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <video
            src={logoAnimated}
            autoPlay
            loop
            muted
            playsInline
            className="w-32 h-32 object-contain drop-shadow-[0_0_30px_rgba(234,179,8,0.6)]"
          />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[hsl(142,70%,45%)] to-[hsl(45,93%,47%)] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">
            FUN Profile
          </h1>
        </div>
      </div>
      
      {showSkip && (
        <div className="absolute top-8 right-8 animate-fade-in">
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
