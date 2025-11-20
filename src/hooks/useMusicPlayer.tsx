import { create } from 'zustand';
import { Song } from '@/lib/musicLibrary';

interface MusicPlayerState {
  currentSong: Song | null;
  currentSongIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  audioElement: HTMLAudioElement | null;
  
  // Actions
  setCurrentSong: (song: Song, index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setAudioElement: (element: HTMLAudioElement) => void;
  playNext: () => void;
  playPrevious: () => void;
  playSongAtIndex: (index: number) => void;
}

export const useMusicPlayer = create<MusicPlayerState>((set, get) => ({
  currentSong: null,
  currentSongIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isShuffle: false,
  repeatMode: 'off',
  audioElement: null,

  setCurrentSong: (song, index) => set({ currentSong: song, currentSongIndex: index }),
  
  setIsPlaying: (playing) => {
    set({ isPlaying: playing });
    const audio = get().audioElement;
    if (audio) {
      if (playing) {
        // Ensure audio is not muted when user hits play
        audio.muted = false;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch((err) => {
            console.error("Audio play error:", err);
          });
        }
      } else {
        audio.pause();
      }
    }
  },
  
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => {
    set({ volume });
    const audio = get().audioElement;
    if (audio) {
      audio.volume = volume;
    }
  },
  
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  
  cycleRepeatMode: () => set((state) => ({
    repeatMode: state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off'
  })),
  
  setAudioElement: (element) => set({ audioElement: element }),
  
  playNext: () => {
    const { currentSongIndex, isShuffle, repeatMode } = get();
    const { songs } = require('@/lib/musicLibrary');
    
    let nextIndex = currentSongIndex + 1;
    
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else if (nextIndex >= songs.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return;
      }
    }
    
    get().setCurrentSong(songs[nextIndex], nextIndex);
    get().setIsPlaying(true);
  },
  
  playPrevious: () => {
    const { currentSongIndex } = get();
    const { songs } = require('@/lib/musicLibrary');
    
    if (currentSongIndex > 0) {
      const prevIndex = currentSongIndex - 1;
      get().setCurrentSong(songs[prevIndex], prevIndex);
      get().setIsPlaying(true);
    }
  },
  
  playSongAtIndex: (index) => {
    const { songs } = require('@/lib/musicLibrary');
    if (index >= 0 && index < songs.length) {
      get().setCurrentSong(songs[index], index);
      get().setIsPlaying(true);
    }
  }
}));
