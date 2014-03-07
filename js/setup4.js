window.TW = window.TW || {};

(function(TW, self, undefined){

	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	
	var container, stats, camera, controls, scene, renderer, grid,
		elevator, map, infowindow, flightPath, midwayMarker;
	
	var config = {
		gridSize: 100,
		gridUnit: 10
	};

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
		grid = new THREE.GridHelper( config.gridSize, config.gridUnit );
		scene.add( grid );
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
		var mapOptions = {
		    zoom: 8,
		    center: new google.maps.LatLng(40.6700, -73.9400),
		    mapTypeId: 'terrain'
		}
		map = new google.maps.Map(document.getElementById('map'), mapOptions);
		elevator = new google.maps.ElevationService();
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
		window.addEventListener( 'resize', onWindowResize, false );
		document.getElementById("map").addEventListener('mousedown', function(e){
			e.stopPropagation();
		});
	};

	self.getSetupObjects = function(){
		return {
			map: map,
			scene: scene,
			renderer: renderer,
			camera: camera,
			config: config
		}
	};

    function init( ) {
    	setup3World();
    	setupMap();
    	addAngleEquations();
    	bindDomEvents();
    } 

    init();

}(TW, TW.Setup = TW.Setup || {} ));


