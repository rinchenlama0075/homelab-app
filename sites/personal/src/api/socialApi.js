async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error || "Something went wrong. Please try again.");
  }

  return data;
}

export function getMe() {
  return request("/auth/me").then((data) => data.user);
}

export function signup(username, password) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  }).then((data) => data.user);
}

export function login(username, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  }).then((data) => data.user);
}

export function logout() {
  return request("/auth/logout", { method: "POST" });
}

export function getFeed(commitmentId) {
  const query = commitmentId ? `?commitmentId=${commitmentId}` : "";
  return request(`/posts${query}`).then((data) => data.posts);
}

export function createPost(commitmentId, imageFile, caption) {
  const formData = new FormData();
  formData.append("commitmentId", commitmentId);
  formData.append("image", imageFile);
  formData.append("caption", caption || "");
  return request("/posts", { method: "POST", body: formData }).then((data) => ({
    post: data.post,
    badgesEarned: data.badgesEarned || [],
  }));
}

export function getCommitments({ mine } = {}) {
  const query = mine ? "?mine=1" : "";
  return request(`/commitments${query}`).then((data) => data.commitments);
}

export function getCommitment(id) {
  return request(`/commitments/${id}`).then((data) => data.commitment);
}

export function createCommitment({ title, description, targetPerWeek, endDate }) {
  return request("/commitments", {
    method: "POST",
    body: JSON.stringify({ title, description, targetPerWeek, endDate: endDate || null }),
  }).then((data) => data.commitment);
}

export function toggleLike(postId) {
  return request(`/posts/${postId}/like`, { method: "POST" });
}

export function getComments(postId) {
  return request(`/posts/${postId}/comments`).then((data) => data.comments);
}

export function addComment(postId, body) {
  return request(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  }).then((data) => data.comment);
}

export function getProfile(username) {
  return request(`/users/${username}`);
}
