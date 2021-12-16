
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
  useState,
} from 'react';
import {
  RecoilRoot,
  RecoilState,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  Icon,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Snackbar,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from '@mui/material';

import {PairType, ItemType, getConfig, setConfig} from './config';

const isDarkThemeState = atom<boolean>({
  key: 'isDarkThemeState',
  default: false,
});

const isShowSourceState = atom<boolean>({
  key: 'isShowSourceState',
  default: false,
});

const isReverseState = atom<boolean>({
  key: 'isReverseState',
  default: true,
});

const isDrawerState = atom<boolean>({
  key: 'isDrawerState',
  default: false,
});

const isProgressState = atom<boolean>({
  key: 'isProgressState',
  default: true, // not false!!!
});

const isSuccessState = atom<boolean>({
  key: 'isSuccessState',
  default: false,
});

const itemsState = atom<ItemType[]>({
  key: 'itemsState',
  default: [],
});

const filterKeywordState = atom<string>({
  key: 'filterKeywordState',
  default: '',
});

const sortedItemsState = selector<ItemType[]>({
  key: 'sortedItemsState',
  get: ({get}) => {
    const isReverse = get(isReverseState);
    const items = get(itemsState);
    return isReverse ? [...items].reverse() : items;
  },
});

const filteredItemsState = selector<ItemType[]>({
  key: 'filteredItemsState',
  get: ({get}) => {
    const filterKeyword = get(filterKeywordState);
    const sortedItems = get(sortedItemsState);
    if (!filterKeyword) return sortedItems;
    const isShowSource = get(isShowSourceState);
    const pattern = new RegExp(filterKeyword, 'i');
    return sortedItems.filter(item => {
      const hit = item.pairs.filter(p => {
        return -1 != p.translation.search(pattern) || (isShowSource && -1 != p.source.search(pattern));
      });
      return hit.length > 0;
    });
  },
});

const filteredStatsState = selector<string>({
  key: 'filteredStatsState',
  get: ({get}) => {
    const items = get(itemsState);
    const filteredItems = get(filteredItemsState);
    return chrome.i18n.getMessage('filter_stats_format', [filteredItems.length, items.length]);
  },
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

// https://stackoverflow.com/a/56989122
const useConfig = <T,>(recoilState: RecoilState<T>, configName: string): void => {
  const [state, setState] = useRecoilState(recoilState);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await getConfig();
      setState(config[configName]);
    };
    loadConfig();
  }, []);

  useEffect(() => {
    setConfig({[configName]: state});
  }, [state]);
};

const useToggle = (recoilState: RecoilState<boolean>): () => void => {
  const setState = useSetRecoilState(recoilState);

  const toggle = useCallback(() => {
    setState((prev) => !prev);
  }, []);

  return toggle;
};

const Pair = ({source, translation}: {source: string, translation: string}) => {
  const isShowSource = useRecoilValue(isShowSourceState);
  const isDarkTheme = useRecoilValue(isDarkThemeState);

  return (
    <Box mb={1}>
      <Box>
        {translation}
      </Box>
      {isShowSource ?
        <Box sx={{color: isDarkTheme ? 'primary.main' : 'info.dark', opacity: 0.1, transition: 'all 0.5s', '&:hover': {opacity: 1}}}>
          {source}
        </Box>
        : ''}
    </Box>
  );
};

const SmallIconButton = ({title, iconName, onClick}: {title: string, iconName: string, onClick: () => void}) => {
  return (
    <Tooltip title={title}>
      <IconButton color="inherit" onClick={onClick} size="small">
        <Icon fontSize="small">{iconName}</Icon>
      </IconButton>
    </Tooltip>
  );
};

const DisabledSmallIconButton = ({title, iconName}: {title: string, iconName: string}) => {
  return (
    <Tooltip title={title}>
      <Box>
        <IconButton disabled color="inherit" size="small">
          <Icon fontSize="small">{iconName}</Icon>
        </IconButton>
      </Box>
    </Tooltip>
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
    setItems(items.filter(item => item.id !== id));
  }, [items, id]);

  return (
    <Paper sx={{p: 2, mt: 3, mb: 3, position: 'relative'}} elevation={6}>
      {pairs.map((pair: PairType) => <Pair key={pair.id} source={pair.source} translation={pair.translation} />)}
      <Box display="flex" position="absolute" right={10} bottom={10} sx={{opacity: 0.1, transition: 'all 0.5s', '&:hover': {opacity: 1}}}>
        <Box flexGrow={1}></Box>
        <SmallIconButton title={chrome.i18n.getMessage('copy_icon_label')} iconName="copy_all" onClick={copyItem} />
        <SmallIconButton title={chrome.i18n.getMessage('delete_icon_label')} iconName="delete" onClick={deleteItem} />
      </Box>
    </Paper>
  );
};

const SettingsButton = () => {
  const toggleDrawer = useToggle(isDrawerState);

  return <SmallIconButton title={chrome.i18n.getMessage('settings_icon_label')} iconName="settings" onClick={toggleDrawer} />;
};

const CopyAllButton = () => {
  const isShowSource = useRecoilValue(isShowSourceState);
  const filteredItems = useRecoilValue(filteredItemsState);

  const copyItems = useCallback(() => {
    const toString = (pair: PairType) => (isShowSource ? [pair.translation, pair.source].join('\n') : pair.translation);
    const text = filteredItems.map((item: ItemType) => item.pairs.map((pair: PairType) => toString(pair)).join('\n')).join('\n\n');
    navigator.clipboard.writeText(text);
  }, [isShowSource, filteredItems]);

  return filteredItems.length > 0 ? (
    <SmallIconButton title={chrome.i18n.getMessage('copy_all_icon_label')} iconName="copy_all" onClick={copyItems} />
  ) : (
    <DisabledSmallIconButton title={chrome.i18n.getMessage('copy_all_icon_label')} iconName="copy_all" />
  );
};

const ConfirmDialogButton = ({title, contentText, iconName, confirmText, cancelText, onClick}: {title: string, contentText: string, iconName: string, confirmText: string, cancelText: string, onClick: () => void}) => {
  const [isOpen, setOpen] = useState<boolean>(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    onClick();
    setOpen(false);
  }, []);

  return (
    <Box>
      <SmallIconButton title={title} iconName={iconName} onClick={handleOpen} />
      <Dialog open={isOpen} onClose={handleClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{contentText}</DialogContentText>
          <DialogActions>
            <Button onClick={handleClose}>{cancelText}</Button>
            <Button onClick={handleConfirm} autoFocus>{confirmText}</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

const DeleteAllButton = () => {
  const [items, setItems] = useRecoilState(itemsState);

  const deleteItems = useCallback(() => {
    setItems([] as ItemType[]);
  }, []);

  return items.length > 0 ? (
    <ConfirmDialogButton
      title={chrome.i18n.getMessage('delete_all_icon_label')}
      contentText={chrome.i18n.getMessage('confirm_format', chrome.i18n.getMessage('delete_all_icon_label'))}
      iconName="delete"
      confirmText={chrome.i18n.getMessage('delete_all_icon_label')}
      cancelText={chrome.i18n.getMessage('cancel_text')}
      onClick={deleteItems}
    />
  ) : (
    <DisabledSmallIconButton title={chrome.i18n.getMessage('delete_all_icon_label')} iconName="delete" />
  );
};

const TemporaryDrawer = () => {
  const isDrawer = useRecoilValue(isDrawerState);
  const toggleDrawer = useToggle(isDrawerState);
  const isShowSource = useRecoilValue(isShowSourceState);
  const toggleShowSource = useToggle(isShowSourceState);
  const isDarkTheme = useRecoilValue(isDarkThemeState);
  const toggleDarkTheme = useToggle(isDarkThemeState);
  const isReverse = useRecoilValue(isReverseState);
  const toggleReverse = useToggle(isReverseState);

  return (
    <Drawer anchor="right" open={isDrawer} onClose={toggleDrawer}>
      <Box width={300}>
        <List>
          <ListItem button onClick={toggleDrawer}>
            <ListItemIcon>
              <Icon fontSize="small">close</Icon>
            </ListItemIcon>
            <ListItemText>
              {chrome.i18n.getMessage('close_settings_text')}
            </ListItemText>
          </ListItem>
          <Divider />
          <ListItem button onClick={toggleShowSource}>
            <ListItemIcon>
              <Icon fontSize="small">{isShowSource ? 'visibility' : 'visibility_off'}</Icon>
            </ListItemIcon>
            <ListItemText>
              {isShowSource ? chrome.i18n.getMessage('hide_source_text') : chrome.i18n.getMessage('show_source_text')}
            </ListItemText>
          </ListItem>
          <ListItem button onClick={toggleReverse}>
            <ListItemIcon>
              <Icon fontSize="small">{isReverse ? 'arrow_upward' : 'arrow_downward'}</Icon>
            </ListItemIcon>
            <ListItemText>
              {isReverse ? chrome.i18n.getMessage('oldest_to_newest_text') : chrome.i18n.getMessage('newest_to_oldest_text')}
            </ListItemText>
          </ListItem>
          <ListItem button onClick={toggleDarkTheme}>
            <ListItemIcon>
              <Icon fontSize="small">{isDarkTheme ? 'mode_night' : 'light_mode'}</Icon>
            </ListItemIcon>
            <ListItemText>
              {isDarkTheme ? chrome.i18n.getMessage('light_theme_text') : chrome.i18n.getMessage('dark_theme_text')}
            </ListItemText>
          </ListItem>
        </List>
      </Box>
    </Drawer>
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
      anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
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
  const isReverse = useRecoilValue(isReverseState);

  const handleCloseSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  return (
    <Snackbar
      open={isSuccess}
      autoHideDuration={5000}
      onClose={handleCloseSuccess}
      anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
    >
      <Alert severity="success">
        {chrome.i18n.getMessage('success_snackbar_alert')}
        <Icon sx={{ml: 1, verticalAlign: 'middle'}} fontSize="small">{isReverse ? 'arrow_upward' : 'arrow_downward'}</Icon>
      </Alert>
    </Snackbar>
  );
};

const SearchBar = () => {
  const setFilterKeyword = useSetRecoilState(filterKeywordState);

  const handleChange = useCallback(({target: {value}}) => {
    setFilterKeyword(value as string);
  }, []);

  const paperSx = {
    ml: 2, mr: 2, pl: 1, pr: 1,
    display: 'flex', alignItems: 'center', width: 160,
    background: 'rgba(255, 255, 255, 0.1)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.2)'
    },
  };

  const inputBaseSx = {
    ml: 1,
    fontSize: 'small',
    color: 'rgba(255, 255, 255, 1.0)',
  };

  return (
    <Paper color="inherit" elevation={0} sx={paperSx}>
      <Icon fontSize="small" sx={{color: 'rgba(255, 255, 255, 0.87)'}}>search</Icon>
      <InputBase type="search" onChange={handleChange} placeholder={chrome.i18n.getMessage('filter_text')} sx={inputBaseSx} />
    </Paper>
  );
};

const App = () => {
  useConfig<boolean>(isDarkThemeState, 'isDarkTheme');
  useConfig<boolean>(isShowSourceState, 'isShowSource');
  useConfig<boolean>(isReverseState, 'isReverse');
  useConfig<ItemType[]>(itemsState, 'items');

  const isDarkTheme = useRecoilValue(isDarkThemeState);
  const setSuccess = useSetRecoilState(isSuccessState);
  const isReverse = useRecoilValue(isReverseState);
  const [isProgress, setProgress] = useRecoilState(isProgressState);
  const setItems = useSetRecoilState(itemsState);
  const filteredItems = useRecoilValue(filteredItemsState);
  const filteredStats = useRecoilValue(filteredStatsState);
  const filterKeyword = useRecoilValue(filterKeywordState);

  const handleMessage = useCallback((request, _, sendResponse) => {
    if (request.message === 'setTranslation') {
      const pairs = splitToPairs(request.source, request.translation);
      const id = new Date().getTime();
      const item = {id: id, pairs: pairs};
      setItems(prev => [...prev, item]); // push
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
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [handleMessage]);

  const lightTheme = useMemo(() => createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: 'rgba(21, 183, 185, 1.0)',
        contrastText: 'rgba(255, 255, 255, 1.0)',
      },
    },
  }), []);

  const darkTheme = useMemo(() => createTheme({
    palette: {
      mode: 'dark',
    },
  }), []);

  const theme = isDarkTheme ? darkTheme : lightTheme;

  // try to get AppBar height (48px) to adjust scrollbar position
  // TODO: find an appropriate way
  const appBarHeight = useMemo(() => (theme.mixins.toolbar as {minHeight: number}).minHeight - parseInt(theme.spacing(1).replace('px', '')), [theme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Box sx={{height: `calc(100vh - ${appBarHeight}px)`}}> {/* to adjust scrollbar position (1/3) */}
        <AppBar position="sticky" sx={{height: `${appBarHeight}px`}}> {/* to adjust scrollbar position (2/3) */}
          <Toolbar variant="dense">
            <Typography variant="h5" sx={{mt: 0.2, color: 'rgba(255, 255, 255, 0.87)', flexGrow: 1, fontFamily: '"Bowlby One SC", "Roboto", sans-serif'}}>DeepLKey</Typography>
            <Typography variant="body2">{filterKeyword.length > 0 ? filteredStats : ''}</Typography>
            <SearchBar />
            <CopyAllButton />
            <DeleteAllButton />
            <SettingsButton />
          </Toolbar>
        </AppBar>
        <Box sx={{maxHeight: '100%', overflow: 'auto'}}> {/* to adjust scrollbar position (3/3) */}
          <Container maxWidth={false}>
            {isReverse && isProgress ? <Skeleton sx={{mt: 3, mb: 3}} variant="rectangular" animation="wave" width="100%" height={100} /> : ''}
            {filteredItems.map((item: ItemType) => <Item key={item.id} id={item.id} pairs={item.pairs} />)}
            {!isReverse && isProgress ? <Skeleton sx={{mt: 3, mb: 3}} variant="rectangular" animation="wave" width="100%" height={100} /> : ''}
          </Container>
          <TemporaryDrawer />
          <ProgressSnackbar />
          <SuccessSnackbar />
        </Box>
      </Box>
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
