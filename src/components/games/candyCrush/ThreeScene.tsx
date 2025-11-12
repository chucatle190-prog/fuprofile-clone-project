import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Prince Character Component with Custom Animations
function Prince({ 
  position, 
  animationState = 'idle',
  onAnimationComplete 
}: { 
  position: [number, number, number], 
  animationState?: 'idle' | 'walk' | 'swingHammer',
  onAnimationComplete?: () => void 
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const crownRef = useRef<THREE.Mesh>(null);
  const hammerRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [currentAnim, setCurrentAnim] = useState(animationState);

  useEffect(() => {
    if (!groupRef.current) return;

    // Create animation mixer
    mixerRef.current = new THREE.AnimationMixer(groupRef.current);

    // Create keyframe tracks for idle animation
    const idleTimes = [0, 0.5, 1.0];
    const idleValues = [
      0, 0, 0,      // start position
      0, 0.1, 0,    // up
      0, 0, 0       // back to start
    ];
    const idlePositionTrack = new THREE.VectorKeyframeTrack(
      '.position',
      idleTimes,
      idleValues
    );
    
    const idleRotationValues = [
      0, 0, 0, 1,           // quaternion start
      0, 0, 0.05, 0.999,    // slight rotation
      0, 0, 0, 1            // back
    ];
    const idleRotationTrack = new THREE.QuaternionKeyframeTrack(
      '.rotation',
      idleTimes,
      idleRotationValues
    );

    const idleClip = new THREE.AnimationClip('idle', 1.0, [
      idlePositionTrack,
      idleRotationTrack
    ]);

    // Create walk animation
    const walkTimes = [0, 0.25, 0.5, 0.75, 1.0];
    const walkValues = [
      0, 0, 0,
      0, 0.15, 0,
      0, 0, 0,
      0, 0.15, 0,
      0, 0, 0
    ];
    const walkPositionTrack = new THREE.VectorKeyframeTrack(
      '.position',
      walkTimes,
      walkValues
    );
    
    const walkRotationValues = [
      0, 0, 0, 1,
      0, 0, 0.1, 0.995,
      0, 0, 0, 1,
      0, 0, -0.1, 0.995,
      0, 0, 0, 1
    ];
    const walkRotationTrack = new THREE.QuaternionKeyframeTrack(
      '.rotation',
      walkTimes,
      walkRotationValues
    );

    const walkClip = new THREE.AnimationClip('walk', 1.0, [
      walkPositionTrack,
      walkRotationTrack
    ]);

    // Create swing hammer animation
    const swingTimes = [0, 0.3, 0.6, 1.0];
    const swingScaleValues = [
      1, 1, 1,
      1.1, 1.1, 1.1,
      0.95, 0.95, 0.95,
      1, 1, 1
    ];
    const swingScaleTrack = new THREE.VectorKeyframeTrack(
      '.scale',
      swingTimes,
      swingScaleValues
    );

    const swingRotationValues = [
      0, 0, 0, 1,
      0, 0, -0.3, 0.954,
      0, 0, 0.2, 0.98,
      0, 0, 0, 1
    ];
    const swingRotationTrack = new THREE.QuaternionKeyframeTrack(
      '.rotation',
      swingTimes,
      swingRotationValues
    );

    const swingClip = new THREE.AnimationClip('swingHammer', 1.0, [
      swingScaleTrack,
      swingRotationTrack
    ]);

    // Store clips
    const clips = { idle: idleClip, walk: walkClip, swingHammer: swingClip };

    // Play animation based on state
    const playAnimation = (name: string) => {
      if (!mixerRef.current) return;
      
      mixerRef.current.stopAllAction();
      const clip = clips[name as keyof typeof clips];
      if (clip) {
        const action = mixerRef.current.clipAction(clip);
        action.setLoop(name === 'swingHammer' ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = true;
        action.play();

        if (name === 'swingHammer') {
          mixerRef.current.addEventListener('finished', () => {
            onAnimationComplete?.();
          });
        }
      }
    };

    playAnimation(currentAnim);

    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [currentAnim, onAnimationComplete]);

  useEffect(() => {
    setCurrentAnim(animationState);
  }, [animationState]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Add breathing effect
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }

    // Crown sparkle
    if (crownRef.current) {
      crownRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }

    // Hammer swing animation
    if (hammerRef.current && currentAnim === 'swingHammer') {
      const swingAngle = Math.sin(state.clock.elapsedTime * 8) * Math.PI / 3;
      hammerRef.current.rotation.z = swingAngle;
      hammerRef.current.position.y = 1.5 + Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.3;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Prince body */}
      <mesh ref={bodyRef} position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial 
          color="#4169E1" 
          metalness={0.3}
          roughness={0.4}
          emissive="#1E3A8A"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Cape */}
      <mesh position={[0, 1.2, -0.25]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial 
          color="#DC2626" 
          metalness={0.5}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color="#FFD1A4" 
          roughness={0.6}
        />
      </mesh>

      {/* Crown */}
      <mesh ref={crownRef} position={[0, 2.35, 0]} castShadow>
        <coneGeometry args={[0.28, 0.4, 8]} />
        <meshStandardMaterial 
          color="#FFD700" 
          metalness={1}
          roughness={0.1}
          emissive="#FFA500"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Crown jewels */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.25,
              2.35,
              Math.sin(angle) * 0.25
            ]}
            castShadow
          >
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial 
              color={i % 2 === 0 ? "#FF0000" : "#0000FF"}
              metalness={0.9}
              roughness={0.1}
              emissive={i % 2 === 0 ? "#FF0000" : "#0000FF"}
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}

      {/* Hammer */}
      <group ref={hammerRef} position={[0.5, 1.5, 0]} rotation={[0, 0, -Math.PI / 4]}>
        {/* Handle */}
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
        {/* Hammer head */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.2]} />
          <meshStandardMaterial 
            color="#888888" 
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Sparkles around prince */}
      <pointLight position={[0, 2, 0]} color="#FFD700" intensity={0.5} distance={3} />
    </group>
  );
}

// Princess Character Component with Custom Animations
function Princess({ 
  position, 
  isFreed,
  animationState = 'idle'
}: { 
  position: [number, number, number], 
  isFreed: boolean,
  animationState?: 'idle' | 'cheer'
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const crownRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [currentAnim, setCurrentAnim] = useState(animationState);
  const [hearts, setHearts] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    if (!groupRef.current) return;

    mixerRef.current = new THREE.AnimationMixer(groupRef.current);

    // Idle animation
    const idleTimes = [0, 0.6, 1.2];
    const idleValues = [
      0, 0, 0,
      0, 0.08, 0,
      0, 0, 0
    ];
    const idlePositionTrack = new THREE.VectorKeyframeTrack(
      '.position',
      idleTimes,
      idleValues
    );

    const idleClip = new THREE.AnimationClip('idle', 1.2, [idlePositionTrack]);

    // Cheer animation
    const cheerTimes = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const cheerValues = [
      0, 0, 0,
      0, 0.3, 0,
      0, 0.1, 0,
      0, 0.4, 0,
      0, 0.15, 0,
      0, 0.2, 0
    ];
    const cheerPositionTrack = new THREE.VectorKeyframeTrack(
      '.position',
      cheerTimes,
      cheerValues
    );

    const cheerScaleValues = [
      1, 1, 1,
      1.1, 1.1, 1.1,
      0.95, 0.95, 0.95,
      1.15, 1.15, 1.15,
      0.9, 0.9, 0.9,
      1, 1, 1
    ];
    const cheerScaleTrack = new THREE.VectorKeyframeTrack(
      '.scale',
      cheerTimes,
      cheerScaleValues
    );

    const cheerClip = new THREE.AnimationClip('cheer', 1.0, [
      cheerPositionTrack,
      cheerScaleTrack
    ]);

    const clips = { idle: idleClip, cheer: cheerClip };

    const playAnimation = (name: string) => {
      if (!mixerRef.current) return;
      
      mixerRef.current.stopAllAction();
      const clip = clips[name as keyof typeof clips];
      if (clip) {
        const action = mixerRef.current.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      }
    };

    playAnimation(currentAnim);

    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [currentAnim]);

  useEffect(() => {
    setCurrentAnim(isFreed ? 'cheer' : animationState);
  }, [isFreed, animationState]);

  // Generate hearts when freed
  useEffect(() => {
    if (isFreed) {
      const newHearts: THREE.Vector3[] = [];
      for (let i = 0; i < 20; i++) {
        newHearts.push(
          new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 2,
            (Math.random() - 0.5) * 2
          )
        );
      }
      setHearts(newHearts);
    }
  }, [isFreed]);
  
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Breathing
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }

    // Crown sparkle
    if (crownRef.current) {
      crownRef.current.rotation.y = state.clock.elapsedTime * 2;
    }

    // Floating when freed
    if (groupRef.current && isFreed) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }

    // Arms waving when cheering
    if (isFreed || currentAnim === 'cheer') {
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 6) * 0.8 + 0.5;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 6 + Math.PI) * 0.8 - 0.5;
      }
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      {/* Princess body/dress */}
      <mesh ref={bodyRef} position={[0, 0.8, 0]} castShadow>
        <coneGeometry args={[0.5, 1.5, 8]} />
        <meshStandardMaterial 
          color="#FF69B4" 
          metalness={0.4}
          roughness={0.3}
          emissive="#FF1493"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Dress details */}
      <mesh position={[0, 0.4, 0]}>
        <torusGeometry args={[0.35, 0.05, 8, 16]} />
        <meshStandardMaterial color="#FFB6C1" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <torusGeometry args={[0.28, 0.05, 8, 16]} />
        <meshStandardMaterial color="#FFB6C1" metalness={0.5} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#FFE4C4" roughness={0.6} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 1.9, -0.15]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.7}
        />
      </mesh>

      {/* Crown */}
      <mesh ref={crownRef} position={[0, 2.1, 0]} castShadow>
        <coneGeometry args={[0.25, 0.3, 8]} />
        <meshStandardMaterial 
          color="#FFD700" 
          metalness={1}
          roughness={0.05}
          emissive="#FFD700"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Crown jewels */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.22,
              2.1,
              Math.sin(angle) * 0.22
            ]}
          >
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial 
              color="#FF69B4"
              metalness={0.9}
              roughness={0.1}
              emissive="#FF69B4"
              emissiveIntensity={0.6}
            />
          </mesh>
        );
      })}

      {/* Arms */}
      <mesh 
        ref={leftArmRef}
        position={[-0.4, 1.3, 0]} 
        rotation={[0, 0, 0.3]}
        castShadow
      >
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      <mesh 
        ref={rightArmRef}
        position={[0.4, 1.3, 0]} 
        rotation={[0, 0, -0.3]}
        castShadow
      >
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>

      {/* Floating hearts when freed */}
      {isFreed && hearts.map((pos, i) => {
        const yOffset = (Date.now() / 1000 + i) % 3;
        return (
          <mesh
            key={i}
            position={[pos.x, pos.y + yOffset, pos.z]}
            scale={0.15}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial 
              color="#FF69B4"
              emissive="#FF1493"
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}

      {/* Sparkles */}
      <pointLight position={[0, 2, 0]} color="#FFD700" intensity={isFreed ? 2 : 0.5} distance={5} />
      {isFreed && (
        <>
          <pointLight position={[1, 1, 0]} color="#FF69B4" intensity={1.5} distance={4} />
          <pointLight position={[-1, 1, 0]} color="#FF69B4" intensity={1.5} distance={4} />
        </>
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
  onRescueComplete,
  characterType = 'both'
}: { 
  gameState: 'playing' | 'rescuing' | 'rescued',
  onRescueComplete?: () => void,
  characterType?: 'prince' | 'princess' | 'both'
}) {
  const [cageBroken, setCageBroken] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [princeAnim, setPrinceAnim] = useState<'idle' | 'walk' | 'swingHammer'>('idle');
  const [hammerCount, setHammerCount] = useState(0);
  
  useEffect(() => {
    if (gameState === 'rescuing') {
      // Start hammer animation sequence
      setPrinceAnim('swingHammer');
      setHammerCount(1);
    }
  }, [gameState]);

  const handleHammerComplete = () => {
    if (hammerCount < 3) {
      // Continue swinging
      setHammerCount(prev => prev + 1);
      setPrinceAnim('idle');
      setTimeout(() => setPrinceAnim('swingHammer'), 300);
    } else {
      // Break the cage after 3 swings
      setCageBroken(true);
      setShowParticles(true);
      setPrinceAnim('idle');
      onRescueComplete?.();
    }
  };
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
      />
      
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -5]} intensity={0.7} color="#FFB6C1" />
      <spotLight 
        position={[0, 10, 0]} 
        angle={0.5} 
        penumbra={1} 
        intensity={0.5} 
        color="#FFF0F5"
        castShadow
      />
      
      <Environment preset="sunset" />
      
      {/* Candy Pile with Prince */}
      {(characterType === 'prince' || characterType === 'both') && (
        <>
          <CandyPile position={[-3, 0, 0]} />
          <Prince 
            position={[-3, 1, 0]} 
            animationState={princeAnim}
            onAnimationComplete={handleHammerComplete}
          />
        </>
      )}
      
      {/* Princess in Cage */}
      {(characterType === 'princess' || characterType === 'both') && (
        <>
          <Princess 
            position={[3, 0, 0]} 
            isFreed={cageBroken}
            animationState={cageBroken ? 'cheer' : 'idle'}
          />
          <CandyCage position={[3, 0, 0]} isBroken={cageBroken} />
        </>
      )}
      
      {/* Particle effects */}
      <ParticleEffect position={[3, 0, 0]} active={showParticles} />
      
      {/* Ground with pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#FFF0F5"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Ground decorations */}
      {Array.from({ length: 30 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 18;
        const z = (Math.random() - 0.5) * 18;
        const colors = ['#FF69B4', '#FFD700', '#87CEEB', '#98FB98'];
        return (
          <mesh 
            key={i} 
            position={[x, 0, z]} 
            rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}
          >
            <circleGeometry args={[0.2, 6]} />
            <meshStandardMaterial 
              color={colors[Math.floor(Math.random() * colors.length)]}
              transparent
              opacity={0.3}
            />
          </mesh>
        );
      })}
    </>
  );
}

// Main Three.js Scene Container
export default function ThreeScene({ 
  gameState = 'playing',
  onRescueComplete,
  characterType = 'both'
}: { 
  gameState?: 'playing' | 'rescuing' | 'rescued',
  onRescueComplete?: () => void,
  characterType?: 'prince' | 'princess' | 'both'
}) {
  return (
    <div style={{ 
      position: characterType === 'both' ? 'absolute' : 'relative',
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0
    }}>
      <Canvas shadows>
        <Scene gameState={gameState} onRescueComplete={onRescueComplete} characterType={characterType} />
      </Canvas>
    </div>
  );
}
