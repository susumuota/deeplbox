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
  alwaysCreate: false, // always open a new tab (or window)
  useWindow: false, // use window instead of tab
  useTranslationTab: true, // show translation tab
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
    // width: 1080,
    // height: 1080,
    // top: 0,
    // left: 0,
    focused: false
  },
  windowUpdateParams: { // parameters to update window
    // https://developer.chrome.com/docs/extensions/reference/windows/#method-update
    focused: false
  },
  retry: 10, // how many times to retry to sendMessage
  msec: 1000, // sleep msec
  // DON'T touch tabId(s). they are used like a global variable, not config
  deepLTabId: chrome.tabs.TAB_ID_NONE,
  translationTabId: chrome.tabs.TAB_ID_NONE
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
const openTab = async (url, tabId, isUpdate) => {
  const config = await getConfig();
  if (!config.alwaysCreate && tabId != chrome.tabs.TAB_ID_NONE) {
    // try to reuse tab, but user may close tab
    return chrome.tabs.get(tabId)
      .then((tab) => isUpdate ? updateTab(url, tabId) : tab)
      .catch((err) => createTab(url));
  } else {
    // first time. there is no tab
    return createTab(url);
  }
}

// open DeepL tab
const openDeepLTab = async (text) => {
  const config = await getConfig();
  const tab = await openTab(`${config.urlBase}#${config.sourceLang}/${config.targetLang}/${encodeURIComponent(text)}`, config.deepLTabId, true);
  setConfig({deepLTabId: tab.id}); // remember tab and reuse next time
  return tab;
}

// open translation tab
const openTranslationTab = async () => {
  const config = await getConfig();
  const tab = await openTab('translation.html', config.translationTabId, false);
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

// await sleep(msec);
const sleep = (msec) => {
  return new Promise(resolve => setTimeout(resolve, msec));
}

// get translation from contents.js
const getTranslation = (tab) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, {message: 'getTranslation'}, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (response && 'message' in response && response.message) {
        resolve(response.message);
      } else {
        reject('empty message');
      }
    });
  });
}

// https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
const getTranslationRetry = async (tab, n, msec) => {
  try {
    return await getTranslation(tab);
  } catch (err) {
    if (n <= 1) throw err;
    await sleep(msec);
    return await getTranslationRetry(tab, n - 1, msec);
  }
};

const translate = async (text) => {
  const config = await getConfig();
  const deepLTab = await openDeepLTab(text);
  try {
    return await getTranslationRetry(deepLTab, config.retry, config.msec);
  } catch (err) {
    return err;
  }
};

// send translation to translation.html
const showTranslation = (tab, translation) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, {
      message: 'showTranslation',
      translation: translation
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (response && 'message' in response && response.message) {
        resolve(response.message);
      } else {
        reject('empty message');
      }
    });
  });
}

// https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
const showTranslationRetry = async (tab, translation, n, msec) => {
  try {
    return await showTranslation(tab, translation);
  } catch (err) {
    if (n <= 1) throw err;
    await sleep(msec);
    return await showTranslationRetry(tab, translation, n - 1, msec);
  }
};

const show = async (translation) => {
  console.log(translation);
  const config = await getConfig();
  if (config.useTranslationTab) {
    const translationTab = await openTranslationTab();
    try {
      return await showTranslationRetry(translationTab, translation, config.retry, config.msec);
    } catch (err) {
      return err;
    }
  } else {
    return 'background.js: show: done'
  }
};

// initialize the extension
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
    const text = await getSelection(tab);
    const translation = await translate(text || info.selectionText || 'Could not get selection text.');
    const result = await show(translation);
  }
  return true;
});

// keyboard shortcut event
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'deepl-open') {
    const text = await getSelection(tab);
    const translation = await translate(text || 'Could not get selection text. Try context menu by right click.');
    const result = await show(translation);
  }
  return true;
});
