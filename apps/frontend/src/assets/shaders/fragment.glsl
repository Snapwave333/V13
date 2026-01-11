#version 300 es
precision highp float;

out vec4 fragColor;

uniform float u_time;
uniform float u_boot_time; // 0.0 to ~12.0 during boot, then continues increasing
uniform vec2 u_resolution;
uniform vec3 u_audio_low_mid_high; // x=Bass, y=Mid, z=High
// uniform sampler2D u_feedback_texture;

// Hybrid Control Uniforms
uniform vec3 u_camera_pos;      // Overrides ro
uniform float u_fractal_scale;  // Adds to scale logic
uniform float u_global_intensity; // Modulates final color
uniform float u_glitch_strength;  // Overrides audio glitch
uniform vec3 u_ai_primary;    // New
uniform vec3 u_ai_secondary;  // New

// --- Constants ---
#define MAX_STEPS 80
#define MAX_DIST 40.0
#define SURF_DIST 0.001
#define PI 3.14159265

// --- Helper Functions ---
// "Hash 11" - Dave Hoskins (https://www.shadertoy.com/view/4djSRW)
// Artifact-free and faster than sin()
float hash(float n) {
    n = fract(n * 0.1031);
    n *= n + 33.33;
    n *= n + n;
    return fract(n);
}

// --- Transform Utilities ---
mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

// --- SDF: Box ---
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// --- SDF: Octahedron ---
float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x+p.y+p.z-s)*0.57735027;
}

// "Hash 31" - 1 Input -> 3 Outputs (for 3D rotation)
vec3 hash31(float p) {
   vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
   p3 += dot(p3, p3.yzx+33.33);
   return fract((p3.xxy+p3.yzz)*p3.zyx); 
}

// --- SCENE BACKDROP (Stars & Nebula) ---
vec3 getBackdrop(vec3 rd, float t) {
    float stars = pow(hash(dot(rd, vec3(12.989, 78.233, 45.163))), 100.0) * 5.0;
    
    // Nebula Cloud (Cheap Noise)
    float cloud = sin(rd.x * 2.0 + t*0.1) * cos(rd.y * 3.0 - t*0.05);
    vec3 nebula = vec3(0.05, 0.0, 0.1) * max(0.0, cloud);
    
    return nebula + vec3(stars);
}

// --- SDF: Epic Dreadnought (Refined Structure) ---
float sdCapitalShip(vec3 p) {
    // Tapered Main Battery
    float hull = (abs(p.x) / (1.5 + p.z * 0.1) + abs(p.y) / 1.0 + abs(p.z) / 10.0) - 1.0;
    
    // Side Trenches (Subtractive)
    float trench = sdBox(p + vec3(0, 0, 0), vec3(4.0, 0.1, 10.0));
    hull = max(hull, -trench);
    
    // Command Bridge Tower
    vec3 pTow = p + vec3(0.0, -1.8, 5.0);
    float tower = sdBox(pTow, vec3(0.3, 1.5, 0.6));
    tower = min(tower, sdBox(pTow + vec3(0, -1.0, 0), vec3(1.5, 0.2, 0.3))); // Shield Domes / Arms
    
    float d = min(hull, tower);
    
    // Turret Repeater pods
    vec3 pTur = p;
    pTur.xz = mod(pTur.xz, 4.0) - 2.0;
    pTur.y -= 0.8;
    float turrets = sdBox(pTur, vec3(0.2, 0.2, 0.2));
    if (d < 1.0) d = min(d, turrets);

    // SURFACE GREEBLING
    if (d < 1.0) {
        d += sin(p.x * 50.0) * sin(p.z * 40.0) * 0.005;
    }
    
    return d * 0.7;
}

// --- SDF: Aggressive Interceptor (Fighter Redesign) ---
float sdFighter(vec3 p) {
    // Triangular cockpit
    float core = sdOctahedron(p, 0.6);
    
    // Dagger-style Wings
    vec3 pW = p;
    pW.x = abs(pW.x) - 1.0;
    pW.z -= pW.y * 1.5; // Angled wings
    float wings = sdBox(pW, vec3(0.05, 1.5, 1.0));
    
    return min(core, wings);
}

// --- SDF: Debris (High-Speed Shards) ---
float sdDebris(vec3 p, float t) {
    float t_spiral = clamp((t - 14.0) * 0.4, 0.0, 3.0);
    p.xy *= rot(t_spiral * 5.0 + p.z * 0.1);
    
    vec3 q = mod(p, 1.2) - 0.6;
    vec3 h = hash31(dot(floor(p/1.2), vec3(1, 13, 27)));
    q.yz *= rot(t * 10.0 * h.x);
    
    return sdOctahedron(q, 0.1 + h.z * 0.2);
}

// --- SDF: Title "V13" (Improved Blocky) ---
float sdTitle(vec3 p) {
    p.z -= 10.0;
    float d = 100.0;
    float w = 0.4;
    
    // "V" (True tapered)
    vec3 pv = p + vec3(4.0, 0, 0);
    float d_v = max(abs(pv.x) - 0.3 - abs(pv.y)*0.5, abs(pv.y) - 2.0);
    d = min(d, max(d_v, abs(pv.z) - w));
    
    // "1"
    vec3 p1 = p;
    d = min(d, sdBox(p1, vec3(0.3, 2.0, w)));
    
    // "3"
    vec3 p3 = p + vec3(-3.5, 0, 0);
    float d3 = sdBox(p3, vec3(1.2, 2.0, w));
    d3 = max(d3, -sdBox(p3 + vec3(0.5, 0.7, 0), vec3(1.5, 0.4, w + 0.1))); // Notch Top
    d3 = max(d3, -sdBox(p3 + vec3(0.5, -0.7, 0), vec3(1.5, 0.4, w + 0.1))); // Notch Bot
    d = min(d, d3);

    return d;
}

// --- CINEMATIC CAMERA PATHS ---
vec3 getBootCamera(float t) {
    if (t < 5.0) return vec3(2.0, 1.5, -10.0 + (t-1.5)*5.0); // Flyby
    if (t < 10.0) return vec3(sin(t)*2.0, cos(t)*2.0, 0.0); // Dogfight spin
    if (t < 15.0) return vec3(0, 0, -20.0 + (t-12.0)*2.0); // Aftermath pull-back
    return vec3(0, 0, -20.0);
}

// --- Domain Warping ---
vec3 warp(vec3 p) {
    float t = u_time * 0.2;
    float sense = u_audio_low_mid_high.y * 2.0;

    // Twist based on depth and audio
    float twist = sin(p.z * 0.1 + t) * sense;
    p.xy *= rot(twist);

    // Fold space
    p.xy = abs(p.xy) - 1.0;
    return p;
}

// --- Symmetry Abuse (Kaleidoscope) ---
vec3 kaleidoscope(vec3 p) {
    float segs = 4.0 + floor(u_audio_low_mid_high.x * 4.0); // 4 to 8 segments
    float angle = PI / segs;

    float r = length(p.xy);
    float a = atan(p.y, p.x);
    a = mod(a, angle * 2.0) - angle;
    p.xy = vec2(cos(a), sin(a)) * r;
    return p;
}

// --- SDF: Core Fractal Logic ---
float mapFractal(vec3 p) {
     // 1. Domain Warping
    if (u_audio_low_mid_high.y > 0.3) {
       p = warp(p);
    }

    // 2. Symmetry Abuse on Bass Drop
    if (u_audio_low_mid_high.x > 0.5) {
        p = kaleidoscope(p);
    }

    // 3. Infinite Repetition
    float spacing = 8.0;
    p.z = mod(p.z + u_time * 5.0, spacing) - spacing * 0.5;

    // 4. Fractal Construction
    float d = sdBox(p, vec3(1.0));
    float s = 1.0;

    // Scale breathes with bass + manual zoom
    float scaleBase = 2.0 + u_fractal_scale; // manual
    float scaleReact = u_audio_low_mid_high.x * 0.5; // audio
    float scaleOp = scaleBase + scaleReact;

    for(int i = 0; i < 4; i++) {
        vec3 a = mod(p * s, 2.0) - 1.0;
        s *= scaleOp;
        vec3 r = abs(1.0 - 3.0 * abs(a));
        float da = max(r.x, r.y);
        float db = max(r.y, r.z);
        float dc = max(r.z, r.x);
        float c = (min(da, min(db, dc)) - 1.0) / s;
        d = max(d, c);

        // Hostile Rotation per iteration
        float rotSpeed = u_time * 0.2 + (u_audio_low_mid_high.z * float(i));
        p.xz *= rot(rotSpeed);
        p.xy *= rot(rotSpeed * 0.5);
    }
    return d;
}

// --- BOOT SCENE MAP ---
float mapBoot(vec3 p, float t) {
    float d = 100.0;

    if (t < 5.0) {
        // Scene 1: The Dreadnought
        d = sdCapitalShip(p - vec3(0, 0, 5.0));
    }
    else if (t < 10.0) {
        // Scene 2: Dogfight (Fighters everywhere)
        vec3 q = p;
        float id = floor(q.z / 10.0);
        q.z = mod(q.z, 10.0) - 5.0;
        vec3 h = hash31(id);
        q.xy += (h.xy - 0.5) * 5.0;
        q.xy *= rot(t * 2.0 + h.z);
        d = sdFighter(q);

        // Background Dreadnought
        d = min(d, sdCapitalShip((p - vec3(10, -5, 20)) * 0.5) * 2.0);
    }
    else if (t < 18.0) {
        // Scene 4: Aftermath / Title
        float blend = smoothstep(12.0, 15.0, t);
        float dDebris = sdDebris(p, t);
        float dTitle = sdTitle(p);
        d = mix(dDebris, dTitle, blend);
    }

    return d;
}

// --- MAIN MAP ---
float map(vec3 p) {
    if (u_boot_time < 18.0) return mapBoot(p, u_boot_time);
    return mapFractal(p);
}

// --- BOOT LIGHTING ---
vec3 getBootColor(vec3 p, vec3 n, float t) {
    vec3 col = vec3(0.2, 0.2, 0.25); // Metallic base
    
    // Engine Glow Influence
    if (t < 5.0) {
        float engine = smoothstep(1.0, 0.0, length(p.xy - vec2(0,0)) - 1.0);
        col = mix(col, vec3(0.2, 0.5, 1.0), engine * 0.5);
    }
    
    // Laser Flashes
    float flash = pow(fract(t * 8.0), 10.0) * step(5.0, t) * step(t, 10.0);
    col += vec3(1.0, 0.2, 0.1) * flash * 2.0;
    
    // Reactor Breach
    if (t > 10.0 && t < 12.0) {
        float f = (t - 10.0) / 2.0;
        col += vec3(1.0, 0.9, 0.5) * pow(f, 4.0) * 10.0;
    }
    
    return col;
}


// --- Raymarcher ---
// --- Raymarcher (Optimized) ---
float rayMarch(vec3 ro, vec3 rd) {
    float dO = 0.0;
    
    // Unroll unused optimization variable for better compiling
    // float minStep = SURF_DIST; 
    
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * dO;
        float dS = map(p);
        
        // DYNAMIC STEP RELAXATION
        // If we are far away, we don't need 0.001 precision.
        // We can accept a "hit" if dS < precision(distance)
        // precision ~ distance * 0.002
        float pixelSize = dO * (1.0 / u_resolution.y); 
        if(abs(dS) < pixelSize) { // Hit!
             break;
        }
        
        dO += dS;

        // Break far
        if(dO > MAX_DIST) break;
    }
    return dO;
}

// --- Normals ---
vec3 getNormal(vec3 p) {
    float d = map(p);
    vec2 e = vec2(0.001, 0.0);
    vec3 n = d - vec3(
        map(p - e.xyy),
        map(p - e.yxy),
        map(p - e.yyx)
    );
    return normalize(n);
}

// --- ASCII Quantization (Hyperreal 2.5D) ---
vec3 ascii_filter(vec3 col, vec2 uv) {
    // 1. Determine Grid - High Density for "Photoreal" look
    float density = 140.0; // Increased from 100.0 for finer detail
    vec2 quant = vec2(density, density * u_resolution.y / u_resolution.x);
    vec2 grid_uv = floor(uv * quant) / quant;
    
    // 2. Sample luminance
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    
    // 3. Glitch Inversion (Impact Event Flash)
    if (u_boot_time > 15.0 && u_boot_time < 15.3) {
        luma = 1.0 - luma; 
    }
    if (u_glitch_strength > 0.5 || u_audio_low_mid_high.x > 0.9) {
        luma = 1.0 - luma;
    }

    // 4. Photoreal Character Ramp (10-step gradient)
    // Using simple shapes to approximate: @ % # * + = - : . 
    vec2 cell_uv = fract(uv * quant); 
    vec2 c = cell_uv - 0.5;
    float dist = length(c);
    float charMask = 0.0;
    
    // High-res character procedural logic
    if (luma > 0.95) charMask = 1.0; // @ (Block)
    else if (luma > 0.85) charMask = (abs(c.x) < 0.4 && abs(c.y) < 0.4) ? 1.0 : 0.0; // % (Big Box)
    else if (luma > 0.75) charMask = (abs(c.x) < 0.1 || abs(c.y) < 0.1) || (abs(c.x+c.y)<0.1) ? 1.0 : 0.0; // # (Union)
    else if (luma > 0.65) charMask = (abs(c.x) < 0.1 || abs(c.y) < 0.1) ? 1.0 : 0.0; // +
    else if (luma > 0.55) charMask = (abs(c.x) < 0.3 && abs(c.y) < 0.1) ? 1.0 : 0.0; // =
    else if (luma > 0.45) charMask = (abs(c.y) < 0.1) ? 1.0 : 0.0; // -
    else if (luma > 0.35) charMask = (abs(c.x) < 0.1 && abs(c.y) > 0.2) ? 1.0 : 0.0; // :
    else if (luma > 0.2)  charMask = (dist < 0.15) ? 1.0 : 0.0; // .
    else if (luma > 0.05) charMask = (dist < 0.08) ? 1.0 : 0.0; // . (tiny)
    
    // Color Grading: Maintain hue but snap value -> "2.5D" feel comes from shading
    return col * charMask * 2.5; 
}

// --- HSV Helper ---
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec2 texUV = gl_FragCoord.xy / u_resolution.xy; 

    // Camera setup
    vec3 ro = u_camera_pos;
    vec3 rd = normalize(vec3(uv, 1.0));
    
    // Glitch Offset
    if (u_glitch_strength > 0.1) {
        rd.x += sin(u_time * 100.0) * u_glitch_strength * 0.1;
    }

    // --- CINEMATIC BOOT INJECTION ---
    if (u_boot_time < 18.0) {
        ro = getBootCamera(u_boot_time);
        float d = rayMarch(ro, rd);
        vec3 col = getBackdrop(rd, u_boot_time);
        
        if (d < MAX_DIST) {
            vec3 p = ro + rd * d;
            vec3 n = getNormal(p);
            col = getBootColor(p, n, u_boot_time);
            
            // Add some directional lighting
            float diff = max(dot(n, normalize(vec3(1, 2, -1))), 0.0);
            col *= (diff + 0.3);
            
            // Add Rim Light
            float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
            col += vec3(0.5, 0.8, 1.0) * rim;
        }
        
        // Overlays
        if (u_boot_time < 1.5) {
            float streaks = pow(hash(dot(rd.xy, vec2(12.989, 78.233))), 100.0) * 30.0;
            col += vec3(0.3, 0.6, 1.0) * streaks * smoothstep(0.0, 1.5, u_boot_time);
        }
        
        // Critical Flash Outro (Sync with reactor breach)
        if (u_boot_time > 11.5 && u_boot_time < 12.0) {
            col += vec3(2.0);
        }
        
        fragColor = vec4(ascii_filter(col, texUV), 1.0);
        return;
    }
    // --------------------------------

    // Render Scene (Fractal)
    float d = rayMarch(ro, rd);
    vec3 col = vec3(0.0);

    if (d < MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = getNormal(p);
        
        // "Cyber-PBR" Lighting Model
        // 1. Lighting Setup
        vec3 lightPos = vec3(2.0, 5.0, -5.0);
        vec3 lightDir = normalize(lightPos - p);
        vec3 viewDir = normalize(ro - p);
        vec3 halfDir = normalize(lightDir + viewDir);
        
        // 2. Base Material (Metallic Dark/Cyan)
        vec3 albedo = vec3(0.05, 0.1, 0.15); // Dark base
        // Audio reactive emission
        albedo += hsv2rgb(vec3(length(p)*0.05 + u_time*0.05, 0.8, 1.0)) * u_global_intensity * 0.2;

        // 3. Diffuse (Lambert)
        float NdotL = max(dot(n, lightDir), 0.0);
        vec3 diffuse = albedo * NdotL;
        
        // 4. Specular (Blinn-Phong) - Clean metal look
        float NdotH = max(dot(n, halfDir), 0.0);
        float spec = pow(NdotH, 32.0); // Hard shininess
        vec3 specular = vec3(0.8, 0.9, 1.0) * spec * 2.0;
        
        // 5. Fresnel (Rim Lighting) - The "Cyber" Edge
        float NdotV = max(dot(n, viewDir), 0.0);
        float fresnel = pow(1.0 - NdotV, 3.0);
        vec3 rim = vec3(0.0, 1.0, 0.8) * fresnel * 1.5; // Cyan glow on edges
        
        // 6. Combine
        col = diffuse + specular + rim;
        
        // 7. Ambient Occlusion (Fake via steps)
        // We can approximate AO by how many steps it took to get here? 
        // Or just simple distance fog.
        
        // Distance Fog (Atmosphere)
        float fog = 1.0 - exp(-d * d * 0.005);
        vec3 fogCol = vec3(0.0, 0.02, 0.05); // Deep space blue
        col = mix(col, fogCol, fog);
    }

    // ASCII Filter
    col = ascii_filter(col, texUV); 

    fragColor = vec4(col, 1.0);
}
