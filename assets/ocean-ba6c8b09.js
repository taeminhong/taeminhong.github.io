var ye=Object.defineProperty;var Me=(a,e,t)=>e in a?ye(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var s=(a,e,t)=>(Me(a,typeof e!="symbol"?e+"":e,t),t);import"./modulepreload-polyfill-3cfb730f.js";/* empty css             */import{r as xe,i as be,A as ee,T as Se,x as L,y as G,M as De,S as Ae,f as Oe,b,F as k,z as N,P,a as I,N as x,e as g,u as S,D as W,m as B,p as te,L as j,O as C,Q as Ne,H as Q,R as $,U as q,W as Y,X as Z,Y as J,Z as Pe,_ as Ie,B as ge,j as F,d as H,k as Ce,c as ne,V as Le,l as Fe,C as Ue,I as ke,G as K,w as U,t as Be,v as He,o as Ve}from"./fullscreen-quad-e8458005.js";import{l as Xe}from"./gltf-loader-4042f727.js";var ze=`#version 300 es

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
}`,Ge=`#version 300 es

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
}`,We=`#version 300 es

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
}`,je=`#version 300 es

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
}`,Qe=`#version 300 es

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
}`,$e=`#version 300 es

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
}`,qe=`#version 300 es

precision highp float;

in vec2 v_texCoord;

out vec4 f_color;

uniform sampler2D colorMap;
uniform sampler2D depthMap;

void main()
{
    f_color = texture(colorMap, v_texCoord);
    gl_FragDepth = texture(depthMap, v_texCoord).r;
}`;function Ye(a,e,t){const n=Ve(te(),e);a.setUniformValues({model:e,inverseTranspose:n,view:t.view,proj:t.proj,viewPos:t.position,viewPosition:t.position,inverseView:t.inverseView,inverseProj:t.inverseProj,inverseViewProj:t.inverseViewProj},!0)}function Ze(a,e,t,n,o){Ye(o,t,n),o.use(a);for(let i=0;i<e.subMeshes.length;++i)e.draw(a,i)}class Je{constructor(e,t){s(this,"material");s(this,"layer");this.material=e,this.layer=t}}class ae extends Je{constructor(t,n,o,i,d=1){super(i,d);s(this,"mesh");s(this,"node");this.node=n,this.mesh=o}draw(t,n){var i;const o=((i=this.node)==null?void 0:i.globalMatrix)??Ce();Ze(t,this.mesh,o,n,this.material)}}function Ke(a,e,t){const n=ne(a,e);return new H(a,n,t)}class et{constructor(e){s(this,"gl");s(this,"standardVertexModel");s(this,"quadMesh");s(this,"toneMap");s(this,"whiteTexture");s(this,"framebuffer");s(this,"vertexShaders");s(this,"fragmentShaders");s(this,"programs");const t=new Map,n=new Map,o=new Map,i=new Le([{name:"POSITION",location:0},{name:"NORMAL",location:1},{name:"TEXCOORD_0",location:3},{name:"TEXCOORD_1",location:4},{name:"TEXCOORD_2",location:5}]),d=B.createQuad("quad"),h=Ke(e,d,i),c=new Ae(e,e.VERTEX_SHADER,Oe);t.set("fullscreenQuad",c);const u=new b(e,e.TEXTURE_2D,1,e.RGBA8,32,32),m=new Uint8Array(32*32*4);for(let E=0;E<m.length;++E)m[E]=255;u.bind(e).subImage2D(e.TEXTURE_2D,0,0,0,32,32,e.RGBA,e.UNSIGNED_BYTE,m).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST);const f=new k(e,e.FRAMEBUFFER),r=new b(e,e.TEXTURE_2D,1,e.RGBA16F,e.drawingBufferWidth,e.drawingBufferHeight);r.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind();const l=new b(e,e.TEXTURE_2D,1,e.DEPTH24_STENCIL8,e.drawingBufferWidth,e.drawingBufferHeight);l.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),f.bind(e).texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,r,0).texture2D(e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,l,0).drawBuffers(e.COLOR_ATTACHMENT0).unbind();const p=N(e,$e),v=new P(e,"aces",i,c,p),R=new I(e,v,{name:"toneMap",uniforms:{hdrBuffer:r},quiet:!0});this.gl=e,this.standardVertexModel=i,this.quadMesh=h,this.toneMap=R,this.framebuffer=f,this.whiteTexture=u,this.fragmentShaders=n,this.vertexShaders=t,this.programs=o}}function w(a,e){return a.push(e),e}class tt{constructor(e,t,n){s(this,"rotator");s(this,"translator");s(this,"inputSystem");this.rotator=e,this.translator=t,this.inputSystem=n}preUpdate(e,t,n){const i=this.rotator.trs.rotation;i[0]-=this.inputSystem.dragDelta[1]*.5,i[1]-=this.inputSystem.dragDelta[0]*.5;const d=.1,h=this.translator.trs.translation;h[2]=Fe(h[2]+this.inputSystem.scrollDelta*d,3,50)}}function nt(a){return a instanceof Error?a:new Error(String(a))}class at{constructor(e,t){this.gl=e,this.vertexModel=t}build(e){return new H(this.gl,ne(this.gl,e),this.vertexModel)}}class rt{constructor(e,t){s(this,"nodes");s(this,"cameras");s(this,"drawers");s(this,"materials");s(this,"indirectLightMaterial");s(this,"oceanDrawer");s(this,"waveFramebuffer");s(this,"waveMaterial");s(this,"take");s(this,"renderer");s(this,"inputSystem");s(this,"assetLoader");s(this,"buoyMaterial");s(this,"buoyFramebuffer");s(this,"buoy");s(this,"overlay");const n=[],o=[],i=[],d=[],h=w(n,new x(null,"center")),c=w(n,new x(h,"camera")),u=new Be(He.deg(45),.1,1e3);w(o,new Ue(c,0,u));const m=new ke;c.trs.translation[2]=5,h.trs.rotation=g(-12,0,0),h.addComponent(new tt(h,c,m));const f=t.vertexShaders.get("fullscreenQuad");if(!f)throw new Error("Vertex shader not found: fullscreenQuad");const r=7,l=7,p=new b(e,e.TEXTURE_2D,1,e.R16F,256,256);p.bind(e).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR).unbind();const v=new k(e,e.FRAMEBUFFER);S(v,e,A=>{A.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,p,0).drawBuffers(e.COLOR_ATTACHMENT0).checkStatus(O=>{if(O!==e.FRAMEBUFFER_COMPLETE)throw new K(e,O||e.getError())})});const R=N(e,Qe),E=new P(e,"wave",t.standardVertexModel,f,R),_=w(d,new I(e,E,{uniforms:{texSize:[p.width,p.height],ST:[r,l,-r*.5,-l*.5]}})),D=new k(e,e.FRAMEBUFFER),y=new b(e,e.TEXTURE_2D,1,e.RGBA16F,e.drawingBufferWidth,e.drawingBufferHeight);y.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind();const T=new b(e,e.TEXTURE_2D,1,e.DEPTH_COMPONENT32F,e.drawingBufferWidth,e.drawingBufferHeight);T.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.NEAREST).parameteri(e.TEXTURE_MAG_FILTER,e.NEAREST).parameteri(e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE).parameteri(e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE).unbind(),S(D,e,A=>{A.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_2D,y,0),A.texture2D(e.DEPTH_ATTACHMENT,e.TEXTURE_2D,T,0),A.checkStatus(O=>{if(O!==e.FRAMEBUFFER_COMPLETE)throw new K(e,O||e.getError())})});const oe=N(e,qe),se=new P(e,"overlay",t.standardVertexModel,f,oe),ie=w(d,new I(e,se,{uniforms:{colorMap:y,depthMap:T}})),ce=W(e,ze),ue=N(e,Ge),de=new P(e,"ocean",t.standardVertexModel,ce,ue),le=w(d,new I(e,de,{uniforms:{heightMap:p,heightMapSize:[p.width,p.height],ST:[r,l,-r*.5,-l*.5],objectColorMap:y,objectDepthMap:T,maxReflectionDistance:.5,maxScatteringDistance:.5,waveDrag:.24},quiet:!0})),V=new at(e,t.standardVertexModel),he=B.createPlane("ocean",r,l,32),fe=V.build(he),me=w(n,new x(null,"ocean")),pe=w(i,new ae(e,me,fe,le,2)),ve=B.createSphere("sphere",.5,32,32);V.build(ve),new b(e,e.TEXTURE_2D,1,e.RGBA8,256,256).bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR).unbind();const we=W(e,We),Ee=N(e,je),Te=new P(e,"unlitTexture",t.standardVertexModel,we,Ee),_e=w(d,new I(e,Te,{uniforms:{}})),X=w(n,new x(null,"buoy")),M=te();j(M,M,C(p.width,p.height)),j(M,M,C(1/r,1/l)),Ne(M,M,C(r/2,l/2));const z=new ot(e,v,M,12,0,1,.5,7);X.addComponent(z);const Re=w(n,new x(X,"body"));Re.trs.translation[1]=-.15,this.inputSystem=m,this.nodes=n,this.drawers=i,this.cameras=o,this.materials=d,this.oceanDrawer=pe,this.waveFramebuffer=v,this.waveMaterial=_,this.renderer=t,this.take=0,this.assetLoader=new ee,this.buoyMaterial=_e,this.buoy=z,this.buoyFramebuffer=D,this.overlay=ie}update(e,t){this.take++,this.nodes.forEach(n=>n.preUpdate(e,t)),this.nodes.forEach(n=>n.update(this.take)),this.cameras.forEach(n=>n.update(this.take)),this.cameras.sort((n,o)=>n.order-o.order),this.drawers.sort((n,o)=>n.material.queue-o.material.queue),this.materials.forEach(n=>n.setUniformValues({iTime:t},!0))}render(){const e=this.renderer.gl,t=this.drawers;e.clearColor(0,0,0,1),e.clearDepth(1),e.depthMask(!0),e.enable(e.DEPTH_TEST),e.enable(e.CULL_FACE),e.depthFunc(e.LEQUAL),S(this.waveFramebuffer,e,n=>{const{width:o,height:i}=this.waveFramebuffer.size;e.viewport(0,0,o,i),this.waveMaterial.use(e),this.renderer.quadMesh.draw(e,0)}),S(this.buoyFramebuffer,e,n=>{const{width:o,height:i}=this.buoyFramebuffer.size;e.clearBufferfv(e.COLOR,0,[1,1,1,1]),e.clearBufferfv(e.DEPTH,0,[1]);for(const d of this.cameras){const h=o/i,c=d.prepare(h);e.viewport(0,0,o,i);for(let u=0;u<t.length;++u)t[u].layer===1&&t[u].draw(e,c)}}),S(this.renderer.framebuffer,e,n=>{e.clearBufferfv(e.DEPTH,0,[1]);for(const o of this.cameras){const i=e.drawingBufferWidth,d=e.drawingBufferHeight,h=i/d,c=o.prepare(h);e.viewport(0,0,i,d);for(let u=0;u<t.length;++u)t[u].layer===2&&t[u].draw(e,c)}this.overlay.use(e),this.renderer.quadMesh.draw(e,0)}),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),this.renderer.toneMap.use(e),this.renderer.quadMesh.draw(e,0),this.inputSystem.reset()}async loadResources(){const e=this.renderer.gl,t=this.nodes.find(c=>c.name==="buoy"),n=this.nodes.find(c=>c.parent===t),o=w(this.nodes,new x(n,"duck"));o.trs.scale=g(.3,.3,.3);const i=new URL("/Duck.gltf",window.location.toString()),d=await this.assetLoader.loadGltf(i.href),h=new ct(this,o,e.STATIC_DRAW,this.buoyMaterial);Xe(d,h)}}class ot{constructor(e,t,n,o,i,d,h,c){s(this,"iterations");s(this,"waveDrag");s(this,"waveHeight");s(this,"radius");s(this,"lastHeights");s(this,"lastRotations");s(this,"index");s(this,"updateCount");s(this,"framebuffer");s(this,"gl");s(this,"pos2Pixel");c=Math.max(1,c),o=Math.max(1,o);const u=0,m=Q(),f=[u];f.length=c,f.fill(u);const r=[m];r.length=c,r.fill(m),this.iterations=o,this.waveDrag=i,this.waveHeight=d,this.radius=h,this.lastHeights=f,this.lastRotations=r,this.index=r.length-1,this.updateCount=0,this.framebuffer=t,this.gl=e,this.pos2Pixel=n}preUpdate(e,t,n){let o=C(-this.radius,-this.radius),i=C(this.radius,this.radius);o=$(q(),o,this.pos2Pixel),i=$(q(),i,this.pos2Pixel),o[0]=Math.round(o[0]),o[1]=Math.round(o[1]),i[0]=Math.round(i[0]),i[1]=Math.round(i[1]);const d=o[0],h=o[1],c=i[0]-o[0]+1,u=i[1]-o[1]+1,m=4,f=new Float32Array(c*u*m);S(this.framebuffer,this.gl,T=>{T.readPixels(d,h,c,u,this.gl.RGBA,this.gl.FLOAT,f)});const r=Math.floor(c/2),l=Math.floor(u/2),v=[c*l+r,c*l+0,c*l+c-1,c*(u-1)+r,c*0+r].map(T=>f[T*m]).map(T=>it(-this.waveHeight,0,T)),R=g(0,1,0),E=Y(Z(),g(0,v[4]-v[3],this.radius*2),g(this.radius*2,v[2]-v[1],0));J(E,E);const _=Y(Z(),R,E),D=Math.asin(Pe(_)),y=Q();Math.abs(D)>.001&&(J(_,_),Ie(y,_,D)),this.lastHeights.push(v[0]),this.lastHeights.shift(),this.lastRotations.push(y),this.lastRotations.shift(),e.trs.translation[1]=this.lastHeights[this.index],e.trs.rotation=re(this.lastRotations[this.index]),this.updateCount++,this.updateCount%3===0&&(this.index=Math.max(0,this.index-1))}}function re(a){const e=2*(a[3]*a[0]+a[1]*a[2]),t=1-2*(a[0]*a[0]+a[1]*a[1]),n=U(Math.atan2(e,t)),o=Math.sqrt(1+2*(a[3]*a[1]-a[0]*a[2])),i=Math.sqrt(1-2*(a[3]*a[1]-a[0]*a[2])),d=U(2*Math.atan2(o,i)-Math.PI/2),h=2*(a[3]*a[2]+a[0]*a[1]),c=1-2*(a[1]*a[1]+a[2]*a[2]),u=U(Math.atan2(h,c));return[n,d,u]}class st{constructor(e){s(this,"callbackId");s(this,"callback");s(this,"uptime");s(this,"lastElapse");this.callback=e,this.callbackId=0,this.uptime=0,this.lastElapse=0}start(e=!1){if(this.callbackId!==0)return!1;let t;const n=o=>{o/=1e3;const i=t?o-t:this.lastElapse;t=o,this.lastElapse=i,this.uptime+=i,this.callback(i,this.uptime)&&!e?this.callbackId=requestAnimationFrame(n):this.callbackId=0};return this.callbackId=requestAnimationFrame(n),!0}stop(){return this.callbackId===0?!1:(cancelAnimationFrame(this.callbackId),this.callbackId=0,!0)}playing(){return this.callbackId!=0}}function it(a,e,t){return a+(e-a)*t}class ct{constructor(e,t,n,o){s(this,"ocean");s(this,"standardMaterial");s(this,"usage");s(this,"root");this.ocean=e,this.standardMaterial=o,this.root=t,this.usage=n}addBufferObject(e,t){const n=new ge(this.ocean.renderer.gl,e);return n.bind(this.ocean.renderer.gl).data(t,this.usage),n}addNode(e){return w(this.ocean.nodes,new x(this.root,e))}setParentNode(e,t){e.parent=t}setScale(e,t){F(e.trs.scale,t)}setRotation(e,t){F(e.trs.rotation,re(t))}setTranslation(e,t){F(e.trs.translation,t)}addMesh(e,t,n,o){const i={name:e,attributes:n,drawMode:t,indices:o};return new H(this.ocean.renderer.gl,i,this.ocean.renderer.standardVertexModel)}linkNodeMesh(e,t){this.ocean.drawers.push(new ae(this.ocean.renderer.gl,e,t,this.standardMaterial))}}try{let a=function(r){r.preventDefault(),c.inputSystem.scroll(r.deltaY)};const e=document.querySelector("main canvas");if(!e)throw new Error("cannot find the canvas");xe(e,1024);const t=be(e),n=document.querySelector(".inspector"),o=n==null?void 0:n.querySelector("input#floatingDrag"),i=n==null?void 0:n.querySelectorAll("input.material-property"),d=new ee,h=new et(t),c=new rt(t,h),u=new st((r,l)=>(c.update(r,l),c.render(),!0)),m=new Se(r=>{switch(r.touchDrags.length){case 1:{const l=r.touchDrags[0];c.inputSystem.drag(l.delta[0],l.delta[1]);break}case 2:{const l=r.touchDrags[0],p=r.touchDrags[1],v=L(l.currentPos,l.delta),R=L(p.currentPos,p.delta),E=G(L(v,R)),_=G(L(l.currentPos,p.currentPos));c.inputSystem.scroll(E-_);break}}}),f=new De(r=>{c.inputSystem.drag(r.delta[0],r.delta[1])});e.addEventListener("wheel",a,{passive:!1}),e.addEventListener("mousedown",r=>f.mouseDown(r)),document.addEventListener("mousemove",r=>f.mouseMove(r)),document.addEventListener("mouseup",r=>f.mouseUp(r)),e.addEventListener("touchstart",r=>m.touchStart(r)),document.addEventListener("touchend",r=>m.touchEnd(r)),document.addEventListener("touchmove",r=>m.touchMove(r));for(const r of i||[])c.oceanDrawer.material.setUniformValues({[r.id]:Number(r.value)},!0),c.waveMaterial.setUniformValues({[r.id]:Number(r.value)},!0),c.buoy[r.id]=Number(r.value),r.addEventListener("input",l=>{c.oceanDrawer.material.setUniformValues({[r.id]:Number(r.value)},!0),c.waveMaterial.setUniformValues({[r.id]:Number(r.value)},!0),c.buoy[r.id]=Number(r.value)});u.start(),c.loadResources()}catch(a){const e=document.body,t=nt(a).message,n=document.createElement("pre");n.classList.add("error"),n.append(t),e.prepend(n)}
