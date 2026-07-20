export default function TrackRow({ track, action }) {
  return (
    <div className="track-row">
      {track.albumArt ? (
        <img className="track-art" src={track.albumArt} alt="" />
      ) : (
        <div className="track-art" />
      )}
      <div className="track-meta">
        <div className="track-name">{track.name}</div>
        <div className="track-artist">{track.artist}</div>
      </div>
      {action}
    </div>
  );
}
