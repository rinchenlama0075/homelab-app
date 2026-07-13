const DOCKER_PROXY_URL = process.env.DOCKER_PROXY_URL || "http://docker-proxy:2375";
const COMPOSE_PROJECT = process.env.COMPOSE_PROJECT || "personal";

/**
 * Docker's /containers/{id}/logs endpoint multiplexes stdout/stderr into
 * frames of an 8-byte header ([streamType, 0, 0, 0, sizeBE32]) followed by
 * `size` bytes of payload, *unless* the container was created with a TTY.
 * None of this project's services allocate a TTY, so we always demux.
 */
function demuxDockerLogStream(buffer) {
  const lines = [];
  let offset = 0;

  while (offset + 8 <= buffer.length) {
    const streamType = buffer.readUInt8(offset);
    const size = buffer.readUInt32BE(offset + 4);

    // Not a recognizable frame header (e.g. plain-text/TTY logs) — bail out
    // and return the remaining buffer as-is rather than risk corrupting it.
    if (streamType > 2 || offset + 8 + size > buffer.length) {
      return buffer.toString("utf8");
    }

    const payload = buffer.slice(offset + 8, offset + 8 + size).toString("utf8");
    lines.push(payload);
    offset += 8 + size;
  }

  return lines.join("");
}

async function dockerProxyFetch(path) {
  const res = await fetch(`${DOCKER_PROXY_URL}${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`docker-proxy ${path} -> ${res.status} ${body}`.trim());
  }
  return res;
}

async function listContainers() {
  const res = await dockerProxyFetch("/containers/json?all=1");
  const raw = await res.json();

  return raw
    .filter((c) => c.Labels?.["com.docker.compose.project"] === COMPOSE_PROJECT)
    .map((c) => ({
      id: c.Id,
      name: (c.Names?.[0] || "").replace(/^\//, ""),
      service: c.Labels?.["com.docker.compose.service"] || null,
      image: c.Image,
      state: c.State,
      status: c.Status,
      createdAt: new Date(c.Created * 1000).toISOString(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getContainerLogs(containerId, tail) {
  const res = await dockerProxyFetch(
    `/containers/${encodeURIComponent(containerId)}/logs?stdout=1&stderr=1&timestamps=1&tail=${encodeURIComponent(tail)}`
  );
  const buffer = Buffer.from(await res.arrayBuffer());
  return demuxDockerLogStream(buffer);
}

module.exports = { listContainers, getContainerLogs, COMPOSE_PROJECT };
