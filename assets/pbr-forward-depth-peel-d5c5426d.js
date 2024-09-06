var n=`#version 300 es

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

uniform sampler2D depthPeelReference;
uniform float depthBias;
uniform vec2 depthPeelScreenSize;
uniform sampler2D normalMap;
uniform sampler2D baseColorMap;
uniform vec4 baseColorValue;
uniform bool flipNormalGreen;
uniform bool flipNormal;
uniform float normalMapStrength;
uniform float metallicFactor;
uniform float roughnessFactor;
uniform float occlusionFactor;
uniform sampler2D metallicRoughnessMap;
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
    vec2 metallicRoughness = texture(metallicRoughnessMap, v_texCoord).bg;
    float metallic = metallicFactor * metallicRoughness.x;
    float roughness = max(0.01, roughnessFactor * metallicRoughness.y);

    float occlusion = 1.0;
    vec3 position = v_position;
    vec3 view = -normalize(position);
    float NoV = saturate(dot(normal, view));
    vec2 dfg = texture(brdfLutMap, vec2(NoV, roughness)).rg;
    vec3 light = (inverseView * vec4(reflect(-view, normal), 0)).xyz;
    float lod = roughness * maxLevel;
    vec3 sampledColor = textureLod(prefilteredEnvMap, light, lod).rgb;
    vec3 f0 = F0(baseColor.rgb, metallic);

    vec3 normalWorld = (inverseView * vec4(normal, 0)).xyz;
    vec3 diffuseIrradiance = texture(irradianceEnvMap, normalWorld).rgb;

    vec3 Fs = sampledColor * (f0 * dfg.x + vec3(dfg.y));
    vec3 Fd = diffuseColor(baseColor.rgb, metallic) * diffuseIrradiance;
    vec3 Kd = clamp(1.0 - FresnelSchlickRoughness(f0, NoV, roughness), 0.8, 1.0);
    f_color.rgb = (Fs + Fd * Kd) * occlusion;
    f_color.a = baseColor.a;
}`;export{n as p};
