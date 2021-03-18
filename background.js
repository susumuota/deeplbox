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
  urlBase: 'https://www.deepl.com/translator',
  alwaysCreate: false,
  useWindow: true,
  tabCreateParams: {
    // https://developer.chrome.com/docs/extensions/reference/tabs/#method-create
    active: false
  },
  tabUpdateParams: {
    // https://developer.chrome.com/docs/extensions/reference/tabs/#method-update
    active: false
  },
  windowCreateParams: {
    // https://developer.chrome.com/docs/extensions/reference/windows/#method-create
    width: 1080,
    height: 1080,
    top: 0,
    left: 0,
    focused: false
  },
  windowUpdateParams: {
    // https://developer.chrome.com/docs/extensions/reference/windows/#method-update
    focused: false
  },
  // DON'T touch tabId. tabId used like a global variable, not config
  tabId: chrome.tabs.TAB_ID_NONE
});

// setConfig({targetLang: 'ja'})
const setConfig = (config) => {
  chrome.storage.local.set(config);
}

// getConfig().then(console.log)
// const config = await getConfig()
const getConfig = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(DEFAULT_CONFIG, resolve);
  });
}

// clearConfig()
const clearConfig = () => {
  chrome.storage.local.clear();
}

// create or update tab and window
// window.open does not seem to work in MV3
// this function is similar to window.open
const openTab = async (url) => {
  const config = await getConfig();
  const create = async () => {
    const tab = await chrome.tabs.create({...config.tabCreateParams, url: url});
    chrome.storage.local.set({tabId: tab.id}); // save tabId
    if (config.useWindow) {
      chrome.windows.create({...config.windowCreateParams, tabId: tab.id});
    }
    return tab;
  }
  const update = async () => {
    console.assert(config.tabId != chrome.tabs.TAB_ID_NONE);
    const tab = await chrome.tabs.update(config.tabId, {...config.tabUpdateParams, url: url});
    if (config.useWindow) {
      chrome.windows.update(tab.windowId, config.windowUpdateParams);
    }
    return tab;
  }
  console.debug('chrome.storage.local.get: config == ', config);
  if (!config.alwaysCreate && config.tabId != chrome.tabs.TAB_ID_NONE) {
    // try to reuse tab, but user may close tab
    return chrome.tabs.get(config.tabId).then(update).catch(create);
  } else {
    // first time. there is no tab
    return create();
  }
}

// open DeepL tab
const openDeepL = async (text) => {
  const config = await getConfig();
  return openTab(`${config.urlBase}#${config.sourceLang}/${config.targetLang}/${encodeURIComponent(text)}`);
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

// initialize the extension
// https://developer.chrome.com/docs/extensions/mv3/background_pages/#listeners
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'deepl-menu',
    title: 'DeepL Translate',
    contexts: ['selection']
  });
  chrome.storage.local.set({
    tabId: chrome.tabs.TAB_ID_NONE // must reset. saved tabId should be invalid
  });
  return true;
});

// context menu event
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId == 'deepl-menu') {
    const text = await getSelection(tab);
    const deepLTab = await openDeepL(text || info.selectionText || 'Could not get selection text.');
  }
  return true;
});

// keyboard shortcut event
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command == 'deepl-open') {
    const text = await getSelection(tab);
    const deepLTab = await openDeepL(text || 'Could not get selection text. Try context menu by right click.');
  }
  return true;
});
