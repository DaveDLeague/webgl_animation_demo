import bpy

from os import system, name

scene = bpy.data.scenes[0]
cyl = bpy.data.objects['Cylinder']
verts = cyl.data.vertices
polys = cyl.data.polygons

vertices = []
bones = []
weights = []
vData = []
iData = []

def clear(): 
    if name == 'nt': 
        system('cls') 
    else: 
        system('clear') 
        
clear()

scene.frame_set(0)

gctr = 0
for v in verts:
    gctr = 0
    vertices.append(v.co)
    inds = []
    wts = []
    
    if len(v.groups) == 1:
        inds.append(v.groups[0].group)
        inds.append(0)
        inds.append(0)
        wts.append(round(v.groups[0].weight, 4))
        wts.append(0)
        wts.append(0)
    elif len(v.groups) == 2:
        inds.append(v.groups[0].group)
        inds.append(v.groups[1].group)
        inds.append(0)
        wts.append(round(v.groups[0].weight, 4))
        wts.append(round(v.groups[1].weight, 4))
        wts.append(0)
    elif len(v.groups) == 3:
        inds.append(v.groups[0].group)
        inds.append(v.groups[1].group)
        inds.append(v.groups[2].group)
        wts.append(round(v.groups[0].weight, 4))
        wts.append(round(v.groups[1].weight, 4))
        wts.append(round(v.groups[2].weight, 4))
    
    bones.append(inds)
    weights.append(wts)

indCtr = 0
for p in polys:
    if len(p.vertices) == 32:
        for v in p.vertices:
            vData.append(round(vertices[v].x, 4))
            vData.append(round(vertices[v].y, 4))
            vData.append(round(vertices[v].z, 4))
        i = 0
        while i < 30:
            iData.append(i)
            iData.append(i + 1)
            iData.append(i + 2)
            i += 1

finStr = "modelVertexData = ["
finStr += str(vData) + ","
finStr += str(iData)
finStr += "];"
print(finStr)
file = open("C:/Users/Dave/Desktop/model_data.js", "w")
file.write(finStr)
file.close()