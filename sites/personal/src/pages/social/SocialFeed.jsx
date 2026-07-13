import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../context/AuthContext";
import { getFeed } from "../../api/socialApi";
import PostComposer from "../../components/social/PostComposer";
import PostCard from "../../components/social/PostCard";

export default function SocialFeed() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);

  const loadFeed = useCallback(() => {
    setError(null);
    getFeed()
      .then(setPosts)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  function handlePostCreated(post) {
    setPosts((prev) => [post, ...(prev || [])]);
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
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
          <Typography variant="h2">Feed</Typography>
          <Typography variant="body1" color="text.secondary">
            Signed in as <strong>{user?.username}</strong>
          </Typography>
        </Box>
        <Button startIcon={<LogoutIcon />} onClick={logout} size="small">
          Log out
        </Button>
      </Stack>

      <PostComposer onPostCreated={handlePostCreated} />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {posts === null && !error && (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress color="secondary" />
        </Stack>
      )}

      {posts?.length === 0 && (
        <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
          No posts yet — share the first one!
        </Typography>
      )}

      {posts?.map((post) => <PostCard key={post.id} post={post} />)}
    </Container>
  );
}
