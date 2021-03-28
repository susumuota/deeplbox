javascript: (() => {

  const NAME = 'DeepLKey: kindle-bookmarklet.js';
  const VERSION = '1.4.6';

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
      console.debug('range: ', range);
      const contents = range.cloneContents();
      console.debug('range.cloneContents(): ', contents);
      return getDivContents(contents);
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
      event.source.postMessage({
        message: 'setSelection', selection: selection
      }, event.origin);
    }
  };

  window.addEventListener('message', receiveGetSelection, false);
  window.deeplkey = true;

  const text = `${NAME} ${VERSION}: loaded`;
  console.debug(text);
  alert(text);

})();
