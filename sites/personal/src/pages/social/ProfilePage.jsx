import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import AppHeader from "../../components/social/AppHeader";
import StreakFlame from "../../components/social/StreakFlame";
import BadgeChip from "../../components/social/BadgeChip";
import AtRiskBanner from "../../components/social/AtRiskBanner";
import { getProfile } from "../../api/socialApi";
import { amber, ink } from "../../theme";

function initials(username) {
  return username?.slice(0, 2).toUpperCase() || "?";
}

function StatBlock({ label, value }) {
  return (
    <Box sx={{ textAlign: "center", minWidth: 84 }}>
      <Typography variant="h4" sx={{ color: ink, fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

function ProfileCommitmentRow({ commitment }) {
  const progress = Math.min(
    100,
    Math.round((commitment.checkInsThisWeek / commitment.targetPerWeek) * 100)
  );

  return (
    <Box
      component={RouterLink}
      to={`/social/commitments/${commitment.id}`}
      sx={{ display: "block", textDecoration: "none", color: "inherit", mb: 2.5 }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {commitment.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {commitment.targetPerWeek}x / week · {commitment.totalCheckIns} check-in
            {commitment.totalCheckIns === 1 ? "" : "s"} total
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          <StreakFlame weeks={commitment.currentStreakWeeks} longest={commitment.longestStreakWeeks} />
          {commitment.isEnded && (
            <Chip
              label="🏁 Completed"
              size="small"
              sx={{ bgcolor: "success.main", color: "#fff", fontWeight: 700 }}
            />
          )}
          {!commitment.isEnded && commitment.endDate && (
            <Chip
              label={
                commitment.daysRemaining === 0 ? "Ends today" : `⏳ ${commitment.daysRemaining}d left`
              }
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
      </Stack>

      {commitment.isAtRisk && (
        <AtRiskBanner
          dense
          message={`${commitment.checkInsNeededThisWeek} more check-in${
            commitment.checkInsNeededThisWeek === 1 ? "" : "s"
          } saves this streak`}
        />
      )}

      <LinearProgress
        variant="determinate"
        value={progress}
        color="secondary"
        sx={{ height: 6, borderRadius: 999, mt: 1 }}
      />
    </Box>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    setProfile(null);
    getProfile(username).then(setProfile).catch((err) => setError(err.message));
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

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

  if (!profile) {
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
        <AppHeader />
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress color="secondary" />
        </Stack>
      </Container>
    );
  }

  const { user, stats, badges, nextBadges, commitments } = profile;
  const lockedTeasers = [
    ...nextBadges.streaks.map((teaser) => ({
      key: `${teaser.badgeCode}-${teaser.commitmentId}`,
      emoji: teaser.emoji,
      name: teaser.badgeName,
      description: `On "${teaser.commitmentTitle}"`,
      teaser: `${teaser.weeksAway} week${teaser.weeksAway === 1 ? "" : "s"} away`,
    })),
    ...(nextBadges.volume
      ? [
          {
            key: nextBadges.volume.badgeCode,
            emoji: nextBadges.volume.emoji,
            name: nextBadges.volume.badgeName,
            description: "Total check-ins",
            teaser: `${nextBadges.volume.checkInsAway} check-in${
              nextBadges.volume.checkInsAway === 1 ? "" : "s"
            } away`,
          },
        ]
      : []),
  ];

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <AppHeader />

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: amber, width: 64, height: 64, fontSize: 24 }}>
          {initials(user.username)}
        </Avatar>
        <Box>
          <Typography variant="h3">{user.username}</Typography>
          <Typography variant="body2" color="text.secondary">
            Member since{" "}
            {new Date(`${user.createdAt.replace(" ", "T")}Z`).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </Typography>
        </Box>
      </Stack>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-around" flexWrap="wrap" spacing={1}>
            <StatBlock label="⭐ Points" value={stats.totalPoints} />
            <StatBlock label="Check-ins" value={stats.totalCheckIns} />
            <StatBlock label="🔥 Active streaks" value={stats.activeStreakCount} />
            <StatBlock label="🏅 Badges" value={stats.badgeCount} />
          </Stack>
          {(stats.longestEverStreak > 0 || stats.completedCount > 0) && (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 2 }}
            >
              {[
                stats.longestEverStreak > 0 &&
                  `Personal best: a ${stats.longestEverStreak}-week streak`,
                stats.completedCount > 0 &&
                  `🏁 ${stats.completedCount} challenge${stats.completedCount === 1 ? "" : "s"} completed`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Badges
      </Typography>
      {badges.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No badges yet — check in on a commitment to start earning them.
        </Typography>
      )}
      <Stack direction="row" spacing={1.5} sx={{ mb: 1, flexWrap: "wrap", rowGap: 1.5 }}>
        {badges.map((badge) => (
          <BadgeChip
            key={`${badge.code}-${badge.commitmentId ?? "account"}`}
            emoji={badge.emoji}
            name={badge.name}
            description={
              badge.commitmentTitle ? `${badge.description} · "${badge.commitmentTitle}"` : badge.description
            }
            earned
          />
        ))}
        {lockedTeasers.map((teaser) => (
          <BadgeChip
            key={teaser.key}
            emoji={teaser.emoji}
            name={teaser.name}
            description={teaser.description}
            teaser={teaser.teaser}
            earned={false}
          />
        ))}
      </Stack>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" sx={{ mb: 2 }}>
        Commitments
      </Typography>
      {commitments.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No commitments yet.
        </Typography>
      )}
      {commitments.map((commitment) => (
        <ProfileCommitmentRow key={commitment.id} commitment={commitment} />
      ))}
    </Container>
  );
}
