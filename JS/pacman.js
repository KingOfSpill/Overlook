'use strict';

Physijs.scripts.worker = 'Libs/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

window.onload = init;

var scene;

var fpsCamera, fpsRenderer;

var hudCamera, hudRenderer;

var clock = new THREE.Clock();

var player, playerRotation = 0, playerGridPos;
const speed = 0.15;

const width = 28, height = 31;

var jack;

var pellets;

var pelletSound, music;

function array2D(width, height){

	var arr = new Array();
	for( var i = 0; i < height; i++ ){

		arr[i] = new Array();

		for( var j = 0; j < width; j++ )
			arr[i][j] = null;

	}

	return arr;

}

function init(){

	pellets = array2D(height,width);
	initScene(width,height);

	initAudio();

	initFPS();
	initHUD(width*5 + 5,height*5 + 5);

	render();

}

function animatedTexture(texture){

	this.delta = 0;

	this.updateTexture = function(delta){

		this.delta += delta;

		if( this.delta > 1){
			this.delta = 0;

			texture.offset.x += 0.5;
			while( texture.offset.x >= 1 )
				texture.offset.x -= 1;

		}

	}

}

function initScene(width, height){

	scene = new Physijs.Scene();
	scene.setGravity( new THREE.Vector3(0,0,0) );

	player = new Physijs.CapsuleMesh( new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial({color: 0xFFFF00}), 1);
	scene.add(player);

	playerGridPos = coordToGrid(0,0);

	var jackTexture = new THREE.TextureLoader().load( "./Textures/jack.png" );
	jackTexture.magFilter = THREE.NearestFilter;
	jackTexture.minFilter = THREE.NearestFilter;
	jackTexture.wrapS = THREE.RepeatWrapping;
	jackTexture.wrapT = THREE.RepeatWrapping;
	jackTexture.repeat.set( 0.5, 1 );

	jack = new animatedTexture( jackTexture );

	var enemy = new THREE.Sprite(new THREE.SpriteMaterial({color: 0x777777, map: jackTexture}));
	enemy.position.z = 5;
	enemy.position.y = -0.5;
	enemy.scale.y = 4;
	enemy.scale.x = 4;
	scene.add( enemy );

	generateWalls(width, height);
	generateFloor(width, height);

}

function generateWalls(width, height){

	var map = PACMAP.generateMap( height, width );

	for( var i = 0; i < map.length; i++){
		for( var j = 0; j < map[i].length; j++){

			if( map[i][j] && ( Math.abs(i-height/2) > 2 || Math.abs(j-width/2) > 2)  ){
				scene.add( makeWall(width, height, i, j) );
			}else if( Math.random() > 0.9 ){
				scene.add( makePellet(width, height, i, j) );
			}

		}
	}

	for( var i = 0; i < height; i++ ){

		scene.add( makeWall(width, height, -1, i) );
		scene.add( makeWall(width, height, width, i) );

	}

	for( var i = 0; i < width; i++ ){

		scene.add( makeWall(width, height, i, -1) );
		scene.add( makeWall(width, height, i, height) );

	}

}

function makeWall(width, height, x, z){

	var wallTexture = new THREE.TextureLoader().load( "./Textures/snowyHedge.png" );
	wallTexture.magFilter = THREE.NearestFilter;
	wallTexture.minFilter = THREE.NearestFilter;
	wallTexture.wrapS = THREE.RepeatWrapping;
	wallTexture.wrapT = THREE.RepeatWrapping;
	wallTexture.repeat.set( 2, 3 );

	var wallMaterial = new THREE.MeshBasicMaterial({map: wallTexture, color: 0x777777});

	var box = new Physijs.BoxMesh( new THREE.BoxGeometry(5,7.5,5), wallMaterial, 0);
	box.position.x = 5*(x-width/2)+2.5;
	box.position.z = 5*(z-height/2)+2.5;

	return box;

}

function makePellet(width, height, x, z){

	var pelletTexture = new THREE.TextureLoader().load( "./Textures/redrum.png" );
	pelletTexture.magFilter = THREE.NearestFilter;
	pelletTexture.minFilter = THREE.NearestFilter;
	pelletTexture.wrapS = THREE.RepeatWrapping;
	pelletTexture.wrapT = THREE.RepeatWrapping;
	pelletTexture.repeat.set( 1, 1 );

	var pellet = new THREE.Sprite(new THREE.SpriteMaterial({color: 0x777777, map: pelletTexture}));
	pellet.position.x = 5*(x-width/2)+2.5;
	pellet.position.z = 5*(z-height/2)+2.5;
	pellet.position.y = -0.5;
	pellet.scale.y = 4;
	pellet.scale.x = 4;

	pellets[x][z] = pellet;

	return pellet;
	
}

function generateFloor(width,height){

	var floorTexture = new THREE.TextureLoader().load( "./Textures/snowyGround.png" );
	floorTexture.magFilter = THREE.NearestFilter;
	floorTexture.minFilter = THREE.NearestFilter;
	floorTexture.wrapS = THREE.RepeatWrapping;
	floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set( width*2, height*2 );

	var floor = new THREE.Mesh( new THREE.BoxGeometry(width*5,5,height*5), new THREE.MeshBasicMaterial({map: floorTexture, color: 0x777777}), 0);
	floor.position.y = -5;
	scene.add(floor);

}

function initAudio(){

	// Found at https://freesound.org/people/klankbeeld/sounds/133100/
	music = new Audio('Sounds/ambient.wav');
	music.loop = true;
	music.play();

	pelletSound = new Audio('Sounds/redrum.wav');

}

function initFPS(){

	fpsRenderer = new THREE.WebGLRenderer();
	fpsRenderer.setClearColor( 0x000033, 1.0 );
	
	fpsRenderer.shadowMap.enabled = true;

	fpsCamera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );

	player.add(fpsCamera);
	fpsCamera.lookAt( new THREE.Vector3(0,0,10) );

	document.getElementById("mainView").appendChild( fpsRenderer.domElement );

}

function initHUD(width, height){

	hudRenderer = new THREE.WebGLRenderer({ alpha: true });
	//hudRenderer.setClearColor(0x8888FF);
	
	hudRenderer.shadowMap.enabled = true;

	hudCamera = new THREE.OrthographicCamera( width / -2, width / 2, height / 2, height / -2);
	hudCamera.position.y = 1000;

	hudCamera.lookAt(scene.position);

	var hud = document.createElement('div');
	hud.style.position = 'absolute';
	hud.style.bottom = 0 + '%';
	hud.style.padding = 0 + 'px';
	hud.style.margin = 0 + 'px';
	hud.style.border = "thick solid #222233";  

	hud.appendChild( hudRenderer.domElement );
	document.body.appendChild(hud);

}

function resizeFPS() {
	const w = document.body.clientWidth;
	const h = document.body.clientHeight;
    fpsRenderer.setSize(w, h);
    fpsCamera.aspect = w / h;
    fpsCamera.updateProjectionMatrix();
};

function resizeHUD(){
	const w = document.body.clientWidth;
	const h = document.body.clientHeight;
	var side;

    if( w > h ){
    	side = Math.round(h*0.30);
    	hudRenderer.setSize( (side/height)*width ,side, true);
    	hudRenderer.setScissor(0,0,(side/height)*width,side)
    }else{
    	side = Math.round(w*0.30);
    	hudRenderer.setSize(side,(side/width)*height, true);
    	hudRenderer.setScissor(0,0,side,(side/width)*height)
    }

    
}

function render(){

	updatePlayer();

	collectPellets();

	player.setLinearVelocity(new THREE.Vector3(0, 0, 0));

	jack.updateTexture( clock.getDelta() );

	scene.simulate();

	resizeFPS();
	fpsRenderer.render( scene, fpsCamera );

	hudRenderer.setScissorTest(true);
	resizeHUD();
	hudRenderer.render( scene, hudCamera );

	requestAnimationFrame( render );

}

window.addEventListener("click", function(){

	fpsRenderer.domElement.requestPointerLock = fpsRenderer.domElement.requestPointerLock || fpsRenderer.domElement.mozRequestPointerLock || fpsRenderer.domElement.webkitRequestPointerLock;
	fpsRenderer.domElement.requestPointerLock();

});

window.addEventListener("mousemove", function(e){ handleMouseMovement(e) } , false);

function mouseLockChanged(){

	
		document.removeEventListener("mousemove", handleMouseMovement, false);

}

function handleMouseMovement(e){

	var requestedElement = fpsRenderer.domElement;

	if (document.pointerLockElement === requestedElement || document.mozPointerLockElement === requestedElement || document.webkitPointerLockElement === requestedElement ){
		
		var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
	
		playerRotation -= movementX*0.0025;

	}else{

	}
	
}

function coordToGrid(x,z){

	var gX = Math.floor( (x)/5 + (width/2) );
	var gZ = Math.floor( (z)/5 + (height/2) );

	return [gX,gZ];

}

function updatePlayer(){

	player.rotation.set(0, playerRotation, 0);
    player.__dirtyRotation = true;

    var deltaX = 0;
    var deltaZ = 0;

    var numPressed = 0;

	if( Key.isDown(Key.W) ){

		numPressed++;
		deltaX += speed * Math.sin(playerRotation);
		deltaZ += speed * Math.cos(playerRotation);

	}else if( Key.isDown(Key.S) ){

		numPressed++;
		deltaX -= speed * Math.sin(playerRotation);
		deltaZ -= speed * Math.cos(playerRotation);

	}

	if( Key.isDown(Key.A) ){

		numPressed++;
		deltaX += speed * Math.sin(playerRotation + Math.PI/2);
		deltaZ += speed * Math.cos(playerRotation + Math.PI/2);

	}else if( Key.isDown(Key.D) ){

		numPressed++;
		deltaX -= speed * Math.sin(playerRotation + Math.PI/2);
		deltaZ -= speed * Math.cos(playerRotation + Math.PI/2);

	}

	if( numPressed > 0 ){
		deltaX /= numPressed;
		deltaZ /= numPressed;

		player.position.set( player.position.x + deltaX, 0, player.position.z + deltaZ);
	    player.__dirtyPosition = true;
	}

}

function collectPellets(){

	if( playerGridPos != coordToGrid(player.position.x, player.position.z) ){

		playerGridPos = coordToGrid(player.position.x, player.position.z);

		if( pellets[playerGridPos[0]][playerGridPos[1]] != null ){

			pelletSound.play();
			scene.remove(pellets[playerGridPos[0]][playerGridPos[1]]);

		}

	}

}