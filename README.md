# DeepLKey: DeepL Keyboard Shortcut Chrome Extension

A Google Chrome extension to open DeepL page and send selected text by keyboard shortcut or context menu.

(Click on the image to open YouTube video)

[![DeepLKey: DeepL Keyboard Shortcut Chrome Extension](https://user-images.githubusercontent.com/1632335/117237925-e3ff7900-ae66-11eb-9340-80b08d010a27.gif)](http://www.youtube.com/watch?v=gZVzj4uDTss "DeepLKey: DeepL Keyboard Shortcut Chrome Extension")

[DeepL's desktop apps](https://www.deepl.com/app) (e.g. DeepL for Mac) are very useful, especially sending selected text by keyboard shortcut (pressing `Command-c` twice). But unfortunately, they don't provide any way to customize appearance like font size, etc. It's a bit hard for me to use it for long time with such a small text. This Chrome extension provides a keyboard shortcut (default `Command-b`) to send selected text to [DeepL translator](https://www.deepl.com/translator) web page. It's just a web page so that you can change font size by changing web browser settings.

## Install

There are 2 options to install DeepLKey. Chrome Web Store is convenient for all users. Source would be useful if you try to customize/modify features.

### [Option 1] Install from Chrome Web Store
- Install from [here](https://chrome.google.com/webstore/detail/deeplkey-deepl-keyboard-s/ompicphdlcomhddpfbpnhnejhkheeagf)

### [Option 2] Install from source

- Open Terminal and type

```sh
# install Node.js and npm if needed
node -v  # v16.13.0
npm -v   # 8.1.0
git clone https://github.com/susumuota/deeplkey.git
cd deeplkey
npm ci
npm run build
```

- Open Chrome's extensions setting page `chrome://extensions`
- Turn `Developer mode` on
- Click `Load unpacked` (`パッケージ化されていない拡張機能を読み込む` in Japanese)
- Specify the dist folder `/path/to/deeplkey/dist`

## Usage

- Select text by mouse or keyboard
- Press `Command-b` (macOS) or `Alt-b` (other OS)
  - Or right click to open context menu and choose `DeepL Translate`

## Settings

### Change keyboard shortcuts

- Open extensions setting page `chrome://extensions`
- Open menu by clicking `hamburger button` "☰" (triple bar icon) on the left of `Extensions`
- Click `Keyboard shortcuts`
- Click the pencil icon on the right of `Open DeepL`
- Input key stroke. Default is `Command-b` (macOS) or `Alt-b` (other OS).

### Change settings by popup dialog

You can change translation language, color theme and window position by Chrome's popup dialog.

- Click the DeepLKey icon `D`

![DeepLKey icon](https://user-images.githubusercontent.com/1632335/118349094-8a472f00-b589-11eb-9186-331f81dc0f77.png)

- Change settings by selections and buttons. See [YouTube video](http://www.youtube.com/watch?v=gZVzj4uDTss) for more details.

![DeepLKey popup](https://user-images.githubusercontent.com/1632335/118348869-12c4d000-b588-11eb-84e9-df807eb56967.png)

> **_Note:_** in most cases, DeepL automatically detects source language.

### Change settings by developer console

Also, you can change settings by developer console.

- Open extensions setting page `chrome://extensions`
- Turn `Developer mode` on
- Click `Service Worker` at `DeepLKey: DeepL Keyboard Shortcut`

![DeepLKey Service Worker](https://user-images.githubusercontent.com/1632335/118350402-67207d80-b591-11eb-8c90-1adcb4c7ef8d.png)

- DevTools console will appear

- Use `chrome.storage.local.set` to change settings

```javascript
// change target language to German
> await chrome.storage.local.set({targetLang: 'de'})
```

- Use `chrome.storage.local.get` to see current settings

```javascript
> await chrome.storage.local.get()
{targetLang: 'de', ...}
```

- Use `chrome.storage.local.clear` to clear all of the custom settings

```javascript
> await chrome.storage.local.clear()
```

- See [config.js](https://github.com/susumuota/deeplkey/blob/main/config.js) for more details about configuration parameters.

## Limitations

- In certain pages (e.g. Kaggle Notebooks), keyboard shortcut cannot get selected text because `window.getSelection()` returns empty. In that case, try context menu instead.
- When you use context menu, Chrome removes newlines from selected text because `info.selectionText` removes newlines. See [Linebreaks/newlines missing from chrome.contextMenus selectionText](https://bugs.chromium.org/p/chromium/issues/detail?id=116429)

## Development

- Minimum steps to create Chrome Extension with React, MUI, TypeScript and webpack.

```sh
# Setup package.json
npm init -y
# package.json should be created
# Edit package.json
#   "private": true,

# Install react and react-dom
# https://www.npmjs.com/package/react
# https://www.npmjs.com/package/react-dom
npm install --save react react-dom

# Install MUI
# https://mui.com/getting-started/installation/#npm
npm install --save @mui/material @emotion/react @emotion/styled

# Install TypeScript
# https://www.typescriptlang.org/download
# https://www.npmjs.com/package/@types/react
# https://www.npmjs.com/package/@types/react-dom
# https://www.npmjs.com/package/@types/chrome
npm install --save-dev typescript @types/react @types/react-dom @types/chrome
npx tsc --init
# tsconfig.json should be created
# Edit tsconfig.json
#   "jsx": "react",

# Install webpack
# https://webpack.js.org/guides/getting-started/#basic-setup
# https://webpack.js.org/plugins/copy-webpack-plugin/#getting-started
# https://github.com/TypeStrong/ts-loader#getting-started
# https://webpack.js.org/guides/production/
npm install --save-dev webpack webpack-cli copy-webpack-plugin ts-loader webpack-merge
# Edit package.json
#   "scripts": {
#     "watch": "webpack --config webpack.dev.js --watch",
#     "build": "webpack --config webpack.prod.js"
#   },
# Create webpack.common.js, webpack.dev.js and webpack.prod.js
#   TODO

# Build src/*.ts to dist/*.js
npm run build
# `dist` folder should be created
# Open Chrome's extensions setting page `chrome://extensions`
# Turn `Developer mode` on
# Click `Load unpacked`
# Specify the dist folder `/path/to/deeplkey/dist`
```

- Development cycle

```sh
npm run watch
# Modify src/*.ts
# `dist` folder should be updated automatically
# Go to Chrome's extensions setting page and press `Update`
# Click `Service Worker` to open DevTools
# Test on Chrome
```

## TODO

- Find a way to get selected text in case `window.getSelection()` returns empty.

## Source code

https://github.com/susumuota/deeplkey

## Author

Susumu OTA

