import { Routes, Route, Navigate } from "react-router-dom";
import OrderPage from "./pages/OrderPage";
import PlayerKioskPage from "./pages/PlayerKioskPage";
import OwnerLogin from "./pages/owner/OwnerLogin";
import OwnerLayout from "./pages/owner/OwnerLayout";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerSettings from "./pages/owner/OwnerSettings";
import OwnerTags from "./pages/owner/OwnerTags";
import OwnerConnections from "./pages/owner/OwnerConnections";
import Landing from "./pages/Landing";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/v/:venueSlug" element={<OrderPage />} />
      <Route path="/player/:venueId" element={<PlayerKioskPage />} />

      <Route path="/owner/login" element={<OwnerLogin />} />
      <Route path="/owner" element={<OwnerLayout />}>
        <Route index element={<Navigate to="queue" replace />} />
        <Route path="queue" element={<OwnerDashboard />} />
        <Route path="settings" element={<OwnerSettings />} />
        <Route path="tags" element={<OwnerTags />} />
        <Route path="connections" element={<OwnerConnections />} />
      </Route>

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
