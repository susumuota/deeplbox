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

const source: any = document.querySelector('#source-dummydiv');
const target: any = document.querySelector('#target-dummydiv');

if (source && target) {
  // monitor source/target textarea and when its content is changed,
  // send message to translation.js (and background.js)
  // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
  const observer = new MutationObserver((mutations, obs) => {
    if (target.textContent && target.textContent.trim()) {
      chrome.runtime.sendMessage({
        message: 'setTranslation',
        source: source.textContent.trim(),
        translation: target.textContent.trim()
      }, (response) => {
        console.debug('deepl.ts: got message: ', response.message);
      });
    }
  });
  observer.observe(target, { childList: true });
} else {
  console.debug('Could not find #source-dummydiv or #target-dummydiv.');
}
