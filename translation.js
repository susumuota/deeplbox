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

const insertText = (id, text) => {
  const div = document.querySelector(id);
  if (!div) return; // user may delete div in translation.html
  div.textContent = ''; // comment out if you want to keep previous text
  const p = document.createElement('p');
  for (const s of text.split('\n')) {
    const span = document.createElement('span');
    span.textContent = s;
    p.insertAdjacentElement('beforeend', span);
    p.insertAdjacentElement('beforeend', document.createElement('br'));
  }
  div.insertAdjacentElement('beforeend', p);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message == 'setTranslation') {
    insertText('#translation', request.translation);
    insertText('#source', request.source);
    sendResponse({message: 'translation.js: setTranslation: done'});
  }
  return true;
});
