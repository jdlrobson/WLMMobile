/*global define, L, mw, $, chrome*/
/*jslint sloppy: true, white:true, maxerr: 50, indent: 4, plusplus: true, vars:true */
define(['jquery', '../leaflet/leaflet-src', 'leafclusterer'], function() {

	var map = null;
	var clusterer = null;

	function calculateCenterAndZoom(monuments) {
		var center = {lat: 0, lon: 0},
			max = {lat: -999, lon: -999},
			min = {lat: 999, lon: 999},
			count = 0,
			location = {},
			visible,
			dist = {lat: 0, lon: 0},
			zoom = 0;
		$.each(monuments, function(i, item) {
			if (item.lat || item.lon) {
				// Only count things that aren't at (0, 0)
				if (item.lat < min.lat) {
					min.lat = item.lat;
				}
				if (item.lon < min.lon) {
					min.lon = item.lon;
				}
				if (item.lat > max.lat) {
					max.lat = item.lat;
				}
				if (item.lon > max.lon) {
					max.lon = item.lon;
				}
				count++;
			}
		});
		if (count === 0) {
			// Seriously?
			location = {center: {lat: 0, lon: 0}, zoom: 1};
		} else {
			center.lat = (min.lat + max.lat) / 2;
			center.lon = (min.lon + max.lon) / 2;
			dist.lat = max.lat - min.lat;
			dist.lon = max.lon - min.lon;
			dist = Math.max(dist.lat,dist.lon);
			visible = 360;
			for (zoom = 1; zoom < 18; zoom++) {
				visible /= 2;
				if (dist >= visible) {
					break;
				}
			}
			location = { center: center, zoom: zoom -1 };
		}
		return location;
	}

	function init( onmapchange ) {
		if (!map) {
			// Disable webkit 3d CSS transformations for tile positioning
			// Causes lots of flicker in PhoneGap for some reason...
			L.Browser.webkit3d = false;
			map = new L.Map('map', {
				touchZoom: false,
				zoomControl: true
			});
			var tiles = new L.TileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
				maxZoom: 18,
				subdomains: '1234'
			});
			map.addLayer(tiles);

			$( '<button>' ).addClass( 'myLocation' ).text( 'center on me' ).
				click( function() {
					var el = this;
					$( el ).addClass( 'loading' );
					navigator.geolocation.getCurrentPosition( function( pos ) {
						map.panTo( new L.LatLng( pos.coords.latitude, pos.coords.longitude ) );
						$( el ).removeClass( 'loading' );
					}, function() {
						$( el ).removeClass( 'loading' );
					} );
				} ).appendTo( '#map' );

			map.attributionControl.setPrefix("");
			map.attributionControl.addAttribution(
				'<span class=".map-attribution">' + mw.message("attribution-mapquest") + '</span>'
				);
			map.attributionControl.addAttribution(
				'<br /><span class=".map-attribution">' + mw.message("attribution-osm") + '</span>'
				);

			$(".map-attribution a").bind('click', function(event) {
				// Force web links to open in external browser
				// instead of the app, where navigation will be broken.
				// TODO: define chrome
				// chrome.openExternalLink(this.href);
				event.preventDefault();
			});

			// Since clusterer needs to have a default view setup
			map.setView( new L.LatLng( 0, 0 ), 3 );
			clusterer = new LeafClusterer(map);

			if ( onmapchange ) { 
				map.on( 'moveend', onmapchange );
			}
		}
	}

	function showMap() {
		$("#map").show();
		// Makes leaflet aware of its' position - avoids 'wrong center' problem
		map.invalidateSize();
	}

	function hideMap() {
		$("#map").hide();
	}

	function clear() {
		clusterer.clearMarkers();
	}

	function getMap() {
		return map;
	}

	function addMonument(monument, onClick) {
		var marker = new L.Marker(new L.LatLng(monument.lat, monument.lon));
		var popup = "<div><strong>" + monument.name + "</strong></div>";
		var popupDOM = $(popup).click(function() {
			onClick(monument);
		})[0];
		marker.bindPopup(popupDOM, {closeButton: false});
		clusterer.addMarker( marker );
	}

	function setCenterAndZoom( center, zoom, forceReset ) {
		map.setView( new L.LatLng(center.lat, center.lon), zoom, forceReset );
	}

	return {
		init: init,
		clear: clear,
		addMonument: addMonument,
		calculateCenterAndZoom: calculateCenterAndZoom,
		setCenterAndZoom: setCenterAndZoom,
		getMap: getMap,
		showMap: showMap,
		hideMap: hideMap
	};

});
