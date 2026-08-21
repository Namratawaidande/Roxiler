import React, { useRef, useEffect } from 'react';
import './BackgroundVideo.css';

export const BackgroundVideo = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.85; // Elegant, smooth silk flow
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented by browser policy (safely handled)
        });
      }
    }
  }, []);

  return (
    <div className="bg-video-container" aria-hidden="true">
      <video
        ref={videoRef}
        className="bg-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="/silk.webm" type="video/webm" />
      </video>
      <div className="bg-video-overlay" />
    </div>
  );
};

export default BackgroundVideo;
