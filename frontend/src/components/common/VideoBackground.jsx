import React from 'react';

export const VideoBackground = () => {
  return (
    <div className="silk-video-container" aria-hidden="true">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="silk-video-element"
      >
        <source src="/silk.webm" type="video/webm" />
      </video>
      <div className="silk-video-overlay" />
    </div>
  );
};

export default VideoBackground;
