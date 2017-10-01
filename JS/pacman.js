'use strict';

Physijs.scripts.worker = 'Libs/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

window.onload = init;

var scene;

var fpsCamera, fpsRenderer;

var hudCamera, hudRenderer;

var player;
var playerRotation = 0;

const speed = 0.1;

function init(){

	initScene(30,30);
	initFPS();
	initHUD(155,155);

	render();

}

function initScene(width, height){

	scene = new Physijs.Scene();
	scene.setGravity( new THREE.Vector3(0,0,0) );

	player = new Physijs.CapsuleMesh( new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial({color: 0xFFFF00}), 1);
	scene.add(player);

	generateWalls(width, height);
	generateFloor(width, height);

}

function generateWalls(width, height){

	var map = PACMAP.generateMap( width, height );

	for( var i = 0; i < map.length; i++){
		for( var j = 0; j < map[i].length; j++){

			if( map[i][j] && ( Math.abs(i-height/2) > 2 || Math.abs(j-width/2) > 2)  ){
				scene.add( makeWall(width, height, i, j) );
			}

		}
	}

	for( var i = 0; i < width; i++ ){

		scene.add( makeWall(width, height, -1, i) );
		scene.add( makeWall(width, height, width, i) );

	}

	for( var i = 0; i < height; i++ ){

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

	hudRenderer = new THREE.WebGLRenderer();//{ alpha: true });
	hudRenderer.setClearColor( 0x8888FF)
	
	hudRenderer.shadowMap.enabled = true;

	hudCamera = new THREE.OrthographicCamera( width / -2, width / 2, height / 2, height / -2);
	hudCamera.position.y = 100;

	hudCamera.lookAt(scene.position);

	var hud = document.createElement('div');
	hud.style.position = 'absolute';
	hud.style.height = 20 + '%';
	hud.style.bottom = 0 + '%';
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

    if( w > h )
    	side = Math.floor(h*0.2);
    else
    	side = Math.floor(w*0.2);

    hudRenderer.setSize(side,side);
}

function render(){

	if( Key.isDown(Key.A)){
		playerRotation += 0.1;
	}else if( Key.isDown(Key.D)){
		playerRotation -= 0.1;
	}

	player.rotation.set(0, playerRotation, 0);
    player.__dirtyRotation = true;

	if( Key.isDown(Key.W) ){

		player.position.set( player.position.x + speed * Math.sin(player.rotation.y), 0, player.position.z + speed * Math.cos(player.rotation.y));
    	player.__dirtyPosition = true;

	}else if( Key.isDown(Key.S) ){

		player.position.set( player.position.x - speed * Math.sin(player.rotation.y), 0, player.position.z - speed * Math.cos(player.rotation.y));
    	player.__dirtyPosition = true;

	}

	scene.simulate();

	resizeFPS();
	fpsRenderer.render( scene, fpsCamera );

	hudRenderer.setScissorTest(true);
	resizeHUD();
	hudRenderer.render( scene, hudCamera );

	requestAnimationFrame( render );

}