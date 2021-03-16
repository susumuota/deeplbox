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

const DEFAULT_CONFIG = Object.freeze({ // TODO: deepFreeze
  // https://www.deepl.com/docs-api/translating-text/
  sourceLang: 'en',
  targetLang: 'ja',
  urlBase: 'https://www.deepl.com/translator',
  alwaysCreate: false,
  useWindow: true,
  tabCreateParam: {
    // https://developer.chrome.com/docs/extensions/reference/tabs/#method-create
    active: false
  },
  tabUpdateParam: {
    // https://developer.chrome.com/docs/extensions/reference/tabs/#method-update
    active: false
  },
  windowCreateParam: {
    // https://developer.chrome.com/docs/extensions/reference/windows/#method-create
    width: 1080,
    height: 1080,
    top: 0,
    left: 0,
    focused: true
  },
  windowUpdateParam: {
    // https://developer.chrome.com/docs/extensions/reference/windows/#method-update
    focused: true
  },
  // DON'T touch tabId. tabId used like a global variable, not config
  tabId: chrome.tabs.TAB_ID_NONE
});

// create or update tab and window
// window.open does not seem to work in MV3
// this function is similar to window.open
const openTab = (url) => {
  const create = () => {
    chrome.storage.local.get(DEFAULT_CONFIG, (config) => {
      chrome.tabs.create({...config.tabCreateParam, url: url}, (tab) => {
        console.debug('chrome.tabs.create: tab == ', tab);
        console.assert(tab.id != chrome.tabs.TAB_ID_NONE);
        chrome.storage.local.set({tabId: tab.id}); // save tabId
        if (config.useWindow) {
          chrome.windows.create({...config.windowCreateParam, tabId: tab.id}, (window) => {
            console.debug('chrome.windows.create: window == ', window);
          });
        }
      });
    });
  }
  const update = () => {
    chrome.storage.local.get(DEFAULT_CONFIG, (config) => {
      console.assert(config.tabId != chrome.tabs.TAB_ID_NONE);
      chrome.tabs.update(config.tabId, {...config.tabUpdateParam, url: url}, (tab) => {
        console.debug('chrome.tabs.update: tab == ', tab);
        console.assert(config.tabId == tab.id);
        if (config.useWindow) {
          chrome.windows.update(tab.windowId, config.windowUpdateParam, (window) => {
            console.debug('chrome.windows.update: window == ', window);
            console.assert(window.id == tab.windowId);
          });
        }
      });
    });
  }
  chrome.storage.local.get(DEFAULT_CONFIG, (config) => {
    console.debug('chrome.storage.local.get: config == ', config);
    if (!config.alwaysCreate && config.tabId != chrome.tabs.TAB_ID_NONE) {
      // try to reuse tab, but user may close tab
      chrome.tabs.get(config.tabId).then(update).catch(create);
    } else {
      // first time. there is no tab
      create();
    }
  });
}

// open DeepL tab
const openDeepL = (text) => {
  chrome.storage.local.get(DEFAULT_CONFIG, (config) => {
    openTab(`${config.urlBase}#${config.sourceLang}/${config.targetLang}/${encodeURIComponent(text)}`);
  });
}

// setConfig({targetLang: 'ja'})
const setConfig = (config) => {
  chrome.storage.local.set(config);
}

// getConfig(console.log)
const getConfig = (callback) => {
  chrome.storage.local.get(DEFAULT_CONFIG, callback);
}

// clearConfig()
const clearConfig = () => {
  chrome.storage.local.clear();
}

// get selection text
// TODO: sometimes window.getSelection() returns empty (e.g. Kaggle Notebook)
const getSelection = (tab, callback) => {
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
    tabId: chrome.tabs.TAB_ID_NONE // must reset. saved tabId should be invalid
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
