import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { hackeoPost } from "../data/content";

export default function BlogHackeo() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Button
        component={RouterLink}
        to="/blogs"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
        color="inherit"
      >
        All blogs
      </Button>

      <Typography variant="overline" color="secondary" sx={{ fontWeight: 700 }}>
        Hackathon story
      </Typography>
      <Typography variant="h2" sx={{ mb: 4, maxWidth: 720 }}>
        {hackeoPost.title}
      </Typography>

      <Stack spacing={4}>
        {hackeoPost.sections.map((section) => (
          <Box key={section.heading}>
            <Typography variant="h4" sx={{ mb: 0.75 }}>
              {section.heading}
            </Typography>
            {section.subheading && (
              <Typography
                variant="subtitle1"
                color="secondary"
                sx={{ mb: 1.5, fontWeight: 600 }}
              >
                {section.subheading}
              </Typography>
            )}
            {section.body.split("\n\n").map((para) => (
              <Typography
                key={para.slice(0, 32)}
                color="text.secondary"
                sx={{ mb: 1.5, lineHeight: 1.75, whiteSpace: "pre-line" }}
              >
                {para}
              </Typography>
            ))}
            {section.links?.length > 0 && (
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            )}
          </Box>
        ))}
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 6, fontStyle: "italic" }}
      >
        Talks and tutorials from Hackeo — coming soon.
      </Typography>
    </Container>
  );
}
