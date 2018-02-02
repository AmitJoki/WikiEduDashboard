// Polyfills
import "babel-polyfill";
require('jquery-ujs');
require('location-origin');
require('trix');

$(() => {
  window.I18n = require('i18n-js');
  window.List = require('list.js');
  require('./utils/course.js');
  require('./utils/router.jsx');
  require('events').EventEmitter.defaultMaxListeners = 30;
  require('./utils/language_switcher.js');
  require('./utils/editable.js');
  require('./utils/users_profile.js');
});
