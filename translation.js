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
    insertDiv(elm, translation, 'translation', source);
    insertDiv(elm, source, 'source', translation); // swap source and translation
  }
  elm.textContent = ''; // comment out this if you want to keep previous text
  // split by newlines, and combine source and translation
  const ss = source.split('\n');
  const ts = translation.split('\n');
  console.assert(ss.length === ts.length); // is this always true?
  if (ss.length !== ts.length) console.debug('ss.length !== ts.length', ss.length, ts.length);
  for (let i = 0; i < Math.max(ss.length, ts.length); i++) {
    const s = ss[i] || '';
    const t = ts[i] || '';
    if (s.trim() || t.trim()) {  // skip if both s and t are empty
      const item = document.createElement('div');
      addAttribute(item, 'class', 'item');
      insertPair(item, s, t);
      elm.insertAdjacentElement('beforeend', item);
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'setTranslation') {
    // receive message from deepl.js, then insert results on div element
    const results = document.querySelector('#results');
    insertResults(results, request.source, request.translation);
    sendResponse({ message: 'translation.js: setTranslation: done' });
  } else if (request.message === 'setCSS') {
    // receive message from background.js, then append style on head element
    let style = document.querySelector('head style');
    if (!style) {
      style = document.createElement('style');
      document.head.appendChild(style);
    }
    style.textContent = request.css;
    sendResponse({ message: 'translation.js: setCSS: done' });
  }
  return true;
});
