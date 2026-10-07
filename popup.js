const DEFAULT_GLOBAL_SETTINGS = {
  enabled: true,
  contrast: 100,
  brightness: 100,
  sepia: 0,
  blurEnabled: true,
  blacklist: ['youtube.com'], // Sites where dark mode is excluded
  siteOverrides: {} // e.g. { "olhardigital.com.br": { enabled: true, ... } }
};

let currentHostname = '';
let globalSettings = { ...DEFAULT_GLOBAL_SETTINGS };

const toggleEnabled = document.getElementById('toggle-enabled');
const toggleBlur = document.getElementById('toggle-blur');
const sliderContrast = document.getElementById('slider-contrast');
const sliderBrightness = document.getElementById('slider-brightness');
const sliderSepia = document.getElementById('slider-sepia');

const valContrast = document.getElementById('val-contrast');
const valBrightness = document.getElementById('val-brightness');
const valSepia = document.getElementById('val-sepia');
const btnReset = document.getElementById('btn-reset');

const manualControlsSummary = document.getElementById('manual-controls-summary');

const siteHostnameEl = document.getElementById('site-hostname');
const btnToggleSite = document.getElementById('btn-toggle-site');

const inputBlockedSite = document.getElementById('input-new-blocked-site');
const btnAddBlockedSite = document.getElementById('btn-add-blocked-site');
const blacklistContainer = document.getElementById('blacklist-container');
const blacklistCount = document.getElementById('blacklist-count');
const inputSearchBlocked = document.getElementById('input-search-blocked');
const btnClearSearch = document.getElementById('btn-clear-search');

function isDomainBlacklisted(host) {
  if (!host || !globalSettings.blacklist) return false;
  return globalSettings.blacklist.some(item => {
    return host === item || host.endsWith('.' + item);
  });
}

function getEffectiveSettingsForHost(host) {
  const isBlacklisted = isDomainBlacklisted(host);
  if (isBlacklisted) {
    return {
      enabled: false,
      contrast: globalSettings.contrast,
      brightness: globalSettings.brightness,
      sepia: globalSettings.sepia,
      blurEnabled: globalSettings.blurEnabled !== undefined ? globalSettings.blurEnabled : true,
      isBlacklisted: true
    };
  }

  const override = (globalSettings.siteOverrides && globalSettings.siteOverrides[host]) || {};
  return {
    enabled: override.enabled !== undefined ? override.enabled : globalSettings.enabled,
    contrast: override.contrast !== undefined ? override.contrast : globalSettings.contrast,
    brightness: override.brightness !== undefined ? override.brightness : globalSettings.brightness,
    sepia: override.sepia !== undefined ? override.sepia : globalSettings.sepia,
    blurEnabled: override.blurEnabled !== undefined ? override.blurEnabled : (globalSettings.blurEnabled !== undefined ? globalSettings.blurEnabled : true),
    isBlacklisted: false
  };
}

function appendHighlighted(parent, text, term) {
  const index = term ? text.toLowerCase().indexOf(term) : -1;
  if (index === -1) {
    parent.textContent = text;
    return;
  }
  const mark = document.createElement('mark');
  mark.textContent = text.slice(index, index + term.length);
  parent.append(text.slice(0, index), mark, text.slice(index + term.length));
}

function renderBlacklist() {
  blacklistContainer.innerHTML = '';
  const list = globalSettings.blacklist || [];
  const term = inputSearchBlocked.value.trim().toLowerCase();
  const filtered = term ? list.filter(site => site.toLowerCase().includes(term)) : list;

  blacklistCount.textContent = term
    ? `${filtered.length} de ${list.length}`
    : `${list.length} ${list.length === 1 ? 'site' : 'sites'}`;
  btnClearSearch.hidden = !term;

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-blacklist';
    empty.textContent = term ? `Nenhum site encontrado para "${term}"` : 'Nenhum site na lista de ignorados';
    blacklistContainer.appendChild(empty);
    return;
  }

  filtered.forEach(site => {
    const item = document.createElement('div');
    item.className = 'blacklist-item';

    const span = document.createElement('span');
    appendHighlighted(span, site, term);
    span.title = site;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-remove-site';
    delBtn.innerHTML = '✖';
    delBtn.title = 'Remover da lista';
    delBtn.addEventListener('click', () => {
      removeSiteFromBlacklist(site);
    });

    item.appendChild(span);
    item.appendChild(delBtn);
    blacklistContainer.appendChild(item);
  });
}

function updateUI(settings) {
  toggleEnabled.checked = settings.enabled;
  if (toggleBlur) toggleBlur.checked = settings.blurEnabled !== undefined ? settings.blurEnabled : true;
  sliderContrast.value = settings.contrast;
  sliderBrightness.value = settings.brightness;
  sliderSepia.value = settings.sepia;

  valContrast.textContent = `${settings.contrast}%`;
  valBrightness.textContent = `${settings.brightness}%`;
  valSepia.textContent = `${settings.sepia}%`;
  const changed = [
    Number(settings.contrast) !== 100 && `Contraste ${settings.contrast}%`,
    Number(settings.brightness) !== 100 && `Brilho ${settings.brightness}%`,
    Number(settings.sepia) !== 0 && `Sépia ${settings.sepia}%`
  ].filter(Boolean);
  manualControlsSummary.textContent = changed.length ? changed.join(' · ') : 'Padrão';
  manualControlsSummary.title = manualControlsSummary.textContent;

  if (currentHostname) {
    siteHostnameEl.textContent = currentHostname;
    const isBlacklisted = isDomainBlacklisted(currentHostname);

    const btnText = document.getElementById('btn-toggle-site-text');
    const btnIcon = document.getElementById('btn-toggle-site-icon');

    if (isBlacklisted) {
      if (btnText) btnText.textContent = 'Remover da lista de ignorados (Reativar)';
      if (btnIcon) btnIcon.textContent = '✅';
      btnToggleSite.style.backgroundColor = '#166534';
      btnToggleSite.style.borderColor = '#22c55e';
      btnToggleSite.style.color = '#f0fdf4';
    } else {
      if (btnText) btnText.textContent = 'Não aplicar neste site (Ignorar)';
      if (btnIcon) btnIcon.textContent = '🚫';
      btnToggleSite.style.backgroundColor = '#7f1d1d';
      btnToggleSite.style.borderColor = '#ef4444';
      btnToggleSite.style.color = '#fef2f2';
    }
  }

  renderBlacklist();
}

let debounceTimeout = null;

function saveAndBroadcast(settings) {
  if (currentHostname) {
    if (!globalSettings.siteOverrides) globalSettings.siteOverrides = {};
    // Only set override if not blacklisted
    if (!isDomainBlacklisted(currentHostname)) {
      globalSettings.siteOverrides[currentHostname] = { ...settings };
    }
  }

  // Real-time broadcast to active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'SDM_UPDATE_SETTINGS',
        settings
      }).catch(() => {});
    }
  });

  // Debounced save to storage
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    try {
      chrome.storage.local.set({ sdm_settings: globalSettings }, () => {
        if (chrome.runtime.lastError) {}
      });
    } catch (e) {}
  }, 300);
}

function handleInputChange() {
  const isBlacklisted = isDomainBlacklisted(currentHostname);
  if (isBlacklisted) {
    // If user explicitly flips the switch while blacklisted, remove from blacklist
    removeSiteFromBlacklist(currentHostname);
    return;
  }

  const effective = {
    enabled: toggleEnabled.checked,
    blurEnabled: toggleBlur ? toggleBlur.checked : true,
    contrast: parseInt(sliderContrast.value, 10),
    brightness: parseInt(sliderBrightness.value, 10),
    sepia: parseInt(sliderSepia.value, 10)
  };
  updateUI(effective);
  saveAndBroadcast(effective);
}

function addSiteToBlacklist(rawDomain) {
  if (!rawDomain) return;
  let cleanDomain = rawDomain.trim().toLowerCase();
  cleanDomain = cleanDomain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0].split(':')[0];

  if (!cleanDomain) return;
  if (!globalSettings.blacklist) globalSettings.blacklist = [];

  if (!globalSettings.blacklist.includes(cleanDomain)) {
    globalSettings.blacklist.push(cleanDomain);
  }

  const effective = getEffectiveSettingsForHost(currentHostname);
  updateUI(effective);
  saveAndBroadcast(effective);
}

function removeSiteFromBlacklist(domain) {
  if (!globalSettings.blacklist) return;
  globalSettings.blacklist = globalSettings.blacklist.filter(item => item !== domain);

  const effective = getEffectiveSettingsForHost(currentHostname);
  updateUI(effective);
  saveAndBroadcast(effective);
}

toggleEnabled.addEventListener('change', handleInputChange);
if (toggleBlur) toggleBlur.addEventListener('change', handleInputChange);
sliderContrast.addEventListener('input', handleInputChange);
sliderBrightness.addEventListener('input', handleInputChange);
sliderSepia.addEventListener('input', handleInputChange);

btnToggleSite.addEventListener('click', () => {
  if (isDomainBlacklisted(currentHostname)) {
    removeSiteFromBlacklist(currentHostname);
  } else {
    addSiteToBlacklist(currentHostname);
  }
});

btnAddBlockedSite.addEventListener('click', () => {
  addSiteToBlacklist(inputBlockedSite.value);
  inputBlockedSite.value = '';
});

inputBlockedSite.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addSiteToBlacklist(inputBlockedSite.value);
    inputBlockedSite.value = '';
  }
});

// Accordions remember whether they were left open
document.querySelectorAll('details[data-store-key]').forEach(section => {
  const key = section.dataset.storeKey;
  try {
    section.open = localStorage.getItem(key) === '1';
  } catch (e) {}
  section.addEventListener('toggle', () => {
    try {
      localStorage.setItem(key, section.open ? '1' : '0');
    } catch (e) {}
  });
});

inputSearchBlocked.addEventListener('input', renderBlacklist);

inputSearchBlocked.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && inputSearchBlocked.value) {
    e.preventDefault();
    inputSearchBlocked.value = '';
    renderBlacklist();
  }
});

btnClearSearch.addEventListener('click', () => {
  inputSearchBlocked.value = '';
  renderBlacklist();
  inputSearchBlocked.focus();
});

btnReset.addEventListener('click', () => {
  if (currentHostname && globalSettings.siteOverrides && globalSettings.siteOverrides[currentHostname]) {
    delete globalSettings.siteOverrides[currentHostname];
  }
  const defaultEffective = {
    enabled: globalSettings.enabled,
    contrast: globalSettings.contrast,
    brightness: globalSettings.brightness,
    sepia: globalSettings.sepia,
    blurEnabled: globalSettings.blurEnabled !== undefined ? globalSettings.blurEnabled : true
  };
  updateUI(defaultEffective);
  saveAndBroadcast(defaultEffective);
});

// Detect current tab domain & load settings
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs && tabs[0] && tabs[0].url) {
    try {
      const url = new URL(tabs[0].url);
      currentHostname = url.hostname;
    } catch (e) {
      currentHostname = '';
    }
  }

  chrome.storage.local.get(['sdm_settings'], (result) => {
    if (result && result.sdm_settings) {
      globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...result.sdm_settings };
      if (!globalSettings.blacklist) {
        globalSettings.blacklist = [...DEFAULT_GLOBAL_SETTINGS.blacklist];
      }
    }
    const effective = getEffectiveSettingsForHost(currentHostname);
    updateUI(effective);
  });
});
