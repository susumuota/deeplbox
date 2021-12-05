// -*- coding: utf-8 -*-

// Copyright 2021 Susumu OTA
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

window.addEventListener('load', async () => {
  const sourceLang = document.getElementById('source_lang');
  const targetLang = document.getElementById('target_lang');
  const splitOn = document.getElementById('split_on');
  const splitOff = document.getElementById('split_off');
  const message = document.getElementById('message');
  const config = await getConfig();

  // set current values
  if (config.sourceLang && config.sourceLang !== 'auto') {
    document.getElementById(`source_lang_${config.sourceLang}`).selected = true;
  }
  if (config.targetLang && config.targetLang !== 'auto') {
    document.getElementById(`target_lang_${config.targetLang}`).selected = true;
  }
  if (config.isSplit) {
    splitOn.checked = true;
  } else {
    splitOff.checked = true;
  }

  // event listeners
  sourceLang.addEventListener('change', (event) => {
    console.assert(sourceLang.value);
    setConfig({sourceLang: sourceLang.value});
    message.textContent = `Source Language: "${sourceLang.value}". This change will take effect in the next translation.`;
  });
  targetLang.addEventListener('change', (event) => {
    console.assert(targetLang.value);
    setConfig({targetLang: targetLang.value});
    message.textContent = `Target Language: "${targetLang.value}". This change will take effect in the next translation.`;
  });
  splitOn.addEventListener('change', (event) => {
    console.assert(splitOn.value);
    setConfig({isSplit: splitOn.value === 'on'});
    message.textContent = `Split Sentences: "${splitOn.value}". This change will take effect in the next translation.`;
  });
  splitOff.addEventListener('change', (event) => {
    console.assert(splitOff.value);
    setConfig({isSplit: splitOff.value !== 'off'});
    message.textContent = `Split Sentences: "${splitOff.value}". This change will take effect in the next translation.`;
  });
});
