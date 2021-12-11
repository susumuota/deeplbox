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

import React from 'react';
import ReactDOM from 'react-dom';
import {
  useCallback,
  useMemo,
  useState,
  ChangeEvent,
} from 'react';
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
  SvgIcon,
  ThemeProvider,
  Toolbar,
  Tooltip,
  createTheme,
} from '@mui/material'
import {SelectChangeEvent} from '@mui/material/Select';

import {getConfig, setConfig, SOURCE_LANG_LIST, TARGET_LANG_LIST} from './config';

const LangSelect = ({configName, labelName, initialLang, langList}: {configName: string, labelName: string, initialLang: string, langList: string[]}) => {
  const [lang, setLang] = useState(initialLang);

  const handleChange = useCallback((event: SelectChangeEvent) => {
    const tl = event.target.value as string;
    setLang(tl);
    setConfig({[configName]: tl});
  }, [setLang, setConfig, configName]);

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
        {langList.map(lang => <MenuItem key={lang} value={lang}>{chrome.i18n.getMessage(`language_${lang.replace('-', '_')}`)}</MenuItem>)}
      </Select>
    </FormControl>
  );
};

const SourceLangSelect = ({initialSourceLang}: {initialSourceLang: string}) => {
  return (
    <LangSelect
      configName="sourceLang"
      labelName={chrome.i18n.getMessage('source_language')}
      initialLang={initialSourceLang}
      langList={SOURCE_LANG_LIST}
    />
  );
};

const TargetLangSelect = ({initialTargetLang}: {initialTargetLang: string}) => {
  return (
    <LangSelect
      configName="targetLang"
      labelName={chrome.i18n.getMessage('target_language')}
      initialLang={initialTargetLang}
      langList={TARGET_LANG_LIST}
    />
  );
};

const SplitSentenceCheckbox = ({initialIsSplit}: {initialIsSplit: boolean}) => {
  const [isSplit, setSplit] = useState(initialIsSplit);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSplit(event.target.checked);
    setConfig({isSplit: event.target.checked});
  }, [setSplit, setConfig]);

  const splitLabelMessage = chrome.i18n.getMessage('split_label');
  const splitTooltipMessage = chrome.i18n.getMessage('split_tooltip');

  return (
    <Tooltip title={splitTooltipMessage}>
      <FormGroup>
        <FormControlLabel control={<Checkbox checked={isSplit} onChange={handleChange} />} label={splitLabelMessage} />
      </FormGroup>
    </Tooltip>
  );
};

const App = ({initialSourceLang, initialTargetLang, initialIsSplit}: {initialSourceLang: string, initialTargetLang: string, initialIsSplit: boolean}) => {
  const theme = useMemo(() => createTheme({
    palette: {
      primary: {
        main: 'rgb(21, 183, 185)',
      },
    },
  }), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar>
          <Box mt={1}>
            <img src="icons/deeplkey.png" height="32" />
          </Box>
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
              <Tooltip title="GitHub">
                <Link mr={1} href="https://github.com/susumuota/deeplkey" target="_blank" rel="noreferrer noopener"><img src="icons/github32.png" /></Link>
              </Tooltip>
              <Tooltip title="Chrome Web Store">
                <Link href="https://chrome.google.com/webstore/detail/deeplkey-deepl-keyboard-s/ompicphdlcomhddpfbpnhnejhkheeagf" target="_blank" rel="noreferrer noopener"><SvgIcon fontSize="large" width="32" height="32" viewBox="0 0 192 192"><defs><path id="a" d="M8 20v140c0 6.6 5.4 12 12 12h152c6.6 0 12-5.4 12-12V20H8zm108 32H76c-4.42 0-8-3.58-8-8s3.58-8 8-8h40c4.42 0 8 3.58 8 8s-3.58 8-8 8z"></path></defs><clipPath id="b"><use xlinkHref="#a" overflow="visible"></use></clipPath><path clipPath="url(#b)" fill="#eee" d="M8 20h176v152H8z"></path><path fill="#fff" d="M116 36H76c-4.42 0-8 3.58-8 8s3.58 8 8 8h40c4.42 0 8-3.58 8-8s-3.58-8-8-8z" clipPath="url(#b)"></path><g clipPath="url(#b)"><defs><circle id="c" cx="96" cy="160" r="76"></circle></defs><clipPath id="d"><use xlinkHref="#c" overflow="visible"></use></clipPath><path d="M32.07 84v93.27h34.01L96 125.45h76V84zm0 0v93.27h34.01L96 125.45h76V84z" clipPath="url(#d)" fill="#DB4437"></path><path d="M20 236h72.34l33.58-33.58v-25.14l-59.84-.01L20 98.24zm0 0h72.34l33.58-33.58v-25.14l-59.84-.01L20 98.24z" clipPath="url(#d)" fill="#0F9D58"></path><path d="M96 125.45l29.92 51.82L92.35 236H172V125.45zm0 0l29.92 51.82L92.35 236H172V125.45z" clipPath="url(#d)" fill="#FFCD40"></path><g clipPath="url(#d)"><circle fill="#F1F1F1" cx="96" cy="160" r="34.55"></circle><circle fill="#4285F4" cx="96" cy="160" r="27.64"></circle></g></g><path clipPath="url(#b)" fill="#212121" fillOpacity=".05" d="M8 20h176v76H8z"></path><path fill="#212121" fillOpacity=".02" d="M8 95h176v1H8z"></path><path fill="#fff" fillOpacity=".05" d="M8 96h176v1H8z"></path><path fill="#212121" fillOpacity=".02" d="M116 52H76c-4.25 0-7.72-3.32-7.97-7.5-.02.17-.03.33-.03.5 0 4.42 3.58 8 8 8h40c4.42 0 8-3.58 8-8 0-.17-.01-.33-.03-.5-.25 4.18-3.72 7.5-7.97 7.5zM8 20v1h176v-1H8z"></path><path fill="#231F20" fillOpacity=".1" d="M76 36h40c4.25 0 7.72 3.32 7.97 7.5.01-.17.03-.33.03-.5 0-4.42-3.58-8-8-8H76c-4.42 0-8 3.58-8 8 0 .17.01.33.03.5.25-4.18 3.72-7.5 7.97-7.5zm96 135H20c-6.6 0-12-5.4-12-12v1c0 6.6 5.4 12 12 12h152c6.6 0 12-5.4 12-12v-1c0 6.6-5.4 12-12 12z"></path><radialGradient id="e" cx="7.502" cy="19.344" r="227.596" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fff" stopOpacity=".1"></stop><stop offset="1" stopColor="#fff" stopOpacity="0"></stop></radialGradient><path fill="url(#e)" d="M8 20v140c0 6.6 5.4 12 12 12h152c6.6 0 12-5.4 12-12V20H8zm108 32H76c-4.42 0-8-3.58-8-8s3.58-8 8-8h40c4.42 0 8 3.58 8 8s-3.58 8-8 8z"></path><path fill="none" d="M0 0h192v192H0z"></path></SvgIcon></Link>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

window.addEventListener('load', async () => {
  const config = await getConfig();
  ReactDOM.render(
    <App
      initialSourceLang={config.sourceLang}
      initialTargetLang={config.targetLang}
      initialIsSplit={config.isSplit}
    />,
    document.getElementById('app')
  );
});
