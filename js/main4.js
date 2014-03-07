window.TW = window.TW || {};

(function(TW, self, undefined){

	var markerLocations = [], elevator, setupObjects,
	
	makeButton = document.getElementById("make"),

	config = {
		lineSegments: 50
	},

	setupObjects = TW.Setup.getSetupObjects();
	map = setupObjects.map;
	scene = setupObjects.scene;
	renderer = setupObjects.renderer;
	camera = setupObjects.camera;
	gridSize = setupObjects.config.gridSize;

	function addOriginalPoint(event){
		if ( markerLocations.length == 2){
			return;
		}
		var clickedLocation = event.latLng;
		var clickedPosition = new google.maps.LatLng(clickedLocation.d, clickedLocation.e);
		var marker = new google.maps.Marker({
			map:map,
			draggable:true,
			animation: google.maps.Animation.DROP,
			position: clickedPosition
		});
		markerLocations.push(marker);
		if(markerLocations.length > 1){
			makeButton.disabled = false;
		}
		marker.setMap(map);
	};

  	function makeGrid(){
  		var lat1 = markerLocations[0].getPosition().d;
  		var lon1 = markerLocations[0].getPosition().e;
  		var lat2 = markerLocations[1].getPosition().d;
  		var lon2 = markerLocations[1].getPosition().e;
  		var gridOne = new Grid(lat1, lon1, lat2, lon2, config.lineSegments);
  		gridOne.segmentLine();
  	};
 
  	function Grid(lat1, lon1, lat2, lon2, points){

  		this.lat1 = lat1;
  		this.lon1 = lon1;
  		this.lat2 = lat2;
  		this.lon2 = lon2;
  		this.points = points;
  		var radLat1 = (lat1).toRad();
  		var radLat2 = (lat2).toRad();
  		var radLon1 = (lon1).toRad();
  		var radLon2 = (lon2).toRad();
  		var locationOne = new google.maps.LatLng(lat1, lon1);
		var locationTwo = new google.maps.LatLng(lat2, lon2);
		var pointsArr = []

  		this.segmentLine = function(){
  			var segmentLength = (this.getDistance() * .001) / points;
  			var R = 6378.1 ;
			var d = segmentLength;
			pointsArr.push({
				'lat' : lat1,
				'lon' : lon1 
			});
			for( i=0; i < points; i++ ){ 
				var newPointLatInRad = pointsArr[i]['lat'].toRad();
				var newPointLonInRad = pointsArr[i]['lon'].toRad();
				//find bearing
				var dLon = (radLon2-newPointLonInRad);
			    var y = Math.sin(dLon) * Math.cos(radLat2);
				var x = Math.cos(newPointLatInRad)*Math.sin(radLat2) -
				        Math.sin(newPointLatInRad)*Math.cos(radLat2)*Math.cos(dLon);
				var brng = Math.atan2(y, x);
				//use newly found bearing to get new lat and new lon
				var newLat = Math.asin( Math.sin(newPointLatInRad)*Math.cos(d/R) +
				     Math.cos(newPointLatInRad)*Math.sin(d/R)*Math.cos(brng)); // this is in radians need to convert to degrees 
				var newLon = newPointLonInRad + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(newPointLatInRad),
				             Math.cos(d/R)-Math.sin(newPointLatInRad)*Math.sin(newLat)); // this is in radians need to convert to degrees
				newLat = newLat.toDeg();
				newLon = newLon.toDeg()
				pointsArr.push({
					'lat' : newLat,
					'lon' : newLon,
				});
			} 
			for( i = 0; i < pointsArr.length; i++){
				this.setMarker(pointsArr[i]['lat'], pointsArr[i]['lon']);
			}
			this.makeLine( 
				pointsArr[0]['lat'], pointsArr[0]['lon'],
				pointsArr[pointsArr.length - 1]['lat'], pointsArr[pointsArr.length  - 1]['lon'],
				'#FF0000'
			)
			this.makePath(
				pointsArr[0]['lat'], pointsArr[0]['lon'],
				pointsArr[pointsArr.length - 1]['lat'], pointsArr[pointsArr.length - 1]['lon']
			);
  		};

  		this.getDistance = function(){
			var distance = google.maps.geometry.spherical.computeDistanceBetween(
				locationOne,
				locationTwo
			);
			return distance;
  		};
  	}

  	Grid.prototype.setMarker = function(lat, lon) {
    	var markerPosition = new google.maps.LatLng(lat, lon);
		marker = new google.maps.Marker({ 
			map:map,
			draggable:false,
			animation: google.maps.Animation.DROP,
			position: markerPosition
		}); 
		marker.setMap(map);
	};

	Grid.prototype.makePath = function(lat1, lon1, lat2, lon2, threeStartX, threeStartZ){
		var path = [ 
			new google.maps.LatLng(lat1, lon1), 
			new google.maps.LatLng(lat2, lon2) 
		];
		var pathRequest = {
			'path': path,
			'samples': (config.lineSegments + 1)
		}
		elevator.getElevationAlongPath(pathRequest, function(results, status){
			if (status != google.maps.ElevationStatus.OK) alert('sorry, google is all Fed');
			
			var elevations = results,
				elevationPath = [],
				randomColor1 = Math.floor( Math.random() * 256 ),
				randomColor2 = Math.floor( Math.random() * 256 ),
				lineGeometry = new THREE.Geometry();

			for (var i = 0; i < results.length; i++) {
				elevationPath.push(elevations[i].location);
				var markerPosition = new google.maps.LatLng(elevations[i].location['d'], elevations[i].location['e']);
				marker = new google.maps.Marker({
					map:map,
					draggable:false,
					animation: google.maps.Animation.DROP,
					position: markerPosition
				}); 
				marker.setMap(map);
				var geometry = new THREE.SphereGeometry( 2, 32, 32 );
				// var material = new THREE.MeshBasicMaterial( {color: 
				// 	"rgb(" + Math.floor(255 * ( i / (config.lineSegments - 1) )) + "," + randomColor1 + "," + randomColor2 + ")" ,

				// });
				var material = new THREE.MeshLambertMaterial ( { color: 
					"rgb(" + Math.floor(255 * ( i / (config.lineSegments - 1) )) + "," + randomColor1 + "," + randomColor2 + ")" ,
				shading: THREE.FlatShading } );
				
				var sphere = new THREE.Mesh( geometry, material );
				
				var positionX = (( (i / (results.length  - 1)) * gridSize ) * 2 ) - gridSize;
				var positionY =  (elevations[i].elevation) * .2;
				sphere.position.y = positionY;
				sphere.position.x = positionX;
				scene.add(sphere);
				lineGeometry.vertices.push(new THREE.Vector3(positionX, positionY, 0));
			}
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
			var line = new THREE.Line(lineGeometry, lineMaterial);
			scene.add(line);
			renderer.render( scene, camera);
		});
		
	};

	Grid.prototype.makeLine = function(lat1, lon1, lat2, lon2, color) {
		var flightPlanCoordinates = [
			new google.maps.LatLng(lat1, lon1),
			new google.maps.LatLng(lat2, lon2)
		];
		var lineColor = (color) ? color : '#FF0000';
		var flightPath = new google.maps.Polyline({
			path: flightPlanCoordinates,
			geodesic: true,
			strokeColor: lineColor,
			strokeOpacity: 1.0,
			strokeWeight: 2
		});
		flightPath.setMap(map);
	};

	function bindDomEvents(){
		makeButton.disabled = true;
		google.maps.event.addListener(map, 'click', addOriginalPoint);
		makeButton.addEventListener("click", makeGrid );
	};

    function init() {
    	elevator = new google.maps.ElevationService();
    	bindDomEvents();
    	//console.log(TW.Setup.getConfig());
    } 

    init();

}(TW, TW.Main = TW.Main || {} ));


