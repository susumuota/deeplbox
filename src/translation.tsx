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
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  AppBar,
  Box,
  CircularProgress,
  Container,
  CssBaseline,
  Icon,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  ThemeProvider,
  Toolbar,
  Tooltip,
  createTheme,
} from '@mui/material'

import {getConfig, setConfig} from './config';

type PairType = {
  key: number,
  source: string,
  translation: string,
}

type ItemType = {
  key: number,
  pairs: PairType[],
}

const splitToPairs = (source: string, translation: string): PairType[] => {
  const ss = source.split('\n');
  const ts = translation.split('\n');
  console.assert(ss.length === ts.length); // is this always true?
  // range(max(len(ss), len(ts)))  https://stackoverflow.com/a/10050831
  return [...Array(Math.max(ss.length, ts.length)).keys()]
    .map(i => [ss[i] || '', ts[i] || ''])
    .filter(([s, t]) => s.trim() || t.trim())
    .map(([s, t], i) => ({key: i, source: s, translation: t}));
};

const Pair = ({source, translation, isShowSource}: {source: string, translation: string, isShowSource: boolean}): JSX.Element => {
  return (
    <Box mb={1}>
      <Box>
        {translation}
      </Box>
      <Box sx={{color: 'text.secondary', opacity: 0.1, transition: 'all 0.5s', '&:hover': {opacity: 1}}}>
        {isShowSource ? source : ''}
      </Box>
    </Box>
  );
};

const Item = ({pairs, isShowSource}: {pairs: PairType[], isShowSource: boolean}): JSX.Element => {
  return (
    <Paper sx={{p: 2, mt: 3, mb: 3}} elevation={6}>
      {pairs.map((pair: PairType) => <Pair key={pair.key} source={pair.source} translation={pair.translation} isShowSource={isShowSource} />)}
    </Paper>
  );
};

const SmallIconButton = ({title, onClick, iconName}: {title: string, onClick: () => void, iconName: string}): JSX.Element => {
  return (
    <Tooltip title={title}>
      <IconButton color="inherit" onClick={onClick} size="small">
        <Icon fontSize="small">{iconName}</Icon>
      </IconButton>
    </Tooltip>
  );
};

const ProgressSnackbar = ({isProgress, handleCloseProgress}: {isProgress: boolean, handleCloseProgress: () => void}) => {
  return (
    <Snackbar
      open={isProgress}
      autoHideDuration={null}
      onClose={handleCloseProgress}
      anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
    >
      <Alert severity="info">
        {chrome.i18n.getMessage('progress_snackbar_alert')}
        <CircularProgress size='1rem' sx={{ml: 1, verticalAlign: 'middle'}} />
      </Alert>
    </Snackbar>
  );
};

const SuccessSnackbar = ({isSuccess, handleCloseSuccess}: {isSuccess: boolean, handleCloseSuccess: () => void}) => {
  return (
    <Snackbar
      open={isSuccess}
      autoHideDuration={5000}
      onClose={handleCloseSuccess}
      anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
    >
      <Alert severity="success">
        {chrome.i18n.getMessage('success_snackbar_alert')}
        <Icon sx={{ml: 1, verticalAlign: 'middle'}} fontSize="small">arrow_downward</Icon>
      </Alert>
    </Snackbar>
  );
};

const App = ({initialIsDarkTheme, initialIsShowSource}: {initialIsDarkTheme: boolean, initialIsShowSource: boolean}) => {
  const [isDarkTheme, setDarkTheme] = useState(initialIsDarkTheme);
  const [isShowSource, setShowSource] = useState(initialIsShowSource);
  const [isProgress, setProgress] = useState(true);
  const [isSuccess, setSuccess] = useState(false);
  const [items, setItems] = useState([] as ItemType[]);

  const toggleDarkTheme = useCallback(() => {
    setDarkTheme((prev: boolean) => {
      setConfig({isDarkTheme: !prev});
      return !prev;
    });
  }, [setDarkTheme, setConfig]);

  const toggleShowSource = useCallback(() => {
    setShowSource((prev: boolean) => {
      setConfig({isShowSource: !prev});
      return !prev;
    });
  }, [setShowSource, setConfig]);

  const handleMessage = useCallback((request, sender, sendResponse) => {
    if (request.message === 'setTranslation') {
      const pairs = splitToPairs(request.source, request.translation);
      const item = {key: new Date().getTime(), pairs: pairs};
      setItems(prev => [...prev, item]);
      setProgress(false);
      setSuccess(true);
      sendResponse({message: 'translation.tsx: setTranslation: done'});
    } else if (request.message === 'startTranslation') {
      setSuccess(false);
      setProgress(true);
      sendResponse({message: 'translation.tsx: startTranslation: done'});
    }
    return true;
  }, [splitToPairs, setItems, setSuccess, setProgress]);

  const handleCloseProgress = useCallback(() => {
    setProgress(false);
  }, [setProgress]);

  const handleCloseSuccess = useCallback(() => {
    setSuccess(false);
  }, [setSuccess]);

  const clearItems = useCallback(() => {
    setItems([] as ItemType[]);
  }, [setItems]);

  const copyItems = useCallback(() => {
    const toString = (pair: PairType) => (isShowSource ? [pair.translation, pair.source].join('\n') : pair.translation);
    const text = items.map((item: ItemType) => item.pairs.map((pair: PairType) => toString(pair)).join('\n')).join('\n\n');
    navigator.clipboard.writeText(text);
  }, [items, isShowSource]);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [handleMessage]);

  const lightTheme = useMemo(() => createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: 'rgba(21, 183, 185, 1.0)',
        contrastText: 'rgba(255, 255, 255, 0.87)',
      },
      text: {
        secondary: 'rgba(23, 78, 166, 1.0)'
      }
    }
  }), []);

  const darkTheme = useMemo(() => createTheme({
    palette: {
      mode: 'dark',
      text: {
        secondary: 'rgba(155, 226, 255, 1.0)'
      }
    }
  }), []);

  return (
    <ThemeProvider theme={isDarkTheme ? darkTheme : lightTheme}>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar variant="dense">
          <Box flexGrow={1}></Box>
          <SmallIconButton title={chrome.i18n.getMessage('copy_icon_tooltip')} onClick={copyItems} iconName="copy_all" />
          <SmallIconButton title={chrome.i18n.getMessage('delete_icon_tooltip')} onClick={clearItems} iconName="delete" />
          <SmallIconButton
            title={isShowSource ? chrome.i18n.getMessage('hide_source_icon_tooltip') : chrome.i18n.getMessage('show_source_icon_tooltip')}
            iconName={isShowSource ? 'check_box' : 'check_box_outline_blank'}
            onClick={toggleShowSource}
          />
          <SmallIconButton
            title={isDarkTheme ? chrome.i18n.getMessage('light_theme_icon_tooltip') : chrome.i18n.getMessage('dark_theme_icon_tooltip')}
            iconName={isDarkTheme ? 'mode_night' : 'light_mode'}
            onClick={toggleDarkTheme}
          />
        </Toolbar>
      </AppBar>
      <Container>
        {items.map((item: ItemType) => <Item key={item.key} pairs={item.pairs} isShowSource={isShowSource} />)}
        {isProgress ? <Skeleton sx={{mt: 3, mb: 3}} variant="rectangular" animation="wave" width="100%" height={200} /> : ''}
      </Container>
      <ProgressSnackbar isProgress={isProgress} handleCloseProgress={handleCloseProgress} />
      <SuccessSnackbar isSuccess={isSuccess} handleCloseSuccess={handleCloseSuccess} />
    </ThemeProvider>
  );
};

window.addEventListener('load', async () => {
  const config = await getConfig();
  ReactDOM.render(
    <App
      initialIsDarkTheme={Boolean(config.isDarkTheme)}
      initialIsShowSource={Boolean(config.isShowSource)}
    />,
    document.getElementById('app')
  );
});
