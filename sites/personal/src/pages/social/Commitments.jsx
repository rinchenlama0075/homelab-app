import { useCallback, useEffect, useState } from "react";
import { Alert, CircularProgress, Container, Divider, Stack, Typography } from "@mui/material";
import AppHeader from "../../components/social/AppHeader";
import CommitmentComposer from "../../components/social/CommitmentComposer";
import CommitmentCard from "../../components/social/CommitmentCard";
import { getCommitments } from "../../api/socialApi";
import { useAuth } from "../../context/AuthContext";

export default function Commitments() {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState(null);
  const [error, setError] = useState(null);

  const loadCommitments = useCallback(() => {
    setError(null);
    getCommitments()
      .then(setCommitments)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadCommitments();
  }, [loadCommitments]);

  function handleCreated(commitment) {
    setCommitments((prev) => [commitment, ...(prev || [])]);
  }

  const mine = commitments?.filter((c) => c.owner.id === user?.id) || [];
  const others = commitments?.filter((c) => c.owner.id !== user?.id) || [];

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <AppHeader />

      <Typography variant="h2" sx={{ mb: 3 }}>
        My Commitments
      </Typography>

      <CommitmentComposer onCreated={handleCreated} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {commitments === null && !error && (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress color="secondary" />
        </Stack>
      )}

      {commitments !== null && mine.length === 0 && (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          You haven't made a commitment yet — start one above.
        </Typography>
      )}

      {mine.map((commitment) => (
        <CommitmentCard key={commitment.id} commitment={commitment} />
      ))}

      {others.length > 0 && (
        <>
          <Divider sx={{ my: 4 }} />
          <Typography variant="h4" sx={{ mb: 2 }}>
            Everyone's Commitments
          </Typography>
          {others.map((commitment) => (
            <CommitmentCard key={commitment.id} commitment={commitment} />
          ))}
        </>
      )}
    </Container>
  );
}
