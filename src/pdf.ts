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

// Get selected text via PDFScriptingAPI of default Chrome's PDF viewer (PDFium).
//
// If you send 'getSelectedText' message to PDFScriptingAPI,
// then it will send back 'getSelectedTextReply' message with 'selectedText'
//
// PDFScriptingAPI is accessible via postMessage.
// There are several APIs like 'getSelectedText', 'selectAll', etc.
//
// https://source.chromium.org/chromium/chromium/src/+/master:chrome/browser/resources/pdf/pdf_scripting_api.js
// https://stackoverflow.com/a/61076939
//
// It needs the window object of the PDF viewer to call postMessage.
// The problem is that there is no direct method to get the window.
// But there is a workaround using window.frames, frameElement and embed element.
// See details at [note 1] of this post.
//
// https://github.com/whatwg/html/issues/7140#issue-1013085041
//
// Also, see API docs.
//
// https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#syntax
// https://developer.mozilla.org/en-US/docs/Web/API/Window/frames#syntax
//
// TODO: this code does not work on local PDF (file:///*.pdf) because of cross-origin limitation

const PDF_ORIGIN = 'chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai';

const pdfEmbed = document.querySelector('embed');
const pdfWindow = (() => {
  try {
    // TODO: sometimes this got error
    return Array.from(window.frames).find(f => f.frameElement === pdfEmbed);
  } catch (err) {
    console.debug(err);
    return window.frames[0];
  }
})();

if (!(pdfEmbed && pdfWindow)) throw 'Invalid PDFScriptingAPI';

chrome.runtime.onMessage.addListener((request: {message: string}, _, sendResponse: (response: {message: string}) => void) => {
  if (request.message === 'getSelection') {
    pdfWindow.postMessage({type: 'getSelectedText'}, PDF_ORIGIN);
    sendResponse({message: 'pdf.ts: getSelection: done'});
  }
  return true;
});

// PDFScriptingAPI will send back 'getSelectedTextReply' if it receives 'getSelectedText'
window.addEventListener('message', (event: MessageEvent<{type: string, selectedText: string}>) => {
  if (event.origin === PDF_ORIGIN && event.data.type === 'getSelectedTextReply') {
    chrome.runtime.sendMessage({
      message: 'setSelection',
      selectedText: event.data.selectedText,
    }, (response: {message: string}) => {
      console.debug(chrome.runtime.lastError?.message ??
        `pdf.ts: got message: ${response.message}`);
    });
  }
}, false);
