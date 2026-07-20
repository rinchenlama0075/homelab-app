import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { playerApi } from "../api/client";
import { joinVenueRoom } from "../socket";

function loadSpotifySdk() {
  return new Promise((resolve) => {
    if (window.Spotify) return resolve(window.Spotify);
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => resolve(window.Spotify);
  });
}

// This is the physical box at the bar: a Chromium kiosk pinned to
// /player/:venueId?token=<kiosk token>, wired into the venue's amp via
// 3.5mm/USB audio out. It becomes a Spotify Connect device via the Web
// Playback SDK, and reports track-started/track-ended back to the API so
// QueueEngine (server-side) can advance the ledger — actual playback order
// is driven by Spotify's own queue (see lib/queue.js), so a dropped
// WebSocket here doesn't stop the music already flowing.
export default function PlayerKioskPage() {
  const { venueId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [venue, setVenue] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [queue, setQueue] = useState({ nowPlaying: null, upNext: [] });
  const [status, setStatus] = useState("Connecting...");
  const currentUriRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setStatus("Missing kiosk token in URL.");
      return;
    }

    let cancelled = false;

    async function setup() {
      const bootstrap = await playerApi.bootstrap(venueId, token).catch((err) => {
        setStatus(err.message);
        return null;
      });
      if (!bootstrap || cancelled) return;
      setVenue(bootstrap.venue);
      setQueue(bootstrap.queue);

      const Spotify = await loadSpotifySdk();
      if (cancelled) return;

      const player = new Spotify.Player({
        name: `Tap Tunes — ${bootstrap.venue.name}`,
        getOAuthToken: async (cb) => {
          const { accessToken } = await playerApi.refreshToken(venueId, token);
          cb(accessToken);
        },
        volume: 0.8,
      });
      playerRef.current = player;

      player.addListener("ready", async ({ device_id }) => {
        setStatus("Connected");
        await playerApi.reportDevice(venueId, token, device_id).catch(() => {});
      });

      player.addListener("not_ready", () => setStatus("Device went offline — reconnecting..."));
      player.addListener("initialization_error", ({ message }) => setStatus(`Init error: ${message}`));
      player.addListener("authentication_error", ({ message }) => setStatus(`Auth error: ${message}`));
      player.addListener("account_error", ({ message }) =>
        setStatus(`Account error (needs Spotify Premium): ${message}`)
      );

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        const track = state.track_window.current_track;
        setNowPlaying(track);

        const newUri = track?.uri || null;
        if (newUri && newUri !== currentUriRef.current) {
          if (currentUriRef.current) {
            playerApi.trackEnded(venueId, token, currentUriRef.current).catch(() => {});
          }
          playerApi.trackStarted(venueId, token, newUri).catch(() => {});
          currentUriRef.current = newUri;
        }
      });

      await player.connect();
    }

    setup();
    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
    };
  }, [venueId, token]);

  useEffect(() => {
    if (!venue) return;
    const unsubscribe = joinVenueRoom(venue.id, setQueue);
    return unsubscribe;
  }, [venue]);

  return (
    <div className="kiosk-screen">
      {venue ? (
        <>
          <div className="pill">{venue.name}</div>
          {nowPlaying ? (
            <>
              {nowPlaying.album?.images?.[0]?.url && (
                <img
                  src={nowPlaying.album.images[0].url}
                  alt=""
                  style={{ width: 220, height: 220, borderRadius: 16, marginTop: 20 }}
                />
              )}
              <div className="kiosk-now-playing">{nowPlaying.name}</div>
              <div className="kiosk-artist">
                {nowPlaying.artists?.map((a) => a.name).join(", ")}
              </div>
            </>
          ) : (
            <div className="kiosk-now-playing" style={{ fontSize: "1.6rem" }}>
              {status}
            </div>
          )}

          <div className="kiosk-up-next">
            <h3>Up next</h3>
            {queue.upNext.length === 0 ? (
              <p style={{ color: "var(--text-dim)" }}>Nothing queued — tap a table to add a song.</p>
            ) : (
              queue.upNext.slice(0, 5).map((play) => (
                <div key={play.id} style={{ padding: "6px 0" }}>
                  {play.track_name} — <span style={{ color: "var(--text-dim)" }}>{play.artist_name}</span>
                </div>
              ))
            )}
          </div>

          <div className="kiosk-nfc-cta">Tap your phone here to pick the next song</div>
        </>
      ) : (
        <div className="kiosk-now-playing" style={{ fontSize: "1.6rem" }}>
          {status}
        </div>
      )}
    </div>
  );
}
