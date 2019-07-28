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
        this.invBT = [];
        this.frameDurations = [];
        this.divTime = 0;
        this.currentFrame = 0;
        this.nextFrame = 1;
        this.fps = 24;
        this.currentPoseDuration = 0;
        this.currentPoseTime = 0;
    }
};

var canvas;
var gl;

var shader;
var vao;
var vbo;
var ibo;

var mShader;
var mVao;
var mVbo;
var mIbo;

var mPositionId;
var mNormalId;
var mWeightId;
var mBoneId;
var mProjectionViewId;
var mModelMatrixId;
var mBoneMatricesId;
var mLightPositionId;

var positionId;
var normalId;
var projectionViewId;
var modelMatrixId;
var lightPositionId;

var camera;

var lightPosition;

var indexCount;

var frameInterval;

var anim = 1;

var animation;
var shouldAnimate = true;

var startTime = 0;
var endTime = 0;
var deltaTime = 0;

var matIndCtr = 0;


window.onload = function(){
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    canvas = document.getElementById("canvasID");
    gl = canvas.getContext('webgl2');
    
    resizeCanvas();

    lightPosition = new Vector3(30, 60, 50);

    camera = new Camera();
    camera.moveSpeed = 5;
    camera.setPerspectiveProjection(70.0, canvas.width / canvas.height, 0.001, 1000.0);
    camera.position = new Vector3(-1, 3, 15);
    camera.updateView();

    prepareGL();
}

function prepareGL(){
    gl.clearColor(0.3, 0.7, 1, 1);

    var vShad = document.getElementById("vertexShaderID");
    var fShad = document.getElementById("fragmentShaderID");

    var mvShad = document.getElementById("modelVertexShaderID");
    var mfShad = document.getElementById("modelFragmentShaderID");

    shader = compileGLShader(gl, vShad.text, fShad.text);
    gl.useProgram(shader);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionId = gl.getAttribLocation(shader, "position");
    normalId = gl.getAttribLocation(shader, "normal");
    projectionViewId = gl.getUniformLocation(shader, "projectionView");
    modelMatrixId = gl.getUniformLocation(shader, "modelMatrix");
    lightPositionId = gl.getUniformLocation(shader, "lightPosition");

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

    mShader = compileGLShader(gl, mvShad.text, mfShad.text);
    gl.useProgram(mShader);

    mVao = gl.createVertexArray();
    gl.bindVertexArray(mVao);

    mPositionId = gl.getAttribLocation(mShader, "position");
    mNormalId = gl.getAttribLocation(mShader, "normal");
    mWeightId = gl.getAttribLocation(mShader, "weights");
    mBoneId = gl.getAttribLocation(mShader, "bones");
    mProjectionViewId = gl.getUniformLocation(mShader, "projectionView");
    mModelMatrixId = gl.getUniformLocation(mShader, "modelMatrix");
    mBoneMatricesId = gl.getUniformLocation(mShader, "boneMatrices");
    mLightPositionId = gl.getUniformLocation(mShader, "lightPosition");

    mVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mVbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelVertexData[0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(mPositionId);
    gl.enableVertexAttribArray(mNormalId);
    gl.enableVertexAttribArray(mWeightId);
    gl.enableVertexAttribArray(mBoneId);
    gl.vertexAttribPointer(mPositionId, 3, gl.FLOAT, gl.FALSE, 48, 0);
    gl.vertexAttribPointer(mNormalId, 3, gl.FLOAT, gl.FALSE, 48, 12);
    gl.vertexAttribPointer(mWeightId, 3, gl.FLOAT, gl.FALSE, 48, 24);
    gl.vertexAttribPointer(mBoneId, 3, gl.FLOAT, gl.FALSE, 48, 36);
    mIbo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mIbo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelVertexData[1]), gl.STATIC_DRAW);

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    animation = buildAnimation(boneAnimation, 24);  
    console.log(boneAnimation[0]);
    
    startTime = new Date().getTime();
    frameInterval = setInterval(drawFrame, 1);
}

let modelMat = Matrix4.buildModelMatrix4(new Vector3(), UNIT_SCALE_VECTOR, Quaternion.rotationToQuaternion(new Vector3(1, 0, 0), -Math.PI / 2));

function drawFrame(){
    camera.updateView(deltaTime);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    if(shouldAnimate){
        updateAnimation(animation);
    }

    if(anim == 0 || anim == 2){
        gl.useProgram(shader);
        gl.bindVertexArray(vao);
        gl.uniformMatrix4fv(projectionViewId, gl.FALSE, camera.viewMatrix.m);
        gl.uniform3fv(lightPositionId, lightPosition.toArray());
        renderSkeleton(new Matrix4(), animation.poses[animation.currentFrame], animation.poses[animation.nextFrame], animation.divTime);
    }
    if(anim == 1 || anim == 2){
        gl.useProgram(mShader);
        gl.bindVertexArray(mVao);

        let mats = [];
        matIndCtr = 0;
        buildAnimationMatrixArray(new Matrix4(), mats, animation.poses[animation.currentFrame], animation.poses[animation.nextFrame], animation.divTime);

        let matz = [];
        for(let i = 0; i < mats.length; i++){
            for(let j = 0; j < 16; j++){
                matz.push(mats[i][j]);
            }
        }
        gl.uniformMatrix4fv(mBoneMatricesId, gl.TRUE, new Float32Array(matz));

        gl.uniformMatrix4fv(mProjectionViewId, gl.FALSE, camera.viewMatrix.m);
        gl.uniform3fv(mLightPositionId, lightPosition.toArray());
        gl.uniformMatrix4fv(mModelMatrixId, gl.FALSE, modelMat.m);
        gl.drawElements(gl.TRIANGLES, modelVertexData[1].length, gl.UNSIGNED_SHORT, 0);
    }

    endTime = new Date().getTime();
    deltaTime = (endTime - startTime) / 1000.0;
    startTime = endTime;
}

function buildAnimationMatrixArray(parent, aniMat, start, end, t){
    let lo = Vector3.linearInterpolate(start.offset, end.offset, t);
    let ro = Quaternion.slerp(start.orientation, end.orientation, t);
    let m2 = Matrix4.buildModelMatrix4(lo, new Vector3(1, 1, 1), ro);
    m2 = Matrix4.multiply(parent, m2);
    let m3 = Matrix4.multiply(m2, animation.invBT[matIndCtr++]);
    

    aniMat.push(m3.m);
    for(let i = 0; i < start.children.length; i++){
        buildAnimationMatrixArray(m2, aniMat, start.children[i], end.children[i], t);
    }
}

function renderSkeleton(parent, start, end, t){
    let lo = Vector3.linearInterpolate(start.offset, end.offset, t);
    let ro = Quaternion.slerp(start.orientation, end.orientation, t);
    let m2 = Matrix4.buildModelMatrix4(lo, new Vector3(1, 1, 1), ro);
    m2 = Matrix4.multiply(parent, m2);

    gl.uniformMatrix4fv(modelMatrixId, gl.FALSE, m2.m);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

    for(let i = 0; i < start.children.length; i++){
        renderSkeleton(m2, start.children[i], end.children[i], t);
    }
}

function updateAnimation(animation){
    animation.currentPoseTime += deltaTime;
        if(animation.currentPoseTime >= animation.currentPoseDuration){ 
            animation.currentPoseTime -= animation.currentPoseDuration;
            animation.currentFrame++;
            animation.nextFrame++;
            if(animation.currentFrame >= animation.poses.length - 1) {
                animation.currentFrame = 1;
                animation.nextFrame = 2;
            }

            animation.currentPoseDuration = animation.frameDurations[animation.currentFrame] / animation.fps;
        }
    animation.divTime = animation.currentPoseTime / animation.currentPoseDuration;
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

function buildAnimation(anim, fps = 24){
    let fAnim = new Animation();
    for(let i = 0; i < anim[0].length; i++){
        fAnim.poses.push(parseBone(anim[0][i]));
    }
    for(let i = 0; i < anim[1].length; i++){
        let m = new Matrix4();
        for(let j = 0; j < 16; j++){
            m.m[j] = anim[1][i][j];
        }
        fAnim.invBT.push(m);
    }
    for(let i = 0; i < anim[2].length; i++){
        fAnim.frameDurations.push(anim[2][i]);
    }
    fAnim.fps = fps;
    fAnim.currentPoseDuration = fAnim.frameDurations[0] / fAnim.fps;
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
            anim++;
            if(anim > 2) anim = 0;
            break;
        }
        case KEY_P:{
           shouldAnimate = !shouldAnimate;
            break;
        }
    }
}
