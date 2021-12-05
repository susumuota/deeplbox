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

// insert source and translation text to div position
const insertResults = (elm, source, translation) => {
  const addAttribute = (elm, name, value) => {
    const attr = document.createAttribute(name);
    attr.value = value;
    elm.setAttributeNode(attr);
  }
  const insertDiv = (elm, text, classAttr, dataAltAttr) => {
    const div = document.createElement('div');
    addAttribute(div, 'class', classAttr);
    addAttribute(div, 'data-alt', dataAltAttr);
    div.textContent = text;
    elm.insertAdjacentElement('beforeend', div);
  }
  const insertPair = (elm, source, translation) => {
    const div = document.createElement('div');
    addAttribute(div, 'class', 'pair');
    insertDiv(div, translation, 'translation', source);
    insertDiv(div, source, 'source', translation); // swap source and translation
    elm.insertAdjacentElement('beforeend', div);
  }
  // elm.textContent = ''; // comment out this if you want to clear previous text
  const div = document.createElement('div');
  addAttribute(div, 'class', 'item');
  // split by newlines, and combine source and translation
  const ss = source.split('\n');
  const ts = translation.split('\n');
  console.assert(ss.length === ts.length); // is this always true?
  if (ss.length !== ts.length) console.debug('ss.length !== ts.length', ss.length, ts.length);
  for (let i = 0; i < Math.max(ss.length, ts.length); i++) {
    const s = ss[i] || '';
    const t = ts[i] || '';
    if (s.trim() || t.trim()) {  // skip if both s and t are empty
      insertPair(div, s, t);
    }
  }
  div.insertAdjacentElement('beforeend', document.createElement('hr'));
  elm.insertAdjacentElement('beforeend', div);
}

const setCSS = (css) => {
  let style = document.querySelector('head style');
  if (!style) {
    style = document.createElement('style');
    document.head.appendChild(style);
  }
  style.textContent = css;
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.message === 'setTranslation') {
    // receive message from deepl.js, then insert results on div element
    const config = await getConfig();
    setCSS(config.translationCSS || '');
    const content = document.querySelector('#content');
    insertResults(content, request.source, request.translation);
    sendResponse({ message: 'translation.js: setTranslation: done' });
  }
  return true;
});

window.addEventListener('load', async () => {
  const config = await getConfig();
  setCSS(config.translationCSS || '');
  const clearButton = document.getElementById('clear_button');
  clearButton.addEventListener('click', (event) => {
    const content = document.querySelector('#content');
    content.textContent = '';
  });
});
