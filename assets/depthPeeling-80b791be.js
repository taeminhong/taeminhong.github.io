var ce=Object.defineProperty;var de=(r,e,n)=>e in r?ce(r,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):r[e]=n;var s=(r,e,n)=>(de(r,typeof e!="symbol"?e+"":e,n),n);import"./modulepreload-polyfill-3cfb730f.js";import{A as fe,P as ue,F as k,T,u as _,S as C,f as q,a as p,M as v,t as N,N as S,b as K,c as O,v as y,d as me,B as he,h as U,G as Y,V as pe,j as ve,C as z,k as $,q as Ee,r as be,s as H,l as _e,m as Te}from"./fullscreen-quad-a49f2f71.js";import{e as we,i as xe,R as Me,d as Re,p as Ne,f as Ce,g as Fe,s as De,a as ge,b as ye,c as Se}from"./prefiltered-env-map-5383c484.js";import{l as Ae}from"./gltf-loader-b8d52967.js";var Pe=`#version 300 es

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
}`,Le=`#version 300 es

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
}`,Be=`#version 300 es

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
    float ref = texture(depthPeelReference, gl_FragCoord.xy / depthPeelScreenSize).r;
    if (gl_FragCoord.z + depthBias <= ref)
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
}`,Ve=`#version 300 es

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
}`;function Ue(r,e,n){const t=_e(Te(),e);r.setUniformValues({model:e,inverseTranspose:t,view:n.view,proj:n.proj,viewPos:n.position,viewPosition:n.position,inverseView:n.inverseView},!0)}function He(r,e,n,t,o){Ue(o,n,t),o.use(r);for(let i=0;i<e.subMeshes.length;++i)e.draw(r,i)}class W{constructor(e,n,t,o,i=1){s(this,"mesh");s(this,"material");s(this,"node");s(this,"layer");this.node=n,this.mesh=t,this.material=o,this.layer=i}draw(e,n){He(e,this.mesh,this.node.globalMatrix,n,this.material)}}class ke{constructor(){s(this,"nodes");s(this,"cameras");s(this,"drawers");s(this,"materials");s(this,"indirectLightMaterial");this.nodes=[],this.drawers=[],this.cameras=[],this.materials=[]}update(e,n){this.nodes.forEach(t=>t.preUpdate(n)),this.nodes.forEach(t=>t.update(e)),this.cameras.forEach(t=>t.update(e)),this.cameras.sort((t,o)=>t.order-o.order),this.drawers.sort((t,o)=>t.material.queue-o.material.queue)}}function Oe(r,e,n){const t=K(r,e);return new O(r,t,n)}class Ie{constructor(e,n,t,o){s(this,"binder");s(this,"colorBuffers");s(this,"depthBuffers");const i=n.bind(e);i.texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,o[1],0),e.clearBufferfv(e.DEPTH,0,[0]),this.binder=i,this.colorBuffers=t,this.depthBuffers=o}unbind(){this.binder.unbind()}layer(e){if(e<0||e>=this.colorBuffers.length)throw new RangeError(`invalid layer index [0, ${this.colorBuffers.length}): ${e}`);const n=this.binder.gl;return this.binder.texture2D(n.COLOR_ATTACHMENT0,n.TEXTURE_2D,this.colorBuffers[e],0).texture2D(n.DEPTH_ATTACHMENT,n.TEXTURE_2D,this.depthBuffers[e%2],0),this.depthBuffers[(e+1)%2]}}class Xe{constructor(e,n,t,o,i){s(this,"width");s(this,"height");s(this,"framebuffer");s(this,"colorBuffers");s(this,"depthBuffers");s(this,"material");if(n<1)throw new RangeError(`There must be at least one layer in DepthPeeler, but given ${n}`);const a=[];for(let c=0;c<2;++c){const d=new T(e,e.TEXTURE_2D,1,e.DEPTH_COMPONENT32F,t,o);d.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),a.push(d)}const l=[];for(let c=0;c<n;++c){const d=new T(e,e.TEXTURE_2D,1,e.RGBA8,t,o);d.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),l.push(d)}const f=new k(e,e.FRAMEBUFFER);_(f,e,c=>{c.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,l[0],0).texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,a[0],0).drawBuffers(e.COLOR_ATTACHMENT0).checkStatus(d=>{if(d!=e.FRAMEBUFFER_COMPLETE)throw new Y(e,d||e.getError())})}),i.setUniformValues({layer0:l[0],layer1:l[1],layer2:l[2],layer3:l[3]}),this.framebuffer=f,this.depthBuffers=a,this.colorBuffers=l,this.width=t,this.height=o,this.material=i}bind(e){return new Ie(e,this.framebuffer,this.colorBuffers,this.depthBuffers)}blend(e,n){this.material.use(e),n.draw(e,0)}get length(){return this.colorBuffers.length}}class Ge{constructor(e){s(this,"gl");s(this,"scene");s(this,"inputSystem");s(this,"standardVertexModel");s(this,"quadMesh");s(this,"toneMap");s(this,"brdfLutMap");s(this,"whiteTexture");s(this,"framebufferWidth");s(this,"framebufferHeight");s(this,"depthPeeler");s(this,"framebuffer");s(this,"take");s(this,"callbackId");const n=new pe([{name:"POSITION",location:0},{name:"NORMAL",location:1},{name:"TEXCOORD_0",location:3},{name:"TEXCOORD_1",location:4},{name:"TEXCOORD_2",location:5}]),t=$.createQuad("quad"),o=Oe(e,t,n),i=new k(e,e.FRAMEBUFFER),a=e.drawingBufferWidth,l=e.drawingBufferHeight,f=new T(e,e.TEXTURE_2D,1,e.RGBA16F,a,l);f.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind();const c=new T(e,e.TEXTURE_2D,1,e.DEPTH_COMPONENT32F,a,l);c.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),_(i,e,m=>{m.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,f,0).texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,c,0).checkStatus(M=>{if(M!=e.FRAMEBUFFER_COMPLETE)throw new Y(e,M||e.getError())})});const d=new C(e,e.VERTEX_SHADER,q),w=new C(e,e.FRAGMENT_SHADER,we),u=new p(e,"exposure",n,d,w),F=new v(e,u,{name:"toneMap"}),D=new C(e,e.FRAGMENT_SHADER,xe),A=new p(e,"integrateBRDF",n,d,D),P=new v(e,A),g=new T(e,e.TEXTURE_2D,1,e.RGBA8,32,32),x=new Uint8Array(32*32*4);for(let m=0;m<x.length;++m)x[m]=255;g.bind(e).subImage2D(e.TEXTURE_2D,0,0,0,32,32,e.RGBA,e.UNSIGNED_BYTE,x).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST),F.setUniformValues({exposure:1.5,hdrBuffer:f});const E=new Me(e,{cube:!1,width:256,height:256,colorInternalFormat0:e.RGBA16F});_(E,e,m=>{e.viewport(0,0,E.width,E.height),e.clear(e.COLOR_BUFFER_BIT),P.use(e),o.draw(e,0)});const b=N(e,Ve),L=new p(e,"merge",n,d,b),B=new v(e,L),V=new Xe(e,4,a,l,B);this.gl=e,this.scene=new ke,this.inputSystem=new ze,this.take=0,this.standardVertexModel=n,this.quadMesh=o,this.toneMap=F,this.framebufferWidth=a,this.framebufferHeight=l,this.framebuffer=i,this.callbackId=0,this.brdfLutMap=E.colorTextures[0],this.whiteTexture=g,this.depthPeeler=V}requestRender(){this.callbackId===0&&(this.callbackId=requestAnimationFrame(e=>{this.scene.update(++this.take,0),this.render(),this.callbackId=0}))}render(){const e=this.gl,n=this.scene.drawers;let t=0,o=0;e.clearColor(0,0,0,1),e.clearDepth(1),e.depthMask(!0),e.enable(e.DEPTH_TEST),e.depthFunc(e.LEQUAL),e.enable(e.CULL_FACE),e.cullFace(e.BACK),_(this.framebuffer,e,i=>{t=R(n,o,a=>a.material.queue>=3,n.length),o=R(n,t,a=>a.material.queue>5,n.length),e.clearBufferfv(e.COLOR,0,[.05,.05,.05,1]),e.clearBufferfv(e.DEPTH,0,[1]);for(const a of this.scene.cameras){const l=a.viewport(this.framebufferWidth,this.framebufferHeight).map(Math.round),f=a.prepare(l.aspectRatio);e.viewport(l.x,l.y,l.w,l.h);for(let c=t;c<o;++c)n[c].layer&a.cullMask&&n[c].draw(e,f)}if(t=o,o=R(n,t,a=>a.material.queue>6,n.length),o>t){e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE),e.enable(e.BLEND);for(const a of this.scene.cameras){const l=a.viewport(this.framebufferWidth,this.framebufferHeight).map(Math.round),f=a.prepare(l.aspectRatio);e.viewport(l.x,l.y,l.w,l.h);for(let c=t;c<o;++c)n[c].layer&a.cullMask&&n[c].draw(e,f)}e.disable(e.BLEND)}}),t=R(n,o,i=>i.material.queue===7,n.length),o=R(n,t,i=>i.material.queue>7,n.length),t<o&&(_(this.depthPeeler,e,i=>{for(let a=0;a<this.depthPeeler.length;++a){const l=i.layer(a),f=[this.depthPeeler.width,this.depthPeeler.height];e.clearBufferfv(e.COLOR,0,[0,0,0,0]),e.clearBufferfv(e.DEPTH,0,[1]);for(const c of this.scene.cameras){const d=c.viewport(this.depthPeeler.width,this.depthPeeler.height).map(Math.round),w=c.prepare(d.aspectRatio);e.viewport(d.x,d.y,d.w,d.h);for(let u=t;u<o;++u)n[u].layer&c.cullMask&&(n[u].material.setUniformValues({depthPeelReference:l,depthPeelScreenSize:f,depthBias:-1e-5},!0),n[u].draw(e,w),n[u].material.setUniformValues({depthPeelReference:null},!0))}}}),_(this.framebuffer,e,i=>{e.viewport(0,0,this.framebufferWidth,this.framebufferHeight),e.disable(e.DEPTH_TEST),e.blendFuncSeparate(e.ONE,e.SRC_ALPHA,e.ZERO,e.ONE),e.enable(e.BLEND),this.depthPeeler.blend(e,this.quadMesh),e.disable(e.BLEND),e.enable(e.DEPTH_TEST)})),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),this.toneMap.use(e),this.quadMesh.draw(e,0),this.inputSystem.reset()}}function R(r,e,n,t=-1){for(let o=e;o<r.length;++o)if(n(r[o],o,r))return o;return t}function h(r,e){return r.push(e),e}class ze{constructor(){s(this,"scrollDelta");s(this,"dragging");s(this,"dragDelta");this.scrollDelta=0,this.dragging=!1,this.dragDelta=[0,0]}reset(){this.scrollDelta=0,this.dragDelta[0]=0,this.dragDelta[1]=0}scroll(e){this.scrollDelta+=e}startDrag(){this.dragging=!0}endDrag(){this.dragging=!1}drag(e,n){this.dragging&&(this.dragDelta[0]+=e,this.dragDelta[1]+=n)}}class We{constructor(e,n,t){s(this,"rotator");s(this,"translator");s(this,"inputSystem");this.rotator=e,this.translator=n,this.inputSystem=t}preUpdate(e,n){const o=this.rotator.trs.rotation;o[0]-=this.inputSystem.dragDelta[1]*.5,o[1]-=this.inputSystem.dragDelta[0]*.5;const i=.05,a=this.translator.trs.translation;a[2]=ve(a[2]+this.inputSystem.scrollDelta*i,1,5)}}function je(){const r=document.querySelector("main canvas");if(!r)throw new Error("cannot find the canvas");const e=r.getContext("webgl2");if(!e)throw new Error("This browser does not support WebGL2");let n=e;for(const t of["EXT_color_buffer_float","OES_texture_float_linear"])if(!n.getExtension(t))throw new Error(`This browser does not support extension: ${t}`);return r.width=r.clientWidth,r.height=r.clientHeight,n}function j(r){return r instanceof Error?r:new Error(String(r))}async function qe(r,e,n){const t=n.scene,o=h(t.nodes,new S(null,"center")),i=h(t.nodes,new S(o,"camera"));i.trs.translation[2]=3,o.addComponent(new We(o,i,n.inputSystem));const a=new Ee(be.deg(45),.1,1e3),l=h(t.cameras,new z(i,0,a));l.normalizedViewportRect.w=.5,l.cullMask^=4;const f=h(t.cameras,new z(i,0,a));f.normalizedViewportRect.w=.5,f.normalizedViewportRect.x=.5,f.cullMask^=2;const c=K(r,$.createBackdrop("backdrop"));new O(r,c,n.standardVertexModel);const d=y(r,De),w=N(r,ge),u=new p(r,"skybox",n.standardVertexModel,d,w),F=new v(r,u,{name:"ocean",queue:5});y(r,q);const D=y(r,Pe),A=N(r,Le),P=N(r,Be),g=new p(r,"pbr",n.standardVertexModel,D,A),x=new p(r,"pbrDepthPeeling",n.standardVertexModel,D,P),E=await e.loadImageBitmapCube(["/skybox/ocean/right.jpg","/skybox/ocean/left.jpg","/skybox/ocean/top.jpg","/skybox/ocean/bottom.jpg","/skybox/ocean/front.jpg","/skybox/ocean/back.jpg"]),b=new T(r,r.TEXTURE_CUBE_MAP,11,r.SRGB8_ALPHA8,1024,1024);b.bind(r).subImageCube(0,0,0,r.RGBA,r.UNSIGNED_BYTE,E).parameteri(r.TEXTURE_MIN_FILTER,r.LINEAR_MIPMAP_LINEAR).parameteri(r.TEXTURE_MAG_FILTER,r.LINEAR).generateMipmap(),E.forEach(le=>le.close()),F.setUniformValues({skybox:b});const L=y(r,ye),B=N(r,Se),V=new p(r,"irradiance",n.standardVertexModel,L,B),m=new v(r,V,{uniforms:{envMap:b}}),M=new k(r,r.FRAMEBUFFER),Q=Re(r,128,m,n.quadMesh,M),Z=new C(r,r.VERTEX_SHADER,Ne),J=new C(r,r.FRAGMENT_SHADER,Ce),ee=new p(r,"prefiltered",n.standardVertexModel,Z,J),re=new v(r,ee,{uniforms:{envMap:b}}),I=6,ne=Fe(r,I,3,re,n.quadMesh,M),X={baseColorMap:n.whiteTexture,brdfLutMap:n.brdfLutMap,irradianceEnvMap:Q,maxLevel:I,prefilteredEnvMap:ne,baseColorValue:[0,0,0,1]},te=h(t.materials,new v(r,g,{name:"standard",queue:6,quiet:!0,uniforms:X})),ae=h(t.materials,new v(r,x,{name:"depthPeeling",queue:7,quiet:!0,uniforms:X})),G=h(t.nodes,new S(null,"sphere"));G.trs.scale=me(20,20,20);const oe=new URL("/ToyCar.gltf",window.location.toString()),se=await e.loadGltf(oe.href),ie=new Ye(n,G,r.STATIC_DRAW,te,ae);Ae(se,ie)}function Ke(r){const e=2*(r[3]*r[0]+r[1]*r[2]),n=1-2*(r[0]*r[0]+r[1]*r[1]),t=H(Math.atan2(e,n)),o=Math.sqrt(1+2*(r[3]*r[1]-r[0]*r[2])),i=Math.sqrt(1-2*(r[3]*r[1]-r[0]*r[2])),a=H(2*Math.atan2(o,i)-Math.PI/2),l=2*(r[3]*r[2]+r[0]*r[1]),f=1-2*(r[1]*r[1]+r[2]*r[2]),c=H(Math.atan2(l,f));return[t,a,c]}class Ye{constructor(e,n,t,o,i){s(this,"renderer");s(this,"materials");s(this,"standardMaterial");s(this,"usage");s(this,"root");const a=new Map;a.set("transparentFabric",o.clone({uniforms:{roughness:1,baseColorValue:[1,0,0,.7]}})),a.set("transparentToyCar",o.clone({uniforms:{roughness:0,baseColorValue:[0,1,0,.5]}})),a.set("transparentGlass",o.clone({uniforms:{roughness:0,baseColorValue:[0,0,1,.3]}})),a.set("depthPeelingFabric",i.clone({uniforms:{roughness:1,baseColorValue:[1,0,0,.7]}})),a.set("depthPeelingToyCar",i.clone({uniforms:{roughness:0,baseColorValue:[0,1,0,.5]}})),a.set("depthPeelingGlass",i.clone({uniforms:{roughness:0,baseColorValue:[0,0,1,.3]}}));for(const l of a.values())e.scene.materials.push(l);this.renderer=e,this.standardMaterial=o,this.materials=a,this.root=n,this.usage=t}addBufferObject(e,n){const t=new he(this.renderer.gl,e);return t.bind(this.renderer.gl).data(n,this.usage),t}addNode(e){return h(this.renderer.scene.nodes,new S(this.root,e))}setParentNode(e,n){e.parent=n}setScale(e,n){U(e.trs.scale,n)}setRotation(e,n){U(e.trs.rotation,Ke(n))}setTranslation(e,n){U(e.trs.translation,n)}addMesh(e,n,t,o){const i={name:e,attributes:t,drawMode:n,indices:o};return new O(this.renderer.gl,i,this.renderer.standardVertexModel)}linkNodeMesh(e,n){const t=this.renderer.gl,o=n.geometry.name,i=this.materials.get("transparent"+o)??this.standardMaterial,a=this.materials.get("depthPeeling"+o)??this.standardMaterial;this.renderer.scene.drawers.push(new W(t,e,n,i,2)),this.renderer.scene.drawers.push(new W(t,e,n,a,4))}}try{let r=function(a){a.preventDefault(),t.inputSystem.scroll(a.deltaY),t.requestRender()};const e=je(),n=new fe,t=new Ge(e),o=e.canvas,i=new ue(a=>{a.done?t.inputSystem.endDrag():(a.count===0&&t.inputSystem.startDrag(),t.inputSystem.drag(a.delta[0],a.delta[1])),t.requestRender()});o.addEventListener("wheel",r,{passive:!1}),o.addEventListener("pointerdown",a=>i.pointerDown(a)),document.addEventListener("pointermove",a=>i.pointerMove(a)),document.addEventListener("pointerup",a=>i.pointerUp(a)),async function(){try{await qe(e,n,t),t.requestRender()}catch(a){console.error(j(a))}}()}catch(r){const e=document.body,n=j(r).message,t=document.createElement("pre");t.classList.add("error"),t.append(n),e.prepend(t)}
