"use client";

import { useEffect, useRef } from "react";

const portrait = "/landing/byte-mascot.webp";

export function LandingMascot() {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = stage.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
      const plane = new T.PlaneGeometry(portraitWidth, portraitHeight);
      const paper = new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
      const character = new T.Mesh(plane, paper);
      model.add(character);

      const accents: Array<{ geometry: import("three").BufferGeometry; material: import("three").LineBasicMaterial }> = [];
      for (const depth of [0, 1, 2]) {
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
          opacity: 0.43 - depth * 0.12,
        });
        const ring = new T.Line(geometry, material);
        ring.rotation.z = 0.32;
        scene.add(ring);
        accents.push({ geometry, material });
      }

      let frame = 0;
      let targetX = 0;
      let targetY = 0;
      let resting = false;
      model.position.y = -0.15;
      model.scale.setScalar(0.96);
      function draw() {
        frame = 0;
        model.rotation.x += (targetX - model.rotation.x) * 0.13;
        model.rotation.y += (targetY - model.rotation.y) * 0.13;
        model.position.y += (0 - model.position.y) * 0.1;
        model.scale.setScalar(model.scale.x + (1 - model.scale.x) * 0.1);
        renderer.render(scene, camera);
        if (!resting && (Math.abs(targetX - model.rotation.x) + Math.abs(targetY - model.rotation.y)
          + Math.abs(model.position.y) + Math.abs(1 - model.scale.x) > 0.002)) {
          frame = requestAnimationFrame(draw);
        }
      }
      function schedule() {
        if (!frame && !resting) frame = requestAnimationFrame(draw);
      }
      function resize() {
        if (!element) return;
        const { clientWidth, clientHeight } = element;
        if (!clientWidth || !clientHeight) return;
        renderer.setSize(clientWidth, clientHeight, false);
        camera.aspect = clientWidth / clientHeight;
        camera.position.z = 7 * Math.max(1, (portraitWidth / portraitHeight) / camera.aspect);
        camera.updateProjectionMatrix();
        schedule();
      }
      function point(event: PointerEvent) {
        if (!element || event.pointerType === "touch") return;
        const bounds = element.getBoundingClientRect();
        targetX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -0.14;
        targetY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.24;
        schedule();
      }
      function reset() {
        targetX = 0;
        targetY = 0;
        schedule();
      }
      function lost() {
        resting = true;
        cancelAnimationFrame(frame);
        if (element) delete element.dataset.rendered;
      }

      const observer = new ResizeObserver(resize);
      element.append(renderer.domElement);
      observer.observe(element);
      element.addEventListener("pointermove", point);
      element.addEventListener("pointerleave", reset);
      renderer.domElement.addEventListener("webglcontextlost", lost);
      resize();
      renderer.render(scene, camera);
      element.dataset.rendered = "true";
      dispose = () => {
        resting = true;
        cancelAnimationFrame(frame);
        observer.disconnect();
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
    <div className="landing-mascot" ref={stage} aria-hidden="true">
      <img className="mascot-still" src={portrait} alt="" fetchPriority="high" />
    </div>
  );
}
