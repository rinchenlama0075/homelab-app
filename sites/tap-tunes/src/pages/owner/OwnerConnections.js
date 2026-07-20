import { useEffect, useState } from "react";
import { ownerApi } from "../../api/client";

export default function OwnerConnections() {
  const [venue, setVenue] = useState(null);
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState(null);

  function refresh() {
    ownerApi.getVenue().then((d) => setVenue(d.venue));
  }

  useEffect(refresh, []);

  async function connectSpotify() {
    try {
      const { url } = await ownerApi.spotifyConnectUrl();
      window.open(url, "_blank", "noopener");
    } catch (err) {
      setError(err.message);
    }
  }

  async function connectStripe() {
    try {
      const { url } = await ownerApi.stripeConnectUrl();
      window.open(url, "_blank", "noopener");
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadDevices() {
    setError(null);
    try {
      const { devices } = await ownerApi.spotifyDevices();
      setDevices(devices);
    } catch (err) {
      setError(err.message);
    }
  }

  async function activate(deviceId) {
    await ownerApi.activateDevice(deviceId);
    refresh();
  }

  async function regenerateKioskToken() {
    await ownerApi.regenerateKioskToken();
    refresh();
  }

  if (!venue) return null;

  const kioskUrl = `${window.location.origin}/player/${venue.id}?token=${venue.kiosk_token}`;

  return (
    <div>
      <h2>Connections</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Spotify</h3>
        <p style={{ color: "var(--text-dim)" }}>
          Log the venue's Spotify Premium account in once. Tap Tunes covers this subscription — it's
          how requested songs actually play through your sound system.
        </p>
        <p>Status: {venue.spotify_refresh_token ? "Connected" : "Not connected"}</p>
        <button className="btn" onClick={connectSpotify}>
          {venue.spotify_refresh_token ? "Reconnect Spotify" : "Connect Spotify"}
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Player device (kiosk)</h3>
        <p style={{ color: "var(--text-dim)" }}>
          Open this URL on the kiosk box (Raspberry Pi / mini-PC running Chromium in kiosk mode,
          wired into your amp). Once it's open and shows "Connected", find it below and activate it
          so it becomes the venue's active Spotify Connect device.
        </p>
        <div className="pill" style={{ wordBreak: "break-all", display: "block", marginBottom: 10 }}>
          {kioskUrl}
        </div>
        <button className="btn btn-secondary" onClick={loadDevices}>
          Refresh devices
        </button>
        <ul className="table-list" style={{ marginTop: 10 }}>
          {devices.map((d) => (
            <li key={d.id}>
              <span>
                {d.name} {d.is_active ? "(active)" : ""}
              </span>
              <button className="btn" disabled={d.is_active} onClick={() => activate(d.id)}>
                Activate
              </button>
            </li>
          ))}
        </ul>
        <button
          className="btn btn-secondary"
          style={{ marginTop: 12 }}
          onClick={regenerateKioskToken}
        >
          Regenerate kiosk token (invalidates the URL above)
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Stripe payouts</h3>
        <p style={{ color: "var(--text-dim)" }}>
          Connect a bank account to receive your 3% weekly payout of song-request revenue.
        </p>
        <p>Status: {venue.stripe_connect_account_id ? "Onboarding started" : "Not connected"}</p>
        <button className="btn" onClick={connectStripe}>
          {venue.stripe_connect_account_id ? "Continue Stripe onboarding" : "Connect Stripe"}
        </button>
      </div>
    </div>
  );
}
