import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createCommitment } from "../../api/socialApi";

const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 280;
const TARGET_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export default function CommitmentComposer({ onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetPerWeek, setTargetPerWeek] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Give your commitment a title.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const commitment = await createCommitment({ title, description, targetPerWeek });
      onCreated?.(commitment);
      setTitle("");
      setDescription("");
      setTargetPerWeek(3);
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
          New commitment
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Make it specific — e.g. "Go to the gym" — and say how many times a week you'll show up
          for it. You'll check in with a photo and a comment each time.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            label="What are you committing to?"
            placeholder="Go to the gym"
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, MAX_TITLE_LENGTH))}
            helperText={`${title.length}/${MAX_TITLE_LENGTH}`}
            required
          />
          <TextField
            label="Details (optional)"
            placeholder="Leg day, cardio, whatever — just show up."
            multiline
            minRows={2}
            maxRows={4}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value.slice(0, MAX_DESCRIPTION_LENGTH))
            }
            helperText={`${description.length}/${MAX_DESCRIPTION_LENGTH}`}
          />
          <TextField
            select
            label="Times per week"
            value={targetPerWeek}
            onChange={(event) => setTargetPerWeek(Number(event.target.value))}
            sx={{ maxWidth: 220 }}
          >
            {TARGET_OPTIONS.map((count) => (
              <MenuItem key={count} value={count}>
                {count}x / week
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <Button type="submit" variant="contained" color="secondary" disabled={submitting}>
              {submitting ? "Creating…" : "Make the commitment"}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
