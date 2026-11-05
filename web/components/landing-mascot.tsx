"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const portrait = "/landing/byte-mascot.webp";

export function LandingMascot({ pauseLabel, playLabel }: { pauseLabel: string; playLabel: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const playback = useRef<(playing: boolean) => void>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const element = stage.current;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || reducedMotion.matches) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;

    async function mount() {
      const T = await import("three");
      const texture = await new T.TextureLoader().loadAsync(portrait);
      if (cancelled || !element) {
        texture.dispose();
        return;
      }

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        texture.dispose();
        return;
      }

      texture.colorSpace = T.SRGBColorSpace;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.domElement.setAttribute("aria-hidden", "true");
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(35, 1, 0.1, 20);
      camera.position.z = 7;
      const model = new T.Group();
      scene.add(model);

      const portraitHeight = 4.2;
      const portraitWidth = portraitHeight * texture.image.width / texture.image.height;
      const plane = new T.PlaneGeometry(portraitWidth, portraitHeight, 32, 40);
      const vertices = plane.attributes.position;
      const neutral = new Float32Array(vertices.array);
      const paper = new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
      const character = new T.Mesh(plane, paper);
      model.add(character);

      const accents: Array<{ geometry: import("three").BufferGeometry; material: import("three").LineBasicMaterial }> = [];
      for (const depth of [0, 1]) {
        const points = Array.from({ length: 97 }, (_, index) => {
          const angle = (index / 96) * Math.PI * 2;
          return new T.Vector3(
            Math.cos(angle) * (2.34 + depth * 0.11),
            Math.sin(angle) * (0.72 + depth * 0.075) - 0.42,
            Math.sin(angle) * 0.9 - 1.1 - depth * 0.07,
          );
        });
        const geometry = new T.BufferGeometry().setFromPoints(points);
        const material = new T.LineBasicMaterial({
          color: 0xe4bb63,
          transparent: true,
          opacity: 0.30 - depth * 0.09,
        });
        const ring = new T.Line(geometry, material);
        ring.rotation.z = 0.32;
        scene.add(ring);
        accents.push({ geometry, material });
      }

      let frame = 0;
      let lastDraw = 0;
      let elapsed = 0;
      let targetX = 0;
      let targetY = 0;
      let resting = false;
      let active = true;
      let visible = true;
      model.position.y = -0.15;
      model.scale.setScalar(0.96);

      function pose(time: number) {
        const breath = Math.sin(time * 1.55);
        const attentiveTilt = Math.pow(Math.max(0, Math.sin(time * 0.75)), 6);
        const angle = 0.039 * attentiveTilt - 0.008;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        for (let index = 0; index < neutral.length; index += 3) {
          const x = neutral[index];
          const y = neutral[index + 1];
          // Ease from the neck into the head, with the tablet and desk held fixed.
          const head = T.MathUtils.smoothstep(y, 0.17, 0.65);
          const chest = T.MathUtils.smoothstep(y, -0.36, 0.24);
          const neckY = y - 0.32;
          vertices.array[index] = x + head * (x * (cosine - 1) - neckY * sine);
          vertices.array[index + 1] = y + head * (x * sine + neckY * (cosine - 1)) + chest * breath * 0.017;
        }
        vertices.needsUpdate = true;
      }

      function draw(now: number) {
        frame = 0;
        if (lastDraw && now - lastDraw < 1000 / 30 - 1) {
          schedule();
          return;
        }
        elapsed += lastDraw ? Math.min(now - lastDraw, 50) / 1000 : 0;
        lastDraw = now;
        model.rotation.x += (targetX - model.rotation.x) * 0.13;
        model.rotation.y += (targetY - model.rotation.y) * 0.13;
        model.position.y += (0 - model.position.y) * 0.1;
        model.scale.setScalar(model.scale.x + (1 - model.scale.x) * 0.1);
        pose(elapsed);
        renderer.render(scene, camera);
        schedule();
      }
      function schedule() {
        const shouldPlay = active && visible && !document.hidden && !reducedMotion.matches && !resting;
        if (shouldPlay && !frame) frame = requestAnimationFrame(draw);
        if (!shouldPlay) {
          cancelAnimationFrame(frame);
          frame = 0;
          lastDraw = 0;
        }
      }
      function resize() {
        if (!element) return;
        const { clientWidth, clientHeight } = element;
        if (!clientWidth || !clientHeight) return;
        renderer.setSize(clientWidth, clientHeight, false);
        camera.aspect = clientWidth / clientHeight;
        camera.position.z = 7 * Math.max(1, (portraitWidth / portraitHeight) / camera.aspect);
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
        schedule();
      }
      function point(event: PointerEvent) {
        if (!element || event.pointerType === "touch") return;
        const bounds = element.getBoundingClientRect();
        targetX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -0.065;
        targetY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.12;
        schedule();
      }
      function reset() {
        targetX = 0;
        targetY = 0;
        schedule();
      }
      function lost() {
        resting = true;
        schedule();
        setReady(false);
        if (element) delete element.dataset.rendered;
      }

      const observer = new ResizeObserver(resize);
      const visibility = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        schedule();
      });
      playback.current = (value) => {
        active = value;
        schedule();
      };
      element.append(renderer.domElement);
      observer.observe(element);
      visibility.observe(element);
      document.addEventListener("visibilitychange", schedule);
      reducedMotion.addEventListener("change", schedule);
      element.addEventListener("pointermove", point);
      element.addEventListener("pointerleave", reset);
      renderer.domElement.addEventListener("webglcontextlost", lost);
      resize();
      renderer.render(scene, camera);
      element.dataset.rendered = "true";
      setReady(true);
      dispose = () => {
        resting = true;
        schedule();
        playback.current = null;
        observer.disconnect();
        visibility.disconnect();
        document.removeEventListener("visibilitychange", schedule);
        reducedMotion.removeEventListener("change", schedule);
        element.removeEventListener("pointermove", point);
        element.removeEventListener("pointerleave", reset);
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        plane.dispose();
        paper.dispose();
        texture.dispose();
        for (const { geometry, material } of accents) {
          geometry.dispose();
          material.dispose();
        }
        renderer.dispose();
        renderer.domElement.remove();
        delete element.dataset.rendered;
      };
    }

    void mount().catch(() => {});
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <>
      <div className="landing-mascot" ref={stage} aria-hidden="true">
        <img className="mascot-still" src={portrait} alt="" fetchPriority="high" />
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
