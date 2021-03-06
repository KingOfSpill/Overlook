'use strict';

Physijs.scripts.worker = 'Libs/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

document.exitPointerLock = document.exitPointerLock    ||
                           document.mozExitPointerLock;

window.onload = init;

var scene;

var hud;

var fpsCamera, fpsRenderer;

var hudCamera, hudRenderer;

var clock = new THREE.Clock();

var player, playerRotation = 0, playerGridPos, dead = false, killed = false, winning, won = false;
const speed = 0.15;

const width = 26, height = 29;

var jack = new Array();

var pellets, numPellets = 0;

var pelletSound, music, heresJohnny, muted = false, mDown = false;

var map;

var unPaused = false;

var overlay, centerText, button, centerImage, instructions
var myName;

function array2D(width, height){

	var arr = new Array();
	for( var i = 0; i < width; i++ ){

		arr[i] = new Array();

		for( var j = 0; j < height; j++ )
			arr[i][j] = null;

	}

	return arr;

}

function init(){

	pellets = array2D(width,height);
	initScene(width,height);

	initAudio();

	initFPS();
	initHUD(height*5 + 5,width*5 + 5);

	initDivs();

	spawnStartScreen();

	render();

}

function animatedTexture(texture, numFrames, frameTime){

	this.delta = -(Math.random());
	this.numFrames = numFrames;
	this.frameTime = frameTime;

	this.updateTexture = function(delta){

		this.delta += delta;

		if( this.delta > this.frameTime ){
			this.delta -= this.frameTime;

			texture.offset.x += 1/numFrames;
			while( texture.offset.x >= 1 )
				texture.offset.x -= 1;

			return true;

		}

		return false;

	}

}

function enemy( animatedTexture, sprite ){

	this.texture = animatedTexture;
	this.sprite = sprite;
	this.sprite.layers.set(2);
	this.marker = new THREE.Mesh( new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial({color: 0xFF0000}));
	this.marker.layers.set(1);
	scene.add(this.marker);

	this.targetPosition = this.sprite.position.clone();
	this.gridPosition = coordToGrid(this.sprite.position.x, this.sprite.position.z);
	this.lastGridPosition = coordToGrid(this.sprite.position.x, this.sprite.position.z);

	// Found at https://freesound.org/people/iujhu/sounds/269855/
	this.footstep = new Audio('Sounds/footstep.wav');

	this.update = function(delta){

		if( this.texture.updateTexture(delta) && !muted )
			this.footstep.play();

		this.marker.position.copy(this.sprite.position);

		if( this.sprite.position.distanceTo( this.targetPosition ) > 1 )
			this.sprite.position.lerp( this.targetPosition, speed/this.sprite.position.distanceTo(this.targetPosition) );
		else
			this.findNewTarget();

		this.footstep.volume = Math.min( 1, 20/this.sprite.position.distanceTo(player.position));

		

		if( this.gridPosition.every(function(v,i) { return v === playerGridPos[i]})  ){
			dead = true;
			if(!muted)
				heresJohnny.play();
		}

	}

	this.findNewTarget = function(){

		this.lastGridPosition = this.gridPosition;
		this.gridPosition = coordToGrid(this.sprite.position.x, this.sprite.position.z);

		const x = this.gridPosition[0];
		const z = this.gridPosition[1];

		var dir;

		//We want to randomize the 4 possible directions and go to the first one which was available
		var a = [0,1,2,3];
		var j, k, i;
	    for (i = a.length; i; i--) {
	        j = Math.floor(Math.random() * i);
	        k = a[i - 1];
	        a[i - 1] = a[j];
	        a[j] = k;
	    }

	    for( var l = 0; l < a.length; l++ ){

	    	if( this.checkNeighbor(a[l],x,z) ){
	    		dir = a[l];
	    		break;
	    	}

	    }

		if(dir == 0)
			this.targetPosition = gridToCoord( x, z-1 ).setComponent(1,this.sprite.position.y);
		else if(dir == 1)
			this.targetPosition = gridToCoord( x+1, z ).setComponent(1,this.sprite.position.y);
		else if(dir == 2)
			this.targetPosition = gridToCoord( x, z+1 ).setComponent(1,this.sprite.position.y);
		else if(dir == 3)
			this.targetPosition = gridToCoord( x-1, z ).setComponent(1,this.sprite.position.y);


	}

	this.checkNeighbor = function(dir, x, z){

		if(dir == 0 && z-1 >= 0 && this.lastGridPosition[1] != z-1)
			return !map[x][z-1];
		else if(dir == 1 && x+1 < width && this.lastGridPosition[0] != x+1)
			return !map[x+1][z];
		else if(dir == 2 && z+1 < height && this.lastGridPosition[1] != z+1)
			return !map[x][z+1];
		else if(dir == 3 && x-1 >= 0 && this.lastGridPosition[1] != z-1)
			return !map[x-1][z];

		return false;

	}

}

function initScene(width, height){

	scene = new Physijs.Scene();
	scene.setGravity( new THREE.Vector3(0,0,0) );

	player = new Physijs.CapsuleMesh( new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial({color: 0xFFFF00}), 1);
	player.position.z = -5;
	scene.add(player);

	playerGridPos = coordToGrid(0,0);

	generateWalls(width, height);
	generateFloor(width, height);

	scene.add( makeJack(0,0) );
	scene.add( makeJack(width-1,height-1) );
	scene.add( makeJack(width-1,0) );
	scene.add( makeJack(0,height-1) );

}

function makeJack(x,z){

	var jackTexture = new THREE.TextureLoader().load( "./Textures/jack.png" );
	jackTexture.magFilter = THREE.NearestFilter;
	jackTexture.minFilter = THREE.NearestFilter;
	jackTexture.wrapS = THREE.RepeatWrapping;
	jackTexture.wrapT = THREE.RepeatWrapping;
	jackTexture.repeat.set( 0.5, 1 );

	var jackSprite = new THREE.Sprite(new THREE.SpriteMaterial({color: 0x777777, map: jackTexture}));
	jackSprite.position.copy(gridToCoord(x,z));
	jackSprite.position.y = -0.5;
	jackSprite.scale.y = 4;
	jackSprite.scale.x = 4;

	var j = new enemy(new animatedTexture( jackTexture, 2, 1 ), jackSprite);

	jack.push( j );

	return j.sprite;

}

function generateWalls(width, height){

	map = PACMAP.generateMap( width, height );

	for( var i = 0; i < map.length; i++){
		for( var j = 0; j < map[i].length; j++){

			if( map[i][j] ){//&& ( Math.abs(i-height/2) > 2 || Math.abs(j-width/2) > 2)  ){
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
	pellet.scale.y = 4;
	pellet.scale.x = 4;

	pellet.layers.set(2);

	var marker = new THREE.Mesh( new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial({color: 0x000000}));
	marker.layers.set(1);
	marker.add(pellet);

	marker.position.x = 5*(x-width/2)+2.5;
	marker.position.z = 5*(z-height/2)+2.5;
	marker.position.y = -0.5;

	pellets[x][z] = marker;
	numPellets++;

	return marker;
	
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

	heresJohnny = new Audio('Sounds/heres-johnny.wav');

}

function initFPS(){

	fpsRenderer = new THREE.WebGLRenderer();
	fpsRenderer.setClearColor( 0x000033, 1.0 );
	
	fpsRenderer.shadowMap.enabled = true;

	fpsCamera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );
	fpsCamera.layers.enable(2);

	player.add(fpsCamera);
	fpsCamera.lookAt( new THREE.Vector3(0,0,10) );

	document.getElementById("mainView").appendChild( fpsRenderer.domElement );

}

function initHUD(width, height){

	hudRenderer = new THREE.WebGLRenderer({ alpha: true });
	//hudRenderer.setClearColor(0x8888FF);
	
	hudRenderer.shadowMap.enabled = true;

	hudCamera = new THREE.OrthographicCamera( height / -2, height / 2, width / 2, width / -2);
	hudCamera.position.y = 1000;
	hudCamera.layers.enable(1);

	hudCamera.lookAt(scene.position);

	hud = document.createElement('div');
	hud.style.position = 'absolute';
	hud.style.bottom = 0 + '%';
	hud.style.padding = 0 + 'px';
	hud.style.margin = 0 + 'px';
	hud.style.visibility = 'hidden';
	hud.style.border = "thick solid #222233";  

	hud.appendChild( hudRenderer.domElement );
	document.body.appendChild(hud);

}

function initDivs(){

	centerImage = document.createElement('img');
	centerImage.style.position = 'absolute';
	centerImage.style.height = 40 + '%';
	centerImage.style.width = 100 + '%';
	centerImage.style.textAlign = 'center';
	centerImage.style.top = 10 + '%';
	centerImage.style.left = 0 + '%';
	centerImage.style.padding = 0 + 'px';
	centerImage.style.margin = 0 + 'px';

	overlay = document.createElement('div');
	overlay.style.position = 'absolute';
	overlay.style.height = 100 + '%';
	overlay.style.width = 100 + '%';
	overlay.style.top = 0 + '%';
	overlay.style.padding = 0 + 'px';
	overlay.style.margin = 0 + 'px';

	centerText = document.createElement('div');
	centerText.style.position = 'absolute';
	centerText.style.height = 40 + '%';
	centerText.style.width = 40 + '%';
	centerText.style.textAlign = 'center';
	centerText.style.top = 40 + '%';
	centerText.style.left = 30 + '%';
	centerText.style.padding = 0 + 'px';
	centerText.style.margin = 0 + 'px';

	button = document.createElement('button');
	button.style.position = 'absolute';
	button.style.height = 20 + '%';
	button.style.width = 20 + '%';
	button.style.textAlign = 'center';
	button.style.top = 60 + '%';
	button.style.left = 40 + '%';
	button.style.padding = 0 + 'px';
	button.style.margin = 0 + 'px';
	button.style.borderRadius = 20 + '%';

	instructions = document.createElement('div');
	instructions.style.position = 'absolute';
	instructions.style.width = 20 + '%';
	instructions.style.height = 40 + '%';
	instructions.style.color = "white";
	instructions.style.textAlign = 'left';
	instructions.style.fontSize = 3 + 'vw';
	instructions.style.bottom = 5 + '%';
	instructions.style.left = 5 + '%';
	instructions.style.fontFamily = "sans-serif";
	instructions.innerHTML = "Controls:<br/>" + 
							 "Aim: Mouse<br/>" + 
							 "Walk: WASD<br/>" + 
							 "Pause: ESC<br/>" +
							 "Mute: M<br/>";

	myName = document.createElement('div');
	myName.style.position = 'absolute';
	myName.style.width = 20 + '%';
	myName.style.textAlign = 'right';
	myName.style.color = "white";
	myName.style.fontSize = 1.5 + 'vw';
	myName.style.bottom = 1 + '%';
	myName.style.right = 1 + '%';
	myName.style.fontFamily = "sans-serif";
	myName.innerHTML = "By: Grant Goodman";

}

function spawnStartScreen(){

	window.addEventListener("click", onClick);

	document.body.appendChild(myName);

	centerImage.src = 'Textures/Overlook.png'
	document.body.appendChild(centerImage);

	document.body.appendChild(instructions);

	button.style.fontSize = 2 + 'vw';
	button.style.backgroundColor = 'lightred';
	button.style.color = 'black';
	button.style.fontFamily = "sans-serif";
	button.innerHTML = "START";

	button.addEventListener("click", removeStartScreen);

	document.body.appendChild(button);
	
}
function removeStartScreen(){

		document.body.removeChild(centerImage);
		document.body.removeChild(button);
		document.body.removeChild(myName);
		document.body.removeChild(instructions);
		hud.style.visibility = 'visible';
		unPaused = true;
		window.addEventListener("click", onClick);

		button.removeEventListener("click", removeStartScreen);

		setTimeout( function(){
			document.addEventListener('pointerlockchange', mouseLocked, false);
			document.addEventListener('mozpointerlockchange', mouseLocked, false);
			window.removeEventListener("click", onClick);
		}, 500);

	var loader = new THREE.FontLoader();
	loader.load('Fonts/helvetiker_regular.typeface.json', function(font){

		var textGeometry = new THREE.TextGeometry( "FIND THE REDRUMS\n DON'T GET KILLED", {
			font: font,
			size: 0.8,
			height: 0.3,
			curveSegments: 1
		});

		textGeometry.computeBoundingBox();
		var offset = -0.5 * ( textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x );

		var text = new THREE.Mesh( textGeometry, new THREE.MeshBasicMaterial({color: 0x550000}) );
		text.position.x = -offset;
		text.position.z = 2;
		text.rotation.y = Math.PI;
		scene.add( text );

	});

}

function spawnPauseDivs(){
	overlay.style.backgroundColor = 'white';
	overlay.style.opacity = 0.3;
	overlay.style.filter = "alpha(opacity=30)";
	document.body.appendChild(overlay);

	centerText.style.fontSize = 6 + 'vw';
	centerText.style.color = 'red';
	centerText.style.fontFamily = "sans-serif";
	centerText.innerHTML = "PAUSED";
	document.body.appendChild(centerText);

	button.style.fontSize = 2 + 'vw';
	button.style.backgroundColor = 'lightred';
	button.style.color = 'red';
	button.style.fontFamily = "sans-serif";
	button.innerHTML = "PLAY";
	document.body.appendChild(button);

	instructions.style.color = 'red';
	document.body.appendChild(instructions);

	myName.style.color = 'red';
	document.body.appendChild(myName);

	window.addEventListener("click", onClick);
	
}

function spawnDeathDivs(){

	if( !killed ){
		killed = true

		document.removeEventListener('pointerlockchange', mouseLocked, false);
		document.removeEventListener('mozpointerlockchange', mouseLocked, false);
		document.exitPointerLock();
		unPaused = false;

		window.removeEventListener("click", onClick);

		overlay.style.backgroundColor = 'red';
		overlay.style.opacity = 0.3;
		overlay.style.filter = "alpha(opacity=30)";
		document.body.appendChild(overlay);

		centerText.style.fontSize = 6 + 'vw';
		centerText.style.color = 'red';
		centerText.style.fontFamily = "sans-serif";
		centerText.innerHTML = "YOU DIED";
		document.body.appendChild(centerText);

		button.style.fontSize = 2 + 'vw';
		button.style.backgroundColor = 'lightred';
		button.style.color = 'red';
		button.style.fontFamily = "sans-serif";
		button.innerHTML = "PLAY AGAIN?";

		button.addEventListener ("click", function() {
		  location.reload();
		});

		document.body.appendChild(button);

	}
	
}

function spawnWinDivs(){

	if( !won ){
		won = true

		document.removeEventListener('pointerlockchange', mouseLocked, false);
		document.removeEventListener('mozpointerlockchange', mouseLocked, false);
		document.exitPointerLock();
		unPaused = false;

		window.removeEventListener("click", onClick);

		overlay.style.backgroundColor = 'white';
		overlay.style.opacity = 0.3;
		overlay.style.filter = "alpha(opacity=30)";
		document.body.appendChild(overlay);

		centerText.style.fontSize = 6 + 'vw';
		centerText.style.color = 'teal';
		centerText.style.fontFamily = "sans-serif";
		centerText.innerHTML = "YOU WON!";
		document.body.appendChild(centerText);

		button.style.fontSize = 2 + 'vw';
		button.style.backgroundColor = 'white';
		button.style.color = 'teal';
		button.style.fontFamily = "sans-serif";
		button.innerHTML = "PLAY AGAIN?";

		button.addEventListener ("click", function() {
		  location.reload();
		});

		document.body.appendChild(button);

	}
	
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

	if(unPaused || dead || won){
		updatePlayer();
	}

	if( Key.isDown( Key.M ) )
		mDown = true;
	else if( mDown ){
		mDown = false;
		muted = !muted;
		if(muted)
			music.pause();
		else
			music.play();
	}

	if(unPaused){

		collectPellets();

		if( numPellets == 0 )
			spawnWinDivs();

		if( !dead ){
			const delta = clock.getDelta();

			for( var i = 0; i < jack.length; i++)
				jack[i].update( delta );
		}

		scene.simulate();

	}

	resizeFPS();
	fpsRenderer.render( scene, fpsCamera );

	hudRenderer.setScissorTest(true);
	resizeHUD();
	hudRenderer.render( scene, hudCamera );

	requestAnimationFrame( render );

}

function onClick(){

	fpsRenderer.domElement.requestPointerLock = fpsRenderer.domElement.requestPointerLock || fpsRenderer.domElement.mozRequestPointerLock || fpsRenderer.domElement.webkitRequestPointerLock;
	fpsRenderer.domElement.requestPointerLock();

}

window.addEventListener("mousemove", function(e){ handleMouseMovement(e) } , false);

function handleMouseMovement(e){

	var requestedElement = fpsRenderer.domElement;

	if (document.pointerLockElement === requestedElement || document.mozPointerLockElement === requestedElement || document.webkitPointerLockElement === requestedElement ){
		
		var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
	
		playerRotation -= movementX*0.0025;

	}else{

	}
	
}

function coordToGrid(x,z){

	const gX = Math.floor( (x)/5 + (width/2) );
	const gZ = Math.floor( (z)/5 + (height/2) );

	return [gX,gZ];

}

function gridToCoord(gX,gZ){

	const x = 5*(gX-width/2)+2.5;
	const z = 5*(gZ-height/2)+2.5;

	return new THREE.Vector3(x,0,z);

}

function mouseLocked(){

	if( !winning || !dead ){

		if( unPaused ){
			unPaused = false;
			spawnPauseDivs();
			music.pause();
		}else{

			window.removeEventListener("click", onClick);
			unPaused = true;
			document.body.removeChild(overlay);
			document.body.removeChild(centerText);
			document.body.removeChild(button);
			document.body.removeChild(myName);
			document.body.removeChild(instructions);
			if(!muted)
				music.play();

		}

	}

}

function updatePlayer(){		

	if(!dead){
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

		player.setLinearVelocity(new THREE.Vector3(0, 0, 0));

	}else{

		player.position.set(player.position.x, (player.position.y + 2)/2 - 2, player.position.z );
		player.__dirtyPosition = true;
		player.rotation.z = (player.rotation.z * 3 + Math.PI/2)/4;
		player.__dirtyRotation = true;

		spawnDeathDivs();

	}

}

function collectPellets(){

	if( playerGridPos != coordToGrid(player.position.x, player.position.z) ){

		playerGridPos = coordToGrid(player.position.x, player.position.z);

		if( pellets[playerGridPos[0]][playerGridPos[1]] != null ){

			numPellets--;
			if(!muted)
				pelletSound.play();
			scene.remove(pellets[playerGridPos[0]][playerGridPos[1]]);
			pellets[playerGridPos[0]][playerGridPos[1]] = null;

		}

	}

}