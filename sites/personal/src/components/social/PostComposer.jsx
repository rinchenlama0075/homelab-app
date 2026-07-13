import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import { createPost } from "../../api/socialApi";

const MAX_CAPTION_LENGTH = 280;

export default function PostComposer({ onPostCreated }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

    setSubmitting(true);
    setError(null);
    try {
      const post = await createPost(file, caption);
      onPostCreated?.(post);
      setCaption("");
      clearFile();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="overline" color="secondary" sx={{ fontWeight: 700 }}>
          Share something
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
            placeholder="Add a caption…"
            multiline
            minRows={2}
            maxRows={5}
            value={caption}
            onChange={(event) => setCaption(event.target.value.slice(0, MAX_CAPTION_LENGTH))}
            helperText={`${caption.length}/${MAX_CAPTION_LENGTH}`}
          />

          <Box>
            <Button type="submit" variant="contained" color="secondary" disabled={submitting}>
              {submitting ? "Posting…" : "Post"}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
