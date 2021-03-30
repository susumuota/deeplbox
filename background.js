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

// this code is written according to MV3
//
// https://developer.chrome.com/docs/extensions/mv3/intro/
// https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/
// https://developer.chrome.com/docs/extensions/mv3/manifest/
// https://developer.chrome.com/docs/extensions/mv3/background_pages/
// https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/

'use strict';

// default config
//
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
      type: 'popup', focused: true
    },
    updateTab: null,
    updateWindow: { focused: true }
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
// this function is similar to window.open
const openTab = async (url, tabId, params) => {
  // tab already exists
  if (tabId !== chrome.tabs.TAB_ID_NONE) {
    try {
      // ensure tab exists
      // chrome.tabs.get throws error if there is no tab with tabId
      const currentTab = await chrome.tabs.get(tabId);
      // update tab
      if (params.updateTab) {
        const updatedTab = await chrome.tabs.update(tabId, {...params.updateTab, url: url});
        if (params.updateWindow) {
          chrome.windows.update(updatedTab.windowId, params.updateWindow);
        }
        return updatedTab;
      }
      if (params.updateWindow) {
        chrome.windows.update(currentTab.windowId, params.updateWindow);
      }
      // no need to update tab
      return currentTab;
    } catch (err) {
      // maybe tab was closed by user
      console.debug(err);
    }
  }
  // no tab exists
  // first time or tab was closed by user
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
  // slash (%2F) -> backslash slash (%5C%2F)
  const enc = encodeURIComponent(sourceText).replaceAll(/%2F/g, '%5C%2F');
  const tab = await openTab(`${config.urlBase}#${config.sourceLang}/${config.targetLang}/${enc}`, config.deepLTabId, config.deepLTabParams);
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

// get selection text by injection
// https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#executing-arbitrary-strings
const getSelectionByInjection = (tab) => {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: () => window.getSelection().toString()
    }, (results) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (results && results.length > 0 &&
                 results[0].result && results[0].result.trim()){
        resolve(results[0].result.trim());
      }
      reject('Empty window.getSelection()');
    });
  });
}

// get selection text by message
// send message to content scripts
const getSelectionByMessage = (tab) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, { message: 'getSelection' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (response) {
        resolve(response);
      }
      reject('Empty response');
    });
  });
}

// Chrome removes newlines from info.selectionText that makes hard to read
// this is just a tiny hack to make it better
const fixSelectionText = (text) => {
  return text ? text.replace(/([\.\?\!]+)\s+/g, '$1\n\n') : text;
}

// translate source text
const translateText = async (source) => {
  await openDeepLTab(source);
  await openTranslationTab();
  // now, deepl.js will send message to translation.js (and background.js)
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
    try {
      translateText(await getSelectionByInjection(tab));
    } catch (err) {
      console.debug(err);
      translateText(fixSelectionText(info.selectionText));
    }
  }
  return true;
});

// keyboard shortcut event
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'deepl-open') {
    try {
      translateText(await getSelectionByInjection(tab));
    } catch (err) {
      console.debug(err);
      try {
        await getSelectionByMessage(tab);
      } catch (err) {
        console.debug(err);
      }
    }
  }
  return true;
});

// receive message from deepl.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'setTranslation') {
    console.log(request.translation);
    sendResponse({ message: 'background.js: setTranslation: done' });
  }
  return true;
});

// receive message from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'setSelection') {
    const selection = request.selection.trim();
    translateText(selection || 'Could not get selection text.');
    sendResponse({ message: 'background.js: setSelection: done' });
  }
  return true;
});
