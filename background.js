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
// https://developer.chrome.com/docs/extensions/mv3/intro/


'use strict';

const DEFAULT_CONFIG = Object.freeze({
  sourceLang: 'en',
  targetLang: 'ja',
  urlBase: 'https://www.deepl.com/translator',
  alwaysCreate: false,
  isWindow: true,
  tabCreateConfig: {
    // https://developer.chrome.com/docs/extensions/reference/tabs/#method-create
    active: true
  },
  tabUpdateConfig: {
    // https://developer.chrome.com/docs/extensions/reference/tabs/#method-update
    active: true
  },
  windowCreateConfig: {
    // https://developer.chrome.com/docs/extensions/reference/windows/#method-create
    width: 1080,
    height: 1080,
    top: 0,
    left: 0,
    focused: true
  },
  windowUpdateConfig: {
    // https://developer.chrome.com/docs/extensions/reference/windows/#method-update
    focused: true
  }
});

function getConfigValue(config, key) {
  return key in config ? config[key] : DEFAULT_CONFIG[key];
}

// create or update tab and window
// this function is similar to window.open
// window.open(url, null) does not seem to work in MV3
function openTab(url) {
  function create() {
    chrome.storage.local.get(['isWindow', 'tabCreateConfig', 'windowCreateConfig'], (config) => {
      const tabCreateConfig = getConfigValue(config, 'tabCreateConfig');
      chrome.tabs.create({...tabCreateConfig, url: url}, (tab) => {
        console.debug('chrome.tabs.create: tab == ', tab);
        chrome.storage.local.set({tabId: tab.id});
        const isWindow = getConfigValue(config, 'isWindow');
        if (isWindow) {
          const windowCreateConfig = getConfigValue(config, 'windowCreateConfig');
          chrome.windows.create({...windowCreateConfig, tabId: tab.id}, (window) => {
            chrome.storage.local.set({windowId: window.id});
            console.debug('chrome.windows.create: window == ', window);
          });
        }
      });
    });
  }
  function update() {
    chrome.storage.local.get(['tabId', 'windowId', 'isWindow', 'tabUpdateConfig', 'windowUpdateConfig'], (config) => {
      console.assert(config.tabId != undefined);
      console.assert(config.tabId != chrome.tabs.TAB_ID_NONE);
      const tabUpdateConfig = getConfigValue(config, 'tabUpdateConfig');
      chrome.tabs.update(config.tabId, {...tabUpdateConfig, url: url}, (tab) => {
        console.debug('chrome.tabs.update: tab == ', tab);
        chrome.storage.local.set({tabId: tab.id});
        const isWindow = getConfigValue(config, 'isWindow');
        if (isWindow) {
          console.assert(config.windowId != undefined)
          console.assert(config.windowId != chrome.windows.WINDOW_ID_NONE)
          const windowUpdateConfig = getConfigValue(config, 'windowUpdateConfig');
          chrome.windows.update(config.windowId, windowUpdateConfig, (window) => {
            console.debug('chrome.windows.update: window == ', window);
            chrome.storage.local.set({windowId: window.id});
          });
        }
      });
    });
  }
  chrome.storage.local.get(['tabId', 'alwaysCreate'], (config) => {
    console.debug('chrome.storage.local.get: config == ', config);
    const tabId = config.tabId || chrome.tabs.TAB_ID_NONE;
    const alwaysCreate = getConfigValue(config, 'alwaysCreate');
    if (!alwaysCreate && tabId != chrome.tabs.TAB_ID_NONE) {
      // try to reuse tab, but user may close tab
      chrome.tabs.get(tabId).then(update).catch(create);
    } else {
      // first time. there is no tab
      create();
    }
  });
}

// open DeepL tab
function openDeepL(text) {
  chrome.storage.local.get(['sourceLang', 'targetLang', 'urlBase'], (config) => {
    // https://www.deepl.com/docs-api/translating-text/
    const sl = getConfigValue(config, 'sourceLang');
    const tl = getConfigValue(config, 'targetLang');
    const urlBase = getConfigValue(config, 'urlBase');
    const encoded = encodeURIComponent(text);
    openTab(`${urlBase}#${sl}/${tl}/${encoded}`);
  });
}

// setConfig({targetLang: 'ja'})
function setConfig(config) {
  chrome.storage.local.set(config);
}

function getConfig(callback) {
  chrome.storage.local.get(Object.keys(DEFAULT_CONFIG), callback);
}
// clearConfig()
function clearConfig() {
  chrome.storage.local.clear();
}

// get selection text
// TODO: sometimes window.getSelection() returns empty (e.g. Kaggle Notebook)
function getSelection(tab, callback) {
  // https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#executing-arbitrary-strings
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    function: () => window.getSelection().toString()
  }, (results) => {
    callback(results[0].result);
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
    tabId: chrome.tabs.TAB_ID_NONE,
    windowId: chrome.windows.WINDOW_ID_NONE
  });
});

// context menu event
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId == 'deepl-menu') {
    getSelection(tab, (text) => {
      openDeepL(text || info.selectionText || 'Could not get selection text.');
    });
  }
});

// keyboard shortcut event
chrome.commands.onCommand.addListener((command, tab) => {
  if (command == 'deepl-open') {
    getSelection(tab, (text) => {
      openDeepL(text || 'Could not get selection text. Try context menu by right click.');
    });
  }
});
