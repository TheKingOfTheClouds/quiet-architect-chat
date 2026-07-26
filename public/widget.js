(() => {
  if (document.querySelector(".aqa-bubble")) return;

  const FAQS = {
    FAQ_ABOUT: {
      label: "What does AQO do?",
      q: "What does AQO do?",
      a: "A Quiet Origin builds connected digital systems for businesses and organizations. Services may include professional websites, landing pages, lead capture, workflow automation, client onboarding, integrations, analytics, interactive FAQ assistants, and AI tools used where they add practical value.",
      keywords: "about services what do you do company aqo quiet origin"
    },

    FAQ_IDEAL: {
      label: "Who is AQO best for?",
      q: "Who is AQO best for?",
      a: "AQO is designed for small businesses, nonprofits, service providers, and growing organizations that want to improve their digital presence, reduce repetitive work, strengthen communication, and create clearer operational systems.",
      keywords: "ideal client business nonprofit service provider organization"
    },

    FAQ_AUTOMATION: {
      label: "AQO Plans",
      q: "What is included in each AQO plan?",
      a: "Starter provides a streamlined digital foundation. Professional adds stronger lead management, booking, onboarding, and priority support. Enterprise is custom scoped for advanced systems, integrations, reporting, and operational needs. Final deliverables, support, timelines, and third-party costs are confirmed in the approved proposal and Statement of Work.",
      keywords: "aqo plan plans package packages included starter professional enterprise"
    },

    FAQ_WEBSITE: {
      label: "Website Builds",
      q: "Do you build websites and landing pages?",
      a: "Yes. AQO builds professional landing pages and websites as part of a connected digital system. Starter typically includes a focused landing page, Professional may include a website based on an AQO template, and Enterprise website work is customized according to the approved project scope.",
      keywords: "website websites landing page pages web build framer"
    },

    FAQ_STARTER_PLAN: {
      label: "Starter Plan",
      q: "What is included in the Starter plan?",
      a: "Starter includes a professional landing page, a lead capture and confirmation workflow, an interactive FAQ assistant, basic analytics and reporting, up to 3 approved integrations, standard support, and a Quarterly AI Strategy Review. Final scope is confirmed in the approved proposal and Statement of Work.",
      keywords: "starter plan 88 898 299 solo founders landing page"
    },

    FAQ_PROFESSIONAL_PLAN: {
      label: "Professional Plan",
      q: "What is included in the Professional plan?",
      a: "Professional includes a professional website based on an AQO template, lead capture and follow-up workflows, booking and client onboarding automation, an interactive FAQ assistant, enhanced analytics and approved integrations, priority support, and a Quarterly AI Strategy Review. Final scope is confirmed in the approved proposal and Statement of Work.",
      keywords: "professional pro plan 188 1917 599 website booking onboarding"
    },

    FAQ_ENTERPRISE_PLAN: {
      label: "Enterprise Plan",
      q: "What is included in the Enterprise plan?",
      a: "Enterprise is custom scoped and may include a custom website and digital system, advanced automation, AI features, integrations, custom reporting and data flows, multi-stakeholder approval workflows, tailored monitoring, priority escalation, and quarterly strategy and optimization according to the Statement of Work.",
      keywords: "enterprise custom plan 488 4978 1499 advanced integrations reporting"
    },

    FAQ_PRICING: {
      label: "Pricing",
      q: "What plans does AQO offer?",
      a: "AQO offers Starter at $88 per month or $898 per year with a $299 onboarding and implementation fee, Professional at $188 per month or $1,917 per year with a $599 onboarding and implementation fee, and Enterprise starting at $488 per month or $4,978 per year with a $1,499 or higher onboarding and implementation fee. Final pricing, scope, and third-party costs are confirmed in the approved proposal and Statement of Work.",
      keywords: "pricing price cost plans monthly annually starter professional enterprise"
    },

    FAQ_SETUP: {
      label: "Implementation Fee",
      q: "What does the onboarding and implementation fee cover?",
      a: "The onboarding and implementation fee covers initial planning, discovery, account setup, system configuration, testing, documentation, and launch preparation for the approved project. Depending on scope, this may include website setup, lead capture, automation, FAQ assistant configuration, analytics, and integrations. Third-party platform fees and out-of-scope work are separate unless included in writing.",
      keywords: "setup fee onboarding implementation cost planning testing launch"
    },

    FAQ_TIME: {
      label: "Implementation Timeline",
      q: "How long does implementation take?",
      a: "Most standard AQO projects are targeted for completion within approximately 14 days after required payment, access, content, assets, and approvals are received. Complex integrations, custom systems, delayed feedback, or missing client materials may extend the timeline. The final schedule is confirmed in the Statement of Work.",
      keywords: "time timeline implementation how long setup 14 days"
    },

    FAQ_FEATURES: {
      label: "Add Features Later",
      q: "Can I add new features later?",
      a: "Yes. New pages, workflows, automation, integrations, reporting, AI features, or custom development can be added as your business grows. Smaller improvements may be included in an active service plan when approved. Larger requests may require a Change Order, separate proposal, or custom quote.",
      keywords: "add features later upgrades enhancements pages workflows integrations"
    },

    FAQ_SUPPORT: {
      label: "Ongoing Support",
      q: "Do I receive ongoing support?",
      a: "Yes, according to the support included in your selected plan and Statement of Work. Starter includes standard support, Professional includes priority support, and Enterprise support is tailored to the approved scope. Maintenance, monitoring, optimization, and additional implementation are included only when specifically stated in writing.",
      keywords: "support maintenance help assistance ongoing priority"
    },

    FAQ_RESULTS: {
      label: "Digital System Benefits",
      q: "What benefits can connected digital systems provide?",
      a: "Connected systems can reduce repetitive work, improve response times, organize lead information, strengthen client follow-through, and create a more consistent operating process. Results depend on the approved system, client participation, third-party platforms, and ongoing business execution.",
      keywords: "benefits results digital systems automation reduce manual work"
    },

    FAQ_AI: {
      label: "AI Support",
      q: "How can AI support my business?",
      a: "AI tools may assist with customer guidance, FAQ responses, content drafts, intake organization, workflow planning, reporting, and other repetitive processes. AI is used as a support tool and does not replace human review, business judgment, or professional advice.",
      keywords: "ai artificial intelligence support tools automate tasks human review"
    },

    FAQ_INTEGRATIONS: {
      label: "Existing Tools",
      q: "Can AQO connect with my existing tools?",
      a: "In many cases, yes. AQO can connect approved platforms such as Google Workspace, Microsoft 365, Zapier, CRM systems, scheduling tools, forms, spreadsheets, email platforms, and other supported business applications. Final integrations depend on compatibility, account access, the selected plan, and the approved Statement of Work.",
      keywords: "tools existing apps connect platforms google microsoft zapier crm"
    },

    FAQ_AI_INTEGRATION: {
      label: "Approved Integrations",
      q: "What counts as an approved integration?",
      a: "An approved integration connects two or more supported business platforms so information or actions can move between them. Examples may include Google Workspace, Microsoft 365, Calendly, HubSpot, Salesforce, Zapier, forms, spreadsheets, CRM systems, email platforms, and scheduling tools. Each integration is reviewed for compatibility, access, security, scope, and pricing.",
      keywords: "approved integration integrations google calendly hubspot salesforce zapier crm"
    },

    FAQ_WORKFLOW: {
      label: "Workflow Automation",
      q: "What is workflow automation?",
      a: "Workflow automation allows approved tasks or information to move between systems with less manual effort. Examples include saving leads, sending confirmation emails, creating internal notifications, updating spreadsheets or CRMs, scheduling appointments, supporting onboarding, and creating follow-up reminders.",
      keywords: "workflow automation lead routing scheduling follow up crm notifications"
    },

    FAQ_REVIEW: {
      label: "Quarterly Strategy Review",
      q: "What happens during a Quarterly AI Strategy Review?",
      a: "A Quarterly AI Strategy Review is a structured improvement session where AQO reviews your current system, performance, workflows, lead handling, and operational needs. AQO identifies practical opportunities for better efficiency using automation, AI tools, reporting, or workflow changes. Quarterly reviews do not include unlimited development, new websites, advanced integrations, or major system rebuilds.",
      keywords: "quarterly review strategy ai performance analytics optimization"
    },

    FAQ_RETAINER: {
      label: "Quarterly Review Scope",
      q: "What is included in ongoing quarterly support?",
      a: "Quarterly support focuses on reviewing system performance, identifying improvement opportunities, and prioritizing approved enhancements within the active service plan. New websites, major rebuilds, advanced integrations, additional visual assets, and custom development may require separate scoping and pricing.",
      keywords: "retainer quarterly maintenance support enhancements review scope"
    },

    FAQ_CUSTOM: {
      label: "Custom Development",
      q: "What is considered custom development?",
      a: "Custom development may include additional websites, landing pages, advanced automation, new integrations, CRM deployments, custom AI features, specialized reporting, major revisions, or work outside the approved plan and Statement of Work. Custom requests may require separate scoping, pricing, implementation fees, and timelines.",
      keywords: "custom development scope pages landing pages extra quote crm reporting"
    },

    FAQ_CONTRACT: {
      label: "Contract Terms",
      q: "Am I locked into a long-term contract?",
      a: "Any service term, renewal period, cancellation requirement, or recurring billing arrangement will be clearly stated in your agreement before work begins. The applicable Master Services Agreement, Statement of Work, and payment terms control the final arrangement.",
      keywords: "contract terms locked cancellation renewal billing"
    },

    FAQ_START: {
      label: "Get Started",
      q: "How do I get started?",
      a: "Start by scheduling a consultation and telling us about your goals, current tools, challenges, and timeline. AQO will review your needs, recommend the appropriate plan or custom solution, and confirm the scope, pricing, and next steps in writing.",
      keywords: "get started start begin consultation discovery"
    },

    FAQ_BOOK: {
      label: "Schedule Consultation",
      q: "How can I schedule a consultation?",
      a: "You can schedule a consultation through the AQO website or submit the contact form. AQO will review your information and discuss the website, automation, integrations, and digital support that may fit your organization.",
      keywords: "book schedule consultation call contact website form"
    }
  };

  const MAIN_MENUS = [
    { id: "MENU_SERVICES", label: "Services" },
    { id: "MENU_PRICING", label: "Pricing & Plans" },
    { id: "MENU_AUTOMATIONS", label: "Automation" },
    { id: "MENU_INTEGRATIONS", label: "Integrations" },
    { id: "MENU_REVIEWS", label: "Quarterly Reviews" },
    { id: "MENU_START", label: "Get Started" }
  ];

  const CATEGORY_MAP = {
    MENU_SERVICES: {
      title: "Services",
      intro: "Here are the most common service questions.",
      items: [
        "FAQ_ABOUT",
        "FAQ_IDEAL",
        "FAQ_AUTOMATION",
        "FAQ_WEBSITE",
        "FAQ_RESULTS"
      ]
    },

    MENU_PRICING: {
      title: "Pricing & Plans",
      intro: "Choose a pricing question below.",
      items: [
        "FAQ_STARTER_PLAN",
        "FAQ_PROFESSIONAL_PLAN",
        "FAQ_ENTERPRISE_PLAN",
        "FAQ_PRICING",
        "FAQ_SETUP",
        "FAQ_CONTRACT"
      ]
    },

    MENU_AUTOMATIONS: {
      title: "Automation",
      intro: "Here are the automation and AI questions I can answer.",
      items: [
        "FAQ_WORKFLOW",
        "FAQ_AI",
        "FAQ_FEATURES",
        "FAQ_CUSTOM"
      ]
    },

    MENU_INTEGRATIONS: {
      title: "Integrations",
      intro: "Here are the integration questions I can answer.",
      items: [
        "FAQ_AI_INTEGRATION",
        "FAQ_INTEGRATIONS"
      ]
    },

    MENU_REVIEWS: {
      title: "Quarterly Reviews",
      intro: "Here are the quarterly review and retainer questions.",
      items: [
        "FAQ_REVIEW",
        "FAQ_RETAINER",
        "FAQ_SUPPORT"
      ]
    },

    MENU_START: {
      title: "Get Started",
      intro: "Ready to take the next step?",
      items: [
        "FAQ_TIME",
        "FAQ_START",
        "FAQ_BOOK"
      ]
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
      transition:
        background .15s ease,
        border-color .15s ease,
        transform .15s ease;
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
  bubble.setAttribute("aria-label", "Open A Quiet Origin chat");
  bubble.innerHTML = "💬";

  const card = document.createElement("div");
  card.className = "aqa-card";

  card.innerHTML = `
    <div class="aqa-head">
      <div class="aqa-dot"></div>
      <div class="aqa-title">A Quiet Origin</div>
    </div>

    <div class="aqa-body" id="aqa-body">
      <div id="aqa-messages"></div>
      <div class="aqa-chipwrap" id="aqa-chips"></div>
    </div>

    <div class="aqa-input">
      <input
        id="aqa-input"
        type="text"
        placeholder="Ask a question..."
      />
      <button
        class="aqa-btn"
        id="aqa-send"
        type="button"
      >
        Send
      </button>
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

      btn.className = `
        aqa-chip ${item.type === "back" ? "back" : ""}
      `.trim();

      btn.type = "button";
      btn.textContent = item.label;

      btn.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();

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
      appendMessage(
        "I can help with services, pricing, automation, integrations, quarterly reviews, and getting started."
      );

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
      const haystack = normalize(
        [
          faq.label,
          faq.q,
          faq.a,
          faq.keywords || ""
        ].join(" ")
      );

      let score = 0;

      if (haystack.includes(query)) {
        score += 10;
      }

      tokens.forEach((token) => {
        if (haystack.includes(token)) {
          score += 1;
        }
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

    appendMessage(
      "I can help with services, pricing, automation, integrations, quarterly reviews, and getting started. Choose a category below to continue."
    );

    renderMainMenu();
  }

  bubble.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    card.classList.toggle("open");
  };

  sendBtn.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    sendMessage();
  };

  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });

  appendMessage("How can I help today?");
  renderMainMenu();
})();