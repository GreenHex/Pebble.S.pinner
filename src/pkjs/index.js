var timeline = require('./timeline');

// Push a pin when the app starts
Pebble.addEventListener('ready', function() {
  Pebble.getTimelineToken(function(token) {
    console.log('My timeline token is ' + token);
  }, function(error) {
    console.log('Error getting timeline token: ' + error);
  });
});