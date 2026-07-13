(() => {
  const loginView = document.getElementById("login-view");
  const dashboardView = document.getElementById("dashboard-view");
  const logsView = document.getElementById("logs-view");
  const logoutBtn = document.getElementById("logout-btn");
  const globalError = document.getElementById("global-error");

  let autoRefreshTimer = null;
  let currentLogContainer = null;

  async function api(path, options = {}) {
    const res = await fetch(`/api${path}`, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (res.status === 401) {
      showLogin();
      throw new Error("Not authenticated");
    }
    return res;
  }

  function showError(message) {
    globalError.textContent = message;
    globalError.hidden = !message;
  }

  function showLogin() {
    stopAutoRefresh();
    loginView.hidden = false;
    dashboardView.hidden = true;
    logsView.hidden = true;
    logoutBtn.hidden = true;
  }

  function showDashboard() {
    loginView.hidden = true;
    dashboardView.hidden = false;
    logsView.hidden = true;
    logoutBtn.hidden = false;
    loadDashboard();
  }

  function showLogs(name) {
    stopAutoRefresh();
    dashboardView.hidden = true;
    logsView.hidden = false;
    currentLogContainer = name;
    document.getElementById("logs-title").textContent = name;
    loadLogs();
  }

  function renderKv(el, rows) {
    if (!rows.length) {
      el.innerHTML = '<p class="k">Nothing yet.</p>';
      return;
    }
    el.innerHTML = rows
      .map(
        ({ k, v }) =>
          `<div class="kv-row"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v)}</span></div>`
      )
      .join("");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  async function loadDashboard() {
    showError("");
    await Promise.all([loadStatus(), loadDeploys(), loadHealth(), loadContainers()]).catch((err) => {
      if (err.message !== "Not authenticated") showError(err.message);
    });
  }

  async function loadStatus() {
    const res = await api("/status");
    const data = await res.json();
    renderKv(document.getElementById("status-body"), [
      { k: "Now", v: data.now },
      { k: "Project", v: data.project },
      { k: "Admin uptime", v: `${data.admin.uptimeSeconds}s` },
      { k: "Node", v: data.admin.nodeVersion },
    ]);
  }

  async function loadDeploys() {
    const res = await api("/deploys");
    const { deploys } = await res.json();
    renderKv(
      document.getElementById("deploys-body"),
      deploys.map((d) => ({
        k: d.site,
        v: `${d.status || "unknown"} · ${d.commitSha ? d.commitSha.slice(0, 7) : "?"} · ${d.deployedAt || "?"}`,
      }))
    );
  }

  async function loadHealth() {
    const res = await api("/health-history");
    const { checks } = await res.json();
    renderKv(
      document.getElementById("health-body"),
      checks.slice(0, 8).map((c) => ({
        k: `${c.site} ${c.ok ? "✓" : "✗"}`,
        v: `${c.latencyMs != null ? `${c.latencyMs}ms · ` : ""}${c.checkedAt || ""}`,
      }))
    );
  }

  async function loadContainers() {
    const res = await api("/containers");
    const { containers } = await res.json();
    const list = document.getElementById("containers-list");
    if (!containers.length) {
      list.innerHTML = "<li>No containers found.</li>";
      return;
    }
    list.innerHTML = containers
      .map(
        (c) => `
      <li class="container-item">
        <div class="container-info">
          <div class="container-name"><span class="state-dot ${c.state}"></span>${escapeHtml(c.name)}</div>
          <div class="container-meta">${escapeHtml(c.status)} · ${escapeHtml(c.image)}</div>
        </div>
        <button data-container="${escapeHtml(c.name)}" class="view-logs-btn">Logs</button>
      </li>`
      )
      .join("");

    list.querySelectorAll(".view-logs-btn").forEach((btn) => {
      btn.addEventListener("click", () => showLogs(btn.dataset.container));
    });
  }

  async function loadLogs() {
    if (!currentLogContainer) return;
    const tail = document.getElementById("tail-select").value;
    const output = document.getElementById("logs-output");
    try {
      const res = await api(`/containers/${encodeURIComponent(currentLogContainer)}/logs?tail=${tail}`);
      const text = await res.text();
      output.textContent = text || "(no output)";
      output.scrollTop = output.scrollHeight;
    } catch (err) {
      if (err.message !== "Not authenticated") showError(err.message);
    }
  }

  function stopAutoRefresh() {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }
    document.getElementById("auto-refresh").checked = false;
  }

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("login-error");
    errorEl.hidden = true;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Login failed." }));
        errorEl.textContent = error;
        errorEl.hidden = false;
        return;
      }
      document.getElementById("password").value = "";
      showDashboard();
    } catch {
      errorEl.textContent = "Could not reach the admin service.";
      errorEl.hidden = false;
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    showLogin();
  });

  document.getElementById("back-btn").addEventListener("click", () => {
    stopAutoRefresh();
    currentLogContainer = null;
    dashboardView.hidden = false;
    logsView.hidden = true;
  });

  document.getElementById("refresh-logs-btn").addEventListener("click", loadLogs);
  document.getElementById("tail-select").addEventListener("change", loadLogs);

  document.getElementById("auto-refresh").addEventListener("change", (e) => {
    stopAutoRefreshTimerOnly();
    if (e.target.checked) {
      autoRefreshTimer = setInterval(loadLogs, 5000);
    }
  });

  function stopAutoRefreshTimerOnly() {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }
  }

  (async function init() {
    try {
      const res = await fetch("/api/session", { credentials: "same-origin" });
      const { authenticated } = await res.json();
      authenticated ? showDashboard() : showLogin();
    } catch {
      showLogin();
    }
  })();
})();
