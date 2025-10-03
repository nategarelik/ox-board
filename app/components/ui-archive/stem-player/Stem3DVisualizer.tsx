"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Box, Text } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import { GestureData } from "../../../hooks/useGestures";

interface Stem3DVisualizerProps {
  gestureData?: GestureData | null;
  currentTrack?: any;
  playbackState: "playing" | "paused" | "stopped" | "loading";
  className?: string;
}

interface StemCubeProps {
  stem: {
    id: string;
    name: string;
    volume: number;
    color: string;
    position: [number, number, number];
  };
  isPlaying: boolean;
  gestureData?: GestureData | null;
}

// Individual stem cube component
function StemCube({ stem, isPlaying, gestureData }: StemCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animate based on playback state and gesture input
  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    // Base animation
    meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
    meshRef.current.rotation.y = Math.sin(time * 0.3) * 0.1;

    // Volume-based scaling
    const targetScale = isPlaying
      ? 1 + stem.volume * 0.5 + Math.sin(time * 2) * stem.volume * 0.2
      : 0.8;

    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1,
    );

    // Gesture reactivity
    if (gestureData && gestureData.confidence > 0.7) {
      const gestureIntensity = gestureData.confidence * stem.volume;
      meshRef.current.position.y =
        stem.position[1] + Math.sin(time * 3) * gestureIntensity * 0.5;
    }
  });

  const handlePointerOver = () => setHovered(true);
  const handlePointerOut = () => setHovered(false);

  return (
    <group position={stem.position}>
      <Box
        ref={meshRef}
        args={[2, 2, 2]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          color={hovered ? "#ffffff" : stem.color}
          emissive={stem.color}
          emissiveIntensity={isPlaying ? 0.3 : 0.1}
          roughness={0.2}
          metalness={0.8}
        />
      </Box>

      {/* Stem label */}
      <Text
        position={[0, -3, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {stem.name}
      </Text>

      {/* Volume indicator ring */}
      <mesh position={[0, 0, 1.2]}>
        <ringGeometry args={[1.8, 2, 32]} />
        <meshBasicMaterial
          color={stem.color}
          transparent
          opacity={isPlaying ? stem.volume : 0.3}
        />
      </mesh>
    </group>
  );
}

// Particle system for beat visualization
function ParticleSystem({
  isPlaying,
  gestureData,
}: {
  isPlaying: boolean;
  gestureData?: GestureData | null;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 100;

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Random spherical distribution
      const radius = Math.random() * 10 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Color based on position
      colors[i3] = Math.random();
      colors[i3 + 1] = Math.random();
      colors[i3 + 2] = 1;
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (!particlesRef.current || !isPlaying) return;

    const time = state.clock.getElapsedTime();
    const positions = particlesRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Animate particles based on music
      const speed = 0.5 + Math.sin(time * 2 + i * 0.1) * 0.3;
      positions[i3] *= 1 + speed * 0.01;
      positions[i3 + 1] *= 1 + speed * 0.01;
      positions[i3 + 2] *= 1 + speed * 0.01;

      // Reset particles that get too far
      const distance = Math.sqrt(
        positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2,
      );
      if (distance > 15) {
        positions[i3] *= 0.1;
        positions[i3 + 1] *= 0.1;
        positions[i3 + 2] *= 0.1;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} vertexColors transparent opacity={0.6} />
    </points>
  );
}

// Main 3D scene component
function Scene({
  gestureData,
  currentTrack,
  playbackState,
}: Stem3DVisualizerProps) {
  const { camera } = useThree();

  // Mock stem data if none provided
  const stems = useMemo(() => {
    if (currentTrack?.stems) return currentTrack.stems;

    return [
      {
        id: "vocals",
        name: "Vocals",
        volume: 0.8,
        color: "#ec4899",
        position: [-4, 2, 0] as [number, number, number],
      },
      {
        id: "drums",
        name: "Drums",
        volume: 0.9,
        color: "#f97316",
        position: [4, 2, 0] as [number, number, number],
      },
      {
        id: "bass",
        name: "Bass",
        volume: 0.7,
        color: "#8b5cf6",
        position: [-4, -2, 0] as [number, number, number],
      },
      {
        id: "melody",
        name: "Melody",
        volume: 0.85,
        color: "#06b6d4",
        position: [4, -2, 0] as [number, number, number],
      },
    ];
  }, [currentTrack]);

  // Camera animation based on gestures
  useFrame(() => {
    if (gestureData && gestureData.confidence > 0.7) {
      const gestureInfluence = gestureData.confidence * 0.1;

      // Subtle camera movement based on hand position
      if (gestureData.leftHand && gestureData.leftHand[0]) {
        const hand = gestureData.leftHand[0];
        camera.position.x += (hand.x - 0.5) * gestureInfluence;
        camera.position.y += (hand.y - 0.5) * gestureInfluence;
      }
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#06b6d4" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.6}
        color="#ec4899"
        castShadow
      />

      {/* Stem Cubes */}
      {stems.map((stem: any, index: number) => (
        <StemCube
          key={stem.id}
          stem={stem}
          isPlaying={playbackState === "playing"}
          gestureData={gestureData}
        />
      ))}

      {/* Particle System */}
      <ParticleSystem
        isPlaying={playbackState === "playing"}
        gestureData={gestureData}
      />

      {/* Central hub */}
      <Sphere args={[0.5]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#333333"
          emissiveIntensity={playbackState === "playing" ? 0.5 : 0.2}
        />
      </Sphere>

      {/* Orbital rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6, 6.1, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
      </mesh>

      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[8, 8.1, 64]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.1} />
      </mesh>

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        autoRotate={
          playbackState === "playing" &&
          (!gestureData || gestureData.confidence < 0.5)
        }
        autoRotateSpeed={0.5}
      />
    </>
  );
}

// Audio frequency bars (2D overlay)
function FrequencyBars({
  isPlaying,
  gestureData,
}: {
  isPlaying: boolean;
  gestureData?: GestureData | null;
}) {
  const barsRef = useRef<THREE.Group>(null);
  const barCount = 32;

  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => ({
      id: i,
      position: [(i - barCount / 2) * 0.2, 0, -8] as [number, number, number],
      baseHeight: 0.1,
    }));
  }, []);

  useFrame((state) => {
    if (!barsRef.current || !isPlaying) return;

    const time = state.clock.getElapsedTime();

    barsRef.current.children.forEach((bar, i) => {
      const mesh = bar as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;

      // Animate height based on "audio" frequency
      const frequency = (Math.sin(time * 2 + i * 0.1) + 1) / 2;
      const targetHeight = bars[i].baseHeight + frequency * 3;

      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, targetHeight, 0.1);

      // Color based on height
      const intensity = mesh.scale.y / 3;
      material.color.setHSL(0.6 - intensity * 0.2, 0.8, 0.6);
    });
  });

  return (
    <group ref={barsRef}>
      {bars.map((bar) => (
        <Box
          key={bar.id}
          position={bar.position}
          args={[0.1, bar.baseHeight, 0.1]}
        >
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.8} />
        </Box>
      ))}
    </group>
  );
}

export default function Stem3DVisualizer({
  gestureData,
  currentTrack,
  playbackState,
  className = "",
}: Stem3DVisualizerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading Three.js scene
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`relative w-full h-full bg-black rounded-lg overflow-hidden ${className}`}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading 3D Visualizer...</p>
          </div>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ opacity: isLoaded ? 1 : 0 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Scene
          gestureData={gestureData}
          currentTrack={currentTrack}
          playbackState={playbackState}
        />
        <FrequencyBars
          isPlaying={playbackState === "playing"}
          gestureData={gestureData}
        />
      </Canvas>

      {/* 3D Controls Overlay */}
      <div className="absolute top-4 right-4 space-y-2">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/70 space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Drag to rotate</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Scroll to zoom</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Auto-rotate when playing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gesture Influence Indicator */}
      {gestureData && gestureData.confidence > 0.7 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-4 left-4 bg-cyan-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-cyan-500/30"
        >
          <div className="flex items-center space-x-2 text-cyan-400">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium">Gesture Active</span>
            <span className="text-xs text-white/60">
              {Math.round(gestureData.confidence * 100)}%
            </span>
          </div>
        </motion.div>
      )}

      {/* Playback State Indicator */}
      <div className="absolute top-4 left-4">
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            playbackState === "playing"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              playbackState === "playing"
                ? "bg-green-400 animate-pulse"
                : "bg-gray-400"
            }`}
          />
          <span className="font-medium">
            {playbackState === "playing"
              ? "Playing"
              : playbackState === "paused"
                ? "Paused"
                : playbackState === "stopped"
                  ? "Stopped"
                  : "Loading"}
          </span>
        </div>
      </div>
    </div>
  );
}
