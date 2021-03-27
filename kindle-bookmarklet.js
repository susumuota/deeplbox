javascript: (() => {

  /* https://sekailab.com/wp/2020/03/25/deepl-translation-with-kindle-cloud-reader/ */

  let getKindleWindow = (window) => {
    if (!window) { throw new Error('No Kindle window'); }
    if (window.KindleReaderUI) { return window; }
    if (!window.length) { throw new Error('No Kindle window'); }
    for (let i = 0; i < window.length; i++) {
      const w = window[i];
      if (w.KindleReaderUI) { return w; }
    }
    throw new Error('No Kindle window');
  };

  let findRange = (window, start, end) => {
    const s = window.document.querySelector(`[id="${start}"]`);
    if (!s) { return null; }
    const e = window.document.querySelector(`[id="${end}"]`);
    const range = window.document.createRange();
    range.setStartBefore(s);
    range.setEndAfter(e);
    return range;
  };

  let getKindleSelection = (window) => {
    const w = getKindleWindow(window);
    const selection = w.KindleReaderUI.getSelection();
    if (!selection) { throw Error('No selection text'); }
    for (let i = 0; i < w.length; i++) {
      const range = findRange(w[i], selection.start, selection.end);
      if (range) { return range.toString(); }
    }
    throw Error('No selection text');;
  };

  let receiveMessage = (event) => {
    if (event.origin === 'https://read.amazon.co.jp' &&
        event.data === 'getSelection') {
      let selection = null;
      try {
        selection = getKindleSelection(window);
      } catch (err) {
        console.debug(err);
        selection = err.message;
      }
      event.source.postMessage(`setSelection: ${selection}`, event.origin);
    }
  };

  window.addEventListener('message', receiveMessage, false);

  /* alert('DeepLKey Kindle bookmarklet: done'); */
  console.debug('DeepLKey Kindle bookmarklet: done');

})();
