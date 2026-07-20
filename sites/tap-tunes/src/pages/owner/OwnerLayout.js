import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ownerApi } from "../../api/client";

export default function OwnerLayout() {
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerApi
      .me()
      .then((data) => setOwner(data.owner))
      .catch(() => navigate("/owner/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function logout() {
    await ownerApi.logout();
    navigate("/owner/login");
  }

  if (loading) return null;
  if (!owner) return null;

  return (
    <div className="owner-shell">
      <nav className="owner-nav">
        <div style={{ padding: "0 12px 20px", fontWeight: 700 }}>Tap Tunes</div>
        <NavLink to="/owner/queue">Live queue</NavLink>
        <NavLink to="/owner/settings">Pricing &amp; playlist</NavLink>
        <NavLink to="/owner/tags">NFC tags</NavLink>
        <NavLink to="/owner/connections">Connections</NavLink>
        <button className="btn btn-secondary btn-block" style={{ marginTop: 20 }} onClick={logout}>
          Sign out
        </button>
      </nav>
      <div className="owner-content">
        <Outlet />
      </div>
    </div>
  );
}
