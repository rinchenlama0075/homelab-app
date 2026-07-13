import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../context/AuthContext";
import { amber } from "../../theme";

const TABS = [
  { label: "Feed", to: "/social" },
  { label: "My Commitments", to: "/social/commitments" },
];

function Tab({ label, to, active }) {
  return (
    <Typography
      component={RouterLink}
      to={to}
      variant="body2"
      sx={{
        textDecoration: "none",
        color: active ? amber : "text.secondary",
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </Typography>
  );
}

export default function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="overline" color="secondary" sx={{ fontWeight: 700 }}>
          The App
        </Typography>
        <Stack direction="row" spacing={2.5} sx={{ mt: 0.5, mb: 0.5 }}>
          {TABS.map((tab) => (
            <Tab
              key={tab.to}
              {...tab}
              active={
                tab.to === "/social"
                  ? location.pathname === "/social"
                  : location.pathname.startsWith(tab.to)
              }
            />
          ))}
        </Stack>
        {user && (
          <Typography variant="body2" color="text.secondary">
            Signed in as <strong>{user.username}</strong>
          </Typography>
        )}
      </Box>
      <Button startIcon={<LogoutIcon />} onClick={logout} size="small">
        Log out
      </Button>
    </Stack>
  );
}
