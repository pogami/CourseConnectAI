// Configuration for Spotify and AI Music Integration
export const config = {
  spotify: {
    clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.courseconnectai.com'}/dashboard/advanced`,
    scopes: [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'user-top-read'
    ]
  },
  aiMusic: {
    apiKey: process.env.NEXT_PUBLIC_MUSIC_GENERATION_API_KEY || '',
    apiUrl: process.env.NEXT_PUBLIC_MUSIC_GENERATION_API_URL || 'https://api.example.com/generate-music'
    // Note: OPENAI_API_KEY removed - server-side keys should not be in config files
    // Use server-side API routes if OpenAI is needed for music generation
  }
};

// Spotify API endpoints
export const spotifyEndpoints = {
  auth: 'https://accounts.spotify.com/authorize',
  token: 'https://accounts.spotify.com/api/token',
  user: 'https://api.spotify.com/v1/me',
  playlists: 'https://api.spotify.com/v1/me/playlists',
  currentlyPlaying: 'https://api.spotify.com/v1/me/player/currently-playing',
  play: 'https://api.spotify.com/v1/me/player/play',
  pause: 'https://api.spotify.com/v1/me/player/pause',
  next: 'https://api.spotify.com/v1/me/player/next',
  previous: 'https://api.spotify.com/v1/me/player/previous',
  volume: 'https://api.spotify.com/v1/me/player/volume'
};

// AI Music generation prompts
export const musicPrompts = {
  calm: [
    'gentle piano melody with soft strings',
    'ambient nature sounds with subtle electronic elements',
    'peaceful acoustic guitar with rain sounds',
    'meditative drone with gentle chimes'
  ],
  focus: [
    'minimalist electronic beats for concentration',
    'classical music with modern ambient textures',
    'lo-fi hip hop with smooth jazz elements',
    'binaural beats for enhanced focus'
  ],
  meditation: [
    'singing bowls with nature ambience',
    'soft chanting with gentle percussion',
    'ocean waves with ethereal synthesizers',
    'forest sounds with healing frequencies'
  ],
  energetic: [
    'upbeat electronic music for motivation',
    'energetic acoustic guitar with driving rhythm',
    'uplifting orchestral music',
    'dynamic electronic beats with inspiring melodies'
  ]
};
