"use client";

// Glass Flower by Paul Henschel, from pmndrs/examples. See the bundled MIT notice.
// Original inspiration: https://twitter.com/igor_3000A/status/1646542441112297474

import * as THREE from "three";
import { Component, Suspense, useEffect, useState, type ReactNode } from "react";
import {
  Canvas,
  useFrame,
  useLoader,
  type ThreeElements,
} from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  OrbitControls,
  MeshTransmissionMaterial,
  useGLTF,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  LUT,
  BrightnessContrast,
  HueSaturation,
  ToneMapping,
} from "@react-three/postprocessing";
import {
  LUTCubeLoader,
  ToneMappingMode,
  type LookupTexture,
} from "postprocessing";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

const assets = "/landing/reference";

type GLTFResult = GLTF & {
  nodes: {
    petals: THREE.Mesh;
    Sphere: THREE.Mesh;
    Sphere001: THREE.Mesh;
  };
};

function useSceneEnvironment() {
  const [environment, setEnvironment] = useState<THREE.Texture | null>(null);
  useFrame(({ scene }) => {
    if (scene.environment !== environment) setEnvironment(scene.environment);
  });
  return environment;
}

function Model(props: ThreeElements["group"]) {
  const { nodes } = useGLTF(`${assets}/flower-transformed.glb`, `${assets}/draco/`) as unknown as GLTFResult;
  const environment = useSceneEnvironment();
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.petals.geometry}>
        <MeshTransmissionMaterial
          backside
          backsideThickness={1}
          backsideResolution={128}
          backsideEnvMapIntensity={0.45}
          samples={6}
          resolution={256}
          thickness={0.2}
          roughness={0.16}
          anisotropicBlur={0.1}
          iridescence={1}
          iridescenceIOR={1}
          iridescenceThicknessMinimum={0}
          iridescenceThicknessMaximum={1400}
          clearcoat={0.8}
          clearcoatRoughness={0.23}
          emissive="#183858"
          emissiveIntensity={0.28}
          envMap={environment}
          envMapIntensity={0.34}
        />
        <mesh geometry={nodes.Sphere.geometry}>
          <MeshTransmissionMaterial
            samples={3}
            resolution={192}
            roughness={0.12}
            envMapIntensity={0.6}
            thickness={-1}
            anisotropy={0.25}
          />
        </mesh>
      </mesh>
      <mesh geometry={nodes.Sphere001.geometry}>
        <meshStandardMaterial
          toneMapped={false}
          emissive="hotpink"
          color="red"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

class SceneBoundary extends Component<{ children: ReactNode; onReady: (ready: boolean) => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onReady(false); }

  render() { return this.state.failed ? null : this.props.children; }
}

function FlowerScene({ active, onReady }: { active: boolean; onReady: (ready: boolean) => void }) {
  // LUTCubeLoader's `loadAsync` isn't typed beyond the base Loader's `unknown`, but it
  // always resolves to a LookupTexture (see its `load` return type in "postprocessing").
  const texture = useLoader(LUTCubeLoader, `${assets}/F-6800-STD.cube`) as unknown as LookupTexture;
  useEffect(() => {
    onReady(true);
    return () => onReady(false);
  }, [onReady]);
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <Model position={[0, -0.25, 0]} />
      <OrbitControls autoRotate={active} autoRotateSpeed={0.45} enableZoom={false} enablePan={false} />
      <Environment
        files={`${assets}/blue_photo_studio_1k.hdr`}
        resolution={256}
        environmentIntensity={0.68}
      >
        <group rotation={[0, 0, 1]}>
          <Lightformer
            form="circle"
            intensity={1.2}
            position={[0, 10, -10]}
            scale={20}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
          />
          <Lightformer
            intensity={0.1}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
            position={[-5, 1, -1]}
            rotation-y={Math.PI / 2}
            scale={[50, 10, 1]}
          />
          <Lightformer
            intensity={0.1}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
            position={[10, 1, 0]}
            rotation-y={-Math.PI / 2}
            scale={[50, 10, 1]}
          />
          <Lightformer
            color="white"
            intensity={0.2}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
            position={[0, 1, 0]}
            scale={[10, 100, 1]}
          />
        </group>
      </Environment>
      {/* `disableNormalPass` no longer exists in this postprocessing version; the normal pass is already disabled by default */}
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={0.65} />
        <LUT lut={texture} />
        <BrightnessContrast brightness={0} contrast={0.04} />
        <HueSaturation hue={0} saturation={-0.25} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
}

export default function LandingGlassFlower({ active, onReady }: { active: boolean; onReady: (ready: boolean) => void }) {
  return (
    <SceneBoundary onReady={onReady}>
      <Canvas
        fallback={null}
        dpr={[1, 1.35]}
        style={{ position: "absolute", inset: 0 }}
        frameloop={active ? "always" : "demand"}
        gl={{ antialias: false, alpha: true }}
        camera={{ position: [0, 2.5, 5], fov: 35 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping;
          gl.domElement.addEventListener("webglcontextlost", () => onReady(false), { once: true });
        }}
      >
        <Suspense fallback={null}>
          <FlowerScene active={active} onReady={onReady} />
        </Suspense>
      </Canvas>
    </SceneBoundary>
  );
}
