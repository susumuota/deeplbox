javascript: (() => {

/*

# DeepLKey bookmarklet for Kindle Cloud Reader

If you want to use DeepLKey on Kindle Cloud Reader (e.g. https://read.amazon.com/), you need to setup this bookmarklet properly.

## Settings

- Rewrite `EXTENSION_ID` if needed (see below)
- Copy whole this script to clipboard
- Create a bookmark on a random page
- Edit the bookmark
  - Change the bookmark name to `DeepL Kindle`
  - Paste clipboard content at `URL`
- Save the bookmark

### Rewrite `EXTENSION_ID`

If you downloaded DeepLKey from Chrome Web Store, you don't have to change the ID. It should be like thw following.

const EXTENSION_ID = 'ompicphdlcomhddpfbpnhnejhkheeagf';

But if you downloaded DeepLKey from github, you *MUST* change the ID.

- Open Chrome's extensions setting page `chrome://extensions`
- Turn `Developer mode` on
- Find `ID: ...`
- Specify it to `EXTENSION_ID`

## Usage

- Every time you open Kindle Cloud Reader, run the bookmark `DeepL Kindle`
- Dialog should appear, then press `OK`
- Select text by mouse
- Press `Command-b` (macOS) or `Control-b` (other OS)
- Then DeepL tab or window will appear
- If you find anything wrong, confirm console log by pressing F12

## Limitations

- Only tested on https://read.amazon.com/ and https://read.amazon.co.jp/
- Kindle Cloud Reader may change their document structure, etc.

*/

  /* rewrite EXTENSION_ID if needed */
  const EXTENSION_ID = 'ompicphdlcomhddpfbpnhnejhkheeagf';


  const NAME = 'DeepLKey: kindle-bookmarklet.js';
  const VERSION = '1.5.0';

  if (window.deeplkey) {
    const text = `${NAME} ${VERSION}: already loaded`;
    console.debug(text);
    alert(text);
    return;
  }

  const getKindleWindow = (window) => {
    if (window.KindleReaderUI) { return window; }
    const kw = Array.from(window).find((w) => w.KindleReaderUI);
    if (kw) { return kw; }
    throw new Error('No Kindle window');
  };

  const findRange = (window, start, end) => {
    const s = window.document.querySelector(`[id="${start}"]`);
    if (!s) { return null; }
    const e = window.document.querySelector(`[id="${end}"]`);
    if (!e) { return null; }
    const range = window.document.createRange();
    range.setStartBefore(s);
    range.setEndAfter(e);
    return range;
  };

  const getSpanContents = (elm) => {
    const spans = elm.querySelectorAll('span.k4w');
    if (spans.length === 0) { return elm.textContent; }
    return Array.from(spans).map((span) => span.textContent).join(' ');
  };

  const getDivContents = (elm) => {
    const divs = elm.querySelectorAll('div.was-a-p,h1,h2,h3,h4,h5,h6');
    if (divs.length === 0) { return getSpanContents(elm); }
    return Array.from(divs).map((div) => getSpanContents(div)).join('\n');
  };

  const getKindleSelection = (window) => {
    const kw = getKindleWindow(window);
    const selection = kw.KindleReaderUI.getSelection();
    console.debug('kw.KindleReaderUI.getSelection(): ', selection);
    if (!selection) { throw Error('No selection text'); }
    for (let w of Array.from(kw)) {
      const range = findRange(w, selection.start, selection.end);
      if (!range) { continue; }
      console.debug('findRange(w, selection.start, selection.end): ', range);
      const contents = range.cloneContents();
      console.debug('range.cloneContents(): ', contents);
      const result = getDivContents(contents);
      console.debug('getDivContents(contents): ', result);
      return result;
    }
    throw Error('No selection text');
  };

  const receiveGetSelection = (event) => {
    if (event.origin === window.location.origin &&
        event.data.message === 'getSelection') {
      let selection = null;
      try {
        selection = getKindleSelection(window);
      } catch (err) {
        console.debug(err);
        selection = err.message;
      }
      chrome.runtime.sendMessage(EXTENSION_ID, {
        message: 'setSelection', selection: selection
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.debug(chrome.runtime.lastError.message);
        } else {
          console.debug(response.message);
        }
      });
    }
  };

  window.addEventListener('message', receiveGetSelection, false);
  window.deeplkey = true;

  const text = `${NAME} ${VERSION}: loaded`;
  console.debug(text);
  alert(text);

})();
