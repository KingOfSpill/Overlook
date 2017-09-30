window.onload = init;

var scene;

var fpsCamera, fpsRenderer;

var hudCamera, hudRenderer;

var player;

function init(){

	/*var mapText = document.createElement('div');
	mapText.style.position = 'absolute';
	mapText.style.width = 100 + '%';
	mapText.style.height = 100 + '%';
	mapText.style.color = "black";
	mapText.style.fontSize = 2 + 'vw';
	mapText.style.top = 5 + '%';
	mapText.style.left = 5 + '%';

	var map = PACMAP.generateMap( 30, 30 );
	
	mapText.innerHTML = PACMAP.toHTML( map );

	document.body.appendChild(mapText);*/

	initScene(30,30);
	initFPS();
	initHUD(150,150);

	render();

}

function initScene(width, height){

	scene = new THREE.Scene();

	player = new THREE.Mesh( new THREE.SphereGeometry(2), new THREE.MeshBasicMaterial({color: 0xFFFF00}), 0);
	player.position.y = 5;
	scene.add(player);

	generateWalls(width, height);
	generateFloor(width, height);

}

function generateWalls(width, height){

	var map = PACMAP.generateMap( width, height );

	var wallTexture = new THREE.TextureLoader().load( "./Textures/snowyHedge.png" );
	wallTexture.magFilter = THREE.NearestFilter;
	wallTexture.minFilter = THREE.NearestFilter;
	wallTexture.wrapS = THREE.RepeatWrapping;
	wallTexture.wrapT = THREE.RepeatWrapping;
	wallTexture.repeat.set( 2, 2 );

	var wallMaterial = new THREE.MeshBasicMaterial({map: wallTexture, color: 0x777777});

	for( var i = 0; i < map.length; i++){
		for( var j = 0; j < map[i].length; j++){

			if( map[i][j] ){
				var box = new THREE.Mesh( new THREE.BoxGeometry(5,5,5), wallMaterial, 0);
				box.position.x = 5*(j-width/2)+2.5;
				box.position.z = 5*(i-height/2)+2.5;
				scene.add( box );
			}

		}
	}

	for( var i = 0; i < width; i++ ){

		var box = new THREE.Mesh( new THREE.BoxGeometry(5,5,5), wallMaterial, 0);
		box.position.x = 5*(width/2)+2.5;
		box.position.z = 5*(i-height/2)+2.5;
		scene.add(box);

		box = new THREE.Mesh( new THREE.BoxGeometry(5,5,5), wallMaterial, 0);
		box.position.x = -5*(width/2)+2.5;
		box.position.z = 5*(i-height/2)+2.5;
		scene.add(box);

	}

	for( var i = 0; i < height; i++ ){

		var box = new THREE.Mesh( new THREE.BoxGeometry(5,5,5), wallMaterial, 0);
		box.position.x = 5*(i-width/2)+2.5;
		box.position.z = 5*(height/2)+2.5;
		scene.add(box);

		box = new THREE.Mesh( new THREE.BoxGeometry(5,5,5), wallMaterial, 0);
		box.position.x = 5*(i-width/2)+2.5;
		box.position.z = -5*(height/2)+2.5;
		scene.add(box);

	}

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
	fpsCamera.position.y = -5;
	fpsCamera.lookAt( new THREE.Vector3(0,-5,10) );

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

	if( Key.isDown(Key.W) ){

		player.position.z += Math.cos(player.rotation.y);
		player.position.x += Math.sin(player.rotation.y);

	}
	if( Key.isDown(Key.S) ){

		player.position.z -= Math.cos(player.rotation.y);
		player.position.x -= Math.sin(player.rotation.y);

	}

	if( Key.isDown(Key.A))
		player.rotation.y += 0.1;
	if( Key.isDown(Key.D))
		player.rotation.y -= 0.1;

	resizeFPS();
	fpsRenderer.render( scene, fpsCamera );

	hudRenderer.setScissorTest(true);
	resizeHUD();
	hudRenderer.render( scene, hudCamera );

	requestAnimationFrame( render );

}