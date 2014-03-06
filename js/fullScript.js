window.TW = window.TW || {};

(function(TW, self, undefined){

	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	//3JS GLOBALS
	var container, stats, camera, controls, scene, renderer,
	//GOOGLE MAPS ELEVATION GLOBALS
	elevator, map, infowindow, flightPath, midwayMarker;
	config = {
		gridSize: 100,
		gridUnit: 10,
		samplePoints: 3
	},
	markerLocations = [],
	makeButton = document.getElementById("make"),
	flightPathExists = false;

    function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
		controls.handleResize();
		render();
	};

	function animate() {
		requestAnimationFrame( animate );
		controls.update();
	};

	function render() {
		renderer.render( scene, camera );
		stats.update();
	};
    
    function setup3World( ) {
    	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
		camera.position.z = 280;
		camera.position.y = 60;
		controls = new THREE.TrackballControls( camera );
		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.8;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;
		controls.keys = [ 65, 83, 68 ];
		controls.addEventListener( 'change', render );
		// world
		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );
		// lights
		light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 1, 1, 1 );
		scene.add( light );
		light = new THREE.DirectionalLight( 0x002288 );
		light.position.set( -1, -1, -1 );
		scene.add( light );
		light = new THREE.AmbientLight( 0x222222 );
		scene.add( light );
		// ORGINIAL SPHERES
		var rgbRed =  "rgb(255,0,0)";
		var geometry = new THREE.SphereGeometry( 3, 32, 32 );
		var material = new THREE.MeshBasicMaterial( {color:rgbRed} );
		var sphere = new THREE.Mesh( geometry, material );
		sphere.position.x = config.gridSize;
		scene.add(sphere);
		var sphere = new THREE.Mesh( geometry, material );
		sphere.position.y = config.gridSize;
		scene.add(sphere);
		var sphere = new THREE.Mesh( geometry, material );
		sphere.position.z = config.gridSize;
		scene.add(sphere);
		scene.add( new THREE.GridHelper( config.gridSize, config.gridUnit ) );
		// renderer
		renderer = new THREE.WebGLRenderer( { antialias: false } );
		renderer.setClearColor( scene.fog.color, 1 );
		renderer.setSize( window.innerWidth, window.innerHeight );
		container = document.getElementById( 'container' );
		container.appendChild( renderer.domElement );
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.zIndex = 100;
		container.appendChild( stats.domElement );
		animate();
    };

    function setupMap(){
    	infowindow = new google.maps.InfoWindow();
		denali = new google.maps.LatLng(40.6700, -73.9400);
		var mapOptions = {
		    zoom: 8,
		    center: denali,
		    mapTypeId: 'terrain'
		}
		map = new google.maps.Map(document.getElementById('map'), mapOptions);
		elevator = new google.maps.ElevationService();
    };

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
  		var gridOne = new Grid(lat1, lon1, lat2, lon2, config.samplePoints);
  		console.log(lat1, lon1);
  		gridOne.showMidPoint();
  		gridOne.connectOrigins();
  		gridOne.findSegment();
  		//gridOne.getDistance();
  	};

  	//grid object constructor
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
  		this.showMidPoint = function(){
			var dLon = ((lon2 - lon1)).toRad();
			var Bx = Math.cos(radLat2) * Math.cos(dLon);
			var By = Math.cos(radLat2) * Math.sin(dLon);
			var lat3 = Math.atan2(Math.sin(radLat1) + Math.sin(radLat2), Math.sqrt((Math.cos(radLat1) + Bx) * (Math.cos(radLat1) + Bx) + By * By));
			var lon3 = radLon1 + Math.atan2(By, Math.cos(radLat1) + Bx);
			lat3 = (lat3).toDeg();
			lon3 = (lon3).toDeg();
  		}

  		this.findSegment = function(){
  			//first need to find the bearing
  			var dLon = (radLon2-radLon1);
		    var y = Math.sin(dLon) * Math.cos(radLat2);
			var x = Math.cos(radLat1)*Math.sin(radLat2) -
			        Math.sin(radLat1)*Math.cos(radLat2)*Math.cos(dLon);
			var brng = Math.atan2(y, x);
			
			var wholeDistanceKm = this.getDistance() * .001;
			var R = 6378.1 ;
			var d = wholeDistanceKm / 2; 
			newLat = Math.asin( Math.sin(radLat1)*Math.cos(d/R) +
			     Math.cos(radLat1)*Math.sin(d/R)*Math.cos(brng))
			newLon = radLon1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(radLat1),
			             Math.cos(d/R)-Math.sin(radLat1)*Math.sin(newLat))
			this.setMarker(newLat.toDeg(), newLon.toDeg());
  		}

  		this.connectOrigins = function(){
  			this.makeLine(lat1, lon1, lat2, lon2, '#0000FF' );
  		}

  		this.getDistance = function(){
			var distance = google.maps.geometry.spherical.computeDistanceBetween(
				locationOne,
				locationTwo
			);
			return distance;
  		}
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

	Grid.prototype.makeLine = function(lat1, lon1, lat2, lon2, color) {
		var flightPlanCoordinates = [
			new google.maps.LatLng(lat1, lon1),
			new google.maps.LatLng(lat2, lon2)
		];
		var lineColor = (color) ? color : '#FF0000';
		var flightPath = new google.maps.Polyline({
			path: flightPlanCoordinates,
			geodesic: false,
			strokeColor: lineColor,
			strokeOpacity: 1.0,
			strokeWeight: 2
		});
		flightPath.setMap(map);
	};

  	function addAngleEquations(){
  		if (typeof(Number.prototype.toRad) === "undefined") {
			Number.prototype.toRad = function() {
				return this * Math.PI / 180;
			}
		}
		if (typeof(Number.prototype.toDegrees) === "undefined") {
			Number.prototype.toDeg = function() {
				return this * (180 / Math.PI);
			}
		}
  	};

	function bindDomEvents(){
		makeButton.disabled = true;
		window.addEventListener( 'resize', onWindowResize, false );
		google.maps.event.addListener(map, 'click', addOriginalPoint);
		document.getElementById("map").addEventListener('mousedown', function(e){
			e.stopPropagation();
		});
		makeButton.addEventListener("click", makeGrid );

	};

    function init( ) {
    	setup3World();
    	setupMap();
    	addAngleEquations();
    	bindDomEvents();
    } 

    init();

}(TW, TW.Main = TW.Main || {} ));


