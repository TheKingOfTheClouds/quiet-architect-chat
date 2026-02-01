(function () {
  const API = "https://quiet-architect-chat.onrender.com";

  /* ---------- Bubble ---------- */
  const bubble = document.createElement("button");
  bubble.textContent = "💬";
  bubble.style.cssText =
    "position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;background:#121212;color:#fff;border:1px solid rgba(255,255,255,.1);cursor:pointer;z-index:9999";
  document.body.appendChild(bubble);

  /* ---------- Panel ---------- */
  const panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;right:20px;bottom:86px;width:360px;max-width:92vw;max-height:70vh;background:#121212;color:#eee;border-radius:16px;border:1px solid rgba(255,255,255,.1);display:none;flex-direction:column;z-index:9999";

  panel.innerHTML = `
    <div style="padding:12px;border-bottom:1px solid rgba(255,255,255,.1);font-weight:700">
      A Quiet Architect
    </div>
    <div id="aqa-log" style="padding:12px;overflow:auto;flex:1;font-size:14px"></div>
    <div style="padding:10px;border-top:1px solid rgba(255,255,255,.1);display:flex;gap:8px">
      <button data-id="LEARN">Learn</button>
      <button data-id="QUOTE">Get a quote</button>
    </div>
  `;
  document.body.appendChild(panel);

  /* ---------- Toggle ---------- */
  bubble.onclick = () => {
    panel.style.display = panel.style.display === "flex" ? "none" : "flex";
  };

  /* ---------- Messaging ---------- */
  async function send(intent) {
    const res = await fetch(API + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent, sessionId: "web" })
    });
    const data = await res.json();

    const log = document.getElementById("aqa-log");
    log.innerHTML += `<p>${data.reply}</p>`;

    // Replace buttons if chips returned
    if (data.chips && data.chips.length) {
      const footer = panel.querySelector("div:last-child");
      footer.innerHTML = "";
      data.chips.forEach(c => {
        const b = document.createElement("button");
        b.textContent = c.label;
        b.onclick = () => send(c.id);
        footer.appendChild(b);
      });
    }

    // Open URLs if instructed
    if (data.action && data.action.type === "open_url") {
      window.open(data.action.url, "_blank");
    }
  }

  panel.querySelectorAll("button[data-id]").forEach(btn => {
    btn.onclick = () => send(btn.dataset.id);
  });

})();
