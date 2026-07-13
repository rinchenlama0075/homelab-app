import { Chip, Tooltip } from "@mui/material";
import { amber } from "../../theme";

// A visible, breakable streak is the core loss-aversion hook: showing "how
// many weeks in a row" motivates more than an abstract progress bar because
// there's now something concrete to lose.
export default function StreakFlame({ weeks, longest, size = "small" }) {
  if (!weeks || weeks <= 0) return null;

  const label = `${weeks} week${weeks === 1 ? "" : "s"} streak`;
  const tooltip =
    longest && longest > weeks
      ? `${label} · longest streak: ${longest} weeks`
      : label;

  return (
    <Tooltip title={tooltip} arrow>
      <Chip
        label={`🔥 ${weeks}`}
        size={size}
        sx={{
          bgcolor: "#fff1de",
          color: amber,
          fontWeight: 700,
          border: `1px solid ${amber}`,
        }}
      />
    </Tooltip>
  );
}
