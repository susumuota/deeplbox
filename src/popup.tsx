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

import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import { createRoot } from 'react-dom/client';

import {
  AppBar,
  Box,
  Checkbox,
  Container,
  CssBaseline,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from '@mui/material';

import {
  SOURCE_LANG_LIST,
  TARGET_LANG_LIST,
  getConfig,
  setConfig,
} from './config';

import ChromeWebStoreIcon from './ChromeWebStoreIcon';

function LangSelect({ configName, labelName, initialLang, langList }: { configName: 'sourceLang' | 'targetLang', labelName: string, initialLang: string, langList: string[] }) {
  const [lang, setLang] = useState(initialLang);

  const handleChange = useCallback(({ target: { value } }: { target: { value: string } }) => {
    setLang(value);
    setConfig({ [configName]: value });
  }, [configName]);

  const idPrefix = configName.toLowerCase();

  return (
    <FormControl fullWidth>
      <InputLabel id={`${idPrefix}-select-label`}>{labelName}</InputLabel>
      <Select
        labelId={`${idPrefix}-select-label`}
        id={`${idPrefix}-select`}
        value={lang}
        label={labelName}
        onChange={handleChange}
      >
        {langList.map((l) => <MenuItem key={l} value={l}>{chrome.i18n.getMessage(`language_${l.replace('-', '_')}`)}</MenuItem>)}
      </Select>
    </FormControl>
  );
}

function SourceLangSelect({ initialSourceLang }: { initialSourceLang: string }) {
  return (
    <LangSelect
      configName="sourceLang"
      labelName={chrome.i18n.getMessage('source_language')}
      initialLang={initialSourceLang}
      langList={SOURCE_LANG_LIST}
    />
  );
}

function TargetLangSelect({ initialTargetLang }: { initialTargetLang: string }) {
  return (
    <LangSelect
      configName="targetLang"
      labelName={chrome.i18n.getMessage('target_language')}
      initialLang={initialTargetLang}
      langList={TARGET_LANG_LIST}
    />
  );
}

function SplitSentenceCheckbox({ initialIsSplit }: { initialIsSplit: boolean }) {
  const [isSplit, setSplit] = useState(initialIsSplit);

  const handleChange = useCallback(({ target: { checked } }: { target: { checked: boolean } }) => {
    setSplit(checked);
    setConfig({ isSplit: checked });
  }, []);

  return (
    <Tooltip title={chrome.i18n.getMessage('split_description')}>
      <FormGroup>
        <FormControlLabel control={<Checkbox checked={isSplit} onChange={handleChange} />} label={chrome.i18n.getMessage('split_label')} />
      </FormGroup>
    </Tooltip>
  );
}

// eslint-disable-next-line max-len
function App({ initialSourceLang, initialTargetLang, initialIsSplit }: { initialSourceLang: string, initialTargetLang: string, initialIsSplit: boolean }) {
  const theme = useMemo(() => createTheme({
    palette: {
      primary: {
        main: 'rgba(21, 183, 185, 1.0)',
        contrastText: 'rgba(255, 255, 255, 1.0)',
      },
    },
  }), []);

  const typographySx = {
    m: 'auto',
    mt: 1.2,
    color: 'primary.contrastText',
    fontFamily: '"Bowlby One SC", "Roboto", sans-serif',
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h4" sx={typographySx}>DeepL Box</Typography>
        </Toolbar>
      </AppBar>
      <Container fixed>
        <Paper elevation={6}>
          <Box p={2} mt={2} mb={2} minWidth={240} minHeight={280}>
            <Box mt={1} mb={2}>
              <SourceLangSelect initialSourceLang={initialSourceLang} />
            </Box>
            <Box mt={2}>
              <TargetLangSelect initialTargetLang={initialTargetLang} />
            </Box>
            <Box mt={1}>
              <SplitSentenceCheckbox initialIsSplit={initialIsSplit} />
            </Box>
            <Box mt={3}>
              <Link mr={1} href="https://github.com/susumuota/deeplbox" target="_blank" rel="noreferrer noopener">
                <img src="icons/github32.png" alt="GitHub" />
              </Link>
              <Link href="https://chrome.google.com/webstore/detail/ompicphdlcomhddpfbpnhnejhkheeagf" target="_blank" rel="noreferrer noopener">
                <ChromeWebStoreIcon fontSize="large" />
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

window.addEventListener('load', async () => {
  const config = await getConfig();
  const container = document.getElementById('app');
  const root = createRoot(container!);
  root.render(
    <App
      initialSourceLang={config.sourceLang ?? 'en'}
      initialTargetLang={config.targetLang ?? 'ja'}
      initialIsSplit={config.isSplit ?? false}
    />,
  );
});
