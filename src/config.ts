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

'use strict';

// deep freeze object
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze#What_is_shallow_freeze
// https://www.30secondsofcode.org/blog/s/javascript-deep-freeze-object
const deepFreeze = (object: any): any => {
  if (object === null) return null;
  if (object === undefined) return undefined;
  for (const name of Object.getOwnPropertyNames(object)) {
    const value = object[name];
    (typeof value === 'object' ? deepFreeze : Object.freeze)(value);
  }
  return Object.freeze(object);
}

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
export const DEFAULT_CONFIG: Object = deepFreeze({
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
  //
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

  // split sentences
  isSplit: false,

  // translation tab HTML
  translationHTML: 'translation.html',

  // dark theme on translation.html
  isDarkTheme: false,

  // show source text on translation.html
  isShowSource: false,

  // global variables
  // DO NOT touch here
  deepLTabId: chrome.tabs.TAB_ID_NONE,
  translationTabId: chrome.tabs.TAB_ID_NONE
});

// set config value
// setConfig({targetLang: 'ja'})
export const setConfig = (config: Object): void => {
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
export const getConfig = (defaultConfig: Object = DEFAULT_CONFIG): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(defaultConfig, resolve);
  });
}

// clearConfig()
export const clearConfig = (): void => {
  chrome.storage.local.clear();
}

// deep copy object
//
// JSON.parse(JSON.stringify(object)) sounds enough but
// it's slow and it can NOT copy some types like function, Map, etc. for example,
//
// JSON.stringify(() => {}) // undefined
//
// so it needs to be implemented by recursive function
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures
// https://developer.mozilla.org/en-US/docs/Glossary/Primitive
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
// https://medium.com/@pmzubar/why-json-parse-json-stringify-is-a-bad-practice-to-clone-an-object-in-javascript-b28ac5e36521
// https://www.30secondsofcode.org/js/s/deep-clone
// https://gist.github.com/izy521/4d394dec28054d54684269d91b16cb8a
export const deepCopy = (object: any): any => {
  // there are 7 primitives
  if (object === null || object === undefined) return object;
  switch (object.constructor.name) {
    // primitives
    case 'String':
    case 'Number':
    case 'BigInt':
    case 'Boolean':
    case 'Symbol':
      return object; // primitives are immutable, so no need to clone
    // array-like
    // TODO: confirm WeakMap and WeakSet are impossible to clone
    case 'Array': return object.map(deepCopy);
    case 'Map': return new Map(Array.from(object, deepCopy));
    case 'Set': return new Set(Array.from(object, deepCopy));
    // other classes
    case 'Function': return object.bind({}); // TODO: what if function have properties
    case 'RegExp': return new RegExp(object);
    case 'Date': return new Date(object);
    case 'Object':
      const clone = Object.assign({}, object); // shallow copy
      for (const name of Object.getOwnPropertyNames(object)) {
        clone[name] = deepCopy(object[name]);
      }
      return clone;
    // TODO: any other classes which are worth to support?
    default: // unknown
      throw Error(`Unsupported type: ${object.constructor}`);
      // return object; TODO: not Error but just return object?
  }
}
