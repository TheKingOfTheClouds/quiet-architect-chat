(() => {
  const root = document.getElementById("qa-chat");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const API_BASE = params.get("apiBase") || ""; // leave blank if same host

  const state = {
    config: null,
    threadId: crypto.randomUUID(),
    messages: [],
    chips: [],
  };

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  async function api(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }

  function push(role, content) {
    state.messages.push({ role, content, ts: Date.now() });
    render();
  }

  async function sendIntent(intent) {
    const res = await api("/chat", { intent });
    if (res?.reply) push("bot", res.reply);
    if (res?.chips) state.chips = res.chips;

    if (res?.action) handleAction(res.action);

    render();
  }

  async function sendMessage(message) {
    push("user", message);
    const res = await api("/chat", { message });
    if (res?.reply) push("bot", res.reply);
    if (res?.chips) state.chips = res.chips;

    if (res?.action) handleAction(res.action);

    render();
  }

  function handleAction(action) {
    if (!action || !action.type) return;

    if (action.type === "open_url" && action.url) {
      window.open(action.url, "_blank", "noopener,noreferrer");
      return;
    }

    if (action.type === "lead_form") {
      push("lead_form", action);
      return;
    }
  }

  async function submitLead(data) {
    const res = await api("/lead", {
      ...data,
      threadId: state.threadId,
      pageUrl: window.location.href,
      businessName: state.config?.businessName || "",
      city: state.config?.city || "",
      source: "chat_widget",
    });

    if (res?.ok) push("bot", "Locked in. We’ll follow up ASAP.");
    else push("bot", "Something went wrong sending that. Try again.");
  }

  function renderLeadForm(action) {
    const wrap = el("div", "qa-lead-wrap");

    if (action.reason) wrap.appendChild(el("div", "qa-lead-reason", action.reason));

    const fields = action.fields || [];
    const inputs = {};

    fields.forEach((f) => {
      const label = el("div", "qa-lead-label", f.label + (f.required ? " *" : ""));
      wrap.appendChild(label);

      const input = f.multiline
        ? Object.assign(el("textarea", "qa-input"), { rows: 3 })
        : Object.assign(el("input", "qa-input"), { type: "text" });

      input.placeholder = f.label;
      inputs[f.id] = { def: f, input };
      wrap.appendChild(input);
    });

    const btn = el("button", "qa-btn", "Send");
    btn.addEventListener("click", async () => {
      const payload = {};
      for (const [id, obj] of Object.entries(inputs)) {
        const val = String(obj.input.value || "").trim();
        if (obj.def.required && !val) {
          obj.input.focus();
          return;
        }
        payload[id] = val;
      }
      await submitLead(payload);
    });

    wrap.appendChild(btn);
    return wrap;
  }

  function render() {
    root.innerHTML = "";

    const header = el("div", "qa-header", state.config?.businessName || "Chat");
    const feed = el("div", "qa-feed");

    state.messages.forEach((m) => {
      if (m.role === "lead_form") {
        feed.appendChild(renderLeadForm(m.content));
        return;
      }
      const cls =
        m.role === "user" ? "qa-msg qa-user" : m.role === "bot" ? "qa-msg qa-bot" : "qa-msg";
      feed.appendChild(el("div", cls, m.content));
    });

    const chipsWrap = el("div", "qa-chips");
    (state.chips || []).forEach((c) => {
      const b = el("button", "qa-chip", c.label);
      b.addEventListener("click", () => sendIntent(c.id));
      chipsWrap.appendChild(b);
    });

    // OPTIONAL: typing box. Keep it simple.
    const inputWrap = el("div", "qa-input-wrap");
    const input = el("input", "qa-input");
    input.placeholder = "Type here (or choose a button)…";

    const sendBtn = el("button", "qa-btn", "Send");
    sendBtn.addEventListener("click", () => {
      const v = input.value.trim();
      if (!v) return;
      sendMessage(v);
      input.value = "";
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const v = input.value.trim();
        if (!v) return;
        sendMessage(v);
        input.value = "";
      }
    });

    inputWrap.appendChild(input);
    inputWrap.appendChild(sendBtn);

    root.appendChild(header);
    root.appendChild(feed);
    root.appendChild(chipsWrap);
    root.appendChild(inputWrap);

    feed.scrollTop = feed.scrollHeight;
  }

  (async function init() {
    state.config = await api(`/config?${params.toString()}`);
    state.chips = state.config?.chips || [];
    state.messages = [];
    push("bot", "How can I help today?");
  })();
})();
