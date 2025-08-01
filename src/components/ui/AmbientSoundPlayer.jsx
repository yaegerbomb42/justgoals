import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

// Sound configurations with multiple fallback URLs - moved outside component to prevent recreation
const soundConfigs = {
  rain: {
    name: 'Rain',
    urls: [
      '/assets/sounds/rain.mp3',
      'https://www.soundjay.com/misc/sounds/rain-01.mp3',
      'https://cdn.freesound.org/previews/2523/2523-lq.mp3', // Freesound rain sample
      '/assets/sounds/rain.wav'
    ]
  },
  forest: {
    name: 'Forest',
    urls: [
      '/assets/sounds/forest.mp3',
      'https://www.soundjay.com/nature/sounds/forest-01.mp3',
      'https://cdn.freesound.org/previews/379/379-lq.mp3', // Freesound forest sample
      '/assets/sounds/forest.wav'
    ]
  },
  ocean: {
    name: 'Ocean Waves',
    urls: [
      '/assets/sounds/ocean.mp3',
      'https://www.soundjay.com/nature/sounds/ocean-01.mp3',
      'https://cdn.freesound.org/previews/316/316-lq.mp3', // Freesound ocean sample
      '/assets/sounds/ocean.wav'
    ]
  },
  cafe: {
    name: 'Coffee Shop',
    urls: [
      '/assets/sounds/cafe.mp3',
      'https://www.soundjay.com/misc/sounds/cafe-01.mp3',
      'https://cdn.freesound.org/previews/507/507-lq.mp3', // Freesound cafe sample
      '/assets/sounds/cafe.wav'
    ]
  },
  fire: {
    name: 'Fireplace',
    urls: [
      '/assets/sounds/fire.mp3',
      'https://www.soundjay.com/misc/sounds/fire-01.mp3',
      'https://cdn.freesound.org/previews/31267/31267_270899-lq.mp3', // Freesound fire sample
      '/assets/sounds/fire.wav'
    ]
  }
};

// Global user interaction state to avoid multiple listeners
let globalUserInteracted = false;
const userInteractionCallbacks = new Set();

const setupGlobalUserInteractionHandler = () => {
  if (globalUserInteracted) return;
  
  const handleUserInteraction = () => {
    globalUserInteracted = true;
    userInteractionCallbacks.forEach(callback => callback());
    userInteractionCallbacks.clear();
    document.removeEventListener('click', handleUserInteraction);
    document.removeEventListener('keydown', handleUserInteraction);
    document.removeEventListener('touchstart', handleUserInteraction);
  };

  document.addEventListener('click', handleUserInteraction, { once: true });
  document.addEventListener('keydown', handleUserInteraction, { once: true });
  document.addEventListener('touchstart', handleUserInteraction, { once: true });
};

const AmbientSoundPlayer = ({ soundType, soundId, volume = 0.5, isPlaying, isActive, onPlayingChange }) => {
  // Use soundType if provided, otherwise fall back to soundId for backward compatibility
  const activeSoundId = soundType || soundId;
  const audioRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(globalUserInteracted);
  const [currentUrl, setCurrentUrl] = useState(null);

  const currentSound = soundConfigs[activeSoundId];
  
  // Use isActive if provided, otherwise fall back to isPlaying
  const shouldPlay = isActive !== undefined ? isActive : isPlaying;

  // Handle user interaction for autoplay policy compliance
  useEffect(() => {
    if (globalUserInteracted) {
      setHasUserInteracted(true);
      return;
    }

    const callback = () => setHasUserInteracted(true);
    userInteractionCallbacks.add(callback);
    setupGlobalUserInteractionHandler();

    return () => {
      userInteractionCallbacks.delete(callback);
    };
  }, []);

  // Try to load audio with fallback URLs
  const tryLoadAudio = async (urls, index = 0) => {
    if (index >= urls.length) {
      throw new Error('All audio sources failed to load');
    }

    const url = urls[index];
    setCurrentUrl(url);

    return new Promise((resolve, reject) => {
      const audio = audioRef.current;
      if (!audio) {
        reject(new Error('Audio element not found'));
        return;
      }

      const handleLoad = () => {
        audio.removeEventListener('canplaythrough', handleLoad);
        audio.removeEventListener('error', handleError);
        resolve(url);
      };

      const handleError = () => {
        audio.removeEventListener('canplaythrough', handleLoad);
        audio.removeEventListener('error', handleError);
        
        // Try next URL
        tryLoadAudio(urls, index + 1)
          .then(resolve)
          .catch(reject);
      };

      audio.addEventListener('canplaythrough', handleLoad);
      audio.addEventListener('error', handleError);
      audio.src = url;
      audio.load();
    });
  };

  // Load and play/pause audio
  useEffect(() => {
    if (!currentSound || !audioRef.current) return;

    const audio = audioRef.current;
    
    if (shouldPlay && hasUserInteracted) {
      setIsLoading(true);
      setError(null);

      // Ensure we stop any existing playback first
      audio.pause();
      audio.currentTime = 0;

      tryLoadAudio(currentSound.urls)
        .then((successUrl) => {
          console.log(`Successfully loaded audio from: ${successUrl}`);
          
          // Double-check that we should still be playing (component might have updated)
          if (!shouldPlay) {
            setIsLoading(false);
            return;
          }
          
          audio.volume = volume;
          audio.loop = true;
          
          const playPromise = audio.play();
          if (playPromise) {
            playPromise
              .then(() => {
                setIsLoading(false);
                onPlayingChange?.(true);
              })
              .catch((err) => {
                console.error('Error playing audio:', err);
                setError('Failed to play audio. Try clicking to enable sound.');
                setIsLoading(false);
                onPlayingChange?.(false);
              });
          }
        })
        .catch((err) => {
          console.error('Error loading audio:', err);
          setError('Unable to load audio. Please check your connection.');
          setIsLoading(false);
          onPlayingChange?.(false);
        });
    } else if (!shouldPlay) {
      audio.pause();
      onPlayingChange?.(false);
    }
  }, [shouldPlay, activeSoundId, hasUserInteracted, volume, onPlayingChange]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Cleanup on unmount and better resource management
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load(); // Force cleanup
      }
    };
  }, []);

  if (!currentSound) {
    return null;
  }

  // Create a unique identifier for debugging
  const playerId = `${activeSoundId}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="ambient-sound-player" data-player-id={playerId}>
      <audio
        ref={audioRef}
        preload="none"
        className="hidden"
        data-sound-type={activeSoundId}
      />
      
      {error && (
        <div className="text-xs text-warning mb-2 p-2 bg-warning/10 rounded border border-warning/20">
          <Icon name="AlertTriangle" className="w-3 h-3 inline mr-1" />
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className="text-xs text-text-secondary mb-2 p-2 bg-surface-700 rounded">
          <Icon name="Loader" className="w-3 h-3 inline mr-1 animate-spin" />
          Loading {currentSound.name}...
        </div>
      )}
      
      {!hasUserInteracted && shouldPlay && (
        <div className="text-xs text-accent mb-2 p-2 bg-accent/10 rounded border border-accent/20">
          <Icon name="Info" className="w-3 h-3 inline mr-1" />
          Click anywhere to enable ambient sounds
        </div>
      )}

      {currentUrl && (
        <div className="text-xs text-text-secondary opacity-50">
          Playing: {currentSound.name}
        </div>
      )}
    </div>
  );
};

export default AmbientSoundPlayer;
