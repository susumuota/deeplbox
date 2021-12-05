#!/bin/sh

# make zip file for Google Web Store

zip deeplkey-latest.zip \
  manifest.json background.js default.js deepl.js \
  popup.html popup.js popup.css \
  translation_v1.html translation_v1.js translation_v1.css \
  translation.html translation.jsx translation.js \
  react.production.min.js react-dom.production.min.js material-ui.production.min.js \
  icons/*.png
