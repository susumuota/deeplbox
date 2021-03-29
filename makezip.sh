#!/bin/sh

# make zip file for Google Web Store

ZIP_FILE="deeplkey-latest.zip"
TMP_MANIFEST="manifest.org.json"

cp -p manifest.json "$TMP_MANIFEST"
cp -p manifest.min.json manifest.json

zip "$ZIP_FILE" manifest.json background.js deepl.js translation.html translation.js translation.css icons/icon*.png

cp -p "$TMP_MANIFEST" manifest.json
rm "$TMP_MANIFEST"
