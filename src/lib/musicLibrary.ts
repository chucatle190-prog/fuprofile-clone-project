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

export interface LyricLine {
  text: string;
  startTime: number; // in seconds
  endTime: number;
}

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
    id: "c98c175c-7bca-46f6-98f2-92fad34bf146",
    title: "I am the Pure Loving Light of Father Universe (v4)",
    artist: "HappyCamlyCoin",
    duration: "3:34",
    imageUrl: "https://cdn2.suno.ai/image_c98c175c-7bca-46f6-98f2-92fad34bf146.jpeg",
    audioUrl: "https://cdn1.suno.ai/c98c175c-7bca-46f6-98f2-92fad34bf146.mp3"
  },
  {
    id: "48632a97-9d9e-43d9-914e-36595afc0c40",
    title: "I am the Pure Loving Light of Father Universe (v5)",
    artist: "HappyCamlyCoin",
    duration: "4:09",
    imageUrl: "https://cdn2.suno.ai/image_48632a97-9d9e-43d9-914e-36595afc0c40.jpeg",
    audioUrl: "https://cdn1.suno.ai/48632a97-9d9e-43d9-914e-36595afc0c40.mp3"
  },
  {
    id: "d779c9a0-75b4-437b-9a4b-068b141257db",
    title: "I am the Pure Loving Light of Father Universe (v6)",
    artist: "HappyCamlyCoin",
    duration: "4:14",
    imageUrl: "https://cdn2.suno.ai/image_d779c9a0-75b4-437b-9a4b-068b141257db.jpeg",
    audioUrl: "https://cdn1.suno.ai/d779c9a0-75b4-437b-9a4b-068b141257db.mp3"
  },
  {
    id: "60879dc1-c4c3-48b6-ac25-74a60a57318f",
    title: "I am the Pure Loving Light of Father Universe (v7)",
    artist: "HappyCamlyCoin",
    duration: "4:09",
    imageUrl: "https://cdn2.suno.ai/image_60879dc1-c4c3-48b6-ac25-74a60a57318f.jpeg",
    audioUrl: "https://cdn1.suno.ai/60879dc1-c4c3-48b6-ac25-74a60a57318f.mp3"
  },
  {
    id: "ecaa7431-161c-4f61-b179-6299735cf72a",
    title: "I am the Pure Loving Light of Father Universe (v8)",
    artist: "HappyCamlyCoin",
    duration: "3:56",
    imageUrl: "https://cdn2.suno.ai/image_ecaa7431-161c-4f61-b179-6299735cf72a.jpeg",
    audioUrl: "https://cdn1.suno.ai/ecaa7431-161c-4f61-b179-6299735cf72a.mp3"
  },
  {
    id: "6cd2335f-c7ab-40dd-a7cf-a0fde6d35b49",
    title: "I am the Pure Loving Light of Father Universe (v9)",
    artist: "HappyCamlyCoin",
    duration: "4:09",
    imageUrl: "https://cdn2.suno.ai/image_6cd2335f-c7ab-40dd-a7cf-a0fde6d35b49.jpeg",
    audioUrl: "https://cdn1.suno.ai/6cd2335f-c7ab-40dd-a7cf-a0fde6d35b49.mp3"
  },
  {
    id: "28b81552-1c13-4f58-97f2-dd9beec33a7d",
    title: "I am the Pure Loving Light of Father Universe (v10)",
    artist: "HappyCamlyCoin",
    duration: "3:47",
    imageUrl: "https://cdn2.suno.ai/image_28b81552-1c13-4f58-97f2-dd9beec33a7d.jpeg",
    audioUrl: "https://cdn1.suno.ai/28b81552-1c13-4f58-97f2-dd9beec33a7d.mp3"
  },
  {
    id: "041e91ee-084c-456b-966e-4ccb3357555d",
    title: "I am the Pure Loving Light of Father Universe (v11)",
    artist: "HappyCamlyCoin",
    duration: "3:54",
    imageUrl: "https://cdn2.suno.ai/image_041e91ee-084c-456b-966e-4ccb3357555d.jpeg",
    audioUrl: "https://cdn1.suno.ai/041e91ee-084c-456b-966e-4ccb3357555d.mp3"
  },
  {
    id: "cc760c8b-d424-4c89-9a4b-60a1c19482fc",
    title: "I am the Pure Loving Light of Father Universe (v12)",
    artist: "HappyCamlyCoin",
    duration: "2:49",
    imageUrl: "https://cdn2.suno.ai/image_cc760c8b-d424-4c89-9a4b-60a1c19482fc.jpeg",
    audioUrl: "https://cdn1.suno.ai/cc760c8b-d424-4c89-9a4b-60a1c19482fc.mp3"
  },
  {
    id: "9a719585-2788-45ca-a2dd-1e8eee3730af",
    title: "I am the Pure Loving Light of Father Universe (v13)",
    artist: "HappyCamlyCoin",
    duration: "3:32",
    imageUrl: "https://cdn2.suno.ai/image_9a719585-2788-45ca-a2dd-1e8eee3730af.jpeg",
    audioUrl: "https://cdn1.suno.ai/9a719585-2788-45ca-a2dd-1e8eee3730af.mp3"
  },
  {
    id: "9a3a7144-3671-4f4e-bf36-7b7d89de5ee2",
    title: "I am the Pure Loving Light of Father Universe (v14)",
    artist: "HappyCamlyCoin",
    duration: "3:32",
    imageUrl: "https://cdn2.suno.ai/image_9a3a7144-3671-4f4e-bf36-7b7d89de5ee2.jpeg",
    audioUrl: "https://cdn1.suno.ai/9a3a7144-3671-4f4e-bf36-7b7d89de5ee2.mp3"
  },
  {
    id: "4abce89b-0df1-46d8-ae56-efcf153ee6f8",
    title: "I am the Pure Loving Light of Father Universe (v15)",
    artist: "HappyCamlyCoin",
    duration: "3:01",
    imageUrl: "https://cdn2.suno.ai/image_4abce89b-0df1-46d8-ae56-efcf153ee6f8.jpeg",
    audioUrl: "https://cdn1.suno.ai/4abce89b-0df1-46d8-ae56-efcf153ee6f8.mp3"
  },
  {
    id: "2820da8d-5401-483b-ae51-bbcd5665b498",
    title: "I am the Pure Loving Light of Father Universe (v16)",
    artist: "HappyCamlyCoin",
    duration: "2:49",
    imageUrl: "https://cdn2.suno.ai/image_2820da8d-5401-483b-ae51-bbcd5665b498.jpeg",
    audioUrl: "https://cdn1.suno.ai/2820da8d-5401-483b-ae51-bbcd5665b498.mp3"
  },
  {
    id: "f4339cc8-bced-4858-be45-3dea401b8002",
    title: "I am the Pure Loving Light of Father Universe (v17)",
    artist: "HappyCamlyCoin",
    duration: "2:42",
    imageUrl: "https://cdn2.suno.ai/image_f4339cc8-bced-4858-be45-3dea401b8002.jpeg",
    audioUrl: "https://cdn1.suno.ai/f4339cc8-bced-4858-be45-3dea401b8002.mp3"
  },
  {
    id: "dfc9cc25-3a22-4ca1-8068-b5c98fc8a570",
    title: "I am the Pure Loving Light of Father Universe (v18)",
    artist: "HappyCamlyCoin",
    duration: "3:24",
    imageUrl: "https://cdn2.suno.ai/image_dfc9cc25-3a22-4ca1-8068-b5c98fc8a570.jpeg",
    audioUrl: "https://cdn1.suno.ai/dfc9cc25-3a22-4ca1-8068-b5c98fc8a570.mp3"
  },
  {
    id: "583cc6d8-2ae1-40a8-b9e0-19e3a266546e",
    title: "I am the Pure Loving Light",
    artist: "HappyCamlyCoin",
    duration: "3:34",
    imageUrl: "https://cdn2.suno.ai/image_583cc6d8-2ae1-40a8-b9e0-19e3a266546e.jpeg",
    audioUrl: "https://cdn1.suno.ai/583cc6d8-2ae1-40a8-b9e0-19e3a266546e.mp3"
  },
  {
    id: "12916083-0695-40a7-a4cb-70a26f49d3e0",
    title: "I am the Pure Loving Light of Father Universe (v19)",
    artist: "HappyCamlyCoin",
    duration: "3:47",
    imageUrl: "https://cdn2.suno.ai/image_12916083-0695-40a7-a4cb-70a26f49d3e0.jpeg",
    audioUrl: "https://cdn1.suno.ai/12916083-0695-40a7-a4cb-70a26f49d3e0.mp3"
  },
  {
    id: "ed569959-25f6-481f-9ef2-331b33a47b29",
    title: "I am the Pure Loving Light of Father Universe (v20)",
    artist: "HappyCamlyCoin",
    duration: "3:22",
    imageUrl: "https://cdn2.suno.ai/image_ed569959-25f6-481f-9ef2-331b33a47b29.jpeg",
    audioUrl: "https://cdn1.suno.ai/ed569959-25f6-481f-9ef2-331b33a47b29.mp3"
  },
  {
    id: "8acce2df-ac41-47a9-a739-40ddef59087d",
    title: "I am the Pure Loving Light of Father Universe (v21)",
    artist: "HappyCamlyCoin",
    duration: "3:32",
    imageUrl: "https://cdn2.suno.ai/image_8acce2df-ac41-47a9-a739-40ddef59087d.jpeg",
    audioUrl: "https://cdn1.suno.ai/8acce2df-ac41-47a9-a739-40ddef59087d.mp3"
  },
  {
    id: "581011e8-a449-4e90-82ab-e98c2d307738",
    title: "I am the Pure Loving Light of Father Universe (v22)",
    artist: "HappyCamlyCoin",
    duration: "3:19",
    imageUrl: "https://cdn2.suno.ai/image_581011e8-a449-4e90-82ab-e98c2d307738.jpeg",
    audioUrl: "https://cdn1.suno.ai/581011e8-a449-4e90-82ab-e98c2d307738.mp3"
  },
  {
    id: "fdf22133-e448-43f2-b5d8-629b3c9241f4",
    title: "I am the Pure Loving Light of Father Universe (v23)",
    artist: "HappyCamlyCoin",
    duration: "3:19",
    imageUrl: "https://cdn2.suno.ai/image_fdf22133-e448-43f2-b5d8-629b3c9241f4.jpeg",
    audioUrl: "https://cdn1.suno.ai/fdf22133-e448-43f2-b5d8-629b3c9241f4.mp3"
  },
  {
    id: "2a5ab7a4-a9d8-485d-b5a8-bbbc94d553eb",
    title: "I am the Pure Loving Light of Father Universe (v24)",
    artist: "HappyCamlyCoin",
    duration: "3:23",
    imageUrl: "https://cdn2.suno.ai/image_2a5ab7a4-a9d8-485d-b5a8-bbbc94d553eb.jpeg",
    audioUrl: "https://cdn1.suno.ai/2a5ab7a4-a9d8-485d-b5a8-bbbc94d553eb.mp3"
  },
  {
    id: "5ee56552-e1e9-424a-b2c3-cde4ea4aedd8",
    title: "I am the Pure Loving Light of Father Universe (v25)",
    artist: "HappyCamlyCoin",
    duration: "3:57",
    imageUrl: "https://cdn2.suno.ai/image_5ee56552-e1e9-424a-b2c3-cde4ea4aedd8.jpeg",
    audioUrl: "https://cdn1.suno.ai/5ee56552-e1e9-424a-b2c3-cde4ea4aedd8.mp3"
  },
  {
    id: "9b242e2a-2de3-4985-bd51-b385aec0b6a6",
    title: "I am the Pure Loving Light of Father Universe (v26)",
    artist: "HappyCamlyCoin",
    duration: "4:09",
    imageUrl: "https://cdn2.suno.ai/image_9b242e2a-2de3-4985-bd51-b385aec0b6a6.jpeg",
    audioUrl: "https://cdn1.suno.ai/9b242e2a-2de3-4985-bd51-b385aec0b6a6.mp3"
  },
  {
    id: "43499e04-ab3a-427d-9974-c65a852bae5e",
    title: "I am the Pure Loving Light of Father Universe (v27)",
    artist: "HappyCamlyCoin",
    duration: "2:46",
    imageUrl: "https://cdn2.suno.ai/image_43499e04-ab3a-427d-9974-c65a852bae5e.jpeg",
    audioUrl: "https://cdn1.suno.ai/43499e04-ab3a-427d-9974-c65a852bae5e.mp3"
  }
];
