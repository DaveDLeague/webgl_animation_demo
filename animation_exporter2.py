import bpy
from os import system, name

scene = bpy.context.scene
bones = bpy.data.objects['Armature'].pose.bones
action = bpy.data.actions[0]
finStr = "var boneAnimation = [["
keyframes = []

def clear(): 
    if name == 'nt': 
        system('cls') 
    else: 
        system('clear') 

def parsePoses(parent, bone):
    output = "["
    loc = []
    rot = []
    if parent is not None:
        mat = parent.matrix.inverted() @ bone.matrix
        loc.append(mat[0][3] + bone.location.x)
        loc.append(mat[1][3] + bone.location.y)
        loc.append(mat[2][3] + bone.location.z)
        q = mat.to_quaternion()
        rot.append(q.x)
        rot.append(q.y)
        rot.append(q.z)
        rot.append(q.w)
    else:
        loc.append(bone.matrix[0][3])
        loc.append(bone.matrix[1][3])
        loc.append(bone.matrix[2][3])
        q = bone.matrix.to_quaternion()
        rot.append(q.x)
        rot.append(q.y)
        rot.append(q.z)
        rot.append(q.w)
    output += "[" + str(round(loc[0], 4)) + ", " + str(round(loc[1], 4)) + ", " + str(round(loc[2], 4)) + "],"
    output += "[" + str(round(rot[0], 4)) + ", " + str(round(rot[1], 4)) + ", " + str(round(rot[2], 4))+ ", " + str(round(rot[3], 4)) + "],"
    output += "["
    
    if len(bone.children) > 0:
        for b in bone.children:
            output += parsePoses(bone, b)

    output += "]],"
    return output

clear()

for fcv in action.fcurves:
    for k in fcv.keyframe_points:
        keyframes.append(k.co.x)
        

keyframes = set(keyframes)
keyframes = list(keyframes)

for k in keyframes:
    scene.frame_set(k)
    finStr += parsePoses(None, bones[0])

frameDurations = []
for i in range(len(keyframes) - 1):
    cf = keyframes[i];
    nf = keyframes[i + 1]
    frameDurations.append(nf - cf)

finStr += "],["

for i in frameDurations:
    finStr += str(int(i)) + ","    

finStr += "]];"
print(finStr)


file = open('/Users/dave/Desktop/boneAnimation.js','w')
file.write(finStr)
file.close()
