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

// this script just pass through the message between background.js and web page
//
// background.js send 'getSelection' message to web page via selection.js
//
// background.js --> selection.js --> web page (bookmarklet.js)
//
// then, bookmarklet.js try to get selection text
// and send 'setSelection' message back to background.js via selection.js
//
// background.js <-- selection.js <-- web page (bookmarklet.js )
//
// sendMessage/onMessage are used between background.js and selection.js
//
// https://developer.chrome.com/docs/extensions/mv3/messaging/
// https://developer.chrome.com/docs/extensions/reference/runtime/#method-sendMessage
// https://developer.chrome.com/docs/extensions/reference/runtime/#event-onMessage
//
// postMessage/addEventListener are used between selection.js and web page
//
// https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener


// receive message from background.js
// then send message to the web page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'getSelection') {
    window.postMessage(request, window.location.origin);
    sendResponse({ message: 'selection.js: getSelection: done' });
  }
  return true;
});

// receive message from the web page
// then send message to background.js
window.addEventListener('message', (event) => {
  if (event.origin === window.location.origin &&
      event.data.message === 'setSelection') {
    chrome.runtime.sendMessage(event.data, (response) => {
      if (chrome.runtime.lastError) {
        console.debug(chrome.runtime.lastError.message);
      } else {
        console.debug(response.message);
      }
    });
  }
}, false);


const text = 'DeepLKey: Install and run bookmarklet from https://github.com/susumuota/deeplkey';
console.log(text);
// alert(text);  // TODO: find a way to notify without annoying
