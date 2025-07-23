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
        // Test multiple sound formats and sources with better error handling
        const testUrls = [
          '/assets/sounds/rain.mp3',
          './assets/sounds/rain.mp3',
          'assets/sounds/rain.mp3',
          // Fallback to different sound files if rain doesn't exist
          '/assets/sounds/forest.mp3',
          '/assets/sounds/ocean.mp3'
        ];
        
        let available = false;
        let workingUrl = null;
        
        for (const url of testUrls) {
          try {
            const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
            if (response.ok && response.headers.get('content-type')?.includes('audio')) {
              available = true;
              workingUrl = url;
              break;
            }
          } catch (e) {
            // Continue to next URL - this is expected in many cases
            continue;
          }
        }
        
        if (!available) {
          // Try alternative check - load a small portion of audio
          try {
            const audio = new Audio();
            audio.preload = 'none';
            audio.src = '/assets/sounds/rain.mp3';
            
            const canPlayPromise = new Promise((resolve) => {
              const timeout = setTimeout(() => resolve(false), 3000);
              audio.addEventListener('canplaythrough', () => {
                clearTimeout(timeout);
                resolve(true);
              }, { once: true });
              audio.addEventListener('error', () => {
                clearTimeout(timeout);
                resolve(false);
              }, { once: true });
            });
            
            audio.load();
            available = await canPlayPromise;
          } catch (e) {
            console.info('Ambient sounds not available - using silent mode');
          }
        }
        
        if (!available) {
          console.info('Ambient sounds not available in this environment - using silent mode');
        } else {
          console.info('Ambient sounds available:', workingUrl || 'default location');
        }
        setSoundsAvailable(available);
      } catch (error) {
        console.info('Ambient sounds not available in this environment - using fallback mode');
        setSoundsAvailable(false);
      }
    };

    checkSoundsAvailability();
  }, []);

  // Enhanced sound library with fallback options
  const soundLibrary = {
    rain: ['/assets/sounds/rain.mp3', './assets/sounds/rain.mp3', 'assets/sounds/rain.mp3'],
    forest: ['/assets/sounds/forest.mp3', './assets/sounds/forest.mp3', 'assets/sounds/forest.mp3'], 
    ocean: ['/assets/sounds/ocean.mp3', './assets/sounds/ocean.mp3', 'assets/sounds/ocean.mp3'],
    cafe: ['/assets/sounds/cafe.mp3', './assets/sounds/cafe.mp3', 'assets/sounds/cafe.mp3'],
    whitenoise: ['/assets/sounds/whitenoise.mp3', './assets/sounds/whitenoise.mp3', 'assets/sounds/whitenoise.mp3']
  };

  // Function to get working sound URL with fallbacks
  const getWorkingSoundUrl = async (soundType) => {
    if (!soundLibrary[soundType]) return null;
    
    const urls = soundLibrary[soundType];
    for (const url of urls) {
      try {
        const response = await fetch(url, { method: 'HEAD', timeout: 3000 });
        if (response.ok) {
          return url;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Return first URL as fallback even if check failed
    return urls[0];
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

  // Initialize and control playback with enhanced error handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!soundsAvailable) {
      console.log('Ambient sounds not available in this environment');
      // Stop playback and mark as not initialized
      if (!audio.paused) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {
          // Ignore errors when stopping audio
        }
      }
      setIsInitialized(false);
      return;
    }

    if (!isActive || soundType === 'none' || !soundLibrary[soundType]) {
      // Stop audio with fade out
      if (!audio.paused) {
        try {
          smoothVolumeChange(audio, 0, 500).then(() => {
            audio.pause();
            audio.currentTime = 0;
          }).catch(() => {
            // Fallback: immediate stop
            audio.pause();
            audio.currentTime = 0;
          });
        } catch (error) {
          console.warn('Error stopping ambient sound:', error);
        }
      }
      setIsInitialized(false);
      return;
    }

    // Enhanced audio setup with fallbacks
    const setupAudio = async () => {
      try {
        const soundUrl = await getWorkingSoundUrl(soundType);
        if (!soundUrl) {
          console.warn('No working sound URL found for:', soundType);
          setSoundsAvailable(false);
          return;
        }

        // Check if we need to load new audio source
        if (audio.src !== soundUrl || audio.paused) {
          audio.src = soundUrl;
          audio.loop = true; // Enable seamless looping
          audio.volume = 0;
          audio.preload = 'auto';
          
          // Add error handlers before loading
          const handleError = (e) => {
            console.warn('Audio error for', soundType, ':', e.target?.error?.message || 'Unknown error');
            tryFallbackSound();
          };
          
          const tryFallbackSound = async () => {
            try {
              // Try other sound types as fallback
              const fallbackTypes = ['rain', 'forest', 'ocean', 'whitenoise'].filter(t => t !== soundType);
              for (const fallback of fallbackTypes) {
                const fallbackUrl = await getWorkingSoundUrl(fallback);
                if (fallbackUrl) {
                  console.log('Falling back to:', fallback);
                  audio.src = fallbackUrl;
                  audio.load();
                  return;
                }
              }
              console.warn('No fallback sounds available');
              setSoundsAvailable(false);
            } catch (error) {
              console.warn('Error in fallback sound setup:', error);
              setSoundsAvailable(false);
            }
          };
          
          audio.addEventListener('error', handleError, { once: true });
          audio.load();
        }

        // Chrome autoplay policy compliance - play only after user interaction
        const playAudio = () => {
          audio.play().then(() => {
            smoothVolumeChange(audio, volume, 1000);
            setIsInitialized(true);
          }).catch(error => {
            console.warn('Error starting ambient sound:', error.message);
            // If autoplay is blocked, try to enable on user interaction
            if (error.name === 'NotAllowedError' || error.message.includes('interact')) {
              console.log('Audio autoplay blocked. Will start on next user interaction.');
              // Set up one-time interaction listeners to enable audio
              const enableAudio = () => {
                audio.play().then(() => {
                  smoothVolumeChange(audio, volume, 1000);
                  setIsInitialized(true);
                }).catch(e => {
                  console.warn('Still unable to play audio after interaction:', e.message);
                  setSoundsAvailable(false);
                });
                document.removeEventListener('click', enableAudio);
                document.removeEventListener('keydown', enableAudio);
                document.removeEventListener('touchstart', enableAudio);
              };
              document.addEventListener('click', enableAudio, { once: true });
              document.addEventListener('keydown', enableAudio, { once: true });
              document.addEventListener('touchstart', enableAudio, { once: true });
            } else if (error.name === 'NotSupportedError') {
              console.warn('Audio format not supported in this environment');
              setSoundsAvailable(false);
            } else {
              console.warn('Audio playback failed, trying fallback');
              // Try fallback sounds if main sound fails
              tryFallbackSound();
            }
          });
        };
        
        playAudio();
      } catch (error) {
        console.warn('Error setting up audio:', error);
        setSoundsAvailable(false);
      }
    };

    setupAudio();
  }, [isActive, soundType, volume, soundsAvailable]);

  // Volume adjustment effect for when audio is already playing
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused && isInitialized) {
      smoothVolumeChange(audio, volume, 500);
    }
  }, [volume, isInitialized]);

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
