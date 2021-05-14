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

const DARK_THEME_CSS = 'html { background-color: #121212; color: darkgray; } div.source { color: skyblue; }';

// send css to translation.js
const setCSS = (css) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      message: 'setCSS',
      css: css
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (response) {
        resolve(response);
      }
      reject('Empty response');
    });
  });
}


window.addEventListener('load', async () => {
  const sourceLang = document.getElementById('source_lang');
  const targetLang = document.getElementById('target_lang');
  const themeLight = document.getElementById('theme_light');
  const themeDark = document.getElementById('theme_dark');
  const windowPosition = document.getElementById('window_position');
  const message = document.getElementById('message');
  const config = await getConfig();

  // set current values
  if (config.sourceLang && config.sourceLang !== 'en') {
    document.getElementById(`source_lang_${config.sourceLang}`).selected = true;
  }
  if (config.targetLang && config.targetLang !== 'auto') {
    document.getElementById(`target_lang_${config.targetLang}`).selected = true;
  }
  if (!config.translationCSS) {
    themeLight.checked = true;
  } else if (config.translationCSS === DARK_THEME_CSS) {
    themeDark.checked = true;
  } else {
    // TODO: what to do?
  }

  // event listeners
  sourceLang.addEventListener('change', (event) => {
    console.assert(sourceLang.value);
    setConfig({sourceLang: sourceLang.value});
    message.textContent = `Source Language: "${sourceLang.value}". This change will take effect in the next translation.`;
  });
  targetLang.addEventListener('change', (event) => {
    console.assert(targetLang.value);
    setConfig({targetLang: targetLang.value});
    message.textContent = `Target Language: "${targetLang.value}". This change will take effect in the next translation.`;
  });
  const addEventListenerToTheme = (elm, css) => {
    elm.addEventListener('change', async (event) => {
      console.assert(elm.value);
      message.textContent = 'Applying Color Theme...';
      setConfig({translationCSS: css});
      try {
        await setCSS(css === null ? '' : css); // apply css immediately
      } catch (err) {
        console.log(err);
      }
      message.textContent = `Color Theme: "${elm.value}"`;
    });
  };
  addEventListenerToTheme(themeLight, null);
  addEventListenerToTheme(themeDark, DARK_THEME_CSS);
  windowPosition.addEventListener('click', async (event) => {
    const config = await getConfig();
    if (!config.translationTabParams.createWindow) {
      message.textContent = 'Translation window disabled.';
      return;
    }
    if (config.translationTabId === chrome.tabs.TAB_ID_NONE) {
      message.textContent = 'No translation window. Try to translate first.';
      return;
    }
    try {
      const translationTab = await chrome.tabs.get(config.translationTabId);
      const translationWindow = await chrome.windows.get(translationTab.windowId);
      const params = deepCopy(config.translationTabParams);
      params.createWindow['left'] = translationWindow.left;
      params.createWindow['top'] = translationWindow.top;
      params.createWindow['width'] = translationWindow.width;
      params.createWindow['height'] = translationWindow.height;
      setConfig({translationTabParams: params});
      message.textContent = `Window Position: {left: ${translationWindow.left}, top: ${translationWindow.top}, width: ${translationWindow.width}, height: ${translationWindow.height}}`;
    } catch (err) {
      console.debug(err);
      message.textContent = 'No translation window. Try to translate first.';
    }
  });
});
