// declare a bunch of variable we will need later
var camera, scene, renderer;
var cube, tetrahedron;

/**
 * Initialize Three.js including the scene that we are going to use and adding the camera to that scene
 * @param theCanvas The canvas that will be used for the rendering
 */
function initThree(theCanvas) {

	// init the WebGL renderer and append it to the canvas
	renderer = new THREE.WebGLRenderer({
		canvas: theCanvas
	});
	renderer.setClearColorHex(0x000000, 1); //We want black were nothing is rendered in the canvas

	// create the scene. Scenes are used to group all different parts that are needed.
	scene = new THREE.Scene();

	// create the camera and add it to the scene.
	camera = new THREE.PerspectiveCamera(45, theCanvas.width / theCanvas.height, 0.1, 100);
	scene.add(camera);
}

/**
 * Create the geometries that will be use and add them to the scene
 */
function initGeometry() {

	//Create the materials that will be used by the different sides of our geometries
	var materials = [];
	materials[0] = new THREE.MeshBasicMaterial({
		color: 0xff0000
	});
	materials[1] = new THREE.MeshBasicMaterial({
		color: 0xffff00
	});
	materials[2] = new THREE.MeshBasicMaterial({
		color: 0x00ff00
	});
	materials[3] = new THREE.MeshBasicMaterial({
		color: 0xff8888
	});
	materials[4] = new THREE.MeshBasicMaterial({
		color: 0xff00ff
	});
	materials[5] = new THREE.MeshBasicMaterial({
		color: 0x0000ff
	});

	//Create the Cube with size 2
	var temp = new THREE.CubeGeometry(2, 2, 2);


	//add the different materials to the cube and tell what side should use what material
	temp.materials = materials;
	for (var i in temp.faces) {
		temp.faces[i].materialIndex = i;
	}

	// The geometry plus the material is grouped together in a Mesh object.
	// The MeshFaceMaterial object tells Three.js that is should use seperate materials
	// for every side.
	cube = new THREE.Mesh(temp, new THREE.MeshFaceMaterial());

	// Set the position of the cube
	cube.position.set(-1.5, 0, -8);

	// We must add the cube to the scene for it to rendered.
	scene.add(cube);

	//Add your tetrahedron under this line
	//You can reuse materials from the cube just keep in mind that it only have 4 sides
	//tetrahedron circumsphere radius R=(sqrt(6)/4)*a, a=2*sqrt(2), source of formula:   http://www.mathematische-basteleien.de/tetrahedron.htm
	var circumsphere = (Math.sqrt(6)/4)*(2*Math.sqrt(2));

	var tempTet = new THREE.TetrahedronGeometry(circumsphere);
	tempTet.materials = materials;
	for (var i in tempTet.faces) {
		tempTet.faces[i].materialIndex = i;
	}

	tetrahedron = new THREE.Mesh(tempTet, new THREE.MeshFaceMaterial());

	tetrahedron.position.set(1.5, 1, -8);

	scene.add(tetrahedron);



}



/**
 * This function takes care of all changes that are needed to animate our objects
 */
function animateThree() {

	var timeNow = new Date().getTime();
	if (lastTime != 0) {
		var elapsed = timeNow - lastTime;

		rotationCube -= ((75 * elapsed) / 1000.0) * Math.PI / 180;
	}
	lastTime = timeNow;

	// Rotate the cube
	cube.rotation.x = rotationCube;
	cube.rotation.y = rotationCube / 2;

	tetrahedron.rotation.x = rotationCube;
	tetrahedron.rotation.z = -rotationCube / 2;

}

/**
 * Main loop function. Called periodacilly by the system
 */
function tickThree() {
	if (running == 1) { //Check if we are still running
		requestAnimationFrame(tickThree); //Tell browser to call us again next screen update
		animateThree();
		renderer.render(scene, camera);
	}
}

/**
 * Start our Three.js program
 */
function startThree() {
	// test if webgl is supported
	if (!Detector.webgl) Detector.addGetWebGLMessage();

	//This part replaces the current canvas with a new one so that we start fresh
	var canvas = document.createElement('canvas');
	var oldCanvas = document.getElementById("glCanvas");
	canvas.id = "glCanvas";
	canvas.width = oldCanvas.width;
	canvas.height = oldCanvas.height;
	oldCanvas.parentNode.replaceChild(canvas, oldCanvas);

	//Setup Three.js
	initThree(canvas);

	//Setup our scene and the objects we will be using
	initGeometry();

	//Initialize some values that are being used
	rotationCube = 0;
	lastTime = 0;
	running = 1; //Make Three the running process

	tickThree(); //Lets start things
}