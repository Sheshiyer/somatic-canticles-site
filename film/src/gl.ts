// WebGL passes: (1) the Khalorēē field — a domain-warped fbm shader rendered at half
// resolution; (2) perspective-correct textured quads (covers, the sample page) with a
// specular sheen. Both are pure functions of their uniforms, so frames are reproducible.
import { W, H } from "./timeline.ts";

/** Screen-space camera shared by GL quads and 2D overlays: px offsets from frame centre + zoom. */
export interface Cam { x: number; y: number; z: number }
export const CAM0: Cam = { x: 0, y: 0, z: 1 };
/** Perspective distance in px: a point at Z = D appears at half size. */
export const D = 2000;

/** Project a 3D point (px, origin at frame centre, +Y down, +Z away) to screen px through the camera. */
export const project = (X: number, Y: number, Z: number, cam: Cam = CAM0): [number, number, number] => {
  const s = D / (D + Z);
  const sx = X * s, sy = Y * s;
  return [W / 2 + (sx - cam.x) * cam.z, H / 2 + (sy - cam.y) * cam.z, s * cam.z];
};

/** Rotate local corners of a w×h card (centred) by rx, ry (radians) and place at (X, Y, Z). */
export const cardCorners = (X: number, Y: number, Z: number, w: number, h: number, rx: number, ry: number) => {
  const local: Array<[number, number]> = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
  return local.map(([lx, ly]) => {
    // rotate around Y, then X
    const x1 = lx * cy, z1 = lx * sy;
    const y2 = ly * cx - z1 * sx, z2 = ly * sx + z1 * cx;
    return [X + x1, Y + y2, Z + z2] as [number, number, number];
  });
};

function compile(gl: WebGLRenderingContext, vs: string, fs: string) {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`shader: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`link: ${gl.getProgramInfoLog(p)}`);
  return p;
}

const glctx = (c: HTMLCanvasElement) => {
  const gl = c.getContext("webgl", { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: true, alpha: true });
  if (!gl) throw new Error("WebGL unavailable");
  return gl;
};

// ───────────────────────────────────────────── field
const FIELD_FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime, uIntensity, uWarmth, uPulse, uVeinScale;
uniform vec3 uBase, uVein, uWarm;
uniform vec2 uFocus;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = m * p; a *= 0.5; }
  return v;
}
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  vec2 q = vec2(fbm(p * 1.5 + vec2(0.0, t * 0.05)), fbm(p * 1.5 + vec2(5.2, -t * 0.04)));
  vec2 r = vec2(fbm(p * 2.1 + 3.0 * q + vec2(1.7, 9.2) + t * 0.03), fbm(p * 2.1 + 3.0 * q + vec2(8.3, 2.8) - t * 0.025));
  float n = fbm(p * 2.0 + 2.6 * r);
  float ridge = 1.0 - abs(fract(n * uVeinScale) - 0.5) * 2.0;
  ridge = pow(smoothstep(0.78, 1.0, ridge), 3.0);
  float vign = smoothstep(1.3, 0.15, length(p - uFocus));
  vec3 col = uBase;
  col += uVein * ridge * 0.42 * uIntensity * (0.35 + 0.65 * r.x) * vign;
  col += uWarm * pow(n, 3.0) * 0.30 * uWarmth * uIntensity * vign;
  col += uVein * 0.07 * uPulse * vign;
  col *= mix(0.58, 1.0, vign);
  gl_FragColor = vec4(col, 1.0);
}`;
const FIELD_VS = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

export interface FieldParams {
  time: number; intensity: number; warmth: number; pulse: number; veinScale?: number;
  base: [number, number, number]; vein: [number, number, number]; warm: [number, number, number];
  focus?: [number, number];
}

export class Field {
  canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  constructor(scale = 0.5) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = Math.round(W * scale);
    this.canvas.height = Math.round(H * scale);
    const gl = (this.gl = glctx(this.canvas));
    this.prog = compile(gl, FIELD_VS, FIELD_FS);
    gl.useProgram(this.prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ["uRes", "uTime", "uIntensity", "uWarmth", "uPulse", "uVeinScale", "uBase", "uVein", "uWarm", "uFocus"])
      this.u[n] = gl.getUniformLocation(this.prog, n);
  }
  render(p: FieldParams) {
    const gl = this.gl, u = this.u;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.prog);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, p.time);
    gl.uniform1f(u.uIntensity, p.intensity);
    gl.uniform1f(u.uWarmth, p.warmth);
    gl.uniform1f(u.uPulse, p.pulse);
    gl.uniform1f(u.uVeinScale, p.veinScale ?? 6);
    gl.uniform3fv(u.uBase, p.base);
    gl.uniform3fv(u.uVein, p.vein);
    gl.uniform3fv(u.uWarm, p.warm);
    gl.uniform2fv(u.uFocus, p.focus ?? [0, 0]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return this.canvas;
  }
}

// ───────────────────────────────────────────── textured quads
const QUAD_VS = `
attribute vec4 aPos; attribute vec2 aUv; varying vec2 vUv;
void main(){ vUv = aUv; gl_Position = aPos; }`;
const QUAD_FS = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uAlpha, uShade, uSheen, uSheenAmt, uEdge;
void main(){
  vec4 c = texture2D(uTex, vUv);
  vec3 col = c.rgb * (1.0 - uShade);
  float band = (vUv.x * 0.85 + vUv.y * 0.35) - uSheen;
  float sheen = exp(-band * band * 90.0) * uSheenAmt;
  col += vec3(1.0, 0.93, 0.80) * sheen;
  vec2 e = min(vUv, 1.0 - vUv);
  float edge = smoothstep(0.0, uEdge, min(e.x, e.y));
  col *= mix(0.82, 1.0, edge);
  gl_FragColor = vec4(col * c.a, c.a) * uAlpha;
}`;

export interface QuadOpts { alpha?: number; shade?: number; sheen?: number; sheenAmt?: number; edge?: number }

export class Quads {
  canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private buf: WebGLBuffer;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private aPos: number;
  private aUv: number;
  private tex = new Map<string, WebGLTexture>();
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = W;
    this.canvas.height = H;
    const gl = (this.gl = glctx(this.canvas));
    this.prog = compile(gl, QUAD_VS, QUAD_FS);
    this.buf = gl.createBuffer()!;
    this.aPos = gl.getAttribLocation(this.prog, "aPos");
    this.aUv = gl.getAttribLocation(this.prog, "aUv");
    for (const n of ["uTex", "uAlpha", "uShade", "uSheen", "uSheenAmt", "uEdge"]) this.u[n] = gl.getUniformLocation(this.prog, n);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  }
  /** Upload (or re-upload) an image/canvas under a key. */
  upload(key: string, src: TexImageSource) {
    const gl = this.gl;
    let t = this.tex.get(key);
    if (!t) {
      t = gl.createTexture()!;
      this.tex.set(key, t);
    }
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  clear() {
    const gl = this.gl;
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  /** Draw a textured quad from four 3D corners (TL, TR, BR, BL) through the camera. */
  draw(key: string, corners: Array<[number, number, number]>, cam: Cam, o: QuadOpts = {}) {
    const gl = this.gl, u = this.u;
    const t = this.tex.get(key);
    if (!t || (o.alpha ?? 1) <= 0.002) return;
    const cxN = cam.x / (W / 2), cyN = -cam.y / (H / 2);
    const clip = corners.map(([X, Y, Z]) => {
      const w = (D + Z) / D;
      const x = X / (W / 2), y = -Y / (H / 2);
      return [cam.z * (x - cxN * w), cam.z * (y - cyN * w), 0, w];
    });
    const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const order = [0, 1, 2, 0, 2, 3];
    const data = new Float32Array(order.flatMap((i) => [...clip[i], ...uv[i]]));
    gl.useProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.aPos);
    gl.vertexAttribPointer(this.aPos, 4, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(this.aUv);
    gl.vertexAttribPointer(this.aUv, 2, gl.FLOAT, false, 24, 16);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.uniform1i(u.uTex, 0);
    gl.uniform1f(u.uAlpha, o.alpha ?? 1);
    gl.uniform1f(u.uShade, o.shade ?? 0);
    gl.uniform1f(u.uSheen, o.sheen ?? -9);
    gl.uniform1f(u.uSheenAmt, o.sheenAmt ?? 0);
    gl.uniform1f(u.uEdge, o.edge ?? 0.015);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  get frame() {
    return this.canvas;
  }
}
