async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const venueApi = {
  get: (slug) => request(`/v/${slug}`),
  search: (slug, q) => request(`/v/${slug}/search?q=${encodeURIComponent(q)}`),
  queue: (slug) => request(`/v/${slug}/queue`),
  requestSong: (slug, track) =>
    request(`/v/${slug}/queue`, { method: "POST", body: JSON.stringify(track) }),
  checkout: (slug, tokens) =>
    request(`/v/${slug}/checkout`, { method: "POST", body: JSON.stringify({ tokens }) }),
};

export const playerApi = {
  bootstrap: (venueId, token) => request(`/player/${venueId}/bootstrap?token=${token}`),
  refreshToken: (venueId, token) => request(`/player/${venueId}/token?token=${token}`),
  reportDevice: (venueId, token, deviceId) =>
    request(`/player/${venueId}/device?token=${token}`, {
      method: "POST",
      body: JSON.stringify({ deviceId }),
    }),
  trackStarted: (venueId, token, uri) =>
    request(`/player/${venueId}/track-started?token=${token}`, {
      method: "POST",
      body: JSON.stringify({ uri }),
    }),
  trackEnded: (venueId, token, uri) =>
    request(`/player/${venueId}/track-ended?token=${token}`, {
      method: "POST",
      body: JSON.stringify({ uri }),
    }),
};

export const ownerApi = {
  login: (email, password) =>
    request(`/owner/login`, { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request(`/owner/logout`, { method: "POST" }),
  me: () => request(`/owner/me`),
  getVenue: () => request(`/owner/venue`),
  updateVenue: (patch) => request(`/owner/venue`, { method: "PUT", body: JSON.stringify(patch) }),
  regenerateKioskToken: () => request(`/owner/venue/kiosk-token/regenerate`, { method: "POST" }),
  spotifyConnectUrl: () => request(`/owner/venue/spotify/connect`),
  spotifyDevices: () => request(`/owner/venue/spotify/devices`),
  activateDevice: (deviceId) =>
    request(`/owner/venue/spotify/devices/${deviceId}/activate`, { method: "POST" }),
  stripeConnectUrl: () => request(`/owner/venue/stripe/connect`),
  payouts: () => request(`/owner/venue/payouts`),
  revenue: () => request(`/owner/venue/revenue`),
  queue: () => request(`/owner/venue/queue`),
  skip: (playId) => request(`/owner/venue/queue/${playId}/skip`, { method: "POST" }),
  tables: () => request(`/owner/venue/tables`),
  addTable: (label, nfcSlug) =>
    request(`/owner/venue/tables`, { method: "POST", body: JSON.stringify({ label, nfcSlug }) }),
  removeTable: (id) => request(`/owner/venue/tables/${id}`, { method: "DELETE" }),
};
