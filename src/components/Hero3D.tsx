"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, OrbitControls } from "@react-three/drei";

function AnimatedSphere() {
  const ref = useRef<any>(null);
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.2;
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[1.2, 64, 64]} />
      <meshStandardMaterial metalness={0.8} roughness={0.2} color={`#60a5fa`} transparent opacity={0.9} />
    </mesh>
  );
}

export default function Hero3D() {
  return (
    <div style={{ width: "100%", height: 360 }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <AnimatedSphere />
          <Float rotationIntensity={0.6} speed={2} floatIntensity={1}>
            <mesh position={[2, 0.6, 0]} scale={[0.8, 0.8, 0.8]}>
              <boxGeometry args={[1.4, 0.9, 0.2]} />
              <meshStandardMaterial color={`#34d399`} metalness={0.4} roughness={0.3} opacity={0.3} />
            </mesh>
          </Float>
        </Suspense>
        <OrbitControls enableZoom enablePan enableRotate />
      </Canvas>
    </div>
  );
}
