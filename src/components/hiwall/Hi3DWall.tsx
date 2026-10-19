import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Float, RoundedBox, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Sparkles, Waves, Volume2, VolumeX, RefreshCw, Eye } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

interface HiTileProps {
  position: [number, number, number];
  gridX: number;
  gridY: number;
  letter: string;
  mousePosRef: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  onWaveTriggered?: () => void;
  accentColor: string;
}

// Single 3D 'HI' interactive character block with raycasting and mouse wave response
const HiCharacterBlock: React.FC<HiTileProps> = ({
  position,
  gridX,
  gridY,
  letter,
  mousePosRef,
  onWaveTriggered,
  accentColor,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const textRef = useRef<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [clickWaveTime, setClickWaveTime] = useState(0);

  // Initial random phase offset so characters have organic subtle floating movement
  const phase = useMemo(() => gridX * 0.45 + gridY * 0.35, [gridX, gridY]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    // Normalized screen pointer distance check
    const pointer = state.pointer; // [-1 to +1] from R3F raycasting
    
    // Project block position to normalized device coordinates roughly
    const blockNormalizedX = (position[0] / 5.5);
    const blockNormalizedY = (position[1] / 3.5);
    const distToPointer = Math.hypot(pointer.x - blockNormalizedX, pointer.y - blockNormalizedY);

    // Active wave influence from mouse movement raycasting
    const mouseInfluence = Math.max(0, 1 - distToPointer * 1.6);

    // If clicked, amplify waving gesture for 1.5 seconds
    const clickBoost = Math.max(0, clickWaveTime - time);

    // Waving gesture calculation:
    // A friendly hand wave is rapid back-and-forth Z-axis / Y-axis rotation combined with forward tilt
    const waveFreq = isHovered || clickBoost > 0 ? 14 : 6;
    const waveIntensity = isHovered ? 1.0 : (mouseInfluence > 0.05 ? mouseInfluence : 0.15) + (clickBoost > 0 ? 0.8 : 0);

    // Waving rotation (tilt around Z like waving a hand, plus slight roll on Y)
    const waveZ = Math.sin(time * waveFreq + phase) * 0.28 * waveIntensity;
    const waveY = Math.cos(time * waveFreq * 0.8 + phase) * 0.18 * waveIntensity;
    const waveElevation = Math.sin(time * 3 + phase) * 0.08 + (waveIntensity * 0.35);

    // Smooth lerping to target wave transforms
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, waveZ, delta * 12);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, waveY, delta * 12);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      (isHovered || clickBoost > 0 ? -0.15 : 0),
      delta * 8
    );
    meshRef.current.position.z = THREE.MathUtils.lerp(
      meshRef.current.position.z,
      position[2] + waveElevation,
      delta * 10
    );

    // Subtle scale pulsing when wave hits
    const targetScale = isHovered || clickBoost > 0 ? 1.15 : (1 + mouseInfluence * 0.1);
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 10);
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setClickWaveTime(performance.now() / 1000 + 1.6);
    gameAudio.playWalleWaveHi();
    if (onWaveTriggered) onWaveTriggered();
  };

  return (
    <group
      ref={meshRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
        gameAudio.playWalleBeep();
      }}
      onPointerOut={() => {
        setIsHovered(false);
      }}
      onClick={handleClick}
    >
      {/* Tactile backing tile */}
      <RoundedBox args={[0.9, 0.9, 0.18]} radius={0.08} smoothness={4}>
        <meshStandardMaterial
          color={isHovered ? '#1e293b' : '#0f172a'}
          metalness={0.8}
          roughness={0.25}
          emissive={isHovered ? accentColor : '#000000'}
          emissiveIntensity={isHovered ? 0.35 : 0.05}
        />
      </RoundedBox>

      {/* Glowing bezel trim */}
      <RoundedBox args={[0.94, 0.94, 0.04]} position={[0, 0, -0.08]} radius={0.08} smoothness={4}>
        <meshBasicMaterial color={accentColor} transparent opacity={isHovered ? 0.8 : 0.25} />
      </RoundedBox>

      {/* 3D 'HI' text rendered with @react-three/drei Text */}
      <Text
        ref={textRef}
        position={[0, -0.02, 0.12]}
        fontSize={0.42}
        color={isHovered ? '#ffffff' : accentColor}
        anchorX="center"
        anchorY="middle"
        characters="HI!"
        fontWeight="800"
      >
        {letter}
        <meshStandardMaterial
          color={isHovered ? '#ffffff' : accentColor}
          emissive={accentColor}
          emissiveIntensity={isHovered ? 0.9 : 0.4}
          roughness={0.1}
          metalness={0.9}
        />
      </Text>
    </group>
  );
};

// Interactive Scene with ripple manager and particle lighting
const WallScene: React.FC<{
  onWaveTriggered: () => void;
  rippleTrigger: number;
}> = ({ onWaveTriggered, rippleTrigger }) => {
  const mousePosRef = useRef({ x: 0, y: 0, active: false });
  const groupRef = useRef<THREE.Group>(null);

  // Generate grid of 3D 'HI' tiles
  // 5 columns x 3 rows = 15 interactive 3D 'HI' nodes
  const tiles = useMemo(() => {
    const cols = 5;
    const rows = 3;
    const spacingX = 1.15;
    const spacingY = 1.12;
    const startX = -((cols - 1) * spacingX) / 2;
    const startY = ((rows - 1) * spacingY) / 2;

    const items = [];
    const colorPalette = [
      '#38bdf8', // sky-400
      '#818cf8', // indigo-400
      '#a855f7', // purple-500
      '#ec4899', // pink-500
      '#22d3ee', // cyan-400
      '#f59e0b', // amber-500
      '#10b981', // emerald-500
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacingX;
        const y = startY - r * spacingY;
        const color = colorPalette[(r * cols + c) % colorPalette.length];
        items.push({
          id: `hi-${r}-${c}`,
          position: [x, y, 0] as [number, number, number],
          gridX: c,
          gridY: r,
          letter: (r === 1 && c === 2) ? 'HI! 👋' : 'HI',
          color,
        });
      }
    }
    return items;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Gentle floating camera parallax tilt towards cursor
    const pointer = state.pointer;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, pointer.x * 0.15, delta * 4);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -pointer.y * 0.12, delta * 4);
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <pointLight position={[-4, 3, 2]} color="#818cf8" intensity={1.5} distance={10} />
      <pointLight position={[4, -3, 2]} color="#38bdf8" intensity={1.5} distance={10} />

      <group ref={groupRef}>
        {tiles.map((tile) => (
          <HiCharacterBlock
            key={tile.id}
            position={tile.position}
            gridX={tile.gridX}
            gridY={tile.gridY}
            letter={tile.letter}
            mousePosRef={mousePosRef}
            onWaveTriggered={onWaveTriggered}
            accentColor={tile.color}
          />
        ))}
      </group>
    </>
  );
};

export const Hi3DWall: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [waveCount, setWaveCount] = useState(0);
  const [rippleKey, setRippleKey] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  const triggerGlobalWave = () => {
    setRippleKey((prev) => prev + 1);
    setWaveCount((prev) => prev + 15);
    gameAudio.playWalleWaveHi();
  };

  return (
    <div className={`relative rounded-2xl bg-gradient-to-b from-slate-900/95 to-[#0b0f19] border border-cyan-500/30 shadow-2xl p-4 sm:p-5 backdrop-blur-xl overflow-hidden ${className}`}>
      {/* Header bar with controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Waves className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Interactive 3D 'HI' Matrix Wall
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                @react-three/fiber + drei
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Hover mouse or touch to trigger real-time raycasted 3D wave ripples
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerGlobalWave}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-sm transition-all active:scale-95"
            title="Trigger wave across all HI characters"
          >
            <Sparkles className="w-3 h-3" />
            <span>Wave All</span>
          </button>
          <button
            onClick={() => setSoundOn(!soundOn)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            title={soundOn ? 'Sound On' : 'Sound Muted'}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3D Canvas container with @react-three/fiber */}
      <div
        className="relative w-full h-[260px] sm:h-[300px] rounded-xl bg-gradient-to-b from-slate-950/80 to-[#050811] border border-slate-800 overflow-hidden cursor-crosshair touch-pan-y"
        style={{ touchAction: 'pan-y' }}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 48 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{ touchAction: 'pan-y' }}
        >
          <WallScene
            onWaveTriggered={() => setWaveCount((c) => c + 1)}
            rippleTrigger={rippleKey}
          />
        </Canvas>

        {/* Floating guidance badge */}
        <div className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Move mouse across tiles or click to wave</span>
          {waveCount > 0 && (
            <span className="ml-1 text-cyan-400 font-bold">({waveCount} waves)</span>
          )}
        </div>
      </div>
    </div>
  );
};
