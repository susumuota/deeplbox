javascript: (() => {

  const name = 'DeepLKey kindle-bookmarklet.js';
  const version = '1.4.2';

  if (window.deeplkey) {
    const text = `${name} ${version}: already loaded`;
    console.debug(text);
    alert(text);
    return;
  }

  const getKindleWindow = (window) => {
    if (!window) { throw new Error('No Kindle window'); }
    if (window.KindleReaderUI) { return window; }
    if (!window.length) { throw new Error('No Kindle window'); }
    for (let i = 0; i < window.length; i++) {
      const w = window[i];
      if (w.KindleReaderUI) { return w; }
    }
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

  const getKindleSelection = (window) => {
    const w = getKindleWindow(window);
    const selection = w.KindleReaderUI.getSelection();
    if (!selection) { throw Error('No selection text'); }
    for (let i = 0; i < w.length; i++) {
      const range = findRange(w[i], selection.start, selection.end);
      if (range) {
        const divs = range.cloneContents().querySelectorAll('div.was-a-p');
        if (divs) {
          let result = [];
          for (let div of divs) {
            result.push(div.textContent);
          }
          return result.join('\n');
        } else {
          return range.toString();
        }
      }
    }
    throw Error('No selection text');;
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
      event.source.postMessage({
        message: 'setSelection', selection: selection
      }, event.origin);
    }
  };

  window.addEventListener('message', receiveGetSelection, false);
  window.deeplkey = true;

  const text = `${name} ${version}: loaded`;
  console.debug(text);
  alert(text);

})();
