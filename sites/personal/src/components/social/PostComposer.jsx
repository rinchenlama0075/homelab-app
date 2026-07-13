import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import { createPost } from "../../api/socialApi";
import { amber } from "../../theme";

const MAX_CAPTION_LENGTH = 280;

export default function PostComposer({ commitmentId, onPostCreated }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [unlockedBadge, setUnlockedBadge] = useState(null);

  function handleFileChange(event) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  }

  function clearFile() {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setError("Please choose a photo to share.");
      return;
    }
    if (!caption.trim()) {
      setError("Add a comment about your check-in.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { post, badgesEarned } = await createPost(commitmentId, file, caption);
      onPostCreated?.(post);
      setCaption("");
      clearFile();
      if (badgesEarned?.length) {
        setUnlockedBadge(badgesEarned[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
      <Snackbar
        open={Boolean(unlockedBadge)}
        autoHideDuration={4000}
        onClose={() => setUnlockedBadge(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setUnlockedBadge(null)}
          icon={false}
          sx={{ bgcolor: amber, color: "#fffaf3", fontWeight: 700 }}
        >
          {unlockedBadge && `${unlockedBadge.emoji} Badge unlocked: ${unlockedBadge.name}!`}
        </Alert>
      </Snackbar>
      <CardContent>
        <Typography variant="overline" color="secondary" sx={{ fontWeight: 700 }}>
          Check in
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 1.5, mb: 1.5 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2} sx={{ mt: 1.5 }}>
          {previewUrl ? (
            <Box sx={{ position: "relative", display: "inline-block" }}>
              <Box
                component="img"
                src={previewUrl}
                alt="Selected preview"
                sx={{
                  maxHeight: 280,
                  borderRadius: 2,
                  display: "block",
                  objectFit: "cover",
                }}
              />
              <Button
                onClick={clearFile}
                size="small"
                startIcon={<CloseIcon fontSize="small" />}
                sx={{ position: "absolute", top: 8, right: 8, minWidth: 0 }}
                variant="contained"
                color="inherit"
              >
                Remove
              </Button>
            </Box>
          ) : (
            <Button
              component="label"
              variant="outlined"
              startIcon={<ImageIcon />}
              sx={{ alignSelf: "flex-start" }}
            >
              Choose a photo
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={handleFileChange}
              />
            </Button>
          )}

          <TextField
            placeholder="How did it go?"
            multiline
            minRows={2}
            maxRows={5}
            value={caption}
            onChange={(event) => setCaption(event.target.value.slice(0, MAX_CAPTION_LENGTH))}
            helperText={`${caption.length}/${MAX_CAPTION_LENGTH}`}
            required
          />

          <Box>
            <Button type="submit" variant="contained" color="secondary" disabled={submitting}>
              {submitting ? "Posting…" : "Check in"}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
