import { createTheme } from "@mui/material/styles";

const ink = "#0f1c2e";
const parchment = "#f7f1e8";
const parchmentDeep = "#efe6d8";
const amber = "#c47a1a";
const amberSoft = "#e8a84a";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: ink,
      contrastText: parchment,
    },
    secondary: {
      main: amber,
      contrastText: "#fffaf3",
    },
    background: {
      default: parchment,
      paper: "#fffcf7",
    },
    text: {
      primary: ink,
      secondary: "rgba(15, 28, 46, 0.72)",
    },
    divider: "rgba(15, 28, 46, 0.12)",
  },
  typography: {
    fontFamily: '"Figtree", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.1,
    },
    h2: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 550,
    },
    h4: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 550,
    },
    h5: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 550,
    },
    h6: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 550,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: parchment,
          backgroundImage: `radial-gradient(ellipse at top left, ${parchmentDeep} 0%, ${parchment} 55%, #f3ebe0 100%)`,
          minHeight: "100vh",
        },
        a: {
          color: amber,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(247, 241, 232, 0.88)",
          color: ink,
          backdropFilter: "blur(12px)",
          boxShadow: "none",
          borderBottom: "1px solid rgba(15, 28, 46, 0.08)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 20,
        },
        containedSecondary: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 8px 24px rgba(196, 122, 26, 0.25)",
            backgroundColor: amberSoft,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#fffcf7",
          border: "1px solid rgba(15, 28, 46, 0.08)",
          boxShadow: "0 10px 30px rgba(15, 28, 46, 0.06)",
          transition: "transform 220ms ease, box-shadow 220ms ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 16px 36px rgba(15, 28, 46, 0.1)",
          },
        },
      },
    },
  },
});

export default theme;
export { ink, parchment, amber };
