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

export function getFeed() {
  return request("/posts").then((data) => data.posts);
}

export function createPost(imageFile, caption) {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("caption", caption || "");
  return request("/posts", { method: "POST", body: formData }).then((data) => data.post);
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
