(() => {
  const API_BASE = "https://quiet-architect-chat.onrender.com";

  if (document.querySelector(".aqa-bubble")) return;

  const FAQ_CHIPS = [
    { id: "FAQ_AUTOMATION", label: "Automation Plan" },
    { id: "FAQ_WEBSITE", label: "Website Builds" },
    { id: "FAQ_SETUP", label: "Setup Fee" },
    { id: "FAQ_FEATURES", label: "Add Features" },
    { id: "FAQ_TIME", label: "Setup Time" }
  ];

  const style = document.createElement("style");
  style.textContent = `
    :root{
      --aqa-bg: rgba(18,18,18,.96);
      --aqa-fg: #eaeaea;
      --aqa-muted: #a1a1a1;
      --aqa-accent: #c9f31d;
      --aqa-radius: 18px;
      --aqa-shadow: 0 10px 30px rgba(0,0,0,.45);
      --aqa-z: 9999;
    }

    .aqa-bubble{
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: var(--aqa-bg);
      color: var(--aqa-fg);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--aqa-shadow);
      z-index: var(--aqa-z);
      border: 1px solid rgba(255,255,255,.08);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      font-size: 24px;
      line-height: 1;
    }

    .aqa-card{
      position: fixed;
      right: 20px;
      bottom: 90px;
      width: min(360px, 92vw);
      max-height: 70vh;
      background: var(--aqa-bg);
      color: var(--aqa-fg);
      border-radius: var(--aqa-radius);
      box-shadow: var(--aqa-shadow);
      border: 1px solid rgba(255,255,255,.08);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: var(--aqa-z);
    }

    .aqa-card.open{
      display: flex;
    }

    .aqa-head{
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }

    .aqa-dot{
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--aqa-accent);
      box-shadow: 0 0 12px var(--aqa-accent);
      flex: 0 0 auto;
    }

    .aqa-title{
      font-weight: 700;
      font-size: 15px;
    }

    .aqa-body{
      padding: 14px;
      overflow-y: auto;
      flex: 1;
    }

    .aqa-msg{
      margin: 0 0 12px 0;
      line-height: 1.5;
      font-size: 14px;
    }

    .aqa-msg.user{
      color: var(--aqa-accent);
    }

    .aqa-chipwrap{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .aqa-chip{
      font-size: 12px;
      padding: 7px 11px;
      border-radius: 999px;
      background: #1e1e1e;
      border: 1px solid rgba(255,255,255,.08);
      color: var(--aqa-fg);
      cursor: pointer;
      transition: background .15s ease, transform .15s ease;
    }

    .aqa-chip:hover{
      background: #2a2a2a;
      transform: translateY(-1px);
    }

    .aqa-chip:disabled{
      opacity: .65;
      cursor: default;
      transform: none;
    }

    .aqa-input{
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,.08);
    }

    .aqa-input input{
      flex: 1;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,.08);
      background: #111;
      color: var(--aqa-fg);
      outline: none;
    }

    .aqa-btn{
      padding: 10px 14px;
      border-radius: 10px;
      background: #1c1c1c;
      border: 1px solid rgba(255,255,255,.08);
      color: var(--aqa-fg);
      cursor: pointer;
    }

    @media (max-width: 480px){
      .aqa-bubble{
        right: 14px;
        bottom: 14px;
      }

      .aqa-card{
        right: 14px;
        bottom: 82px;
        width: calc(100vw - 28px);
      }
    }
  `;
  document.head.appendChild(style);

  const bubble = document.createElement("button");
  bubble.className = "aqa-bubble";
  bubble.type = "button";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.innerHTML = "💬";

  const card = document.createElement("div");
  card.className = "aqa-card";
  card.innerHTML = `
    <div class="aqa-head">
      <div class="aqa-dot"></div>
      <div class="aqa-title">A Quiet Architect</div>
    </div>
    <div class="aqa-body" id="aqa-body">
      <div class="aqa-msg">How can I help today?</div>
      <div class="aqa-chipwrap" id="aqa-chips"></div>
    </div>
    <div class="aqa-input">
      <input id="aqa-input" type="text" placeholder="Ask something..." />
      <button class="aqa-btn" id="aqa-send" type="button">Send</button>
    </div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(card);

  const bodyEl = card.querySelector("#aqa-body");
  const chipsEl = card.querySelector("#aqa-chips");
  const inputEl = card.querySelector("#aqa-input");
  const sendBtn = card.querySelector("#aqa-send");

  function appendMessage(text, className = "") {
    const msg = document.createElement("div");
    msg.className = `aqa-msg ${className}`.trim();
    msg.textContent = text;
    bodyEl.appendChild(msg);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function renderChips() {
    chipsEl.innerHTML = "";

    FAQ_CHIPS.forEach((chip) => {
      const btn = document.createElement("button");
      btn.className = "aqa-chip";
      btn.type = "button";
      btn.textContent = chip.label;

      btn.addEventListener("click", async () => {
        appendMessage(chip.label, "user");
        await sendIntent(chip.id);
      });

      chipsEl.appendChild(btn);
    });
  }

  async function api(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }

    return res.json();
  }

  async function sendIntent(intent) {
    try {
      const data = await api("/chat", { intent });
      appendMessage(data.reply || "No reply returned.");
    } catch (err) {
      appendMessage("Something went wrong connecting to chat.");
      console.error("AQA intent error:", err);
    }
  }

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage(text, "user");
    inputEl.value = "";
    appendMessage("Please use one of the quick question buttons below for now.");
  }

  bubble.addEventListener("click", () => {
    card.classList.toggle("open");
  });

  sendBtn.addEventListener("click", sendMessage);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  renderChips();
})();