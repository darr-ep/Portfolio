import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './SpotifyWidget.css';

interface SpotifyData {
  listening_to_spotify: boolean;
  spotify: {
    song: string;
    artist: string;
    album_art_url: string;
    track_id: string;
  } | null;
}

type Placement = 'hero' | 'floating';

const SPOTIFY_GLYPH = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.98-.336.075-.67-.135-.746-.472-.075-.336.136-.67.472-.746 3.847-.878 7.143-.505 9.82.135.295.18.388.565.207.856zm1.224-2.724c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.08-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.678-1.117 8.246-.576 11.35 1.332.367.226.487.707.26 1.074zm.106-2.833C14.382 8.87 8.568 8.68 5.18 9.71c-.52.157-1.072-.14-1.23-.66-.157-.52.14-1.072.66-1.23 3.89-1.18 10.31-.96 14.38 1.46.47.28.62.89.34 1.36-.28.47-.89.62-1.36.34z" />
  </svg>
);

export default function SpotifyWidget() {
  const [data, setData] = useState<SpotifyData | null>(null);
  // placement and visibility are decoupled so the position only changes while the widget is
  // invisible (opacity 0) — no jump from fixed → in-flow mid-fade.
  const [placement, setPlacement] = useState<Placement>('hero');
  const [visible, setVisible] = useState(true);
  const placementRef = useRef<Placement>('hero');
  const busyRef = useRef(false);

  useEffect(() => {
    const fetchSpotify = async () => {
      try {
        const res = await fetch('/api/lanyard');
        const json = await res.json();
        if (json.success) {
          setData({ listening_to_spotify: json.data.listening_to_spotify, spotify: json.data.spotify });
        } else {
          setData({ listening_to_spotify: false, spotify: null });
        }
      } catch {
        setData({ listening_to_spotify: false, spotify: null });
      }
    };

    fetchSpotify();
    const interval = setInterval(fetchSpotify, 30_000);

    const THRESHOLD = 120;
    // Mount at the new placement with opacity 0, then flip to 1 on the next painted frame so the
    // CSS transition has a 0→1 to animate. Without this the portaled node mounts already at
    // opacity 1 and pops in with no fade.
    const revealNextFrame = () => {
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    };

    const handleScroll = () => {
      if (busyRef.current) return;
      const scrolled = window.scrollY > THRESHOLD;

      if (scrolled && placementRef.current === 'hero') {
        busyRef.current = true;
        // Hero widget already scrolled out of view — mount floating invisible and fade in directly.
        setVisible(false);
        placementRef.current = 'floating';
        setPlacement('floating');
        revealNextFrame();
        busyRef.current = false;
      } else if (!scrolled && placementRef.current === 'floating') {
        busyRef.current = true;
        setVisible(false); // fade out while still floating
        setTimeout(() => {
          placementRef.current = 'hero';
          setPlacement('hero'); // re-mounts in place still invisible
          revealNextFrame();
          busyRef.current = false;
        }, 380);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!data) return null;

  const { listening_to_spotify, spotify } = data;
  const isFloating = placement === 'floating';
  const opacity = visible ? 1 : 0;
  const scale = visible ? 1 : 0.92;

  const node = (
    <div
      className={`spotify-widget${isFloating ? ' spotify-widget--floating' : ''}`}
      style={{ opacity, transform: `scale(${scale})` }}
    >
      {listening_to_spotify && spotify ? (
        <a
          className="spotify-card"
          href={`https://open.spotify.com/track/${spotify.track_id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="spotify-art">
            <img src={spotify.album_art_url} alt={spotify.song} />
            <span className="spotify-badge" aria-hidden="true">
              <span style={{ width: 8, height: 8, display: 'flex' }}>{SPOTIFY_GLYPH}</span>
            </span>
          </div>

          <div className="spotify-meta">
            <div className="spotify-now-row">
              <span className="spotify-now">LISTENING NOW</span>
              <SoundWave />
            </div>
            <div className="spotify-track">
              <span className="spotify-song">{spotify.song}</span>
              <span className="spotify-artist">{spotify.artist}</span>
            </div>
          </div>
        </a>
      ) : (
        <div className="spotify-offline">
          <span className="spotify-offline-icon" aria-hidden="true">
            <span style={{ width: 12, height: 12, display: 'flex' }}>{SPOTIFY_GLYPH}</span>
          </span>
          <span className="spotify-offline-text">SPOTIFY OFFLINE</span>
        </div>
      )}
    </div>
  );

  // When floating, portal to <body> so position:fixed resolves against the viewport — the hero's
  // GSAP entrance leaves a transform on .spotify-slot, which would otherwise become the fixed
  // containing block and trap the widget next to the name instead of the screen corner.
  if (isFloating && typeof document !== 'undefined') {
    return createPortal(node, document.body);
  }
  return node;
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
