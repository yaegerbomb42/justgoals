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

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playlist, setPlaylist] = useState([]);

  // Initialize playlist when sound type changes
  useEffect(() => {
    if (soundType && soundType !== 'none' && soundLibrary[soundType]) {
      const shuffledPlaylist = [...soundLibrary[soundType]].sort(() => Math.random() - 0.5);
      setPlaylist(shuffledPlaylist);
      setCurrentTrackIndex(0);
      setIsInitialized(false);
    } else {
      setPlaylist([]);
    }
  }, [soundType]);

  // Smooth volume transition function
  const smoothVolumeChange = (audio, targetVolume, duration = 500) => {
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

  // Load and play next track with crossfade
  const playNextTrack = async () => {
    if (playlist.length === 0) return;

    const nextAudio = currentAudio === 1 ? audioRef2.current : audioRef1.current;
    const currentAudioRef = currentAudio === 1 ? audioRef1.current : audioRef2.current;
    
    if (!nextAudio) return;

    // Load next track
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    nextAudio.src = playlist[nextIndex];
    nextAudio.volume = 0;
    nextAudio.loop = false; // We'll handle looping manually

    try {
      await nextAudio.load();
      await nextAudio.play();

      // Crossfade between tracks
      const fadePromises = [];
      
      if (currentAudioRef && !currentAudioRef.paused) {
        fadePromises.push(smoothVolumeChange(currentAudioRef, 0, crossfadeDuration));
      }
      
      fadePromises.push(smoothVolumeChange(nextAudio, volume, crossfadeDuration));

      await Promise.all(fadePromises);

      // Stop and reset the previous audio
      if (currentAudioRef) {
        currentAudioRef.pause();
        currentAudioRef.currentTime = 0;
      }

      // Update state
      setCurrentAudio(currentAudio === 1 ? 2 : 1);
      setCurrentTrackIndex(nextIndex);

    } catch (error) {
      console.warn(`Error playing track ${playlist[nextIndex]}:`, error);
      // Skip to next track if this one fails
      setCurrentTrackIndex(nextIndex);
    }
  };

  // Handle track ending
  const handleTrackEnd = () => {
    // Small delay before next track to avoid abrupt transitions
    timeoutRef.current = setTimeout(() => {
      playNextTrack();
    }, 100);
  };

  // Initialize playback
  useEffect(() => {
    if (!soundsAvailable) {
      console.log('Ambient sounds not available in this environment');
      return;
    }

    if (!isActive || soundType === 'none' || playlist.length === 0) {
      // Stop all audio
      [audioRef1.current, audioRef2.current].forEach(audio => {
        if (audio) {
          smoothVolumeChange(audio, 0, 500).then(() => {
            audio.pause();
            audio.currentTime = 0;
          });
        }
      });
      setIsInitialized(false);
      return;
    }

    if (!isInitialized && playlist.length > 0) {
      const audio = audioRef1.current;
      if (audio) {
        audio.src = playlist[0];
        audio.volume = 0;
        audio.loop = false;
        
        audio.load();
        audio.play().then(() => {
          smoothVolumeChange(audio, volume, 1000);
          setIsInitialized(true);
        }).catch(error => {
          console.warn('Error starting ambient sound:', error);
        });
      }
    }
  }, [isActive, soundType, playlist, volume, isInitialized]);

  // Handle volume changes
  useEffect(() => {
    const activeAudio = currentAudio === 1 ? audioRef1.current : audioRef2.current;
    if (activeAudio && !activeAudio.paused) {
      smoothVolumeChange(activeAudio, volume, 300);
    }
  }, [volume, currentAudio]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <audio
        ref={audioRef1}
        onEnded={handleTrackEnd}
        preload="none"
        style={{ display: 'none' }}
      />
      <audio
        ref={audioRef2}
        onEnded={handleTrackEnd}
        preload="none"
        style={{ display: 'none' }}
      />
    </>
  );
};

export default AmbientSoundPlayer;
