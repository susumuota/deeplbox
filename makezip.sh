#!/bin/sh

# make zip file for Google Web Store

FILE="deeplkey-latest.zip"

zip "$FILE" manifest.json background.js content.js translation.html translation.js translation.css icons/icon*.png
