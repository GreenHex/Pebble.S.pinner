var timeline = require('./timeline');

var DEBUG = 1;
var WU_API_KEY = "98e5c0ff5def9a01";
var WU_API_ROOT = "http://api.wunderground.com/api/";
var GEOLOOKUP_URL = WU_API_ROOT + WU_API_KEY + "/geolookup/q/{lat},{lon}.json";
var ASTRONOMY_URL = WU_API_ROOT + WU_API_KEY + "/astronomy/q/{country}/{state}/{city}.json";

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
  var duration = ( dateMoonset.getTime() - dateMoonrise.getTime() ) / ( 1000 * 60 ) ;
  
  if (DEBUG) console.log( "Time: " + date.toISOString() + "Moonrise: " + dateMoonrise.toISOString() + " Moonset: " + dateMoonset.toISOString() );
  if (DEBUG) console.log( "Duration: " + duration );

  var moonPin = {
    "id": "moonphase-pin-98e5c0ff5def9a01-8",
    "time": dateMoonrise.toISOString(),
    "duration" : duration,
    "layout": {
      "type": "sportsPin",
      "title": json.moon_phase.percentIlluminated + "%",
      "subtitle": json.moon_phase.ageOfMoon + day[ ( json.moon_phase.ageOfMoon == 1 ) ? 1 : ( json.moon_phase.ageOfMoon ) == 2 ? 2 : ( json.moon_phase.ageOfMoon == 3 ) ? 3 : 0 ],
      "body": json.moon_phase.phaseofMoon,
      "tinyIcon": "app://images/RESOURCE_ID_P_MP_S_01",
      "largeIcon": "app://images/RESOURCE_ID_P_MP_L_14",
      "nameAway": "Rise",
      "nameHome": "Set",
      "recordAway": json.moon_phase.moonrise.hour + ":" + json.moon_phase.moonrise.minute,
      "recordHome": json.moon_phase.moonset.hour + ":" + json.moon_phase.moonset.minute,
      "scoreAway": json.moon_phase.moonrise.hour + json.moon_phase.moonrise.minute,
      "scoreHome": json.moon_phase.moonset.hour + json.moon_phase.moonset.minute,
      "sportsGameState": "in-game"
    }
  };
  if (DEBUG) console.log( "index.js: play(): " + JSON.stringify( moonPin ) );
  timeline.insertUserPin( moonPin, function( responseText ) {
    if (DEBUG) console.log( 'Result: ' + responseText );
  });
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
                          getLocation();
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