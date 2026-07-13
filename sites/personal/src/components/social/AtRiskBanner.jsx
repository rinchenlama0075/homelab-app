import { Link as RouterLink } from "react-router-dom";
import { Stack, Typography } from "@mui/material";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";

// Loss-aversion nudge, kept deliberately encouraging rather than guilt-y:
// we always frame it as "save your streak", never "you're failing".
export default function AtRiskBanner({ message, to, dense = false }) {
  return (
    <Stack
      component={to ? RouterLink : "div"}
      to={to}
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{
        px: 1.5,
        py: dense ? 0.75 : 1.25,
        mb: dense ? 1 : 2,
        borderRadius: 2,
        bgcolor: "rgba(237, 108, 2, 0.08)",
        border: "1px solid rgba(237, 108, 2, 0.35)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <LocalFireDepartmentIcon fontSize="small" sx={{ color: "#ed6c02" }} />
      <Typography variant="body2" sx={{ color: "#ed6c02", fontWeight: 600 }}>
        {message}
      </Typography>
    </Stack>
  );
}
