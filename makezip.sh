#!/bin/sh

# make zip file for Google Web Store

ZIP_FILE="deeplkey-latest.zip"

zip "$ZIP_FILE" manifest.json background.js deepl.js selection.js translation.html translation.js translation.css icons/icon*.png
