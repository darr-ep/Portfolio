import React, { useEffect, useState } from 'react';

interface SpotifyData {
  listening_to_spotify: boolean;
  spotify: {
    song: string;
    artist: string;
    album_art_url: string;
    track_id: string;
  } | null;
}

const DISCORD_USER_ID = '683077987020832778';

export default function SpotifyWidget() {
  const [data, setData] = useState<SpotifyData | null>(null);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const fetchSpotify = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
        const json = await res.json();
        if (json.success) {
          setData({
            listening_to_spotify: json.data.listening_to_spotify,
            spotify: json.data.spotify,
          });
        } else {
          setData({ listening_to_spotify: false, spotify: null });
        }
      } catch {
        setData({ listening_to_spotify: false, spotify: null });
      }
    };

    fetchSpotify();
    const interval = setInterval(fetchSpotify, 6000);

    const handleScroll = () => {
      setIsFloating(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!data) return null;

  const { listening_to_spotify, spotify } = data;

  const widgetStyle: React.CSSProperties = isFloating
    ? {
        position: 'fixed',
        bottom: '2rem',
        left: '100px',
        zIndex: 1000,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transform: 'none',
        transition: 'all 0.85s cubic-bezier(0.25, 1, 0.5, 1)',
      }
    : {
        position: 'fixed',
        top: '6.8rem',
        left: 'calc(80px + 0.6 * (100vw - 80px) - 5vw)',
        zIndex: 1000,
        transform: 'translateX(-100%)',
        transition: 'all 0.85s cubic-bezier(0.25, 1, 0.5, 1)',
      };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    background: 'rgba(13, 13, 15, 0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '0.5rem 1rem 0.5rem 0.5rem',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  };

  return (
    <div style={widgetStyle}>
      {listening_to_spotify && spotify ? (
        <a
          href={`https://open.spotify.com/track/${spotify.track_id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <div style={containerStyle}>
            {/* Album art */}
            <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 6, flexShrink: 0 }}>
              <img
                src={spotify.album_art_url}
                alt={spotify.song}
                style={{ width: '100%', height: '100%', borderRadius: 6, objectFit: 'cover' }}
              />
              {/* Spotify badge */}
              <div style={{
                position: 'absolute', bottom: -3, right: -3, width: 15, height: 15,
                background: '#1db954', borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#000',
                boxShadow: '0 0 6px rgba(29, 185, 84, 0.6)', zIndex: 5,
              }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="8" height="8">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.98-.336.075-.67-.135-.746-.472-.075-.336.136-.67.472-.746 3.847-.878 7.143-.505 9.82.135.295.18.388.565.207.856zm1.224-2.724c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.08-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.678-1.117 8.246-.576 11.35 1.332.367.226.487.707.26 1.074zm.106-2.833C14.382 8.87 8.568 8.68 5.18 9.71c-.52.157-1.072-.14-1.23-.66-.157-.52.14-1.072.66-1.23 3.89-1.18 10.31-.96 14.38 1.46.47.28.62.89.34 1.36-.28.47-.89.62-1.36.34z"/>
                </svg>
              </div>
            </div>

            {/* Track info */}
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: '0.55rem',
                  color: '#1db954', fontWeight: 700, letterSpacing: '0.12em',
                }}>LISTENING NOW</span>
                {/* Sound wave bars */}
                <SoundWave />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.15rem', overflow: 'hidden' }}>
                <span style={{
                  fontFamily: "'Outfit', sans-serif", color: '#fff', fontSize: '0.75rem',
                  fontWeight: 600, maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{spotify.song}</span>
                <span style={{
                  fontFamily: "'Outfit', sans-serif", color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem',
                  maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.05rem',
                }}>{spotify.artist}</span>
              </div>
            </div>
          </div>
        </a>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.45rem 0.9rem 0.45rem 0.75rem', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(13, 13, 15, 0.75)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.98-.336.075-.67-.135-.746-.472-.075-.336.136-.67.472-.746 3.847-.878 7.143-.505 9.82.135.295.18.388.565.207.856zm1.224-2.724c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.08-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.678-1.117 8.246-.576 11.35 1.332.367.226.487.707.26 1.074zm.106-2.833C14.382 8.87 8.568 8.68 5.18 9.71c-.52.157-1.072-.14-1.23-.66-.157-.52.14-1.072.66-1.23 3.89-1.18 10.31-.96 14.38 1.46.47.28.62.89.34 1.36-.28.47-.89.62-1.36.34z"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontSize: '0.6rem', fontWeight: 500,
            color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em',
          }}>SPOTIFY OFFLINE</span>
        </div>
      )}
    </div>
  );
}

function SoundWave() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, width: 9, height: 8, marginBottom: 1 }}>
      <style>{`
        @keyframes wave {
          0% { height: 20%; }
          100% { height: 100%; }
        }
        .sw-bar {
          width: 1.5px;
          height: 100%;
          background-color: #1db954;
          border-radius: 1px;
          animation: wave 1.2s ease-in-out infinite alternate;
        }
        .sw-bar:nth-child(2) { animation-delay: 0.15s; animation-duration: 0.8s; }
        .sw-bar:nth-child(3) { animation-delay: 0.3s; animation-duration: 1.4s; }
      `}</style>
      <span className="sw-bar"></span>
      <span className="sw-bar"></span>
      <span className="sw-bar"></span>
    </div>
  );
}
