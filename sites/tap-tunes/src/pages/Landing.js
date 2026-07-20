export default function Landing() {
  return (
    <div className="screen container">
      <div className="venue-header">
        <h1>Tap Tunes</h1>
        <p>Tap your phone at the bar, pick a song, hear it next.</p>
      </div>
      <div className="card">
        <p>
          This page only ever gets visited directly by mistake — customers land on{" "}
          <code>/v/&lt;venue-slug&gt;</code> from an NFC tag, and the venue's kiosk device is pinned
          to <code>/player/&lt;venue-id&gt;</code>. Bar owners sign in at{" "}
          <a href="/owner/login">/owner/login</a>.
        </p>
      </div>
    </div>
  );
}
