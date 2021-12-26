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
      // update tab
      if (params.updateTab) {
        const updatedTab = await chrome.tabs.update(tabId, { ...params.updateTab, url });
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
    const createdTab = await chrome.tabs.create({ ...params.createTab, url });
    if (params.createWindow) {
      chrome.windows.create({ ...params.createWindow, tabId: createdTab.id });
    }
    return createdTab;
  }
  // something is wrong at params
  throw new Error('background.ts: Invalid openTab params');
};

// insert 2 newlines between sentences
// TODO: sophisticated way
const splitSentences = (text: string) => {
  if (!text) return text;
  const splitted = text.replace(/([.?!]+)\s+/g, '$1\n\n');
  // TODO: more abbreviations
  const fixed = splitted.replace(/(\n\d+\.|^\d+\.|et al\.|e\.g\.|i\.e\.|ibid\.|cf\.|n\.b\.|etc\.|\smin\.|Fig\.|\sfig\.|Figure\.|Figure \d+\.|Table\.|Table \d+\.|No\.|B\.C\.|A\.D\.|B\.C\.E\.|C\.E\.|approx\.|\spp\.|\spt\.|\sft\.|\slb\.|\sgal\.|P\.S\.|p\.s\.|a\.k\.a\.|Mr\.|Mrs\.|Ms\.|Dr\.|Ph\.D\.|St\.|U\.S\.|U\.K\.|Ave\.|Apt\.|a\.m\.|p\.m\.)\n\n/g, '$1 ');
  return fixed;
};

// open DeepL tab
const openDeepLTab = async (sourceText: string) => {
  const config = await getConfig();
  const splitted = config.isSplit ? splitSentences(sourceText) : sourceText;
  const truncated = config.maxSourceText && config.maxSourceText > 0
    ? splitted.substring(0, config.maxSourceText) : splitted;
  // slash, pipe and backslash need to be escaped by backslash
  // TODO: other characters?
  const escaped = truncated.replace(/([/|\\])/g, '\\$1');
  const encoded = encodeURIComponent(escaped);
  const deepLTabId = config.deepLTabId ?? DEFAULT_CONFIG.deepLTabId ?? chrome.tabs.TAB_ID_NONE;
  if (!config.deepLTabParams) throw Error('background.ts: Invalid config.deepLTabParams');
  const tab = await openTab(`${config.urlBase}#${config.sourceLang}/${config.targetLang}/${encoded}`, deepLTabId, config.deepLTabParams);
  setConfig({ deepLTabId: tab.id ? tab.id : chrome.tabs.TAB_ID_NONE });
  return tab;
};

// open translation tab
const openTranslationTab = async () => {
  const config = await getConfig();
  if (!config.translationHTML) throw Error('background.ts: Invalid config.translationHTML');
  const translationTabId = config.translationTabId
    ?? DEFAULT_CONFIG.translationTabId ?? chrome.tabs.TAB_ID_NONE;
  if (!config.translationTabParams) throw Error('background.ts: Invalid config.translationTabParams');
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
    if (chrome.runtime.lastError) reject(Error(chrome.runtime.lastError.message));
    const hit = results.find((r) => r.result.trim());
    if (hit) resolve(hit.result.trim());
    reject(new Error('background.ts: Could not get any selection text (injection)'));
  });
});

const getSelectionByMessage = async (tabId: number) => {
  chrome.tabs.sendMessage(tabId, {
    message: 'getSelection',
  }, (response: { message: string }) => {
    console.debug(chrome.runtime.lastError?.message ?? `background.ts: got message: ${response.message}`);
  });
};

// heuristic method to remove new lines between 2 plain sentences.
// it should remove new line after a plain sentence if next sentence is also plain text.
//   e.g. "This is a something\nlike object".
// it should not remove new line after chapter title which text is started by capital case.
//   e.g. "Abstract\nWe explore something".
// if it is less capital word (calculated by `capitalRatio`),
// it should be a plain sentence, not a chapter title.
// TODO: sophisticated way
const removeNewlines = (text: string) => {
  const capitalRatio = (sentence: string) => {
    const words = sentence.split(' ').filter((t) => !t.match(/\(?\d+\)?/)); // remove numbers
    return words.filter((t) => t.match(/[A-Z].*/)).length / words.length; // ratio of of capital words
  };
  const sentences = text.split('\n');
  const crs = sentences.map(capitalRatio);
  return sentences
    .flatMap((sentence, i) => { // ES2019
      const crCurrent = crs[i] ?? 0.0;
      const crNext = crs[i + 1] ?? 0.0;
      // if the sentence includes less capital words,
      // it should be a plain sentence, not a chapter title.
      // if there are 2 plain sentences, replace newline to space between them.
      return [sentence, (crCurrent < 0.5 && crNext < 0.5) ? ' ' : '\n'];
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
  // now, deepl.ts will send message to translation.tsx (and background.ts)
  const tab = await openTranslationTab();
  // TODO: 1000 ms is just enough for my PC
  return tab.status !== 'complete' ? setTimeout(() => tab.id && sendStartTranslation(tab.id), 1000) : tab.id && sendStartTranslation(tab.id);
};

// chrome.i18n.getMessage does not work in service_worker in manifest v3
// https://groups.google.com/a/chromium.org/g/chromium-extensions/c/dG6JeZGkN5w
// TODO: other messages if needed
const i18nGetMessage = (messageName: 'deepl_menu_title'): string => {
  if (messageName === 'deepl_menu_title') {
    return navigator.language === 'ja' ? 'DeepL 翻訳' : 'DeepL Translate';
  }
  throw Error('background.ts: Unknown message');
};

const setBadge = (color: '#FF0000' | '#0000FF', text: 'C' | 'K' | 'M' | 'X') => {
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
    if (!info || !info.selectionText) throw Error('background.ts: Invalid info');
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
  console.debug(command, tab);
  if (command !== 'deepl-open') return true;
  try {
    if (!tab || !tab.id) throw Error('background.ts: Invalid tab');
    translateText(await getSelectionByInjection(tab.id));
    setBadge('#0000FF', 'K');
  } catch (err) {
    console.debug(err);
    if (tab && tab.id) getSelectionByMessage(tab.id);
    setBadge('#FF0000', 'X');
  }
  return true;
});

// message event
chrome.runtime.onMessage.addListener(async (request: { message: 'setSelection', selectedText: string }, _, sendResponse: (response: { message: string }) => void) => {
  if (request.message !== 'setSelection') return true;
  try {
    const text = request.selectedText.trim();
    if (!text) throw Error('background.ts: Could not get any selection text (message)');
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
