import { useCallback, useEffect, useState } from "react";
import { ownerApi } from "../../api/client";
import QueueList from "../../components/QueueList";

export default function OwnerDashboard() {
  const [queue, setQueue] = useState({ nowPlaying: null, upNext: [] });
  const [revenue, setRevenue] = useState(null);

  const refresh = useCallback(() => {
    ownerApi.queue().then(setQueue).catch(() => {});
    ownerApi.revenue().then((d) => setRevenue(d.revenue)).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function skip(playId) {
    await ownerApi.skip(playId);
    refresh();
  }

  return (
    <div>
      <h2>Tonight</h2>
      {revenue && (
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <strong>${(revenue.today_cents / 100).toFixed(2)}</strong>
            <span>Today</span>
          </div>
          <div className="stat-card">
            <strong>${(revenue.week_cents / 100).toFixed(2)}</strong>
            <span>Last 7 days</span>
          </div>
          <div className="stat-card">
            <strong>${(revenue.month_cents / 100).toFixed(2)}</strong>
            <span>Last 30 days</span>
          </div>
          <div className="stat-card">
            <strong>{revenue.total_plays}</strong>
            <span>Total plays</span>
          </div>
        </div>
      )}
      <QueueList
        nowPlaying={queue.nowPlaying}
        upNext={queue.upNext}
        ownerActions
        onSkip={skip}
      />
    </div>
  );
}
