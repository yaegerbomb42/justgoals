import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

const AmbientSoundPlayer = ({ soundId, volume = 0.5, isPlaying, onPlayingChange }) => {
  const audioRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(null);

  // Sound configurations with multiple fallback URLs
  const soundConfigs = {
    rain: {
      name: 'Rain',
      urls: [
        '/assets/sounds/rain.mp3',
        '/sets/sounds/rain.mp3',
        'https://www.soundjay.com/misc/sounds/rain-01.mp3',
        'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3'
      ]
    },
    forest: {
      name: 'Forest',
      urls: [
        '/assets/sounds/forest.mp3',
        '/sets/sounds/forest.mp3',
        'https://www.soundjay.com/nature/sounds/forest-01.mp3',
        'https://cdn.pixabay.com/download/audio/2022/03/10/audio_84c0b49d93.mp3'
      ]
    },
    ocean: {
      name: 'Ocean Waves',
      urls: [
        '/assets/sounds/ocean.mp3',
        '/sets/sounds/ocean.mp3',
        'https://www.soundjay.com/nature/sounds/ocean-01.mp3',
        'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12345abcde.mp3'
      ]
    },
    cafe: {
      name: 'Coffee Shop',
      urls: [
        '/assets/sounds/cafe.mp3',
        '/sets/sounds/cafe.mp3',
        'https://www.soundjay.com/misc/sounds/cafe-01.mp3',
        'https://cdn.pixabay.com/download/audio/2022/01/18/audio_cafe123456.mp3'
      ]
    },
    fire: {
      name: 'Fireplace',
      urls: [
        '/assets/sounds/fire.mp3',
        '/sets/sounds/fire.mp3',
        'https://www.soundjay.com/misc/sounds/fire-01.mp3',
        'https://cdn.pixabay.com/download/audio/2021/11/08/audio_fire789012.mp3'
      ]
    }
  };

  const currentSound = soundConfigs[soundId];

  // Handle user interaction for autoplay policy compliance
  useEffect(() => {
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
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
    
    if (isPlaying && hasUserInteracted) {
      setIsLoading(true);
      setError(null);

      tryLoadAudio(currentSound.urls)
        .then((successUrl) => {
          console.log(`Successfully loaded audio from: ${successUrl}`);
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
    } else if (!isPlaying) {
      audio.pause();
      onPlayingChange?.(false);
    }
  }, [isPlaying, soundId, hasUserInteracted, volume, currentSound, onPlayingChange]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  if (!currentSound) {
    return null;
  }

  return (
    <div className="ambient-sound-player">
      <audio
        ref={audioRef}
        preload="none"
        className="hidden"
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
      
      {!hasUserInteracted && isPlaying && (
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
