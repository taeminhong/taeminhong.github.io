var fe=Object.defineProperty;var ue=(n,e,r)=>e in n?fe(n,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):n[e]=r;var c=(n,e,r)=>(ue(n,typeof e!="symbol"?e+"":e,r),r);import"./modulepreload-polyfill-3cfb730f.js";/* empty css             */import{r as me,i as he,A as pe,T as ve,x as P,y as j,M as Ee,F as I,b as M,u as w,S as F,f as Y,P as p,a as v,z as C,I as be,N as A,c as $,d as O,D as S,e as Te,B as _e,j as k,G as Z,V as we,l as Me,C as W,m as Q,t as Re,v as xe,w as H,o as Ne,p as Ce}from"./fullscreen-quad-e8458005.js";import{e as Fe,i as ye,R as De,d as Pe,p as Se,f as Ae,g as ge,s as Le,a as Be,b as Ve,c as Ue}from"./prefiltered-env-map-5a5ec4cf.js";import{l as ke}from"./gltf-loader-4042f727.js";var He=`#version 300 es

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
}`,Ie=`#version 300 es

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

#endif

const float dielectricF0 = 0.04;

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

void main()
{
    vec3 normal = normalize(v_normal);
    mat3 TBN = cotangentFrame(normal, v_position, v_texCoord);
    vec3 rgbNormal = normalize(texture(normalMap, v_texCoord).rgb * 2.0 - 1.0);
    if (flipNormalGreen)
        rgbNormal.g = -rgbNormal.g;
    vec3 perturbedNormal = TBN * rgbNormal;

    normal = normalize(mix(normal, perturbedNormal, normalMapStrength));
    if (flipNormal)
        normal = -normal;
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
    f_color.rgb = (Fs + Fd * Kd) * occlusion;
    f_color.a = baseColor.a;
}`,Oe=`#version 300 es

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

#endif

const float dielectricF0 = 0.04;

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

uniform sampler2D depthPeelReference;
uniform float depthBias;
uniform vec2 depthPeelScreenSize;
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
uniform mat4 inverseProj;

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

float unprojectZ(mat4 inverseProj, vec3 fragCoord)
{
    vec4 v = inverseProj * vec4(fragCoord * 2.0 - 1.0, 1);
    return v.z / v.w;
}

void main()
{
    float depth = texture(depthPeelReference, gl_FragCoord.xy / depthPeelScreenSize).r;
    float z = unprojectZ(inverseProj, gl_FragCoord.xyz);
    float ref = unprojectZ(inverseProj, vec3(gl_FragCoord.xy, depth));
    if (z + depthBias >= ref)
        discard;

    vec3 normal = normalize(v_normal);
    mat3 TBN = cotangentFrame(normal, v_position, v_texCoord);
    vec3 rgbNormal = normalize(texture(normalMap, v_texCoord).rgb * 2.0 - 1.0);
    if (flipNormalGreen)
        rgbNormal.g = -rgbNormal.g;
    vec3 perturbedNormal = TBN * rgbNormal;

    normal = normalize(mix(normal, perturbedNormal, normalMapStrength));
    if (flipNormal)
        normal = -normal;
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
    f_color.rgb = (Fs + Fd * Kd) * occlusion;
    f_color.a = baseColor.a;
}`,Xe=`#version 300 es

precision highp float;

in vec2 v_texCoord;

out vec4 f_color;

uniform sampler2D layer0;
uniform sampler2D layer1;
uniform sampler2D layer2;
uniform sampler2D layer3;

vec4 blendBackward(vec4 front, vec4 back)
{
    return vec4(
        front.rgb + front.a * back.a * back.rgb,
        front.a * (1.0 - back.a)
    );
}

void main()
{
    vec4 color0 = texture(layer0, v_texCoord);
    vec4 color1 = texture(layer1, v_texCoord);
    vec4 color2 = texture(layer2, v_texCoord);
    vec4 color3 = texture(layer3, v_texCoord);

    vec4 merge = blendBackward(vec4(0, 0, 0, 1), color0);
    merge = blendBackward(merge, color1);
    merge = blendBackward(merge, color2);
    merge = blendBackward(merge, color3);

    f_color = merge;
}`;function Ge(n,e,r){const t=Ne(Ce(),e);n.setUniformValues({model:e,inverseTranspose:t,view:r.view,proj:r.proj,viewPos:r.position,viewPosition:r.position,inverseView:r.inverseView,inverseProj:r.inverseProj},!0)}function ze(n,e,r,t,a){Ge(a,r,t),a.use(n);for(let i=0;i<e.subMeshes.length;++i)e.draw(n,i)}class q{constructor(e,r,t,a,i=1){c(this,"mesh");c(this,"material");c(this,"node");c(this,"layer");this.node=r,this.mesh=t,this.material=a,this.layer=i}draw(e,r){ze(e,this.mesh,this.node.globalMatrix,r,this.material)}}class je{constructor(){c(this,"nodes");c(this,"cameras");c(this,"drawers");c(this,"materials");c(this,"indirectLightMaterial");this.nodes=[],this.drawers=[],this.cameras=[],this.materials=[]}update(e,r){this.nodes.forEach(t=>t.preUpdate(r)),this.nodes.forEach(t=>t.update(e)),this.cameras.forEach(t=>t.update(e)),this.cameras.sort((t,a)=>t.order-a.order),this.drawers.sort((t,a)=>t.material.queue-a.material.queue)}}function We(n,e,r){const t=$(n,e);return new O(n,t,r)}class qe{constructor(e,r,t,a){c(this,"binder");c(this,"colorBuffers");c(this,"depthBuffers");const i=r.bind(e);i.texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,a[1],0),e.clearBufferfv(e.DEPTH,0,[0]),this.binder=i,this.colorBuffers=t,this.depthBuffers=a}unbind(){this.binder.unbind()}layer(e){if(e<0||e>=this.colorBuffers.length)throw new RangeError(`invalid layer index [0, ${this.colorBuffers.length}): ${e}`);const r=this.binder.gl;return this.binder.texture2D(r.COLOR_ATTACHMENT0,r.TEXTURE_2D,this.colorBuffers[e],0).texture2D(r.DEPTH_ATTACHMENT,r.TEXTURE_2D,this.depthBuffers[e%2],0),this.depthBuffers[(e+1)%2]}}class Ke{constructor(e,r,t,a,i){c(this,"width");c(this,"height");c(this,"framebuffer");c(this,"colorBuffers");c(this,"depthBuffers");c(this,"material");if(r<1)throw new RangeError(`There must be at least one layer in DepthPeeler, but given ${r}`);const s=[];for(let l=0;l<2;++l){const f=new M(e,e.TEXTURE_2D,1,e.DEPTH_COMPONENT32F,t,a);f.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),s.push(f)}const o=[];for(let l=0;l<r;++l){const f=new M(e,e.TEXTURE_2D,1,e.RGBA8,t,a);f.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),o.push(f)}const d=new I(e,e.FRAMEBUFFER);w(d,e,l=>{l.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,o[0],0).texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,s[0],0).drawBuffers(e.COLOR_ATTACHMENT0).checkStatus(f=>{if(f!=e.FRAMEBUFFER_COMPLETE)throw new Z(e,f||e.getError())})}),i.setUniformValues({layer0:o[0],layer1:o[1],layer2:o[2],layer3:o[3]}),this.framebuffer=d,this.depthBuffers=s,this.colorBuffers=o,this.width=t,this.height=a,this.material=i}bind(e){return new qe(e,this.framebuffer,this.colorBuffers,this.depthBuffers)}blend(e,r){this.material.use(e),r.draw(e,0)}get length(){return this.colorBuffers.length}}class Ye{constructor(e){c(this,"gl");c(this,"scene");c(this,"inputSystem");c(this,"standardVertexModel");c(this,"quadMesh");c(this,"toneMap");c(this,"brdfLutMap");c(this,"whiteTexture");c(this,"framebufferWidth");c(this,"framebufferHeight");c(this,"depthPeeler");c(this,"framebuffer");c(this,"take");c(this,"callbackId");const r=new we([{name:"POSITION",location:0},{name:"NORMAL",location:1},{name:"TEXCOORD_0",location:3},{name:"TEXCOORD_1",location:4},{name:"TEXCOORD_2",location:5}]),t=Q.createQuad("quad"),a=We(e,t,r),i=new I(e,e.FRAMEBUFFER),s=e.drawingBufferWidth,o=e.drawingBufferHeight,d=new M(e,e.TEXTURE_2D,1,e.RGBA16F,s,o);d.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind();const l=new M(e,e.TEXTURE_2D,1,e.DEPTH_COMPONENT32F,s,o);l.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),w(i,e,m=>{m.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,d,0).texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,l,0).checkStatus(x=>{if(x!=e.FRAMEBUFFER_COMPLETE)throw new Z(e,x||e.getError())})});const f=new F(e,e.VERTEX_SHADER,Y),E=new F(e,e.FRAGMENT_SHADER,Fe),u=new p(e,"exposure",r,f,E),T=new v(e,u,{name:"toneMap"}),y=new F(e,e.FRAGMENT_SHADER,ye),g=new p(e,"integrateBRDF",r,f,y),L=new v(e,g),D=new M(e,e.TEXTURE_2D,1,e.RGBA8,32,32),R=new Uint8Array(32*32*4);for(let m=0;m<R.length;++m)R[m]=255;D.bind(e).subImage2D(e.TEXTURE_2D,0,0,0,32,32,e.RGBA,e.UNSIGNED_BYTE,R).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST),T.setUniformValues({exposure:1.5,hdrBuffer:d});const b=new De(e,{cube:!1,width:256,height:256,colorInternalFormat0:e.RGBA16F});w(b,e,m=>{e.viewport(0,0,b.width,b.height),e.clear(e.COLOR_BUFFER_BIT),L.use(e),a.draw(e,0)});const _=C(e,Xe),B=new p(e,"merge",r,f,_),V=new v(e,B),U=new Ke(e,4,s,o,V);this.gl=e,this.scene=new je,this.inputSystem=new be,this.take=0,this.standardVertexModel=r,this.quadMesh=a,this.toneMap=T,this.framebufferWidth=s,this.framebufferHeight=o,this.framebuffer=i,this.callbackId=0,this.brdfLutMap=b.colorTextures[0],this.whiteTexture=D,this.depthPeeler=U}requestRender(){this.callbackId===0&&(this.callbackId=requestAnimationFrame(e=>{this.scene.update(++this.take,0),this.render(),this.callbackId=0}))}render(){const e=this.gl,r=this.scene.drawers;let t=0,a=0;e.clearColor(0,0,0,1),e.clearDepth(1),e.depthMask(!0),e.enable(e.DEPTH_TEST),e.depthFunc(e.LEQUAL),e.enable(e.CULL_FACE),e.cullFace(e.BACK),w(this.framebuffer,e,i=>{t=N(r,a,s=>s.material.queue>=3,r.length),a=N(r,t,s=>s.material.queue>5,r.length),e.clearBufferfv(e.COLOR,0,[.05,.05,.05,1]),e.clearBufferfv(e.DEPTH,0,[1]);for(const s of this.scene.cameras){const o=s.viewport(this.framebufferWidth,this.framebufferHeight).map(Math.round),d=s.prepare(o.aspectRatio);e.viewport(o.x,o.y,o.w,o.h);for(let l=t;l<a;++l)r[l].layer&s.cullMask&&r[l].draw(e,d)}if(t=a,a=N(r,t,s=>s.material.queue>6,r.length),a>t){e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE),e.enable(e.BLEND);for(const s of this.scene.cameras){const o=s.viewport(this.framebufferWidth,this.framebufferHeight).map(Math.round),d=s.prepare(o.aspectRatio);e.viewport(o.x,o.y,o.w,o.h);for(let l=t;l<a;++l)r[l].layer&s.cullMask&&r[l].draw(e,d)}e.disable(e.BLEND)}}),t=N(r,a,i=>i.material.queue===7,r.length),a=N(r,t,i=>i.material.queue>7,r.length),t<a&&(w(this.depthPeeler,e,i=>{for(let s=0;s<this.depthPeeler.length;++s){const o=i.layer(s),d=[this.depthPeeler.width,this.depthPeeler.height];e.clearBufferfv(e.COLOR,0,[0,0,0,0]),e.clearBufferfv(e.DEPTH,0,[1]);for(const l of this.scene.cameras){const f=l.viewport(this.depthPeeler.width,this.depthPeeler.height).map(Math.round),E=l.prepare(f.aspectRatio);e.viewport(f.x,f.y,f.w,f.h);for(let u=t;u<a;++u)r[u].layer&l.cullMask&&(r[u].material.setUniformValues({depthPeelReference:o,depthPeelScreenSize:d,depthBias:1e-4},!0),r[u].draw(e,E),r[u].material.setUniformValues({depthPeelReference:null},!0))}}}),w(this.framebuffer,e,i=>{e.viewport(0,0,this.framebufferWidth,this.framebufferHeight),e.disable(e.DEPTH_TEST),e.blendFuncSeparate(e.ONE,e.SRC_ALPHA,e.ZERO,e.ONE),e.enable(e.BLEND),this.depthPeeler.blend(e,this.quadMesh),e.disable(e.BLEND),e.enable(e.DEPTH_TEST)})),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),this.toneMap.use(e),this.quadMesh.draw(e,0),this.inputSystem.reset()}}function N(n,e,r,t=-1){for(let a=e;a<n.length;++a)if(r(n[a],a,n))return a;return t}function h(n,e){return n.push(e),e}class $e{constructor(e,r,t){c(this,"rotator");c(this,"translator");c(this,"inputSystem");this.rotator=e,this.translator=r,this.inputSystem=t}preUpdate(e,r){const a=this.rotator.trs.rotation;a[0]-=this.inputSystem.dragDelta[1]*.5,a[1]-=this.inputSystem.dragDelta[0]*.5;const i=.05,s=this.translator.trs.translation;s[2]=Me(s[2]+this.inputSystem.scrollDelta*i,1,5)}}function K(n){return n instanceof Error?n:new Error(String(n))}async function Ze(n,e,r){const t=r.scene,a=h(t.nodes,new A(null,"center")),i=h(t.nodes,new A(a,"camera"));i.trs.translation[2]=3,a.addComponent(new $e(a,i,r.inputSystem));const s=new Re(xe.deg(45),.1,1e3),o=h(t.cameras,new W(i,0,s));o.normalizedViewportRect.w=.5,o.cullMask^=4;const d=h(t.cameras,new W(i,0,s));d.normalizedViewportRect.w=.5,d.normalizedViewportRect.x=.5,d.cullMask^=2;const l=$(n,Q.createBackdrop("backdrop"));new O(n,l,r.standardVertexModel);const f=S(n,Le),E=C(n,Be),u=new p(n,"skybox",r.standardVertexModel,f,E),T=new v(n,u,{name:"ocean",queue:5});S(n,Y);const y=S(n,He),g=C(n,Ie),L=C(n,Oe),D=new p(n,"pbr",r.standardVertexModel,y,g),R=new p(n,"pbrDepthPeeling",r.standardVertexModel,y,L),b=await e.loadImageBitmapCube(["/skybox/ocean/right.jpg","/skybox/ocean/left.jpg","/skybox/ocean/top.jpg","/skybox/ocean/bottom.jpg","/skybox/ocean/front.jpg","/skybox/ocean/back.jpg"]),_=new M(n,n.TEXTURE_CUBE_MAP,11,n.SRGB8_ALPHA8,1024,1024);_.bind(n).subImageCube(0,0,0,n.RGBA,n.UNSIGNED_BYTE,b).parameteri(n.TEXTURE_MIN_FILTER,n.LINEAR_MIPMAP_LINEAR).parameteri(n.TEXTURE_MAG_FILTER,n.LINEAR).generateMipmap(),b.forEach(de=>de.close()),T.setUniformValues({skybox:_});const B=S(n,Ve),V=C(n,Ue),U=new p(n,"irradiance",r.standardVertexModel,B,V),m=new v(n,U,{uniforms:{envMap:_}}),x=new I(n,n.FRAMEBUFFER),J=Pe(n,128,m,r.quadMesh,x),ee=new F(n,n.VERTEX_SHADER,Se),re=new F(n,n.FRAGMENT_SHADER,Ae),ne=new p(n,"prefiltered",r.standardVertexModel,ee,re),te=new v(n,ne,{uniforms:{envMap:_}}),X=6,ae=ge(n,X,3,te,r.quadMesh,x),G={baseColorMap:r.whiteTexture,brdfLutMap:r.brdfLutMap,irradianceEnvMap:J,maxLevel:X,prefilteredEnvMap:ae,baseColorValue:[0,0,0,1]},oe=h(t.materials,new v(n,D,{name:"standard",queue:6,quiet:!0,uniforms:G})),se=h(t.materials,new v(n,R,{name:"depthPeeling",queue:7,quiet:!0,uniforms:G})),z=h(t.nodes,new A(null,"sphere"));z.trs.scale=Te(20,20,20);const ie=new URL("/ToyCar.gltf",window.location.toString()),ce=await e.loadGltf(ie.href),le=new Je(r,z,n.STATIC_DRAW,oe,se);ke(ce,le)}function Qe(n){const e=2*(n[3]*n[0]+n[1]*n[2]),r=1-2*(n[0]*n[0]+n[1]*n[1]),t=H(Math.atan2(e,r)),a=Math.sqrt(1+2*(n[3]*n[1]-n[0]*n[2])),i=Math.sqrt(1-2*(n[3]*n[1]-n[0]*n[2])),s=H(2*Math.atan2(a,i)-Math.PI/2),o=2*(n[3]*n[2]+n[0]*n[1]),d=1-2*(n[1]*n[1]+n[2]*n[2]),l=H(Math.atan2(o,d));return[t,s,l]}class Je{constructor(e,r,t,a,i){c(this,"renderer");c(this,"materials");c(this,"standardMaterial");c(this,"usage");c(this,"root");const s=new Map;s.set("transparentFabric",a.clone({uniforms:{roughness:1,baseColorValue:[1,0,0,.7]}})),s.set("transparentToyCar",a.clone({uniforms:{roughness:0,baseColorValue:[0,1,0,.5]}})),s.set("transparentGlass",a.clone({uniforms:{roughness:0,baseColorValue:[0,0,1,.3]}})),s.set("depthPeelingFabric",i.clone({uniforms:{roughness:1,baseColorValue:[1,0,0,.7]}})),s.set("depthPeelingToyCar",i.clone({uniforms:{roughness:0,baseColorValue:[0,1,0,.5]}})),s.set("depthPeelingGlass",i.clone({uniforms:{roughness:0,baseColorValue:[0,0,1,.3]}}));for(const o of s.values())e.scene.materials.push(o);this.renderer=e,this.standardMaterial=a,this.materials=s,this.root=r,this.usage=t}addBufferObject(e,r){const t=new _e(this.renderer.gl,e);return t.bind(this.renderer.gl).data(r,this.usage),t}addNode(e){return h(this.renderer.scene.nodes,new A(this.root,e))}setParentNode(e,r){e.parent=r}setScale(e,r){k(e.trs.scale,r)}setRotation(e,r){k(e.trs.rotation,Qe(r))}setTranslation(e,r){k(e.trs.translation,r)}addMesh(e,r,t,a){const i={name:e,attributes:t,drawMode:r,indices:a};return new O(this.renderer.gl,i,this.renderer.standardVertexModel)}linkNodeMesh(e,r){const t=this.renderer.gl,a=r.geometry.name,i=this.materials.get("transparent"+a)??this.standardMaterial,s=this.materials.get("depthPeeling"+a)??this.standardMaterial;this.renderer.scene.drawers.push(new q(t,e,r,i,2)),this.renderer.scene.drawers.push(new q(t,e,r,s,4))}}try{let n=function(o){o.preventDefault(),a.inputSystem.scroll(o.deltaY),a.requestRender()};const e=document.querySelector("main canvas");if(!e)throw new Error("cannot find the canvas");me(e,1024);const r=he(e),t=new pe,a=new Ye(r),i=new ve(o=>{switch(o.touchDrags.length){case 1:{const d=o.touchDrags[0];a.inputSystem.drag(d.delta[0],d.delta[1]);break}case 2:{const d=o.touchDrags[0],l=o.touchDrags[1],f=P(d.currentPos,d.delta),E=P(l.currentPos,l.delta),u=j(P(f,E)),T=j(P(d.currentPos,l.currentPos));a.inputSystem.scroll(u-T);break}}a.requestRender()}),s=new Ee(o=>{a.inputSystem.drag(o.delta[0],o.delta[1]),a.requestRender()});e.addEventListener("wheel",n,{passive:!1}),e.addEventListener("mousedown",o=>s.mouseDown(o)),document.addEventListener("mousemove",o=>s.mouseMove(o)),document.addEventListener("mouseup",o=>s.mouseUp(o)),e.addEventListener("touchstart",o=>i.touchStart(o)),document.addEventListener("touchend",o=>i.touchEnd(o)),document.addEventListener("touchmove",o=>i.touchMove(o)),async function(){try{await Ze(r,t,a),a.requestRender()}catch(o){console.error(K(o))}}()}catch(n){const e=document.body,r=K(n).message,t=document.createElement("pre");t.classList.add("error"),t.append(r),e.prepend(t)}
