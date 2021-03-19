// -*- coding: utf-8 -*-

// Copyright 2021 Susumu OTA
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// Manifest V3 for Chrome Extensions (MV3)
//
// https://developer.chrome.com/docs/extensions/mv3/intro/
// https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/
// https://developer.chrome.com/docs/extensions/mv3/manifest/
// https://developer.chrome.com/docs/extensions/mv3/background_pages/
// https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/


'use strict';

const DEFAULT_CONFIG = Object.freeze({ // TODO: deepFreeze
  // https://www.deepl.com/docs-api/translating-text/
  sourceLang: 'en',
  targetLang: 'ja',
  urlBase: 'https://www.deepl.com/translator', // or https://www.deepl.com/ja/translator
  useTranslationTab: true, // show translation tab
  useWindow: true, // use window instead of tab
  alwaysCreate: false, // always open a new tab (or window)
  tabCreateParams: { // parameters to create tab
    // https://developer.chrome.com/docs/extensions/reference/tabs/#method-create
    active: false
  },
  tabUpdateParams: { // parameters to update tab
    // https://developer.chrome.com/docs/extensions/reference/tabs/#method-update
    active: false
  },
  windowCreateParams: { // parameters to create window
    // https://developer.chrome.com/docs/extensions/reference/windows/#method-create
    width: 1080,
    height: 1080,
    top: 0,
    left: 0,
    type: 'popup', // 'normal'
    focused: false
  },
  windowUpdateParams: { // parameters to update window
    // https://developer.chrome.com/docs/extensions/reference/windows/#method-update
    focused: false
  },
  // DON'T touch tabId(s). they are used like a global variable, not config
  deepLTabId: chrome.tabs.TAB_ID_NONE,
  translationTabId: chrome.tabs.TAB_ID_NONE
});

// setConfig({targetLang: 'ja'})
const setConfig = (config) => {
  chrome.storage.local.set(config);
}

// await getConfig()
const getConfig = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(DEFAULT_CONFIG, resolve);
  });
}

// clearConfig()
const clearConfig = () => {
  chrome.storage.local.clear();
}

// create tab (and window)
const createTab = async (url) => {
  const config = await getConfig();
  const tab = await chrome.tabs.create({...config.tabCreateParams, url: url});
  if (config.useWindow) {
    chrome.windows.create({...config.windowCreateParams, tabId: tab.id});
  }
  return tab;
}

// update tab (and window)
const updateTab = async (url, tabId) => {
  const config = await getConfig();
  const tab = await chrome.tabs.update(tabId, {...config.tabUpdateParams, url: url});
  if (config.useWindow) {
    chrome.windows.update(tab.windowId, config.windowUpdateParams);
  }
  return tab;
}

// create or update tab (and window)
// window.open does not seem to work in MV3
// this function is similar to window.open
const openTab = async (url, tabId) => {
  const config = await getConfig();
  if (!config.alwaysCreate && tabId != chrome.tabs.TAB_ID_NONE) {
    try {
      const tab = await chrome.tabs.get(tabId); // ensure tab already exists
      console.assert(tab.id === tabId);
      return updateTab(url, tabId);
    } catch (err) {
      console.debug(err);
      return createTab(url);
    }
  } else {
    return createTab(url);
  }
}

// open DeepL tab
const openDeepLTab = async (sourceText) => {
  const config = await getConfig();
  const tab = await openTab(`${config.urlBase}#${config.sourceLang}/${config.targetLang}/${encodeURIComponent(sourceText)}`, config.deepLTabId);
  setConfig({deepLTabId: tab.id}); // remember tab and reuse next time
  return tab;
}

// open translation tab
const openTranslationTab = async () => {
  const config = await getConfig();
  const tab = await openTab('translation.html', config.translationTabId);
  setConfig({translationTabId: tab.id}); // remember tab and reuse next time
  return tab;
}

const getSelection = (tab) => {
  // https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#executing-arbitrary-strings
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: () => window.getSelection().toString()
    }, (results) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(results[0].result);
      }
    });
  });
}

// Chrome removes newlines from selected text
// just a tiny hack to make it better
const fixSelectionText = (text) => {
  return text.replace(/([\.\?\!])\s+/g, '$1\n\n');
}

// initialize extension event
// https://developer.chrome.com/docs/extensions/mv3/background_pages/#listeners
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'deepl-menu',
    title: 'DeepL Translate',
    contexts: ['selection']
  });
  // must reset. old tabId should be invalid
  setConfig({deepLTabId: chrome.tabs.TAB_ID_NONE});
  setConfig({translationTabId: chrome.tabs.TAB_ID_NONE});
  return true;
});

// context menu event
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'deepl-menu') {
    const config = await getConfig();
    const selection = await getSelection(tab);
    const source = selection || fixSelectionText(info.selectionText) || 'Could not get selection text.'
    const deepLTab = await openDeepLTab(source.trim());
    if (config.useTranslationTab) {
      const translationTab = await openTranslationTab();
    }
  }
  return true;
});

// keyboard shortcut event
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'deepl-open') {
    const config = await getConfig();
    const selection = await getSelection(tab);
    const source = selection || 'Could not get selection text. Try context menu by right click.';
    const deepLTab = await openDeepLTab(source.trim());
    if (config.useTranslationTab) {
      const translationTab = await openTranslationTab();
    }
  }
  return true;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'setTranslation') {
    if (request.translation && request.translation.trim()) {
      console.log(request.translation);
      sendResponse({ message: 'background.js: setTranslation: done' });
    }
  }
  return true;
});
