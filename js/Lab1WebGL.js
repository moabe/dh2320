var gl;
/**
 * Initialize WebGL on the given canvas
 * @param canvas The canvas used for WebGL 
 */

var audio = document.getElementById("myAudio");
//alert(vid.paused);

function initWebGL(canvas) {
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	} catch (e) {}
	if (!gl) {
		alert("Could not initialise WebGL, sorry :-(");
	}
}

/**
 * Get the shader with the id from the document
 * @param gl The WebGL context
 * @param id The name of the shader
 * @returns The shader
 */
function getShader(gl, id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while (k) {
		if (k.nodeType == 3) {
			str += k.textContent;
		}
		k = k.nextSibling;
	}

	var shader;
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

var shaderProgram;

/**
 * Initialize our shaders and connect the different parts
 */
function initShaders() {
	var fragmentShader = getShader(gl, "shader-fs");
	var vertexShader = getShader(gl, "shader-vs");

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Could not initialise shaders");
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram,
		"aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram,
		"aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram,
		"uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram,
		"uMVMatrix");
}

//Matrixes that are used by our program
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

/**
 * pushes the current move matrix on the stack
 */
function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

/**
 * Popes the top matrix from the stack and replaces the current move matrix with it
 */
function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}

/**
 * Update the shader with the current perspective and move matrix
 */
function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//All GL Buffers
var tetrahedronVertexPositionBuffer;
var tetrahedronVertexColorBuffer;
var cubeVertexPositionBuffer;
var cubeVertexColorBuffer;
var cubeVertexIndexBuffer;

/**
 * Initialize our buffers for the application
 */
function initBuffers() {

	//Create the cube
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	vertices = [
	// Front face
	-1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

	// Back face
	-1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,

	// Top face
	-1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,

	// Bottom face
	-1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

	// Right face
	1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,

	// Left face
	-1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = 24;

	cubeVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
	colors = [[1.0, 0.0, 0.0, 1.0], // Front face
	[1.0, 1.0, 0.0, 1.0], // Back face
	[0.0, 1.0, 0.0, 1.0], // Top face
	[1.0, 0.5, 0.5, 1.0], // Bottom face
	[1.0, 0.0, 1.0, 1.0], // Right face
	[0.0, 0.0, 1.0, 1.0] // Left face
	];

	//We expand the colors so that every vertex in the face has the same color
	var unpackedColors = [];
	for (var i in colors) {
		var color = colors[i];
		//4 vertexes for a square but keep in mind that a triangel only has 3
		for (var j = 0; j < 4; j++) {
			unpackedColors = unpackedColors.concat(color);
		}
	}
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors),
		gl.STATIC_DRAW);
	cubeVertexColorBuffer.itemSize = 4;
	cubeVertexColorBuffer.numItems = 24;

	//not needed for terahedron
	cubeVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	var cubeVertexIndices = [0, 1, 2, 0, 2, 3, // Front face
	4, 5, 6, 4, 6, 7, // Back face
	8, 9, 10, 8, 10, 11, // Top face
	12, 13, 14, 12, 14, 15, // Bottom face
	16, 17, 18, 16, 18, 19, // Right face
	20, 21, 22, 20, 22, 23 // Left face
	];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices),
		gl.STATIC_DRAW);
	cubeVertexIndexBuffer.itemSize = 1;
	cubeVertexIndexBuffer.numItems = 36;

	/* TODO: Initialize the buffers for the tetrahedron after this comment.
	tetrahedronVertexPositionBuffer and tetrahedronVertexColorBuffer needs to be
	filled with data. */
	tetrahedronVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tetrahedronVertexPositionBuffer);
	vertices = [
	// 1
	-1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
	//2
	-1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0,
	//3
	1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, 1.0,
	//4
	-1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	tetrahedronVertexPositionBuffer.itemSize = 3;
	tetrahedronVertexPositionBuffer.numItems = 12; //changed to 12 i comparition to the cube


	tetrahedronVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tetrahedronVertexColorBuffer);

	//We expand the colors so that every vertex in the face has the same color
	var unpackedColors = [];
	for (var i in colors) {
		var color = colors[i];
		//triangle got 3 vertrecis
		for (var j = 0; j < 3; j++) {
			unpackedColors = unpackedColors.concat(color);
		}
	}
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors),
		gl.STATIC_DRAW);
	tetrahedronVertexColorBuffer.itemSize = 4;
	tetrahedronVertexColorBuffer.numItems = 12;



}

var rCube = 0;
/**
 * Function that is called to draw the current fram of the scene
 */
function drawSceneWebGL() {

	//Setup WebGL for this rendering and setup the perspective Matrix that is used
	//by the vertex shader to place the different vertexes correct
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0,
		pMatrix);

	//Reset the move matrix to an identity matrix that will leave things in their defined place
	mat4.identity(mvMatrix);

	//Everything should be drawn 2 units away from the viewport
	//Changed from -2.0 to -8.0 to make the viewpoint equal to the one in Three.js 
	//changes x position also for leaving space for tetrahedron
	mat4.translate(mvMatrix, [-1.5, 0.0, -8.0]);

	//We save the current matrix before we do changes to it for the movement of the cube.
	mvPushMatrix();


		
				//Rotate the cube rCube radians around the x axis
	mat4.rotate(mvMatrix, rCube, [1, 0, 0]);
			//Rotate the cube rCube/2 radians around the y axis 
	mat4.rotate(mvMatrix, rCube / 2, [0, 1, 0]);
			


	//Telling shaders what buffers and variables to use for this drawing
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
		cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
		cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems,
		gl.UNSIGNED_SHORT, 0);

	//Take back the moving matrix that was saved before
	mvPopMatrix();


	//TODO: Add drawing of the tetrahedron here.
	//Keep in mind that the move matrix has already been modified for the z movement


	mat4.translate(mvMatrix, [3.0, 1.0, 0.0]);

	mvPushMatrix();

	mat4.rotate(mvMatrix, rCube, [1, 0, 0]);
	mat4.rotate(mvMatrix, rCube/2, [0, 0, 1]);


	gl.bindBuffer(gl.ARRAY_BUFFER, tetrahedronVertexPositionBuffer);//Kolla dessa vad betyder dessa
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
		tetrahedronVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, tetrahedronVertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
		tetrahedronVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLES, 0, tetrahedronVertexPositionBuffer.numItems);



	//Take back the moving matrix that was saved before
	mvPopMatrix();
}

/**
 * Animation for the WebGL part is being done in this function
 */
function animateWebGL() {
	var timeNow = new Date().getTime();
	if (lastTime != 0) {
		var elapsed = timeNow - lastTime;

		if(!audio.paused){
			rCube -= ((75 * elapsed) / 1000.0) * Math.PI / 180;
		}
	}

	lastTime = timeNow;
}

/**
 * Main loop function. Called periodacilly by the system
 */
function tickWebGL() {
	if (running == 0) { //We check if we are still running
		webGLRequest = requestAnimationFrame(tickWebGL); //Tell the browser to call this function again for next redraw
		drawSceneWebGL();
		animateWebGL();
	}
}

/**
 * Start our WebGL program
 */
function webGLStart() {
	//Check if WebGL is available
	if (!Detector.webgl) Detector.addGetWebGLMessage();
	var canvas = document.createElement('canvas');
	var oldCanvas = document.getElementById("glCanvas");
	canvas.id = "glCanvas";
	canvas.width = oldCanvas.width;
	canvas.height = oldCanvas.height;
	oldCanvas.parentNode.replaceChild(canvas, oldCanvas);
	initWebGL(canvas);
	initShaders();
	initBuffers();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	rCube = 0;
	lastTime = 0;
	running = 0;

	tickWebGL();
}