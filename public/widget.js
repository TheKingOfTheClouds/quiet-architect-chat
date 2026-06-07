(() => {
  const API_BASE = "https://quiet-architect-chat.onrender.com";

  if (document.querySelector(".aqa-bubble")) return;

  const FAQS = [
    {
      id: "FAQ_AUTOMATION",
      label: "Automation Plan",
      q: "What’s included in the automation plans?",
      a: "Every plan includes workflow automation, AI assistant setup, performance analytics, and ongoing support. Higher-tier plans include more advanced automations, integrations, reporting, and optimization services."
    },
    {
      id: "FAQ_WEBSITE",
      label: "Website Builds",
      q: "Do you build websites too?",
      a: "Yes. We can build new websites or enhance existing ones while integrating automation, AI tools, lead capture, booking systems, and analytics into a unified experience."
    },
    {
      id: "FAQ_SETUP",
      label: "Setup Fee",
      q: "What is the onboarding and implementation fee for?",
      a: "The one-time onboarding and implementation fee covers system planning, automation design, setup, integrations, testing, and launch preparation. This ensures your solution is fully configured and ready to perform."
    },
    {
      id: "FAQ_FEATURES",
      label: "Add Features",
      q: "Can I add new features later?",
      a: "Absolutely. New automations, AI tools, workflows, and integrations can be added as your organization grows. Additional enhancements may be covered under your existing plan or provided through a custom quote."
    },
    {
      id: "FAQ_TIME",
      label: "Setup Time",
      q: "How long does implementation take?",
      a: "Most projects are completed within one to three weeks depending on complexity, integrations, and the number of workflows being developed."
    },
    {
      id: "FAQ_PRICING",
      label: "Pricing",
      q: "What plans do you offer?",
      a: "We offer Starter, Professional, and Enterprise plans. Each plan is designed to scale with your organization's needs. Full pricing and implementation details are available on our pricing page."
    },
    {
      id: "FAQ_START",
      label: "Get Started",
      q: "How do I get started?",
      a: "Getting started is simple. Schedule a consultation, tell us about your goals and challenges, and we'll recommend the best automation and AI solutions for your organization."
    }
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
      --aqa-z: 2147483647;
    }

    .aqa-bubble,
    .aqa-card,
    .aqa-card *{
      box-sizing: border-box;
      pointer-events: auto !important;
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
      white-space: pre-wrap;
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
    }

    .aqa-chip:hover{
      background: #2a2a2a;
    }

    .aqa-input{
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,.08);
    }

    .aqa-input input{
      flex: 1;
      min-width: 0;
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
        max-height: 75vh;
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

  function getLocalReply(intent) {
    const faq = FAQS.find((item) => item.id === intent);
    return faq ? faq.a : "I can help with automation plans, websites, setup fees, pricing, and getting started.";
  }

  async function api(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  async function sendIntent(intent) {
    const fallbackReply = getLocalReply(intent);

    try {
      const data = await api("/chat", { intent });
      appendMessage(data.reply || fallbackReply);
    } catch (err) {
      appendMessage(fallbackReply);
      console.error("AQA intent error:", err);
    }
  }

  function renderChips() {
    chipsEl.innerHTML = "";

    FAQS.forEach((chip) => {
      const btn = document.createElement("button");
      btn.className = "aqa-chip";
      btn.type = "button";
      btn.textContent = chip.label;

    btn.onclick = async (e) => {
  console.log("FAQ button clicked:", chip.id);

  e.preventDefault();
  e.stopPropagation();

  appendMessage(chip.label, "user");
  await sendIntent(chip.id);
};

      chipsEl.appendChild(btn);
    });
  }

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage(text, "user");
    inputEl.value = "";
    appendMessage("Thanks for reaching out. For now, please use one of the quick question buttons, or schedule a consultation through our contact page.");
  }

  bubble.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    card.classList.toggle("open");
  };

  sendBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
  };

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  renderChips();
})();