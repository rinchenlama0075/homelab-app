import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import SendIcon from "@mui/icons-material/Send";
import FlagIcon from "@mui/icons-material/Flag";
import { addComment, getComments, toggleLike } from "../../api/socialApi";
import formatRelativeTime from "../../utils/formatRelativeTime";
import { amber } from "../../theme";

function initials(username) {
  return username?.slice(0, 2).toUpperCase() || "?";
}

function MilestoneHero({ milestone }) {
  if (!milestone) return null;
  return (
    <Box
      sx={{
        py: 4,
        px: 2,
        textAlign: "center",
        background: `linear-gradient(135deg, ${amber} 0%, #e8a84a 100%)`,
        color: "#fffaf3",
      }}
    >
      <Box sx={{ fontSize: 44, lineHeight: 1 }}>{milestone.emoji}</Box>
      <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>
        {milestone.badgeName}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.9 }}>
        {milestone.description}
        {milestone.commitmentTitle ? ` · "${milestone.commitmentTitle}"` : ""}
      </Typography>
    </Box>
  );
}

export default function PostCard({ post }) {
  const isMilestone = post.type === "milestone";
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likeBusy, setLikeBusy] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  async function handleToggleLike() {
    if (likeBusy) return;
    setLikeBusy(true);
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setLikeCount((count) => count + (optimisticLiked ? 1 : -1));
    try {
      const result = await toggleLike(post.id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(!optimisticLiked);
      setLikeCount((count) => count + (optimisticLiked ? -1 : 1));
    } finally {
      setLikeBusy(false);
    }
  }

  async function handleToggleComments() {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    if (nextOpen && comments === null) {
      try {
        const loaded = await getComments(post.id);
        setComments(loaded);
      } catch {
        setComments([]);
      }
    }
  }

  async function handleAddComment(event) {
    event.preventDefault();
    const body = commentDraft.trim();
    if (!body || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const comment = await addComment(post.id, body);
      setComments((prev) => [...(prev || []), comment]);
      setCommentCount((count) => count + 1);
      setCommentDraft("");
    } catch {
      // Keep the draft so the user can retry.
    } finally {
      setCommentSubmitting(false);
    }
  }

  return (
    <Card sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2, pb: 1.5 }}>
        <Avatar sx={{ bgcolor: amber, width: 36, height: 36, fontSize: 14 }}>
          {initials(post.author.username)}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" fontWeight={700}>
              {post.author.username}
            </Typography>
            {isMilestone && (
              <Chip
                label="Milestone"
                size="small"
                sx={{ bgcolor: amber, color: "#fffaf3", fontWeight: 700, height: 20 }}
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {formatRelativeTime(post.createdAt)}
          </Typography>
        </Box>
      </Stack>

      {isMilestone ? (
        <MilestoneHero milestone={post.milestone} />
      ) : (
        <CardMedia
          component="img"
          image={post.imageUrl}
          alt={post.caption || `Post by ${post.author.username}`}
          sx={{ maxHeight: 560, objectFit: "cover" }}
        />
      )}

      <CardContent>
        {post.commitment && (
          <Chip
            component={RouterLink}
            to={`/social/commitments/${post.commitment.id}`}
            icon={<FlagIcon fontSize="small" />}
            label={`${post.commitment.title} · ${post.commitment.targetPerWeek}x/week`}
            size="small"
            clickable
            sx={{
              mb: 1.5,
              bgcolor: amber,
              color: "#fffaf3",
              fontWeight: 700,
              "& .MuiChip-icon": { color: "#fffaf3" },
            }}
          />
        )}

        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{ mb: !isMilestone && post.caption ? 1 : 0 }}
        >
          <IconButton onClick={handleToggleLike} aria-label="Like post" size="small">
            {liked ? <FavoriteIcon fontSize="small" sx={{ color: amber }} /> : <FavoriteBorderIcon fontSize="small" />}
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1.5 }}>
            {likeCount}
          </Typography>

          <IconButton onClick={handleToggleComments} aria-label="Toggle comments" size="small">
            <ChatBubbleOutlineIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {commentCount}
          </Typography>
        </Stack>

        {!isMilestone && post.caption && (
          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            <Typography component="span" fontWeight={700}>
              {post.author.username}
            </Typography>{" "}
            {post.caption}
          </Typography>
        )}

        <Collapse in={commentsOpen} unmountOnExit>
          <Divider sx={{ my: 1.5 }} />
          <Stack spacing={1} sx={{ mb: 1.5 }}>
            {comments === null && (
              <Typography variant="body2" color="text.secondary">
                Loading comments…
              </Typography>
            )}
            {comments?.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No comments yet — be the first!
              </Typography>
            )}
            {comments?.map((comment) => (
              <Typography key={comment.id} variant="body2" sx={{ lineHeight: 1.6 }}>
                <Typography component="span" fontWeight={700}>
                  {comment.author.username}
                </Typography>{" "}
                {comment.body}
              </Typography>
            ))}
          </Stack>

          <Stack
            component="form"
            direction="row"
            spacing={1}
            alignItems="center"
            onSubmit={handleAddComment}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Add a comment…"
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value.slice(0, 280))}
              disabled={commentSubmitting}
            />
            <IconButton
              type="submit"
              aria-label="Post comment"
              size="small"
              disabled={!commentDraft.trim() || commentSubmitting}
              sx={{ color: amber }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
}
