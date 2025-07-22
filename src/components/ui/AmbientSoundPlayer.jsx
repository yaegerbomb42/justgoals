import React, { useRef, useEffect, useState } from 'react';

const AmbientSoundPlayer = ({ 
  soundType = 'none', 
  volume = 0.5, 
  isActive = false
}) => {
  const audioRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [soundsAvailable, setSoundsAvailable] = useState(true);

  // Check if we're in production and sounds are available
  useEffect(() => {
    const checkSoundsAvailability = async () => {
      try {
        // Test if a known sound file exists
        const response = await fetch('/assets/sounds/rain.mp3', { method: 'HEAD' });
        setSoundsAvailable(response.ok);
      } catch (error) {
        console.log('Ambient sounds not available in this environment');
        setSoundsAvailable(false);
      }
    };

    checkSoundsAvailability();
  }, []);

  // Seamless blended sound files - one per category for infinite loop
  const soundLibrary = {
    rain: '/assets/sounds/rain.mp3',
    forest: '/assets/sounds/forest.mp3', 
    ocean: '/assets/sounds/ocean.mp3',
    cafe: '/assets/sounds/cafe.mp3',
    whitenoise: '/assets/sounds/whitenoise.mp3'
  };

  // Smooth volume transition function
  const smoothVolumeChange = (audio, targetVolume, duration = 1000) => {
    return new Promise((resolve) => {
      if (!audio) {
        resolve();
        return;
      }

      const startVolume = audio.volume;
      const volumeChange = targetVolume - startVolume;
      const steps = 20;
      const stepDuration = duration / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        audio.volume = Math.max(0, Math.min(1, startVolume + (volumeChange * progress)));
        
        if (currentStep >= steps) {
          clearInterval(interval);
          audio.volume = targetVolume;
          resolve();
        }
      }, stepDuration);
    });
  };

  // Initialize and control playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!soundsAvailable) {
      console.log('Ambient sounds not available in this environment');
      return;
    }

    if (!isActive || soundType === 'none' || !soundLibrary[soundType]) {
      // Stop audio with fade out
      if (!audio.paused) {
        smoothVolumeChange(audio, 0, 500).then(() => {
          audio.pause();
          audio.currentTime = 0;
        });
      }
      setIsInitialized(false);
      return;
    }

    // Start or change audio
    const soundFile = soundLibrary[soundType];
    
    if (audio.src !== soundFile || audio.paused) {
      audio.src = soundFile;
      audio.loop = true; // Enable seamless looping
      audio.volume = 0;
      
      audio.load();
      audio.play().then(() => {
        smoothVolumeChange(audio, volume, 1000);
        setIsInitialized(true);
      }).catch(error => {
        console.warn('Error starting ambient sound:', error);
        setSoundsAvailable(false);
      });
    } else {
      // Just adjust volume if already playing
      smoothVolumeChange(audio, volume, 500);
    }
  }, [isActive, soundType, volume, soundsAvailable]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  return (
    <div className="ambient-sound-player">
      <audio 
        ref={audioRef}
        preload="metadata"
        onError={(e) => {
          console.warn('Audio error:', e.target.error);
          // Don't show error message to user, just handle gracefully
        }}
      />
    </div>
  );
};

export default AmbientSoundPlayer;
