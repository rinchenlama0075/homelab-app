import { Navigate, useLocation } from "react-router-dom";
import { Container, Stack, CircularProgress } from "@mui/material";
import { useAuth } from "../../context/AuthContext";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Container sx={{ py: 10 }}>
        <Stack alignItems="center">
          <CircularProgress color="secondary" />
        </Stack>
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/social/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
