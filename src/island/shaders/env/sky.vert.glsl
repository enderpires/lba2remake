#version 300 es
#extension GL_OVR_multiview : require
layout(num_views = 2) in;
precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrix2;
uniform mat4 projectionMatrix;
uniform mat4 projectionMatrix2;
uniform vec3 cameraPosition;
uniform vec3 cameraPosition2;
#define modelViewMatrix (gl_ViewID_OVR==0u?modelViewMatrix:modelViewMatrix2)
#define projectionMatrix (gl_ViewID_OVR==0u?projectionMatrix:projectionMatrix2)
#define cameraPosition (gl_ViewID_OVR==0u?cameraPosition:cameraPosition2)

in vec3 position;
in vec2 uv;

out vec2 vUv;
out vec3 vMVPos;

void main() {
    vec4 mPos = modelViewMatrix * vec4(position, 1.0);
    vec3 pos = vec3(position.x, cameraPosition.y, position.z);
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mPos;
    vUv = uv;
    vMVPos = mvPos.xyz;
}
