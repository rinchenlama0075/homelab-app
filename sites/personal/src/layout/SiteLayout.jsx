import { useState } from "react";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import EmailIcon from "@mui/icons-material/Email";
import { navLinks, profile } from "../data/content";
import { amber, ink } from "../theme";

const socialIconButtons = [
  { Icon: EmailIcon, href: `mailto:${profile.email}`, label: "Email" },
  { Icon: GitHubIcon, href: profile.socials.github, label: "GitHub" },
  { Icon: LinkedInIcon, href: profile.socials.linkedin, label: "LinkedIn" },
  { Icon: InstagramIcon, href: profile.socials.instagram, label: "Instagram" },
  { Icon: YouTubeIcon, href: profile.socials.youtube, label: "YouTube" },
];

function NavLink({ to, label, onClick }) {
  const location = useLocation();
  const active =
    to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(to);

  return (
    <Button
      component={RouterLink}
      to={to}
      onClick={onClick}
      sx={{
        color: ink,
        opacity: active ? 1 : 0.72,
        position: "relative",
        fontWeight: active ? 700 : 560,
        "&::after": {
          content: '""',
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 6,
          height: 2,
          borderRadius: 1,
          backgroundColor: amber,
          transform: active ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 220ms ease",
        },
        "&:hover::after": {
          transform: "scaleX(1)",
        },
      }}
    >
      {label}
    </Button>
  );
}

export default function SiteLayout() {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            sx={{
              textDecoration: "none",
              color: ink,
              flexGrow: { xs: 1, md: 0 },
              mr: { md: 3 },
              fontFamily: '"Fraunces", Georgia, serif',
            }}
          >
            Rinchen Lama
          </Typography>

          <Stack
            direction="row"
            spacing={0.5}
            sx={{ display: { xs: "none", md: "flex" }, flexGrow: 1 }}
          >
            {navLinks.map((item) => (
              <NavLink key={item.to} {...item} />
            ))}
          </Stack>

          <Stack
            direction="row"
            spacing={0.5}
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
            {socialIconButtons.map(({ Icon, href, label }) => (
              <IconButton
                key={label}
                component="a"
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                aria-label={label}
                size="small"
                sx={{ color: ink }}
              >
                <Icon fontSize="small" />
              </IconButton>
            ))}
          </Stack>

          <IconButton
            edge="end"
            onClick={() => setOpen(true)}
            sx={{ display: { md: "none" }, color: ink }}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 260, pt: 1 }} role="presentation">
          <List>
            {navLinks.map((item) => (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={() => setOpen(false)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          animation: "pageIn 420ms ease",
          "@keyframes pageIn": {
            from: { opacity: 0, transform: "translateY(10px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <Outlet />
      </Box>

      <Box
        component="footer"
        sx={{
          mt: 8,
          py: 4,
          borderTop: "1px solid rgba(15, 28, 46, 0.08)",
          backgroundColor: "rgba(255, 252, 247, 0.7)",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontFamily: '"Fraunces", Georgia, serif' }}
              >
                Rinchen Lama
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Building toward human prosperity — one project at a time.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {socialIconButtons.map(({ Icon, href, label }) => (
                <IconButton
                  key={label}
                  component="a"
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={label}
                  sx={{ color: ink }}
                >
                  <Icon />
                </IconButton>
              ))}
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Rinchen Lama ·{" "}
            <Link href={`mailto:${profile.email}`} underline="hover">
              {profile.email}
            </Link>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
