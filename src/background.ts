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

import tokenizer from 'sbd';

import {
  DEFAULT_CONFIG,
  getConfig,
  setConfig,
} from './config';

type OpenTabParamsType = {
  readonly createTab: chrome.tabs.CreateProperties | null,
  readonly createWindow: chrome.windows.CreateData | null,
  readonly updateTab: chrome.tabs.UpdateProperties | null,
  readonly updateWindow: chrome.windows.UpdateInfo | null,
};

// create or update tab (and window)
// this function is similar to window.open
const openTab = async (url: string, tabId: number, params: OpenTabParamsType) => {
  // tab already exists
  if (tabId !== chrome.tabs.TAB_ID_NONE) {
    try {
      // ensure tab exists
      // chrome.tabs.get throws error if there is no tab with tabId
      const currentTab = await chrome.tabs.get(tabId);
      console.assert(tabId === currentTab.id);
      if (params.updateTab) {
        const updatedTab = await chrome.tabs.update(tabId, { ...params.updateTab, url });
        console.assert(currentTab.id === updatedTab.id);
        if (params.updateWindow) chrome.windows.update(updatedTab.windowId, params.updateWindow);
        return updatedTab;
      }
      if (params.updateWindow) chrome.windows.update(currentTab.windowId, params.updateWindow);
      return currentTab;
    } catch (err) {
      // maybe tab was closed by user or extension was reloaded
      console.debug(err);
    }
  }
  // no tab exists
  // first time or tab was closed by user or extension was reloaded
  if (params.createTab) {
    const createdTab = await chrome.tabs.create({ ...params.createTab, url });
    // eslint-disable-next-line max-len
    if (params.createWindow) chrome.windows.create({ ...params.createWindow, tabId: createdTab.id });
    return createdTab;
  }
  // something is wrong at params
  throw new Error('background.ts: Invalid openTab params');
};

// insert a newline between sentences
const FIX_SECTION_PATTERN = /^(\d+|[A-Z])\.(\d+\.)*$/; // section or appendix
const FIX_CAPTION_PATTERN = /(Figure|Table)\s+\d+\.$/; // caption
const splitSentences = (text: string) => {
  if (!text) return text;
  const sentences = tokenizer.sentences(text, { newline_boundaries: true }); // sbd
  return sentences
    .flatMap((sentence) => { // flatMap is ES2019
      // fix caption and section
      if (sentence.match(FIX_SECTION_PATTERN)
          || sentence.match(FIX_CAPTION_PATTERN)) {
        console.debug('splitSentences: fix sentence:', [sentence]);
        return [sentence, ' '];
      }
      return [sentence, '\n'];
    })
    .join('');
};

// open DeepL tab
const ESCAPE_PATTERN = /([/|\\])/g;
const openDeepLTab = async (sourceText: string) => {
  const config = await getConfig();
  const splitted = config.isSplit ? splitSentences(sourceText) : sourceText;
  const truncated = config.maxSourceText && config.maxSourceText > 0
    ? splitted.substring(0, config.maxSourceText) : splitted;
  // slash, pipe and backslash need to be escaped by backslash
  // TODO: other characters?
  const escaped = truncated.replace(ESCAPE_PATTERN, '\\$1');
  const encoded = encodeURIComponent(escaped);
  const deepLTabId = config.deepLTabId ?? DEFAULT_CONFIG.deepLTabId ?? chrome.tabs.TAB_ID_NONE;
  if (!config.deepLTabParams) throw new Error('background.ts: Invalid config.deepLTabParams');
  const tab = await openTab(
    `${config.urlBase}#${config.sourceLang}/${config.targetLang}/${encoded}`,
    deepLTabId,
    config.deepLTabParams,
  );
  setConfig({ deepLTabId: tab.id ? tab.id : chrome.tabs.TAB_ID_NONE });
  return tab;
};

// open translation tab
const openTranslationTab = async () => {
  const config = await getConfig();
  if (!config.translationHTML) throw new Error('background.ts: Invalid config.translationHTML');
  const translationTabId = config.translationTabId
    ?? DEFAULT_CONFIG.translationTabId ?? chrome.tabs.TAB_ID_NONE;
  if (!config.translationTabParams) throw new Error('background.ts: Invalid config.translationTabParams');
  const tab = await openTab(config.translationHTML, translationTabId, config.translationTabParams);
  setConfig({ translationTabId: tab.id ? tab.id : chrome.tabs.TAB_ID_NONE });
  return tab;
};

// injection function which will be executed in specific tab (not background.ts)
const injectionFunction = () => {
  const selection = window.getSelection();
  if (!selection) return '';
  const selectionText = selection.toString().trim();
  if (selectionText) return selectionText;
  const hover = Array.from(document.querySelectorAll(':hover')).pop();
  if (!hover) return '';
  const hoverText = hover.textContent?.trim();
  if (!hoverText) return '';
  const range = new Range();
  range.selectNode(hover);
  selection.removeAllRanges();
  selection.addRange(range);
  const rangeText = selection.toString().trim();
  // TODO: this can reduce clicks but make user hard to know what happened
  // selection.removeAllRanges();
  return rangeText;
};

// get selection text by injection
// https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#executing-arbitrary-strings
const getSelectionByInjection = async (tabId: number) => new Promise<string>((resolve, reject) => {
  chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: injectionFunction,
  }, (results) => {
    if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
    if (!results) return reject(new Error('background.ts: Empty results (injection)'));
    const hit = results.find((r) => r.result.trim());
    if (hit) return resolve(hit.result.trim());
    return reject(new Error('background.ts: Could not get any selection text (injection)'));
  });
});

const getSelectionByMessage = async (tabId: number) => {
  chrome.tabs.sendMessage(tabId, {
    message: 'getSelection',
  }, (response: { message: string }) => {
    console.debug(chrome.runtime.lastError?.message ?? `background.ts: got message: ${response.message}`);
  });
};

// heuristic method to remove newline between 2 texts.
// if it's a section text, leave newline.
// if it's a regular text and next sentence is also a regular text, remove newline.
const SECTION_PATTERN = /^((\d+\.)+|[IVX]+(\.\d+)*)\s+[A-Z].*[^.]$/;
const isSection = (sentence: string) => !!sentence.match(SECTION_PATTERN);
const CAPTION_PATTERN = /^(Figure|Table)\s+\d+[.:].*$/;
const isCaption = (sentence: string) => !!sentence.match(CAPTION_PATTERN);
const EXCLUDE_PATTERN = /^(a|an|the|by|in|on|at|to|of|as|for|via|over|with|without|from|into|upon|under|between|through|or|and|not|[(-]?[\d.]+[),]?|[*∗])$/;
const CAPITAL_PATTERN = /^[A-Z].*$/;
// how much sentence includes capital letters
const capitalRatio = (sentence: string) => {
  const words = sentence.split(' ').filter((t) => !t.match(EXCLUDE_PATTERN));
  if (words.length === 0) return 0.0;
  return words.filter((t) => t.match(CAPITAL_PATTERN)).length / words.length;
};
const removeNewlines = (text: string) => {
  const sentences = text.split('\n');
  const crs = sentences.map(capitalRatio);
  return sentences
    .flatMap((sentence, i) => { // flatMap is ES2019
      if (isSection(sentence)) return [sentence, '\n']; // current sentence is a section
      const nextSentence = sentences[i + 1] ?? '';
      if (isSection(nextSentence)) return [sentence, '\n']; // next sentence is a section
      if (isCaption(nextSentence)) return [sentence, '\n']; // next sentence is a caption. not current!!!
      const currentCr = crs[i] ?? 0.0; // how much current sentence includes capital letters
      const nextCr = crs[i + 1] ?? 0.0; // how much next sentence includes capital letters
      // remove newline between 2 regular sentences (regular sentence === capital ratio is small)
      if (currentCr < 0.66 && nextCr < 0.66) return [sentence, ' '];
      // console.debug(
      //   'removeNewLines: should be a section (capital ratio >= 0.66):',
      //   [currentCr, sentence, nextCr, nextSentence],
      // );
      return [sentence, '\n'];
    })
    .join('');
};

// send startTranslation message to translation.html
const sendStartTranslation = (tabId: number) => {
  chrome.tabs.sendMessage(tabId, {
    message: 'startTranslation',
  }, (response: { message: string }) => {
    console.debug(chrome.runtime.lastError?.message ?? `background.ts: got message: ${response.message}`);
  });
};

// translate source text
const translateText = async (source: string) => {
  await openDeepLTab(source);
  // now, deepl.ts will send message to translation.tsx
  const tab = await openTranslationTab();
  // TODO: 1000 ms is just enough for my PC
  return tab.status !== 'complete' ? setTimeout(() => tab.id && sendStartTranslation(tab.id), 1000) : tab.id && sendStartTranslation(tab.id);
};

// chrome.i18n.getMessage does not work in service_worker in manifest v3
// https://groups.google.com/a/chromium.org/g/chromium-extensions/c/dG6JeZGkN5w
const i18nGetMessage = (messageName: 'deepl_menu_title'): string => {
  if (messageName === 'deepl_menu_title') {
    return navigator.language === 'ja' ? 'DeepL 翻訳' : 'DeepL Translate';
  }
  throw new Error('background.ts: Unknown message');
};

const setBadge = (color: '#FF0000' | '#0000FF', text: 'C' | 'I' | 'M' | 'X') => {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
};

// initialize extension event
// https://developer.chrome.com/docs/extensions/mv3/background_pages/#listeners
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'deepl-menu',
    title: i18nGetMessage('deepl_menu_title'),
    contexts: ['selection'],
  });
  // must reset. old tabId should be invalid
  setConfig({ deepLTabId: chrome.tabs.TAB_ID_NONE });
  setConfig({ translationTabId: chrome.tabs.TAB_ID_NONE });
  return true;
});

// context menu event
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== 'deepl-menu') return true;
  try {
    if (!info || !info.selectionText) throw new Error('background.ts: Invalid info');
    translateText(info.selectionText);
    setBadge('#0000FF', 'C');
  } catch (err) {
    console.debug(err);
    setBadge('#FF0000', 'X');
  }
  return true;
});

// keyboard shortcut event
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'deepl-open') return true;
  try {
    if (!tab || !tab.id) throw new Error('background.ts: Invalid tab');
    translateText(await getSelectionByInjection(tab.id));
    setBadge('#0000FF', 'I');
  } catch (err) {
    // console.debug(err); // it's too frequent to show
    if (tab && tab.id) getSelectionByMessage(tab.id);
    setBadge('#FF0000', 'X');
  }
  return true;
});

// message event
chrome.runtime.onMessage.addListener(async (request: { message: 'setSelection', selectedText: string }, _, sendResponse: (response: { message: string }) => void) => {
  if (request.message !== 'setSelection') return true;
  // receive message from pdf.ts
  try {
    const text = request.selectedText.trim();
    if (!text) throw new Error('background.ts: Could not get any selection text (message)');
    const removed = removeNewlines(text);
    translateText(removed);
    setBadge('#0000FF', 'M');
  } catch (err) {
    console.debug(err);
    setBadge('#FF0000', 'X');
  }
  sendResponse({ message: 'background.ts: setSelection: done' });
  return true;
});

// window move/resize event
chrome.windows.onBoundsChanged.addListener(async (window) => {
  const config = await getConfig();
  if (!config.translationTabParams || !config.translationTabParams.createWindow) return true;
  if (!config.translationTabId || config.translationTabId === chrome.tabs.TAB_ID_NONE) return true;
  try {
    const translationTab = await chrome.tabs.get(config.translationTabId);
    const translationWindow = await chrome.windows.get(translationTab.windowId);
    if (window.id !== translationWindow.id) return true;
    const params = {
      ...config.translationTabParams,
      createWindow: {
        ...config.translationTabParams.createWindow,
        left: window.left,
        top: window.top,
        width: window.width,
        height: window.height,
      },
    };
    setConfig({ translationTabParams: params });
  } catch (err) {
    console.debug(err);
  }
  return true;
});
