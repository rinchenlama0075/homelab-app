import {
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { workItems } from "../data/content";

export default function Work() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="overline" color="secondary" sx={{ fontWeight: 700 }}>
        Community & media
      </Typography>
      <Typography variant="h2" sx={{ mb: 1 }}>
        Work
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 5, maxWidth: 560, fontSize: "1.05rem" }}
      >
        Organizing, building in the open, and sharing along the way.
      </Typography>

      <Stack spacing={3}>
        {workItems.map((item) => (
          <Card key={item.title}>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 1.5 }}>
                {item.title}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.7 }}
              >
                {item.body}
              </Typography>
            </CardContent>
            {item.links?.length > 0 && (
              <CardActions sx={{ px: 2, pb: 2, flexWrap: "wrap", gap: 1 }}>
                {item.links.map((link) => (
                  <Button
                    key={link.href}
                    component="a"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNewIcon fontSize="small" />}
                    size="small"
                    color="secondary"
                  >
                    {link.label}
                  </Button>
                ))}
              </CardActions>
            )}
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
