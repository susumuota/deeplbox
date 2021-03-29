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

// bookmarklet ideas come from
//
// https://github.com/ccimpoi/ACRExtensions
// https://github.com/motiko/kcr-translate-ext
// https://sekailab.com/wp/2020/03/25/deepl-translation-with-kindle-cloud-reader/

'use strict';

// receive message from background.js
// then post message to kindle-bookmarklet.js
// https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'getSelection') {
    window.postMessage(request, window.location.origin);
    sendResponse({ message: 'kindle.js: getSelection: done' });
  }
  return true;
});

console.log('DeepLKey: Install bookmarklet from https://github.com/susumuota/deeplkey/blob/main/kindle-bookmarklet.js');
