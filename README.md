# DeepL Box: Translation history management

A Google Chrome extension to manage DeepL translation history, e.g. save, indexing, compare, search, copy and open translation.

(Click on the image to open YouTube video)

[![DeepL Box: translation history management](https://user-images.githubusercontent.com/1632335/146652448-8f979bd3-34b8-42b9-8f9d-418a25a18e96.gif)](https://www.youtube.com/watch?v=4gBO-N23fTk "DeepL Box: translation history management")

This extension provides the translation history management which saves all of the previous translations, shows index of the translations, compares the source and translation sentences one by one, searches by keyword, copies to clipboard and prepares keyboard shortcut `Command-b` (macOS) or `Alt-b` (other OS) to translate.

## Install

There are 2 options to install DeepL Box. Chrome Web Store is convenient for all users. Source would be useful for developers.

### (Option 1) Install from Chrome Web Store

- Install from [here](https://chrome.google.com/webstore/detail/ompicphdlcomhddpfbpnhnejhkheeagf)

### (Option 2) Install from source

- Open Terminal and type

```sh
# install latest stable version of Node.js and npm if needed
node -v  # v18.14.2
git clone https://github.com/susumuota/deeplbox.git
cd deeplbox
npm ci
npm run build
```

- Open Chrome's extensions setting page `chrome://extensions`.
- Turn `Developer mode` on.
- Click `Load unpacked`.
- Specify the dist folder `/path/to/deeplbox/dist`.

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

- Click the DeepL Box icon `D` (if you "pinned" icon).

![DeepL Box icon](https://user-images.githubusercontent.com/1632335/118349094-8a472f00-b589-11eb-9186-331f81dc0f77.png)

- Change settings by selections and buttons.

![DeepL Box popup](https://user-images.githubusercontent.com/1632335/146583985-e5997362-2aa9-4144-938f-889a4d654814.png)

  - `Source Language` specify the language of the text to be translated.
    > **_Note:_** in most cases, DeepL automatically detects source language.
  - `Target Language` specify the language into which the text should be translated.
  - `Splits on punctuation` may improve the readability of long text without newlines, such as PDF.

## Limitations

- Keyboard shortcut does not work for local PDF files. In that case, use context menu instead.
- When you use context menu, Chrome removes newlines from selected text because `info.selectionText` removes newlines. See [Linebreaks/newlines missing from chrome.contextMenus selectionText](https://bugs.chromium.org/p/chromium/issues/detail?id=116429)

## TODO

- Support keyboard shortcut for local PDF files.
- Detect paragraphs in PDF document (is there any convenient way?).
- Rewrite with Jotai instead of Recoil and upgrade to React 19.

## Source code

https://github.com/susumuota/deeplbox

## Author

Susumu OTA

