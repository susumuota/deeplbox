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

import {getConfig, setConfig} from './config';

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
  // something is wrong at params
  throw 'Invalid openTab params';
}

// open DeepL tab
const openDeepLTab = async (sourceText: string) => {
  const config = await getConfig();
  const splitted = config.isSplit ? splitSentences(sourceText) : sourceText;
  const truncated = config.maxSourceText > 0 ? splitted.substring(0, config.maxSourceText) : splitted;
  // slash, pipe and backslash need to be escaped by backslash
  // TODO: other characters?
  const escaped = truncated.replace(/([\/\|\\])/g, '\\$1');
  const encoded = encodeURIComponent(escaped);
  const tab = await openTab(`${config.urlBase}#${config.sourceLang}/${config.targetLang}/${encoded}`, config.deepLTabId, config.deepLTabParams);
  setConfig({deepLTabId: tab.id ? tab.id : chrome.tabs.TAB_ID_NONE}); // remember tab and reuse next time
  return tab;
}

// open translation tab
const openTranslationTab = async () => {
  const config = await getConfig();
  const tab = await openTab(config.translationHTML, config.translationTabId, config.translationTabParams);
  setConfig({translationTabId: tab.id ? tab.id : chrome.tabs.TAB_ID_NONE}); // remember tab and reuse next time
  return tab;
}

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
  // selection.removeAllRanges(); // TODO: this can reduce clicks but make user hard to know what happened
  return rangeText;
}

// get selection text by injection
// https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#executing-arbitrary-strings
const getSelectionByInjection = async (tabId: number) => {
  return new Promise<string>((resolve, reject) => {
    chrome.scripting.executeScript({
      target: {tabId: tabId, allFrames: true},
      func: injectionFunction,
    }, (results) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError.message);
      }
      if (!results) {
        return reject('Could not get any selection text');
      }
      for (const r of results) {
        const text = r.result?.trim();
        if (text) return resolve(text);
      }
      return reject('Could not get any selection text');
    });
  });
}

const getSelectionByMessage = async (tabId: number) => {
  chrome.tabs.sendMessage(tabId, {
    message: 'getSelection',
  }, (response) => {
    console.debug(chrome.runtime.lastError?.message ??
      `background.ts: got message: ${response.message}`);
  });
}

// insert 2 newlines between sentences
// TODO: sophisticated way
const splitSentences = (text: string) => {
  if (!text) return text;
  const splitted = text.replace(/([\.\?\!]+)\s+/g, '$1\n\n');
  // TODO: more abbreviations
  const fixed = splitted.replace(/(\n\d+\.|^\d+\.|et al\.|e\.g\.|i\.e\.|ibid\.|cf\.|n\.b\.|etc\.|\smin\.|Fig\.|\sfig\.|Figure\.|Table\.|No\.|B\.C\.|A\.D\.|B\.C\.E\.|C\.E\.|approx\.|\spp\.|\spt\.|\sft\.|\slb\.|\sgal\.|P\.S\.|p\.s\.|a\.k\.a\.|Mr\.|Mrs\.|Ms\.|Dr\.|Ph\.D\.|St\.|U\.S\.|U\.K\.|Ave\.|Apt\.|a\.m\.|p\.m\.)\n\n/g, '$1 ');
  return fixed;
}

// translate source text
const translateText = async (source: string) => {
  await openDeepLTab(source);
  const translationTab = await openTranslationTab();
  if (translationTab.id) {
    chrome.tabs.sendMessage(translationTab.id, {
      message: 'startTranslation'
    }, (response) => {
      console.debug(chrome.runtime.lastError?.message ??
        `background.ts: got message: ${response.message}`);
    });
  }
  // now, deepl.ts will send message to translation.tsx (and background.ts)
}

// chrome.i18n.getMessage does not work in service_worker in manifest v3
// https://groups.google.com/a/chromium.org/g/chromium-extensions/c/dG6JeZGkN5w
// TODO: other messages if needed
const getMessage = (messageName: 'deepl_menu_title'): string => {
  if (messageName === 'deepl_menu_title') {
    return 'ja' === navigator.language ? 'DeepL 翻訳' : 'DeepL Translate';
  } else {
    throw 'Unknown message';
  }
};

// initialize extension event
// https://developer.chrome.com/docs/extensions/mv3/background_pages/#listeners
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'deepl-menu',
    title: getMessage('deepl_menu_title'),
    contexts: ['selection']
  });
  // must reset. old tabId should be invalid
  setConfig({deepLTabId: chrome.tabs.TAB_ID_NONE});
  setConfig({translationTabId: chrome.tabs.TAB_ID_NONE});
  return true;
});

// context menu event
chrome.contextMenus.onClicked.addListener(async (info, _) => {
  if (info.menuItemId === 'deepl-menu') {
    try {
      if (!info || !info.selectionText) throw 'Invalid info';
      translateText(info.selectionText);
      chrome.action.setBadgeBackgroundColor({color: '#0000FF'});
      chrome.action.setBadgeText({text: 'C'});
    } catch (err) {
      console.debug(err);
      chrome.action.setBadgeBackgroundColor({color: '#FF0000'});
      chrome.action.setBadgeText({text: 'X'});
    }
  }
  return true;
});

// keyboard shortcut event
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'deepl-open') {
    try {
      if (!tab || !tab.id) throw 'Invalid tab';
      translateText(await getSelectionByInjection(tab.id));
      chrome.action.setBadgeBackgroundColor({color: '#0000FF'});
      chrome.action.setBadgeText({text: 'K'});
    } catch (err) {
      console.debug(err);
      if (tab && tab.id) getSelectionByMessage(tab.id);
      chrome.action.setBadgeBackgroundColor({color: '#FF0000'});
      chrome.action.setBadgeText({text: 'X'});
    }
  }
  return true;
});

// message event
chrome.runtime.onMessage.addListener(async (request, _, sendResponse) => {
  if (request.message === 'setSelection') {
    try {
      const text = request.selectedText.trim();
      if (!text) throw 'Could not get any selection text';
      translateText(text.replace(/\n/g, ' '));
      chrome.action.setBadgeBackgroundColor({color: '#0000FF'});
      chrome.action.setBadgeText({text: 'M'});
    } catch (err) {
      console.debug(err);
      chrome.action.setBadgeBackgroundColor({color: '#FF0000'});
      chrome.action.setBadgeText({text: 'X'});
    }
    sendResponse({message: 'background.ts: setSelection: done'});
  }
  return true;
});

// window move/resize event
chrome.windows.onBoundsChanged.addListener(async (window) => {
  const config = await getConfig();
  if (!config.translationTabParams.createWindow) return true;
  if (config.translationTabId === chrome.tabs.TAB_ID_NONE) return true;
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
    setConfig({translationTabParams: params});
  } catch (err) {
    console.debug(err);
  }
  return true;
});
