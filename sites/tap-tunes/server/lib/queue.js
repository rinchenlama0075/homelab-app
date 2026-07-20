const { db } = require("../db");

// The `plays` table *is* the queue: Spotify's own Connect queue (fed via
// provider.queueTrack, several tracks ahead of time) is authoritative for
// actual playback order and keeps the music going through brief control-plane
// hiccups. This engine is the ledger + UI mirror of that: it tracks what was
// requested/paid for, drives the "Now Playing / Up Next" displays, and lets
// the kiosk/owner reconcile state back to us via track-started/track-ended.
class QueueEngine {
  constructor(io, provider) {
    this.io = io;
    this.provider = provider;
  }

  room(venueId) {
    return `venue:${venueId}`;
  }

  broadcast(venueId, event, payload) {
    this.io.to(this.room(venueId)).emit(event, payload);
  }

  getSnapshot(venueId) {
    const nowPlaying = db
      .prepare(
        "SELECT * FROM plays WHERE venue_id = ? AND status = 'playing' ORDER BY started_at DESC LIMIT 1"
      )
      .get(venueId);
    const upNext = db
      .prepare(
        "SELECT * FROM plays WHERE venue_id = ? AND status = 'queued' ORDER BY requested_at ASC LIMIT 50"
      )
      .all(venueId);
    return { nowPlaying: nowPlaying || null, upNext };
  }

  queueDepth(venueId) {
    return db
      .prepare("SELECT COUNT(*) AS n FROM plays WHERE venue_id = ? AND status = 'queued'")
      .get(venueId).n;
  }

  // Basic anti-spam: don't let the exact same track be queued twice within
  // a short window (still queued, playing, or just played).
  wasRecentlyRequested(venueId, trackUri, withinMinutes = 20) {
    const row = db
      .prepare(
        `SELECT id FROM plays
         WHERE venue_id = ? AND track_uri = ? AND status IN ('queued', 'playing')
         UNION
         SELECT id FROM plays
         WHERE venue_id = ? AND track_uri = ? AND status = 'played'
           AND ended_at > datetime('now', ?)
         LIMIT 1`
      )
      .get(venueId, trackUri, venueId, trackUri, `-${withinMinutes} minutes`);
    return Boolean(row);
  }

  async enqueue(venue, track, { sessionId, purchaseId, priceCents }) {
    const result = db
      .prepare(
        `INSERT INTO plays (venue_id, session_id, purchase_id, track_uri, track_name, artist_name, duration_ms, price_cents, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued')`
      )
      .run(
        venue.id,
        sessionId,
        purchaseId ?? null,
        track.uri,
        track.name,
        track.artist,
        track.durationMs ?? null,
        priceCents
      );

    // Best-effort: if Spotify is briefly unreachable the row still exists as
    // "queued" in our ledger and the kiosk will pick it up on its own next
    // poll/backoff rather than losing the paid request.
    try {
      await this.provider.queueTrack(venue, track);
    } catch (err) {
      console.error(`[queue] failed to push track to provider for venue ${venue.slug}:`, err.message);
    }

    const play = db.prepare("SELECT * FROM plays WHERE id = ?").get(result.lastInsertRowid);
    this.broadcast(venue.id, "queue:updated", this.getSnapshot(venue.id));
    return play;
  }

  markTrackStarted(venueId, trackUri) {
    const play = db
      .prepare(
        "SELECT * FROM plays WHERE venue_id = ? AND track_uri = ? AND status = 'queued' ORDER BY requested_at ASC LIMIT 1"
      )
      .get(venueId, trackUri);
    if (!play) return null;
    db.prepare("UPDATE plays SET status = 'playing', started_at = datetime('now') WHERE id = ?").run(
      play.id
    );
    const updated = { ...play, status: "playing" };
    this.broadcast(venueId, "queue:updated", this.getSnapshot(venueId));
    return updated;
  }

  markTrackEnded(venueId, trackUri) {
    const play = db
      .prepare("SELECT * FROM plays WHERE venue_id = ? AND track_uri = ? AND status = 'playing'")
      .get(venueId, trackUri);
    if (!play) return null;
    db.prepare("UPDATE plays SET status = 'played', ended_at = datetime('now') WHERE id = ?").run(
      play.id
    );
    this.broadcast(venueId, "queue:updated", this.getSnapshot(venueId));
    return play;
  }

  skip(venueId, playId) {
    const info = db
      .prepare("UPDATE plays SET status = 'skipped', ended_at = datetime('now') WHERE id = ? AND venue_id = ? AND status IN ('queued','playing')")
      .run(playId, venueId);
    if (info.changes > 0) {
      this.broadcast(venueId, "queue:updated", this.getSnapshot(venueId));
    }
    return info.changes > 0;
  }
}

module.exports = { QueueEngine };
