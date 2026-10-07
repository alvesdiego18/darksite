// Registers dark-theme.css as a document_start content script only on the sites where
// dark mode is enabled, so the dark base is painted before any page content.
const CSS_SCRIPT_ID = 'sdm-base-css';
const DEFAULT_BLACKLIST = ['youtube.com'];
const VALID_HOST = /^[a-z0-9.-]+$/i;
const IPV4 = /^\d+(\.\d+){3}$/;

function hostPatterns(host, includeSubdomains) {
  if (!host || !VALID_HOST.test(host)) return [];
  return [includeSubdomains && !IPV4.test(host) ? `*://*.${host}/*` : `*://${host}/*`];
}

function isBlacklisted(host, blacklist) {
  return blacklist.some(item => host === item || host.endsWith('.' + item));
}

async function syncRegistration() {
  const { sdm_settings: settings = {} } = await chrome.storage.local.get('sdm_settings');
  const blacklist = settings.blacklist || DEFAULT_BLACKLIST;
  const overrides = settings.siteOverrides || {};
  const globallyEnabled = settings.enabled !== undefined ? settings.enabled : true;

  let matches;
  let excludeMatches;
  if (globallyEnabled) {
    matches = ['<all_urls>'];
    excludeMatches = [
      ...blacklist.flatMap(d => hostPatterns(d, true)),
      ...Object.keys(overrides)
        .filter(h => overrides[h] && overrides[h].enabled === false)
        .flatMap(h => hostPatterns(h, false))
    ];
  } else {
    matches = Object.keys(overrides)
      .filter(h => overrides[h] && overrides[h].enabled === true && !isBlacklisted(h, blacklist))
      .flatMap(h => hostPatterns(h, false));
    excludeMatches = [];
  }

  try {
    await chrome.scripting.unregisterContentScripts({ ids: [CSS_SCRIPT_ID] });
  } catch (e) {}

  if (matches.length === 0) return;

  const script = {
    id: CSS_SCRIPT_ID,
    css: ['dark-theme.css'],
    matches,
    runAt: 'document_start',
    allFrames: true,
    matchOriginAsFallback: true,
    persistAcrossSessions: true
  };
  if (excludeMatches.length) script.excludeMatches = excludeMatches;
  await chrome.scripting.registerContentScripts([script]);
}

let syncChain = Promise.resolve();
function queueSync() {
  syncChain = syncChain.then(syncRegistration).catch(err => console.warn('[SDM] registration failed', err));
}

chrome.runtime.onInstalled.addListener(queueSync);
chrome.runtime.onStartup.addListener(queueSync);
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.sdm_settings) queueSync();
});

// Fallback for pages loaded before the registration covered them (tabs open at install,
// or a site enabled live from the popup).
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'SDM_INSERT_CSS' || !sender.tab) return;
  chrome.scripting.insertCSS({
    target: { tabId: sender.tab.id, frameIds: [sender.frameId || 0] },
    files: ['dark-theme.css']
  }).then(() => sendResponse({ success: true }), () => sendResponse({ success: false }));
  return true;
});
