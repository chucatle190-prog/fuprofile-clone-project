import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Prince Character Component
function Prince({ position, onAnimationComplete }: { position: [number, number, number], onAnimationComplete?: () => void }) {
  const group = useRef<THREE.Group>(null);
  const [animState, setAnimState] = useState('idle');
  
  // Placeholder geometry - replace with actual GLTF model
  return (
    <group ref={group} position={position}>
      {/* Prince body */}
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.3, 1, 4, 8]} />
        <meshStandardMaterial color="#4169E1" />
      </mesh>
      {/* Crown */}
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[0.3, 0.4, 8]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Hammer (when swinging) */}
      {animState === 'swing' && (
        <mesh position={[0.5, 1.5, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.1, 0.1, 1]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      )}
    </group>
  );
}

// Princess Character Component
function Princess({ position, isFreed }: { position: [number, number, number], isFreed: boolean }) {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current && isFreed) {
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
  return (
    <group ref={group} position={position}>
      {/* Princess body */}
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.3, 1, 4, 8]} />
        <meshStandardMaterial color="#FF69B4" />
      </mesh>
      {/* Crown */}
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[0.25, 0.3, 8]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Sparkles when freed */}
      {isFreed && (
        <pointLight position={[0, 2, 0]} color="#FFD700" intensity={2} distance={5} />
      )}
    </group>
  );
}

// Candy Cage Component
function CandyCage({ position, isBroken }: { position: [number, number, number], isBroken: boolean }) {
  if (isBroken) return null;
  
  return (
    <group position={position}>
      {/* Cage bars */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 0.8;
        const z = Math.sin(angle) * 0.8;
        return (
          <mesh key={i} position={[x, 1.5, z]}>
            <cylinderGeometry args={[0.05, 0.05, 3]} />
            <meshStandardMaterial 
              color="#FF69B4" 
              transparent 
              opacity={0.6}
              metalness={0.5}
            />
          </mesh>
        );
      })}
      {/* Top and bottom rings */}
      <mesh position={[0, 3, 0]}>
        <torusGeometry args={[0.8, 0.1, 16, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.8, 0.1, 16, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} />
      </mesh>
    </group>
  );
}

// Candy Pile Component
function CandyPile({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base pile */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 1.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.random() * 0.5;
        const scale = 0.2 + Math.random() * 0.2;
        const colors = ['#FF69B4', '#FFD700', '#87CEEB', '#98FB98', '#DDA0DD'];
        
        return (
          <mesh 
            key={i} 
            position={[x, y, z]} 
            scale={scale}
            rotation={[Math.random(), Math.random(), Math.random()]}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial 
              color={colors[Math.floor(Math.random() * colors.length)]}
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Particle System for Effects
function ParticleEffect({ position, active }: { position: [number, number, number], active: boolean }) {
  const particles = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (particles.current && active) {
      particles.current.rotation.y += 0.01;
      const positions = particles.current.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.02;
        if (positions[i] > 3) positions[i] = 0;
      }
      particles.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  if (!active) return null;
  
  const count = 100;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 2;
    positions[i + 1] = Math.random() * 3;
    positions[i + 2] = (Math.random() - 0.5) * 2;
  }
  
  return (
    <points ref={particles} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#FFD700" transparent opacity={0.8} />
    </points>
  );
}

// Main Scene Component
function Scene({ 
  gameState, 
  onRescueComplete 
}: { 
  gameState: 'playing' | 'rescuing' | 'rescued',
  onRescueComplete?: () => void 
}) {
  const [cageBroken, setCageBroken] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  
  useEffect(() => {
    if (gameState === 'rescuing') {
      setTimeout(() => {
        setCageBroken(true);
        setShowParticles(true);
        onRescueComplete?.();
      }, 2000);
    }
  }, [gameState, onRescueComplete]);
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
      />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, 10, -5]} intensity={0.5} color="#FFB6C1" />
      
      <Environment preset="sunset" />
      
      {/* Candy Pile with Prince */}
      <CandyPile position={[-3, 0, 0]} />
      <Prince position={[-3, 1, 0]} />
      
      {/* Princess in Cage */}
      <Princess position={[3, 0, 0]} isFreed={cageBroken} />
      <CandyCage position={[3, 0, 0]} isBroken={cageBroken} />
      
      {/* Particle effects */}
      <ParticleEffect position={[3, 0, 0]} active={showParticles} />
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#FFF0F5" />
      </mesh>
    </>
  );
}

// Main Three.js Scene Container
export default function ThreeScene({ 
  gameState = 'playing',
  onRescueComplete 
}: { 
  gameState?: 'playing' | 'rescuing' | 'rescued',
  onRescueComplete?: () => void 
}) {
  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0
    }}>
      <Canvas shadows>
        <Scene gameState={gameState} onRescueComplete={onRescueComplete} />
      </Canvas>
    </div>
  );
}
