var M=Object.defineProperty;var F=(e,t,n)=>t in e?M(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var a=(e,t,n)=>(F(e,typeof t!="symbol"?t+"":t,n),n);import{w as p,x as h,y as b,z as O,m as I,D as P,F as N,u as d,G as A,T as l}from"./fullscreen-quad-a49f2f71.js";function R(){return[p(h(),h(),Math.PI/2),p(h(),h(),-Math.PI/2),b(h(),h(),-Math.PI/2),b(h(),h(),Math.PI/2),h(),p(h(),h(),Math.PI)].map(e=>{const t=O(I(),e);return P(t,t,[1,-1]),t})}class U{constructor(t,n,s){a(this,"width");a(this,"height");a(this,"framebuffer");a(this,"positionTexture");a(this,"normalTexture");a(this,"baseColorTexture");a(this,"metallicTexture");a(this,"depthTexture");function i(f,o,E){const _=new l(t,t.TEXTURE_2D,1,f,n,s);return _.bind(t).parameteri(t.TEXTURE_MIN_FILTER,t.NEAREST).parameteri(t.TEXTURE_MAG_FILTER,t.NEAREST).parameteri(t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE).parameteri(t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),_}const T=new N(t,t.FRAMEBUFFER),r={baseColor:i(t.RGBA8,t.RGBA,t.UNSIGNED_BYTE),metallic:i(t.RGBA8,t.RGBA,t.UNSIGNED_BYTE),position:i(t.RGBA16F,t.RGBA,t.FLOAT),normal:i(t.RGBA16F,t.RGBA,t.FLOAT),depth:i(t.DEPTH_COMPONENT32F,t.DEPTH_COMPONENT,t.FLOAT)};d(T,t,f=>{f.texture2D(t.COLOR_ATTACHMENT0,t.TEXTURE_2D,r.position,0).texture2D(t.COLOR_ATTACHMENT1,t.TEXTURE_2D,r.normal,0).texture2D(t.COLOR_ATTACHMENT2,t.TEXTURE_2D,r.baseColor,0).texture2D(t.COLOR_ATTACHMENT3,t.TEXTURE_2D,r.metallic,0).texture2D(t.DEPTH_ATTACHMENT,t.TEXTURE_2D,r.depth,0).checkStatus(o=>{if(o!=t.FRAMEBUFFER_COMPLETE)throw new A(t,o||t.getError())})}),this.width=n,this.height=s,this.framebuffer=T,this.positionTexture=r.position,this.normalTexture=r.normal,this.baseColorTexture=r.baseColor,this.metallicTexture=r.metallic,this.depthTexture=r.depth}bind(t){return this.framebuffer.bind(t).drawBuffers(t.COLOR_ATTACHMENT0,t.COLOR_ATTACHMENT1,t.COLOR_ATTACHMENT2,t.COLOR_ATTACHMENT3)}}class L{constructor(t,n){a(this,"binder");const s=n.bind(t);t.clearBufferfv(t.COLOR,0,[0,0,0,1]),this.binder=s}unbind(){this.binder.unbind()}startBlend(){const t=this.binder.gl;t.depthMask(!1),t.disable(t.DEPTH_TEST),t.blendFuncSeparate(t.ONE,t.ONE,t.ZERO,t.ONE),t.enable(t.BLEND)}endBlend(){const t=this.binder.gl;t.disable(t.BLEND),t.enable(t.DEPTH_TEST),t.depthMask(!0)}}class X{constructor(t,n){a(this,"width");a(this,"height");a(this,"colorTexture");a(this,"framebuffer");const s=new N(t,t.FRAMEBUFFER),i=new l(t,t.TEXTURE_2D,1,t.RGBA16F,n.width,n.height);i.bind(t).parameteri(t.TEXTURE_MIN_FILTER,t.NEAREST).parameteri(t.TEXTURE_MAG_FILTER,t.NEAREST).parameteri(t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE).parameteri(t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE).unbind(),d(s,t,T=>{T.texture2D(t.COLOR_ATTACHMENT0,t.TEXTURE_2D,i,0).texture2D(t.DEPTH_ATTACHMENT,t.TEXTURE_2D,n.depthTexture,0).checkStatus(r=>{if(r!=t.FRAMEBUFFER_COMPLETE)throw new A(t,r||t.getError())})}),this.width=n.width,this.height=n.height,this.framebuffer=s,this.colorTexture=i}bind(t){return new L(t,this.framebuffer)}}function B(e,t,n,s,i){const T=new l(e,e.TEXTURE_CUBE_MAP,1,e.RGBA16F,t,t);return T.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR),d(i,e,r=>{r.drawBuffers(e.COLOR_ATTACHMENT0).texture2D(e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,null,0);const f=R();for(let o=0;o<6;++o){r.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+o,T,0),e.clear(e.COLOR_BUFFER_BIT),e.viewport(0,0,t,t);const E={texMat:f[o]};n.setUniformValues(E),n.use(e),s.draw(e,0)}}),T}function w(e,t,n,s,i,T){t=Math.max(1,t),n=Math.max(0,n);const r=t+1+n,f=1<<r-1,o=new l(e,e.TEXTURE_CUBE_MAP,r,e.RGBA16F,f,f);return o.bind(e).parameteri(e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR).parameteri(e.TEXTURE_MAG_FILTER,e.LINEAR).generateMipmap(),d(T,e,E=>{E.drawBuffers(e.COLOR_ATTACHMENT0).texture2D(e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,null,0).texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X,o,t).checkStatus(c=>{if(c!=e.FRAMEBUFFER_COMPLETE)throw new A(e,c||e.getError())});const _=R();for(let c=0;c<=t;++c){const u=c/t,m=f/(1<<c);for(let v=0;v<6;++v){E.texture2D(e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+v,o,c),e.viewport(0,0,m,m);const C={roughness:u,texMat:_[v]};s.setUniformValues(C),s.use(e),i.draw(e,0)}}}),o}function x(e,t,n=0){return e.filter((s,i)=>(i-n)%t===0)}class D{constructor(t,n,s){a(this,"gl");a(this,"framebufferBinder");a(this,"renderTexture");a(this,"colorAttachments");a(this,"depthAttachment");const i=n.framebuffer,T=n.colorAttachments,r=n.depthAttachment,f=i.bind(t);for(let o=0;o<T.length;++o)f.texture2D(t.COLOR_ATTACHMENT0+o,s,T[o],0);r&&f.texture2D(t.DEPTH_ATTACHMENT,s,r,0),this.gl=t,this.framebufferBinder=f,this.renderTexture=n,this.colorAttachments=T,this.depthAttachment=r}setTarget(t){this.depthAttachment&&this.framebufferBinder.texture2D(this.gl.DEPTH_ATTACHMENT,t,this.depthAttachment,0);for(let n=0;n<this.colorAttachments.length;++n)this.framebufferBinder.texture2D(this.gl.COLOR_ATTACHMENT0+n,t,this.colorAttachments[n],0)}unbind(){this.framebufferBinder.unbind(),this.renderTexture.swapTextures()}}class G{constructor(t,n){a(this,"framebuffer");a(this,"colorAttachments");a(this,"colorTextures");a(this,"depthAttachment");a(this,"depthTexture");a(this,"width");a(this,"height");a(this,"cube");const s=n.width,i=n.height,T=n.cube?t.TEXTURE_CUBE_MAP:t.TEXTURE_2D,r=[n.colorInternalFormat0,n.colorInternalFormat1].filter(c=>typeof c=="number"&&c!==t.NONE),f=[];for(let c=0;c<r.length*2;++c){const u=r[Math.floor(c/2)],m=new l(t,T,1,u,s,i);m.bind(t).parameteri(t.TEXTURE_MIN_FILTER,t.LINEAR).parameteri(t.TEXTURE_MAG_FILTER,t.LINEAR).parameteri(t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE).parameteri(t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),f.push(m)}const o=[];n.depthInternalFormat&&(o.push(new l(t,T,1,n.depthInternalFormat,s,i)),o.push(new l(t,T,1,n.depthInternalFormat,s,i)));for(const c of o)c.bind(t).parameteri(t.TEXTURE_MIN_FILTER,t.NEAREST).parameteri(t.TEXTURE_MAG_FILTER,t.NEAREST).parameteri(t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE).parameteri(t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);const E=new N(t,t.FRAMEBUFFER),_=n.cube?t.TEXTURE_CUBE_MAP_POSITIVE_X:t.TEXTURE_2D;d(E,t,c=>{for(let u=0;u<r.length;++u)c.texture2D(t.COLOR_ATTACHMENT0+u,_,f[u*2],0);o.length&&c.texture2D(t.DEPTH_ATTACHMENT,_,o[0],0),c.checkStatus(u=>{if(u!=t.FRAMEBUFFER_COMPLETE)throw new A(t,u||t.getError())})}),this.framebuffer=E,this.colorAttachments=x(f,2,0),this.colorTextures=x(f,2,1),this.width=s,this.height=i,this.cube=n.cube,o.length&&(this.depthAttachment=o[0],this.depthTexture=o[1])}get colorTexture(){return this.colorTextures[0]}swapTextures(){for(let t=0;t<this.colorAttachments.length;++t)this.colorAttachments[t].swap(this.colorTextures[t]);this.depthAttachment&&this.depthAttachment.swap(this.depthTexture)}bind(t){return new D(t,this,this.defaultTarget(t))}defaultTarget(t){return this.cube?t.TEXTURE_CUBE_MAP_POSITIVE_X:t.TEXTURE_2D}}var V=`#version 300 es

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
}`,k=`#version 300 es

in vec4 POSITION;

out vec3 v_texCoord;

uniform mat4 inverseViewProj;

void main() {
    vec4 posInWorld = inverseViewProj * POSITION;
    v_texCoord = (posInWorld / posInWorld.w).xyz;
    gl_Position = POSITION;
}`,W=`#version 300 es

precision highp float;

in vec3 v_texCoord;

out vec4 f_color;

uniform samplerCube skybox;

void main() {
    f_color = texture(skybox, v_texCoord);
}`,z=`#version 300 es

in vec2 POSITION;

out vec3 v_normal;
out vec3 v_tangent;

uniform mat3 texMat;

void main()
{
    v_normal = texMat * vec3(POSITION.xy, 1);
    v_tangent = texMat * vec3(1, 0, 0);
    gl_Position = vec4(POSITION, 0, 1);
}`,j=`#version 300 es

precision highp float;

in vec3 v_normal;
in vec3 v_tangent;

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

#endif

void main()
{
    vec3 N = normalize(v_normal);
    vec3 T = normalize(gramSchmidt(N, v_tangent));
    vec3 B = cross(N, T);
    mat3 TBN = mat3(T, B, N);

    const int stacks = 16;
    const int slices = stacks * 4;
    const float dp = 2.0 * pi / float(slices);
    const float dt = 0.5 * pi / float(stacks);
    vec3 irradiance = vec3(0);
    
    
    for (int i = 1; i < stacks; ++i) {
        float theta = dt * float(i);
        float sinTheta = sin(theta);
        float cosTheta = cos(theta);
        for (int j = 0; j < slices; ++j) {
            float phi = dp * float(j);
            float x = sinTheta * cos(phi);
            float y = sinTheta * sin(phi);
            float z = cosTheta;
            vec3 texCoord = TBN * vec3(x, y, z);
            irradiance += texture(envMap, texCoord).rgb * sinTheta * cosTheta;
        }
    }
    f_color.rgb = irradiance * pi / float(slices * stacks);
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
}`,$=`#version 300 es

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
}`;export{U as G,X as L,G as R,W as a,z as b,j as c,B as d,y as e,$ as f,w as g,V as i,q as p,k as s};
