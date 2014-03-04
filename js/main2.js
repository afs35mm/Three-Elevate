window.TW = window.TW || {};

(function(TW, self, undefined){

	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	//3JS GLOBALS
	var container, stats, camera, controls, scene, renderer,
	//GOOGLE MAPS ELEVATION GLOBALS
	elevator, map, infowindow, flightPath,
	config = {
		gridSize: 100,
		gridUnit: 10,
		samplePoints: 100
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


	function addMarker(event){
		if ( markerLocations.length == 2){
			alert('2 Markers max...');
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
		//getMidPoint();
	};

	function getMidPoint(lat1, lat2, lon1, lon2){
		    
		    // var dLon = (lon2 - lon1).toRad();
		    // //convert to radians
		    // lat1 = (lat1).toRad();
		    // lat2 = (lat2).toRad();
		    // lon1 = (lon1).toRad();

		    // var Bx = Math.cos(lat2) * Math.cos(dLon);
		    // var By = Math.cos(lat2) * Math.sin(dLon);
		    // var lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By));
		    // var lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);

		    // //print out in degrees
		    // console.log((lat3).toDegrees() + " " + (lon3).toDegrees());

		    if (Math.abs(lon2-lon1) > Math.PI) lon1 += 2*Math.PI; // crossing anti-meridian

			var lat3 = (lat1+lat2)/2;
			var f1 = Math.tan(Math.PI/4 + lat1/2);
			var f2 = Math.tan(Math.PI/4 + lat2/2);
			var f3 = Math.tan(Math.PI/4 + lat3/2);
			var lon3 = ( (lon2-lon1)*Math.log(f3) + lon1*Math.log(f2) - lon2*Math.log(f1) ) / 
			   Math.log(f2/f1);

			if (!isFinite(lon3)) lon3 = (lon1+lon2)/2; // parallel of latitude

			lon3 = (lon3+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180º

			console.log(lat3, lon3);

		    var midwayPosition = new google.maps.LatLng(lat3, lon3);
			var midwayMarker = new google.maps.Marker({
				map:map,
				draggable:true,
				animation: google.maps.Animation.DROP,
				position: midwayPosition
			});
			midwayMarker.setMap(map);
	};

  	function makeLine(){
  		var lat1 = markerLocations[0].getPosition().d;
  		var lon1 = markerLocations[0].getPosition().e;
  		var lat2 = markerLocations[1].getPosition().d;
  		var lon2 = markerLocations[1].getPosition().e;

		var locationOne = new google.maps.LatLng(lat1, lon1);
		var locationTwo = new google.maps.LatLng(lat2, lon2);
		var flightPlanCoordinates = [
			locationOne, locationTwo
		];
		if(flightPathExists) flightPath.setMap(null);
		flightPath = new google.maps.Polyline({
			path: flightPlanCoordinates,
			geodesic: true,
			strokeColor: '#FF0000',
			strokeOpacity: 1.0,
			strokeWeight: 2
		});
		flightPath.setMap(map);
		flightPathExists = true;
		
		getMidPoint(lat1, lon2, lat2, lon2);

  	};


	function bindDomEvents(){
		window.addEventListener( 'resize', onWindowResize, false );
		google.maps.event.addListener(map, 'click', addMarker);
		document.getElementById("map").addEventListener('mousedown', function(e){
			e.stopPropagation();
		});
		makeButton.addEventListener("click", makeLine );
	};

    function init( ) {
    	makeButton.disabled = true;
    	setup3World();
    	setupMap();
    	bindDomEvents();

    	if (typeof(Number.prototype.toRad) === "undefined") {
			Number.prototype.toRad = function(angle) {
				return angle * Math.PI / 180;
			}
		}

		if (typeof(Number.prototype.toDegrees) === "undefined") {
			Number.prototype.toDegrees = function(angle) {
				return angle * (180 / Math.PI);
			}
		}
		
    } 

    init();

}(TW, TW.Main = TW.Main || {} ));


