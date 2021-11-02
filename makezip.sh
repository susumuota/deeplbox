#!/bin/sh

# make zip file for Google Web Store

ZIP_FILE="deeplkey-latest.zip"

zip "$ZIP_FILE" manifest.json background.js default.js deepl.js popup.html popup.js popup.css translation.html translation.js translation.css icons/*.png
