// -*- coding: utf-8 -*-

// Copyright 2023 Susumu OTA
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

const source = document.querySelector('d-textarea[data-testid="translator-source-input"]');
const target = document.querySelector('d-textarea[data-testid="translator-target-input"]');

if (!(source && target)) throw new Error('Could not find translator-source-input or translator-target-input.');

/**
 * Monitor source/target textarea.
 * When its content is changed, send `setTranslation` message to `translation.tsx`.
 * See https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
 */
const observer = new MutationObserver(() => {
  const pToString = (p: HTMLParagraphElement) => p.textContent?.trim() ?? '';
  const sourceText = Array.from(source.querySelectorAll('p')).map(pToString).join('\n').trim();
  const targetText = Array.from(target.querySelectorAll('p')).map(pToString).join('\n').trim();
  if (!(sourceText && targetText)) return;
  // send message to translation.tsx
  chrome.runtime.sendMessage({
    message: 'setTranslation',
    source: sourceText,
    translation: targetText,
  }, (response: { message: string }) => {
    console.debug(chrome.runtime.lastError?.message ?? `deepl.ts: got message: ${response.message}`);
  });
});

observer.observe(target, { childList: true, subtree: true });
