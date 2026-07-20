import { useEffect, useState } from "react";
import { ownerApi } from "../../api/client";

export default function OwnerSettings() {
  const [venue, setVenue] = useState(null);
  const [bundlesText, setBundlesText] = useState("");
  const [payouts, setPayouts] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    ownerApi.getVenue().then((d) => {
      setVenue(d.venue);
      setBundlesText(d.venue.price_bundle_config_json);
    });
    ownerApi.payouts().then((d) => setPayouts(d.payouts));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    let priceBundles;
    try {
      priceBundles = JSON.parse(bundlesText);
    } catch {
      setError("Bundle pricing must be valid JSON.");
      return;
    }
    try {
      const data = await ownerApi.updateVenue({
        name: venue.name,
        housePlaylistUri: venue.house_playlist_uri,
        explicitFilter: Boolean(venue.explicit_filter),
        priceBundles,
        maxQueueDepth: Number(venue.max_queue_depth),
        requestCooldownSeconds: Number(venue.request_cooldown_seconds),
      });
      setVenue(data.venue);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!venue) return null;

  return (
    <div>
      <h2>Pricing &amp; playlist</h2>
      {error && <div className="error-banner">{error}</div>}
      {saved && <div className="pill" style={{ marginBottom: 12 }}>Saved</div>}
      <form className="card" onSubmit={save}>
        <div className="form-row">
          <label>Venue name</label>
          <input value={venue.name} onChange={(e) => setVenue({ ...venue, name: e.target.value })} />
        </div>
        <div className="form-row">
          <label>House playlist (Spotify URI, plays when the queue is empty)</label>
          <input
            value={venue.house_playlist_uri || ""}
            placeholder="spotify:playlist:..."
            onChange={(e) => setVenue({ ...venue, house_playlist_uri: e.target.value })}
          />
        </div>
        <div className="form-row">
          <label>
            <input
              type="checkbox"
              checked={Boolean(venue.explicit_filter)}
              onChange={(e) => setVenue({ ...venue, explicit_filter: e.target.checked })}
              style={{ marginRight: 8 }}
            />
            Block explicit tracks from search results
          </label>
        </div>
        <div className="form-row">
          <label>Max songs waiting in queue</label>
          <input
            type="number"
            value={venue.max_queue_depth}
            onChange={(e) => setVenue({ ...venue, max_queue_depth: e.target.value })}
          />
        </div>
        <div className="form-row">
          <label>Cooldown between requests per customer (seconds)</label>
          <input
            type="number"
            value={venue.request_cooldown_seconds}
            onChange={(e) => setVenue({ ...venue, request_cooldown_seconds: e.target.value })}
          />
        </div>
        <div className="form-row">
          <label>Song credit bundles (JSON: tokens / amountCents / label)</label>
          <textarea
            rows={6}
            value={bundlesText}
            onChange={(e) => setBundlesText(e.target.value)}
          />
        </div>
        <button className="btn btn-block" type="submit">
          Save
        </button>
      </form>

      <h2>Payouts (3% of gross plays, paid weekly)</h2>
      <div className="card">
        {payouts.length === 0 && <p style={{ color: "var(--text-dim)" }}>No payouts yet.</p>}
        <ul className="table-list">
          {payouts.map((p) => (
            <li key={p.id}>
              <span>
                {p.period_start.slice(0, 10)} → {p.period_end.slice(0, 10)}
              </span>
              <span>
                ${(p.venue_share_cents / 100).toFixed(2)} · {p.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
