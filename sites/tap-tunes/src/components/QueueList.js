import TrackRow from "./TrackRow";

export default function QueueList({ nowPlaying, upNext, ownerActions, onSkip }) {
  return (
    <div className="card">
      <div className="pill">Now playing</div>
      {nowPlaying ? (
        <div className="now-playing" style={{ marginTop: 10 }}>
          <div className="track-art" />
          <div className="track-meta">
            <div className="track-name">{nowPlaying.track_name}</div>
            <div className="track-artist">{nowPlaying.artist_name}</div>
          </div>
        </div>
      ) : (
        <p style={{ color: "var(--text-dim)", marginTop: 10 }}>House playlist (nothing requested yet)</p>
      )}

      <div className="pill" style={{ marginTop: 16 }}>
        Up next ({upNext.length})
      </div>
      <ul className="queue-list" style={{ marginTop: 10 }}>
        {upNext.length === 0 && (
          <li style={{ color: "var(--text-dim)", padding: "8px 0" }}>Nothing queued right now.</li>
        )}
        {upNext.map((play) => (
          <li key={play.id}>
            <TrackRow
              track={{ name: play.track_name, artist: play.artist_name }}
              action={
                ownerActions ? (
                  <button className="btn btn-secondary" onClick={() => onSkip(play.id)}>
                    Skip
                  </button>
                ) : null
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
