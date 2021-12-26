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
  RefObject,
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import ReactDOM from 'react-dom';

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
  Drawer,
  Icon,
  IconButton,
  InputBase,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Snackbar,
  Switch,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
  Divider,
} from '@mui/material';

import {
  ConfigType,
  ItemType,
  PairType,
  getConfig,
  setConfig,
} from './config';

import ChromeWebStoreIcon from './ChromeWebStoreIcon';

const isDarkThemeState = atom<boolean>({
  key: 'isDarkThemeState',
  default: false,
});

const isShowSourceState = atom<boolean>({
  key: 'isShowSourceState',
  default: false,
});

const isTransparentState = atom<boolean>({
  key: 'isTransparentState',
  default: true,
});

const isReverseState = atom<boolean>({
  key: 'isReverseState',
  default: true,
});

const isAutoScrollState = atom<boolean>({
  key: 'isAutoScrollState',
  default: true,
});

const isSettingsState = atom<boolean>({
  key: 'isSettingsState',
  default: false,
});

const isMenuState = atom<boolean>({
  key: 'isMenuState',
  default: false,
});

const isProgressState = atom<boolean>({
  key: 'isProgressState',
  default: false,
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
  get: ({ get }) => {
    const isReverse = get(isReverseState);
    const items = get(itemsState);
    return isReverse ? [...items].reverse() : items;
  },
});

const filteredItemsState = selector<ItemType[]>({
  key: 'filteredItemsState',
  get: ({ get }) => {
    const filterKeyword = get(filterKeywordState);
    const sortedItems = get(sortedItemsState);
    if (!filterKeyword) return sortedItems;
    const isShowSource = get(isShowSourceState);
    const pattern = new RegExp(filterKeyword, 'i');
    return sortedItems.filter((item) => {
      const hit = item.pairs.filter((p) => {
        const tHit = p.translation.search(pattern) !== -1;
        const sHit = isShowSource && p.source.search(pattern) !== -1;
        return tHit || sHit;
      });
      return hit.length > 0;
    });
  },
});

const filteredStatsState = selector<string>({
  key: 'filteredStatsState',
  get: ({ get }) => {
    const items = get(itemsState);
    const filteredItems = get(filteredItemsState);
    return chrome.i18n.getMessage('filter_stats_format', [filteredItems.length, items.length]);
  },
});

const splitToPairs = (source: string, translation: string) => {
  const ss = source.split('\n');
  const ts = translation.split('\n');
  console.assert(ss.length === ts.length); // is this always true?
  // range(max(len(ss), len(ts)))  https://stackoverflow.com/a/10050831
  return [...Array(Math.max(ss.length, ts.length)).keys()]
    .map((i) => [ss[i] ?? '', ts[i] ?? ''])
    .filter(([s, t]) => (s && s.trim()) || (t && t.trim()))
    .map(([s, t], i) => ({ id: i, source: s ?? '', translation: t ?? '' } as PairType));
};

// https://stackoverflow.com/a/56989122
// eslint-disable-next-line @typescript-eslint/comma-dangle
const useConfig = <T,>(recoilState: RecoilState<T>, configName: keyof ConfigType) => {
  const [state, setState] = useRecoilState(recoilState);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await getConfig();
      setState(config[configName] as unknown as T);
    };
    loadConfig();
  }, []);

  useEffect(() => {
    setConfig({ [configName]: state });
  }, [state]);
};

const useToggle = (recoilState: RecoilState<boolean>) => {
  const setState = useSetRecoilState(recoilState);

  const toggle = useCallback(() => {
    setState((prev) => !prev);
  }, []);

  return toggle;
};

function Pair({ source, translation }: { source: string, translation: string }) {
  const isShowSource = useRecoilValue(isShowSourceState);
  const isTransparent = useRecoilValue(isTransparentState);
  const isDarkTheme = useRecoilValue(isDarkThemeState);

  const opacitySx = isTransparent ? { opacity: 0.1, transition: 'all 0.5s', '&:hover': { opacity: 1 } } : {};
  const sourceBox = isShowSource ? <Box sx={{ color: isDarkTheme ? 'primary.main' : 'info.dark', ...opacitySx }}>{source}</Box> : '';

  return (
    <Box mb={1}>
      <Box>{translation}</Box>
      {sourceBox}
    </Box>
  );
}

// eslint-disable-next-line max-len
function SmallIconButton({ title, iconName, onClick }: { title: string, iconName: string, onClick: () => void }) {
  return (
    <Tooltip title={title}>
      <IconButton color="inherit" onClick={onClick} size="small">
        <Icon fontSize="small">{iconName}</Icon>
      </IconButton>
    </Tooltip>
  );
}

function DisabledSmallIconButton({ title, iconName }: { title: string, iconName: string }) {
  return (
    <Tooltip title={title}>
      <Box>
        <IconButton disabled color="inherit" size="small">
          <Icon fontSize="small">{iconName}</Icon>
        </IconButton>
      </Box>
    </Tooltip>
  );
}

function Item({ id, pairs }: { id: number, pairs: PairType[] }) {
  const isShowSource = useRecoilValue(isShowSourceState);
  const [items, setItems] = useRecoilState(itemsState);

  const copyItem = useCallback(() => {
    const toString = (pair: PairType) => (isShowSource ? [pair.translation, pair.source].join('\n') : pair.translation);
    const text = pairs.map((pair: PairType) => toString(pair)).join('\n');
    navigator.clipboard.writeText(text);
  }, [isShowSource, pairs]);

  const deleteItem = useCallback(() => {
    setItems(items.filter((item) => item.id !== id));
  }, [items, id]);

  return (
    <Paper sx={{ p: 2, mt: 3, mb: 3, position: 'relative' }} elevation={6}>
      {/* eslint-disable-next-line max-len */}
      {pairs.map((pair: PairType) => <Pair key={pair.id} source={pair.source} translation={pair.translation} />)}
      <Box sx={{ display: 'flex', position: 'absolute', right: 10, bottom: 10, opacity: 0.1, transition: 'all 0.5s', '&:hover': { opacity: 1 } }}>
        <Box flexGrow={1} />
        <SmallIconButton title={chrome.i18n.getMessage('copy_icon_label')} iconName="copy_all" onClick={copyItem} />
        <SmallIconButton title={chrome.i18n.getMessage('delete_icon_label')} iconName="delete" onClick={deleteItem} />
      </Box>
    </Paper>
  );
}

function SettingsButton() {
  const toggleSettings = useToggle(isSettingsState);

  return <SmallIconButton title={chrome.i18n.getMessage('settings_icon_label')} iconName="settings" onClick={toggleSettings} />;
}

function MenuButton() {
  const toggleMenu = useToggle(isMenuState);

  return <SmallIconButton title={chrome.i18n.getMessage('menu_icon_label')} iconName="menu" onClick={toggleMenu} />;
}

function CopyAllButton() {
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
}

// eslint-disable-next-line max-len
function ConfirmDialogButton({ title, contentText, iconName, confirmText, cancelText, onClick } : { title: string, contentText: string, iconName: string, confirmText: string, cancelText: string, onClick: () => void }) {
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
}

function DeleteAllButton() {
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
}

function SettingsDrawer({ appBarHeight }: { appBarHeight: number }) {
  const isSettings = useRecoilValue(isSettingsState);
  const toggleSettings = useToggle(isSettingsState);
  const isShowSource = useRecoilValue(isShowSourceState);
  const toggleShowSource = useToggle(isShowSourceState);
  const isTransparent = useRecoilValue(isTransparentState);
  const toggleTransparent = useToggle(isTransparentState);
  const isDarkTheme = useRecoilValue(isDarkThemeState);
  const toggleDarkTheme = useToggle(isDarkThemeState);
  const isReverse = useRecoilValue(isReverseState);
  const toggleReverse = useToggle(isReverseState);
  const isAutoScroll = useRecoilValue(isAutoScrollState);
  const toggleAutoScroll = useToggle(isAutoScrollState);

  return (
    <Drawer anchor="right" open={isSettings} onClose={toggleSettings}>
      <Box width={300}>
        <List>
          <Box height={appBarHeight} />
          <ListItemButton onClick={toggleShowSource}>
            <ListItemIcon>
              <Icon fontSize="small">{isShowSource ? 'subtitles' : 'subtitles_off'}</Icon>
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" noWrap>
                {chrome.i18n.getMessage('show_source_text')}
              </Typography>
            </ListItemText>
            <Switch checked={isShowSource} size="small" edge="end" />
          </ListItemButton>
          <ListItemButton disabled={!isShowSource} onClick={toggleTransparent}>
            <ListItemIcon>
              <Icon fontSize="small">{isTransparent ? 'opacity' : 'water_drop'}</Icon>
            </ListItemIcon>
            <ListItemText sx={{ ml: 2 }}>
              <Typography variant="body2" noWrap>
                {chrome.i18n.getMessage('transparent_source_text')}
              </Typography>
            </ListItemText>
            <Switch disabled={!isShowSource} checked={isTransparent} size="small" edge="end" />
          </ListItemButton>
          <ListItemButton onClick={toggleReverse}>
            <ListItemIcon>
              <Icon fontSize="small">{isReverse ? 'vertical_align_top' : 'vertical_align_bottom'}</Icon>
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" noWrap>
                {chrome.i18n.getMessage('newest_to_oldest_text')}
              </Typography>
            </ListItemText>
            <Switch checked={isReverse} size="small" edge="end" />
          </ListItemButton>
          <ListItemButton onClick={toggleAutoScroll}>
            <ListItemIcon>
              <Icon fontSize="small">{isAutoScroll ? 'swipe_down_alt' : 'pause_circle'}</Icon>
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" noWrap>
                {chrome.i18n.getMessage('enable_auto_scroll_text')}
              </Typography>
            </ListItemText>
            <Switch checked={isAutoScroll} size="small" edge="end" />
          </ListItemButton>
          <ListItemButton onClick={toggleDarkTheme}>
            <ListItemIcon>
              <Icon fontSize="small">{isDarkTheme ? 'mode_night' : 'light_mode'}</Icon>
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" noWrap>
                {chrome.i18n.getMessage('dark_theme_text')}
              </Typography>
            </ListItemText>
            <Switch checked={isDarkTheme} size="small" edge="end" />
          </ListItemButton>
          <Divider sx={{ mt: 1, mb: 1 }} />
          <ListItem>
            <Tooltip title="GitHub">
              <Link sx={{ mr: 1 }} href="https://github.com/susumuota/deeplbox" target="_blank" rel="noreferrer noopener">
                <img src={isDarkTheme ? 'icons/github32r.png' : 'icons/github32.png'} width="20" alt="GitHub" />
              </Link>
            </Tooltip>
            <Tooltip title="Chrome Web Store">
              <Link href="https://chrome.google.com/webstore/detail/ompicphdlcomhddpfbpnhnejhkheeagf" target="_blank" rel="noreferrer noopener">
                <ChromeWebStoreIcon fontSize="medium" />
              </Link>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}

// eslint-disable-next-line max-len
function MenuDrawerListItem({ item, refObject }: { item: ItemType, refObject: RefObject<HTMLDivElement> }) {
  const handleScroll = useCallback(() => {
    refObject?.current?.scrollIntoView({ block: 'start', inline: 'start', behavior: 'smooth' });
  }, [refObject]);

  const text = item.pairs?.[0]?.translation?.substring(0, 50); // limit for safety

  return (
    <ListItemButton onClick={handleScroll}>
      <ListItemIcon>
        <Icon fontSize="small">text_snippet</Icon>
      </ListItemIcon>
      <ListItemText>
        <Typography variant="body2" noWrap>{text}</Typography>
      </ListItemText>
    </ListItemButton>
  );
}

// eslint-disable-next-line max-len
function MenuDrawer({ appBarHeight, refObjects }: { appBarHeight: number, refObjects: RefObject<HTMLDivElement>[] }) {
  const isMenu = useRecoilValue(isMenuState);
  const toggleMenu = useToggle(isMenuState);
  const filteredItems = useRecoilValue(filteredItemsState);

  console.assert(filteredItems.length === refObjects.length);

  return (
    <Drawer anchor="left" open={isMenu} onClose={toggleMenu}>
      <Box width={300}>
        <Box height={appBarHeight} />
        <List>
          {/* eslint-disable-next-line max-len */}
          {filteredItems.map((item, i) => <MenuDrawerListItem key={item.id} item={item} refObject={refObjects[i] as RefObject<HTMLDivElement>} />)}
        </List>
      </Box>
    </Drawer>
  );
}

function ProgressSnackbar() {
  const [isProgress, setProgress] = useRecoilState(isProgressState);

  const handleCloseProgress = useCallback(() => {
    setProgress(false);
  }, []);

  return (
    <Snackbar
      open={isProgress}
      autoHideDuration={null}
      onClose={handleCloseProgress}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert severity="info">
        {chrome.i18n.getMessage('progress_snackbar_alert')}
        <CircularProgress size="1rem" sx={{ ml: 1, verticalAlign: 'middle' }} />
      </Alert>
    </Snackbar>
  );
}

function SuccessSnackbar() {
  const [isSuccess, setSuccess] = useRecoilState(isSuccessState);
  const isReverse = useRecoilValue(isReverseState);

  const handleCloseSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  return (
    <Snackbar
      open={isSuccess}
      autoHideDuration={1000}
      onClose={handleCloseSuccess}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert severity="success">
        {chrome.i18n.getMessage('success_snackbar_alert')}
        <Icon sx={{ ml: 1, verticalAlign: 'middle' }} fontSize="small">{isReverse ? 'vertical_align_top' : 'vertical_align_bottom'}</Icon>
      </Alert>
    </Snackbar>
  );
}

function SearchBar() {
  const setFilterKeyword = useSetRecoilState(filterKeywordState);

  const handleChange = useCallback(({ target: { value } }) => {
    setFilterKeyword(value as string);
  }, []);

  const paperSx = {
    ml: 2,
    mr: 2,
    pl: 1,
    pr: 1,
    display: 'flex',
    alignItems: 'center',
    width: 160,
    background: 'rgba(255, 255, 255, 0.1)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.2)',
    },
  };

  const inputBaseSx = {
    ml: 1,
    fontSize: 'small',
    color: 'rgba(255, 255, 255, 1.0)',
  };

  return (
    <Paper color="inherit" elevation={0} sx={paperSx}>
      <Icon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.87)' }}>search</Icon>
      <InputBase type="search" onChange={handleChange} placeholder={chrome.i18n.getMessage('filter_text')} sx={inputBaseSx} />
    </Paper>
  );
}

function App() {
  useConfig<boolean>(isDarkThemeState, 'isDarkTheme');
  useConfig<boolean>(isShowSourceState, 'isShowSource');
  useConfig<boolean>(isTransparentState, 'isTransparent');
  useConfig<boolean>(isReverseState, 'isReverse');
  useConfig<boolean>(isAutoScrollState, 'isAutoScroll');
  useConfig<ItemType[]>(itemsState, 'items');

  const isDarkTheme = useRecoilValue(isDarkThemeState);
  const setSuccess = useSetRecoilState(isSuccessState);
  const isReverse = useRecoilValue(isReverseState);
  const isAutoScroll = useRecoilValue(isAutoScrollState);
  const [isProgress, setProgress] = useRecoilState(isProgressState);
  const setItems = useSetRecoilState(itemsState);
  const filteredItems = useRecoilValue(filteredItemsState);
  const filteredStats = useRecoilValue(filteredStatsState);
  const filterKeyword = useRecoilValue(filterKeywordState);

  const [isNeedScroll, setNeedScroll] = useState(false);

  const handleMessage = useCallback((request: { message: 'setTranslation' | 'startTranslation', source: string, translation: string }, _, sendResponse: (response: { message: string }) => void) => {
    if (request.message === 'setTranslation') {
      const pairs = splitToPairs(request.source, request.translation);
      const id = new Date().getTime();
      const item = { id, pairs } as ItemType;
      setItems((prev) => [...prev, item]); // push
      setProgress(false);
      setSuccess(true);
      setNeedScroll(true);
      sendResponse({ message: 'translation.tsx: setTranslation: done' });
    } else if (request.message === 'startTranslation') {
      setSuccess(false);
      setProgress(true);
      sendResponse({ message: 'translation.tsx: startTranslation: done' });
    }
    return true;
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [handleMessage]);

  // eslint-disable-next-line max-len
  const refObjects = useMemo(() => filteredItems.map(() => createRef<HTMLDivElement>()), [filteredItems]);

  // TODO: is useEffect enough instead of useLayoutEffect?
  useEffect(() => {
    if (isNeedScroll && isAutoScroll) {
      refObjects?.[isReverse ? 0 : filteredItems.length - 1]?.current?.scrollIntoView({ block: 'start', inline: 'start', behavior: 'smooth' });
    }
    setNeedScroll(false);
  }, [isNeedScroll, isAutoScroll, refObjects]);

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

  // try to get AppBar height (48px when variant="dense") to adjust scrollbar position
  // https://github.com/mui-org/material-ui/blob/v5.2.4/packages/mui-material/src/Toolbar/Toolbar.js#L41
  // TODO: how do I get this minHeight?
  const appBarHeight = 48;

  const typographySx = {
    ml: 1,
    mt: 0.2,
    color: 'rgba(255, 255, 255, 0.87)',
    flexGrow: 1,
    fontFamily: '"Bowlby One SC", "Roboto", sans-serif',
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Box sx={{ height: `calc(100vh - ${appBarHeight}px)` }}>
        <AppBar position="sticky" sx={{ zIndex: theme.zIndex.drawer + 1, height: `${appBarHeight}px` }}>
          <Toolbar variant="dense">
            <MenuButton />
            <Typography variant="h5" sx={typographySx}>DeepL Box</Typography>
            <Typography variant="body2">{filterKeyword.length > 0 ? filteredStats : ''}</Typography>
            <SearchBar />
            <CopyAllButton />
            <DeleteAllButton />
            <SettingsButton />
          </Toolbar>
        </AppBar>
        <Box sx={{ maxHeight: '100%', overflow: 'auto' }}>
          <Container maxWidth={false}>
            {isReverse && isProgress ? <Skeleton sx={{ mt: 3, mb: 3 }} variant="rectangular" animation="wave" width="100%" height={100} /> : ''}
            {/* eslint-disable-next-line max-len */}
            {filteredItems.map((item: ItemType, i: number) => <Box ref={refObjects[i] as RefObject<HTMLDivElement>} key={item.id}><Item key={item.id} id={item.id} pairs={item.pairs} /></Box>)}
            {!isReverse && isProgress ? <Skeleton sx={{ mt: 3, mb: 3 }} variant="rectangular" animation="wave" width="100%" height={100} /> : ''}
          </Container>
          <MenuDrawer appBarHeight={appBarHeight} refObjects={refObjects} />
          <SettingsDrawer appBarHeight={appBarHeight} />
          <ProgressSnackbar />
          <SuccessSnackbar />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

window.addEventListener('load', () => {
  ReactDOM.render(
    <RecoilRoot>
      <App />
    </RecoilRoot>,
    document.getElementById('app'),
  );
});
