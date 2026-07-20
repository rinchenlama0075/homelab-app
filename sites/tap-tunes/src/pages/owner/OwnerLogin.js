import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ownerApi } from "../../api/client";

export default function OwnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await ownerApi.login(email, password);
      navigate("/owner/queue");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen container" style={{ justifyContent: "center" }}>
      <div className="venue-header">
        <h1>Tap Tunes — Owner</h1>
      </div>
      <form className="card" onSubmit={onSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-row">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-block" disabled={busy} type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
