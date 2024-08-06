var F=Object.defineProperty;var M=(e,n,t)=>n in e?F(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var i=(e,n,t)=>(M(e,typeof n!="symbol"?n+"":n,t),t);import{E as p,H as u,J as N,K as I,w as R,L as V,b as h,u as x,G as C,F as O}from"./fullscreen-quad-8f42921c.js";function E(){return[p(u(),u(),Math.PI/2),p(u(),u(),-Math.PI/2),N(u(),u(),-Math.PI/2),N(u(),u(),Math.PI/2),u(),p(u(),u(),Math.PI)].map(e=>{const n=I(R(),e);return V(n,n,[1,-1]),n})}function H(e,n,t,l,f){const s=new h(e,e.TEXTURE_CUBE_MAP,1,e.RGBA16F,n,n);return s.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR),x(f,e,c=>{c.drawBuffers(e.COLOR_ATTACHMENT0).texture2D(e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,null,0);const r=E();for(let o=0;o<6;++o){c.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+o,s,0),e.clear(e.COLOR_BUFFER_BIT),e.viewport(0,0,n,n);const m={texMat:r[o]};t.setUniformValues(m),t.use(e),l.draw(e,0)}}),s}function L(e,n,t,l,f,s){n=Math.max(1,n),t=Math.max(0,t);const c=n+1+t,r=1<<c-1,o=new h(e,e.TEXTURE_CUBE_MAP,c,e.RGBA16F,r,r);return o.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR).generateMipmap(),x(s,e,m=>{m.drawBuffers(e.COLOR_ATTACHMENT0).texture2D(e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,null,0).texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X,o,n).checkStatus(a=>{if(a!=e.FRAMEBUFFER_COMPLETE)throw new C(e,a||e.getError())});const _=E();for(let a=0;a<=n;++a){const v=a/n,d=r/(1<<a);for(let T=0;T<6;++T){m.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+T,o,a),e.viewport(0,0,d,d);const A={roughness:v,texMat:_[T]};l.setUniformValues(A),l.use(e),f.draw(e,0)}}}),o}function b(e,n,t=0){return e.filter((l,f)=>(f-t)%n===0)}class S{constructor(n,t,l){i(this,"gl");i(this,"framebufferBinder");i(this,"renderTexture");i(this,"colorAttachments");i(this,"depthAttachment");const f=t.framebuffer,s=t.colorAttachments,c=t.depthAttachment,r=f.bind(n);for(let o=0;o<s.length;++o)r.texture2D(n.COLOR_ATTACHMENT0+o,l,s[o],0);c&&r.texture2D(n.DEPTH_ATTACHMENT,l,c,0),this.gl=n,this.framebufferBinder=r,this.renderTexture=t,this.colorAttachments=s,this.depthAttachment=c}setTarget(n){this.depthAttachment&&this.framebufferBinder.texture2D(this.gl.DEPTH_ATTACHMENT,n,this.depthAttachment,0);for(let t=0;t<this.colorAttachments.length;++t)this.framebufferBinder.texture2D(this.gl.COLOR_ATTACHMENT0+t,n,this.colorAttachments[t],0)}unbind(){this.framebufferBinder.unbind(),this.renderTexture.swapTextures()}}class w{constructor(n,t){i(this,"framebuffer");i(this,"colorAttachments");i(this,"colorTextures");i(this,"depthAttachment");i(this,"depthTexture");i(this,"width");i(this,"height");i(this,"cube");const l=t.width,f=t.height,s=t.cube?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,c=[t.colorInternalFormat0,t.colorInternalFormat1].filter(a=>typeof a=="number"&&a!==n.NONE),r=[];for(let a=0;a<c.length*2;++a){const v=c[Math.floor(a/2)],d=new h(n,s,1,v,l,f);d.bind(n).parameteri(n.TEXTURE_MIN_FILTER,n.LINEAR).parameteri(n.TEXTURE_MAG_FILTER,n.LINEAR).parameteri(n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE).parameteri(n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),r.push(d)}const o=[];t.depthInternalFormat&&(o.push(new h(n,s,1,t.depthInternalFormat,l,f)),o.push(new h(n,s,1,t.depthInternalFormat,l,f)));for(const a of o)a.bind(n).parameteri(n.TEXTURE_MIN_FILTER,n.NEAREST).parameteri(n.TEXTURE_MAG_FILTER,n.NEAREST).parameteri(n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE).parameteri(n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE);const m=new O(n,n.FRAMEBUFFER),_=t.cube?n.TEXTURE_CUBE_MAP_POSITIVE_X:n.TEXTURE_2D;x(m,n,a=>{for(let v=0;v<c.length;++v)a.texture2D(n.COLOR_ATTACHMENT0+v,_,r[v*2],0);o.length&&a.texture2D(n.DEPTH_ATTACHMENT,_,o[0],0),a.checkStatus(v=>{if(v!=n.FRAMEBUFFER_COMPLETE)throw new C(n,v||n.getError())})}),this.framebuffer=m,this.colorAttachments=b(r,2,0),this.colorTextures=b(r,2,1),this.width=l,this.height=f,this.cube=t.cube,o.length&&(this.depthAttachment=o[0],this.depthTexture=o[1])}get colorTexture(){return this.colorTextures[0]}swapTextures(){for(let n=0;n<this.colorAttachments.length;++n)this.colorAttachments[n].swap(this.colorTextures[n]);this.depthAttachment&&this.depthAttachment.swap(this.depthTexture)}bind(n){return new S(n,this,this.defaultTarget(n))}defaultTarget(n){return this.cube?n.TEXTURE_CUBE_MAP_POSITIVE_X:n.TEXTURE_2D}}var X=`#version 300 es

precision highp float;

#ifndef _BRDF_
#define _BRDF_

#ifndef _MATH_
#define _MATH_

const float pi = 3.14159265358979;

vec3 gramSchmidt(vec3 a, vec3 b)
{
    return b - a * dot(a, b);
}

float saturate(float x)
{
    return clamp(x, 0.0, 1.0);
}

float sq(float x)
{
    return x * x;
}

#endif

const float dielectricF0 = 0.04;

float F0(float ior)
{
    return sq(ior - 1.0) / sq(ior + 1.0);
}

vec3 F0(vec3 baseColor, float metallic)
{
    return mix(vec3(dielectricF0), baseColor, metallic);
}

vec3 diffuseColor(vec3 baseColor, float metallic)
{
    return baseColor * (1.0 - metallic);
}

vec3 Fd(vec3 baseColor, float metallic)
{
    return diffuseColor(baseColor, metallic) / pi;
}

float DistribGGX(float a, float NoH)
{
    float NoH2 = NoH * NoH;
    float k = a / (NoH2 * a * a - NoH2 + 1.0);
    return 1.0 / pi * k * k;
}

float VisibilitySmith(float a, float NoV, float NoL)
{
    return 0.5 / mix(2.0 * NoL * NoV, (NoL + NoV), a);
}

vec3 FresnelSchlick(vec3 f0, float VoH)
{
    const vec3 f90 = vec3(1.0);
    return mix(f0, f90, pow(1.0 - VoH, 5.0));
}

float FresnelSchlick(float f0, float VoH)
{
    float f90 = 1.0;
    return mix(f0, f90, pow(1.0 - VoH, 5.0));
}

vec3 FresnelSchlickRoughness(vec3 f0, float NoV, float roughness)
{
    vec3 f90 = max(vec3(1.0 - roughness), f0);
    return mix(f0, f90, pow(1.0 - NoV, 5.0));
}

vec3 brdf(vec3 normal, vec3 baseColor, float metallic, float roughness, vec3 view,
          vec3 light, vec3 lightColor, float lightIntensity, float lightAttenuation)
{
    vec3 h = normalize(view + light);
    float NoV = max(0.0001, dot(normal, view));
    float NoH = saturate(dot(normal, h));
    float VoH = saturate(dot(view, h));
    float NoL = saturate(dot(normal, light));
    float a = roughness * roughness;
    float D = DistribGGX(a, NoH);
    float V = VisibilitySmith(a, NoV, NoL);
    vec3 F = FresnelSchlick(F0(baseColor, metallic), VoH);
    vec3 Kd = vec3(1) - F;
    vec3 color = Fd(baseColor, metallic) * Kd + D * V * F;

    return color * lightColor * lightIntensity * lightAttenuation * NoL;
}

#endif
#ifndef _IMPORTANCE_SAMPLING_
#define _IMPORTANCE_SAMPLING_

#ifndef _MATH_
#define _MATH_

const float pi = 3.14159265358979;

vec3 gramSchmidt(vec3 a, vec3 b)
{
    return b - a * dot(a, b);
}

float saturate(float x)
{
    return clamp(x, 0.0, 1.0);
}

float sq(float x)
{
    return x * x;
}

#endif

float radicalInverse_VdC(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10; 
}

vec2 hammersley(uint i, uint N)
{
    return vec2(float(i)/float(N), radicalInverse_VdC(i));
}

vec3 importanceSampleGGX(vec2 Xi, float a)
{
    float phi = 2.0 * pi * Xi.x;
    
    
    float cosTheta2 = (1.0 - Xi.y) / (1.0 + Xi.y * (a - 1.0) * (a + 1.0));
    float cosTheta = sqrt(cosTheta2);
    float sinTheta = sqrt(1.0 - cosTheta2);

    
    float x = cos(phi) * sinTheta;
    float y = sin(phi) * sinTheta;
    float z = cosTheta;
    return vec3(x, y, z);
}

#endif

in vec2 v_texCoord;

out vec4 v_color;

void main()
{
    float NoV = v_texCoord.x;
    float roughness = v_texCoord.y;
    float a = roughness * roughness;
    vec3 N = vec3(0, 0, 1);
    vec3 V = vec3(sqrt(1.0 - (NoV * NoV)), 0, NoV);
    float A = 0.0;
    float B = 0.0;
    const uint numSamples = 1024u;
    for (uint i = 0u; i < numSamples; ++i) {
        vec2 xi = hammersley(i, numSamples);
        vec3 H = importanceSampleGGX(xi, a);
        vec3 L = reflect(-V, H);
        float NoL = saturate(dot(N, L));
        float VoH = saturate(dot(V, H));
        float NoH = saturate(dot(N, H));
        if (NoL > 0.0) {
            float Fc = pow(1.0 - VoH, 5.0);
            float GVis = VisibilitySmith(a, NoV, NoL) * 4.0 * VoH * NoL / NoH;
            A += (1.0 - Fc) * GVis;
            B += Fc * GVis;
        }
    }
    v_color = vec4(v_texCoord, 1, 1);
    v_color = vec4(A, B, 0, 1) / float(numSamples);
}`,y=`#version 300 es

precision highp float;

in vec2 v_texCoord;

out vec4 f_color;

uniform sampler2D hdrBuffer;
uniform float exposure;

void main()
{
    vec3 hdrColor = texture(hdrBuffer, v_texCoord).rgb;
    vec3 color = clamp(vec3(1) - exp(-hdrColor * exposure), 0.0, 1.0);
    color = pow(color, vec3(1.0 / 2.2));
    f_color.rgb = color;
    f_color.a = 1.0;
}`,B=`#version 300 es

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
}`,U=`#version 300 es

precision highp float;

#ifndef _BRDF_
#define _BRDF_

#ifndef _MATH_
#define _MATH_

const float pi = 3.14159265358979;

vec3 gramSchmidt(vec3 a, vec3 b)
{
    return b - a * dot(a, b);
}

float saturate(float x)
{
    return clamp(x, 0.0, 1.0);
}

float sq(float x)
{
    return x * x;
}

#endif

const float dielectricF0 = 0.04;

float F0(float ior)
{
    return sq(ior - 1.0) / sq(ior + 1.0);
}

vec3 F0(vec3 baseColor, float metallic)
{
    return mix(vec3(dielectricF0), baseColor, metallic);
}

vec3 diffuseColor(vec3 baseColor, float metallic)
{
    return baseColor * (1.0 - metallic);
}

vec3 Fd(vec3 baseColor, float metallic)
{
    return diffuseColor(baseColor, metallic) / pi;
}

float DistribGGX(float a, float NoH)
{
    float NoH2 = NoH * NoH;
    float k = a / (NoH2 * a * a - NoH2 + 1.0);
    return 1.0 / pi * k * k;
}

float VisibilitySmith(float a, float NoV, float NoL)
{
    return 0.5 / mix(2.0 * NoL * NoV, (NoL + NoV), a);
}

vec3 FresnelSchlick(vec3 f0, float VoH)
{
    const vec3 f90 = vec3(1.0);
    return mix(f0, f90, pow(1.0 - VoH, 5.0));
}

float FresnelSchlick(float f0, float VoH)
{
    float f90 = 1.0;
    return mix(f0, f90, pow(1.0 - VoH, 5.0));
}

vec3 FresnelSchlickRoughness(vec3 f0, float NoV, float roughness)
{
    vec3 f90 = max(vec3(1.0 - roughness), f0);
    return mix(f0, f90, pow(1.0 - NoV, 5.0));
}

vec3 brdf(vec3 normal, vec3 baseColor, float metallic, float roughness, vec3 view,
          vec3 light, vec3 lightColor, float lightIntensity, float lightAttenuation)
{
    vec3 h = normalize(view + light);
    float NoV = max(0.0001, dot(normal, view));
    float NoH = saturate(dot(normal, h));
    float VoH = saturate(dot(view, h));
    float NoL = saturate(dot(normal, light));
    float a = roughness * roughness;
    float D = DistribGGX(a, NoH);
    float V = VisibilitySmith(a, NoV, NoL);
    vec3 F = FresnelSchlick(F0(baseColor, metallic), VoH);
    vec3 Kd = vec3(1) - F;
    vec3 color = Fd(baseColor, metallic) * Kd + D * V * F;

    return color * lightColor * lightIntensity * lightAttenuation * NoL;
}

#endif

in vec3 v_position;
in vec2 v_texCoord;
in vec3 v_normal;

out vec4 f_color;

uniform sampler2D normalMap;
uniform sampler2D baseColorMap;
uniform vec4 baseColorValue;
uniform bool flipNormalGreen;
uniform bool flipNormal;
uniform float normalMapStrength;
uniform float metallic;
uniform float roughness;
uniform samplerCube prefilteredEnvMap;
uniform samplerCube irradianceEnvMap;
uniform sampler2D brdfLutMap;
uniform float maxLevel;
uniform mat4 inverseView;
uniform float clearCoat;
uniform float clearCoatRoughness;
uniform float clearCoatNormalMapStrength;
uniform float clearCoatIOR;

mat3 cotangentFrame(vec3 normal, vec3 pos, vec2 uv)
{
    vec2 dUdx = dFdx(uv);
    vec2 dUdy = dFdy(uv);
    vec3 dPdx = dFdx(pos);
    vec3 dPdy = dFdy(pos);
    vec3 X = cross(dPdy, normal);
    vec3 Y = cross(normal, dPdx);
    vec3 T = X * dUdx.x + Y * dUdy.x;
    vec3 B = X * dUdx.y + Y * dUdy.y;
    float len = max(length(T), length(B));
    float invLen = (len == 0.0) ? 0.0 : (1.0 / len);
    return mat3(T * invLen, B * invLen, normal);
}

void evalClearCoat(vec3 view, vec3 normal, float roughness, float f0, inout vec3 Fd, inout vec3 Fs)
{
    float NoV = saturate(dot(normal, view));
    vec2 dfg = texture(brdfLutMap, vec2(NoV, roughness)).rg;
    float lod = roughness * maxLevel;
    vec3 light = (inverseView * vec4(reflect(-view, normal), 0)).xyz;
    vec3 sampledColor = textureLod(prefilteredEnvMap, light, lod).rgb;
    float Fc = FresnelSchlick(f0, NoV) * clearCoat;

    Fs *= (1.0 - Fc);
    Fd *= (1.0 - min(Fc, 0.2));
    Fs += Fc * sampledColor;
}

void main()
{
    vec3 vertexNormal = normalize(v_normal);
    mat3 TBN = cotangentFrame(vertexNormal, v_position, v_texCoord);
    vec3 rgbNormal = normalize(texture(normalMap, v_texCoord).rgb * 2.0 - 1.0);
    if (flipNormalGreen)
        rgbNormal.g = -rgbNormal.g;
    vec3 perturbedNormal = TBN * rgbNormal;

    vec3 normal = normalize(mix(vertexNormal, perturbedNormal, normalMapStrength));
    vec3 clearCoatNormal = normalize(mix(vertexNormal, perturbedNormal, clearCoatNormalMapStrength));
    if (flipNormal) {
        normal = -normal;
        clearCoatNormal = -clearCoatNormal;
    }
    vec4 baseColor = texture(baseColorMap, v_texCoord) * baseColorValue;
    float r = max(0.01, roughness);

    float occlusion = 1.0;
    vec3 position = v_position;
    vec3 view = -normalize(position);
    float NoV = saturate(dot(normal, view));
    vec2 dfg = texture(brdfLutMap, vec2(NoV, r)).rg;
    vec3 light = (inverseView * vec4(reflect(-view, normal), 0)).xyz;
    float lod = r * maxLevel;
    vec3 sampledColor = textureLod(prefilteredEnvMap, light, lod).rgb;
    vec3 f0 = F0(baseColor.rgb, metallic);

    vec3 normalWorld = (inverseView * vec4(normal, 0)).xyz;
    vec3 diffuseIrradiance = texture(irradianceEnvMap, normalWorld).rgb;

    vec3 Fs = sampledColor * (f0 * dfg.x + vec3(dfg.y));
    vec3 Fd = diffuseColor(baseColor.rgb, metallic) * diffuseIrradiance;
    vec3 Kd = clamp(1.0 - FresnelSchlickRoughness(f0, NoV, r), 0.8, 1.0);
    evalClearCoat(view, clearCoatNormal, clearCoatRoughness, F0(max(1.0, clearCoatIOR)), Fd, Fs);
    f_color.rgb = (Fs + Fd * Kd) * occlusion;
    f_color.a = baseColor.a;
}`,D=`#version 300 es

in vec4 POSITION;

out vec3 v_texCoord;

uniform mat4 inverseViewProj;

void main() {
    vec4 posInWorld = inverseViewProj * POSITION;
    v_texCoord = (posInWorld / posInWorld.w).xyz;
    gl_Position = POSITION;
}`,G=`#version 300 es

precision highp float;

in vec3 v_texCoord;

out vec4 f_color;

uniform samplerCube skybox;

void main() {
    f_color = texture(skybox, v_texCoord);
}`,k=`#version 300 es

in vec2 POSITION;

out vec3 v_normal;
out vec3 v_tangent;
out vec2 v_texCoord;

uniform mat3 texMat;

void main()
{
    v_normal = texMat * vec3(POSITION.xy, 1);
    v_tangent = texMat * vec3(1, 0, 0);
    v_texCoord = POSITION.xy * 0.5 + 0.5;
    gl_Position = vec4(POSITION, 0, 1);
}`,z=`#version 300 es

precision highp float;

in vec3 v_normal;
in vec3 v_tangent;
in vec2 v_texCoord;

out vec4 f_color;

uniform samplerCube envMap;

#ifndef _MATH_
#define _MATH_

const float pi = 3.14159265358979;

vec3 gramSchmidt(vec3 a, vec3 b)
{
    return b - a * dot(a, b);
}

float saturate(float x)
{
    return clamp(x, 0.0, 1.0);
}

float sq(float x)
{
    return x * x;
}

#endif

vec3 irradiance(int stacks, int slices, mat3 TBN, samplerCube envMap, float baseAngle)
{
    float dp = 2.0 * pi / float(slices);
    float dt = 0.5 * pi / float(stacks);
    vec3 color = vec3(0);
    for (int i = 0; i < stacks; ++i) {
        float theta = dt * (float(i) + 0.5 * cos(float(i) + 0.5));
        float sinTheta = sin(theta);
        float cosTheta = cos(theta);
        for (int j = 0; j < slices; ++j) {
            float phi = baseAngle + dp * float(j);
            float x = sinTheta * cos(phi);
            float y = sinTheta * sin(phi);
            float z = cosTheta;
            vec3 texCoord = TBN * vec3(x, y, z);
            color += texture(envMap, texCoord).rgb * sinTheta * cosTheta;
        }
    }
    return color * pi / float(slices * stacks);
}

void main()
{
    vec3 N = normalize(v_normal);
    vec3 T = normalize(gramSchmidt(N, v_tangent));
    vec3 B = cross(N, T);
    mat3 TBN = mat3(T, B, N);

    const int stacks = 16;
    const int slices = stacks * 4;
    float baseAngle = length(v_texCoord) * 12.0;
    f_color.rgb = irradiance(stacks, slices, TBN, envMap, baseAngle);
    f_color.a = 1.0;
}`,q=`#version 300 es

in vec2 POSITION;

out vec3 v_normal;
out vec3 v_tangent;

uniform mat3 texMat;

void main()
{
    v_normal = texMat * vec3(POSITION, 1);
    v_tangent = texMat * vec3(1, 0, 0);
    gl_Position = vec4(POSITION.xy, 0, 1);
}`,W=`#version 300 es

precision highp float;

in vec3 v_normal;
in vec3 v_tangent;

out vec4 f_color;

uniform samplerCube envMap;
uniform float roughness;

#ifndef _IMPORTANCE_SAMPLING_
#define _IMPORTANCE_SAMPLING_

#ifndef _MATH_
#define _MATH_

const float pi = 3.14159265358979;

vec3 gramSchmidt(vec3 a, vec3 b)
{
    return b - a * dot(a, b);
}

float saturate(float x)
{
    return clamp(x, 0.0, 1.0);
}

float sq(float x)
{
    return x * x;
}

#endif

float radicalInverse_VdC(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10; 
}

vec2 hammersley(uint i, uint N)
{
    return vec2(float(i)/float(N), radicalInverse_VdC(i));
}

vec3 importanceSampleGGX(vec2 Xi, float a)
{
    float phi = 2.0 * pi * Xi.x;
    
    
    float cosTheta2 = (1.0 - Xi.y) / (1.0 + Xi.y * (a - 1.0) * (a + 1.0));
    float cosTheta = sqrt(cosTheta2);
    float sinTheta = sqrt(1.0 - cosTheta2);

    
    float x = cos(phi) * sinTheta;
    float y = sin(phi) * sinTheta;
    float z = cosTheta;
    return vec3(x, y, z);
}

#endif

void main()
{
    vec3 N = normalize(v_normal);
    vec3 T = normalize(gramSchmidt(N, v_tangent));
    vec3 B = cross(N, T);
    mat3 TBN = mat3(T, B, N);
    vec3 view = N;
    uint numSamples = 1024u;
    float totalWeights = 0.0;
    vec3 prefilteredColor = vec3(0);
    float a = roughness * roughness;
    for (uint i = 0u; i < numSamples; ++i) {
        vec2 xi = hammersley(i, numSamples);
        vec3 h = TBN * importanceSampleGGX(xi, a);
        vec3 light = reflect(-view, h);
        float NoL = dot(N, light);
        if (NoL > 0.0) {
            prefilteredColor += texture(envMap, light).rgb * NoL;
            totalWeights += NoL;
        }
    }
    f_color.rgb = prefilteredColor / totalWeights;
    f_color.a = 0.0;
}`;export{w as R,G as a,U as b,k as c,z as d,y as e,H as f,q as g,W as h,X as i,L as j,B as p,D as s};
