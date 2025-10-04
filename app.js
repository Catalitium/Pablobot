/* LLM Comparison Site - Plain HTML/CSS/JS with Supabase
   - Enhanced LLM table with keyboard navigation
   - Newsletter modal with Supabase integration
   - Click tracking via Supabase
   - Client-side search/filter
   - Accessible and mobile-responsive
*/

// ---------- CONFIGURATION ----------

const SUPABASE_URL = window.SUPABASE_URL || ''; // Add your Supabase URL
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || ''; // Add your Supabase anon key

// ---------- SUPABASE CLIENT (v2 SDK) ----------

let sb = null;

function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase not configured. Database features disabled.');
    return null;
  }
  
  if (!window.supabase) {
    console.error('❌ Supabase SDK not loaded');
    return null;
  }
  
  try {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
    return sb;
  } catch (error) {
    console.error('❌ Supabase init failed:', error);
    return null;
  }
}

// ---------- UTILITIES ----------

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      n.addEventListener(k.substring(2).toLowerCase(), v);
    } else {
      n.setAttribute(k, v);
    }
  });
  children.forEach(c => {
    if (typeof c === 'string') n.appendChild(document.createTextNode(c));
    else if (c) n.appendChild(c);
  });
  return n;
}

function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

const SESSION_ID = generateSessionId();

// ---------- VALIDATION ----------

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 255) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function validateName(name) {
  if (!name) return true; // Optional
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length > 100) return false;
  return /^[a-zA-Z\s\-']+$/.test(trimmed);
}

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim().substring(0, 1000);
}

// ---------- DATA ----------

const DATA = {
  llms: [
    {
      name: 'Grok',
      slug: 'grok',
      provider: 'xAI',
      official: 'https://x.ai/',
      highlights: 'Conversational assistant with web & tools integration; fast iteration cadence.'
    },
    {
      name: 'Llama 3',
      slug: 'llama-3',
      provider: 'Meta',
      official: 'https://ai.meta.com/llama/',
      highlights: 'Open(ish) ecosystem, strong community adoption, multiple parameter sizes.'
    },
    {
      name: 'DeepSeek',
      slug: 'deepseek',
      provider: 'DeepSeek',
      official: 'https://www.deepseek.com/',
      highlights: 'Competitive performance with efficient inference; research-driven updates.'
    },
    {
      name: 'Claude',
      slug: 'claude',
      provider: 'Anthropic',
      official: 'https://www.anthropic.com/claude',
      highlights: 'Constitutional AI with strong reasoning; helpful, harmless, and honest approach.'
    },
    {
      name: 'Gemini',
      slug: 'gemini',
      provider: 'Google',
      official: 'https://deepmind.google/technologies/gemini/',
      highlights: 'Multimodal capabilities; integrated with Google services and tools.'
    },
    {
      name: 'Mistral',
      slug: 'mistral',
      provider: 'Mistral AI',
      official: 'https://mistral.ai/',
      highlights: 'European AI with open models; efficient architecture and strong performance.'
    }
  ],

  topics: [
    { icon: '📚', title: 'Articles', desc: 'Insights and reflections across our knowledge guilds' },
    { icon: '🤖', title: 'Artificial Intelligence', desc: 'Machine learning, neural networks, and AI systems' },
    { icon: '⚙️', title: 'Automation', desc: 'Process automation and workflow optimization' },
    { icon: '🧪', title: 'Chemistry', desc: 'Chemical reactions, compounds, and molecular science' },
    { icon: '🗄️', title: 'Databases', desc: 'Data storage, management, and query systems' },
    { icon: '🔧', title: 'Engineering', desc: 'Technical design, systems, and problem-solving' },
    { icon: '📐', title: 'Mathematics', desc: 'Numbers, equations, and mathematical concepts' },
    { icon: '👤', title: 'About', desc: 'Learn more about our mission, team, and story' }
  ],

  articles: [
    { icon: '📐', title: 'The Magic of Fibonacci', desc: 'How a simple sequence defines beauty, nature, and algorithms.' },
    { icon: '🔁', title: 'Understanding Recursion', desc: 'A deep dive with analogies, code, and demos.' },
    { icon: '🌻', title: 'The Golden Ratio', desc: 'Explore the golden ratio in art, nature, and design.' },
    { icon: '📖', title: 'Computational Problems Dictionary', desc: 'A categorized reference of common problems and techniques.' },
    { icon: '📘', title: 'AI & Math Concepts Dictionary', desc: 'Key concepts in AI, machine learning, and mathematics.' }
  ],

  dictionary: [
    { term: 'Algorithm', def: 'Step-by-step procedure to solve problems or make decisions.' },
    { term: 'Neural Network', def: 'Model inspired by the human brain, used for pattern recognition.' },
    { term: 'Transformer', def: 'Deep learning model architecture for sequence data.' },
    { term: 'Reinforcement Learning', def: 'Training by rewards from environment interaction.' },
    { term: 'Prompt Engineering', def: 'Crafting text to steer AI behavior.' }
  ],

  papersCore: [
    { t: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', meta: '(Vaswani et al., 2017)' },
    { t: 'BERT', url: 'https://arxiv.org/abs/1801.01290', meta: '(Devlin et al., 2018)' },
    { t: 'Language Models are Few-Shot Learners', url: 'https://arxiv.org/abs/2005.14165', meta: '(Brown et al., 2020)' },
    { t: 'Riemann – On the Hypotheses…', url: 'https://archive.org/details/riemannhypotheses', meta: '(1854)' },
    { t: 'Évariste Galois – Mémoire…', url: 'https://gallica.bnf.fr/ark:/12148/bpt6k433679w', meta: '(1832)' },
    { t: 'Turing – On Computable Numbers…', url: 'https://www.cs.ox.ac.uk/activities/ieg/e-library/sources/tp2-ie.pdf', meta: '(1936)' },
    { t: 'Norbert Wiener – Cybernetics', url: 'https://archive.org/details/cyberneticsorcon00wien', meta: '(1948)' }
  ],

  paperGroups: [
    {
      title: '🏗️ Foundational Papers',
      items: [
        { t: 'Codd: A Relational Model…', url: 'https://dl.acm.org/doi/10.1145/362384.362685', note: 'Introduced the relational model. (1970)' },
        { t: 'Spanner', url: 'https://research.google/pubs/pub41344/', note: 'Planet-scale, consistent distributed SQL. (2012)' },
        { t: 'The End of an Architectural Era', url: 'https://www.cs.cmu.edu/~christos/courses/826.F05/slides/foundation-nosql.pdf', note: 'Traditional RDBMSs are too rigid. (2007)' }
      ]
    },
    {
      title: '🚀 Scaling & Performance',
      items: [
        { t: 'Scaling Memcache at Facebook', url: 'https://research.facebook.com/publications/scaling-memcache-at-facebook/', note: 'How FB scales ephemeral caching.' },
        { t: 'The NoSQL Movement', url: 'https://cacm.acm.org/magazines/2012/6/149798-the-nosql-movement/fulltext', note: 'Why scale killed schemas (pendulum swinging back).' },
        { t: 'Dynamo', url: 'https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html', note: 'Highly available key-value store. (2007)' }
      ]
    },
    {
      title: '🕸️ Graph & Modern Systems',
      items: [
        { t: 'Graph Thinking', url: 'https://neo4j.com/blog/graph-thinking/', note: 'The shift from tables to graphs.' },
        { t: 'Bigtable', url: 'https://research.google/pubs/pub45351/', note: 'Google\'s distributed storage system. (2006)' },
        { t: 'MapReduce', url: 'https://research.google/pubs/pub36726/', note: 'Large-scale data processing model. (2004)' }
      ]
    }
  ],

  timeline: [
    { y: '300 BCE', text: 'Euclid\'s Elements lays the groundwork for geometry.', url: 'https://en.wikipedia.org/wiki/Euclid%27s_Elements' },
    { y: '250 BCE', text: 'Archimedes develops methods for calculating areas and volumes.', url: 'https://en.wikipedia.org/wiki/Archimedes' },
    { y: '1801', text: 'Gauss publishes Disquisitiones Arithmeticae.', url: 'https://en.wikipedia.org/wiki/Disquisitiones_Arithmeticae' },
    { y: '1822', text: 'Fourier introduces Fourier series.', url: 'https://en.wikipedia.org/wiki/Fourier_series' },
    { y: '1854', text: 'Riemann\'s geometry influences relativity.', url: 'https://en.wikipedia.org/wiki/Riemannian_geometry' },
    { y: '1900', text: 'Hilbert proposes 23 problems.', url: 'https://en.wikipedia.org/wiki/Hilbert%27s_problems' },
    { y: '1910', text: 'Russell & Whitehead\'s Principia Mathematica.', url: 'https://en.wikipedia.org/wiki/Principia_Mathematica' },
    { y: '1931', text: 'Gödel\'s incompleteness theorems.', url: 'https://en.wikipedia.org/wiki/G%C3%B6del%27s_incompleteness_theorems' },
    { y: '1936', text: 'Turing formulates the Halting Problem.', url: 'https://en.wikipedia.org/wiki/Halting_problem' },
    { y: '1943', text: 'McCulloch & Pitts neuron model.', url: 'https://en.wikipedia.org/wiki/McCulloch%E2%80%93Pitts_neuron' },
    { y: '1950', text: 'Turing Test proposed.', url: 'https://en.wikipedia.org/wiki/Turing_test' },
    { y: '1951', text: 'SNARC — first neural network computer.', url: 'https://en.wikipedia.org/wiki/SNARC' },
    { y: '1956', text: 'Logic Theorist — early AI program.', url: 'https://en.wikipedia.org/wiki/Logic_Theorist' },
    { y: '1958', text: 'Rosenblatt\'s Perceptron.', url: 'https://en.wikipedia.org/wiki/Perceptron' },
    { y: '1966', text: 'ELIZA — early NLP chatbot.', url: 'https://en.wikipedia.org/wiki/ELIZA' },
    { y: '1997', text: 'Deep Blue defeats Kasparov.', url: 'https://en.wikipedia.org/wiki/Deep_Blue_(chess_computer)' },
    { y: '2012', text: 'AlexNet wins ImageNet; modern deep learning era.', url: 'https://en.wikipedia.org/wiki/AlexNet' },
    { y: '2016', text: 'AlphaGo defeats Lee Sedol.', url: 'https://en.wikipedia.org/wiki/AlphaGo' },
    { y: '2022', text: 'OpenAI releases ChatGPT.', url: 'https://en.wikipedia.org/wiki/ChatGPT' }
  ]
};

// ---------- CLICK TRACKING ----------

async function trackClick(elementType, elementId, additionalData = {}) {
  if (!sb) {
    console.log('Track:', elementType, elementId, additionalData);
    return;
  }
  
  const data = {
    element_type: elementType,
    element_id: elementId,
    session_id: SESSION_ID,
    page_url: window.location.href,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
    clicked_at: new Date().toISOString(),
    ...additionalData
  };
  
  // Non-blocking: use sendBeacon if available, fallback to fetch with keepalive
  const payload = JSON.stringify(data);
  const url = `${SUPABASE_URL}/rest/v1/click_events`;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'return=minimal'
  };
  
  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
  } else {
    fetch(url, {
      method: 'POST',
      headers,
      body: payload,
      keepalive: true
    }).catch(err => console.error('Track failed:', err));
  }
}

// Track LLM official link clicks
async function trackLLMClick(modelName, modelSlug) {
  await trackClick('llm-official-link', modelSlug, {
    model_name: modelName,
    model_slug: modelSlug
  });
}

// Track navigation clicks
function setupNavigationTracking() {
  $$('[data-track]').forEach(element => {
    element.addEventListener('click', () => {
      const trackId = element.getAttribute('data-track');
      trackClick('navigation', trackId, {
        link_text: element.textContent.trim(),
        link_href: element.getAttribute('href')
      });
    });
  });
}

// Track paper/timeline link clicks
function setupExternalLinkTracking() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="http"]');
    if (!link) return;
    
    const section = link.closest('section');
    const sectionId = section ? section.id : 'unknown';
    
    trackClick('external-link', sectionId, {
      link_url: link.href,
      link_text: link.textContent.trim(),
      section: sectionId
    });
  });
}

// Track search usage
function trackSearch(query, resultsCount) {
  trackClick('search', 'llm-search', {
    search_query: query,
    results_count: resultsCount
  });
}

// Track collapsible toggles
function setupCollapsibleTracking() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-toggle]');
    if (!btn) return;
    
    const targetId = btn.getAttribute('data-toggle');
    const isOpen = btn.closest('.collapse').getAttribute('data-open') === 'true';
    
    trackClick('collapsible-toggle', targetId, {
      action: isOpen ? 'close' : 'open',
      section_name: btn.textContent.trim()
    });
  });
}

// ---------- NEWSLETTER MODAL ----------

let isSubmitting = false;
let lastFocusedElement = null;

async function subscribe(email) {
  if (!sb) throw new Error('Database not configured');
  
  const { error } = await sb.from('subscribers').insert([{
    email: email.toLowerCase().trim(),
    source: 'modal',
    path: location.pathname + location.hash,
    ua: navigator.userAgent,
    subscribed_at: new Date().toISOString()
  }]);
  
  if (error) {
    if (error.code === '23505' || error.message.includes('duplicate')) {
      throw new Error('Email already subscribed');
    }
    throw error;
  }
}

function openModal() {
  const modal = $('#newsletter-modal');
  const backdrop = $('#modal-backdrop');
  const emailInput = $('#nl-email');
  
  if (!modal || !backdrop) return;
  
  // Store last focused element
  lastFocusedElement = document.activeElement;
  
  // Show modal
  modal.setAttribute('aria-hidden', 'false');
  backdrop.setAttribute('data-open', 'true');
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  
  // Focus first input
  setTimeout(() => emailInput && emailInput.focus(), 100);
  
  // Track modal open
  trackClick('modal', 'newsletter-open', { action: 'open' });
}

function closeModal() {
  const modal = $('#newsletter-modal');
  const backdrop = $('#modal-backdrop');
  const form = $('#nl-form');
  const feedback = $('#nl-feedback');
  
  if (!modal || !backdrop) return;
  
  // Hide modal
  modal.setAttribute('aria-hidden', 'true');
  backdrop.setAttribute('data-open', 'false');
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  
  // Reset form
  if (form) form.reset();
  if (feedback) {
    feedback.textContent = '';
    feedback.className = 'note';
  }
  
  // Return focus
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
  
  // Track modal close
  trackClick('modal', 'newsletter-close', { action: 'close' });
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 255) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function setupNewsletterModal() {
  const form = $('#nl-form');
  const emailInput = $('#nl-email');
  const submitBtn = form?.querySelector('button[type="submit"]');
  const feedback = $('#nl-feedback');
  const closeBtn = $('#nl-close');
  const backdrop = $('#modal-backdrop');
  const modal = $('#newsletter-modal');
  
  if (!form) return;
  
  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const email = emailInput.value.trim();
    
    // Clear previous feedback
    feedback.textContent = '';
    feedback.className = 'note';
    
    // Validate
    if (!validateEmail(email)) {
      feedback.textContent = 'Please enter a valid email address';
      feedback.className = 'note error';
      return;
    }
    
    // Submit
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';
    
    try {
      await subscribe(email);
      
      // Success
      feedback.textContent = '✅ Subscribed! Thank you.';
      feedback.className = 'note success';
      form.reset();
      
      // Track success
      trackClick('newsletter', 'subscribe-success', { email_domain: email.split('@')[1] });
      
      // Auto-close after 800ms
      setTimeout(closeModal, 800);
    } catch (error) {
      // Error
      feedback.textContent = error.message || 'Failed to subscribe. Please try again.';
      feedback.className = 'note error';
      
      // Track error
      trackClick('newsletter', 'subscribe-error', { error: error.message });
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Subscribe';
    }
  });
  
  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  
  // Backdrop click
  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
  }
  
  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });
  
  // Focus trap
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

// ---------- LLM TABLE ----------

let currentFocusedRow = -1;

function renderLLMs() {
  const tbody = $('#llm-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  DATA.llms.forEach((model, index) => {
    const row = el('tr',
      {
        'data-model-slug': model.slug,
        'data-model-name': model.name,
        'tabindex': index === 0 ? '0' : '-1',
        'role': 'row'
      },
      el('td', { 'role': 'cell' }, el('strong', {}, model.name)),
      el('td', { 'role': 'cell' }, model.provider),
      el('td', { 'role': 'cell' }, el('div', { class: 'cell-note' }, model.highlights)),
      el('td', { 'role': 'cell' },
        el('a', {
          href: model.official,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'llm-official-link',
          'data-model-slug': model.slug,
          'data-model-name': model.name,
          'aria-label': `Visit ${model.name} official page`
        }, 'Official page')
      )
    );

    tbody.appendChild(row);
  });

  bindLLMClickTracking();
  bindKeyboardNavigation();
}

function bindLLMClickTracking() {
  $$('.llm-official-link').forEach(link => {
    link.addEventListener('click', () => {
      const modelName = link.getAttribute('data-model-name');
      const modelSlug = link.getAttribute('data-model-slug');
      
      // Track click asynchronously without blocking navigation
      trackLLMClick(modelName, modelSlug);
    });
  });
}

function bindKeyboardNavigation() {
  const tbody = $('#llm-tbody');
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll('tr'));

  tbody.addEventListener('keydown', (e) => {
    const currentRow = e.target.closest('tr');
    if (!currentRow) return;

    const currentIndex = rows.indexOf(currentRow);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < rows.length - 1) {
          rows[currentIndex + 1].focus();
          currentFocusedRow = currentIndex + 1;
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          rows[currentIndex - 1].focus();
          currentFocusedRow = currentIndex - 1;
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        const link = currentRow.querySelector('.llm-official-link');
        if (link) link.click();
        break;

      case 'Home':
        e.preventDefault();
        rows[0].focus();
        currentFocusedRow = 0;
        break;

      case 'End':
        e.preventDefault();
        rows[rows.length - 1].focus();
        currentFocusedRow = rows.length - 1;
        break;
    }
  });
}

function bindLLMSearch() {
  const input = $('#llmSearch');
  if (!input) return;

  let searchTimeout;
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    const tbody = $('#llm-tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      const isVisible = text.includes(query);
      row.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });

    // Update search results count
    let resultsEl = $('#search-results');
    if (query) {
      const resultsText = `${visibleCount} model${visibleCount !== 1 ? 's' : ''} found`;
      if (!resultsEl) {
        resultsEl = el('span', { id: 'search-results', class: 'search-results' }, resultsText);
        input.parentElement.appendChild(resultsEl);
      } else {
        resultsEl.textContent = resultsText;
      }
      
      // Track search after user stops typing (debounced)
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        trackSearch(query, visibleCount);
      }, 1000);
    } else if (resultsEl) {
      resultsEl.remove();
    }
  });
}

// ---------- OLD MODAL CODE REMOVED ----------

// ---------- OTHER RENDERERS ----------

function renderPapersCore() {
  const ul = $('#papers-core-list');
  if (!ul) return;

  DATA.papersCore.forEach(({ t, url, meta }) => {
    const a = el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, t);
    const li = el('li', {}, a, ` ${meta || ''}`);
    ul.appendChild(li);
  });
}

function renderPaperGroups() {
  const root = $('#paper-groups');
  if (!root) return;

  DATA.paperGroups.forEach(group => {
    const card = el('div', { class: 'card' },
      el('h3', {}, group.title),
      el('ul', { class: 'list' })
    );

    group.items.forEach(({ t, url, note }) => {
      const a = el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, t);
      const li = el('li', {}, el('strong', {}, a), ` — ${note}`);
      card.querySelector('ul').appendChild(li);
    });

    root.appendChild(card);
  });
}

function renderTimeline() {
  const ul = $('#timeline-list');
  if (!ul) return;

  DATA.timeline.forEach(({ y, text, url }) => {
    const a = el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, text);
    ul.appendChild(el('li', {}, el('strong', {}, `${y}: `), a));
  });
}

// ---------- INTERACTIVE FEATURES ----------

function bindCollapsibles() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-toggle]');
    if (!btn) return;

    const sel = btn.getAttribute('data-toggle');
    const panel = document.querySelector(sel);
    const wrap = btn.closest('.collapse');
    if (!panel || !wrap) return;

    const open = wrap.getAttribute('data-open') === 'true';
    wrap.setAttribute('data-open', String(!open));
    btn.setAttribute('aria-expanded', String(!open));
  });
}

function bindSmoothScroll() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const id = a.getAttribute('href');
    if (id.length === 1) return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', id);
  });
}

// ---------- INITIALIZATION ----------

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Supabase
  initSupabase();
  
  // Render sections
  renderLLMs();
  renderPapersCore();
  renderPaperGroups();
  renderTimeline();

  // Bind interactive features
  bindLLMSearch();
  bindCollapsibles();
  bindSmoothScroll();

  // Setup tracking
  setupNavigationTracking();
  setupExternalLinkTracking();
  setupCollapsibleTracking();

  // Setup newsletter modal
  setupNewsletterModal();

  // Newsletter buttons (nav + FAB)
  const newsletterBtn = $('#newsletter-btn');
  const fabBtn = $('#fab-newsletter');
  
  if (newsletterBtn) {
    newsletterBtn.addEventListener('click', () => {
      trackClick('button', 'newsletter-btn-nav', { action: 'open-modal' });
      openModal();
    });
  }
  
  if (fabBtn) {
    fabBtn.addEventListener('click', () => {
      trackClick('button', 'newsletter-btn-fab', { action: 'open-modal' });
      openModal();
    });
  }

  console.log('✅ LLM Comparison Platform initialized');
  console.log('📊 Session ID:', SESSION_ID);
  console.log('🔍 Click tracking active');
  console.log('📬 Newsletter modal ready');
});
/* ====== LLM primary table (ranked by contextK desc, then paramsB desc) ====== */

// Filled with sourced specs (see notes below)
const LLMs = [
    {
      emoji: "🛰️", name: "Grok 1.5", provider: "xAI",
      // Grok-1 (open) is a 314B MoE; 1.5 adds 128K context
      paramsB: 314,                   // total MoE params (Grok-1)
      contextK: 128,                  // Grok-1.5 context
      official: "https://x.ai/",
      highlights: "Long-context model; Grok-1 open weights are 314B MoE."
    },
    {
      emoji: "🦙", name: "Llama 3 70B", provider: "Meta",
      paramsB: 70,
      contextK: 8,                    // per Llama 3 model cards
      official: "https://www.llama.com/models/llama-3/",
      highlights: "Open ecosystem; strong community & tooling."
    },
    {
      emoji: "🦙", name: "Llama 3 8B", provider: "Meta",
      paramsB: 8,
      contextK: 8,
      official: "https://www.llama.com/models/llama-3/",
      highlights: "Lightweight option; excellent cost/perf."
    },
    {
      emoji: "🧠", name: "DeepSeek (V3/V2 family)", provider: "DeepSeek",
      // DeepSeek-V2: 236B total MoE / ~21B active; API context 128K
      paramsB: 236,                   // total MoE params (representative)
      contextK: 128,                  // DeepSeek API context
      official: "https://www.deepseek.com/",
      highlights: "MoE efficiency; API lists 128K context."
    }
    // Add more models; ranking auto-updates.
  ];
  
  const fmt = n => (n == null ? "—" : String(n));
  
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
    const tbody = document.getElementById("llm-tbody");
    if(!tbody) return;
    const ranked = rankModels(LLMs);
    tbody.innerHTML = "";
    ranked.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="rank" aria-label="Rank">${m._rank}</span></td>
        <td>
          <div class="model">
            <span class="emoji" aria-hidden="true">${m.emoji || "🤖"}</span>
            <div>
              <strong>${m.name}</strong>
              <div class="cell-note">${m.highlights || ""}</div>
            </div>
          </div>
        </td>
        <td class="hide-sm">${m.provider}</td>
        <td>${fmt(m.paramsB)}</td>
        <td>${fmt(m.contextK)}</td>
        <td><a href="${m.official}" target="_blank" rel="noopener">Official</a></td>
      `;
      tbody.append(tr);
    });
  }
  
  function bindLLMSearch(){
    const input = document.getElementById("llmSearch");
    const tbody = document.getElementById("llm-tbody");
    if(!input || !tbody) return;
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      [...tbody.rows].forEach(r => {
        const txt = r.innerText.toLowerCase();
        r.style.display = txt.includes(q) ? "" : "none";
      });
    });
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    renderLLMTable();
    bindLLMSearch();
  });
  
