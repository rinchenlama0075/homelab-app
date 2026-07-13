import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { amber, ink } from "../../theme";

// Earned badges are shown bright and proud (identity reinforcement); locked
// "next up" badges are shown dimmed but with a concrete distance to go, so
// the next reward always feels reachable rather than abstract.
export default function BadgeChip({ emoji, name, description, earned = true, teaser }) {
  return (
    <Tooltip title={description || ""} arrow>
      <Stack
        alignItems="center"
        spacing={0.5}
        sx={{
          width: 92,
          p: 1.25,
          borderRadius: 3,
          textAlign: "center",
          border: `1px solid ${earned ? amber : "rgba(15, 28, 46, 0.12)"}`,
          bgcolor: earned ? "#fff1de" : "rgba(15, 28, 46, 0.03)",
          opacity: earned ? 1 : 0.65,
        }}
      >
        <Box sx={{ fontSize: 28, filter: earned ? "none" : "grayscale(1)" }}>{emoji}</Box>
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ color: earned ? ink : "text.secondary", lineHeight: 1.2 }}
        >
          {name}
        </Typography>
        {teaser && (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {teaser}
          </Typography>
        )}
      </Stack>
    </Tooltip>
  );
}
