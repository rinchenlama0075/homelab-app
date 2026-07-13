import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import { AuthProvider } from "./context/AuthContext";
import SiteLayout from "./layout/SiteLayout";
import Home from "./pages/Home";
import Work from "./pages/Work";
import Projects from "./pages/Projects";
import Resume from "./pages/Resume";
import BlogIndex from "./pages/BlogIndex";
import BlogHackeo from "./pages/BlogHackeo";
import SocialFeed from "./pages/social/SocialFeed";
import SocialLogin from "./pages/social/SocialLogin";
import SocialSignup from "./pages/social/SocialSignup";
import Commitments from "./pages/social/Commitments";
import CommitmentDetail from "./pages/social/CommitmentDetail";
import ProfilePage from "./pages/social/ProfilePage";
import RequireAuth from "./components/social/RequireAuth";

// AuthProvider only wraps the /social/* subtree so the rest of the portfolio
// never makes an auth-check request or depends on the social feature.
function SocialSection() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="work" element={<Work />} />
            <Route path="projects" element={<Projects />} />
            <Route path="resume" element={<Resume />} />
            <Route path="blogs" element={<BlogIndex />} />
            <Route path="blogs/hackeo" element={<BlogHackeo />} />
            <Route path="social" element={<SocialSection />}>
              <Route path="login" element={<SocialLogin />} />
              <Route path="signup" element={<SocialSignup />} />
              <Route
                index
                element={
                  <RequireAuth>
                    <SocialFeed />
                  </RequireAuth>
                }
              />
              <Route
                path="commitments"
                element={
                  <RequireAuth>
                    <Commitments />
                  </RequireAuth>
                }
              />
              <Route
                path="commitments/:id"
                element={
                  <RequireAuth>
                    <CommitmentDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="profile/:username"
                element={
                  <RequireAuth>
                    <ProfilePage />
                  </RequireAuth>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
