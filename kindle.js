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

// receive message from background.js
// then post message to bookmarklet.js
// https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
// https://sekailab.com/wp/2020/03/25/deepl-translation-with-kindle-cloud-reader/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'getSelection') {
    window.postMessage('getSelection', 'https://read.amazon.co.jp');
    sendResponse({ message: 'kindle.js: getSelection: done' });
  }
  return true;
});

// receive message from bookmarklet.js
// then send message to background.js
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
const receiveMessage = (event) => {
  if (event.origin === 'https://read.amazon.co.jp' &&
      event.data.match(/^setSelection: /)) {
    chrome.runtime.sendMessage({
      message: 'setSelection',
      selection: event.data.replace(/^setSelection: /, '')
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.debug(chrome.runtime.lastError.message);
      } else {
        console.debug(response.message);
      }
    });
  }
};

window.addEventListener('message', receiveMessage, false);
