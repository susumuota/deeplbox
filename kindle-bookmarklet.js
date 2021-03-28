javascript: (() => {

  const name = 'DeepLKey kindle-bookmarklet.js';
  const version = '1.4.4';

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

  const getSpanContent = (elm) => {
    const spans = elm.querySelectorAll('span.k4w');
    if (spans.length === 0) { return elm.textContent; }
    const results = [];
    for (let span of spans) {
      results.push(span.textContent);
    }
    return results.join(' ');
  };

  const getDivContent = (elm) => {
    const divs = elm.querySelectorAll('div.was-a-p,h1,h2,h3,h4,h5,h6');
    if (divs.length === 0) { return getSpanContent(elm); }
    const results = [];
    for (let div of divs) {
      results.push(getSpanContent(div));
    }
    return results.join('\n');
  };

  const getKindleSelection = (window) => {
    const w = getKindleWindow(window);
    const selection = w.KindleReaderUI.getSelection();
    console.debug('w.KindleReaderUI.getSelection(): ', selection);
    if (!selection) { throw Error('No selection text'); }
    for (let i = 0; i < w.length; i++) {
      const range = findRange(w[i], selection.start, selection.end);
      if (!range) { continue; }
      console.debug('range: ', range);
      const contents = range.cloneContents();
      console.debug('range.cloneContents(): ', contents);
      return getDivContent(contents);
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
