import bpy
from os import system, name

scene = bpy.context.scene
bones = bpy.data.objects['Armature'].pose.bones
action = bpy.data.actions[0]
finStr = "var boneAnimation = ["
keyframes = {0}

def clear(): 
    if name == 'nt': 
        system('cls') 
    else: 
        system('clear') 

def parseInitialPose(parent, bone):
    output = "["
    loc = []
    rot = [bone.rotation_quaternion.x, bone.rotation_quaternion.y, bone.rotation_quaternion.z, bone.rotation_quaternion.w]
    if parent is not None:
        loc.append(bone.matrix[0][3] - parent.matrix[0][3])
        loc.append(bone.matrix[1][3] - parent.matrix[1][3])
        loc.append(bone.matrix[2][3] - parent.matrix[2][3])
    else:
        loc.append(bone.matrix[0][3])
        loc.append(bone.matrix[1][3])
        loc.append(bone.matrix[2][3])
    output += "[" + str(loc[0]) + ", " + str(loc[1]) + ", " + str(loc[2]) + "],"
    output += "[" + str(rot[0]) + ", " + str(rot[1]) + ", " + str(rot[2])+ ", " + str(rot[3]) + "],"
    output += "["
    
    if len(bone.children) > 0:
        for b in bone.children:
            output += parseInitialPose(bone, b)

    output += "]],"
    return output

def parseAdditionalPose(parent, bone):
    output = "["
    loc = [bone.location.x, bone.location.y, bone.location.z]
    rot = [bone.rotation_quaternion.x, bone.rotation_quaternion.y, bone.rotation_quaternion.z, bone.rotation_quaternion.w]
    output += "[" + str(loc[0]) + ", " + str(loc[1]) + ", " + str(loc[2]) + "],"
    output += "[" + str(rot[0]) + ", " + str(rot[1]) + ", " + str(rot[2])+ ", " + str(rot[3]) + "],"
    output += "["
    
    if len(bone.children) > 0:
        for b in bone.children:
            output += parseAdditionalPose(bone, b)

    output += "]],"
    return output

clear()

for fcv in action.fcurves:
    for k in fcv.keyframe_points:
        keyframes.add(k.co.x)

scene.frame_set(keyframes.pop())
finStr += parseInitialPose(None, bones[0])

while len(keyframes) > 0:
    scene.frame_set(keyframes.pop())
    finStr += parseAdditionalPose(None, bones[0])

finStr += "];"
print(finStr)


file = open('/Users/dave/Desktop/boneAnimation.js','w')
file.write(finStr)
file.close()
