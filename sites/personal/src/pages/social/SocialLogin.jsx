import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Container,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

export default function SocialLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from || "/social";

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="overline" color="secondary" sx={{ fontWeight: 700 }}>
        The App
      </Typography>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Log in
      </Typography>

      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoFocus
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button type="submit" variant="contained" color="secondary" disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </Button>
            <Typography variant="body2" color="text.secondary">
              New here?{" "}
              <Link component={RouterLink} to="/social/signup">
                Create an account
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
