import {
  Box,
  Button,
  Container,
  Divider,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { profile, resume } from "../data/content";

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 5 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export default function Resume() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="overline" color="secondary" sx={{ fontWeight: 700 }}>
            Curriculum vitae
          </Typography>
          <Typography variant="h2">{profile.name}</Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={500}>
            {resume.headline}
          </Typography>
        </Box>
        <Button
          component="a"
          href={profile.resumePdf}
          download
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
        >
          Download PDF
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 4 }} flexWrap="wrap" useFlexGap>
        <Link href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </Link>
        <Link href={profile.socials.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </Link>
        <Link href={`mailto:${profile.email}`}>{profile.email}</Link>
      </Stack>

      <Divider sx={{ mb: 4 }} />

      <Section title="Education">
        <Typography variant="subtitle1" fontWeight={700}>
          {resume.education.school}
        </Typography>
        <Typography color="text.secondary">{resume.education.degree}</Typography>
      </Section>

      <Section title="Skills & languages">
        <Typography color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
          {resume.skills}
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {resume.languages}
        </Typography>
      </Section>

      <Section title="Professional experience">
        <Stack spacing={3.5}>
          {resume.experience.map((job) => (
            <Box key={`${job.org}-${job.role}`}>
              <Typography variant="h5">{job.role}</Typography>
              <Typography
                variant="subtitle2"
                color="secondary"
                sx={{ mb: 1.25, fontWeight: 700 }}
              >
                {job.org}
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {job.bullets.map((bullet) => (
                  <Typography
                    component="li"
                    key={bullet}
                    color="text.secondary"
                    sx={{ mb: 0.75, lineHeight: 1.65 }}
                  >
                    {bullet}
                  </Typography>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      </Section>

      <Section title="Volunteer work">
        <Stack spacing={3.5}>
          {resume.volunteer.map((item) => (
            <Box key={`${item.org}-${item.role}`}>
              <Typography variant="h5">{item.role}</Typography>
              <Typography
                variant="subtitle2"
                color="secondary"
                sx={{ mb: 1.25, fontWeight: 700 }}
              >
                {item.org}
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 1 }}>
                {item.bullets.map((bullet) => (
                  <Typography
                    component="li"
                    key={bullet}
                    color="text.secondary"
                    sx={{ mb: 0.75, lineHeight: 1.65 }}
                  >
                    {bullet}
                  </Typography>
                ))}
              </Box>
              {item.links?.length > 0 && (
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  {item.links.map((link) => (
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
      </Section>
    </Container>
  );
}
