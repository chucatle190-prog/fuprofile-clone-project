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
        audio.play().catch(console.error);
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
    const state = get();
    // This will be implemented with the songs array
    console.log('Play next');
  },
  
  playPrevious: () => {
    const state = get();
    // This will be implemented with the songs array
    console.log('Play previous');
  },
  
  playSongAtIndex: (index) => {
    console.log('Play song at index:', index);
  }
}));
