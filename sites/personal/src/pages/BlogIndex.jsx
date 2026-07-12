import { Link as RouterLink } from "react-router-dom";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { blogs } from "../data/content";

export default function BlogIndex() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="overline" color="secondary" sx={{ fontWeight: 700 }}>
        Writing
      </Typography>
      <Typography variant="h2" sx={{ mb: 1 }}>
        Blogs
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 5, maxWidth: 560, fontSize: "1.05rem" }}
      >
        Stories from organizing, building, and learning in public.
      </Typography>

      <Stack spacing={2.5}>
        {blogs.map((post) => (
          <Card key={post.slug}>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {post.title}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {post.excerpt}
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                component={RouterLink}
                to={post.path}
                endIcon={<ArrowForwardIcon />}
                color="secondary"
              >
                Read post
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
