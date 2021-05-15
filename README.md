# DeepLKey: DeepL Keyboard Shortcut Chrome Extension

A Google Chrome extension to open DeepL translator page and send selected text by keyboard shortcut or context menu.

(Click on the image to open YouTube video)

[![DeepLKey: DeepL Keyboard Shortcut Chrome Extension](https://user-images.githubusercontent.com/1632335/117237925-e3ff7900-ae66-11eb-9340-80b08d010a27.gif)](http://www.youtube.com/watch?v=gZVzj4uDTss "DeepLKey: DeepL Keyboard Shortcut Chrome Extension")

[DeepL's desktop apps](https://www.deepl.com/app) (e.g. DeepL for Mac) are very useful, especially sending selected text by keyboard shortcut (pressing `Command-c` twice). But unfortunately, they don't provide any way to customize appearance like font size, etc. It's a bit hard for me to use it for long time with such a small text. This Chrome extension provides a keyboard shortcut (default `Command-b`) to send selected text to [DeepL translator](https://www.deepl.com/translator) web page. It's just a web page so that you can change font size by changing web browser settings.

## Install

There are 2 options to install DeepLKey. Chrome Web Store is convenient for all users. Source would be useful if you try to customize/modify features.

### [Option 1] Install from Chrome Web Store
- Install from [here](https://chrome.google.com/webstore/detail/deeplkey-deepl-keyboard-s/ompicphdlcomhddpfbpnhnejhkheeagf)

### [Option 2] Install from source

- Open Terminal and type `git clone https://github.com/susumuota/deeplkey.git`
- Open Chrome's extensions setting page `chrome://extensions`
- Turn `Developer mode` on
- Click `Load unpacked` (`パッケージ化されていない拡張機能を読み込む` in Japanese)
- Specify the extracted folder `/path/to/deeplkey`

## Usage

- Select text by mouse or keyboard
- Press `Command-b` (macOS) or `Control-b` (other OS)
  - Or right click to open context menu and choose `DeepL Translate`

## Settings

### Change keyboard shortcuts

- Open extensions setting page `chrome://extensions`
- Open menu by clicking `hamburger button` (triple bar icon) on the left of `Extensions`
- Click `Keyboard shortcuts`
- Click the pencil icon on the right of `Open DeepL`
- Input key stroke. Default is `Command-b` (macOS) or `Control-b` (other OS).

### Change settings by popup dialog

You can change translation language, color theme and window position by Chrome's popup dialog.

- Click the DeepLKey icon (you can "pin" the icon)

![DeepLKey icon](https://user-images.githubusercontent.com/1632335/118349094-8a472f00-b589-11eb-9186-331f81dc0f77.png)

- Change settings by selections and buttons. See [YouTube video](http://www.youtube.com/watch?v=gZVzj4uDTss) for more details.

![DeepLKey popup](https://user-images.githubusercontent.com/1632335/118348869-12c4d000-b588-11eb-84e9-df807eb56967.png)

### Change settings by developer console

Also, you can change settings by developer console.

> **_Note:_** in most cases, DeepL automatically detects source language.

- Open extensions setting page `chrome://extensions`
- Turn `Developer mode` on
- Click `Service Worker` at `DeepLKey: DeepL Keyboard Shortcut`
- DevTools console will appear
- Type `DEFAULT_CONFIG` to shows default settings (uneditable).

```javascript
> DEFAULT_CONFIG
{ sourceLang: 'auto', targetLang: 'auto', ... }
```

- `setConfig` changes setting

```javascript
// change target language to German
> setConfig({targetLang: 'de'})

// change color to dark theme
> setConfig({translationCSS: 'html { background-color: #121212; color: darkgray; } div.source { color: skyblue; }'})

// hide source text (only show translation text)
> setConfig({translationCSS: 'span.source { display: none; }'})
```

- `getConfig` gets current settings

```javascript
> await getConfig()
{ sourceLang: 'auto', targetLang: 'de', ... }
```

- `clearConfig` clears all of the custom settings

```javascript
> clearConfig()
```

- See [default.js](https://github.com/susumuota/deeplkey/blob/main/default.js) for more details about configuration parameters.

## Limitations

- In certain pages (e.g. Kaggle Notebooks), keyboard shortcut cannot get selected text because `window.getSelection()` returns empty. In that case, try context menu instead.
- When you use context menu, Chrome removes newlines from selected text because `info.selectionText` removes newlines. See [Linebreaks/newlines missing from chrome.contextMenus selectionText](https://bugs.chromium.org/p/chromium/issues/detail?id=116429)

## TODO

- Find a way to get selected text in case `window.getSelection()` returns empty.
- Sophisticated UI for translation.html

## Source code

https://github.com/susumuota/deeplkey

## Author

Susumu OTA

