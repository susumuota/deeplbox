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
  retry: 20, // how many retries to sendMessage
  msec: 1000, // sleep msec
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
      return await updateTab(url, tabId);
    } catch (err) {
      console.debug(err);
      return await createTab(url);
    }
  } else {
    return await createTab(url);
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

// await sleep(msec)
const sleep = (msec) => {
  return new Promise(resolve => setTimeout(resolve, msec));
}

// fetch translation from content.js
const fetchTranslation = (tab) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, {message: 'getTranslation'}, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (response && 'message' in response && response.message) {
        resolve(response.message);
      } else {
        reject('background.js: getTranslation: got empty message from content.js');
      }
    });
  });
}

// retry version of fetchTranslation
// https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
const fetchTranslationRetry = async (tab, n, msec) => {
  try {
    return await fetchTranslation(tab);
  } catch (err) {
    console.debug(err);
    if (n <= 1) throw err;
    await sleep(msec);
    return await fetchTranslationRetry(tab, n - 1, msec);
  }
};

// translate text
const translate = async (sourceText) => {
  const config = await getConfig();
  const deepLTab = await openDeepLTab(sourceText);
  try {
    return await fetchTranslationRetry(deepLTab, config.retry, config.msec);
  } catch (err) {
    console.debug(err);
    return err;
  }
};

// send source and translation to translation.js
const sendTranslation = (tab, source, translation) => {
  return new Promise(async (resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, {
      message: 'setTranslation',
      source: source,
      translation: translation
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (response && 'message' in response && response.message) {
        resolve(response.message);
      } else {
        reject('background.js: setTranslation: got empty message from translation.js');
      }
    });
  });
}

// retry version of sendTranslation
// https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
const sendTranslationRetry = async (tab, source, translation, n, msec) => {
  try {
    return await sendTranslation(tab, source, translation);
  } catch (err) {
    console.debug(err);
    if (n <= 1) throw err;
    await sleep(msec);
    return await sendTranslationRetry(tab, source, translation, n - 1, msec);
  }
};

// show source and translation
const showResult = async (source, translation) => {
  console.log(translation);
  console.log(source);
  const config = await getConfig();
  if (config.useTranslationTab) {
    const translationTab = await openTranslationTab();
    // TODO: needs to wait for preparing tab. add event listener?
    await sleep(config.msec);
    try {
      return await sendTranslationRetry(translationTab, source, translation, config.retry, config.msec);
    } catch (err) {
      console.debug(err);
      return err;
    }
  } else {
    return 'background.js: showResult: done'
  }
};

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
    const translation = await translate(source);
    await showResult(source, translation);
  }
  return true;
});

// keyboard shortcut event
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'deepl-open') {
    const selection = await getSelection(tab);
    const source = selection || 'Could not get selection text. Try context menu by right click.';
    const translation = await translate(source);
    await showResult(source, translation);
  }
  return true;
});
