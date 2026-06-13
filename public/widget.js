(() => {
  if (document.querySelector(".aqa-bubble")) return;

  const FAQS = {
    FAQ_ABOUT: {
      label: "What does AQA do?",
      q: "What does AQA do?",
      a: "AQA helps organizations streamline operations through automation, workflow optimization, analytics, interactive FAQ chatbots, and custom digital solutions. Our goal is to reduce repetitive work, improve efficiency, and help teams focus on what matters most.",
      keywords: "about services what do you do company"
    },

    FAQ_IDEAL: {
      label: "Who is AQA best for?",
      q: "Who is AQA best for?",
      a: "AQA is designed for small businesses, nonprofits, schools, and growing organizations looking to automate repetitive tasks, improve communication, and scale operations without adding unnecessary overhead.",
      keywords: "ideal client business nonprofit school organization"
    },

    FAQ_AUTOMATION: {
      label: "Automation Plans",
      q: "What’s included in the automation plans?",
      a: "Every plan is designed to help organizations modernize workflows and reduce manual work. Depending on the plan, services may include workflow automation, analytics, interactive FAQ chatbot setup, integrations, reporting, optimization, and quarterly strategy reviews.",
      keywords: "automation plan plans package packages included"
    },

    FAQ_WEBSITE: {
      label: "Website Builds",
      q: "Do you build websites too?",
      a: "Yes. AQA can build new websites or enhance existing ones while integrating automation, lead capture, booking systems, analytics, and chatbot functionality. Additional websites, landing pages, or custom page builds may require separate scoping and pricing.",
      keywords: "website websites landing page pages web build"
    },

    FAQ_STARTER_PLAN: {
      label: "Starter Plan",
      q: "What is included in the Starter plan?",
      a: "The Starter plan is built for solo entrepreneurs, small teams, and first-time automation adopters. It includes quarterly AI strategy reviews, AI-assisted workflow automations, basic analytics and performance reporting, an interactive FAQ chatbot, and up to 3 AI integrations.",
      keywords: "starter plan 88 898 beginner solo founders"
    },

    FAQ_PROFESSIONAL_PLAN: {
      label: "Professional Plan",
      q: "What is included in the Professional plan?",
      a: "The Professional plan is designed for businesses ready for deeper automation and growth systems. It includes advanced workflow automation, AI-driven sales and marketing tools, enhanced data analytics and insights, priority response times, and up to 10 AI integrations.",
      keywords: "professional pro plan 188 1917 popular"
    },

    FAQ_ENTERPRISE_PLAN: {
      label: "Enterprise Plan",
      q: "What is included in the Enterprise plan?",
      a: "The Enterprise plan is a custom solution for established teams ready to automate at scale. It can include fully customizable AI automation, dedicated AI business consulting, enterprise-grade compliance considerations, priority escalation support, and unlimited AI integrations depending on project scope.",
      keywords: "enterprise custom plan 488 4978 scale compliance"
    },

    FAQ_PRICING: {
      label: "Pricing",
      q: "What plans do you offer?",
      a: "AQA offers Starter, Professional, and Enterprise plans. Starter begins at $88/month, Professional begins at $188/month, and Enterprise begins at $488+/month. One-time onboarding and implementation fees apply. Annual billing may include savings compared to monthly billing.",
      keywords: "pricing price cost plans monthly annually"
    },

    FAQ_SETUP: {
      label: "Setup Fee",
      q: "What is the onboarding and implementation fee for?",
      a: "The one-time onboarding and implementation fee covers system planning, automation design, setup, integrations, testing, and launch preparation. This ensures your solution is properly configured and ready to perform.",
      keywords: "setup fee onboarding implementation cost"
    },

    FAQ_TIME: {
      label: "Setup Time",
      q: "How long does implementation take?",
      a: "Most projects are completed within one to three weeks depending on complexity, integrations, client readiness, and the number of workflows being developed.",
      keywords: "time timeline implementation how long setup"
    },

    FAQ_FEATURES: {
      label: "Add Features Later",
      q: "Can I add new features later?",
      a: "Yes. New automations, workflows, tools, integrations, and enhancements can be added as your organization grows. Additional enhancements may be covered under your existing plan or provided through a custom quote depending on scope.",
      keywords: "add features later upgrades enhancements"
    },

    FAQ_SUPPORT: {
      label: "Ongoing Support",
      q: "Do I receive ongoing support?",
      a: "Yes. Every plan includes ongoing system maintenance, monitoring, and optimization. Quarterly strategy reviews help identify opportunities for improvement, while higher-tier plans include enhanced optimization services, priority response times, and additional strategic guidance.",
      keywords: "support maintenance help assistance ongoing"
    },

    FAQ_RESULTS: {
      label: "Automation Benefits",
      q: "What benefits can automation provide?",
      a: "Automation helps reduce manual work, improve response times, eliminate repetitive tasks, increase consistency, and free your team to focus on higher-value activities.",
      keywords: "benefits results automation reduce manual work"
    },

    FAQ_AI: {
      label: "What Can AI Automate?",
      q: "What can AI actually help automate?",
      a: "AI-assisted systems can help with customer inquiries, lead qualification, appointment scheduling, internal communications, reporting, content support, follow-up workflows, and other repetitive business processes.",
      keywords: "ai automate artificial intelligence tasks"
    },

    FAQ_INTEGRATIONS: {
      label: "Existing Tools",
      q: "Can AQA connect with my existing tools?",
      a: "In most cases, yes. AQA can integrate with platforms such as Google Workspace, Microsoft 365, Zapier, CRM systems, scheduling software, forms, databases, and other supported business applications.",
      keywords: "tools existing apps connect platforms google microsoft zapier crm"
    },

    FAQ_AI_INTEGRATION: {
      label: "AI Integrations",
      q: "What counts as an AI integration?",
      a: "An AI integration connects your existing business tools, platforms, or workflows into an automated system. Examples may include Google Workspace, Microsoft 365, Calendly, HubSpot, Salesforce, Zapier, CRM systems, scheduling platforms, forms, databases, and other supported business applications.",
      keywords: "ai integration integrations google calendly hubspot salesforce zapier crm"
    },

    FAQ_WORKFLOW: {
      label: "Workflow Automation",
      q: "What is a workflow automation?",
      a: "A workflow automation is a process that automatically performs tasks or moves information between systems without manual effort. Examples include lead routing, appointment scheduling, follow-up sequences, CRM updates, notifications, approvals, and data synchronization.",
      keywords: "workflow automation lead routing scheduling follow up crm notifications"
    },

    FAQ_REVIEW: {
      label: "Quarterly Strategy Review",
      q: "What is included in a Quarterly AI Strategy Review?",
      a: "Quarterly AI Strategy Reviews help ensure your systems continue evolving alongside your organization. During each review, AQA evaluates automation performance, analytics, workflows, and business goals to identify opportunities for optimization and future enhancements.",
      keywords: "quarterly review strategy ai review performance analytics"
    },

    FAQ_RETAINER: {
      label: "Quarterly Retainer",
      q: "What is the quarterly retainer for?",
      a: "The quarterly retainer is a structured business improvement program where AQA reviews system performance, identifies opportunities for optimization, and implements prioritized enhancements as your business grows. Think of it as your ongoing maintenance and growth phase—designed to keep your systems efficient, scalable, and aligned with your evolving goals.",
      keywords: "retainer quarterly maintenance growth phase enhancements"
    },

    FAQ_CUSTOM: {
      label: "Custom Development",
      q: "What is considered custom development?",
      a: "Custom development includes additional websites, landing pages, advanced automations, custom integrations, CRM deployments, AI solutions, or any work outside the scope of your selected plan. Custom projects may require separate scoping, implementation fees, and timelines.",
      keywords: "custom development scope pages landing pages extra quote"
    },

    FAQ_CONTRACT: {
      label: "Contract Terms",
      q: "Am I locked into a long-term contract?",
      a: "AQA services are designed to be clear and flexible. Any applicable service terms, billing details, cancellation rules, and scope limitations will be outlined during onboarding before work begins.",
      keywords: "contract terms locked cancellation"
    },

    FAQ_START: {
      label: "Get Started",
      q: "How do I get started?",
      a: "Getting started is simple. Schedule a consultation, tell us about your goals and challenges, and AQA will recommend the best automation and workflow solution for your organization.",
      keywords: "get started start begin consultation"
    },

    FAQ_BOOK: {
      label: "Schedule Consultation",
      q: "How can I schedule a consultation?",
      a: "You can schedule a consultation directly through the website or contact form. AQA will review your needs, discuss your goals, and recommend a plan tailored to your organization.",
      keywords: "book schedule consultation call contact"
    }
  };

  const MAIN_MENUS = [
    { id: "MENU_SERVICES", label: "Services" },
    { id: "MENU_PRICING", label: "Pricing & Plans" },
    { id: "MENU_AUTOMATIONS", label: "Automations" },
    { id: "MENU_INTEGRATIONS", label: "Integrations" },
    { id: "MENU_REVIEWS", label: "Quarterly Reviews" },
    { id: "MENU_START", label: "Get Started" }
  ];

  const CATEGORY_MAP = {
    MENU_SERVICES: {
      title: "Services",
      intro: "Here are the most common service questions.",
      items: ["FAQ_ABOUT", "FAQ_IDEAL", "FAQ_AUTOMATION", "FAQ_WEBSITE", "FAQ_RESULTS"]
    },

    MENU_PRICING: {
      title: "Pricing & Plans",
      intro: "Choose a pricing question below.",
      items: ["FAQ_STARTER_PLAN", "FAQ_PROFESSIONAL_PLAN", "FAQ_ENTERPRISE_PLAN", "FAQ_PRICING", "FAQ_SETUP", "FAQ_CONTRACT"]
    },

    MENU_AUTOMATIONS: {
      title: "Automations",
      intro: "Here are the automation questions I can answer.",
      items: ["FAQ_WORKFLOW", "FAQ_AI", "FAQ_FEATURES", "FAQ_CUSTOM"]
    },

    MENU_INTEGRATIONS: {
      title: "Integrations",
      intro: "Here are the integration questions I can answer.",
      items: ["FAQ_AI_INTEGRATION", "FAQ_INTEGRATIONS"]
    },

    MENU_REVIEWS: {
      title: "Quarterly Reviews",
      intro: "Here are the quarterly review and retainer questions.",
      items: ["FAQ_REVIEW", "FAQ_RETAINER", "FAQ_SUPPORT"]
    },

    MENU_START: {
      title: "Get Started",
      intro: "Ready to take the next step?",
      items: ["FAQ_TIME", "FAQ_START", "FAQ_BOOK"]
    }
  };

  const style = document.createElement("style");
  style.textContent = `
    :root{
      --aqa-bg: rgba(18,18,18,.96);
      --aqa-fg: #F3F3F3;
      --aqa-muted: #B0B0B0;
      --aqa-accent: #C8B26A;
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
      width: min(390px, 92vw);
      max-height: 74vh;
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
      box-shadow: 0 0 6px rgba(199,176,106,.35);
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
      line-height: 1.65;
      font-size: 15px;
      white-space: pre-wrap;
    }

    .aqa-msg.user{
      color: var(--aqa-accent);
      font-weight: 600;
    }

    .aqa-chipwrap{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
      padding-bottom: 2px;
    }

    .aqa-chip{
      font-size: 12px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #1e1e1e;
      border: 1px solid rgba(255,255,255,.10);
      color: var(--aqa-fg);
      cursor: pointer;
      transition: background .15s ease, border-color .15s ease, transform .15s ease;
    }

    .aqa-chip:hover{
      background: #2a2a2a;
      border-color: rgba(200,178,106,.45);
      transform: translateY(-1px);
    }

    .aqa-chip.back{
      border-color: rgba(200,178,106,.45);
      color: var(--aqa-accent);
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

    .aqa-input input:focus{
      border-color: rgba(200,178,106,.55);
    }

    .aqa-btn{
      padding: 10px 14px;
      border-radius: 10px;
      background: #1c1c1c;
      border: 1px solid rgba(255,255,255,.08);
      color: var(--aqa-fg);
      cursor: pointer;
    }

    .aqa-btn:hover{
      background: #2a2a2a;
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
        max-height: 76vh;
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
      <div id="aqa-messages"></div>
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
  const messagesEl = card.querySelector("#aqa-messages");
  const chipsEl = card.querySelector("#aqa-chips");
  const inputEl = card.querySelector("#aqa-input");
  const sendBtn = card.querySelector("#aqa-send");

  let currentMenu = null;

  function appendMessage(text, className = "") {
    const msg = document.createElement("div");
    msg.className = `aqa-msg ${className}`.trim();
    msg.textContent = text;
    messagesEl.appendChild(msg);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s$+]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function renderButtons(buttons) {
    chipsEl.innerHTML = "";

    buttons.forEach((item) => {
      const btn = document.createElement("button");
      btn.className = `aqa-chip ${item.type === "back" ? "back" : ""}`.trim();
      btn.type = "button";
      btn.textContent = item.label;

      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (item.type === "menu") {
          openCategory(item.id, item.label);
          return;
        }

        if (item.type === "faq") {
          openFAQ(item.id);
          return;
        }

        if (item.type === "back") {
          appendMessage("Main Menu", "user");
          appendMessage("How can I help today?");
          renderMainMenu();
        }
      };

      chipsEl.appendChild(btn);
    });
  }

  function renderMainMenu() {
    currentMenu = null;

    renderButtons(
      MAIN_MENUS.map((menu) => ({
        type: "menu",
        id: menu.id,
        label: menu.label
      }))
    );
  }

  function openCategory(menuId, menuLabel) {
    const category = CATEGORY_MAP[menuId];
    if (!category) return;

    currentMenu = menuId;

    appendMessage(menuLabel, "user");
    appendMessage(category.intro);

    const buttons = category.items.map((faqId) => ({
      type: "faq",
      id: faqId,
      label: FAQS[faqId]?.label || "Question"
    }));

    buttons.push({
      type: "back",
      id: "BACK",
      label: "Back to Main Menu"
    });

    renderButtons(buttons);
  }

  function openFAQ(faqId) {
    const faq = FAQS[faqId];

    if (!faq) {
      appendMessage("I can help with services, pricing, automations, integrations, quarterly reviews, and getting started.");
      renderMainMenu();
      return;
    }

    appendMessage(faq.label, "user");
    appendMessage(faq.a);

    if (currentMenu && CATEGORY_MAP[currentMenu]) {
      const category = CATEGORY_MAP[currentMenu];

      const buttons = category.items.map((id) => ({
        type: "faq",
        id,
        label: FAQS[id]?.label || "Question"
      }));

      buttons.push({
        type: "back",
        id: "BACK",
        label: "Back to Main Menu"
      });

      renderButtons(buttons);
    } else {
      renderMainMenu();
    }
  }

  function findBestFAQ(input) {
    const query = normalize(input);
    if (!query) return null;

    const tokens = query
      .split(" ")
      .filter((token) => token.length > 2);

    let bestMatch = null;
    let bestScore = 0;

    Object.values(FAQS).forEach((faq) => {
      const haystack = normalize([
        faq.label,
        faq.q,
        faq.a,
        faq.keywords || ""
      ].join(" "));

      let score = 0;

      if (haystack.includes(query)) score += 10;

      tokens.forEach((token) => {
        if (haystack.includes(token)) score += 1;
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    });

    return bestScore >= 2 ? bestMatch : null;
  }

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage(text, "user");
    inputEl.value = "";

    const faq = findBestFAQ(text);

    if (faq) {
      appendMessage(faq.a);
      renderMainMenu();
      return;
    }

    appendMessage("I can help with services, pricing, automations, integrations, quarterly reviews, and getting started. Choose a category below to continue.");
    renderMainMenu();
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
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  appendMessage("How can I help today?");
  renderMainMenu();
})();