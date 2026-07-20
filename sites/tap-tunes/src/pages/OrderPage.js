import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { venueApi } from "../api/client";
import { joinVenueRoom } from "../socket";
import TrackRow from "../components/TrackRow";
import BundlePicker from "../components/BundlePicker";
import QueueList from "../components/QueueList";

export default function OrderPage() {
  const { venueSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [venue, setVenue] = useState(null);
  const [session, setSession] = useState(null);
  const [queue, setQueue] = useState({ nowPlaying: null, upNext: [] });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showBundles, setShowBundles] = useState(false);
  const searchTimer = useRef(null);

  const loadVenue = useCallback(async () => {
    try {
      const data = await venueApi.get(venueSlug);
      setVenue(data.venue);
      setSession(data.session);
      setQueue(data.queue);
    } catch (err) {
      setError(err.message);
    }
  }, [venueSlug]);

  useEffect(() => {
    loadVenue();
  }, [loadVenue]);

  // Stripe redirects back here after Checkout; tokens are credited by the
  // webhook slightly out-of-band, so poll a few times rather than assuming
  // it's already landed by the time the browser redirect completes.
  useEffect(() => {
    if (searchParams.get("purchase") !== "success") return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      loadVenue();
      if (attempts >= 5) clearInterval(interval);
    }, 1500);
    return () => clearInterval(interval);
  }, [searchParams, loadVenue]);

  useEffect(() => {
    if (!venue) return;
    const unsubscribe = joinVenueRoom(venue.id ?? venueSlug, setQueue);
    return unsubscribe;
  }, [venue, venueSlug]);

  function onSearchChange(value) {
    setQuery(value);
    clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await venueApi.search(venueSlug, value);
        setResults(data.tracks);
      } catch (err) {
        setError(err.message);
      }
    }, 350);
  }

  async function requestSong(track) {
    setError(null);
    setBusy(true);
    try {
      const data = await venueApi.requestSong(venueSlug, track);
      setSession((s) => ({ ...s, tokensRemaining: data.tokensRemaining }));
      setResults([]);
      setQuery("");
    } catch (err) {
      setError(err.message);
      if (err.message.toLowerCase().includes("credit")) setShowBundles(true);
    } finally {
      setBusy(false);
    }
  }

  async function buyBundle(tokens) {
    setError(null);
    setBusy(true);
    try {
      const data = await venueApi.checkout(venueSlug, tokens);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (!venue && !error) {
    return (
      <div className="screen container">
        <p style={{ color: "var(--text-dim)", textAlign: "center", marginTop: 40 }}>Loading...</p>
      </div>
    );
  }

  if (error && !venue) {
    return (
      <div className="screen container">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="venue-header">
        <h1>{venue.name}</h1>
        <p>Pick a song. It goes straight into the queue.</p>
        <div className="pill" style={{ marginTop: 8 }}>
          {session.tokensRemaining} song credit{session.tokensRemaining === 1 ? "" : "s"} left
        </div>
      </div>

      <div className="container">
        {error && <div className="error-banner">{error}</div>}

        <div className="card">
          <button className="btn btn-block" onClick={() => setShowBundles((s) => !s)}>
            {showBundles ? "Hide bundles" : "Buy song credits"}
          </button>
          {showBundles && (
            <div style={{ marginTop: 12 }}>
              <BundlePicker bundles={venue.bundles} onPick={buyBundle} busy={busy} />
            </div>
          )}
        </div>

        <div className="card">
          <input
            className="search-input"
            placeholder="Search for a song or artist"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {results.map((track) => (
            <TrackRow
              key={track.uri}
              track={track}
              action={
                <button className="btn" disabled={busy} onClick={() => requestSong(track)}>
                  Play
                </button>
              }
            />
          ))}
        </div>

        <QueueList nowPlaying={queue.nowPlaying} upNext={queue.upNext} />
      </div>
    </div>
  );
}
