#!/bin/sh

# make zip file for Google Web Store
#
# cd dist && sh ../makezip.sh && cd ..

zip deeplbox-latest.zip \
  manifest.json background.js deepl.js pdf.js \
  popup.html popup.js popup.js.LICENSE.txt \
  translation.html translation.js translation.js.LICENSE.txt \
  _locales/en/messages.json _locales/ja/messages.json \
  icons/*.png
