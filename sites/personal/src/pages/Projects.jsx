import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Container,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { projects } from "../data/content";

export default function Projects() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="overline" color="secondary" sx={{ fontWeight: 700 }}>
        Selected work
      </Typography>
      <Typography variant="h2" sx={{ mb: 1 }}>
        Projects
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 5, maxWidth: 560, fontSize: "1.05rem" }}
      >
        From nonprofit sites to energy education and community hackathons.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
          },
        }}
      >
        {projects.map((project) => (
          <Card
            key={project.title}
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            {project.image && (
              <CardMedia
                component="img"
                image={project.image}
                alt={project.title}
                sx={{
                  height: 220,
                  objectFit: "cover",
                }}
              />
            )}
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ mb: 1.25 }}>
                {project.title}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.7 }}
              >
                {project.body}
              </Typography>
            </CardContent>
            {project.href && (
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  component="a"
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon fontSize="small" />}
                  color="secondary"
                >
                  {project.cta || "Learn more"}
                </Button>
              </CardActions>
            )}
          </Card>
        ))}
      </Box>
    </Container>
  );
}
