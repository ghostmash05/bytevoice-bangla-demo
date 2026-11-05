"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type * as Three from "three";
import type { VoiceScenePhase } from "./voice-test";

const energy: Record<VoiceScenePhase, number> = {
  idle: 0.14, connecting: 0.45, listening: 0.25, thinking: 0.54, speaking: 0.9,
};

function makeSculpture(T: typeof Three, mobile: boolean) {
  const knots = [
    [-3.38, -0.51, 0.32], [-2.22, 1.13, 0.57], [-1.12, -1.47, 0.16],
    [-0.03, 2.36, -0.28], [1.00, -1.64, 0.47],
    [2.16, 0.92, -0.18], [3.38, 0.05, -0.35],
  ].map(([x, y, z]) => new T.Vector3(x, y, z));
  // A cubic B-spline keeps curvature continuous through the inside of each fold.
  class WaveSpine extends T.Curve<Three.Vector3> {
    constructor() { super(); }

    getPoint(t: number, point = new T.Vector3()) {
      const span = t * (knots.length - 1);
      const index = Math.min(Math.floor(span), knots.length - 2);
      const u = span - index;
      const v = 1 - u;
      return point.copy(knots[Math.max(0, index - 1)]).multiplyScalar(v ** 3 / 6)
        .addScaledVector(knots[index], (3 * u ** 3 - 6 * u ** 2 + 4) / 6)
        .addScaledVector(knots[index + 1], (3 * v ** 3 - 6 * v ** 2 + 4) / 6)
        .addScaledVector(knots[Math.min(knots.length - 1, index + 2)], u ** 3 / 6);
    }
  }
  const spine = new WaveSpine();
  const samples = mobile ? 96 : 152;
  const sides = 16;
  const positions: number[] = [];
  const faces: number[] = [];
  const edgeFaces: number[] = [];
  const forward = new T.Vector3(0, 0, 1);
  const length = spine.getLength();

  for (let step = 0; step <= samples; step++) {
    const along = step / samples;
    const center = spine.getPointAt(along);
    const tangent = spine.getTangentAt(along);
    const width = new T.Vector3().crossVectors(forward, tangent).normalize()
      .applyAxisAngle(tangent, 0.61 * Math.sin(along * Math.PI * 3.3 - 0.7));
    const depth = new T.Vector3().crossVectors(tangent, width).normalize();
    const before = Math.max(0, along - 0.012);
    const after = Math.min(1, along + 0.012);
    const turn = spine.getTangentAt(before).angleTo(spine.getTangentAt(after));
    // Keep the inside edge clear of itself around the tightest folds.
    const radius = length * (after - before) / Math.max(turn, 0.001);
    const widthProfile = 0.12 + 0.22 * Math.pow(Math.sin(Math.PI * along), 0.72);
    const halfWidth = widthProfile / (1 + (widthProfile / (radius * 0.73)) ** 4) ** 0.25;
    const halfDepth = 0.086 * halfWidth / widthProfile;

    for (let side = 0; side < sides; side++) {
      const angle = side * 2 * Math.PI / sides;
      const u = Math.cos(angle);
      const v = Math.sin(angle);
      // A rounded rectangle gives the glass a broad face and a beveled edge.
      const point = center.clone()
        .addScaledVector(width, Math.sign(u) * Math.abs(u) ** 0.42 * halfWidth)
        .addScaledVector(depth, Math.sign(v) * Math.abs(v) ** 0.42 * halfDepth);
      positions.push(point.x, point.y, point.z);
      if (step < samples) {
        const a = step * sides + side;
        const b = step * sides + (side + 1) % sides;
        const surface = side === 0 || side === sides - 1 ? edgeFaces : faces;
        surface.push(a, b, a + sides, b, b + sides, a + sides);
      }
    }
  }
  for (let side = 1; side < sides - 1; side++) {
    faces.push(0, side + 1, side, samples * sides, samples * sides + side, samples * sides + side + 1);
  }
  const glass = new T.BufferGeometry();
  glass.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  glass.setIndex([...faces, ...edgeFaces]);
  glass.addGroup(0, faces.length, 0);
  glass.addGroup(faces.length, edgeFaces.length, 1);
  glass.computeVertexNormals();
  const body = new T.MeshPhysicalMaterial({
    color: 0x82b4c8,
    metalness: 0.12,
    roughness: 0.14,
    transmission: mobile ? 0 : 0.57,
    thickness: 0.27,
    attenuationColor: 0x427584,
    attenuationDistance: 1.8,
    ior: 1.48,
    clearcoat: 0.94,
    clearcoatRoughness: 0.13,
    envMapIntensity: 1.8,
  });
  const edge = new T.MeshStandardMaterial({
    color: 0xe4b879,
    metalness: 0.83,
    roughness: 0.24,
    emissive: 0x3c230b,
    emissiveIntensity: 0.55,
  });
  return new T.Mesh(glass, [body, edge]);
}

function makeStudio(T: typeof Three, renderer: Three.WebGLRenderer) {
  const room = new T.Scene();
  room.background = new T.Color(0x101b26);
  const panels = [
    { position: [-2, 3.4, 5], size: [6, 2.8], color: 0xe7f5ff, strength: 4.0 },
    { position: [4, 0.5, 3], size: [1.6, 5], color: 0xf4bd73, strength: 3.1 },
    { position: [-4, 0, -3], size: [3, 5], color: 0x80bfdc, strength: 2.1 },
    { position: [0, -4, 2], size: [7, 2], color: 0x4e91a2, strength: 0.8 },
  ];
  for (const { position, size, color, strength } of panels) {
    const panel = new T.Mesh(new T.PlaneGeometry(...size), new T.MeshBasicMaterial({
      color: new T.Color(color).multiplyScalar(strength),
      side: T.DoubleSide,
    }));
    panel.position.set(position[0], position[1], position[2]);
    panel.lookAt(0, 0, 0);
    room.add(panel);
  }
  const generator = new T.PMREMGenerator(renderer);
  const environment = generator.fromScene(room, 0.035, 0.1, 30, { size: 128 });
  generator.dispose();
  for (const panel of room.children as Three.Mesh<Three.BufferGeometry, Three.Material>[]) {
    panel.geometry.dispose();
    panel.material.dispose();
  }
  return environment;
}

function makeSoundRibbon(T: typeof Three, mobile: boolean) {
  const strands = mobile ? 2 : 3;
  const length = mobile ? 68 : 108;
  const positions = new Float32Array(strands * length * 3);
  const opacity = new Float32Array(strands * length);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.BufferAttribute(positions, 3).setUsage(T.DynamicDrawUsage));
  geometry.setAttribute("strength", new T.BufferAttribute(opacity, 1).setUsage(T.DynamicDrawUsage));
  const material = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { pixelRatio: { value: 1 } },
    vertexShader: `
      attribute float strength;
      uniform float pixelRatio;
      varying float light;
      void main() {
        light = strength;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        gl_PointSize = (1.3 + strength * 2.2) * pixelRatio;
      }`,
    fragmentShader: `
      varying float light;
      void main() {
        float radius = length(gl_PointCoord - vec2(.5));
        float alpha = (1. - smoothstep(.12, .49, radius)) * light;
        gl_FragColor = vec4(mix(vec3(.51, .81, .87), vec3(1., .82, .55), light), alpha);
      }`,
  });
  const points = new T.Points(geometry, material);
  points.frustumCulled = false;
  const filamentGeometry = new T.BufferGeometry();
  filamentGeometry.setAttribute("position", new T.BufferAttribute(positions.subarray(0, length * 3), 3).setUsage(T.DynamicDrawUsage));
  filamentGeometry.setAttribute("strength", new T.BufferAttribute(opacity.subarray(0, length), 1).setUsage(T.DynamicDrawUsage));
  const filament = new T.Line(filamentGeometry, new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float strength;
      varying float light;
      void main() {
        light = strength;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }`,
    fragmentShader: `
      varying float light;
      void main() {
        gl_FragColor = vec4(.88, .75, .56, light * .68);
      }`,
  }));
  filament.frustumCulled = false;
  return {
    points, filament,
    update(time: number, activity: number, ratio: number) {
      material.uniforms.pixelRatio.value = ratio;
      for (let line = 0; line < strands; line++) {
        for (let i = 0; i < length; i++) {
          const index = line * length + i;
          const u = i / (length - 1);
          const fade = Math.sin(Math.PI * u);
          const wave = u * Math.PI * 2.15 - time * (0.56 + activity * 0.6);
          positions[index * 3] = (u - 0.5) * 7.1;
          positions[index * 3 + 1] = -0.38 + (u - 0.5) * 0.7 + Math.sin(wave + line * 0.25) * (0.81 + activity * 0.25) + (line - 1) * 0.19;
          positions[index * 3 + 2] = 0.72 + 1.27 * Math.cos(wave + line * 0.23) + (line - 1) * 0.18;
          opacity[index] = fade * (0.49 + 0.38 * Math.pow(0.5 + 0.5 * Math.sin(u * 22 - time * 2 + line), 3) + activity * 0.12);
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.strength.needsUpdate = true;
      filamentGeometry.attributes.position.needsUpdate = true;
      filamentGeometry.attributes.strength.needsUpdate = true;
    },
  };
}

export function LandingWaveform({ phase, pauseLabel, playLabel }: {
  phase: VoiceScenePhase;
  pauseLabel: string;
  playLabel: string;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const activity = useRef(energy[phase]);
  const playback = useRef<(playing: boolean) => void>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => { activity.current = energy[phase]; }, [phase]);

  useEffect(() => {
    const element = stage.current;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || reducedMotion.matches) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;

    async function mount(host: HTMLDivElement) {
      const T = await import("three");
      if (cancelled) return;
      const mobile = matchMedia("(max-width: 680px)").matches;
      const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      const ratio = Math.min(devicePixelRatio, mobile ? 1.25 : 1.5);
      renderer.setPixelRatio(ratio);
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.13;
      renderer.transmissionResolutionScale = 0.65;
      const scene = new T.Scene();
      const studio = makeStudio(T, renderer);
      scene.environment = studio.texture;
      const camera = new T.PerspectiveCamera(35, 1, 0.1, 30);
      const sculpture = makeSculpture(T, mobile);
      const sound = makeSoundRibbon(T, mobile);
      scene.add(sculpture, sound.points, sound.filament);

      let frame = 0;
      let lastDraw = 0;
      let elapsed = 0;
      let power = activity.current;
      let targetX = 0;
      let targetY = 0;
      let active = true;
      let visible = true;
      let lost = false;

      function render() {
        sculpture.rotation.x += (0.12 + targetX - sculpture.rotation.x) * 0.1;
        sculpture.rotation.y += (-0.20 + targetY + Math.sin(elapsed * 0.52) * 0.13 - sculpture.rotation.y) * 0.1;
        sculpture.rotation.z = 0.12 + Math.sin(elapsed * 0.63) * 0.035;
        sculpture.position.y = 0.07 + Math.sin(elapsed * 0.92) * 0.095;
        sculpture.scale.y = 1 + power * 0.12 * Math.sin(elapsed * (1.5 + power));
        sound.update(elapsed, power, ratio);
        renderer.render(scene, camera);
      }
      function schedule() {
        const shouldPlay = active && visible && !document.hidden && !reducedMotion.matches && !lost;
        if (shouldPlay && !frame) frame = requestAnimationFrame(draw);
        if (!shouldPlay) {
          cancelAnimationFrame(frame);
          frame = 0;
          lastDraw = 0;
        }
      }
      function draw(now: number) {
        frame = 0;
        if (!lastDraw || now - lastDraw >= 1000 / 30 - 1) {
          elapsed += lastDraw ? Math.min(now - lastDraw, 50) / 1000 : 0;
          lastDraw = now;
          power += (activity.current - power) * 0.08;
          render();
        }
        schedule();
      }
      function resize() {
        const { clientWidth, clientHeight } = host;
        if (!clientWidth || !clientHeight || lost) return;
        renderer.setSize(clientWidth, clientHeight, false);
        camera.aspect = clientWidth / clientHeight;
        camera.position.z = Math.max(8.9, 12.15 / camera.aspect);
        camera.updateProjectionMatrix();
        render();
      }
      function point(event: PointerEvent) {
        if (event.pointerType === "touch") return;
        const bounds = host.getBoundingClientRect();
        targetX = (0.5 - (event.clientY - bounds.top) / bounds.height) * 0.21;
        targetY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.27;
      }
      function reset() { targetX = targetY = 0; }
      function loseContext() {
        lost = true;
        schedule();
        delete host.dataset.rendered;
        setReady(false);
      }

      const size = new ResizeObserver(resize);
      const viewport = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        schedule();
      });
      playback.current = (value) => {
        active = value;
        schedule();
      };
      host.append(renderer.domElement);
      size.observe(host);
      viewport.observe(host);
      document.addEventListener("visibilitychange", schedule);
      reducedMotion.addEventListener("change", schedule);
      host.addEventListener("pointermove", point);
      host.addEventListener("pointerleave", reset);
      renderer.domElement.addEventListener("webglcontextlost", loseContext);
      dispose = () => {
        lost = true;
        schedule();
        playback.current = null;
        size.disconnect();
        viewport.disconnect();
        document.removeEventListener("visibilitychange", schedule);
        reducedMotion.removeEventListener("change", schedule);
        host.removeEventListener("pointermove", point);
        host.removeEventListener("pointerleave", reset);
        renderer.domElement.removeEventListener("webglcontextlost", loseContext);
        sculpture.geometry.dispose();
        sculpture.material.forEach((material) => material.dispose());
        sound.points.geometry.dispose();
        sound.points.material.dispose();
        sound.filament.geometry.dispose();
        sound.filament.material.dispose();
        studio.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        delete host.dataset.rendered;
      };
      resize();
      host.dataset.rendered = "true";
      setReady(true);
      schedule();
    }

    void mount(element).catch(() => dispose?.());
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <>
      <div className="landing-waveform" ref={stage} aria-hidden="true" data-phase={phase}>
        <img className="waveform-still" src="/landing/glass-waveform.svg" alt="" fetchPriority="high" />
      </div>
      {ready && <button
        type="button"
        className="landing-motion-control"
        aria-label={playing ? pauseLabel : playLabel}
        title={playing ? pauseLabel : playLabel}
        onClick={() => {
          playback.current?.(!playing);
          setPlaying(!playing);
        }}
      >
        {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
      </button>}
    </>
  );
}
