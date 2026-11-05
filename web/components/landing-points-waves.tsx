"use client";

// Adapted from three.js examples/webgl_points_waves.html. See the bundled MIT notice.
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, DynamicDrawUsage, type BufferAttribute } from "three";

const separation = 100;
const amountX = 50;
const amountY = 50;
const vertexShader = `
  attribute float scale;
  uniform float pointScale;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = scale * (300.0 / -mvPosition.z) * pointScale;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const fragmentShader = `
  uniform vec3 color;
  void main() {
    if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function updateWave(positions: Float32Array, scales: Float32Array, count: number) {
  let index = 0;
  for (let x = 0; x < amountX; x++) {
    for (let z = 0; z < amountY; z++) {
      const waveX = Math.sin((x + count) * 0.3);
      const waveZ = Math.sin((z + count) * 0.5);
      positions[index * 3 + 1] = waveX * 50 + waveZ * 50;
      scales[index] = (waveX + 1) * 20 + (waveZ + 1) * 20;
      index++;
    }
  }
}

function PointsWaves() {
  const positionAttribute = useRef<BufferAttribute>(null);
  const scaleAttribute = useRef<BufferAttribute>(null);
  const count = useRef(0);
  const { positions, scales, uniforms } = useMemo(() => {
    const positions = new Float32Array(amountX * amountY * 3);
    const scales = new Float32Array(amountX * amountY);
    for (let x = 0; x < amountX; x++) {
      for (let z = 0; z < amountY; z++) {
        const index = (x * amountY + z) * 3;
        positions[index] = (x - amountX / 2) * separation;
        positions[index + 2] = (z - amountY / 2) * separation;
      }
    }
    updateWave(positions, scales, 0);
    return { positions, scales, uniforms: { color: { value: new Color(0xe2d0ae) }, pointScale: { value: 1 } } };
  }, []);

  useFrame(({ size }, delta) => {
    if (!positionAttribute.current || !scaleAttribute.current) return;
    count.current += Math.min(delta, 0.05) * 6;
    updateWave(positions, scales, count.current);
    uniforms.pointScale.value = size.width <= 680 ? 0.46 : 0.82;
    positionAttribute.current.needsUpdate = true;
    scaleAttribute.current.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute ref={positionAttribute} attach="attributes-position" args={[positions, 3]} usage={DynamicDrawUsage} />
        <bufferAttribute ref={scaleAttribute} attach="attributes-scale" args={[scales, 1]} usage={DynamicDrawUsage} />
      </bufferGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </points>
  );
}

export default function LandingPointsWaves({ active }: { active: boolean }) {
  return (
    <Canvas
      fallback={null}
      frameloop={active ? "always" : "demand"}
      dpr={1}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      camera={{ position: [0, 410, 2780], fov: 43, near: 1, far: 10000 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, -300)}
    >
      <PointsWaves />
    </Canvas>
  );
}
