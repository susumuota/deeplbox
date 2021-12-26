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

export type PairType = {
  readonly id: number,
  readonly source: string,
  readonly translation: string,
};

export type ItemType = {
  readonly id: number,
  readonly pairs: PairType[],
};

export type ConfigType = {
  readonly sourceLang?: string,
  readonly targetLang?: string,
  readonly urlBase?: string,
  readonly deepLTabParams?: {
    readonly createTab: chrome.tabs.CreateProperties, // MUST NOT be null
    readonly createWindow: chrome.windows.CreateData | null,
    readonly updateTab: chrome.tabs.UpdateProperties, // MUST NOT be null
    readonly updateWindow: chrome.windows.UpdateInfo | null,
  },
  readonly translationTabParams?: {
    readonly createTab: chrome.tabs.CreateProperties | null,
    readonly createWindow: chrome.windows.CreateData | null,
    readonly updateTab: chrome.tabs.UpdateProperties | null,
    readonly updateWindow: chrome.windows.UpdateInfo | null,
  },
  readonly isSplit?: boolean,
  readonly maxSourceText?: number,
  readonly translationHTML?: string,
  readonly isDarkTheme?: boolean,
  readonly isShowSource?: boolean,
  readonly isTransparent?: boolean,
  readonly isReverse?: boolean,
  readonly isAutoScroll?: boolean,
  readonly items?: ItemType[],
  readonly deepLTabId?: number,
  readonly translationTabId?: number,
};

// default config
export const DEFAULT_CONFIG: ConfigType = {
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
      width: 1080,
      height: 1080,
      top: 0,
      left: 0,
      type: 'popup',
      focused: true,
    },
    updateTab: null,
    updateWindow: { focused: true },
  },

  // split sentences
  isSplit: false,

  // maximum length of source text to avoid free trial limit. 0 or negative number means unlimited.
  // maxSourceText: 5000,
  maxSourceText: -1,

  // translation tab HTML
  translationHTML: 'translation.html',

  // dark theme on translation.html
  isDarkTheme: false,

  // show source text on translation.html
  isShowSource: true,

  // show source text with transparent
  isTransparent: true,

  // reserve items
  isReverse: false,

  // auto scroll when a new translation arrives
  isAutoScroll: true,

  // items on translation.html
  items: [],

  // global variables
  // DO NOT touch here
  deepLTabId: chrome.tabs.TAB_ID_NONE,
  translationTabId: chrome.tabs.TAB_ID_NONE,
};

// set config value
// setConfig({targetLang: 'ja'})
export const setConfig = (config: ConfigType) => chrome.storage.local.set(config);

// get config value
// https://developer.chrome.com/docs/extensions/reference/storage/#type-StorageArea
//
// to see default + custom config
// await getConfig()
//
// to see only custom config
// await getConfig(null)
// eslint-disable-next-line max-len
export const getConfig = (defaultConfig: ConfigType = DEFAULT_CONFIG): Promise<ConfigType> => chrome.storage.local.get(defaultConfig);

// clearConfig()
export const clearConfig = () => chrome.storage.local.clear();

// https://www.deepl.com/docs-api/translating-text/
export const SOURCE_LANG_LIST = [
  'auto',
  'bg',
  'zh',
  'cs',
  'da',
  'nl',
  'en',
  'et',
  'fi',
  'fr',
  'de',
  'el',
  'hu',
  'it',
  'ja',
  'lv',
  'lt',
  'pl',
  'pt',
  'ro',
  'ru',
  'sk',
  'sl',
  'es',
  'sv',
];

// https://www.deepl.com/docs-api/translating-text/
export const TARGET_LANG_LIST = [
  'auto',
  'bg',
  'zh',
  'cs',
  'da',
  'nl',
  'en-us',
  'en-gb',
  // 'en',
  'et',
  'fi',
  'fr',
  'de',
  'el',
  'hu',
  'it',
  'ja',
  'lv',
  'lt',
  'pl',
  'pt-pt',
  'pt-br',
  // 'pt',
  'ro',
  'ru',
  'sk',
  'sl',
  'es',
  'sv',
];
