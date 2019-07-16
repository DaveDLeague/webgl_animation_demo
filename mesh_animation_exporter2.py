import bpy
from os import system, name

def clear(): 
    if name == 'nt': 
        system('cls') 
    else: 
        system('clear') 
        
def exportMeshPosNormIndexData(obj):
    verts = obj.data.vertices
    polys = obj.data.polygons
    vData = []
    iData = []
    indexTracker = 0
    
    for p in polys:
        for v in p.vertices:
            vData.append(round(verts[v].co.x, 4))
            vData.append(round(verts[v].co.y, 4))
            vData.append(round(verts[v].co.z, 4))
            vData.append(round(p.normal.x, 4))
            vData.append(round(p.normal.y, 4))
            vData.append(round(p.normal.z, 4))
            if len(verts[v].groups) == 0:
                vData.append(0)
                vData.append(0)
                vData.append(0)
                vData.append(0)
                vData.append(0)
                vData.append(0)
            elif len(verts[v].groups) == 1:
                vData.append(round(verts[v].groups[0].weight, 4))
                vData.append(0)
                vData.append(0)
                vData.append(verts[v].groups[0].group)
                vData.append(0)
                vData.append(0)
            elif len(verts[v].groups) == 2:
                vData.append(round(verts[v].groups[0].weight, 4))
                vData.append(round(verts[v].groups[1].weight, 4))
                vData.append(0)
                vData.append(verts[v].groups[0].group)
                vData.append(verts[v].groups[1].group)
                vData.append(0)
            elif len(verts[v].groups) == 3:
                vData.append(round(verts[v].groups[0].weight, 4))
                vData.append(round(verts[v].groups[1].weight, 4))
                vData.append(round(verts[v].groups[2].weight, 4))
                vData.append(verts[v].groups[0].group)
                vData.append(verts[v].groups[1].group)
                vData.append(verts[v].groups[2].group)
            else:
                vData.append(round(verts[v].groups[0].weight, 4))
                vData.append(round(verts[v].groups[1].weight, 4))
                vData.append(round(verts[v].groups[2].weight, 4))
                vData.append(verts[v].groups[0].group)
                vData.append(verts[v].groups[1].group)
                vData.append(verts[v].groups[2].group)
        iData.append(indexTracker)
        iData.append(indexTracker + 1)
        iData.append(indexTracker + 2)
        vct = len(p.vertices)
        for i in range(2, vct - 1):
            iData.append(indexTracker + i)
            iData.append(indexTracker + i + 1)
            iData.append(indexTracker)
        indexTracker += vct
    return [vData, iData]

def exportBoneAnimationData(pose, scene, keyframes):
    def parsePose(parent, bone):
        loc = []
        rot = []
        chi = []
        if parent is not None:
            mat = parent.matrix.inverted() @ bone.matrix
            loc.append(round(bone.matrix[0][3], 4))
            loc.append(round(bone.matrix[1][3], 4))
            loc.append(round(bone.matrix[2][3], 4))
            q = parent.matrix.to_quaternion() @ mat.to_quaternion()
            q = bone.matrix.to_quaternion()
            rot.append(round(q.x, 4))
            rot.append(round(q.y, 4))
            rot.append(round(q.z, 4))
            rot.append(round(q.w, 4))
        else:
            loc.append(round(bone.matrix[0][3], 4))
            loc.append(round(bone.matrix[1][3], 4))
            loc.append(round(bone.matrix[2][3], 4))
            q = bone.matrix.to_quaternion()
            rot.append(round(q.x, 4))
            rot.append(round(q.y, 4))
            rot.append(round(q.z, 4))
            rot.append(round(q.w, 4))
            
        if len(bone.children) > 0:
            for b in bone.children:
                chi.append(parsePose(bone, b))
        return [loc, rot, chi]
    
    def parseInvBT(arr, bone):
        mat = bone.matrix.inverted().transposed()
        m = []
        for i in range(len(mat)):
            for j in range(len(mat[i])):
                m.append(round(mat[i][j], 4))
        arr.append(m)
        print(m)
        for b in bone.children:
            parseInvBT(arr, b)
    animation = []
    for k in keyframes:
        scene.frame_set(k)
        animation.append(parsePose(None, pose.bones[0]))
    
    invBT = []
    scene.frame_set(0)
    parseInvBT(invBT, pose.bones[0])
    
    frameDurations = []
    for i in range(len(keyframes) - 1):
        cf = keyframes[i]
        nf = keyframes[i + 1]
        frameDurations.append(nf - cf)
    return [animation, invBT, frameDurations]
        
clear()
scene = bpy.data.scenes['Scene']
scene.frame_set(0)
modelData = exportMeshPosNormIndexData(bpy.data.objects['Cube'])

keyframes = []
for fcv in bpy.data.actions['ArmatureAction'].fcurves:
    for k in fcv.keyframe_points:
        keyframes.append(k.co.x)
keyframes = list(set(keyframes))
keyframes.sort()

animData = exportBoneAnimationData(bpy.data.objects['Armature'].pose, scene, keyframes)

finStr = "var modelVertexData = " + str(modelData) + ";\n"
finStr += "var boneAnimation = " + str(animData) + ";"
file = open('C:/Users/dave/Desktop/test_model_data.js', 'w')
file.write(finStr)
file.close()