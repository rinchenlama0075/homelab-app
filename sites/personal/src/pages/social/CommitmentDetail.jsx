import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import AppHeader from "../../components/social/AppHeader";
import PostComposer from "../../components/social/PostComposer";
import PostCard from "../../components/social/PostCard";
import StreakFlame from "../../components/social/StreakFlame";
import AtRiskBanner from "../../components/social/AtRiskBanner";
import { getCommitment, getFeed } from "../../api/socialApi";
import { useAuth } from "../../context/AuthContext";

function formatShortDate(dateString) {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function CommitmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [commitment, setCommitment] = useState(null);
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([getCommitment(id), getFeed(id)])
      .then(([loadedCommitment, loadedPosts]) => {
        setCommitment(loadedCommitment);
        setPosts(loadedPosts);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function handlePostCreated(post) {
    setPosts((prev) => [post, ...(prev || [])]);
    // Re-fetch rather than patch counts locally: streak/at-risk state depends
    // on the full check-in history, not just a simple increment.
    getCommitment(id).then(setCommitment).catch(() => {});
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
        <AppHeader />
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={load}>
              Try again
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!commitment) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
        <AppHeader />
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress color="secondary" />
        </Stack>
      </Container>
    );
  }

  const isOwner = user?.id === commitment.owner.id;
  const progress = Math.min(
    100,
    Math.round((commitment.checkInsThisWeek / commitment.targetPerWeek) * 100)
  );

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <AppHeader />

      <Link
        component={RouterLink}
        to="/social/commitments"
        variant="body2"
        sx={{ display: "inline-block", mb: 2 }}
      >
        ← All commitments
      </Link>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box>
          <Typography variant="h2">{commitment.title}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            @{commitment.owner.username} · {commitment.targetPerWeek}x / week
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={1}>
          <StreakFlame
            weeks={commitment.currentStreakWeeks}
            longest={commitment.longestStreakWeeks}
            size="medium"
          />
          {commitment.isEnded ? (
            <Chip
              label="🏁 Completed"
              size="small"
              sx={{ bgcolor: "success.main", color: "#fff", fontWeight: 700 }}
            />
          ) : (
            commitment.endDate && (
              <Chip
                label={
                  commitment.daysRemaining === 0
                    ? "Ends today"
                    : `⏳ ${commitment.daysRemaining}d left`
                }
                size="small"
                variant="outlined"
              />
            )
          )}
        </Stack>
      </Stack>

      {commitment.endDate && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {commitment.isEnded ? "Challenge ended" : "Challenge ends"}{" "}
          {formatShortDate(commitment.endDate)}
        </Typography>
      )}

      {commitment.longestStreakWeeks > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Longest streak: {commitment.longestStreakWeeks} week
          {commitment.longestStreakWeeks === 1 ? "" : "s"}
        </Typography>
      )}

      {commitment.isEnded && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {commitment.longestStreakWeeks > 0
            ? "This challenge is complete — nice work seeing it through!"
            : "This challenge has ended."}
        </Alert>
      )}

      {commitment.isAtRisk && (
        <AtRiskBanner
          message={`${commitment.checkInsNeededThisWeek} more check-in${
            commitment.checkInsNeededThisWeek === 1 ? "" : "s"
          } saves your ${commitment.currentStreakWeeks}-week streak — check in before the week ends`}
        />
      )}

      {commitment.description && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          {commitment.description}
        </Typography>
      )}

      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            This week
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={700}>
            {commitment.checkInsThisWeek}/{commitment.targetPerWeek}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          color="secondary"
          sx={{ height: 10, borderRadius: 999 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          {commitment.totalCheckIns} check-in{commitment.totalCheckIns === 1 ? "" : "s"} total
        </Typography>
      </Box>

      {isOwner && !commitment.isEnded && (
        <PostComposer commitmentId={commitment.id} onPostCreated={handlePostCreated} />
      )}

      <Divider sx={{ mb: 3 }} />

      {posts?.length === 0 && (
        <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
          No check-ins yet{isOwner ? " — post the first one above!" : "."}
        </Typography>
      )}

      {posts?.map((post) => <PostCard key={post.id} post={post} />)}
    </Container>
  );
}
