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

/** Pair of source and translation. */
export type PairType = {
  readonly id: number,
  readonly source: string,
  readonly translation: string,
};

/** Item which includes source and translation paris. */
export type ItemType = {
  readonly id: number,
  readonly pairs: PairType[],
};

/** Config type. */
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

/** Default config. */
const DEFAULT_CONFIG: ConfigType = {
  // DeepL settings
  //
  // https://www.deepl.com/docs-api/translating-text/
  sourceLang: 'en',
  targetLang: 'ja', // 'de',
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

/**
 * Set config value.
 * e.g. `setConfig({targetLang: 'ja'})`
 * @param config config object. e.g. `{targetLang: 'ja'}`
 * @return void Promise.
 */
export const setConfig = (config: ConfigType) => chrome.storage.local.set(config);

/**
 * Get config items.
 *
 * e.g. To get default + custom config, `await getConfig()`.
 *
 * e.g. To get only custom config, `await getConfig(null)`.
 *
 * See https://developer.chrome.com/docs/extensions/reference/storage/#type-StorageArea
 * @param defaultConfig default config items or config keys or null.
 * @return Promise of config items.
 */
// eslint-disable-next-line max-len
export const getConfig = (defaultConfig: ConfigType | null = DEFAULT_CONFIG): Promise<ConfigType> => chrome.storage.local.get(defaultConfig);

/** Clear all of the config. */
export const clearConfig = () => chrome.storage.local.clear();

/**
 * DeepL's source language list.
 * See https://developers.deepl.com/docs/resources/supported-languages#source-languages
 */
export const SOURCE_LANG_LIST = [
  'ar',
  'bg',
  'cs',
  'da',
  'de',
  'el',
  'en',
  'es',
  'et',
  'fi',
  'fr',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'lt',
  'lv',
  'nb',
  'nl',
  'pl',
  'pt',
  'ro',
  'ru',
  'sk',
  'sl',
  'sv',
  'tr',
  'uk',
  'zh',
];

/**
 * DeepL's target language list.
 * See https://developers.deepl.com/docs/resources/supported-languages#target-languages
 */
export const TARGET_LANG_LIST = [
  'ar',
  'bg',
  'cs',
  'da',
  'de',
  'el',
  // 'en', // not recommended
  'en-gb',
  'en-us',
  'es',
  'et',
  'fi',
  'fr',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'lt',
  'lv',
  'nb',
  'nl',
  'pl',
  // 'pt', // not recommended
  'pt-br',
  'pt-pt',
  'ro',
  'ru',
  'sk',
  'sl',
  'sv',
  'tr',
  'uk',
  // 'zh', // not recommended
  'zh-hans',
  'zh-hant',
];

const EXCLUDE_PATTERN = /^(a|an|the|by|in|on|at|to|of|as|for|via|over|with|without|from|into|upon|under|between|through|or|and|not|[(-]?[\d.]+[),]?|[*∗])$/;
const CAPITAL_PATTERN = /^[A-Z].*$/;
/**
 * How much sentence includes capital letters.
 * @param sentence sentence to be counted capital letters.
 * @return ratio of how much capital letters included.
 */
export const capitalRatio = (sentence: string) => {
  const words = sentence.split(' ').filter((w) => !w.match(EXCLUDE_PATTERN));
  if (words.length === 0) return 0.0;
  return words.filter((w) => w.match(CAPITAL_PATTERN)).length / words.length;
};

const SECTION_PATTERN = /^((\d+\.)+|[IVX]+(\.\d+)*)\s+[A-Z].*[^.]$/;
export const isSection = (sentence: string) => !!sentence.match(SECTION_PATTERN);

const CAPTION_PATTERN = /^(Figure|Table)\s+\d+[.:].*$/;
export const isCaption = (sentence: string) => !!sentence.match(CAPTION_PATTERN);
