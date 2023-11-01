import * as Sentry from '@sentry/browser'
import choo from 'choo'
import 'core-js'
import 'fast-text-encoding'
import 'intl-pluralrules'
import nanotiming from 'nanotiming'
import Archive from './archive'
import getCapabilities from './capabilities'
import controller from './controller'
import dragManager from './dragManager'
import experiments from './experiments'
import { getTranslator } from './locale'
import './main.css'
import pasteManager from './pasteManager'
import routes from './routes'
import storage from './storage'
import User from './user'
import { locale, setTranslate } from './utils'

if (navigator.doNotTrack !== '1' && window.SENTRY_CONFIG) {
  Sentry.init(window.SENTRY_CONFIG);
}

if (process.env.NODE_ENV === 'production') {
  nanotiming.disabled = true;
}

(async function start() {
  const capabilities = await getCapabilities();
  if (
    !capabilities.crypto &&
    window.location.pathname !== '/unsupported/crypto'
  ) {
    return window.location.assign('/unsupported/crypto');
  }
  if (capabilities.serviceWorker) {
    try {
      await navigator.serviceWorker.register('/serviceWorker.js');
      await navigator.serviceWorker.ready;
    } catch (e) {
      capabilities.streamDownload = false;
    }
  }

  const translate = await getTranslator(locale());
  setTranslate(translate);
  window.initialState = {
    LIMITS,
    DEFAULTS,
    WEB_UI,
    PREFS,
    archive: new Archive([], DEFAULTS.EXPIRE_SECONDS, DEFAULTS.DOWNLOADS),
    capabilities,
    translate,
    storage,
    sentry: Sentry,
    user: new User(storage, LIMITS, window.AUTH_CONFIG),
    transfer: null,
    fileInfo: null,
    locale: locale()
  };

  const app = routes(choo({ hash: true }));
  window.app = app;
  app.use(experiments);
  app.use(controller);
  app.use(dragManager);
  app.use(pasteManager);
  app.mount('body');
})();
