var we=Object.defineProperty;var Te=(c,e,a)=>e in c?we(c,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):c[e]=a;var r=(c,e,a)=>(Te(c,typeof e!="symbol"?e+"":e,a),a);import"./modulepreload-polyfill-3cfb730f.js";/* empty css             */import{r as _e,i as Re,A as J,T as xe,s as C,p as X,M as ye,S as Me,f as be,b as x,F,q as O,P as N,a as P,N as M,C as Se,u as b,v as z,k,t as Ae,w as V,x as I,y as De,e as L,l as Oe,z as G,B as W,D as j,E as q,H as Q,J as $,K as Ne,L as Pe,g as Ie,h as K,c as Z,d as ee,V as ge,j as Ce,I as Le,G as Y,n as Fe,o as ke}from"./fullscreen-quad-cddcd807.js";var Ue=`#version 300 es

in vec2 POSITION;

out vec3 v_position;

uniform mat4 view;
uniform mat4 proj;
uniform sampler2D heightMap;
uniform vec2 heightMapSize;
uniform vec4 ST;
uniform float waterLevel;
uniform float waveHeight;

void main()
{
    mat4 vp = proj * view;
    vec2 uv = POSITION - ST.zw;
    uv /= ST.xy;
    uv *= heightMapSize - vec2(1.0);
    uv += 0.5;
    uv /= heightMapSize;
    float height = texture(heightMap, uv).r;
    float y = waterLevel + mix(-waveHeight, 0.0, height);
    vec3 position = vec3(POSITION.x, y, -POSITION.y);
    v_position = position;
    gl_Position = vp * vec4(position, 1);
}`,Be=`#version 300 es

precision highp float;

#define ITERATIONS_NORMAL 37 
#define ITERATIONS_REFLECTION 16
#define PI 3.14159265358979323846264

in vec3 v_position;

out vec4 v_color;

uniform float     iTime;                 
uniform vec4      iMouse;                
uniform mat4 inverseView;
uniform mat4 inverseProj;
uniform mat4 inverseViewProj;
uniform vec3 viewPosition;
uniform mat4 view;
uniform mat4 proj;
uniform float waveDrag; 
uniform float waveHeight; 
uniform float waterLevel;
uniform sampler2D objectColorMap;
uniform sampler2D objectDepthMap;
uniform float maxReflectionDistance;
uniform float maxScatteringDistance;

float getWaves(vec2 position, int iterations, float time, float waveDrag)
{
    float iter = 0.0; 
    float frequency = 1.0; 
    float timeMultiplier = 2.0; 
    float weight = 1.0;
    float sumOfValues = 0.0; 
    float sumOfWeights = 0.0; 
    for(int i=0; i < iterations; i++) {
        
        vec2 p = vec2(sin(iter), cos(iter));
        
        float x = dot(position, p) * frequency + time * timeMultiplier;
        float wave = exp(sin(x) - 1.0);
        float dx = wave * -cos(x);

        
        position += p * dx * weight * waveDrag;

        
        sumOfValues += wave * weight;
        sumOfWeights += weight;

        
        weight = mix(weight, 0.0, 0.2);
        frequency *= 1.18;
        timeMultiplier *= 1.07;

        
        iter += 1232.399963;
    }
    
    return sumOfValues / sumOfWeights;
}
#ifndef _ATMOSPHERE_
#define _ATMOSPHERE_

vec3 extra_cheap_atmosphere(vec3 raydir, vec3 sundir)
{
    sundir.y = max(sundir.y, -0.07);
    float special_trick = 1.0 / (raydir.y * 1.0 + 0.1);
    float special_trick2 = 1.0 / (sundir.y * 11.0 + 1.0);
    float raysundt = pow(abs(dot(sundir, raydir)), 2.0);
    float sundt = pow(max(0.0, dot(sundir, raydir)), 8.0);
    float mymie = sundt * special_trick * 0.2;
    vec3 suncolor = mix(vec3(1.0), max(vec3(0.0), vec3(1.0) - vec3(5.5, 13.0, 22.4) / 22.4), special_trick2);
    vec3 bluesky= vec3(5.5, 13.0, 22.4) / 22.4 * suncolor;
    vec3 bluesky2 = max(vec3(0.0), bluesky - vec3(5.5, 13.0, 22.4) * 0.002 * (special_trick + -6.0 * sundir.y * sundir.y));
    bluesky2 *= special_trick * (0.24 + raysundt * 0.24);
    return bluesky2 * (1.0 + 1.0 * pow(1.0 - raydir.y, 3.0));
}

vec3 getSunDirection()
{
    return normalize(vec3(-0.2, 1.0, -0.5));
}

vec3 getAtmosphere(vec3 dir)
{
    return extra_cheap_atmosphere(dir, getSunDirection()) * 0.5;
}

vec3 getSun(vec3 dir)
{
    vec3 color = vec3(1.0, 0.8, 0.6);
    float luminance = pow(max(0.0, dot(dir, getSunDirection())), 620.0) * 110.0;
    return luminance * color;
}

#endif

float getwaves(vec2 position, int iterations)
{
    return getWaves(position, iterations, iTime, waveDrag);
}

vec3 normal(vec2 pos, float e, float depth)
{
    vec2 ex = vec2(e, 0);
    float H = getwaves(pos.xy, ITERATIONS_NORMAL) * depth;
    vec3 a = vec3(pos.x, H, pos.y);
    return normalize(
        cross(
            a - vec3(pos.x - e, getwaves(pos.xy - ex.xy, ITERATIONS_NORMAL) * depth, pos.y),
            a - vec3(pos.x, getwaves(pos.xy + ex.yx, ITERATIONS_NORMAL) * depth, pos.y + e)
            )
        );
}

vec3 scatter(vec3 pos, vec3 dir, vec3 baseColor, float atten, float maxDistance)
{
    vec3 colorWater = baseColor * 0.3 * (0.2 + (pos.y + waveHeight) / waveHeight * atten);
    colorWater = max(colorWater, vec3(0, 0, 0));

    vec4 start = view * vec4(pos, 1);
    vec4 posViewSpace = start;
    vec3 colorObject = vec3(0, 0, 0);
    float dist = maxDistance;

    for (int i = 0; i < 3; ++i) {
        vec4 posClipSpace = proj * posViewSpace;
        vec2 st = posClipSpace.xy / posClipSpace.w * 0.5 + 0.5;
        float depth = texture(objectDepthMap, st).r;
        vec4 unprojected = inverseProj * vec4(posClipSpace.xy, depth * 2.0 - 1.0, 1);
        dist = start.z - (unprojected.z / unprojected.w);
        colorObject = texture(objectColorMap, st).rgb;
        posViewSpace += vec4(dir * dist * 0.2, 1);
    }
    float bias = 0.3;
    float t = min(1.0, dist / maxDistance + bias);
    return mix(colorObject, colorWater, t);
}

vec3 getReflection(vec3 start, vec3 dir, float maxDistance, int iterations, mat4 proj, vec3 defaultColor)
{
    vec3 pos = start;
    vec4 clipPos = proj * vec4(pos, 1);
    float startDepth = clipPos.z / clipPos.w * 0.5 + 0.5;
    vec3 delta = dir * maxDistance / float(iterations);
    for (int i = 0; i < iterations; ++i) {
        pos += delta;
        clipPos = proj * vec4(pos, 1);
        vec3 stz = clipPos.xyz / clipPos.w * 0.5 + 0.5;
        float depth = texture(objectDepthMap, stz.st).r;
        if (depth > startDepth && depth < stz.z)
            return texture(objectColorMap, stz.st).rgb;
    }
    return defaultColor;
}

void main()
{
    vec3 ray = normalize(v_position - viewPosition);
    vec3 V = normalize(viewPosition - v_position);
    float dist = distance(v_position, viewPosition);

    
    vec3 N = normal(v_position.xz, 0.01, waveHeight);

    
    

    
    float f0 = 0.04;
    float fresnel = mix(f0, 1.0, pow(1.0 - max(0.0, dot(N, V)), 5.0));

    
    vec3 R = normalize(reflect(-V, N));
    R.y = abs(R.y);

    
    vec3 sky = getAtmosphere(R) + getSun(R);
    vec3 reflection = getReflection(v_position, R, maxReflectionDistance, ITERATIONS_REFLECTION, proj * view, sky);
    vec3 deepBlue = vec3(0.0293, 0.0698, 0.1717);
    vec3 emerald = vec3(0.293, 0.698, 0.2717);
    vec3 lightBlue = vec3(0.393, 0.498, 0.7717);
    float ior = 1.325;
    vec3 scattering = scatter(v_position, refract(ray, N, 1.0 / ior), lightBlue, 0.25, maxScatteringDistance);

    
    vec3 C = fresnel * reflection + scattering;
    v_color = vec4(C, 1.0);
}`,He=`#version 300 es

in vec4 POSITION;
in vec3 NORMAL;

out vec3 v_position;
out vec3 v_normal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;
uniform mat3 inverseTranspose;

void main()
{
    mat4 mvp = proj * view * model;
    v_normal = normalize(inverseTranspose * NORMAL);
    v_position = (model * POSITION).xyz;
    gl_Position = mvp * POSITION;
}`,Xe=`#version 300 es

precision highp float;

in vec3 v_position;
in vec3 v_normal;

out vec4 f_color;

uniform vec3 viewPosition;

#ifndef _ATMOSPHERE_
#define _ATMOSPHERE_

vec3 extra_cheap_atmosphere(vec3 raydir, vec3 sundir)
{
    sundir.y = max(sundir.y, -0.07);
    float special_trick = 1.0 / (raydir.y * 1.0 + 0.1);
    float special_trick2 = 1.0 / (sundir.y * 11.0 + 1.0);
    float raysundt = pow(abs(dot(sundir, raydir)), 2.0);
    float sundt = pow(max(0.0, dot(sundir, raydir)), 8.0);
    float mymie = sundt * special_trick * 0.2;
    vec3 suncolor = mix(vec3(1.0), max(vec3(0.0), vec3(1.0) - vec3(5.5, 13.0, 22.4) / 22.4), special_trick2);
    vec3 bluesky= vec3(5.5, 13.0, 22.4) / 22.4 * suncolor;
    vec3 bluesky2 = max(vec3(0.0), bluesky - vec3(5.5, 13.0, 22.4) * 0.002 * (special_trick + -6.0 * sundir.y * sundir.y));
    bluesky2 *= special_trick * (0.24 + raysundt * 0.24);
    return bluesky2 * (1.0 + 1.0 * pow(1.0 - raydir.y, 3.0));
}

vec3 getSunDirection()
{
    return normalize(vec3(-0.2, 1.0, -0.5));
}

vec3 getAtmosphere(vec3 dir)
{
    return extra_cheap_atmosphere(dir, getSunDirection()) * 0.5;
}

vec3 getSun(vec3 dir)
{
    vec3 color = vec3(1.0, 0.8, 0.6);
    float luminance = pow(max(0.0, dot(dir, getSunDirection())), 620.0) * 110.0;
    return luminance * color;
}

#endif

void main()
{
    vec3 view = normalize(viewPosition - v_position);
    vec3 N = normalize(v_normal);
    
    float f0 = 0.04;
    float fresnel = mix(f0, 1.0, pow(1.0 - max(0.0, dot(N, view)), 5.0));

    vec3 dark = vec3(0, 0, 0);
    vec3 deepBlue = vec3(0.0293, 0.0698, 0.1717);
    vec3 emerald = vec3(0.293, 0.698, 0.2717);
    vec3 lightBlue = vec3(0.393, 0.498, 0.7717);

    
    vec3 R = normalize(reflect(-view, N));
    float up = step(0.0, R.y);
    R.y = abs(R.y);

    vec3 sky = getAtmosphere(R) + getSun(R);
    vec3 reflection = mix(dark, sky, up);
    vec3 diffuse = mix(deepBlue, vec3(1), N.y / 2.0 + 0.5) * vec3(0.9, 0.9, 0);

    
    vec3 C = fresnel * reflection + diffuse;

    f_color = vec4(C, 1);
}`,ze=`#version 300 es

#define ITERATIONS_RAYMARCH 12 

precision highp float;

float getWaves(vec2 position, int iterations, float time, float waveDrag)
{
    float iter = 0.0; 
    float frequency = 1.0; 
    float timeMultiplier = 2.0; 
    float weight = 1.0;
    float sumOfValues = 0.0; 
    float sumOfWeights = 0.0; 
    for(int i=0; i < iterations; i++) {
        
        vec2 p = vec2(sin(iter), cos(iter));
        
        float x = dot(position, p) * frequency + time * timeMultiplier;
        float wave = exp(sin(x) - 1.0);
        float dx = wave * -cos(x);

        
        position += p * dx * weight * waveDrag;

        
        sumOfValues += wave * weight;
        sumOfWeights += weight;

        
        weight = mix(weight, 0.0, 0.2);
        frequency *= 1.18;
        timeMultiplier *= 1.07;

        
        iter += 1232.399963;
    }
    
    return sumOfValues / sumOfWeights;
}

in vec2 v_texCoord;

out float f_height;

uniform float iTime;                 
uniform float waveDrag;
uniform vec2 texSize;
uniform vec4 ST;

void main()
{
    vec2 pos = (v_texCoord * texSize - 0.5) / (texSize - vec2(1.0)) * ST.xy + ST.zw;
    vec2 xz = vec2(pos.x, -pos.y);
    f_height = getWaves(xz, ITERATIONS_RAYMARCH, iTime, waveDrag);
}`,Ve=`#version 300 es

precision highp float;

in vec2 v_texCoord;

out vec4 f_color;

uniform sampler2D hdrBuffer;

vec3 aces_tonemap(vec3 color)
{
    mat3 m1 = mat3(
        0.59719, 0.07600, 0.02840,
        0.35458, 0.90834, 0.13383,
        0.04823, 0.01566, 0.83777
        );
    mat3 m2 = mat3(
        1.60475, -0.10208, -0.00327,
        -0.53108,  1.10813, -0.07276,
        -0.07367, -0.00605,  1.07602
        );
    vec3 v = m1 * color;
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return pow(clamp(m2 * (a / b), 0.0, 1.0), vec3(1.0 / 2.2));
}

void main()
{
    vec4 color = texture(hdrBuffer, v_texCoord);
    color.rgb = aces_tonemap(color.rgb);
    f_color = color;
}`,Ge=`#version 300 es

precision highp float;

in vec2 v_texCoord;

out vec4 f_color;

uniform sampler2D colorMap;
uniform sampler2D depthMap;

void main()
{
    f_color = texture(colorMap, v_texCoord);
    gl_FragDepth = texture(depthMap, v_texCoord).r;
}`;function We(c,e,a){const t=Z(c,e);return new ee(c,t,a)}class je{constructor(e){r(this,"gl");r(this,"standardVertexModel");r(this,"quadMesh");r(this,"toneMap");r(this,"whiteTexture");r(this,"framebuffer");r(this,"vertexShaders");r(this,"fragmentShaders");r(this,"programs");const a=new Map,t=new Map,o=new Map,s=new ge([{name:"POSITION",location:0},{name:"NORMAL",location:1},{name:"TEXCOORD_0",location:3},{name:"TEXCOORD_1",location:4},{name:"TEXCOORD_2",location:5}]),h=k.createQuad("quad"),u=We(e,h,s),i=new Me(e,e.VERTEX_SHADER,be);a.set("fullscreenQuad",i);const d=new x(e,e.TEXTURE_2D,1,e.RGBA8,32,32),v=new Uint8Array(32*32*4);for(let p=0;p<v.length;++p)v[p]=255;d.bind(e).subImage2D(e.TEXTURE_2D,0,0,0,32,32,e.RGBA,e.UNSIGNED_BYTE,v).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST);const m=new F(e,e.FRAMEBUFFER),n=new x(e,e.TEXTURE_2D,1,e.RGBA16F,e.drawingBufferWidth,e.drawingBufferHeight);n.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind();const l=new x(e,e.TEXTURE_2D,1,e.DEPTH24_STENCIL8,e.drawingBufferWidth,e.drawingBufferHeight);l.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),m.bind(e).texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,n,0).texture2D(e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,l,0).drawBuffers(e.COLOR_ATTACHMENT0).unbind();const f=O(e,Ve),T=new N(e,"aces",s,i,f),_=new P(T,{name:"toneMap",uniforms:{hdrBuffer:n},quiet:!0});this.gl=e,this.standardVertexModel=s,this.quadMesh=u,this.toneMap=_,this.framebuffer=m,this.whiteTexture=d,this.fragmentShaders=t,this.vertexShaders=a,this.programs=o}}function E(c,e){return c.push(e),e}function qe(c){return c instanceof Error?c:new Error(String(c))}class Qe{constructor(e,a){this.gl=e,this.vertexModel=a}build(e){return new ee(this.gl,Z(this.gl,e),this.vertexModel)}}class $e{constructor(e,a){r(this,"nodes");r(this,"cameras");r(this,"drawers");r(this,"materials");r(this,"indirectLightMaterial");r(this,"oceanDrawer");r(this,"waveFramebuffer");r(this,"waveMaterial");r(this,"take");r(this,"renderer");r(this,"inputSystem");r(this,"assetLoader");r(this,"buoyMaterial");r(this,"buoyFramebuffer");r(this,"buoy");r(this,"overlay");const t=[],o=[],s=[],h=[],u=E(t,new M(null,"center")),i=E(t,new M(u,"camera")),d=new Fe(ke.deg(45),.1,1e3);E(o,new Ce(i,0,d));const v=new Le;i.trs.translation[2]=5,u.trs.rotation.setEuler([-12,0,0]),u.addComponent(new Se(u,i,v,3,50));const m=a.vertexShaders.get("fullscreenQuad");if(!m)throw new Error("Vertex shader not found: fullscreenQuad");const n=7,l=7,f=new x(e,e.TEXTURE_2D,1,e.R16F,256,256);f.bind(e).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR).unbind();const T=new F(e,e.FRAMEBUFFER);b(T,e,A=>{A.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,f,0).drawBuffers(e.COLOR_ATTACHMENT0).checkStatus(D=>{if(D!==e.FRAMEBUFFER_COMPLETE)throw new Y(D||e.getError())})});const _=O(e,ze),p=new N(e,"wave",a.standardVertexModel,m,_),y=E(h,new P(p,{uniforms:{texSize:[f.width,f.height],ST:[n,l,-n*.5,-l*.5]}})),S=new F(e,e.FRAMEBUFFER),w=new x(e,e.TEXTURE_2D,1,e.RGBA16F,e.drawingBufferWidth,e.drawingBufferHeight);w.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind();const g=new x(e,e.TEXTURE_2D,1,e.DEPTH_COMPONENT32F,e.drawingBufferWidth,e.drawingBufferHeight);g.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),b(S,e,A=>{A.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,w,0),A.texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,g,0),A.checkStatus(D=>{if(D!==e.FRAMEBUFFER_COMPLETE)throw new Y(D||e.getError())})});const te=O(e,Ge),ne=new N(e,"overlay",a.standardVertexModel,m,te),ae=E(h,new P(ne,{uniforms:{colorMap:w,depthMap:g}})),re=z(e,Ue),oe=O(e,Be),ie=new N(e,"ocean",a.standardVertexModel,re,oe),se=E(h,new P(ie,{uniforms:{heightMap:f,heightMapSize:[f.width,f.height],ST:[n,l,-n*.5,-l*.5],objectColorMap:w,objectDepthMap:g,maxReflectionDistance:.5,maxScatteringDistance:.5,waveDrag:.24},quiet:!0})),U=new Qe(e,a.standardVertexModel),ce=k.createPlane("ocean",n,l,32),ue=U.build(ce),de=E(t,new M(null,"ocean")),le=E(s,new K(e,de,ue,se,2)),fe=k.createSphere("sphere",.5,32,32);U.build(fe),new x(e,e.TEXTURE_2D,1,e.RGBA8,256,256).bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR).unbind();const he=z(e,He),me=O(e,Xe),ve=new N(e,"unlitTexture",a.standardVertexModel,he,me),pe=E(h,new P(ve,{uniforms:{}})),B=E(t,new M(null,"buoy")),R=Ae();V(R,R,I(f.width,f.height)),V(R,R,I(1/n,1/l)),De(R,R,I(n/2,l/2));const H=new Ye(e,T,R,12,0,1,.5,7);B.addComponent(H);const Ee=E(t,new M(B,"body"));Ee.trs.translation[1]=-.15,this.inputSystem=v,this.nodes=t,this.drawers=s,this.cameras=o,this.materials=h,this.oceanDrawer=le,this.waveFramebuffer=T,this.waveMaterial=y,this.renderer=a,this.take=0,this.assetLoader=new J,this.buoyMaterial=pe,this.buoy=H,this.buoyFramebuffer=S,this.overlay=ae}update(e,a){this.take++,this.nodes.forEach(t=>t.preUpdate(e)),this.nodes.forEach(t=>t.update(this.take)),this.cameras.forEach(t=>t.update(this.take)),this.cameras.sort((t,o)=>t.order-o.order),this.drawers.sort((t,o)=>t.material.queue-o.material.queue),this.materials.forEach(t=>t.setUniformValues({iTime:a},!0))}render(){const e=this.renderer.gl,a=this.drawers;e.clearColor(0,0,0,1),e.clearDepth(1),e.depthMask(!0),e.enable(e.DEPTH_TEST),e.enable(e.CULL_FACE),e.depthFunc(e.LEQUAL),b(this.waveFramebuffer,e,t=>{const{width:o,height:s}=this.waveFramebuffer.size;e.viewport(0,0,o,s),this.waveMaterial.use(e),this.renderer.quadMesh.draw(e,0)}),b(this.buoyFramebuffer,e,t=>{const{width:o,height:s}=this.buoyFramebuffer.size;e.clearBufferfv(e.COLOR,0,[1,1,1,1]),e.clearBufferfv(e.DEPTH,0,[1]);for(const h of this.cameras){const u=o/s,i=h.prepare(u);e.viewport(0,0,o,s);for(let d=0;d<a.length;++d)a[d].layer===1&&a[d].draw(e,i)}}),b(this.renderer.framebuffer,e,t=>{e.clearBufferfv(e.DEPTH,0,[1]);for(const o of this.cameras){const s=e.drawingBufferWidth,h=e.drawingBufferHeight,u=s/h,i=o.prepare(u);e.viewport(0,0,s,h);for(let d=0;d<a.length;++d)a[d].layer===2&&a[d].draw(e,i)}this.overlay.use(e),this.renderer.quadMesh.draw(e,0)}),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),this.renderer.toneMap.use(e),this.renderer.quadMesh.draw(e,0),this.inputSystem.reset()}async loadResources(){const e=this.renderer.gl,a=this.nodes.find(i=>i.name==="buoy"),t=this.nodes.find(i=>i.parent===a),o=E(this.nodes,new M(t,"duck"));o.trs.scale=L(.3,.3,.3);const s=new URL("/Duck/Duck.gltf",window.location.toString()),h=await this.assetLoader.loadGltf(s.href),u=new Ze(this,o,e.STATIC_DRAW,this.buoyMaterial);Oe(h,u)}}class Ye{constructor(e,a,t,o,s,h,u,i){r(this,"iterations");r(this,"waveDrag");r(this,"waveHeight");r(this,"radius");r(this,"lastHeights");r(this,"lastRotations");r(this,"index");r(this,"updateCount");r(this,"framebuffer");r(this,"gl");r(this,"pos2Pixel");i=Math.max(1,i),o=Math.max(1,o);const d=0,v=G(),m=[d];m.length=i,m.fill(d);const n=[v];n.length=i,n.fill(v),this.iterations=o,this.waveDrag=s,this.waveHeight=h,this.radius=u,this.lastHeights=m,this.lastRotations=n,this.index=n.length-1,this.updateCount=0,this.framebuffer=a,this.gl=e,this.pos2Pixel=t}preUpdate(e,a){let t=I(-this.radius,-this.radius),o=I(this.radius,this.radius);t=W(j(),t,this.pos2Pixel),o=W(j(),o,this.pos2Pixel),t[0]=Math.round(t[0]),t[1]=Math.round(t[1]),o[0]=Math.round(o[0]),o[1]=Math.round(o[1]);const s=t[0],h=t[1],u=o[0]-t[0]+1,i=o[1]-t[1]+1,d=4,v=new Float32Array(u*i*d);b(this.framebuffer,this.gl,w=>{w.readPixels(s,h,u,i,this.gl.RGBA,this.gl.FLOAT,v)});const m=Math.floor(u/2),n=Math.floor(i/2),f=[u*n+m,u*n+0,u*n+u-1,u*(i-1)+m,u*0+m].map(w=>v[w*d]).map(w=>Ke(-this.waveHeight,0,w)),T=L(0,1,0),_=q(Q(),L(0,f[4]-f[3],this.radius*2),L(this.radius*2,f[2]-f[1],0));$(_,_);const p=q(Q(),T,_),y=Math.asin(Ne(p)),S=G();Math.abs(y)>.001&&($(p,p),Pe(S,p,y)),this.lastHeights.push(f[0]),this.lastHeights.shift(),this.lastRotations.push(S),this.lastRotations.shift(),e.trs.translation[1]=this.lastHeights[this.index],e.trs.rotation.setQuat(this.lastRotations[this.index]),this.updateCount++,this.updateCount%3===0&&(this.index=Math.max(0,this.index-1))}}class Je{constructor(e){r(this,"callbackId");r(this,"callback");r(this,"uptime");r(this,"lastElapse");this.callback=e,this.callbackId=0,this.uptime=0,this.lastElapse=0}start(e=!1){if(this.callbackId!==0)return!1;let a;const t=o=>{o/=1e3;const s=a?o-a:this.lastElapse;a=o,this.lastElapse=s,this.uptime+=s,this.callback(s,this.uptime)&&!e?this.callbackId=requestAnimationFrame(t):this.callbackId=0};return this.callbackId=requestAnimationFrame(t),!0}stop(){return this.callbackId===0?!1:(cancelAnimationFrame(this.callbackId),this.callbackId=0,!0)}playing(){return this.callbackId!=0}}function Ke(c,e,a){return c+(e-c)*a}class Ze extends Ie{constructor(a,t,o,s){super(a.renderer.gl,s.program,t,o);r(this,"ocean");r(this,"standardMaterial");this.ocean=a,this.standardMaterial=s}finish(){this.ocean.nodes=this.ocean.nodes.concat(this.nodes),super.finish()}linkNodeMesh(a,t,o,s){super.linkNodeMesh(a,t,o,s),this.ocean.drawers.push(new K(this.ocean.renderer.gl,this.nodes[a],this.meshes[t],this.standardMaterial))}}try{let c=function(n){n.preventDefault(),i.inputSystem.scroll(n.deltaY)};const e=document.querySelector("main canvas");if(!e)throw new Error("cannot find the canvas");_e(e,1024);const a=Re(e),t=document.querySelector(".inspector"),o=t==null?void 0:t.querySelector("input#floatingDrag"),s=t==null?void 0:t.querySelectorAll("input.material-property"),h=new J,u=new je(a),i=new $e(a,u),d=new Je((n,l)=>(i.update(n,l),i.render(),!0)),v=new xe(n=>{switch(n.touchDrags.length){case 1:{const l=n.touchDrags[0];i.inputSystem.drag(l.delta[0],l.delta[1]);break}case 2:{const l=n.touchDrags[0],f=n.touchDrags[1],T=C(l.currentPos,l.delta),_=C(f.currentPos,f.delta),p=X(C(T,_)),y=X(C(l.currentPos,f.currentPos));i.inputSystem.scroll(p-y);break}}}),m=new ye(n=>{i.inputSystem.drag(n.delta[0],n.delta[1])});e.addEventListener("wheel",c,{passive:!1}),e.addEventListener("mousedown",n=>m.mouseDown(n)),document.addEventListener("mousemove",n=>m.mouseMove(n)),document.addEventListener("mouseup",n=>m.mouseUp(n)),e.addEventListener("touchstart",n=>v.touchStart(n)),document.addEventListener("touchend",n=>v.touchEnd(n)),document.addEventListener("touchmove",n=>v.touchMove(n));for(const n of s||[])i.oceanDrawer.material.setUniformValues({[n.id]:Number(n.value)},!0),i.waveMaterial.setUniformValues({[n.id]:Number(n.value)},!0),i.buoy[n.id]=Number(n.value),n.addEventListener("input",l=>{i.oceanDrawer.material.setUniformValues({[n.id]:Number(n.value)},!0),i.waveMaterial.setUniformValues({[n.id]:Number(n.value)},!0),i.buoy[n.id]=Number(n.value)});d.start(),i.loadResources()}catch(c){const e=document.body,a=qe(c).message,t=document.createElement("pre");t.classList.add("error"),t.append(a),e.prepend(t)}
