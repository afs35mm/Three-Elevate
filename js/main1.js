window.TW = window.TW || {};

(function(TW, self, undefined){

	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	//3JS GLOBALS
	var container, stats, camera, controls, scene, renderer;
	//GOOGLE MAPS ELEVATION GLOBALS
	var elevator, map, infowindow, denali;

	var config = {
		gridSize: 100,
		gridUnit: 10,
		samplePoints: 100
	}

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

    function makeCenterBall(elevation){
    	var rgbRed =  "rgb(0,255,0)";
		var geometry = new THREE.SphereGeometry( 3, 32, 32 );
		var material = new THREE.MeshBasicMaterial( {color:rgbRed} );
		var sphere = new THREE.Mesh( geometry, material );
		scene.add(sphere);
		sphere.position.y = elevation;;
		renderer.render( scene, camera );
    };

    function getElevation(event){
		var locations = [];
		var clickedLocation = event.latLng;
		locations.push(clickedLocation); 
		var positionalRequest = {
			'locations': locations
		}
		elevator.getElevationForLocations(positionalRequest, function(results, status) {
			if (status == google.maps.ElevationStatus.OK) {
				if (results[0]) {
					getElevationPath(results[0]);

					makeCenterBall(results[0].elevation);
				    infowindow.setContent('The elevation at this point <br>is ' + results[0].elevation + ' meters.');
				    infowindow.setPosition(clickedLocation);
				    infowindow.open(map);
				} else {
					alert('No results found');
				}
			} else {
				alert('Elevation service failed due to: ' + status);
			}
		});
    };


    function getElevationPath(latLonObj){
    	//console.log(latLonObj);
    	elevator = new google.maps.ElevationService();
		var locWest = new google.maps.LatLng(latLonObj.location.d, latLonObj.location.e - 0.5);
		var locEast = new google.maps.LatLng(latLonObj.location.d, latLonObj.location.e + 0.5);
    	
		//DRAW LINE
		var flightPlanCoordinates = [
			locWest, locEast
		];
		var flightPath = new google.maps.Polyline({
			path: flightPlanCoordinates,
			geodesic: true,
			strokeColor: '#FF0000',
			strokeOpacity: 1.0,
			strokeWeight: 2
		});

		flightPath.setMap(map);

    	var path = [ locWest, locEast];
    	var pathRequest = {
		    'path': path,
		    'samples': config.samplePoints
		}
    
    	elevator.getElevationAlongPath(pathRequest, plotElevation);
		function plotElevation(results, status) {
			if (status != google.maps.ElevationStatus.OK) {
				return;
			}
			var elevations = results;

			var lineGeometry = new THREE.Geometry();

			var randomColor1 = Math.floor( Math.random() * 256 )
			var randomColor2 = Math.floor( Math.random() * 256 )

			for( i = 0; i < config.samplePoints; i++){
				var geometry = new THREE.SphereGeometry( 2, 32, 32 );
				var material = new THREE.MeshBasicMaterial( {color: 
					"rgb(" + Math.floor(255 * ( i / (config.samplePoints - 1) )) + "," + randomColor1 + "," + randomColor2 + ")" 
				});
				console.log(255 * ( i / (config.samplePoints - 1) ));
				var sphere = new THREE.Mesh( geometry, material );
				
				var currentPosY = results[i].elevation;
				var currentPosX = (i * ( config.gridSize * 2 / (config.samplePoints - 1) )) - config.gridSize;

				sphere.position.y = currentPosY;
				sphere.position.x = currentPosX;
				scene.add(sphere);

				lineGeometry.vertices.push(new THREE.Vector3(currentPosX, currentPosY, 0));
			}
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
			var line = new THREE.Line(lineGeometry, lineMaterial);
			scene.add(line);
			renderer.render( scene, camera );
		}
    }


	function bindDomEvents(){
		window.addEventListener( 'resize', onWindowResize, false );
		google.maps.event.addListener(map, 'click', getElevation);

		document.getElementById("map").addEventListener('mousedown', function(e){
			e.stopPropagation();
		});
	};

    function init( ) {
    	setup3World();
    	setupMap();
    	bindDomEvents();
    } 

    init();



}(TW, TW.Main = TW.Main || {} ));


