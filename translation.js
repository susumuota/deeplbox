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
const insertResults = (div, source, translation) => {
  const addAttribute = (elm, name, value) => {
    const attr = document.createAttribute(name);
    attr.value = value;
    elm.setAttributeNode(attr);
  }
  const insertSpan = (elm, text, classAttr, dataAltAttr) => {
    // insertSpan makes a span like this
    //
    // <span class="translation", data-alt="source">translation<br /></span>
    //
    // this data-alt can be used to show source text when mouse hover
    // and make it more fancy by css like this
    //
    // span.translation:after {
    //   content: attr(data-alt);
    // }
    //
    // see translation.css
    const span = document.createElement('span');
    addAttribute(span, 'class', classAttr);
    addAttribute(span, 'data-alt', dataAltAttr);
    span.textContent = text;
    span.insertAdjacentElement('beforeend', document.createElement('br'));
    elm.insertAdjacentElement('beforeend', span);
  }
  const insertPair = (elm, source, translation) => {
    insertSpan(elm, translation, 'translation', source);
    insertSpan(elm, source, 'source', translation); // swap source and translation
  }
  div.textContent = ''; // comment out this if you want to keep previous text
  // split by newlines, and combine source and translation
  const ss = source.split('\n');
  const ts = translation.split('\n');
  // console.assert(ss.length === ts.length); // is this always true?
  if (ss.length != ts.length) console.debug('ss.length != ts.length', ss.length, ts.length);
  for (let i = 0; i < Math.max(ss.length, ts.length); i++) {
    const s = i in ss ? ss[i] : '';
    const t = i in ts ? ts[i] : '';
    if (s.trim() || t.trim()) {  // skip if both s and t are empty
      const p = document.createElement('p');
      insertPair(p, s, t);
      div.insertAdjacentElement('beforeend', p);
    }
  }
}

// receive message from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'setTranslation') {
    const div = document.querySelector('#results');
    insertResults(div, request.source, request.translation);
    sendResponse({ message: 'translation.js: setTranslation: done' });
  }
  return true;
});
