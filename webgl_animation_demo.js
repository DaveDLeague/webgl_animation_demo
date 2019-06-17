var canvas;
var gl;

var shader;
var vao;
var vbo;
var ibo;

var positionId;
var normalId;
var projectionViewId;
var modelMatrixId;
var lightPositionId;

var camera;

var lightPosition;

var indexCount;

var frameInterval;

var anim = true;

var matS = [];
var matE = [];


window.onload = function(){
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    canvas = document.getElementById("canvasID");
    gl = canvas.getContext('webgl2');
    
    resizeCanvas();

    lightPosition = new Vector3(30, 60, 50);

    camera = new Camera();
    camera.setPerspectiveProjection(70.0, canvas.width / canvas.height, 0.001, 1000.0);
    camera.position = new Vector3(1, 1, 5);
    camera.updateView();

    prepareGL();

    matS.push(new Matrix4());
    let mm = Matrix4.buildModelMatrix4(new Vector3(0, 1, 0), new Vector3(1, 1, 1), new Quaternion());
    matS.push(mm);
    mm = Matrix4.buildModelMatrix4(new Vector3(0, 2, 0), new Vector3(1, 1, 1), new Quaternion());
    matS.push(mm);
    matE.push(Matrix4.fromArray([
        0.5957, -0.8032, 0.0000, 0.0000,
        0.8032,  0.5957, 0.0000, 0.0000,
        0.0000,  0.0000, 1.0000, 0.0000,
        0.0000,  0.0000, 0.0000, 1.0000
    ]));
    matE.push(Matrix4.fromArray([
        -0.1435, -0.9896, 0.0000, 0.0000,
        0.9896, -0.1435, 0.0000, 0.0000,
        0.0000,  0.0000, 1.0000, 0.0000,
        0.8032,  0.5957, 0.0000, 1.0000
    ]));
    matE.push(Matrix4.fromArray([
        -0.6930, -0.7209, 0.0000, 0.0000,
        0.7209, -0.6930, 0.0000, 0.0000,
        0.0000,  0.0000, 1.0000, 0.0000,
        1.7929,  0.4521, 0.0000, 1.0000
   ]));


    frameInterval = setInterval(drawFrame, 1);
}

function prepareGL(){
    gl.clearColor(0.3, 0.7, 1, 1);

    var vShad = document.getElementById("vertexShaderID");
    var fShad = document.getElementById("fragmentShaderID");

    shader = compileGLShader(gl, vShad.text, fShad.text);
    gl.useProgram(shader);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionId = gl.getAttribLocation(shader, "position");
    normalId = gl.getAttribLocation(shader, "normal");
    projectionViewId = gl.getUniformLocation(shader, "projectionView");
    modelMatrixId = gl.getUniformLocation(shader, "modelMatrix");
    lightPositionId = gl.getUniformLocation(shader, "lightPosition");

    gl.uniformMatrix4fv(projectionViewId, gl.FALSE, camera.viewMatrix.m);
    gl.uniform3fv(lightPositionId, lightPosition.toArray());

    let verts = [];
    let inds = [];
    generateBoneVerticesWithNormals(verts, inds);
    indexCount = inds.length;

    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionId);
    gl.vertexAttribPointer(positionId, 3, gl.FLOAT, gl.FALSE, 24, 0);
    gl.enableVertexAttribArray(normalId);
    gl.vertexAttribPointer(normalId, 3, gl.FLOAT, gl.FALSE, 24, 12);
    ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(inds), gl.STATIC_DRAW);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
}

let t = 0;
function drawFrame(){
    gl.uniformMatrix4fv(projectionViewId, gl.FALSE, camera.viewMatrix.m);
    gl.uniform3fv(lightPositionId, lightPosition.toArray());
    camera.updateView(0.01);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    if(anim){
        t += 0.001;
        if(t >= 1) t = 0;
    }

    for(let i = 0; i < matS.length; i++){
        let im = interpolateMatrices(matS[i], matE[i], t);
        gl.uniformMatrix4fv(modelMatrixId, gl.FALSE, im.m);
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    }
}

function interpolateMatrices(m1, m2, t){
    let q1 = m1.toQuaternion();
    let q2 = m2.toQuaternion();
    let l1 = new Vector3(m1.m[12], m1.m[13], m1.m[14]);
    let l2 = new Vector3(m2.m[12], m2.m[13], m2.m[14]);

    let qi = Quaternion.slerp(q1, q2, t);
    let li = Vector3.linearInterpolate(l1, l2, t);
    return Matrix4.buildModelMatrix4(li, new Vector3(1, 1, 1), qi);
}

function resizeCanvas(){
    canvas.width = window.innerWidth * 0.98;
    canvas.height = window.innerHeight * 0.98;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function keyUp(event){ 
    switch(event.keyCode){
        case KEY_W:{
            camera.moveForward = false;
            break;
        }
        case KEY_A:{
            camera.moveLeft = false;
            break;
        }
        case KEY_S:{
            camera.moveBack = false;
            break;
        }
        case KEY_D:{
            camera.moveRight = false;
            break;
        }
        case KEY_R:{
            camera.moveUp = false;
            break;
        }
        case KEY_F:{
            camera.moveDown = false;
            break;
        }
        case KEY_UP:{
            camera.pitchUp = false;
            break;
        }
        case KEY_DOWN:{
            camera.pitchDown = false;
            break;
        }
        case KEY_LEFT:{
            camera.yawLeft = false;
            break;
        }
        case KEY_RIGHT:{
            camera.yawRight = false;
            break;
        }
        case KEY_Q:{
            camera.rollLeft = false;
            break;
        }
        case KEY_E:{
            camera.rollRight = false;
            break;
        }
    }
}

function keyDown(event){
    switch(event.keyCode){
        case KEY_W:{
            camera.moveForward = true;
            break;
        }
        case KEY_A:{
            camera.moveLeft = true;
            break;
        }
        case KEY_S:{
            camera.moveBack = true;
            break;
        }
        case KEY_D:{
            camera.moveRight = true;
            break;
        }
        case KEY_R:{
            camera.moveUp = true;
            break;
        }
        case KEY_F:{
            camera.moveDown = true;
            break;
        }
        case KEY_UP:{
            camera.pitchUp = true;
            break;
        }
        case KEY_DOWN:{
            camera.pitchDown = true;
            break;
        }
        case KEY_LEFT:{
            camera.yawLeft = true;
            break;
        }
        case KEY_RIGHT:{
            camera.yawRight = true;
            break;
        }
        case KEY_Q:{
            camera.rollLeft = true;
            break;
        }
        case KEY_E:{
            camera.rollRight = true;
            break;
        }
        case KEY_SPACE:{
            anim = !anim;
            break;
        }
    }
}