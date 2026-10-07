(() => {
  if (window.__sdmLoaded) return;
  window.__sdmLoaded = true;

  const DEFAULT_SETTINGS = {
    enabled: true,
    brightness: 100,
    contrast: 100,
    sepia: 0,
    blurEnabled: true
  };
  const DEFAULT_BLACKLIST = ['youtube.com'];

  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  const OUR_ATTRS = ['data-sdm-bg', 'data-sdm-fg', 'data-sdm-bd', 'data-sdm-sh', 'data-sdm-pb', 'data-sdm-pa'];
  const SHADOW_HOST_ATTR = 'data-sdm-host'; // set by main-world.js when a shadow root is attached
  const SKIP_TAGS = new Set([
    'HTML', 'HEAD', 'BODY', 'TITLE', 'META', 'LINK', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE',
    'IMG', 'VIDEO', 'AUDIO', 'PICTURE', 'SOURCE', 'TRACK', 'CANVAS', 'IFRAME', 'EMBED', 'OBJECT',
    'BR', 'WBR', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION'
  ]);

  // Relative luminance thresholds (WCAG formula)
  const LIGHT_BG_Y = 0.4;
  const LIGHT_BORDER_Y = 0.3;
  const LIGHT_SHADOW_Y = 0.3;
  const DARK_BG_Y = 0.2;
  const MIN_TEXT_CONTRAST = 4.5;
  const BASE_BG_Y = 0.0066; // #121316, forced on html/body by dark-theme.css

  const OBSERVER_OPTIONS = { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-sdm-host'] };

  // Per-site fixes, only injected on the matching host
  const SITE_FIXES = [
    {
      hosts: ['docs.google.com'],
      css: `
        :root:not([data-sdm-off]) :is(.grid-container, .waffle-canvas-container, #grid-table-container, .docs-editor-container) canvas {
          filter: invert(90%) hue-rotate(180deg) !important;
        }
        :root:not([data-sdm-off]) :is(.formula-bar-separator, .grid-bottom-bar, .docs-sheet-tab-slider, .docs-material-gm-dialog, #formula-bar, .t-cell-editor-container) {
          background-color: #1a1c20 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        :root:not([data-sdm-off]) .docs-sheet-tab {
          background-color: #21242b !important;
          color: #e5e7eb !important;
        }
      `
    }
  ];

  const root = document.documentElement;
  const currentHostname = resolveTopHostname();
  const siteFixCss = SITE_FIXES
    .filter(fix => fix.hosts.some(h => currentHostname === h || currentHostname.endsWith('.' + h)))
    .map(fix => fix.css)
    .join('\n');

  // Frames follow the decision made for the top-level site
  function resolveTopHostname() {
    try {
      if (window.top === window) return location.hostname;
      const ancestors = location.ancestorOrigins;
      if (ancestors && ancestors.length) return new URL(ancestors[ancestors.length - 1]).hostname;
    } catch (e) {}
    return location.hostname;
  }

  // ---------------------------------------------------------------------------
  // Color math
  // ---------------------------------------------------------------------------

  const colorCache = new Map();
  let probeCtx = null;

  function parseColor(str) {
    if (!str || str === 'transparent' || str === 'none') return null;
    let color = colorCache.get(str);
    if (color !== undefined) return color;

    const m = str.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/);
    if (m) {
      let a = m[4] !== undefined ? parseFloat(m[4]) : 1;
      if (m[5]) a /= 100;
      color = { r: Math.round(+m[1]), g: Math.round(+m[2]), b: Math.round(+m[3]), a };
    } else {
      // oklch(), lab(), color(srgb ...) etc. — let the browser convert to sRGB
      color = probeColor(str);
    }
    if (color && color.a === 0) color = null;

    if (colorCache.size > 4000) colorCache.clear();
    colorCache.set(str, color);
    return color;
  }

  function probeColor(str) {
    try {
      if (!probeCtx) {
        probeCtx = new OffscreenCanvas(1, 1).getContext('2d', { willReadFrequently: true });
      }
      const sentinel = '#010203';
      probeCtx.fillStyle = sentinel;
      probeCtx.fillStyle = str;
      if (probeCtx.fillStyle === sentinel) return null;
      probeCtx.clearRect(0, 0, 1, 1);
      probeCtx.fillRect(0, 0, 1, 1);
      const d = probeCtx.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    } catch (e) {
      return null;
    }
  }

  function channel(v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  function luminance(c) {
    return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
  }

  function contrastRatio(y1, y2) {
    return y1 > y2 ? (y1 + 0.05) / (y2 + 0.05) : (y2 + 0.05) / (y1 + 0.05);
  }

  function rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }

  function hslToRgb(h, s, l, a) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const f = n => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255), a };
  }

  function toCss(c) {
    return c.a < 1
      ? `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.round(c.a * 1000) / 1000})`
      : `rgb(${c.r}, ${c.g}, ${c.b})`;
  }

  // Invert lightness while keeping the hue, so semantic colors (alerts, errors, brand) survive.
  function darkBackground(c) {
    const [h, s, l] = rgbToHsl(c);
    return hslToRgb(Math.round(h), Math.round(Math.min(s, 55)), Math.round(8 + (100 - l) * 0.35), c.a);
  }

  function lightText(c) {
    const [h, s, l] = rgbToHsl(c);
    return hslToRgb(Math.round(h), Math.round(Math.min(s, 80)), Math.round(Math.max(70, 92 - l * 0.35)), c.a);
  }

  function darkBorder(c) {
    const [h, s, l] = rgbToHsl(c);
    return hslToRgb(Math.round(h), Math.round(Math.min(s, 40)), Math.round(18 + (100 - l) * 0.5), c.a);
  }

  const GRADIENT_TOKEN = /url\((?:[^()"']|"[^"]*"|'[^']*')*\)|(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;

  // Rewrites every light color stop of a gradient, keeping alpha (fades to transparent keep working).
  // Returns null when nothing changed; y is set only when the whole layer is opaque.
  function rewriteGradient(image) {
    if (!image.includes('gradient(')) return null;
    let changed = false;
    let opaque = !image.includes('url(');
    let ySum = 0;
    let yCount = 0;
    const css = image.replace(GRADIENT_TOKEN, (token) => {
      if (token.startsWith('url(')) return token;
      const c = parseColor(token);
      if (!c) { opaque = false; return token; }
      if (c.a < 0.5) opaque = false;
      let out = c;
      if (luminance(c) > LIGHT_BG_Y) {
        out = darkBackground(c);
        changed = true;
      }
      ySum += luminance(out);
      yCount++;
      return out === c ? token : toCss(out);
    });
    if (!changed) return null;
    return { css, y: opaque && yCount ? ySum / yCount : undefined };
  }

  const SHADOW_COLOR_TOKEN = /(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;

  // Light shadows read as a glow on a dark page: turn them into dark shadows, same geometry
  function rewriteShadow(value) {
    if (!value || value === 'none') return null;
    let changed = false;
    const css = value.replace(SHADOW_COLOR_TOKEN, (token) => {
      const c = parseColor(token);
      if (!c || luminance(c) <= LIGHT_SHADOW_Y) return token;
      changed = true;
      return `rgba(0, 0, 0, ${Math.round(Math.min(1, c.a * 0.8) * 1000) / 1000})`;
    });
    return changed ? css : null;
  }

  // ---------------------------------------------------------------------------
  // Generated rules: one attribute value per resulting color
  // ---------------------------------------------------------------------------

  const varsStyle = document.createElement('style');
  varsStyle.id = 'sdm-vars';
  const colorStyle = document.createElement('style');
  colorStyle.id = 'sdm-colors';
  const shadowSheet = new CSSStyleSheet();

  // While an element is analyzed its transitions are off: otherwise getComputedStyle returns
  // mid-animation colors (e.g. Tailwind's transition-all) and the result lands as a fade
  const NO_TRANSITION_ATTR = 'data-sdm-nt';
  const NO_TRANSITION_RULE = '[data-sdm-nt], [data-sdm-nt]::before, [data-sdm-nt]::after { transition: none !important; }';
  shadowSheet.replaceSync(NO_TRANSITION_RULE);

  const ruleIds = new Map();
  const pendingRules = [];
  let ruleCount = 0;
  let rulesText = NO_TRANSITION_RULE + '\n';

  function ensureStyles() {
    const parent = document.head || root;
    if (!parent) return;
    if (!varsStyle.isConnected) parent.appendChild(varsStyle);
    if (!colorStyle.isConnected) {
      // Rules added via insertRule are lost when the element is detached; rebuild from text
      colorStyle.textContent = rulesText;
      parent.appendChild(colorStyle);
    }
  }

  const PSEUDO_SUFFIX = { pb: '::before', pa: '::after' };

  function ruleId(kind, decl) {
    const key = kind + '|' + decl;
    let id = ruleIds.get(key);
    if (!id) {
      id = String(++ruleCount);
      ruleIds.set(key, id);
      // :is() with an impossible id selector raises specificity so page !important rules rarely win
      pendingRules.push(`:is([data-sdm-${kind}="${id}"], #sdm-none#sdm-none)${PSEUDO_SUFFIX[kind] || ''} { ${decl} }`);
    }
    return id;
  }

  function flushRules() {
    if (!pendingRules.length) return;
    const sheet = colorStyle.sheet;
    for (const rule of pendingRules) {
      const gated = ':root:not([data-sdm-off]) ' + rule;
      rulesText += gated + '\n';
      try { if (sheet) sheet.insertRule(gated, sheet.cssRules.length); } catch (e) {}
      try { shadowSheet.insertRule(rule, shadowSheet.cssRules.length); } catch (e) {}
    }
    pendingRules.length = 0;
  }

  // ---------------------------------------------------------------------------
  // Element analysis (read phase) and commit (write phase)
  // ---------------------------------------------------------------------------

  let seen = new WeakSet();
  let bgYMap = new WeakMap(); // element -> luminance of the background it ends up painted on

  function parentOf(el) {
    if (el.parentElement) return el.parentElement;
    const parent = el.parentNode;
    return parent && parent.host ? parent.host : null;
  }

  // Thin boxes (1px dividers drawn with background-color) need border-like contrast,
  // otherwise they vanish against the dark page
  function isThin(cs) {
    return parseFloat(cs.height) <= 3 || parseFloat(cs.width) <= 3;
  }

  // Background declarations for an element or pseudo-element; y is the luminance it ends up
  // painted with (undefined when not opaque, so descendants inherit from ancestors)
  function backgroundInfo(cs) {
    let decl = '';
    let gradientY;
    let colorY;

    const image = cs.backgroundImage;
    if (image && image !== 'none') {
      const gradient = rewriteGradient(image);
      if (gradient) {
        decl += `background-image: ${gradient.css} !important; `;
        gradientY = gradient.y;
      }
    }

    const bg = parseColor(cs.backgroundColor);
    if (bg) {
      let painted = bg;
      if (bg.a >= 0.15 && luminance(bg) > LIGHT_BG_Y) {
        painted = isThin(cs) ? darkBorder(bg) : darkBackground(bg);
        decl += `background-color: ${toCss(painted)} !important; `;
      }
      if (bg.a >= 0.5) colorY = luminance(painted);
    }

    return { decl, y: gradientY !== undefined ? gradientY : colorY };
  }

  function borderDecl(cs) {
    let decl = '';
    for (const side of ['top', 'right', 'bottom', 'left']) {
      if (cs.getPropertyValue(`border-${side}-width`) === '0px') continue;
      const bc = parseColor(cs.getPropertyValue(`border-${side}-color`));
      if (bc && luminance(bc) > LIGHT_BORDER_Y) {
        decl += `border-${side}-color: ${toCss(darkBorder(bc))} !important; `;
      }
    }
    return decl;
  }

  function shadowDecl(cs) {
    let decl = '';
    const box = rewriteShadow(cs.boxShadow);
    if (box) decl += `box-shadow: ${box} !important; `;
    const text = rewriteShadow(cs.textShadow);
    if (text) decl += `text-shadow: ${text} !important; `;
    return decl;
  }

  function textDecl(cs, bgY) {
    const fg = parseColor(cs.color);
    if (fg && bgY < DARK_BG_Y && contrastRatio(luminance(fg), bgY) < MIN_TEXT_CONTRAST) {
      return `color: ${toCss(lightText(fg))} !important; `;
    }
    return '';
  }

  // ::before / ::after: dividers, fade overlays, icon fonts
  function pseudoDecl(el, which, bgY) {
    const pcs = getComputedStyle(el, which);
    const content = pcs.content;
    if (!content || content === 'none' || content === 'normal') return '';
    const own = backgroundInfo(pcs);
    return own.decl + borderDecl(pcs) + shadowDecl(pcs) + textDecl(pcs, own.y !== undefined ? own.y : bgY);
  }

  function inheritedBackgroundY(el) {
    const chain = [];
    let y = BASE_BG_Y;
    for (let p = parentOf(el); p && p !== root && p !== document.body; p = parentOf(p)) {
      const known = bgYMap.get(p);
      if (known !== undefined) { y = known; break; }
      const own = backgroundInfo(getComputedStyle(p)).y;
      chain.push(p);
      if (own !== undefined) { y = own; break; }
    }
    for (const p of chain) bgYMap.set(p, y);
    return y;
  }

  function analyze(el) {
    const cs = getComputedStyle(el);
    const bg = backgroundInfo(cs);
    const bgY = bg.y !== undefined ? bg.y : inheritedBackgroundY(el);
    bgYMap.set(el, bgY);

    return {
      el,
      bg: bg.decl,
      fg: textDecl(cs, bgY),
      border: borderDecl(cs),
      shadow: shadowDecl(cs),
      before: pseudoDecl(el, '::before', bgY),
      after: pseudoDecl(el, '::after', bgY)
    };
  }

  function clearAttrs(el) {
    for (const attr of OUR_ATTRS) el.removeAttribute(attr);
  }

  function commit(r) {
    const el = r.el;
    if (r.bg) el.setAttribute('data-sdm-bg', ruleId('bg', r.bg));
    if (r.fg) el.setAttribute('data-sdm-fg', ruleId('fg', r.fg));
    if (r.border) el.setAttribute('data-sdm-bd', ruleId('bd', r.border));
    if (r.shadow) el.setAttribute('data-sdm-sh', ruleId('sh', r.shadow));
    if (r.before) el.setAttribute('data-sdm-pb', ruleId('pb', r.before));
    if (r.after) el.setAttribute('data-sdm-pa', ruleId('pa', r.after));
  }

  function shouldScan(el) {
    return el.namespaceURI === HTML_NS && !SKIP_TAGS.has(el.tagName);
  }

  // ---------------------------------------------------------------------------
  // Shadow DOM
  // ---------------------------------------------------------------------------

  let shadowRoots = new WeakSet();

  function getShadowRoot(el, anyTag) {
    if (el.shadowRoot) return el.shadowRoot;
    if ((anyTag || el.tagName.includes('-')) && typeof chrome !== 'undefined' && chrome.dom && chrome.dom.openOrClosedShadowRoot) {
      try { return chrome.dom.openOrClosedShadowRoot(el); } catch (e) {}
    }
    return null;
  }

  function attachShadowRoot(sr) {
    if (shadowRoots.has(sr)) return;
    shadowRoots.add(sr);
    try {
      if (!sr.adoptedStyleSheets.includes(shadowSheet)) {
        sr.adoptedStyleSheets = [...sr.adoptedStyleSheets, shadowSheet];
      }
    } catch (e) {}
    if (observer) observer.observe(sr, OBSERVER_OPTIONS);
    enqueueTree(sr);
  }

  // ---------------------------------------------------------------------------
  // Scheduler: work runs in requestAnimationFrame, before paint, in time-boxed chunks
  // ---------------------------------------------------------------------------

  const CHUNK_SIZE = 64;
  let queue = [];
  let queueIndex = 0;
  let dirty = new Set();
  let frameScheduled = false;
  let initialPassPending = false;

  function enqueueTree(node) {
    if (node.nodeType === 1) queue.push(node);
    if (node.querySelectorAll) {
      const all = node.querySelectorAll('*');
      for (let i = 0; i < all.length; i++) queue.push(all[i]);
    }
    schedule();
  }

  let frameHandle = 0;
  let fallbackTimer = null;

  // rAF runs right before paint; the timer keeps the queue moving where rAF is
  // throttled (background tabs, hidden frames)
  function schedule() {
    if (frameScheduled || !active) return;
    frameScheduled = true;
    frameHandle = requestAnimationFrame(runFrame);
    fallbackTimer = setTimeout(runFrame, 100);
  }

  function hasWork() {
    return dirty.size > 0 || queueIndex < queue.length;
  }

  function runFrame() {
    cancelAnimationFrame(frameHandle);
    clearTimeout(fallbackTimer);
    frameScheduled = false;
    if (!active) return;
    ensureStyles();

    const deadline = performance.now() + (initialPassPending ? 14 : 6);
    do {
      processChunk();
    } while (hasWork() && performance.now() < deadline);
    flushRules();

    if (hasWork()) {
      if (queueIndex > 5000) {
        queue = queue.slice(queueIndex);
        queueIndex = 0;
      }
      schedule();
    } else {
      queue = [];
      queueIndex = 0;
      if (initialPassPending) {
        initialPassPending = false;
        releaseBlur();
      }
    }
  }

  function processChunk() {
    const batch = [];

    for (const el of dirty) {
      dirty.delete(el);
      if (el.isConnected && shouldScan(el)) batch.push(el);
      if (batch.length >= CHUNK_SIZE) break;
    }

    while (batch.length < CHUNK_SIZE && queueIndex < queue.length) {
      const el = queue[queueIndex++];
      if (seen.has(el) || !el.isConnected) continue;
      seen.add(el);
      const sr = getShadowRoot(el);
      if (sr) attachShadowRoot(sr);
      if (shouldScan(el)) batch.push(el);
    }

    if (!batch.length) return;

    // Writes, then reads, then writes: one style recalculation for the reads and one to
    // settle the new colors before transitions are restored
    for (const el of batch) {
      el.setAttribute(NO_TRANSITION_ATTR, '');
      clearAttrs(el);
      bgYMap.delete(el);
    }
    const results = batch.map(analyze);
    results.forEach(commit);
    flushRules();
    getComputedStyle(batch[0]).color;
    for (const el of batch) el.removeAttribute(NO_TRANSITION_ATTR);
  }

  // ---------------------------------------------------------------------------
  // Mutation tracking
  // ---------------------------------------------------------------------------

  let observer = null;

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'childList') {
          for (const node of record.addedNodes) {
            if (node.nodeType === 1) enqueueTree(node);
          }
        } else if (record.attributeName === SHADOW_HOST_ATTR) {
          // Shadow root attached after the host was scanned (e.g. custom element upgraded late)
          const sr = getShadowRoot(record.target, true);
          if (sr) attachShadowRoot(sr);
        } else if (seen.has(record.target)) {
          dirty.add(record.target);
        }
      }
      if (!colorStyle.isConnected || !varsStyle.isConnected) ensureStyles();
      schedule();
    });
    observer.observe(root, OBSERVER_OPTIONS);
  }

  function stopObserver() {
    if (observer) observer.disconnect();
    observer = null;
  }

  // Stylesheets that finish loading after the first pass change the colors already analyzed
  let recheckTimer = null;
  function requestFullRecheck() {
    if (!active || !scanStarted) return;
    clearTimeout(recheckTimer);
    recheckTimer = setTimeout(() => {
      if (!active) return;
      const all = root.querySelectorAll('*');
      for (let i = 0; i < all.length; i++) {
        if (seen.has(all[i])) dirty.add(all[i]);
      }
      schedule();
    }, 100);
  }

  document.addEventListener('load', (e) => {
    const t = e.target;
    if (t && t.tagName === 'LINK' && /stylesheet/i.test(t.rel)) requestFullRecheck();
  }, true);

  // ---------------------------------------------------------------------------
  // Blur transition
  // ---------------------------------------------------------------------------

  let blurTimer = null;

  function startBlur() {
    root.setAttribute('data-sdm-blur', 'on');
    clearTimeout(blurTimer);
    blurTimer = setTimeout(releaseBlur, 1500);
  }

  function releaseBlur() {
    clearTimeout(blurTimer);
    if (root.getAttribute('data-sdm-blur') !== 'on') return;
    root.setAttribute('data-sdm-blur', 'off');
    blurTimer = setTimeout(() => root.removeAttribute('data-sdm-blur'), 350);
  }

  function stopBlur() {
    clearTimeout(blurTimer);
    root.removeAttribute('data-sdm-blur');
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  let settings = null;
  let active = false;
  let nativeDark = false;
  let domReady = false;
  let scanStarted = false;
  let cssRequested = false;

  // Sites that are already dark are left untouched
  function detectNativeDark() {
    if (nativeDark) return true;
    if (!document.body) return false;
    const hadOff = root.hasAttribute('data-sdm-off');
    root.setAttribute('data-sdm-off', '');
    const bodyBg = parseColor(getComputedStyle(document.body).backgroundColor);
    const htmlBg = parseColor(getComputedStyle(root).backgroundColor);
    if (!hadOff) root.removeAttribute('data-sdm-off');

    const bg = bodyBg && bodyBg.a >= 0.5 ? bodyBg : (htmlBg && htmlBg.a >= 0.5 ? htmlBg : null);
    if (!bg || luminance(bg) >= 0.1) return false;

    nativeDark = true;
    root.setAttribute('data-sdm-native', '');
    if (active) deactivate();
    return true;
  }

  function ensureCss() {
    if (cssRequested) return;
    if (getComputedStyle(root).getPropertyValue('--sdm-on').trim() === '1') return;
    cssRequested = true;
    try {
      chrome.runtime.sendMessage({ type: 'SDM_INSERT_CSS' }).catch(() => {});
    } catch (e) {}
  }

  function updateVars() {
    const brightness = Number(settings.brightness);
    const contrast = Number(settings.contrast);
    const sepia = Number(settings.sepia);
    const text = `:root { --sdm-brightness: ${brightness}%; --sdm-contrast: ${contrast}%; --sdm-sepia: ${sepia}%; }\n${siteFixCss}`;
    if (varsStyle.textContent !== text) varsStyle.textContent = text;

    const neutral = brightness === 100 && contrast === 100 && sepia === 0;
    if (neutral) root.removeAttribute('data-sdm-filter');
    else if (!root.hasAttribute('data-sdm-filter')) root.setAttribute('data-sdm-filter', '');
  }

  function startAdapting() {
    if (!active || scanStarted) return;
    scanStarted = true;
    startObserver();
    initialPassPending = true;
    enqueueTree(root);
  }

  function activate() {
    active = true;
    root.removeAttribute('data-sdm-off');
    if (domReady && detectNativeDark()) return;

    ensureStyles();
    ensureCss();
    shadowSheet.disabled = false;
    if (settings.blurEnabled) startBlur();
    if (domReady) startAdapting();
  }

  function deactivate() {
    active = false;
    root.setAttribute('data-sdm-off', '');
    shadowSheet.disabled = true;
    stopBlur();
    stopObserver();
    clearTimeout(recheckTimer);
    // Next activation re-analyzes everything (stale attributes are cleared per element)
    scanStarted = false;
    initialPassPending = false;
    seen = new WeakSet();
    bgYMap = new WeakMap();
    shadowRoots = new WeakSet();
    queue = [];
    queueIndex = 0;
    dirty = new Set();
  }

  function applySettings(next) {
    settings = next;
    ensureStyles();
    updateVars();
    if (!next.blurEnabled) stopBlur();

    const shouldBeActive = next.enabled && !nativeDark;
    if (shouldBeActive && !active) activate();
    else if (!shouldBeActive && active) deactivate();
    else if (!shouldBeActive) root.setAttribute('data-sdm-off', '');
  }

  function onDomReady() {
    domReady = true;
    if (!settings || !active) return;
    if (detectNativeDark()) return;
    startAdapting();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomReady, { once: true });
  } else {
    onDomReady();
  }

  // Late stylesheets can reveal that the page ships its own dark theme
  window.addEventListener('load', () => {
    if (settings && settings.enabled && active) detectNativeDark();
  }, { once: true });

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  function isDomainBlacklisted(host, blacklist) {
    if (!host || !Array.isArray(blacklist)) return false;
    return blacklist.some(item => host === item || host.endsWith('.' + item));
  }

  function resolveSettingsForHost(storageData) {
    if (!storageData) return { ...DEFAULT_SETTINGS };

    const blacklist = storageData.blacklist || DEFAULT_BLACKLIST;
    if (isDomainBlacklisted(currentHostname, blacklist)) {
      return { ...DEFAULT_SETTINGS, enabled: false };
    }

    const overrides = (storageData.siteOverrides && storageData.siteOverrides[currentHostname]) || {};
    const pick = key => overrides[key] !== undefined
      ? overrides[key]
      : (storageData[key] !== undefined ? storageData[key] : DEFAULT_SETTINGS[key]);
    return {
      enabled: pick('enabled'),
      contrast: pick('contrast'),
      brightness: pick('brightness'),
      sepia: pick('sepia'),
      blurEnabled: pick('blurEnabled')
    };
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['sdm_settings'], (result) => {
      applySettings(resolveSettingsForHost(result && result.sdm_settings));
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.sdm_settings) {
        applySettings(resolveSettingsForHost(changes.sdm_settings.newValue));
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SDM_UPDATE_SETTINGS') {
        applySettings({ ...DEFAULT_SETTINGS, ...settings, ...message.settings });
        sendResponse({ success: true });
      } else if (message.type === 'SDM_GET_STATUS') {
        sendResponse({ settings, nativeDark });
      }
    });
  } else {
    applySettings({ ...DEFAULT_SETTINGS });
  }
})();
