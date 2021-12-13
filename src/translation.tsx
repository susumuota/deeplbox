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
  useEffect,
  useMemo,
} from 'react';
import {
  RecoilRoot,
  atom,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState
} from 'recoil';
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
  id: number,
  source: string,
  translation: string,
}

type ItemType = {
  id: number,
  pairs: PairType[],
}

const isDarkThemeState = atom({
  key: 'isDarkThemeState',
  default: false,
});

const isShowSourceState = atom({
  key: 'isShowSourceState',
  default: false,
});

const isProgressState = atom({
  key: 'isProgressState',
  default: true, // not false!!!
});

const isSuccessState = atom({
  key: 'isSuccessState',
  default: false,
});

const itemsState = atom({
  key: 'itemsState',
  default: [] as ItemType[],
});

const splitToPairs = (source: string, translation: string): PairType[] => {
  const ss = source.split('\n');
  const ts = translation.split('\n');
  console.assert(ss.length === ts.length); // is this always true?
  // range(max(len(ss), len(ts)))  https://stackoverflow.com/a/10050831
  return [...Array(Math.max(ss.length, ts.length)).keys()]
    .map(i => [ss[i] || '', ts[i] || ''])
    .filter(([s, t]) => (s && s.trim()) || (t && t.trim()))
    .map(([s, t], i) => ({id: i, source: s || '', translation: t || ''}));
};

const Pair = ({source, translation}: {source: string, translation: string}) => {
  const isShowSource = useRecoilValue(isShowSourceState);

  return (
    <Box mb={1}>
      <Box>
        {translation}
      </Box>
      {isShowSource ?
        <Box sx={{color: 'text.secondary', opacity: 0.1, transition: 'all 0.5s', '&:hover': {opacity: 1}}}>
          {source}
        </Box>
        : ''}
    </Box>
  );
};

const Item = ({id, pairs}: {id: number, pairs: PairType[]}) => {
  const isShowSource = useRecoilValue(isShowSourceState);
  const [items, setItems] = useRecoilState(itemsState);

  const copyItem = useCallback(() => {
    const toString = (pair: PairType) => (isShowSource ? [pair.translation, pair.source].join('\n') : pair.translation);
    const text = pairs.map((pair: PairType) => toString(pair)).join('\n');
    navigator.clipboard.writeText(text);
  }, [isShowSource, pairs]);

  const deleteItem = useCallback(() => {
    const removeIndex = items.findIndex(item => item.id === id);
    setItems(items.filter((_, index) => index !== removeIndex));
  }, [items, id]);

  return (
    <Paper sx={{p: 2, mt: 3, mb: 3}} elevation={6}>
      {pairs.map((pair: PairType) => <Pair key={pair.id} source={pair.source} translation={pair.translation} />)}
      <Box display="flex">
        <Box flexGrow={1}></Box>
        <SmallIconButton title={chrome.i18n.getMessage('copy_icon_tooltip')} onClick={copyItem} iconName="copy_all" />
        <SmallIconButton title={chrome.i18n.getMessage('delete_icon_tooltip')} onClick={deleteItem} iconName="delete" />
      </Box>
    </Paper>
  );
};

const SmallIconButton = ({title, onClick, iconName}: {title: string, onClick: () => void, iconName: string}) => {
  return (
    <Tooltip title={title}>
      <IconButton color="inherit" onClick={onClick} size="small">
        <Icon fontSize="small">{iconName}</Icon>
      </IconButton>
    </Tooltip>
  );
};

const CopyButton = () => {
  const isShowSource = useRecoilValue(isShowSourceState);
  const items = useRecoilValue(itemsState);

  const copyItems = useCallback(() => {
    const toString = (pair: PairType) => (isShowSource ? [pair.translation, pair.source].join('\n') : pair.translation);
    const text = items.map((item: ItemType) => item.pairs.map((pair: PairType) => toString(pair)).join('\n')).join('\n\n');
    navigator.clipboard.writeText(text);
  }, [isShowSource, items]);

  return <SmallIconButton title={chrome.i18n.getMessage('copy_all_icon_tooltip')} onClick={copyItems} iconName="copy_all" />;
};

const DeleteButton = () => {
  const setItems = useSetRecoilState(itemsState);

  const deleteItems = useCallback(() => {
    setItems([] as ItemType[]);
  }, []);

  return <SmallIconButton title={chrome.i18n.getMessage('delete_all_icon_tooltip')} onClick={deleteItems} iconName="delete" />
};

const DarkThemeButton = () => {
  const [isDarkTheme, setDarkTheme] = useRecoilState(isDarkThemeState);

  const toggleDarkTheme = useCallback(() => {
    setDarkTheme((prev: boolean) => {
      setConfig({isDarkTheme: !prev});
      return !prev;
    });
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await getConfig();
      setDarkTheme(config.isDarkTheme);
    };
    loadConfig();
  }, []);

  return (
    <SmallIconButton
      title={isDarkTheme ? chrome.i18n.getMessage('light_theme_icon_tooltip') : chrome.i18n.getMessage('dark_theme_icon_tooltip')}
      iconName={isDarkTheme ? 'mode_night' : 'light_mode'}
      onClick={toggleDarkTheme}
    />
  );
};

const ShowSourceButton = () => {
  const [isShowSource, setShowSource] = useRecoilState(isShowSourceState);

  const toggleShowSource = useCallback(() => {
    setShowSource((prev: boolean) => {
      setConfig({isShowSource: !prev});
      return !prev;
    });
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await getConfig();
      setShowSource(config.isShowSource);
    };
    loadConfig();
  }, []);

  return (
    <SmallIconButton
      title={isShowSource ? chrome.i18n.getMessage('hide_source_icon_tooltip') : chrome.i18n.getMessage('show_source_icon_tooltip')}
      iconName={isShowSource ? 'check_box' : 'check_box_outline_blank'}
      onClick={toggleShowSource}
    />
  );
};

const ProgressSnackbar = () => {
  const [isProgress, setProgress] = useRecoilState(isProgressState);

  const handleCloseProgress = useCallback(() => {
    setProgress(false);
  }, []);

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

const SuccessSnackbar = () => {
  const [isSuccess, setSuccess] = useRecoilState(isSuccessState);

  const handleCloseSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

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

const App = () => {
  const isDarkTheme = useRecoilValue(isDarkThemeState);
  const [isProgress, setProgress] = useRecoilState(isProgressState);
  const setSuccess = useSetRecoilState(isSuccessState);
  const [items, setItems] = useRecoilState(itemsState);

  const handleMessage = useCallback((request, _, sendResponse) => {
    if (request.message === 'setTranslation') {
      const pairs = splitToPairs(request.source, request.translation);
      const id = new Date().getTime();
      const item = {id: id, pairs: pairs};
      setItems(prev => {
        const newItems = [...prev, item];
        setConfig({items: newItems});
        return newItems;
      });
      setProgress(false);
      setSuccess(true);
      sendResponse({message: 'translation.tsx: setTranslation: done'});
    } else if (request.message === 'startTranslation') {
      setSuccess(false);
      setProgress(true);
      sendResponse({message: 'translation.tsx: startTranslation: done'});
    }
    return true;
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await getConfig();
      setItems(config.items);
    };
    loadConfig();
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

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
          <CopyButton />
          <DeleteButton />
          <ShowSourceButton />
          <DarkThemeButton />
        </Toolbar>
      </AppBar>
      <Container>
        {items.map((item: ItemType) => <Item key={item.id} id={item.id} pairs={item.pairs} />)}
        {isProgress ? <Skeleton sx={{mt: 3, mb: 3}} variant="rectangular" animation="wave" width="100%" height={200} /> : ''}
      </Container>
      <ProgressSnackbar />
      <SuccessSnackbar />
    </ThemeProvider>
  );
};

window.addEventListener('load', () => {
  ReactDOM.render(
    <RecoilRoot>
      <App />
    </RecoilRoot>,
    document.getElementById('app')
  );
});
