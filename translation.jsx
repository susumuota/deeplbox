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

//
// DO NOT edit translation.js manually.
// Edit translation.jsx then convert it to translation.js by babel.
//
//   npx babel --presets @babel/preset-react -o translation.js -w --verbose translation.jsx
//

'use strict';

const {
  useState,
  useCallback,
  useMemo,
  useEffect
} = React;

const {
  CssBaseline,
  Paper,
  IconButton,
  Icon,
  Tooltip,
  AppBar,
  Snackbar,
  Alert,
  Toolbar,
  Container,
  Box,
  createTheme,
  ThemeProvider
} = MaterialUI;

const splitToPairs = (source, translation) => {
  const ss = source.split('\n');
  const ts = translation.split('\n');
  console.assert(ss.length === ts.length); // is this always true?
  // range(max(len(ss), len(ts)))  https://stackoverflow.com/a/10050831
  return [...Array(Math.max(ss.length, ts.length)).keys()]
    .map(i => [ss[i] || '', ts[i] || ''])
    .filter(([s, t]) => s.trim() || t.trim())
    .map(([s, t], i) => ({key: i, source: s, translation: t}));
};

const Pair = props => {
  return (
    <Box>
      <Box>
        {props.translation}
      </Box>
      <Box sx={{color: 'text.secondary', mb: 1, opacity: 0.1, transition: 'all 0.5s', '&:hover': {opacity: 1}}}>
        {props.isShowSource ? props.source : ''}
      </Box>
    </Box>
  );
};

const Item = props => {
  return (
    <Paper sx={{p: 2, mt: 3, mb: 3}} elevation={6}>
      {props.pairs.map(pair => <Pair key={pair.key} source={pair.source} translation={pair.translation} isShowSource={props.isShowSource} />)}
    </Paper>
  );
};

const SmallIconButton = props => {
  return (
    <Tooltip title={props.title}>
      <IconButton color="inherit" onClick={props.onClick} size="small">
        <Icon fontSize="small">{props.iconName}</Icon>
      </IconButton>
    </Tooltip>
  );
};

const App = props => {
  const [isDarkTheme, setDarkTheme] = useState(props.isDarkTheme);
  const [isShowSource, setShowSource] = useState(false);
  const [isOpenSnack, setOpenSnack] = useState(false);
  const [items, setItems] = useState([]);

  const toggleDarkTheme = useCallback(() => {
    setDarkTheme(prev => {
      setConfig({isDarkTheme: !prev});
      return !prev;
    });
  }, [setDarkTheme, setConfig]);

  const toggleShowSource = useCallback(() => {
    setShowSource(prev => !prev);
  }, [setShowSource]);

  const handleMessage = useCallback((request, sender, sendResponse) => {
    if (request.message === 'setTranslation') {
      const pairs = splitToPairs(request.source, request.translation);
      const item = {key: new Date().getTime(), pairs: pairs};
      setItems(prev => [...prev, item]);
      setOpenSnack(true);
      sendResponse({message: 'translation.js: setTranslation: done'});
    }
    return true;
  }, [setItems, setOpenSnack]);

  const handleCloseSnack = useCallback((event, reason) => {
    setOpenSnack(false);
  }, [setOpenSnack]);

  const clearItems = useCallback(() => {
    setItems([]);
  }, [setItems]);

  const copyItems = useCallback(() => {
    const toString = pair => (isShowSource ? [pair.translation, pair.source].join('\n') : pair.translation);
    const text = items.map(item => item.pairs.map(pair => toString(pair)).join('\n')).join('\n\n');
    navigator.clipboard.writeText(text);
  }, [items, isShowSource]);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [handleMessage]);

  const lightTheme = useMemo(() => createTheme({
    palette: {
      mode: 'light',
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
          <Box sx={{flexGrow: 1}} />
          <SmallIconButton title="Copy All" onClick={copyItems} iconName="copy_all" />
          <SmallIconButton title="Delete All" onClick={clearItems} iconName="delete" />
          <SmallIconButton
            title={isShowSource ? 'Hide Source Text' : 'Show Source Text'}
            iconName={isShowSource ? 'check_box' : 'check_box_outline_blank'}
            onClick={toggleShowSource}
          />
          <SmallIconButton
            title={isDarkTheme ? 'To Light Theme' : 'To Dark Theme'}
            iconName={isDarkTheme ? 'mode_night' : 'light_mode'}
            onClick={toggleDarkTheme}
          />
        </Toolbar>
      </AppBar>
      <Container>
        {items.map(item => <Item key={item.key} pairs={item.pairs} isShowSource={isShowSource} />)}
      </Container>
      <Snackbar
        open={isOpenSnack}
        autoHideDuration={5000}
        onClose={handleCloseSnack}
        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
      >
        <Alert severity="success">
          A new translation has been added!
          <Icon sx={{ml: 1, verticalAlign: 'middle'}} fontSize="small">arrow_downward</Icon>
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

window.addEventListener('load', async () => {
  const config = await getConfig();
  // detect user's color scheme  https://stackoverflow.com/a/57795495
  const isDarkTheme = Boolean(
    config.isDarkTheme === null ?
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches :
    config.isDarkTheme
  );
  ReactDOM.render(
    <App isDarkTheme={isDarkTheme} />,
    document.getElementById('app')
  );
});
