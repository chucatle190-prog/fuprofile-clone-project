import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import introVideo from "@/assets/intro-video.mov";

const Intro = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkip, setShowSkip] = useState(true);

  useEffect(() => {
    // Auto-play video
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log("Auto-play prevented:", err);
      });
    }
  }, []);

  const handleVideoEnd = () => {
    navigate("/auth");
  };

  const handleSkip = () => {
    navigate("/auth");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={introVideo}
        className="h-full w-full object-contain"
        onEnded={handleVideoEnd}
        playsInline
      />
      
      {showSkip && (
        <div className="absolute top-8 right-8">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="bg-background/80 backdrop-blur-sm"
          >
            Bỏ qua →
          </Button>
        </div>
      )}
    </div>
  );
};

export default Intro;
