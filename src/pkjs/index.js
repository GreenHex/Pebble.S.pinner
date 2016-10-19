var MESSAGE_KEYS = require( 'message_keys' );
var timeline = require('./timeline');

var DEBUG = 1;
var WU_API_KEY = "98e5c0ff5def9a01";
var WU_API_URL_ROOT = "http://api.wunderground.com/api/";
var GEOLOOKUP_URL = WU_API_URL_ROOT + WU_API_KEY + "/geolookup/q/{lat},{lon}.json";
var ASTRONOMY_URL = WU_API_URL_ROOT + WU_API_KEY + "/astronomy/q/{country}/{state}/{city}.json";

var day = [ "th day", "st day", "nd day", "rd day" ];

function play() {
  var json;
  try {
    json = JSON.parse( this.responseText );
    if (DEBUG) console.log( JSON.stringify( json ) );
  } catch ( err ) {
    if (DEBUG) console.log( 'index.js: play(): Error parsing responseText, invalid JSON data.' );
    return;
  }
  
  var date = new Date();
  var dateMoonrise = new Date();
  var dateMoonset = new Date();
  dateMoonrise.setHours( json.moon_phase.moonrise.hour );
  dateMoonrise.setMinutes( json.moon_phase.moonrise.minute );
  dateMoonset.setHours( json.moon_phase.moonset.hour );
  dateMoonset.setMinutes( json.moon_phase.moonset.minute );
  dateMoonset.setDate( dateMoonset.getDate() + 1 );
  var duration = ( dateMoonset.getTime() - dateMoonrise.getTime() ) / ( 1000 * 60 ) ; // milliseconds to minutes

  if (DEBUG) console.log( "Time: " + date.toISOString() + " Moonrise: " + dateMoonrise.toISOString() + " Moonset: " + dateMoonset.toISOString() );
  if (DEBUG) console.log( "Duration: " + duration );
  var moonRiseHour = ( json.moon_phase.moonrise.hour < 10 ) ? "0" + json.moon_phase.moonrise.hour : json.moon_phase.moonrise.hour;
  var moonSetHour = ( json.moon_phase.moonset.hour < 10 ) ? "0" + json.moon_phase.moonset.hour : json.moon_phase.moonset.hour;
  
  var moonphasePin = {
    "id": "moonphase-pin-id-" + date.getTime() + "-98e5c0ff5def9a01",
    "time": dateMoonrise.toISOString(),
    "duration" : duration,
    "layout": {
      "type": "sportsPin",
      "title": json.moon_phase.ageOfMoon + day[ ( json.moon_phase.ageOfMoon == 1 ) ? 1 : ( json.moon_phase.ageOfMoon ) == 2 ? 2 : ( json.moon_phase.ageOfMoon == 3 ) ? 3 : 0 ],
      "subtitle": json.moon_phase.phaseofMoon,
      "body": json.moon_phase.percentIlluminated + "% Illumination",
      "tinyIcon": "system://images/TIMELINE_SUN",
      "largeIcon": "system://images/TIMELINE_SUN",
      "nameAway": "Rise",
      "nameHome": "Set",
      "recordAway": moonRiseHour + ":" + json.moon_phase.moonrise.minute,
      "recordHome": moonSetHour + ":" + json.moon_phase.moonset.minute,
      "scoreAway": moonRiseHour + json.moon_phase.moonrise.minute,
      "scoreHome": moonSetHour + json.moon_phase.moonset.minute,
      "sportsGameState": "in-game"
    }
  };

  // if ( localStorage.getItem( MESSAGE_KEYS.CURRENT_MOONPHASE_PIN_ID ) ) {
    var pin = { "id": localStorage.getItem( MESSAGE_KEYS.CURRENT_MOONPHASE_PIN_ID ) };
    if (DEBUG) console.log( JSON.stringify( pin ) );
    timeline.deleteUserPin( pin, function( responseText ) {
      if (DEBUG) console.log( 'deleteUserPin(): Result: ' + responseText );
      localStorage.setItem( MESSAGE_KEYS.CURRENT_MOONPHASE_PIN_ID, moonphasePin.id  );
      if (DEBUG) console.log( "index.js: play(): " + localStorage.getItem( MESSAGE_KEYS.CURRENT_MOONPHASE_PIN_ID ) );
      timeline.insertUserPin( moonphasePin, function( responseText ) {
        if (DEBUG) console.log( 'insertUserPin(): Result: ' + responseText );
      });
    });
  // }  
}

function getAstroInfo() {
  var json;
  try {
    json = JSON.parse( this.responseText );
    if (DEBUG) console.log( JSON.stringify( json ) );
  } catch ( err ) {
    if (DEBUG) console.log( 'index.js: getAstroInfo(): Error parsing responseText, invalid JSON data.' );
    return;
  }
  var url = ASTRONOMY_URL.replace( "{country}", json.location.country_name ).replace( "{state}", json.location.state ).replace( "{city}", json.location.city );
  if (DEBUG) console.log( url );
  var xhr = new XMLHttpRequest();
  xhr.onload = play;
  xhr.open( 'GET', url );
  xhr.send();
}

function getGeoInfo( pos ) {
  var url = GEOLOOKUP_URL.replace( "{lat}", pos.coords.latitude ).replace( "{lon}", pos.coords.longitude );
  if (DEBUG) console.log( url );
  
  var xhr = new XMLHttpRequest();
  xhr.onload = getAstroInfo;
  xhr.open( 'GET', url );
  xhr.send();
}

function getLocation() {
  if (DEBUG) console.log( "index.js: getLocation()." );

  navigator.geolocation.getCurrentPosition(
    getGeoInfo,
    locationError,
    { timeout: 15000, maximumAge: 60000 }
  );
}

function locationError( err ) {
  if (DEBUG) console.log( "index.js: Error requesting location! " + JSON.stringify( err ) );
}

// watchapp started
Pebble.addEventListener( 'ready', 
                        function(e) {
                          if (DEBUG) console.log( "index.js: addEventListener( ready ): PebbleKit JS ready." );
                          // getLocation();
                        });

// pin stuff
Pebble.addEventListener( 'ready',
                        function() {
                          Pebble.getTimelineToken(function(token) {
                            if (DEBUG) console.log('My timeline token is ' + token);
                          }, function(error) {
                            if (DEBUG) console.log('Error getting timeline token: ' + error);
                          });
});