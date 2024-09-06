var n=`#version 300 es

in vec4 POSITION;
in vec2 TEXCOORD_0;
in vec3 NORMAL;

out vec3 v_position;
out vec2 v_texCoord;
out vec3 v_normal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;
uniform mat3 inverseTranspose;

void main()
{
    mat4 mv = view * model;
    mat4 mvp = proj * mv;
    v_texCoord = TEXCOORD_0;
    v_normal = mat3(view) * inverseTranspose * NORMAL;
    v_position = (mv * POSITION).xyz;
    gl_Position = mvp * POSITION;
}`;export{n as p};
