# DeepLKey: DeepL Keyboard Shortcut Chrome Extension

A Google Chrome extension to open DeepL page and send selected text by keyboard shortcut or context menu.

(Click on the image to open YouTube video)

[![DeepLKey: DeepL Keyboard Shortcut Chrome Extension](https://user-images.githubusercontent.com/1632335/145706991-cc6fd338-ed61-40c2-bf55-208a42f26f4e.gif)](https://www.youtube.com/watch?v=8mT0asEwVAU "DeepLKey: DeepL Keyboard Shortcut Chrome Extension")

This Chrome extension provides a keyboard shortcut `Command-b` (macOS) or `Alt-b` (other OS) to send selected text to [DeepL translator](https://www.deepl.com/translator) page. Also, it opens another window to show, aggregate, copy and manipulate translation and source text.

## Install

There are 2 options to install DeepLKey. Chrome Web Store is convenient for all users. Source would be useful if you try to customize/modify features.

### (Option 1) Install from Chrome Web Store
- Install from [here](https://chrome.google.com/webstore/detail/deeplkey-deepl-keyboard-s/ompicphdlcomhddpfbpnhnejhkheeagf)

### (Option 2) Install from source

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

- Open Chrome's extensions setting page `chrome://extensions`.
- Turn `Developer mode` on.
- Click `Load unpacked` (`パッケージ化されていない拡張機能を読み込む` in Japanese).
- Specify the dist folder `/path/to/deeplkey/dist`.

## Usage

- Select text by mouse or keyboard.
- Press `Command-b` (macOS) or `Alt-b` (other OS).
  - Or right click to open context menu and choose `DeepL Translate`.
− Translation window will open.

## Settings

### Change keyboard shortcuts

- Open extensions setting page `chrome://extensions`.
- Open menu by clicking `hamburger button` "☰" (triple bar icon) on the left of `Extensions`.
- Click `Keyboard shortcuts`.
- Click the pencil icon on the right of `Open DeepL page and send selected text`.

![DeeLKey keyboard shortcuts](https://user-images.githubusercontent.com/1632335/145688563-1af4bf22-9664-48cf-bc1a-cd5e58073a2b.png)

- Input key stroke. Default is `Command-b` (macOS) or `Alt-b` (other OS).

### Change settings by popup dialog

You can change source/translation language and split on punctuation option by extension popup dialog.

- Click the DeepLKey icon `D` (if you "pinned" icon).

![DeepLKey icon](https://user-images.githubusercontent.com/1632335/118349094-8a472f00-b589-11eb-9186-331f81dc0f77.png)

- Change settings by selections and buttons.

![DeepLKey popup](https://user-images.githubusercontent.com/1632335/145688416-5728655e-b4bc-4eb2-84e8-98252f0eb6a5.png)

  - `Source Language` specify the language of the text to be translated.
    > **_Note:_** in most cases, DeepL automatically detects source language.
  - `Target Language` specify the language into which the text should be translated.
  - `Splits on punctuation` may improve the readability of long text without newlines, such as PDF.

### Change settings by developer console

Also, you can change settings by developer console.

- Open extensions setting page `chrome://extensions`.
- Turn `Developer mode` on.
- Click `Service Worker` at `DeepLKey: DeepL Keyboard Shortcut`.

![DeepLKey Service Worker](https://user-images.githubusercontent.com/1632335/118350402-67207d80-b591-11eb-8c90-1adcb4c7ef8d.png)

- DevTools console will appear.

- Use `chrome.storage.local.set` to change settings.

```javascript
// change target language to German
> await chrome.storage.local.set({targetLang: 'de'})
```

- Use `chrome.storage.local.get` to see current settings.

```javascript
> await chrome.storage.local.get()
{targetLang: 'de', ...}
```

- Use `chrome.storage.local.clear` to clear all of the custom settings.

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
# https://recoiljs.org/docs/introduction/getting-started
npm install --save react react-dom recoil

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
#   "target": "es2021",
#   "jsx": "react",

# Install webpack
# https://webpack.js.org/guides/getting-started/#basic-setup
# https://webpack.js.org/plugins/copy-webpack-plugin/#getting-started
# https://webpack.js.org/guides/production/
# https://github.com/TypeStrong/ts-loader#getting-started
npm install --save-dev webpack webpack-cli webpack-merge copy-webpack-plugin ts-loader
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

