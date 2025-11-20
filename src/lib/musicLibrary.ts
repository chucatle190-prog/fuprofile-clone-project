export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  url: string;
  duration: number;
}

// Free music library for stories
export const musicLibrary: MusicTrack[] = [
  {
    id: "1",
    name: "Summer Vibes",
    artist: "Chill Beats",
    url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
    duration: 30,
  },
  {
    id: "2",
    name: "Happy Day",
    artist: "Upbeat Music",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4e3f2a5a37.mp3",
    duration: 30,
  },
  {
    id: "3",
    name: "Chill Lofi",
    artist: "Lofi Beats",
    url: "https://cdn.pixabay.com/audio/2022/03/24/audio_c8a891f404.mp3",
    duration: 30,
  },
  {
    id: "4",
    name: "Energy",
    artist: "Electronic",
    url: "https://cdn.pixabay.com/audio/2022/02/07/audio_32b77e8b6f.mp3",
    duration: 30,
  },
  {
    id: "5",
    name: "Acoustic",
    artist: "Guitar Melody",
    url: "https://cdn.pixabay.com/audio/2022/05/03/audio_2f1b64bc61.mp3",
    duration: 30,
  },
  {
    id: "6",
    name: "Dreamy",
    artist: "Ambient",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_eccb4f0440.mp3",
    duration: 30,
  },
  {
    id: "7",
    name: "Funky Beat",
    artist: "Funk",
    url: "https://cdn.pixabay.com/audio/2022/08/23/audio_884fe70ef8.mp3",
    duration: 30,
  },
  {
    id: "8",
    name: "Relax",
    artist: "Calm Music",
    url: "https://cdn.pixabay.com/audio/2022/03/02/audio_b991e6b392.mp3",
    duration: 30,
  },
];

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  imageUrl: string;
  audioUrl: string;
}

export const songs: Song[] = [
  {
    id: "97e36264-c778-4cad-b477-b106f36ee899",
    title: "I am the Pure Loving Light of Father Uni",
    artist: "HappyCamlyCoin",
    duration: "4:01",
    imageUrl: "https://cdn2.suno.ai/image_97e36264-c778-4cad-b477-b106f36ee899.jpeg",
    audioUrl: "https://audiopipe.suno.ai/?item_id=97e36264-c778-4cad-b477-b106f36ee899"
  },
  {
    id: "ca26ef90-dd93-4e38-b712-021f9163a9cd",
    title: "I am the Pure Loving Light of Father Uni",
    artist: "HappyCamlyCoin",
    duration: "3:34",
    imageUrl: "https://cdn2.suno.ai/image_ca26ef90-dd93-4e38-b712-021f9163a9cd.jpeg",
    audioUrl: "https://audiopipe.suno.ai/?item_id=ca26ef90-dd93-4e38-b712-021f9163a9cd"
  },
  {
    id: "dfbd97fa-6b87-47c6-9ed4-ef879bbe43d6",
    title: "I am the Pure Loving Light of Father Uni",
    artist: "HappyCamlyCoin",
    duration: "3:23",
    imageUrl: "https://cdn2.suno.ai/image_dfbd97fa-6b87-47c6-9ed4-ef879bbe43d6.jpeg",
    audioUrl: "https://audiopipe.suno.ai/?item_id=dfbd97fa-6b87-47c6-9ed4-ef879bbe43d6"
  }
];
