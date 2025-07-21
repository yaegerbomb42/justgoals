import React, { useRef, useEffect, useState } from 'react';

const AmbientSoundPlayer = ({ 
  soundType = 'none', 
  volume = 0.5, 
  isActive = false,
  crossfadeDuration = 2000 // 2 seconds crossfade
}) => {
  const audioRef1 = useRef(null);
  const audioRef2 = useRef(null);
  const [currentAudio, setCurrentAudio] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const fadeIntervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Sound file mappings with multiple variations
  const soundLibrary = {
    rain: [
      '/assets/sounds/11L-Rain_(5_files)_rain_-1752354095970.mp3',
      '/assets/sounds/11L-Rain_(5_files)_rain_-1752354097785.mp3',
      '/assets/sounds/11L-Rain_(5_files)_rain_-1752354099151.mp3',
      '/assets/sounds/11L-Rain_(5_files)_rain_-1752354099985.mp3'
    ],
    forest: [
      '/assets/sounds/11L-Forest_(5_files)_bir-1752354108854.mp3',
      '/assets/sounds/11L-Forest_(5_files)_bir-1752354109738.mp3',
      '/assets/sounds/11L-Forest_(5_files)_bir-1752354110518.mp3',
      '/assets/sounds/11L-Forest_(5_files)_bir-1752354111506.mp3'
    ],
    ocean: [
      '/assets/sounds/11L-Ocean_(5_files)_wave-1752354117569.mp3',
      '/assets/sounds/11L-Ocean_(5_files)_wave-1752354118239.mp3',
      '/assets/sounds/11L-Ocean_(5_files)_wave-1752354118840.mp3',
      '/assets/sounds/11L-Ocean_(5_files)_wave-1752354328650.mp3',
      '/assets/sounds/11L-Ocean_(5_files)_wave-1752354330991.mp3',
      '/assets/sounds/11L-Ocean_(5_files)_wave-1752354331917.mp3',
      '/assets/sounds/11L-Ocean_(5_files)_wave-1752354332752.mp3'
    ],
    cafe: [
      '/assets/sounds/11L-Cafe_(5_files)_coffe-1752354124665.mp3',
      '/assets/sounds/11L-Cafe_(5_files)_coffe-1752354125306.mp3',
      '/assets/sounds/11L-Cafe_(5_files)_coffe-1752354126055.mp3',
      '/assets/sounds/11L-Cafe_(5_files)_coffe-1752354126790.mp3'
    ],
    whitenoise: [
      '/assets/sounds/11L-White_Noise_(4_files-1752354130068.mp3',
      '/assets/sounds/11L-White_Noise_(4_files-1752354130735.mp3',
      '/assets/sounds/11L-White_Noise_(4_files-1752354131452.mp3',
      '/assets/sounds/11L-White_Noise_(4_files-1752354132104.mp3'
    ]
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
