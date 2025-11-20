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
    title: "I am the Pure Loving Light of Father Universe",
    artist: "HappyCamlyCoin",
    duration: "4:01",
    imageUrl: "https://cdn2.suno.ai/image_97e36264-c778-4cad-b477-b106f36ee899.jpeg",
    audioUrl: "https://cdn1.suno.ai/97e36264-c778-4cad-b477-b106f36ee899.mp3"
  },
  {
    id: "ca26ef90-dd93-4e38-b712-021f9163a9cd",
    title: "I am the Pure Loving Light of Father Universe (v2)",
    artist: "HappyCamlyCoin",
    duration: "3:34",
    imageUrl: "https://cdn2.suno.ai/image_ca26ef90-dd93-4e38-b712-021f9163a9cd.jpeg",
    audioUrl: "https://cdn1.suno.ai/ca26ef90-dd93-4e38-b712-021f9163a9cd.mp3"
  },
  {
    id: "dfbd97fa-6b87-47c6-9ed4-ef879bbe43d6",
    title: "I am the Pure Loving Light of Father Universe (v3)",
    artist: "HappyCamlyCoin",
    duration: "3:23",
    imageUrl: "https://cdn2.suno.ai/image_dfbd97fa-6b87-47c6-9ed4-ef879bbe43d6.jpeg",
    audioUrl: "https://cdn1.suno.ai/dfbd97fa-6b87-47c6-9ed4-ef879bbe43d6.mp3"
  },
  {
    id: "4",
    title: "Sacred Mantra 1",
    artist: "HappyCamlyCoin",
    duration: "3:45",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3"
  },
  {
    id: "5",
    title: "Divine Light Chant",
    artist: "HappyCamlyCoin",
    duration: "4:12",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/10/audio_4e3f2a5a37.mp3"
  },
  {
    id: "6",
    title: "Cosmic Guardian",
    artist: "HappyCamlyCoin",
    duration: "3:58",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/24/audio_c8a891f404.mp3"
  },
  {
    id: "7",
    title: "Universe Blessing",
    artist: "HappyCamlyCoin",
    duration: "4:05",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/02/07/audio_32b77e8b6f.mp3"
  },
  {
    id: "8",
    title: "Pure Love Energy",
    artist: "HappyCamlyCoin",
    duration: "3:52",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/05/03/audio_2f1b64bc61.mp3"
  },
  {
    id: "9",
    title: "Father's Wisdom",
    artist: "HappyCamlyCoin",
    duration: "4:20",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/15/audio_eccb4f0440.mp3"
  },
  {
    id: "10",
    title: "Gratitude Mantra",
    artist: "HappyCamlyCoin",
    duration: "3:40",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/08/23/audio_884fe70ef8.mp3"
  },
  {
    id: "11",
    title: "Repentance Prayer",
    artist: "HappyCamlyCoin",
    duration: "4:08",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/02/audio_b991e6b392.mp3"
  },
  {
    id: "12",
    title: "Light of Happiness",
    artist: "HappyCamlyCoin",
    duration: "3:55",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3"
  },
  {
    id: "13",
    title: "Will of Father",
    artist: "HappyCamlyCoin",
    duration: "4:15",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/10/audio_4e3f2a5a37.mp3"
  },
  {
    id: "14",
    title: "Money Blessing",
    artist: "HappyCamlyCoin",
    duration: "3:48",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/24/audio_c8a891f404.mp3"
  },
  {
    id: "15",
    title: "Love Frequency",
    artist: "HappyCamlyCoin",
    duration: "4:02",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/02/07/audio_32b77e8b6f.mp3"
  },
  {
    id: "16",
    title: "Sacred Vibration",
    artist: "HappyCamlyCoin",
    duration: "3:50",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/05/03/audio_2f1b64bc61.mp3"
  },
  {
    id: "17",
    title: "Divine Protection",
    artist: "HappyCamlyCoin",
    duration: "4:18",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/15/audio_eccb4f0440.mp3"
  },
  {
    id: "18",
    title: "Cosmic Love",
    artist: "HappyCamlyCoin",
    duration: "3:42",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/08/23/audio_884fe70ef8.mp3"
  },
  {
    id: "19",
    title: "Wisdom Path",
    artist: "HappyCamlyCoin",
    duration: "4:10",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/02/audio_b991e6b392.mp3"
  },
  {
    id: "20",
    title: "Happiness Mantra",
    artist: "HappyCamlyCoin",
    duration: "3:56",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3"
  },
  {
    id: "21",
    title: "Father's Grace",
    artist: "HappyCamlyCoin",
    duration: "4:22",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/10/audio_4e3f2a5a37.mp3"
  },
  {
    id: "22",
    title: "Universal Energy",
    artist: "HappyCamlyCoin",
    duration: "3:47",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/24/audio_c8a891f404.mp3"
  },
  {
    id: "23",
    title: "Purification Chant",
    artist: "HappyCamlyCoin",
    duration: "4:05",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/02/07/audio_32b77e8b6f.mp3"
  },
  {
    id: "24",
    title: "Light Blessing",
    artist: "HappyCamlyCoin",
    duration: "3:53",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/05/03/audio_2f1b64bc61.mp3"
  },
  {
    id: "25",
    title: "Sacred Heart",
    artist: "HappyCamlyCoin",
    duration: "4:16",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/15/audio_eccb4f0440.mp3"
  },
  {
    id: "26",
    title: "Divine Will",
    artist: "HappyCamlyCoin",
    duration: "3:44",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/08/23/audio_884fe70ef8.mp3"
  },
  {
    id: "27",
    title: "Grateful Soul",
    artist: "HappyCamlyCoin",
    duration: "4:12",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/02/audio_b991e6b392.mp3"
  },
  {
    id: "28",
    title: "Eternal Love",
    artist: "HappyCamlyCoin",
    duration: "3:58",
    imageUrl: "https://cdn2.suno.ai/674cb425.jpeg",
    audioUrl: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3"
  }
];
