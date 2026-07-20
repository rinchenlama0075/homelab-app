import { useEffect, useState } from "react";
import { ownerApi } from "../../api/client";

export default function OwnerTags() {
  const [venue, setVenue] = useState(null);
  const [tables, setTables] = useState([]);
  const [label, setLabel] = useState("");
  const [nfcSlug, setNfcSlug] = useState("");
  const [error, setError] = useState(null);

  function refresh() {
    ownerApi.tables().then((d) => setTables(d.tables));
  }

  useEffect(() => {
    ownerApi.getVenue().then((d) => setVenue(d.venue));
    refresh();
  }, []);

  async function addTable(e) {
    e.preventDefault();
    setError(null);
    try {
      await ownerApi.addTable(label, nfcSlug);
      setLabel("");
      setNfcSlug("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeTable(id) {
    await ownerApi.removeTable(id);
    refresh();
  }

  const origin = window.location.origin;

  return (
    <div>
      <h2>NFC tags</h2>
      <div className="card">
        <p style={{ color: "var(--text-dim)" }}>
          Write each tag (NTAG213/215 stickers work well) with the URL for that table using a phone
          NFC-writer app (e.g. "NFC Tools" on iOS/Android) or Chrome's Web NFC API on Android. Table
          entries here are optional — they only affect analytics and per-table anti-spam, not
          whether the tag works.
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form className="card" onSubmit={addTable}>
        <div className="form-row">
          <label>Table / area label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Tag slug (short, URL-safe, e.g. "bar-3")</label>
          <input value={nfcSlug} onChange={(e) => setNfcSlug(e.target.value)} required />
        </div>
        <button className="btn btn-block" type="submit">
          Add table
        </button>
      </form>

      <div className="card">
        <ul className="table-list">
          {tables.map((t) => (
            <li key={t.id}>
              <span>
                {t.label} — <code>{`${origin}/v/${venue?.slug}?t=${t.nfc_slug}`}</code>
              </span>
              <button className="btn btn-secondary" onClick={() => removeTable(t.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
