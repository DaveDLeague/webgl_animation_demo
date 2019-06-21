class Bone{
    constructor(os = new Vector3(), or = new Quaternion()){
        this.offset = os;
        this.orientation = or;
        this.children = [];
    }
};

class Animation{
    constructor(){
        this.poses = [];
    }
};

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

var animation;


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

    animation = buildAnimation(boneAnimation);  
    
    frameInterval = setInterval(drawFrame, 1);
}

let t = 0;
let cf = 0;
let nf = 1;
function drawFrame(){
    gl.uniformMatrix4fv(projectionViewId, gl.FALSE, camera.viewMatrix.m);
    gl.uniform3fv(lightPositionId, lightPosition.toArray());
    camera.updateView(0.01);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    if(anim){
        t += 0.001;
        if(t >= 1){ 
            t = 0;
            cf++;
            nf++;
            if(cf >= animation.poses.length) cf = 0;
            if(nf >= animation.poses.length) nf = 0;
        }

    }

    renderSkeleton(new Matrix4(), animation.poses[cf], animation.poses[nf], t);
}

function renderSkeleton(mat, start, end, t){
    let lo = Vector3.linearInterpolate(start.offset, end.offset, t);
    let ro = Quaternion.slerp(start.orientation, end.orientation, t);
    let m2 = Matrix4.buildModelMatrix4(lo, new Vector3(1, 1, 1), ro);
    m2 = Matrix4.multiply(mat, m2);

    gl.uniformMatrix4fv(modelMatrixId, gl.FALSE, m2.m);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

    for(let i = 0; i < start.children.length; i++){
        renderSkeleton(m2, start.children[i], end.children[i], t);
    }
}

function interpolateMatrices(m1, m2, t){
    let q1 = m1.toQuaternion();
    let q2 = m2.toQuaternion();
    let l1 = new Vector3(m1.m[12], m1.m[13], m1.m[14]);
    let l2 = new Vector3(m2.m[12], m2.m[13], m2.m[14]);

    let qi = Quaternion.slerp(q1, q2, t);
    let li = Vector3.slerp(l1, l2, t);
    return Matrix4.buildModelMatrix4(li, new Vector3(1, 1, 1), qi);
}

function parseBone(bn){
    let loc = new Vector3(bn[0][0], bn[0][1], bn[0][2]);
    let rot = new Quaternion(bn[1][0], bn[1][1], bn[1][2], bn[1][3]);
    let b = new Bone(loc, rot);
    
    for(let i = 0; i < bn[2].length; i++){
        b.children.push(parseBone(bn[2][i]));
    }
    return b;
}

function buildAnimation(anim){
    let fAnim = new Animation();
    for(let i = 0; i < anim.length; i++){
        fAnim.poses.push(parseBone(anim[i]));
    }
    return fAnim;
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