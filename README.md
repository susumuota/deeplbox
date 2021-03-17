# DeepLKey: DeepL Keyboard Shortcut Chrome Extension

A Google Chrome extension to open DeepL translator page and send selected text by keyboard shortcut or context menu.

(Click on the thumbnail image to play the video)

[![](http://img.youtube.com/vi/t57jgZ8hlwU/0.jpg)](http://www.youtube.com/watch?v=t57jgZ8hlwU "DeepLKey: DeepL Keyboard Shortcut Chrome Extension")

[DeepL's desktop apps](https://www.deepl.com/app) (e.g. DeepL for Mac) are very useful, especially sending selected text by keyboard shortcut (pressing `Command-c` twice). But unfortunately, they don't provide any way to customize appearance like font size, etc. It's a bit hard for me to use it for long time with such a small text. This Chrome extension provides a keyboard shortcut (default `Command-b`) to send selected text to [DeepL translator](https://www.deepl.com/translator) web page. It's just a web page so that you can change font size by changing web browser settings.

## Install

- Open Terminal and type `git clone https://github.com/susumuota/deeplkey.git`
- Open Chrome's extensions setting page `chrome://extensions`
- Turn `Developer mode` on
- Click `Load unpacked` (`パッケージ化されていない拡張機能を読み込む` in Japanese)
- Specify `/path/to/deeplkey`.

## Usage

- Select text by mouse or keyboard
- Press `Command-b` (macOS) or `Control-b` (other OS)
- Or right click to open context menu and choose `DeepL Translate`

## Settings

### Change keyboard shortcuts

- Open extensions setting page `chrome://extensions`
- Open menu by clicking [Hamburger button](https://en.wikipedia.org/wiki/Hamburger_button)(triple bar icon) on the left of `Extensions`
- Click `Keyboard shortcuts`
- Click the pencil icon on the right of `Open DeepL`
- Input key stroke. Default is `Command-b` (macOS) or `Control-b` (other OS).

### Change translation language

You can change translation source language, target language, etc. Available languages are listed [here](https://www.deepl.com/docs-api/translating-text/).

Note: in most cases, DeepL automatically detects source language.

- Open extensions setting page `chrome://extensions`
- Turn `Developer mode` on
- Click `Service Worker` at `DeepLKey: DeepL Keyboard Shortcut`
- DevTools console will appear

- Type `DEFAULT_CONFIG` to shows default settings (uneditable).

```javascript
> DEFAULT_CONFIG
{ sourceLang: 'en', targetLang: 'ja', ... }
```

- `setConfig` changes setting

```javascript
> setConfig({'targetLang': 'de'}) // change target language to German
```

- `getConfig` gets current settings and call callback function

```javascript
> getConfig(console.log)
{ sourceLang: 'en', targetLang: 'de', ... }
```

- `clearConfig` clears all of the settings

```javascript
> clearConfig()
```

## Limitations

- In certain pages (e.g. Kaggle notebooks), keyboard shortcut cannot get selected text because `window.getSelection()` returns empty. In that case, try context menu instead.
- When you use context menu, Chrome removes newlines from selected text because `info.selectionText` removes newlines. See [Linebreaks/newlines missing from chrome.contextMenus selectionText](https://bugs.chromium.org/p/chromium/issues/detail?id=116429)

## TODO

- Find a way to get selected text in case `window.getSelection()` returns empty.
- Modify style sheet for translator page
- UI for settings
- Chrome Web Store?

## Source code

[https://github.com/susumuota/deeplkey](https://github.com/susumuota/deeplkey)

## Author

Susumu OTA

