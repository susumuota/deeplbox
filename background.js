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

// default config
// edit DEFAULT_CONFIG and reload extension
// or call setConfig on DevTools console like the following
//
// const config = deepCopy(DEFAULT_CONFIG)
// config.translationTabParams.createWindow.type = "normal" // for example
// setConfig(config)
// await getConfig()
const DEFAULT_CONFIG = Object.freeze({ // TODO: deepFreeze
  // DeepL settings
  //
  // https://www.deepl.com/docs-api/translating-text/
  sourceLang: 'auto', // 'en',
  targetLang: 'auto', // 'ja',
  urlBase: 'https://www.deepl.com/translator', // or https://www.deepl.com/ja/translator

  // create/update tab/window methods parameters
  // if you specify null, that method won't call
  // see these pages for parameters details
  //
  // https://developer.chrome.com/docs/extensions/reference/tabs/#method-create
  // https://developer.chrome.com/docs/extensions/reference/windows/#method-create
  // https://developer.chrome.com/docs/extensions/reference/tabs/#method-update
  // https://developer.chrome.com/docs/extensions/reference/windows/#method-update
  // DeepL tab settings
  deepLTabParams: {
    createTab: { active: false }, // MUST NOT be null
    createWindow: null,
    updateTab: { active: false }, // MUST NOT be null
    updateWindow: null,
  },
  // Translation tab settings
  translationTabParams: {
    createTab: { active: false },
    createWindow: {
      width: 1080, height: 1080, top: 0, left: 0,
      type: 'popup', focused: false
    },
    updateTab: null,
    updateWindow: null
  },

  // global variables
  // DO NOT touch here
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

// deep copy object
const deepCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj));
}

// create or update tab (and window)
// window.open does not seem to work in MV3
// this function is similar to window.open
const openTab = async (url, tabId, params) => {
  // tab already exists
  if (tabId != chrome.tabs.TAB_ID_NONE) {
    try {
      // ensure tab exists
      // chrome.tabs.get throws error if there is no tab with tabId
      const currentTab = await chrome.tabs.get(tabId);
      console.assert(currentTab.id === tabId);
      // update tab
      if (params.updateTab) {
        const updatedTab = await chrome.tabs.update(tabId, {...params.updateTab, url: url});
        console.assert(updatedTab.id === tabId);
        if (params.updateWindow) {
          chrome.windows.update(updatedTab.windowId, params.updateWindow);
        }
        return updatedTab;
      }
      // no need to update tab
      return currentTab;
    } catch (err) {
      // maybe user close tab
      console.debug(err);
    }
  }
  // no tab exists
  // should be first time or closed tab by user
  if (params.createTab) {
    const createdTab = await chrome.tabs.create({...params.createTab, url: url});
    if (params.createWindow) {
      chrome.windows.create({...params.createWindow, tabId: createdTab.id});
    }
    return createdTab;
  }
  // no need to create tab
  return null;
}

// open DeepL tab
const openDeepLTab = async (sourceText) => {
  const config = await getConfig();
  const tab = await openTab(`${config.urlBase}#${config.sourceLang}/${config.targetLang}/${encodeURIComponent(sourceText)}`, config.deepLTabId, config.deepLTabParams);
  if (tab) {
    setConfig({deepLTabId: tab.id}); // remember tab and reuse next time
  }
  return tab;
}

// open translation tab
const openTranslationTab = async () => {
  const config = await getConfig();
  const tab = await openTab('translation.html', config.translationTabId, config.translationTabParams);
  if (tab) {
    setConfig({translationTabId: tab.id}); // remember tab and reuse next time
  }
  return tab;
}

// get selection text
const getSelection = (tab) => {
  // https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#executing-arbitrary-strings
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: () => window.getSelection().toString()
    }, (results) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      }
      resolve(results[0].result);
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
    const selection = await getSelection(tab);
    const source = selection || fixSelectionText(info.selectionText) || 'Could not get selection text.'
    const deepLTab = await openDeepLTab(source.trim());
    const translationTab = await openTranslationTab();
    // now, content.js will send message to background.js and translation.js
  }
  return true;
});

// keyboard shortcut event
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'deepl-open') {
    const selection = await getSelection(tab);
    const source = selection || 'Could not get selection text. Try context menu by right click.';
    const deepLTab = await openDeepLTab(source.trim());
    const translationTab = await openTranslationTab();
    // now, content.js will send message to background.js and translation.js
  }
  return true;
});

// receive message from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'setTranslation') {
    if (request.translation && request.translation.trim()) {
      console.log(request.translation);
      sendResponse({ message: 'background.js: setTranslation: done' });
    }
  }
  return true;
});
