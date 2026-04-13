'use client';

export default function NowPlaying({ songData }) {
  if (!songData || !songData.title) {
    return (
      <div className="now-playing" id="now-playing">
        <div className="album-art-placeholder">
          <div className="no-song-icon">🎵</div>
        </div>
        <p className="now-playing-empty">Waiting for the DJ to start playing...</p>
      </div>
    );
  }

  return (
    <div className="now-playing" id="now-playing">
      <div className="album-art-container">
        {songData.albumArt ? (
          <img
            src={songData.albumArt}
            alt={`${songData.title} album art`}
            className="album-art"
            id="album-art-img"
          />
        ) : (
          <div className="album-art-placeholder">
            <div className="no-art-icon">🎵</div>
          </div>
        )}
      </div>

      <div className="song-info">
        <h2 className="song-title" id="song-title">{songData.title}</h2>
        <p className="song-artist" id="song-artist">
          {songData.artist}
          {songData.album && <span className="song-album"> — {songData.album}</span>}
        </p>
        {songData.songUrl && (
          <a
            href={songData.songUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="song-link"
            id="song-external-link"
          >
            🔗 {songData.source === 'itunes' ? 'Listen on Apple Music' : 'Listen on Deezer'}
          </a>
        )}
      </div>
    </div>
  );
}
