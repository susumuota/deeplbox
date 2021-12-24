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

// get selected text via PDFium's PDFScriptingAPI
// send 'getSelectedText' message then receive 'getSelectedTextReply' message
// https://source.chromium.org/chromium/chromium/src/+/master:chrome/browser/resources/pdf/pdf_scripting_api.js
const PDFIUM_ORIGIN = 'chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai';

window.addEventListener('message', (event) => {
  if (event.origin === PDFIUM_ORIGIN && event.data.type === 'getSelectedTextReply') {
    chrome.runtime.sendMessage({
      message: 'setSelection',
      selectedText: event.data.selectedText,
    }, (response) => {
      console.debug(chrome.runtime.lastError?.message ??
        `pdf.ts: got message: ${response.message}`);
    });
  }
}, false);

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.message === 'getSelection' && window.frames[0]?.postMessage) {
    // PDFium plugin is accessible via postMessage but it's not window.postMessage but embed.postMessage
    // document.querySelector('embed').postMessage does not work but window.frames[0].postMessage works
    // see details at this post [note 1]
    // https://github.com/whatwg/html/issues/7140#issue-1013085041
    // TODO: this code does not work on local PDF (file:///*.pdf)
    window.frames[0].postMessage({type: 'getSelectedText'}, PDFIUM_ORIGIN);
    sendResponse({message: 'pdf.ts: getSelection: done'});
  }
  return true;
});
