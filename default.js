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
// setConfig({targetLang: 'ja'})
//
// if the value is an Object (not string or number), deepCopy(DEFAULT_CONFIG) would be convenient
// e.g. the value of DEFAULT_CONFIG.translationTabParams is an Object, then
//
// const config = deepCopy(DEFAULT_CONFIG)
// config.translationTabParams.createWindow.type = "normal" // for example
// setConfig({translationTabParams: config.translationTabParams})
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
      // e.g. for 3440x1440 display
      // width: 1080, height: 1440, top: 0, left: 3440-1080,
      type: 'popup', focused: true
    },
    updateTab: null,
    updateWindow: { focused: true }
  },

  translationCSS: null,
  // e.g. dark mode
  // translationCSS: `
  //   body { background-color: #121212; color: darkgray; }
  //   span.source { color: skyblue; }
  // `,
  //
  // e.g. hide source text (only show translation text)
  // translationCSS: 'span.source { display: none; }',

  // global variables
  // DO NOT touch here
  deepLTabId: chrome.tabs.TAB_ID_NONE,
  translationTabId: chrome.tabs.TAB_ID_NONE
});

// setConfig({targetLang: 'ja'})
const setConfig = (config) => {
  chrome.storage.local.set(config);
}

// get config value
// https://developer.chrome.com/docs/extensions/reference/storage/#type-StorageArea
//
// to see default + custom config
// await getConfig()
//
// to see only custom config
// await getConfig(null)
const getConfig = (defaultConfig = DEFAULT_CONFIG) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(defaultConfig, resolve);
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
