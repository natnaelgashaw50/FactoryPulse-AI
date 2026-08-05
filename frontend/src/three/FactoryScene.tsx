import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export type TwinMachine = {
  id: number; name: string; status: string;
  position: { x: number; y: number; z: number };
};

const STATUS_COLOR: Record<string, number> = {
  healthy: 0x46d7c7,
  warning: 0xf2a93b,
  critical: 0xe5484d,
  healing: 0xf2a93b,
  offline: 0x4e5a67,
};

/**
 * Minimal Three.js "digital twin": a factory floor grid with one box per
 * machine, colored by live status. Orbit-style drag-to-rotate + wheel-to-zoom
 * implemented by hand (no OrbitControls dependency) and click-to-select via
 * raycasting. Swap the box geometry for real GLTF machine models later —
 * the machineId -> mesh map (meshMap) is what a loader would populate.
 */
export default function FactoryScene({
  machines,
  onSelect,
}: {
  machines: TwinMachine[];
  onSelect?: (id: number) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e13);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    let radius = 18, theta = Math.PI / 4, phi = Math.PI / 3.2;
    const updateCamera = () => {
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(4, 0, 2.5);
    };
    updateCamera();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    const grid = new THREE.GridHelper(30, 30, 0x232b35, 0x161d25);
    scene.add(grid);

    const meshMap = new Map<number, THREE.Mesh>();
    machines.forEach((m) => {
      const geo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
      const mat = new THREE.MeshStandardMaterial({ color: STATUS_COLOR[m.status] ?? 0x4e5a67 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(m.position.x, 0.8, m.position.z);
      mesh.userData.machineId = m.id;
      scene.add(mesh);
      meshMap.set(m.id, mesh);
    });

    // drag-to-rotate
    let dragging = false, lastX = 0, lastY = 0;
    const onDown = (e: MouseEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY; };
    const onUp = () => { dragging = false; };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      theta -= (e.clientX - lastX) * 0.006;
      phi = Math.min(Math.PI / 2.05, Math.max(0.3, phi - (e.clientY - lastY) * 0.006));
      lastX = e.clientX; lastY = e.clientY;
      updateCamera();
    };
    const onWheel = (e: WheelEvent) => {
      radius = Math.min(35, Math.max(6, radius + e.deltaY * 0.02));
      updateCamera();
    };
    const raycaster = new THREE.Raycaster();
    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Array.from(meshMap.values()));
      if (hits.length && onSelect) onSelect(hits[0].object.userData.machineId);
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("wheel", onWheel);
    renderer.domElement.addEventListener("click", onClick);

    let frame: number;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      meshMap.forEach((mesh) => (mesh.rotation.y += 0.002));
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("click", onClick);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [machines, onSelect]);

  return <div ref={mountRef} className="w-full h-full" />;
}
