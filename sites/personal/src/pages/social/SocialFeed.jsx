import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AppHeader from "../../components/social/AppHeader";
import { getCommitments, getFeed } from "../../api/socialApi";
import PostCard from "../../components/social/PostCard";
import AtRiskBanner from "../../components/social/AtRiskBanner";

export default function SocialFeed() {
  const [posts, setPosts] = useState(null);
  const [myCommitments, setMyCommitments] = useState(null);
  const [error, setError] = useState(null);

  const loadFeed = useCallback(() => {
    setError(null);
    Promise.all([getFeed(), getCommitments({ mine: true })])
      .then(([loadedPosts, loadedCommitments]) => {
        setPosts(loadedPosts);
        setMyCommitments(loadedCommitments);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const atRiskCommitments = myCommitments?.filter((commitment) => commitment.isAtRisk) || [];

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <AppHeader />

      <Typography variant="h2" sx={{ mb: 3 }}>
        Feed
      </Typography>

      {myCommitments?.length === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="overline" color="secondary" sx={{ fontWeight: 700 }}>
              Get started
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Make a commitment
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pick something you'll show up for — "Go to the gym, 5x a week" — then check in with
              a photo and a comment each time you do it. Other people can follow along, like, and
              comment on your progress.
            </Typography>
            <Button
              component={RouterLink}
              to="/social/commitments"
              variant="contained"
              color="secondary"
              endIcon={<ArrowForwardIcon />}
            >
              Make your first commitment
            </Button>
          </CardContent>
        </Card>
      )}

      {atRiskCommitments.length > 0 && (
        <AtRiskBanner
          to="/social/commitments"
          message={
            atRiskCommitments.length === 1
              ? `${atRiskCommitments[0].checkInsNeededThisWeek} more check-in${
                  atRiskCommitments[0].checkInsNeededThisWeek === 1 ? "" : "s"
                } saves your ${atRiskCommitments[0].currentStreakWeeks}-week streak on "${
                  atRiskCommitments[0].title
                }" — check in before the week ends`
              : `${atRiskCommitments.length} commitments need a check-in before their streaks reset this week`
          }
        />
      )}

      {myCommitments?.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
            >
              <Typography variant="body2" color="text.secondary">
                Time to check in on one of your commitments?
              </Typography>
              <Button
                component={RouterLink}
                to="/social/commitments"
                size="small"
                endIcon={<ArrowForwardIcon />}
              >
                My Commitments
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {posts === null && !error && (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress color="secondary" />
        </Stack>
      )}

      {posts?.length === 0 && (
        <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
          No check-ins yet — be the first to share one!
        </Typography>
      )}

      {posts?.map((post) => <PostCard key={post.id} post={post} />)}
    </Container>
  );
}
