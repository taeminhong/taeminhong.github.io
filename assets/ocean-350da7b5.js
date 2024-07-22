var _e=Object.defineProperty;var Re=(n,e,t)=>e in n?_e(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var a=(n,e,t)=>(Re(n,typeof e!="symbol"?e+"":e,t),t);import"./modulepreload-polyfill-3cfb730f.js";/* empty css             */import{A as K,P as xe,S as ye,f as Me,T as y,F as U,t as O,a as N,M as P,N as x,d as I,u as b,v as z,k,m as Z,D as G,E as C,H as be,x as W,I as j,J as $,K as Q,L as q,O as Y,Q as Se,R as De,B as Ae,h as L,c as B,i as ge,b as ee,V as Oe,j as Ne,C as Pe,G as J,s as F,q as Ie,r as Ce,l as Le}from"./fullscreen-quad-3f071188.js";import{l as Fe}from"./gltf-loader-6887a6d6.js";var Ue=`#version 300 es

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
}`,ke=`#version 300 es

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
}`,Be=`#version 300 es

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
}`,He=`#version 300 es

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
}`,Ve=`#version 300 es

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
}`,Xe=`#version 300 es

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
}`,ze=`#version 300 es

precision highp float;

in vec2 v_texCoord;

out vec4 f_color;

uniform sampler2D colorMap;
uniform sampler2D depthMap;

void main()
{
    f_color = texture(colorMap, v_texCoord);
    gl_FragDepth = texture(depthMap, v_texCoord).r;
}`;function Ge(n,e,t){const r=Le(Z(),e);n.setUniformValues({model:e,inverseTranspose:r,view:t.view,proj:t.proj,viewPos:t.position,viewPosition:t.position,inverseView:t.inverseView,inverseProj:t.inverseProj,inverseViewProj:t.inverseViewProj},!0)}function We(n,e,t,r,o){Ge(o,t,r),o.use(n);for(let i=0;i<e.subMeshes.length;++i)e.draw(n,i)}class je{constructor(e,t){a(this,"material");a(this,"layer");this.material=e,this.layer=t}}class te extends je{constructor(t,r,o,i,l=1){super(i,l);a(this,"mesh");a(this,"node");this.node=r,this.mesh=o}draw(t,r){var i;const o=((i=this.node)==null?void 0:i.globalMatrix)??ge();We(t,this.mesh,o,r,this.material)}}function $e(n,e,t){const r=ee(n,e);return new B(n,r,t)}class Qe{constructor(e){a(this,"gl");a(this,"standardVertexModel");a(this,"quadMesh");a(this,"toneMap");a(this,"whiteTexture");a(this,"framebuffer");a(this,"vertexShaders");a(this,"fragmentShaders");a(this,"programs");const t=new Map,r=new Map,o=new Map,i=new Oe([{name:"POSITION",location:0},{name:"NORMAL",location:1},{name:"TEXCOORD_0",location:3},{name:"TEXCOORD_1",location:4},{name:"TEXCOORD_2",location:5}]),l=k.createQuad("quad"),c=$e(e,l,i),u=new ye(e,e.VERTEX_SHADER,Me);t.set("fullscreenQuad",u);const d=new y(e,e.TEXTURE_2D,1,e.RGBA8,32,32),f=new Uint8Array(32*32*4);for(let T=0;T<f.length;++T)f[T]=255;d.bind(e).subImage2D(e.TEXTURE_2D,0,0,0,32,32,e.RGBA,e.UNSIGNED_BYTE,f).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST);const s=new U(e,e.FRAMEBUFFER),h=new y(e,e.TEXTURE_2D,1,e.RGBA16F,e.drawingBufferWidth,e.drawingBufferHeight);h.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind();const p=new y(e,e.TEXTURE_2D,1,e.DEPTH24_STENCIL8,e.drawingBufferWidth,e.drawingBufferHeight);p.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),s.bind(e).texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,h,0).texture2D(e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,p,0).drawBuffers(e.COLOR_ATTACHMENT0).unbind();const v=O(e,Xe),w=new N(e,"aces",i,u,v),S=new P(e,w,{name:"toneMap",uniforms:{hdrBuffer:h},quiet:!0});this.gl=e,this.standardVertexModel=i,this.quadMesh=c,this.toneMap=S,this.framebuffer=s,this.whiteTexture=d,this.fragmentShaders=r,this.vertexShaders=t,this.programs=o}}function m(n,e){return n.push(e),e}class qe{constructor(){a(this,"scrollDelta");a(this,"dragging");a(this,"dragDelta");this.scrollDelta=0,this.dragging=!1,this.dragDelta=[0,0]}reset(){this.scrollDelta=0,this.dragDelta[0]=0,this.dragDelta[1]=0}scroll(e){this.scrollDelta+=e}startDrag(){this.dragging=!0}endDrag(){this.dragging=!1}drag(e,t){this.dragging&&(this.dragDelta[0]+=e,this.dragDelta[1]+=t)}}class Ye{constructor(e,t,r){a(this,"rotator");a(this,"translator");a(this,"inputSystem");this.rotator=e,this.translator=t,this.inputSystem=r}preUpdate(e,t,r){const i=this.rotator.trs.rotation;i[0]-=this.inputSystem.dragDelta[1]*.5,i[1]-=this.inputSystem.dragDelta[0]*.5;const l=.1,c=this.translator.trs.translation;c[2]=Ne(c[2]+this.inputSystem.scrollDelta*l,3,50)}}function Je(){const n=document.querySelector("main canvas");if(!n)throw new Error("cannot find the canvas");const e=n.getContext("webgl2");if(!e)throw new Error("This browser does not support WebGL2");let t=e;for(const r of["EXT_color_buffer_float","OES_texture_float_linear"])if(!t.getExtension(r))throw new Error(`This browser does not support extension: ${r}`);return n.width=n.clientWidth,n.height=n.clientHeight,t}function Ke(n){return n instanceof Error?n:new Error(String(n))}class Ze{constructor(e,t){this.gl=e,this.vertexModel=t}build(e){return new B(this.gl,ee(this.gl,e),this.vertexModel)}}class et{constructor(e,t){a(this,"nodes");a(this,"cameras");a(this,"drawers");a(this,"materials");a(this,"indirectLightMaterial");a(this,"oceanDrawer");a(this,"waveFramebuffer");a(this,"waveMaterial");a(this,"take");a(this,"renderer");a(this,"inputSystem");a(this,"assetLoader");a(this,"buoyMaterial");a(this,"buoyFramebuffer");a(this,"buoy");a(this,"overlay");const r=[],o=[],i=[],l=[],c=m(r,new x(null,"center")),u=m(r,new x(c,"camera")),d=new Ie(Ce.deg(45),.1,1e3);m(o,new Pe(u,0,d));const f=new qe;u.trs.translation[2]=5,c.trs.rotation=I(-12,0,0),c.addComponent(new Ye(c,u,f));const s=t.vertexShaders.get("fullscreenQuad");if(!s)throw new Error("Vertex shader not found: fullscreenQuad");const h=7,p=7,v=new y(e,e.TEXTURE_2D,1,e.R16F,256,256);v.bind(e).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR).unbind();const w=new U(e,e.FRAMEBUFFER);b(w,e,A=>{A.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,v,0).drawBuffers(e.COLOR_ATTACHMENT0).checkStatus(g=>{if(g!==e.FRAMEBUFFER_COMPLETE)throw new J(e,g||e.getError())})});const S=O(e,Ve),T=new N(e,"wave",t.standardVertexModel,s,S),M=m(l,new P(e,T,{uniforms:{texSize:[v.width,v.height],ST:[h,p,-h*.5,-p*.5]}})),D=new U(e,e.FRAMEBUFFER),_=new y(e,e.TEXTURE_2D,1,e.RGBA16F,e.drawingBufferWidth,e.drawingBufferHeight);_.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind();const E=new y(e,e.TEXTURE_2D,1,e.DEPTH_COMPONENT32F,e.drawingBufferWidth,e.drawingBufferHeight);E.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),b(D,e,A=>{A.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,_,0),A.texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,E,0),A.checkStatus(g=>{if(g!==e.FRAMEBUFFER_COMPLETE)throw new J(e,g||e.getError())})});const re=O(e,ze),ae=new N(e,"overlay",t.standardVertexModel,s,re),oe=m(l,new P(e,ae,{uniforms:{colorMap:_,depthMap:E}})),ie=z(e,Ue),se=O(e,ke),ce=new N(e,"ocean",t.standardVertexModel,ie,se),ue=m(l,new P(e,ce,{uniforms:{heightMap:v,heightMapSize:[v.width,v.height],ST:[h,p,-h*.5,-p*.5],objectColorMap:_,objectDepthMap:E,maxReflectionDistance:.5,maxScatteringDistance:.5,waveDrag:.24},quiet:!0})),H=new Ze(e,t.standardVertexModel),de=k.createPlane("ocean",h,p,32),le=H.build(de),he=m(r,new x(null,"ocean")),fe=m(i,new te(e,he,le,ue,2)),pe=k.createSphere("sphere",.5,32,32);H.build(pe),new y(e,e.TEXTURE_2D,1,e.RGBA8,256,256).bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR).unbind();const me=z(e,Be),ve=O(e,He),we=new N(e,"unlitTexture",t.standardVertexModel,me,ve),Ee=m(l,new P(e,we,{uniforms:{}})),V=m(r,new x(null,"buoy")),R=Z();G(R,R,C(v.width,v.height)),G(R,R,C(1/h,1/p)),be(R,R,C(h/2,p/2));const X=new tt(e,w,R,12,0,1,.5,7);V.addComponent(X);const Te=m(r,new x(V,"body"));Te.trs.translation[1]=-.15,this.inputSystem=f,this.nodes=r,this.drawers=i,this.cameras=o,this.materials=l,this.oceanDrawer=fe,this.waveFramebuffer=w,this.waveMaterial=M,this.renderer=t,this.take=0,this.assetLoader=new K,this.buoyMaterial=Ee,this.buoy=X,this.buoyFramebuffer=D,this.overlay=oe}update(e,t){this.take++,this.nodes.forEach(r=>r.preUpdate(e,t)),this.nodes.forEach(r=>r.update(this.take)),this.cameras.forEach(r=>r.update(this.take)),this.cameras.sort((r,o)=>r.order-o.order),this.drawers.sort((r,o)=>r.material.queue-o.material.queue),this.materials.forEach(r=>r.setUniformValues({iTime:t},!0))}render(){const e=this.renderer.gl,t=this.drawers;e.clearColor(0,0,0,1),e.clearDepth(1),e.depthMask(!0),e.enable(e.DEPTH_TEST),e.enable(e.CULL_FACE),e.depthFunc(e.LEQUAL),b(this.waveFramebuffer,e,r=>{const{width:o,height:i}=this.waveFramebuffer.size;e.viewport(0,0,o,i),this.waveMaterial.use(e),this.renderer.quadMesh.draw(e,0)}),b(this.buoyFramebuffer,e,r=>{const{width:o,height:i}=this.buoyFramebuffer.size;e.clearBufferfv(e.COLOR,0,[1,1,1,1]),e.clearBufferfv(e.DEPTH,0,[1]);for(const l of this.cameras){const c=o/i,u=l.prepare(c);e.viewport(0,0,o,i);for(let d=0;d<t.length;++d)t[d].layer===1&&t[d].draw(e,u)}}),b(this.renderer.framebuffer,e,r=>{e.clearBufferfv(e.DEPTH,0,[1]);for(const o of this.cameras){const i=e.drawingBufferWidth,l=e.drawingBufferHeight,c=i/l,u=o.prepare(c);e.viewport(0,0,i,l);for(let d=0;d<t.length;++d)t[d].layer===2&&t[d].draw(e,u)}this.overlay.use(e),this.renderer.quadMesh.draw(e,0)}),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),this.renderer.toneMap.use(e),this.renderer.quadMesh.draw(e,0),this.inputSystem.reset()}async loadResources(){const e=this.renderer.gl,t=this.nodes.find(u=>u.name==="buoy"),r=this.nodes.find(u=>u.parent===t),o=m(this.nodes,new x(r,"duck"));o.trs.scale=I(.3,.3,.3);const i=new URL("/Duck.gltf",window.location.toString()),l=await this.assetLoader.loadGltf(i.href),c=new at(this,o,e.STATIC_DRAW,this.buoyMaterial);Fe(l,c)}}class tt{constructor(e,t,r,o,i,l,c,u){a(this,"iterations");a(this,"waveDrag");a(this,"waveHeight");a(this,"radius");a(this,"lastHeights");a(this,"lastRotations");a(this,"index");a(this,"updateCount");a(this,"framebuffer");a(this,"gl");a(this,"pos2Pixel");u=Math.max(1,u),o=Math.max(1,o);const d=0,f=W(),s=[d];s.length=u,s.fill(d);const h=[f];h.length=u,h.fill(f),this.iterations=o,this.waveDrag=i,this.waveHeight=l,this.radius=c,this.lastHeights=s,this.lastRotations=h,this.index=h.length-1,this.updateCount=0,this.framebuffer=t,this.gl=e,this.pos2Pixel=r}preUpdate(e,t,r){let o=C(-this.radius,-this.radius),i=C(this.radius,this.radius);o=j($(),o,this.pos2Pixel),i=j($(),i,this.pos2Pixel),o[0]=Math.round(o[0]),o[1]=Math.round(o[1]),i[0]=Math.round(i[0]),i[1]=Math.round(i[1]);const l=o[0],c=o[1],u=i[0]-o[0]+1,d=i[1]-o[1]+1,f=4,s=new Float32Array(u*d*f);b(this.framebuffer,this.gl,E=>{E.readPixels(l,c,u,d,this.gl.RGBA,this.gl.FLOAT,s)});const h=Math.floor(u/2),p=Math.floor(d/2),w=[u*p+h,u*p+0,u*p+u-1,u*(d-1)+h,u*0+h].map(E=>s[E*f]).map(E=>rt(-this.waveHeight,0,E)),S=I(0,1,0),T=Q(q(),I(0,w[4]-w[3],this.radius*2),I(this.radius*2,w[2]-w[1],0));Y(T,T);const M=Q(q(),S,T),D=Math.asin(Se(M)),_=W();Math.abs(D)>.001&&(Y(M,M),De(_,M,D)),this.lastHeights.push(w[0]),this.lastHeights.shift(),this.lastRotations.push(_),this.lastRotations.shift(),e.trs.translation[1]=this.lastHeights[this.index],e.trs.rotation=ne(this.lastRotations[this.index]),this.updateCount++,this.updateCount%3===0&&(this.index=Math.max(0,this.index-1))}}function ne(n){const e=2*(n[3]*n[0]+n[1]*n[2]),t=1-2*(n[0]*n[0]+n[1]*n[1]),r=F(Math.atan2(e,t)),o=Math.sqrt(1+2*(n[3]*n[1]-n[0]*n[2])),i=Math.sqrt(1-2*(n[3]*n[1]-n[0]*n[2])),l=F(2*Math.atan2(o,i)-Math.PI/2),c=2*(n[3]*n[2]+n[0]*n[1]),u=1-2*(n[1]*n[1]+n[2]*n[2]),d=F(Math.atan2(c,u));return[r,l,d]}class nt{constructor(e){a(this,"callbackId");a(this,"callback");a(this,"uptime");a(this,"lastElapse");this.callback=e,this.callbackId=0,this.uptime=0,this.lastElapse=0}start(e=!1){if(this.callbackId!==0)return!1;let t;const r=o=>{o/=1e3;const i=t?o-t:this.lastElapse;t=o,this.lastElapse=i,this.uptime+=i,this.callback(i,this.uptime)&&!e?this.callbackId=requestAnimationFrame(r):this.callbackId=0};return this.callbackId=requestAnimationFrame(r),!0}stop(){return this.callbackId===0?!1:(cancelAnimationFrame(this.callbackId),this.callbackId=0,!0)}playing(){return this.callbackId!=0}}function rt(n,e,t){return n+(e-n)*t}class at{constructor(e,t,r,o){a(this,"ocean");a(this,"standardMaterial");a(this,"usage");a(this,"root");this.ocean=e,this.standardMaterial=o,this.root=t,this.usage=r}addBufferObject(e,t){const r=new Ae(this.ocean.renderer.gl,e);return r.bind(this.ocean.renderer.gl).data(t,this.usage),r}addNode(e){return m(this.ocean.nodes,new x(this.root,e))}setParentNode(e,t){e.parent=t}setScale(e,t){L(e.trs.scale,t)}setRotation(e,t){L(e.trs.rotation,ne(t))}setTranslation(e,t){L(e.trs.translation,t)}addMesh(e,t,r,o){const i={name:e,attributes:r,drawMode:t,indices:o};return new B(this.ocean.renderer.gl,i,this.ocean.renderer.standardVertexModel)}linkNodeMesh(e,t){this.ocean.drawers.push(new te(this.ocean.renderer.gl,e,t,this.standardMaterial))}}try{let n=function(s){s.preventDefault(),c.inputSystem.scroll(s.deltaY),d.start(!0)};const e=Je(),t=document.querySelector(".inspector"),r=t==null?void 0:t.querySelector("input#floatingDrag"),o=t==null?void 0:t.querySelectorAll("input.material-property"),i=new K,l=new Qe(e),c=new et(e,l),u=e.canvas,d=new nt((s,h)=>(c.update(s,h),c.render(),!0)),f=new xe(s=>{s.done?c.inputSystem.endDrag():(s.count===0&&c.inputSystem.startDrag(),c.inputSystem.drag(s.delta[0],s.delta[1])),d.start(!0)});u.addEventListener("wheel",n,{passive:!1}),u.addEventListener("pointerdown",s=>f.pointerDown(s)),document.addEventListener("pointermove",s=>f.pointerMove(s)),document.addEventListener("pointerup",s=>f.pointerUp(s));for(const s of o||[])c.oceanDrawer.material.setUniformValues({[s.id]:Number(s.value)},!0),c.waveMaterial.setUniformValues({[s.id]:Number(s.value)},!0),c.buoy[s.id]=Number(s.value),s.addEventListener("input",h=>{c.oceanDrawer.material.setUniformValues({[s.id]:Number(s.value)},!0),c.waveMaterial.setUniformValues({[s.id]:Number(s.value)},!0),c.buoy[s.id]=Number(s.value),d.start(!0)});d.start(),c.loadResources()}catch(n){const e=document.body,t=Ke(n).message,r=document.createElement("pre");r.classList.add("error"),r.append(t),e.prepend(r)}
