import { useState, useEffect } from 'react';

const DEFAULT_M3U_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';

export function useM3uParser(m3uUrl = DEFAULT_M3U_URL) {
  const [playlistChannels, setPlaylistChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!m3uUrl) return;

    async function parseM3U() {
      try {
        setLoading(true);
        const response = await fetch(m3uUrl);
        
        if (!response.ok) {
          throw new Error('Imefeli kupakua M3U Playlist file');
        }

        const text = await response.text();
        const lines = text.split('\n');
        const parsedChannels = [];
        let currentChannel = {};

        lines.forEach((line) => {
          line = line.trim();

          if (line.startsWith('#EXTINF:')) {
            const nameMatch = line.match(/,(.+)$/);
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            const groupMatch = line.match(/group-title="([^"]+)"/);

            currentChannel = {
              id: 'iptv-' + Math.random().toString(36).substr(2, 9),
              name: nameMatch ? nameMatch[1].trim() : 'IPTV Channel',
              logo: logoMatch ? logoMatch[1] : '',
              category: groupMatch ? groupMatch[1] : 'Free IPTV Playlist',
            };
          } 
          else if (line.startsWith('http://') || line.startsWith('https://')) {
            currentChannel.stream_url = line;
            if (currentChannel.name) {
              parsedChannels.push(currentChannel);
            }
            currentChannel = {};
          }
        });

        setPlaylistChannels(parsedChannels);
      } catch (err) {
        console.error('M3U Parser Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    parseM3U();
  }, [m3uUrl]);

  return { playlistChannels, loading, error };
}
