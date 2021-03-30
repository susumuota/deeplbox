javascript: (() => {

/*

# DeepLKey bookmarklet for Kindle Cloud Reader

If you want to use DeepLKey on Kindle Cloud Reader (e.g. https://read.amazon.com/), you need to setup this bookmarklet properly.

## Settings

- Copy whole this script to clipboard
- Create a bookmark on a random page
- Edit the bookmark
  - Change the bookmark name to `DeepL Kindle`
  - Paste clipboard content at `URL`
- Save the bookmark

## Usage

- Every time you open Kindle Cloud Reader, run the bookmark `DeepL Kindle`
- Dialog should appear, then press `OK`
- Select text by mouse
- Press `Command-b` (macOS) or `Control-b` (other OS)
- Then DeepL tab or window will appear
- If you find anything wrong, confirm console log by pressing F12

## Limitations

- Only tested on https://read.amazon.com/ and https://read.amazon.co.jp/
- Kindle Cloud Reader may change their document structure, etc in future.

## Links

Bookmarklet ideas come from:

- https://github.com/ccimpoi/ACRExtensions
- https://github.com/motiko/kcr-translate-ext
- https://sekailab.com/wp/2020/03/25/deepl-translation-with-kindle-cloud-reader/

*/

  const NAME = 'DeepLKey: kindle-bookmarklet.js';
  const VERSION = '1.5.5';

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

  const getTextContent = (documentFragment) => {
    const getInnerText = (elm) => {
      /* TODO: any other special cases? */
      const as = elm.querySelectorAll('a.filepos_src');
      Array.from(as).forEach((a) => a.innerText = ` ${a.innerText} `);
      return elm.innerText;
    };
    /* TODO: is this selector enough? */
    let divs = documentFragment.querySelectorAll('div.was-a-p,h1,h2,h3,h4,h5,h6');
    if (divs.length === 0) {
      const dummy = document.createElement('div');
      dummy.appendChild(documentFragment);
      divs = [dummy];
    }
    return Array.from(divs).map(getInnerText).join('\n');
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
      const result = getTextContent(contents);
      console.debug('getTextContent(contents): ', result);
      return result;
    }
    throw Error('No selection text');
  };

  /*
    receive message (getSelection) from selection.js
    then send message (setSelection) to selection.js
  */
  window.addEventListener('message', (event) => {
    if (event.origin === window.location.origin &&
        event.data.message === 'getSelection') {
      let selection = null;
      try {
        selection = getKindleSelection(window);
      } catch (err) {
        console.debug(err);
        selection = err.message;
      }
      event.source.postMessage({
        message: 'setSelection', selection: selection
      }, event.origin);
    }
  };, false);

  window.deeplkey = true;

  const text = `${NAME} ${VERSION}: loaded`;
  console.debug(text);
  alert(text);

})();
