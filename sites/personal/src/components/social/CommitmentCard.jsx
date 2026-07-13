import { Link as RouterLink } from "react-router-dom";
import { Box, Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { amber } from "../../theme";
import StreakFlame from "./StreakFlame";
import AtRiskBanner from "./AtRiskBanner";

export default function CommitmentCard({ commitment }) {
  const {
    id,
    title,
    description,
    targetPerWeek,
    owner,
    checkInsThisWeek,
    totalCheckIns,
    currentStreakWeeks,
    longestStreakWeeks,
    isAtRisk,
    checkInsNeededThisWeek,
  } = commitment;
  const progress = Math.min(100, Math.round((checkInsThisWeek / targetPerWeek) * 100));
  const metTarget = checkInsThisWeek >= targetPerWeek;

  return (
    <Card
      component={RouterLink}
      to={`/social/commitments/${id}`}
      sx={{ display: "block", mb: 2.5, p: 2, textDecoration: "none", color: "inherit" }}
    >
      <CardContent sx={{ p: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              @{owner.username} · {targetPerWeek}x / week
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <StreakFlame weeks={currentStreakWeeks} longest={longestStreakWeeks} />
            {metTarget && (
              <Chip
                label="On track"
                size="small"
                sx={{ bgcolor: amber, color: "#fffaf3", fontWeight: 700 }}
              />
            )}
          </Stack>
        </Stack>

        {isAtRisk && (
          <AtRiskBanner
            dense
            message={`${checkInsNeededThisWeek} more check-in${
              checkInsNeededThisWeek === 1 ? "" : "s"
            } saves your ${currentStreakWeeks}-week streak this week`}
          />
        )}

        {description && (
          <Typography variant="body2" sx={{ mt: 1, mb: 1.5 }}>
            {description}
          </Typography>
        )}

        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ mb: 0.5, mt: description ? 0 : 1.5 }}
        >
          <Typography variant="caption" color="text.secondary">
            This week
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            {checkInsThisWeek}/{targetPerWeek}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          color="secondary"
          sx={{ height: 8, borderRadius: 999 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          {totalCheckIns} check-in{totalCheckIns === 1 ? "" : "s"} total
        </Typography>
      </CardContent>
    </Card>
  );
}
