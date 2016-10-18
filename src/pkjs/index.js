// var timeline = require('./timeline');
var WU_API_KEY = "98e5c0ff5def9a01";
var GEOLOOKUP_URL = "http://api.wunderground.com/api/" + WU_API_KEY + "/geolookup/q/{lat},{lon}.json";
var ASTRONOMY_URL = "http://api.wunderground.com/api/" + WU_API_KEY + "/astronomy/q/{country}/{state}/{city}.json";
var DEBUG = 1;

var xhrRequest = function ( url, type, callback ) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    callback( this.responseText );
  };
  xhr.open( type, url );
  xhr.send();
};

function getLocation() {
  if (DEBUG) console.log( "index.js: getLocation()." );

  navigator.geolocation.getCurrentPosition(
    getGeoInfo,
    locationError,
    { timeout: 15000, maximumAge: 60000 }
  );
}

function getGeoInfo( pos ) {
  if (DEBUG) console.log( "index.js: Got location: " + JSON.stringify( pos ) );
  var json;
  
  var url = GEOLOOKUP_URL.replace( "{lat}", pos.coords.latitude ).replace( "{lon}", pos.coords.longitude );
  console.log( url );
  new xhrRequest( url, 'POST',
             function( responseText ) {
               try {
                 json = JSON.parse( responseText );
                 console.log( JSON.stringify( json ) );
                 console.log( json.location.country_name + " " + json.location.state + " " + json.location.city );
               } catch ( err ) {
                 if (DEBUG) console.log( 'index.js: xhrRequest(): Error parsing responseText, invalid JSON data.' );
                 return;
               }
               var url = ASTRONOMY_URL.replace( "{country}", json.location.country_name ).replace( "{state}", json.location.state ).replace( "{city}", json.location.city );
               console.log( url );
               new xhrRequest( url, 'POST',
                          function( responseText ) {
                            try {
                              json = JSON.parse( responseText );
                            } catch ( err ) {
                              if (DEBUG) console.log( 'index.js: xhrRequest(): Error parsing responseText, invalid JSON data.' );
                              return;
                            }
                          });
               console.log( JSON.stringify( json ) );
             });
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
Pebble.addEventListener('ready',
                        function() {
                          Pebble.getTimelineToken(function(token) {
                            console.log('My timeline token is ' + token);
                          }, function(error) {
                            console.log('Error getting timeline token: ' + error);
                          });
});