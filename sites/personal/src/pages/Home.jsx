import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { profile } from "../data/content";
import { amber, ink } from "../theme";

export default function Home() {
  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: "78vh", md: "88vh" },
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          backgroundColor: ink,
        }}
      >
        <Box
          component="img"
          src={profile.portrait}
          alt="Rinchen Lama"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 20%",
            opacity: 0.55,
            animation: "heroFade 900ms ease both",
            "@keyframes heroFade": {
              from: { opacity: 0, transform: "scale(1.04)" },
              to: { opacity: 0.55, transform: "scale(1)" },
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(15,28,46,0.15) 0%, rgba(15,28,46,0.55) 45%, rgba(15,28,46,0.92) 100%)",
          }}
        />
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 1,
            pb: { xs: 6, md: 10 },
            pt: { xs: 14, md: 18 },
            animation: "heroText 700ms ease 120ms both",
            "@keyframes heroText": {
              from: { opacity: 0, transform: "translateY(18px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: amber, letterSpacing: "0.18em", fontWeight: 700 }}
          >
            Software Engineer
          </Typography>
          <Typography
            variant="h1"
            sx={{
              color: "#fffcf7",
              fontSize: { xs: "2.8rem", sm: "3.8rem", md: "5rem" },
              maxWidth: 720,
              mb: 2,
            }}
          >
            Rinchen Lama
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: "rgba(255,252,247,0.86)",
              fontWeight: 400,
              maxWidth: 560,
              mb: 4,
              fontFamily: '"Figtree", sans-serif',
              lineHeight: 1.45,
            }}
          >
            {profile.tagline}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={RouterLink}
              to="/projects"
              variant="contained"
              color="secondary"
              endIcon={<ArrowForwardIcon />}
              size="large"
            >
              See projects
            </Button>
            <Button
              component={RouterLink}
              to="/resume"
              variant="outlined"
              size="large"
              sx={{
                color: "#fffcf7",
                borderColor: "rgba(255,252,247,0.45)",
                "&:hover": {
                  borderColor: "#fffcf7",
                  backgroundColor: "rgba(255,252,247,0.08)",
                },
              }}
            >
              View resume
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          About me
        </Typography>
        {profile.about.split("\n\n").map((para) => (
          <Typography
            key={para.slice(0, 24)}
            variant="body1"
            color="text.secondary"
            sx={{ mb: 2, fontSize: "1.1rem", lineHeight: 1.75 }}
          >
            {para}
          </Typography>
        ))}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
          <Button
            component="a"
            href={`mailto:${profile.email}`}
            variant="contained"
            color="primary"
          >
            Email me
          </Button>
          <Button
            component={RouterLink}
            to="/blogs"
            variant="outlined"
            color="primary"
          >
            Read blogs
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
