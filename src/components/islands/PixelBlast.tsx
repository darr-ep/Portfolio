import { Color, Mesh, Program, Renderer, Triangle, Vec2 } from 'ogl';
import React, { useEffect, useRef } from 'react';

type PixelBlastVariant = 'square' | 'circle' | 'triangle' | 'diamond';

type PixelBlastProps = {
  variant?: PixelBlastVariant;
  pixelSize?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  antialias?: boolean;
  patternScale?: number;
  patternDensity?: number;
  pixelSizeJitter?: number;
  enableRipples?: boolean;
  rippleIntensityScale?: number;
  rippleThickness?: number;
  rippleSpeed?: number;
  autoPauseOffscreen?: boolean;
  speed?: number;
  transparent?: boolean;
  edgeFade?: number;
};

const SHAPE_MAP: Record<PixelBlastVariant, number> = {
  square: 0,
  circle: 1,
  triangle: 2,
  diamond: 3
};

const MAX_CLICKS = 10;

// Convert an sRGB channel (0..1) to linear light. Three.js applies this
// automatically when building a THREE.Color from a hex string; OGL does not, so
// we replicate it here. The fragment shader takes linear input and encodes back
// to sRGB itself — feeding raw sRGB would double-apply gamma and wash the color.
const srgbToLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const hexToLinearColor = (hex: string): Color => {
  const c = new Color(hex); // OGL parses hex into straight 0..1 sRGB channels
  return new Color(srgbToLinear(c.r), srgbToLinear(c.g), srgbToLinear(c.b));
};

const VERTEX_SRC = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `#version 300 es
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;

uniform int   uShapeType;
const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;

const int   MAX_CLICKS = 10;

uniform vec2  uClickPos  [MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

#define FBM_OCTAVES     5
#define FBM_LACUNARITY  1.25
#define FBM_GAIN        1.0

float hash11(float n){ return fract(sin(n)*43758.5453); }

float vnoise(vec3 p){
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0  = mix(x00, x10, w.y);
  float y1  = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < FBM_OCTAVES; ++i){
    sum  += amp * vnoise(p * freq);
    freq *= FBM_LACUNARITY;
    amp  *= FBM_GAIN;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov){
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov){
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d  = p.y - r*(1.0 - p.x);
  float aa = fwidth(d);
  return cov * clamp(0.5 - d/aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov){
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / uResolution.y;

  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fract(fragCoord / pixelSize);

  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;

  float feed = base + (uDensity - 0.5) * 0.3;

  float speed     = uRippleSpeed;
  float thickness = uRippleThickness;
  const float dampT     = 1.0;
  const float dampR     = 10.0;

  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; ++i){
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      float cellPixelSize = 8.0 * pixelSize;
      vec2 cuv = (((pos - uResolution * .5 - cellPixelSize * .5) / (uResolution))) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      float waveR = speed * t;
      float ring  = exp(-pow((r - waveR) / thickness, 2.0));
      float atten = exp(-dampT * t) * exp(-dampR * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);

  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale;
  float M;
  if      (uShapeType == SHAPE_CIRCLE)   M = maskCircle (pixelUV, coverage);
  else if (uShapeType == SHAPE_TRIANGLE) M = maskTriangle(pixelUV, pixelId, coverage);
  else if (uShapeType == SHAPE_DIAMOND)  M = maskDiamond(pixelUV, coverage);
  else                                   M = coverage;

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    M *= fade;
  }

  vec3 color = uColor;

  // sRGB gamma correction - convert linear to sRGB for accurate color output
  vec3 srgbColor = mix(
    color * 12.92,
    1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, color)
  );

  fragColor = vec4(srgbColor, M);
}
`;

interface GLState {
  renderer: Renderer;
  program: Program;
  clickIx: number;
  timeOffset: number;
  startTime: number;
  // Plain arrays, NOT Float32Array: OGL's Program.use() gates array uniforms on
  // `Array.isArray(value)`, which is false for typed arrays — a Float32Array
  // silently fails to bind and spams "uniform not supplied" every frame. The
  // layout is flat/interleaved to match OGL's vec2-array binding: uClickPos[i]
  // reads scalars [i*2] (x) and [i*2+1] (y), not a nested [x, y] sub-array.
  clickPos: number[];
  clickTimes: number[];
  resizeObserver?: ResizeObserver;
  raf?: number;
  antialias: boolean;
}

// Tear down a GL context: stop the resize observer + RAF, drop the WebGL context,
// and detach the canvas. Shared by the reinit branch (disposing the old context
// before building a new one) and the effect cleanup (unmount).
const disposeGL = (t: GLState, container: HTMLElement): void => {
  t.resizeObserver?.disconnect();
  if (t.raf) cancelAnimationFrame(t.raf);
  const gl = t.renderer.gl;
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
};

const PixelBlast: React.FC<PixelBlastProps> = ({
  variant = 'square',
  pixelSize = 3,
  color = '#B497CF',
  className,
  style,
  antialias = true,
  patternScale = 2,
  patternDensity = 1,
  pixelSizeJitter = 0,
  enableRipples = true,
  rippleIntensityScale = 1,
  rippleThickness = 0.1,
  rippleSpeed = 0.3,
  autoPauseOffscreen = true,
  speed = 0.5,
  transparent = true,
  edgeFade = 0.5
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const visibilityRef = useRef({ visible: true });
  const speedRef = useRef(speed);
  const glRef = useRef<GLState | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    speedRef.current = speed;

    // `antialias` is the only construction-time option; every other prop is a
    // live uniform. Rebuild the context only when it actually flips.
    const mustReinit = !glRef.current || glRef.current.antialias !== antialias;

    if (mustReinit) {
      if (glRef.current) {
        disposeGL(glRef.current, container);
        glRef.current = null;
      }

      const renderer = new Renderer({
        alpha: true,
        antialias,
        premultipliedAlpha: false,
        powerPreference: 'high-performance',
        dpr: Math.min(window.devicePixelRatio || 1, 1.5)
      });
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, transparent ? 0 : 1);
      gl.canvas.style.width = '100%';
      gl.canvas.style.height = '100%';
      container.appendChild(gl.canvas);

      const clickPos: number[] = new Array(MAX_CLICKS * 2).fill(-1);
      const clickTimes: number[] = new Array(MAX_CLICKS).fill(0);

      const program = new Program(gl, {
        vertex: VERTEX_SRC,
        fragment: FRAGMENT_SRC,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        cullFace: false,
        uniforms: {
          uResolution: { value: new Vec2(0, 0) },
          uTime: { value: 0 },
          uColor: { value: hexToLinearColor(color) },
          uClickPos: { value: clickPos },
          uClickTimes: { value: clickTimes },
          uShapeType: { value: SHAPE_MAP[variant] ?? 0 },
          uPixelSize: { value: pixelSize * renderer.dpr },
          uScale: { value: patternScale },
          uDensity: { value: patternDensity },
          uPixelJitter: { value: pixelSizeJitter },
          uEnableRipples: { value: enableRipples ? 1 : 0 },
          uRippleSpeed: { value: rippleSpeed },
          uRippleThickness: { value: rippleThickness },
          uRippleIntensity: { value: rippleIntensityScale },
          uEdgeFade: { value: edgeFade }
        }
      });

      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

      const setSize = () => {
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        renderer.setSize(w, h);
        // OGL re-writes the canvas inline size on every setSize; re-assert 100%
        // so the element keeps filling its container between resize callbacks.
        gl.canvas.style.width = '100%';
        gl.canvas.style.height = '100%';
        (program.uniforms.uResolution.value as Vec2).set(gl.canvas.width, gl.canvas.height);
        program.uniforms.uPixelSize.value = pixelSize * renderer.dpr;
      };
      setSize();
      const ro = new ResizeObserver(setSize);
      ro.observe(container);

      const randomFloat = (): number => {
        if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
          const u32 = new Uint32Array(1);
          window.crypto.getRandomValues(u32);
          return u32[0] / 0xffffffff;
        }
        return Math.random();
      };
      const timeOffset = randomFloat() * 1000;

      const mapToPixels = (e: PointerEvent) => {
        const rect = gl.canvas.getBoundingClientRect();
        const scaleX = gl.canvas.width / rect.width;
        const scaleY = gl.canvas.height / rect.height;
        const fx = (e.clientX - rect.left) * scaleX;
        const fy = (rect.height - (e.clientY - rect.top)) * scaleY;
        return { fx, fy };
      };
      const onPointerDown = (e: PointerEvent) => {
        const state = glRef.current;
        if (!state) return;
        const { fx, fy } = mapToPixels(e);
        const ix = state.clickIx;
        state.clickPos[ix * 2] = fx;
        state.clickPos[ix * 2 + 1] = fy;
        state.clickTimes[ix] = program.uniforms.uTime.value;
        state.clickIx = (ix + 1) % MAX_CLICKS;
      };
      gl.canvas.addEventListener('pointerdown', onPointerDown, { passive: true });

      const startTime = performance.now();
      const animate = () => {
        const state = glRef.current;
        if (!state) return;
        if (autoPauseOffscreen && !visibilityRef.current.visible) {
          state.raf = requestAnimationFrame(animate);
          return;
        }
        const elapsed = (performance.now() - startTime) / 1000;
        program.uniforms.uTime.value = timeOffset + elapsed * speedRef.current;
        renderer.render({ scene: mesh });
        state.raf = requestAnimationFrame(animate);
      };

      glRef.current = {
        renderer,
        program,
        clickIx: 0,
        timeOffset,
        startTime,
        clickPos,
        clickTimes,
        resizeObserver: ro,
        antialias
      };
      glRef.current.raf = requestAnimationFrame(animate);
    } else {
      // Live-update path: mutate uniforms in place, no context rebuild.
      const t = glRef.current!;
      const u = t.program.uniforms;
      u.uShapeType.value = SHAPE_MAP[variant] ?? 0;
      u.uPixelSize.value = pixelSize * t.renderer.dpr;
      (u.uColor.value as Color).copy(hexToLinearColor(color));
      u.uScale.value = patternScale;
      u.uDensity.value = patternDensity;
      u.uPixelJitter.value = pixelSizeJitter;
      u.uEnableRipples.value = enableRipples ? 1 : 0;
      u.uRippleIntensity.value = rippleIntensityScale;
      u.uRippleThickness.value = rippleThickness;
      u.uRippleSpeed.value = rippleSpeed;
      u.uEdgeFade.value = edgeFade;
      t.renderer.gl.clearColor(0, 0, 0, transparent ? 0 : 1);
    }

    return () => {
      const t = glRef.current;
      // Dispose only the context this effect run owns. `t.antialias !== antialias`
      // means a later reinit already swapped in a fresh context (with a different
      // antialias) before this stale cleanup fired — leave the live one alone.
      // On a normal prop-only update or unmount the values match and we tear down.
      if (!t || t.antialias !== antialias) return;
      disposeGL(t, container);
      glRef.current = null;
    };
  }, [
    antialias,
    pixelSize,
    patternScale,
    patternDensity,
    enableRipples,
    rippleIntensityScale,
    rippleThickness,
    rippleSpeed,
    pixelSizeJitter,
    edgeFade,
    transparent,
    autoPauseOffscreen,
    variant,
    color,
    speed
  ]);

  return (
    <div
      ref={containerRef}
      className={`pixel-blast-container ${className ?? ''}`}
      style={style}
      aria-label="PixelBlast interactive background"
    />
  );
};

export default PixelBlast;
