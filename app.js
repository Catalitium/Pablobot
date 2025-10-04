/* PABLOBOT - Production JS (ES Module, zero deps)
   - gtag + trackClick retained
   - No Supabase
   - Clean data/render pipeline
   - Accessible modal, search, keyboard nav, smooth scroll
   - Cryptorka tabs + shared search
*/

/* ===========================
   1) CONSTANTS & UTILITIES
   =========================== */

const SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const el = (tag, attrs = {}, ...children) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return n;
};

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 255) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function sanitize(str, max = 1000) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").trim().slice(0, max);
}

/* ===========================
   2) ANALYTICS
   =========================== */

/** Public tracking wrapper (name/shape kept). */
function trackClick(elementType, elementId, extra = {}) {
  const payload = {
    element_type: elementType,
    element_id: elementId,
    session_id: SESSION_ID,
    page_url: location.href,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
    clicked_at: new Date().toISOString(),
    ...extra
  };

  if (typeof window.gtag === "function") {
    const eventName = (() => {
      if (elementType === "navigation")        return "navigation_click";
      if (elementType === "llm-official-link") return "llm_official_click";
      if (elementType === "search")            return "search_performed";
      if (elementType === "collapsible-toggle")return "collapse_toggle";
      if (elementType === "newsletter")        return "newsletter_event";
      if (elementType === "modal")             return "modal_event";
      if (elementType === "button")            return "button_click";
      if (elementType === "external-link")     return "external_link_click";
      return "interaction";
    })();

    window.gtag("event", eventName, payload);
  } else {
    console.log("[trackClick]", payload);
  }
}
window.trackClick = trackClick; // expose for inline use

/* ===========================
   3) DATA
   =========================== */

const LLMs = [
  {
    emoji: "🛰️", name: "Grok 1.5", provider: "xAI",
    paramsB: 314, contextK: 128,
    official: "https://x.ai/",
    highlights: "Long-context model; Grok-1 open weights are 314B MoE."
  },
  {
    emoji: "🦙", name: "Llama 3 70B", provider: "Meta",
    paramsB: 70, contextK: 8,
    official: "https://www.llama.com/models/llama-3/",
    highlights: "Open ecosystem; strong community & tooling."
  },
  {
    emoji: "🦙", name: "Llama 3 8B", provider: "Meta",
    paramsB: 8, contextK: 8,
    official: "https://www.llama.com/models/llama-3/",
    highlights: "Lightweight option; excellent cost/perf."
  },
  {
    emoji: "🧠", name: "DeepSeek (V3/V2 family)", provider: "DeepSeek",
    paramsB: 236, contextK: 128,
    official: "https://www.deepseek.com/",
    highlights: "MoE efficiency; API lists 128K context."
  }
];

const DATA = {
  papersCore: [
    { t: "Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", meta: "(Vaswani et al., 2017)" },
    { t: "BERT", url: "https://arxiv.org/abs/1801.01290", meta: "(Devlin et al., 2018)" },
    { t: "Language Models are Few-Shot Learners", url: "https://arxiv.org/abs/2005.14165", meta: "(Brown et al., 2020)" },
    { t: "Riemann – On the Hypotheses…", url: "https://archive.org/details/riemannhypotheses", meta: "(1854)" },
    { t: "Évariste Galois – Mémoire…", url: "https://gallica.bnf.fr/ark:/12148/bpt6k433679w", meta: "(1832)" },
    { t: "Turing – On Computable Numbers…", url: "https://www.cs.ox.ac.uk/activities/ieg/e-library/sources/tp2-ie.pdf", meta: "(1936)" },
    { t: "Norbert Wiener – Cybernetics", url: "https://archive.org/details/cyberneticsorcon00wien", meta: "(1948)" }
  ],
  paperGroups: [
    {
      title: "🏗️ Foundational Papers",
      items: [
        { t: "Codd: A Relational Model…", url: "https://dl.acm.org/doi/10.1145/362384.362685", note: "Introduced the relational model. (1970)" },
        { t: "Spanner", url: "https://research.google/pubs/pub41344/", note: "Planet-scale, consistent distributed SQL. (2012)" },
        { t: "The End of an Architectural Era", url: "https://www.cs.cmu.edu/~christos/courses/826.F05/slides/foundation-nosql.pdf", note: "Traditional RDBMSs are too rigid. (2007)" }
      ]
    },
    {
      title: "🚀 Scaling & Performance",
      items: [
        { t: "Scaling Memcache at Facebook", url: "https://research.facebook.com/publications/scaling-memcache-at-facebook/", note: "How FB scales ephemeral caching." },
        { t: "The NoSQL Movement", url: "https://cacm.acm.org/magazines/2012/6/149798-the-nosql-movement/fulltext", note: "Why scale killed schemas (pendulum swinging back)." },
        { t: "Dynamo", url: "https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html", note: "Highly available key-value store. (2007)" }
      ]
    },
    {
      title: "🕸️ Graph & Modern Systems",
      items: [
        { t: "Graph Thinking", url: "https://neo4j.com/blog/graph-thinking/", note: "The shift from tables to graphs." },
        { t: "Bigtable", url: "https://research.google/pubs/pub45351/", note: "Google's distributed storage system. (2006)" },
        { t: "MapReduce", url: "https://research.google/pubs/pub36726/", note: "Large-scale data processing model. (2004)" }
      ]
    }
  ],
  timeline: [
    { y: "300 BCE", text: "Euclid's Elements lays the groundwork for geometry.", url: "https://en.wikipedia.org/wiki/Euclid%27s_Elements" },
    { y: "250 BCE", text: "Archimedes develops methods for calculating areas and volumes.", url: "https://en.wikipedia.org/wiki/Archimedes" },
    { y: "1801", text: "Gauss publishes Disquisitiones Arithmeticae.", url: "https://en.wikipedia.org/wiki/Disquisitiones_Arithmeticae" },
    { y: "1822", text: "Fourier introduces Fourier series.", url: "https://en.wikipedia.org/wiki/Fourier_series" },
    { y: "1854", text: "Riemann's geometry influences relativity.", url: "https://en.wikipedia.org/wiki/Riemannian_geometry" },
    { y: "1900", text: "Hilbert proposes 23 problems.", url: "https://en.wikipedia.org/wiki/Hilbert%27s_problems" },
    { y: "1910", text: "Russell & Whitehead's Principia Mathematica.", url: "https://en.wikipedia.org/wiki/Principia_Mathematica" },
    { y: "1931", text: "Gödel's incompleteness theorems.", url: "https://en.wikipedia.org/wiki/G%C3%B6del%27s_incompleteness_theorems" },
    { y: "1936", text: "Turing formulates the Halting Problem.", url: "https://en.wikipedia.org/wiki/Halting_problem" },
    { y: "1943", text: "McCulloch & Pitts neuron model.", url: "https://en.wikipedia.org/wiki/McCulloch%E2%80%93Pitts_neuron" },
    { y: "1950", text: "Turing Test proposed.", url: "https://en.wikipedia.org/wiki/Turing_test" },
    { y: "1951", text: "SNARC — first neural network computer.", url: "https://en.wikipedia.org/wiki/SNARC" },
    { y: "1956", text: "Logic Theorist — early AI program.", url: "https://en.wikipedia.org/wiki/Logic_Theorist" },
    { y: "1958", text: "Rosenblatt's Perceptron.", url: "https://en.wikipedia.org/wiki/Perceptron" },
    { y: "1966", text: "ELIZA — early NLP chatbot.", url: "https://en.wikipedia.org/wiki/ELIZA" },
    { y: "1997", text: "Deep Blue defeats Kasparov.", url: "https://en.wikipedia.org/wiki/Deep_Blue_(chess_computer)" },
    { y: "2012", text: "AlexNet wins ImageNet; modern deep learning era.", url: "https://en.wikipedia.org/wiki/AlexNet" },
    { y: "2016", text: "AlphaGo defeats Lee Sedol.", url: "https://en.wikipedia.org/wiki/AlphaGo" },
    { y: "2022", text: "OpenAI releases ChatGPT.", url: "https://en.wikipedia.org/wiki/ChatGPT" }
  ]
};

/* ===== CRYPTORKA: Stablecoins & Blue-chips (future-proof rows) =====
   Columns (as in HTML):
   # | Asset | Type (hide-sm) | Network | Paper/Docs | Dexscreener
*/
const CRYPTOS = [
  // Stablecoins
  { emoji:"💵", symbol:"USDT", name:"Tether USD₮", type:"Stablecoin",
    network:"Multi (ETH/SOL/TRON)",
    paper:"https://tether.to/en/whitepaper/",
    dexscreener:"https://dexscreener.com/search?q=USDT",
    note:"Largest USD-pegged stablecoin; deep liquidity."
  },
  { emoji:"💸", symbol:"USDC", name:"USD Coin", type:"Stablecoin",
    network:"Multi (ETH/SOL)",
    paper:"https://www.circle.com/blog/introducing-usdc",
    dexscreener:"https://dexscreener.com/search?q=USDC",
    note:"USD-pegged; issued by Circle; widely integrated."
  },
  { emoji:"🅿️", symbol:"PYUSD", name:"PayPal USD", type:"Stablecoin",
    network:"Ethereum",
    paper:"https://www.paxos.com/pyusd/",
    dexscreener:"https://dexscreener.com/search?q=PYUSD",
    note:"PayPal-branded USD stablecoin (Paxos)."
  },
  { emoji:"🔷", symbol:"TUSD", name:"TrueUSD", type:"Stablecoin",
    network:"Multi",
    paper:"https://www.tusd.io/",
    dexscreener:"https://dexscreener.com/search?q=TUSD",
    note:"USD-pegged; attestation-based."
  },
  { emoji:"🧾", symbol:"FDUSD", name:"First Digital USD", type:"Stablecoin",
    network:"Multi",
    paper:"https://www.fdusd.io/",
    dexscreener:"https://dexscreener.com/search?q=FDUSD",
    note:"USD-pegged; HK-based issuer."
  },
  { emoji:"💠", symbol:"USDP", name:"Pax Dollar", type:"Stablecoin",
    network:"Ethereum",
    paper:"https://www.paxos.com/usdp/",
    dexscreener:"https://dexscreener.com/search?q=USDP",
    note:"Regulated USD stablecoin by Paxos."
  },

  // Layer 1 blue-chips
  { emoji:"₿", symbol:"BTC", name:"Bitcoin", type:"Layer 1",
    network:"Bitcoin",
    paper:"https://bitcoin.org/bitcoin.pdf",
    dexscreener:"https://dexscreener.com/search?q=BTC",
    note:"Original crypto; most secure PoW network."
  },
  { emoji:"✨", symbol:"ETH", name:"Ethereum", type:"Layer 1",
    network:"Ethereum",
    paper:"https://ethereum.org/en/whitepaper/",
    dexscreener:"https://dexscreener.com/ethereum",
    note:"Smart contracts; transitioned to PoS."
  },
  { emoji:"🌞", symbol:"SOL", name:"Solana", type:"Layer 1",
    network:"Solana",
    paper:"https://solana.com/solana-whitepaper.pdf",
    dexscreener:"https://dexscreener.com/solana",
    note:"High-performance monolithic chain."
  },
  { emoji:"🟡", symbol:"BNB", name:"BNB (BNB Chain)", type:"Layer 1",
    network:"BNB Chain",
    paper:"https://www.bnbchain.org/en/whitepaper",
    dexscreener:"https://dexscreener.com/bsc",
    note:"High-throughput EVM-compatible chain."
  },
  { emoji:"🧬", symbol:"ADA", name:"Cardano", type:"Layer 1",
    network:"Cardano",
    paper:"https://iohk.io/en/research/library/papers/ouroboros-a-provably-secure-proof-of-stake-blockchain-protocol/",
    dexscreener:"https://dexscreener.com/search?q=ADA",
    note:"Peer-reviewed research; Ouroboros protocol."
  },
  { emoji:"💧", symbol:"XRP", name:"XRP (XRP Ledger)", type:"Layer 1",
    network:"XRP Ledger",
    paper:"https://ripple.com/files/ripple_consensus_whitepaper.pdf",
    dexscreener:"https://dexscreener.com/search?q=XRP",
    note:"Fast settlement on the XRP Ledger."
  },
  { emoji:"🔺", symbol:"TRX", name:"TRON", type:"Layer 1",
    network:"TRON",
    paper:"https://tron.network/static/doc/white_paper_v_2_0.pdf",
    dexscreener:"https://dexscreener.com/search?q=TRX",
    note:"High TPS; popular for stablecoin transfers."
  },
  { emoji:"🧊", symbol:"AVAX", name:"Avalanche", type:"Layer 1",
    network:"Avalanche",
    paper:"https://www.avalabs.org/whitepapers",
    dexscreener:"https://dexscreener.com/avalanche",
    note:"Avalanche consensus; subnets architecture."
  },
  { emoji:"📘", symbol:"TON", name:"TON", type:"Layer 1",
    network:"TON",
    paper:"https://ton.org/whitepaper.pdf",
    dexscreener:"https://dexscreener.com/search?q=TON",
    note:"Telegram-adjacent ecosystem; high throughput."
  },
  { emoji:"🟣", symbol:"DOT", name:"Polkadot", type:"Layer 1",
    network:"Polkadot",
    paper:"https://polkadot.network/whitepaper/",
    dexscreener:"https://dexscreener.com/search?q=DOT",
    note:"Heterogeneous multi-chain (parachains)."
  },
  { emoji:"💿", symbol:"LTC", name:"Litecoin", type:"Layer 1",
    network:"Litecoin",
    paper:"https://litecoin.org/",
    dexscreener:"https://dexscreener.com/search?q=LTC",
    note:"Early Bitcoin fork; fast/low-fee transfers."
  }
];

const TYPE_ORDER = ["Stablecoin", "Layer 1", "Exchange Token", "Layer 2", "Appchain", "Other"];
const typeRank = (t) => {
  const i = TYPE_ORDER.indexOf(t);
  return i === -1 ? TYPE_ORDER.length : i;
};

/* ===========================
   4) RENDERERS
   =========================== */

const fmt = (n) => (n == null ? "—" : String(n));

function rankModels(models){
  return models
    .slice()
    .sort((a,b) => {
      const ac = a.contextK ?? -Infinity, bc = b.contextK ?? -Infinity;
      if (ac !== bc) return bc - ac;
      const ap = a.paramsB ?? -Infinity, bp = b.paramsB ?? -Infinity;
      if (ap !== bp) return bp - ap;
      return a.name.localeCompare(b.name);
    })
    .map((m,i) => ({ ...m, _rank: (m.contextK==null && m.paramsB==null) ? "—" : i+1 }));
}

function renderLLMTable(){
  const tbody = $("#llm-tbody");
  if (!tbody) return;
  const ranked = rankModels(LLMs);
  tbody.innerHTML = "";

  for (const m of ranked) {
    const tr = el("tr", { tabindex: "0", role: "row" },
      el("td", { role: "cell" }, el("span", { class: "rank", "aria-label": "Rank" }, String(m._rank)) ),
      el("td", { role: "cell" },
        el("div", { class: "model" },
          el("span", { class: "emoji", "aria-hidden": "true" }, m.emoji || "🤖"),
          el("div", {},
            el("strong", {}, m.name),
            el("div", { class: "cell-note" }, m.highlights || "")
          )
        )
      ),
      el("td", { class: "hide-sm", role: "cell" }, m.provider || "—"),
      el("td", { role: "cell" }, fmt(m.paramsB)),
      el("td", { role: "cell" }, fmt(m.contextK)),
      el("td", { role: "cell" },
        el("a", {
          href: m.official, target: "_blank", rel: "noopener",
          class: "llm-official-link",
          "data-model-name": m.name,
          "data-model-slug": (m.name || "").toLowerCase().replace(/\s+/g, "-"),
          "aria-label": `Visit ${m.name} official page`
        }, "Official")
      )
    );
    tbody.appendChild(tr);
  }
}

function renderPapersCore(){
  const ul = $("#papers-core-list");
  if (!ul) return;
  ul.innerHTML = "";
  for (const { t, url, meta } of DATA.papersCore) {
    const a = el("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, t);
    ul.appendChild(el("li", {}, a, ` ${meta || ""}`));
  }
}

function renderPaperGroups(){
  const root = $("#paper-groups");
  if (!root) return;
  root.innerHTML = "";

  for (const group of DATA.paperGroups) {
    const list = el("ul", { class: "list" });
    for (const { t, url, note } of group.items) {
      const a = el("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, t);
      list.appendChild(el("li", {}, el("strong", {}, a), ` — ${note}`));
    }
    root.appendChild(el("div", { class: "card" }, el("h3", {}, group.title), list));
  }
}

function renderTimeline(){
  const ul = $("#timeline-list");
  if (!ul) return;
  ul.innerHTML = "";
  for (const { y, text, url } of DATA.timeline) {
    const a = el("a", { href: url, target: "_blank", rel: "noopener noreferrer" }, text);
    ul.appendChild(el("li", {}, el("strong", {}, `${y}: `), a));
  }
}

/* ===== Cryptorka: render “stables & blue-chips” table ===== */
function rankCryptos(list) {
  return list
    .slice()
    .sort((a,b) => {
      const ta = typeRank(a.type), tb = typeRank(b.type);
      if (ta !== tb) return ta - tb;
      return a.name.localeCompare(b.name);
    })
    .map((c, i) => ({ ...c, _rank: i + 1 }));
}

function renderCryptoTable() {
  const tbody = $("#crypto-tbody");
  if (!tbody) return;
  const ranked = rankCryptos(CRYPTOS);
  tbody.innerHTML = "";

  for (const c of ranked) {
    const tr = el("tr", { tabindex: "0" });
    tr.innerHTML = `
      <td><span class="rank" aria-label="Rank">${c._rank}</span></td>
      <td>
        <div class="model">
          <span class="emoji" aria-hidden="true">${c.emoji || "🪙"}</span>
          <div>
            <strong>${c.name} <span class="meta-pill">${c.symbol}</span></strong>
            <div class="cell-note">${c.note || ""}</div>
          </div>
        </div>
      </td>
      <td class="hide-sm">${c.type || "—"}</td>
      <td>${c.network || "—"}</td>
      <td>
        <a href="${c.paper}" target="_blank" rel="noopener"
           class="crypto-whitepaper-link"
           data-asset="${c.symbol}"
           aria-label="Open ${c.name} paper/docs">Paper</a>
      </td>
      <td>
        <a href="${c.dexscreener}" target="_blank" rel="noopener"
           class="crypto-dexscreener-link"
           data-asset="${c.symbol}"
           aria-label="Open Dexscreener pairs for ${c.symbol}">Pairs</a>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

/* ===========================
   5) INTERACTIONS
   =========================== */

/* --- LLM interactions --- */
function bindLLMOfficialClickTracking(){
  document.addEventListener("click", (e) => {
    const a = e.target.closest(".llm-official-link");
    if (!a) return;
    const name = a.getAttribute("data-model-name") || "unknown";
    const slug = a.getAttribute("data-model-slug") || "unknown";
    trackClick("llm-official-link", slug, { model_name: name, model_slug: slug });
  });
}

function bindLLMKeyboardNav(){
  const tbody = $("#llm-tbody");
  if (!tbody) return;
  tbody.addEventListener("keydown", (e) => {
    const currentRow = e.target.closest("tr");
    if (!currentRow) return;
    const rows = $$("tr", tbody);
    const i = rows.indexOf(currentRow);

    switch (e.key) {
      case "ArrowDown": e.preventDefault(); rows[i + 1]?.focus(); break;
      case "ArrowUp":   e.preventDefault(); rows[i - 1]?.focus(); break;
      case "Home":      e.preventDefault(); rows[0]?.focus();     break;
      case "End":       e.preventDefault(); rows.at(-1)?.focus();  break;
      case "Enter":
      case " ":
        e.preventDefault();
        currentRow.querySelector(".llm-official-link")?.click();
        break;
    }
  });
}

function bindLLMSearch(){
  const input = $("#llmSearch");
  const tbody = $("#llm-tbody");
  if (!input || !tbody) return;

  const debouncedSearchTrack = debounce((query, count) => {
    trackClick("search", "llm-search", { search_query: query, results_count: count });
  }, 800);

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    const rows = $$("tr", tbody);
    let visible = 0;

    for (const r of rows) {
      const show = r.innerText.toLowerCase().includes(q);
      r.style.display = show ? "" : "none";
      if (show) visible++;
    }

    let chip = $("#search-results");
    if (q) {
      const txt = `${visible} model${visible === 1 ? "" : "s"} found`;
      if (!chip) {
        chip = el("span", { id: "search-results", class: "search-results" }, txt);
        input.parentElement.appendChild(chip);
      } else chip.textContent = txt;
      debouncedSearchTrack(q, visible);
    } else {
      chip?.remove();
    }
  });
}

/* --- Global collapsibles + smooth scroll + tracking --- */
function bindCollapsibles(){
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-toggle]");
    if (!btn) return;
    const sel = btn.getAttribute("data-toggle");
    const wrap = btn.closest(".collapse");
    const panel = sel ? document.querySelector(sel) : null;
    if (!wrap || !panel) return;

    const open = wrap.getAttribute("data-open") === "true";
    wrap.setAttribute("data-open", String(!open));
    btn.setAttribute("aria-expanded", String(!open));
    trackClick("collapsible-toggle", sel, { action: open ? "close" : "open", section_name: btn.textContent.trim() });
  });
}

function bindSmoothScroll(){
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", id);
  });
}

function setupNavigationTracking(){
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;
    const trackId = el.getAttribute("data-track");
    const linkText = (el.textContent || "").trim();
    const href = el.getAttribute("href") || null;
    trackClick("navigation", trackId, { link_text: linkText, link_href: href });
  });
}

function setupExternalLinkTracking(){
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="http"]');
    if (!link) return;
    const section = link.closest("section");
    const sectionId = section ? section.id : "unknown";
    trackClick("external-link", sectionId, {
      link_url: link.href,
      link_text: (link.textContent || "").trim(),
      section: sectionId
    });
  });
}

/* ===========================
   6) NEWSLETTER MODAL (no backend)
   =========================== */

let lastFocusedElement = null;

function openModal(){
  const modal = $("#newsletter-modal");
  const backdrop = $("#modal-backdrop");
  const emailInput = $("#nl-email");
  if (!modal || !backdrop) return;

  lastFocusedElement = document.activeElement;
  modal.setAttribute("aria-hidden", "false");
  backdrop.setAttribute("data-open", "true");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  setTimeout(() => emailInput?.focus(), 80);
  trackClick("modal", "newsletter-open", { action: "open" });
}

function closeModal(){
  const modal = $("#newsletter-modal");
  const backdrop = $("#modal-backdrop");
  const form = $("#nl-form");
  const feedback = $("#nl-feedback");
  if (!modal || !backdrop) return;

  modal.setAttribute("aria-hidden", "true");
  backdrop.setAttribute("data-open", "false");
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  form?.reset();
  if (feedback) { feedback.textContent = ""; feedback.className = "note"; }

  lastFocusedElement?.focus();
  lastFocusedElement = null;

  trackClick("modal", "newsletter-close", { action: "close" });
}

// Replace with real backend later
async function handleSubscribe(email){
  return new Promise((resolve) => setTimeout(resolve, 250));
}

function setupNewsletterModal(){
  const form = $("#nl-form");
  const emailInput = $("#nl-email");
  const feedback = $("#nl-feedback");
  const closeBtn = $("#nl-close");
  const backdrop = $("#modal-backdrop");
  const modal = $("#newsletter-modal");
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form || !emailInput || !feedback || !modal) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    feedback.textContent = "";
    feedback.className = "note";

    if (!validateEmail(email)) {
      feedback.textContent = "Please enter a valid email address";
      feedback.className = "note error";
      trackClick("newsletter", "subscribe-invalid", { reason: "invalid_email" });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Subscribing…";

    try {
      await handleSubscribe(email);
      feedback.textContent = "✅ Subscribed! Thank you.";
      feedback.className = "note success";
      form.reset();

      const domain = email.split("@")[1] || "";
      trackClick("newsletter", "newsletter_submit_success", { email_domain: domain });

      setTimeout(closeModal, 800);
    } catch (err) {
      feedback.textContent = (err && err.message) || "Failed to subscribe. Please try again.";
      feedback.className = "note error";
      trackClick("newsletter", "newsletter_submit_error", { error: String(err && err.message) });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Subscribe";
    }
  });

  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
  });

  // Focus trap
  modal.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });
}

window.openModal = openModal; // expose for inline bridge

/* ===========================
   7) CRYPTORKA TABS + SHARED SEARCH
   =========================== */

function setupCryptorkaTabs(){
  const tabStables   = $("#tab-stables");
  const tabWallets   = $("#tab-wallets");
  const panelStables = $("#panel-stables");
  const panelWallets = $("#panel-wallets");
  const search       = $("#cryptoSearch");
  const hint         = $("#cryptoSearchHint");

  if (!tabStables || !tabWallets || !panelStables || !panelWallets || !search) return;

  function applyFilter(q){
    const query = (q || "").toLowerCase();

    // Filter current visible panel rows
    if (!panelStables.hidden) {
      $$("#crypto-tbody tr").forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(query) ? "" : "none";
      });
    } else {
      $$("#wallets-tbody tr").forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(query) ? "" : "none";
      });
    }

    // results chip
    let chip = $("#crypto-search-results");
    if (query) {
      const container = panelStables.hidden ? "#wallets-tbody" : "#crypto-tbody";
      const visible = $$(container + " tr").filter(tr => tr.style.display !== "none").length;
      const msg = `${visible} item${visible === 1 ? "" : "s"} found`;
      if (!chip) {
        chip = el("span", { id:"crypto-search-results", class:"search-results" }, msg);
        search.parentElement.appendChild(chip);
      } else chip.textContent = msg;

      clearTimeout(applyFilter._t);
      applyFilter._t = setTimeout(() => {
        trackClick("search", "crypto-shared-search", {
          tab: panelWallets.hidden ? "stables" : "wallets",
          search_query: query
        });
      }, 800);
    } else {
      chip?.remove();
    }
  }

  function setActive(which){
    const isStables = which === "stables";
    tabStables.classList.toggle("is-active", isStables);
    tabWallets.classList.toggle("is-active", !isStables);

    tabStables.setAttribute("aria-selected", String(isStables));
    tabWallets.setAttribute("aria-selected", String(!isStables));

    tabStables.tabIndex = isStables ? 0 : -1;
    tabWallets.tabIndex = isStables ? -1 : 0;

    panelStables.hidden = !isStables;
    panelWallets.hidden = isStables;

    if (hint) hint.textContent = isStables
      ? "Sorted by type (Stablecoin → Layer 1), then name"
      : "Sorted alphabetically by label";

    trackClick("navigation", "crypto-tab-change", { tab: which });
    applyFilter(search.value.trim());
  }

  tabStables.addEventListener("click", () => setActive("stables"));
  tabWallets.addEventListener("click", () => setActive("wallets"));

  // roving focus with arrows, Home/End, Enter/Space
  tabStables.parentElement.addEventListener("keydown", (e) => {
    const tabs = [tabStables, tabWallets];
    const i = tabs.indexOf(document.activeElement);
    if (i === -1) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = e.key === "ArrowRight" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
    } else if (e.key === "Home") { e.preventDefault(); tabs[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); tabs[tabs.length-1].focus(); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.activeElement.click(); }
  });

  search.addEventListener("input", () => applyFilter(search.value.trim()));

  const p = new URLSearchParams(location.search);
  setActive(p.get("tab") === "wallets" ? "wallets" : "stables");
}

/* --- Crypto link tracking (papers/dex + wallet explorers) --- */
function bindCryptoLinkTracking() {
  document.addEventListener("click", (e) => {
    const wp = e.target.closest(".crypto-whitepaper-link");
    if (wp) {
      const symbol = wp.getAttribute("data-asset") || "UNKNOWN";
      trackClick("external-link", "crypto-paper", { asset_symbol: symbol, link_url: wp.href });
      return;
    }
    const dx = e.target.closest(".crypto-dexscreener-link");
    if (dx) {
      const symbol = dx.getAttribute("data-asset") || "UNKNOWN";
      trackClick("external-link", "crypto-dexscreener", { asset_symbol: symbol, link_url: dx.href });
      return;
    }
    const wx = e.target.closest(".wallet-explorer-link");
    if (wx) {
      trackClick("external-link", "wallet-explorer", { link_url: wx.href });
    }
  });
}

// --- CRYPTORKA TABS (stable fix) ---
function setupCryptorkaTabs() {
  const tabStables   = document.getElementById('tab-stables');
  const tabWallets   = document.getElementById('tab-wallets');
  const panelStables = document.getElementById('panel-stables');
  const panelWallets = document.getElementById('panel-wallets');
  const search       = document.getElementById('cryptoSearch');
  const hint         = document.getElementById('cryptoSearchHint');

  if (!tabStables || !tabWallets || !panelStables || !panelWallets) return;

  const applyFilter = (q) => {
    const query = (q || '').toLowerCase();
    const activeTbody = panelWallets.hidden
      ? document.querySelector('#crypto-tbody')
      : document.querySelector('#wallets-tbody');
    const otherTbody = panelWallets.hidden
      ? document.querySelector('#wallets-tbody')
      : document.querySelector('#crypto-tbody');

    // filter only active panel
    Array.from(activeTbody.rows).forEach(r => {
      r.style.display = r.innerText.toLowerCase().includes(query) ? '' : 'none';
    });
    // ensure hidden panel stays clean (no residual display:none)
    Array.from(otherTbody.rows).forEach(r => { r.style.display = ''; });

    let chip = document.getElementById('crypto-search-results');
    if (query) {
      const visible = Array.from(activeTbody.rows).filter(r => r.style.display !== 'none').length;
      const msg = `${visible} item${visible === 1 ? '' : 's'} found`;
      if (!chip) {
        chip = document.createElement('span');
        chip.id = 'crypto-search-results';
        chip.className = 'search-results';
        search?.parentElement.appendChild(chip);
      }
      chip.textContent = msg;
    } else {
      chip?.remove();
    }
  };

  const setActive = (which) => {
    const st = which === 'stables';
    tabStables.classList.toggle('is-active', st);
    tabWallets.classList.toggle('is-active', !st);

    tabStables.setAttribute('aria-selected', String(st));
    tabWallets.setAttribute('aria-selected', String(!st));

    tabStables.tabIndex = st ? 0 : -1;
    tabWallets.tabIndex = st ? -1 : 0;

    panelStables.hidden = !st;
    panelWallets.hidden = st;

    if (hint) {
      hint.textContent = st
        ? 'Sorted by type (Stablecoin → Layer 1), then name'
        : 'Sorted alphabetically by label';
    }

    if (typeof trackClick === 'function') {
      trackClick('navigation', 'crypto-tab-change', { tab: which });
    }

    applyFilter(search?.value || '');
  };

  // click handlers
  tabStables.addEventListener('click', () => setActive('stables'));
  tabWallets.addEventListener('click', () => setActive('wallets'));

  // roving focus + keyboard activation
  tabStables.parentElement.addEventListener('keydown', (e) => {
    const tabs = [tabStables, tabWallets];
    const i = tabs.indexOf(document.activeElement);
    if (i === -1) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
    } else if (e.key === 'Home') {
      e.preventDefault(); tabs[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault(); tabs[tabs.length - 1].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); document.activeElement.click();
    }
  });

  // shared search
  search?.addEventListener('input', () => applyFilter(search.value));

  // initial state (supports ?tab=wallets)
  const p = new URLSearchParams(location.search);
  setActive(p.get('tab') === 'wallets' ? 'wallets' : 'stables');
}


/* ===========================
   8) INIT
   =========================== */

document.addEventListener("DOMContentLoaded", () => {
  // Render content
  renderLLMTable();
  renderPapersCore();
  renderPaperGroups();
  renderTimeline();
  renderCryptoTable();

  // Bind global interactions
  bindLLMOfficialClickTracking();
  bindLLMKeyboardNav();
  bindLLMSearch();
  bindCollapsibles();
  bindSmoothScroll();
  setupNavigationTracking();
  setupExternalLinkTracking();
  setupNewsletterModal();
  setupCryptorkaTabs();
  bindCryptoLinkTracking();

  // Open modal buttons
  $("#newsletter-btn")?.addEventListener("click", () => {
    trackClick("button", "newsletter-btn-nav", { action: "open-modal" });
    openModal();
  });
  $("#fab-newsletter")?.addEventListener("click", () => {
    trackClick("button", "newsletter-btn-fab", { action: "open-modal" });
    openModal();
  });
});
