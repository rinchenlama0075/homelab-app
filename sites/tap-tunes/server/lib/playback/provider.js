// Playback backend abstraction. Spotify (./spotify.js) is the only
// implementation today, but the queue engine and routes only ever call
// through this shape, so a YouTube/Apple Music backend could be dropped in
// later without touching lib/queue.js, routes/, or the customer PWA.
//
// A provider must implement:
//   search(query, { limit }) -> Promise<Track[]>
//     Track: { uri, name, artist, albumArt, durationMs, explicit }
//
//   getAuthUrl(venueId) -> string
//     Where to send the venue owner to grant playback control (OAuth-style
//     providers) during onboarding.
//
//   handleOAuthCallback(code, venueId) -> Promise<void>
//     Persist whatever long-lived credential the provider needs for this
//     venue (e.g. a refresh token) onto the venues row.
//
//   queueTrack(venue, track) -> Promise<void>
//     Push a track onto the *provider's* live queue for this venue's
//     player device. Should be safe to call several tracks ahead of time
//     so a brief control-plane outage doesn't interrupt audio.
//
//   getPlaybackState(venue) -> Promise<{ isPlaying, trackUri, progressMs } | null>
//
//   listDevices(venue) -> Promise<Device[]>
//   transferPlayback(venue, deviceId) -> Promise<void>
//     Used once when the kiosk box first opens the player page, to make it
//     the active output device for the venue's account.

class PlaybackProvider {
  async search(_query, _opts) {
    throw new Error("not implemented");
  }
  async getAuthUrl(_venueId) {
    throw new Error("not implemented");
  }
  async handleOAuthCallback(_code, _venueId) {
    throw new Error("not implemented");
  }
  async queueTrack(_venue, _track) {
    throw new Error("not implemented");
  }
  async getPlaybackState(_venue) {
    throw new Error("not implemented");
  }
  async listDevices(_venue) {
    throw new Error("not implemented");
  }
  async transferPlayback(_venue, _deviceId) {
    throw new Error("not implemented");
  }
}

module.exports = { PlaybackProvider };
