from os import system
import bpy

system('cls')

action = bpy.data.actions[0]
scene = bpy.context.scene
bones = bpy.data.objects['Armature'].pose.bones
keyframes = {1}

def quatMul(q1, q2):
    #this.x =   this.x * q2.w + this.y * q2.z - this.z * q2.y + this.w * q2.x;
    #this.y =  -this.x * q2.z + this.y * q2.w + this.z * q2.x + this.w * q2.y;
    #this.z =   this.x * q2.y - this.y * q2.x + this.z * q2.w + this.w * q2.z;
    #this.w =  -this.x * q2.x - this.y * q2.y - this.z * q2.z + this.w * q2.w;
    x = q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x
    y = -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y
    z = q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z
    w = -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w
    q1.x = x
    q1.y = y
    q1.z = z
    q1.w = w
    return q1

for fcv in action.fcurves:
    for k in fcv.keyframe_points:
        keyframes.add(k.co.x)

for i, k in enumerate(keyframes):
    print(i, k);


for k in keyframes:
    scene.frame_set(k)
    for b in bones:
        q = b.rotation_quaternion
        if b.parent is not None:    
            q = quatMul(b.parent.rotation_quaternion, b.rotation_quaternion)
        #print("location: ", b.head)
        #print("scale: ", b.scale)
        #print("orientation: ", q)
        #print(b.matrix.transposed())

