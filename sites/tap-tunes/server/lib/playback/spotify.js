const { db } = require("../../db");
const { PlaybackProvider } = require("./provider");

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "";
const ACCOUNTS_BASE = "https://accounts.spotify.com";
const API_BASE = "https://api.spotify.com/v1";

// One venue at a time is a small enough scale that a plain in-memory map of
// short-lived access tokens (keyed by venue id) is fine; every entry is
// re-derivable from the venue's stored refresh token, so a process restart
// just means one extra token exchange per venue on next use.
const accessTokenCache = new Map(); // venueId -> { token, expiresAt }
let clientCredentialsCache = { token: null, expiresAt: 0 };

async function spotifyFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Spotify API ${options.method || "GET"} ${url} -> ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Used for catalog search, which doesn't need any particular venue's
// permission — Spotify's app-only "Client Credentials" grant.
async function getClientCredentialsToken() {
  if (clientCredentialsCache.token && clientCredentialsCache.expiresAt > Date.now()) {
    return clientCredentialsCache.token;
  }
  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const data = await spotifyFetch(`${ACCOUNTS_BASE}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body,
  });
  clientCredentialsCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return clientCredentialsCache.token;
}

// Used for everything that acts on a specific venue's Premium account
// (queueing, device transfer, playback state) — Authorization Code grant,
// refreshed from the long-lived refresh_token stored on the venue row.
async function getVenueAccessToken(venue) {
  if (!venue.spotify_refresh_token) {
    throw new Error(`Venue ${venue.slug} has not connected a Spotify account yet`);
  }
  const cached = accessTokenCache.get(venue.id);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: venue.spotify_refresh_token,
  });
  const data = await spotifyFetch(`${ACCOUNTS_BASE}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body,
  });

  // Spotify only returns a new refresh_token occasionally; keep the old one
  // unless a replacement was actually issued.
  if (data.refresh_token) {
    db.prepare("UPDATE venues SET spotify_refresh_token = ? WHERE id = ?").run(
      data.refresh_token,
      venue.id
    );
  }

  accessTokenCache.set(venue.id, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  });
  return data.access_token;
}

function mapTrack(item) {
  return {
    uri: item.uri,
    name: item.name,
    artist: (item.artists || []).map((a) => a.name).join(", "),
    albumArt: item.album?.images?.[2]?.url || item.album?.images?.[0]?.url || null,
    durationMs: item.duration_ms,
    explicit: Boolean(item.explicit),
  };
}

class SpotifyProvider extends PlaybackProvider {
  async search(query, { limit = 20 } = {}) {
    const token = await getClientCredentialsToken();
    const params = new URLSearchParams({ q: query, type: "track", limit: String(limit) });
    const data = await spotifyFetch(`${API_BASE}/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return (data.tracks?.items || []).map(mapTrack);
  }

  getAuthUrl(venueId) {
    const scope = [
      "streaming",
      "user-read-email",
      "user-read-private",
      "user-read-playback-state",
      "user-modify-playback-state",
    ].join(" ");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID,
      scope,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state: String(venueId),
    });
    return `${ACCOUNTS_BASE}/authorize?${params}`;
  }

  async handleOAuthCallback(code, venueId) {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    });
    const data = await spotifyFetch(`${ACCOUNTS_BASE}/api/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body,
    });
    db.prepare("UPDATE venues SET spotify_refresh_token = ? WHERE id = ?").run(
      data.refresh_token,
      venueId
    );
  }

  async queueTrack(venue, track) {
    const token = await getVenueAccessToken(venue);
    const params = new URLSearchParams({ uri: track.uri });
    if (venue.spotify_device_id) params.set("device_id", venue.spotify_device_id);
    await spotifyFetch(`${API_BASE}/me/player/queue?${params}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getPlaybackState(venue) {
    const token = await getVenueAccessToken(venue);
    const data = await spotifyFetch(`${API_BASE}/me/player`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!data) return null;
    return {
      isPlaying: Boolean(data.is_playing),
      trackUri: data.item?.uri || null,
      progressMs: data.progress_ms || 0,
      durationMs: data.item?.duration_ms || 0,
    };
  }

  async listDevices(venue) {
    const token = await getVenueAccessToken(venue);
    const data = await spotifyFetch(`${API_BASE}/me/player/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.devices || [];
  }

  async transferPlayback(venue, deviceId) {
    const token = await getVenueAccessToken(venue);
    await spotifyFetch(`${API_BASE}/me/player`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ device_ids: [deviceId], play: false }),
    });
    db.prepare("UPDATE venues SET spotify_device_id = ? WHERE id = ?").run(deviceId, venue.id);
  }

  // Web Playback SDK runs in the kiosk's browser and needs a bearer token
  // client-side to initialize — not part of the abstract PlaybackProvider
  // contract (that's Spotify-specific plumbing), just exposed for
  // routes/player.js to hand to the kiosk page on bootstrap/refresh.
  async getAccessTokenForBrowser(venue) {
    return getVenueAccessToken(venue);
  }

  // Convenience for the "always something playing" fallback: put the
  // venue's house playlist on shuffle so the kiosk never goes silent
  // between paid requests.
  async playHousePlaylist(venue) {
    if (!venue.house_playlist_uri) return;
    const token = await getVenueAccessToken(venue);
    await spotifyFetch(`${API_BASE}/me/player/shuffle?state=true`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    await spotifyFetch(`${API_BASE}/me/player/play`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ context_uri: venue.house_playlist_uri }),
    });
  }
}

module.exports = { SpotifyProvider, spotifyConfigured: () => Boolean(SPOTIFY_CLIENT_ID) };
