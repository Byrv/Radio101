'use client';

export default function ListenerCount({ count, live }) {
  return (
    <div className="listener-count" id="listener-count">
      <span className={`live-dot ${live ? 'pulse' : ''}`} />
      {live && <span className="live-text">LIVE</span>}
      <span className="count-text">🎧 {count} listening</span>
    </div>
  );
}
