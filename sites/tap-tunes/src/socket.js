import { io } from "socket.io-client";

let socket = null;

// Lazily create a single shared connection and (re)join the venue room on
// every reconnect — the socket.io client already handles backoff/retry, we
// just need to re-announce which room we care about each time it comes back.
export function joinVenueRoom(venueId, onQueueUpdate) {
  if (!socket) {
    socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
  }
  const join = () => socket.emit("join", venueId);
  socket.on("connect", join);
  socket.on("queue:updated", onQueueUpdate);
  if (socket.connected) join();

  return () => {
    socket.off("connect", join);
    socket.off("queue:updated", onQueueUpdate);
  };
}
