import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sparkles, Gamepad2, Volume2, VolumeX, Eye, Sun, HandMetal } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';
import { useCollabStore } from '../../store/useCollabStore';

interface WallE3DSceneProps {
  onOpenGame?: () => void;
  className?: string;
}

export const WallE3DScene: React.FC<WallE3DSceneProps> = ({ onOpenGame, className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { setGameOpen, soundEnabled, setSoundEnabled } = useCollabStore();

  const [greetingText, setGreetingText] = useState<string>(
    'Hi! Welcome to CollabFlow! 👋'
  );
  const [activeAction, setActiveAction] = useState<'wave' | 'look' | 'charge'>('wave');
  const [isWavingFast, setIsWavingFast] = useState(false);
  const [solarChargeLevel, setSolarChargeLevel] = useState(85);

  // References to animated 3D parts
  const animRefs = useRef<{
    walleGroup: THREE.Group | null;
    headGroup: THREE.Group | null;
    leftEye: THREE.Group | null;
    rightEye: THREE.Group | null;
    rightArmGroup: THREE.Group | null;
    rightForearm: THREE.Group | null;
    rightHand: THREE.Group | null;
    leftArmGroup: THREE.Group | null;
    solarGaugeMesh: THREE.Mesh | null;
    targetPointer: THREE.Vector2;
    currentPointer: THREE.Vector2;
    waveMultiplier: number;
    clock: THREE.Clock;
    isCharging: boolean;
  }>({
    walleGroup: null,
    headGroup: null,
    leftEye: null,
    rightEye: null,
    rightArmGroup: null,
    rightForearm: null,
    rightHand: null,
    leftArmGroup: null,
    solarGaugeMesh: null,
    targetPointer: new THREE.Vector2(0, 0),
    currentPointer: new THREE.Vector2(0, 0),
    waveMultiplier: 1.0,
    clock: new THREE.Clock(),
    isCharging: false,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Renderer setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0d14, 0.04);

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 1.8, 4.2);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.touchAction = 'pan-y';
    container.appendChild(renderer.domElement);

    // 2. Studio Environment reflections (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Balanced Studio Lighting
    // Warm Key Light
    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.2);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 12;
    const d = 2.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    scene.add(keyLight);

    // Cool Rim / Fill Light
    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 1.4);
    rimLight.position.set(-3, 3, -2);
    scene.add(rimLight);

    // Hemisphere light (sky vs ground)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.8);
    scene.add(hemiLight);

    // 4. Contact Shadow & Ground Plate
    // Procedural soft radial gradient shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;

    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.85,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.01;
    scene.add(contactShadow);

    // Subtle platform ring
    const platformRing = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.44, 48),
      new THREE.MeshBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      })
    );
    platformRing.rotation.x = -Math.PI / 2;
    platformRing.position.y = 0.02;
    scene.add(platformRing);

    // 5. PROCEDURAL WALL-E MODEL (Composite THREE.Group with > 12 distinct parts)
    const walleGroup = new THREE.Group();
    scene.add(walleGroup);
    animRefs.current.walleGroup = walleGroup;

    // Materials
    // Body weathered yellow-orange paint
    const walleBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // iconic warm yellow
      roughness: 0.35,
      metalness: 0.25,
    });

    // Dark Gunmetal / chassis framework
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.45,
      metalness: 0.85,
    });

    // Silver Chrome / Hydraulic cylinders
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      roughness: 0.12,
      metalness: 0.95,
    });

    // Tread Rubber
    const treadMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.1,
    });

    // Glass optical lenses
    const lensGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.2,
      roughness: 0.05,
      transmission: 0.92,
      thickness: 0.8,
      ior: 1.52,
    });

    // Glowing Cyan Optical Iris
    const eyeIrisMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });

    // Solar Gauge Material
    const solarGaugeMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
    });

    // Red warning accent
    const redAccentMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.4,
      metalness: 0.3,
    });

    // A. Main Body Chassis (Cube with rounded details)
    const bodyBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.95, 0.95),
      walleBodyMat
    );
    bodyBox.position.set(0, 0.82, 0);
    bodyBox.castShadow = true;
    bodyBox.receiveShadow = true;
    walleGroup.add(bodyBox);

    // Front Chest Door Seam (Indented panel)
    const chestPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.72, 0.04),
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.4,
        metalness: 0.35,
      })
    );
    chestPanel.position.set(0, 0.82, 0.48);
    chestPanel.castShadow = true;
    walleGroup.add(chestPanel);

    // Solar Charge Gauge Bar on Front Chest
    const solarGauge = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.06, 0.06),
      solarGaugeMat
    );
    solarGauge.position.set(-0.18, 1.05, 0.51);
    walleGroup.add(solarGauge);
    animRefs.current.solarGaugeMesh = solarGauge;

    // Small Solar Indicator Text / Dots
    for (let i = 0; i < 4; i++) {
      const dot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.02, 12),
        new THREE.MeshBasicMaterial({ color: i < 3 ? 0x10b981 : 0xf59e0b })
      );
      dot.rotation.x = Math.PI / 2;
      dot.position.set(0.06 + i * 0.05, 1.05, 0.51);
      walleGroup.add(dot);
    }

    // Hazard warning stripes on bottom front edge
    const hazardStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.08, 0.02),
      new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.5,
      })
    );
    hazardStripe.position.set(0, 0.45, 0.48);
    walleGroup.add(hazardStripe);

    // B. Triangular Caterpillar Tread Assemblies (Left & Right)
    const createTreadAssembly = (isRight: boolean) => {
      const treadGroup = new THREE.Group();
      const xOffset = isRight ? 0.65 : -0.65;
      treadGroup.position.set(xOffset, 0.48, 0);

      // Triangular metal inner chassis
      const innerPlate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.18, 3),
        darkMetalMat
      );
      innerPlate.rotation.z = Math.PI / 2;
      innerPlate.rotation.y = Math.PI / 6;
      innerPlate.castShadow = true;
      treadGroup.add(innerPlate);

      // 3 Main Wheels (Sprockets / Rollers)
      const wheelGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.22, 18);
      const topWheel = new THREE.Mesh(wheelGeom, darkMetalMat);
      topWheel.rotation.z = Math.PI / 2;
      topWheel.position.set(0, 0.15, 0);
      topWheel.castShadow = true;
      treadGroup.add(topWheel);

      const frontWheel = new THREE.Mesh(wheelGeom, darkMetalMat);
      frontWheel.rotation.z = Math.PI / 2;
      frontWheel.position.set(0, -0.22, 0.38);
      frontWheel.castShadow = true;
      treadGroup.add(frontWheel);

      const backWheel = new THREE.Mesh(wheelGeom, darkMetalMat);
      backWheel.rotation.z = Math.PI / 2;
      backWheel.position.set(0, -0.22, -0.38);
      backWheel.castShadow = true;
      treadGroup.add(backWheel);

      // Chrome wheel hubs
      [topWheel, frontWheel, backWheel].forEach((w) => {
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.24, 12),
          chromeMat
        );
        hub.rotation.z = Math.PI / 2;
        hub.position.copy(w.position);
        treadGroup.add(hub);
      });

      // Outer Rubber Track Belt (Loop around wheels)
      const trackBelt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.24, 3, 1, true),
        treadMat
      );
      trackBelt.rotation.z = Math.PI / 2;
      trackBelt.rotation.y = Math.PI / 6;
      trackBelt.scale.set(1, 0.85, 1.25);
      trackBelt.castShadow = true;
      treadGroup.add(trackBelt);

      return treadGroup;
    };

    walleGroup.add(createTreadAssembly(false)); // Left Tread
    walleGroup.add(createTreadAssembly(true)); // Right Tread

    // C. Articulated Neck Mechanism
    const neckBase = new THREE.Group();
    neckBase.position.set(0, 1.3, -0.05);
    walleGroup.add(neckBase);

    // Double hydraulic neck pistons
    const pistonGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.42, 12);
    const leftPiston = new THREE.Mesh(pistonGeom, chromeMat);
    leftPiston.position.set(-0.12, 0.18, 0);
    neckBase.add(leftPiston);

    const rightPiston = new THREE.Mesh(pistonGeom, chromeMat);
    rightPiston.position.set(0.12, 0.18, 0);
    neckBase.add(rightPiston);

    // Neck Pivot Block
    const neckPivot = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.1, 0.18),
      darkMetalMat
    );
    neckPivot.position.set(0, 0.38, 0);
    neckBase.add(neckPivot);

    // Head Group (tilts and looks around)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.42, 0);
    neckBase.add(headGroup);
    animRefs.current.headGroup = headGroup;

    // D. Iconic Binocular Visor Eyes (Left and Right)
    const createBinocularEye = (isRight: boolean) => {
      const eyeGroup = new THREE.Group();
      const xOffset = isRight ? 0.22 : -0.22;
      eyeGroup.position.set(xOffset, 0.05, 0.1);

      // Angled eye housing (characteristic tilted teardrop/tapered box)
      const housingGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.42, 16);
      const housing = new THREE.Mesh(housingGeom, darkMetalMat);
      housing.rotation.x = Math.PI / 2;
      // Slight inward splay
      housing.rotation.z = isRight ? 0.08 : -0.08;
      housing.castShadow = true;
      eyeGroup.add(housing);

      // Front Bezel Trim (Yellow painted accent)
      const bezel = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.035, 12, 24),
        walleBodyMat
      );
      bezel.position.set(0, 0, 0.21);
      eyeGroup.add(bezel);

      // Front Glass Optical Lens
      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.16, 24),
        lensGlassMat
      );
      lens.position.set(0, 0, 0.22);
      eyeGroup.add(lens);

      // Cyan / Blue glowing pupil
      const pupil = new THREE.Mesh(
        new THREE.RingGeometry(0.04, 0.09, 20),
        eyeIrisMat
      );
      pupil.position.set(0, 0, 0.225);
      eyeGroup.add(pupil);

      // Center camera sensor dot
      const sensorDot = new THREE.Mesh(
        new THREE.CircleGeometry(0.03, 16),
        new THREE.MeshBasicMaterial({ color: 0x0284c7 })
      );
      sensorDot.position.set(0, 0, 0.226);
      eyeGroup.add(sensorDot);

      // Articulated Eyebrow plate on top (for expressions!)
      const eyebrow = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.04, 0.16),
        darkMetalMat
      );
      eyebrow.position.set(0, 0.2, 0.05);
      eyebrow.rotation.z = isRight ? -0.15 : 0.15; // friendly relaxed curious brow
      eyeGroup.add(eyebrow);

      return eyeGroup;
    };

    const leftEye = createBinocularEye(false);
    const rightEye = createBinocularEye(true);
    headGroup.add(leftEye);
    headGroup.add(rightEye);
    animRefs.current.leftEye = leftEye;
    animRefs.current.rightEye = rightEye;

    // E. Articulated Left Arm (resting/balancing)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.58, 0.85, 0);
    walleGroup.add(leftArmGroup);
    animRefs.current.leftArmGroup = leftArmGroup;

    // Left shoulder bracket
    const leftShoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      darkMetalMat
    );
    leftArmGroup.add(leftShoulder);

    // Left arm rail/piston
    const leftForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.45, 12),
      chromeMat
    );
    leftForearm.position.set(-0.06, -0.22, 0.12);
    leftForearm.rotation.x = 0.4;
    leftForearm.rotation.z = 0.2;
    leftArmGroup.add(leftForearm);

    // Left mechanical claw pincer
    const leftHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.15),
      darkMetalMat
    );
    leftHand.position.set(-0.1, -0.42, 0.22);
    leftArmGroup.add(leftHand);

    // F. Articulated RIGHT ARM (THE WAVING ARM!)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.58, 0.85, 0);
    walleGroup.add(rightArmGroup);
    animRefs.current.rightArmGroup = rightArmGroup;

    // Right shoulder joint
    const rightShoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 14, 14),
      darkMetalMat
    );
    rightArmGroup.add(rightShoulder);

    // Right Upper Arm bracket
    const rightForearmGroup = new THREE.Group();
    rightForearmGroup.position.set(0.06, 0.12, 0);
    rightArmGroup.add(rightForearmGroup);
    animRefs.current.rightForearm = rightForearmGroup;

    // Hydraulic piston arm
    const rightArmRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.42, 12),
      chromeMat
    );
    rightArmRod.position.set(0, 0.2, 0);
    rightForearmGroup.add(rightArmRod);

    // Articulated Hand & Pincers
    const rightHandGroup = new THREE.Group();
    rightHandGroup.position.set(0, 0.42, 0);
    rightForearmGroup.add(rightHandGroup);
    animRefs.current.rightHand = rightHandGroup;

    // Hand wrist base
    const rightWrist = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, 0.1),
      darkMetalMat
    );
    rightHandGroup.add(rightWrist);

    // Dual-finger mechanical pincers
    const fingerGeom = new THREE.BoxGeometry(0.03, 0.14, 0.05);
    const leftFinger = new THREE.Mesh(fingerGeom, darkMetalMat);
    leftFinger.position.set(-0.05, 0.08, 0);
    leftFinger.rotation.z = -0.15;
    rightHandGroup.add(leftFinger);

    const rightFinger = new THREE.Mesh(fingerGeom, darkMetalMat);
    rightFinger.position.set(0.05, 0.08, 0);
    rightFinger.rotation.z = 0.15;
    rightHandGroup.add(rightFinger);

    // 6. Mouse / Pointer tracking setup
    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      animRefs.current.targetPointer.set(
        Math.max(-1, Math.min(1, x)),
        Math.max(-1, Math.min(1, y))
      );
    };

    container.addEventListener('mousemove', handlePointerMove);

    // Drag to rotate WALL-E in 3D
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMoveDrag = (e: MouseEvent) => {
      if (!isDragging || !animRefs.current.walleGroup) return;
      const deltaX = e.clientX - previousMousePosition.x;
      animRefs.current.walleGroup.rotation.y += deltaX * 0.01;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMoveDrag);
    window.addEventListener('mouseup', handleMouseUp);

    // Trigger initial happy chirp
    setTimeout(() => {
      if (soundEnabled) {
        gameAudio.playWalleWaveHi();
      }
    }, 600);

    // 7. ANIMATION RENDER LOOP (Silky smooth 60fps)
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = animRefs.current.clock.getDelta();
      const time = animRefs.current.clock.getElapsedTime();

      // Smooth pointer interpolation
      animRefs.current.currentPointer.lerp(animRefs.current.targetPointer, 0.08);
      const pointer = animRefs.current.currentPointer;

      // Subtle suspension breathing float
      if (animRefs.current.walleGroup && !isDragging) {
        animRefs.current.walleGroup.position.y = Math.sin(time * 2.2) * 0.025;
      }

      // HEAD LOOK-AT & CURIOUS TILT
      if (animRefs.current.headGroup) {
        const targetHeadRotY = pointer.x * 0.45;
        const targetHeadRotX = -pointer.y * 0.25;
        const curiousTiltZ = Math.sin(time * 1.8) * 0.08;

        animRefs.current.headGroup.rotation.y = THREE.MathUtils.damp(
          animRefs.current.headGroup.rotation.y,
          targetHeadRotY,
          4,
          delta
        );
        animRefs.current.headGroup.rotation.x = THREE.MathUtils.damp(
          animRefs.current.headGroup.rotation.x,
          targetHeadRotX,
          4,
          delta
        );
        animRefs.current.headGroup.rotation.z = curiousTiltZ;
      }

      // EYE BROW & PUPIL ADJUSTMENTS
      if (animRefs.current.leftEye && animRefs.current.rightEye) {
        // Expressive micro-twitches
        const eyeSquint = Math.sin(time * 3.5) * 0.02;
        animRefs.current.leftEye.rotation.x = eyeSquint;
        animRefs.current.rightEye.rotation.x = eyeSquint;
      }

      // WAVING HI ANIMATION (Right Arm)
      if (
        animRefs.current.rightArmGroup &&
        animRefs.current.rightForearm &&
        animRefs.current.rightHand
      ) {
        const waveSpeed = animRefs.current.waveMultiplier > 1.5 ? 9.0 : 4.8;
        const waveAngle = Math.sin(time * waveSpeed) * 0.35 * animRefs.current.waveMultiplier;

        // Shoulder raises arm upward
        animRefs.current.rightArmGroup.rotation.z = THREE.MathUtils.damp(
          animRefs.current.rightArmGroup.rotation.z,
          -0.65, // raised up outward
          5,
          delta
        );
        animRefs.current.rightArmGroup.rotation.x = THREE.MathUtils.damp(
          animRefs.current.rightArmGroup.rotation.x,
          0.3,
          5,
          delta
        );

        // Forearm pivots and waves side to side
        animRefs.current.rightForearm.rotation.z = -0.3 + waveAngle;
        animRefs.current.rightForearm.rotation.x = 0.25;

        // Hand oscillates and pincers twitch open/closed
        animRefs.current.rightHand.rotation.z = waveAngle * 0.8;
        animRefs.current.rightHand.rotation.y = Math.cos(time * waveSpeed) * 0.25;
      }

      // SOLAR CHARGE PULSE
      if (animRefs.current.solarGaugeMesh) {
        if (animRefs.current.isCharging) {
          const glow = (Math.sin(time * 8) + 1) * 0.5;
          (animRefs.current.solarGaugeMesh.material as THREE.MeshBasicMaterial).color.setRGB(
            0.1 + glow * 0.2,
            0.8 + glow * 0.2,
            0.4 + glow * 0.4
          );
        } else {
          (animRefs.current.solarGaugeMesh.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Clean Resize handling
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // 9. Resource Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMoveDrag);
      window.removeEventListener('mouseup', handleMouseUp);

      // Recursive disposal of geometries and materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [soundEnabled]);

  // User Actions
  const handleTriggerWave = () => {
    setActiveAction('wave');
    animRefs.current.waveMultiplier = 2.4;
    setIsWavingFast(true);
    setGreetingText('WALL-E: "Waaall-Eee! Nice to meet you! 👋"');

    if (soundEnabled) {
      gameAudio.playWalleWaveHi();
    }

    setTimeout(() => {
      animRefs.current.waveMultiplier = 1.0;
      setIsWavingFast(false);
      setGreetingText('WALL-E says: Welcome to CollabFlow! 👋');
    }, 2500);
  };

  const handleTriggerLook = () => {
    setActiveAction('look');
    setGreetingText('WALL-E: "Eva? Scanning the workspace..." ✨');
    if (soundEnabled) {
      gameAudio.playWalleBeep();
    }
    if (animRefs.current.headGroup) {
      animRefs.current.headGroup.rotation.y = 0.6;
      animRefs.current.headGroup.rotation.z = -0.2;
    }
    setTimeout(() => {
      setGreetingText('Ready to collaborate! 🚀');
    }, 2000);
  };

  const handleTriggerSolarCharge = () => {
    setActiveAction('charge');
    animRefs.current.isCharging = true;
    setGreetingText('☀️ Solar battery charging: 100% capacity ready!');
    setSolarChargeLevel(100);

    if (soundEnabled) {
      gameAudio.playPowerup();
    }

    setTimeout(() => {
      animRefs.current.isCharging = false;
      setGreetingText('Full power! Ready for high-speed collaboration!');
    }, 3000);
  };

  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-b from-slate-900/95 via-[#0d1322] to-slate-950 border border-indigo-500/30 shadow-2xl p-4 sm:p-5 overflow-hidden flex flex-col group ${className}`}
    >
      {/* Background glow effects */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP STATUS BAR & INTERACTIVE SPEECH BUBBLE */}
      <div className="relative z-10 flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-slate-200 tracking-wide uppercase font-mono">
            3D Robot Companion: WALL-E
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute / Unmute robot voice */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={soundEnabled ? 'Mute Robot Audio' : 'Unmute Robot Audio'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-semibold flex items-center gap-1">
            <Sun className="w-2.5 h-2.5 text-amber-400" /> {solarChargeLevel}% Solar
          </span>
        </div>
      </div>

      {/* SPEECH BUBBLE (Greeting when website opens) */}
      <div className="relative z-10 mt-3 p-2.5 sm:p-3 rounded-xl bg-slate-950/90 border border-indigo-500/30 shadow-lg flex items-start gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
        <div className="w-7 h-7 shrink-0 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-xs flex items-center justify-center shadow-md">
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-100 leading-snug">
            {greetingText}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tip: Move your mouse or drag to rotate WALL-E in 3D! In free time? Play our break game!
          </p>
        </div>
      </div>

      {/* THREE.JS CANVAS CONTAINER (Dedicated mount ref) */}
      <div
        ref={mountRef}
        className="relative w-full h-[260px] sm:h-[300px] cursor-grab active:cursor-grabbing flex items-center justify-center select-none touch-pan-y"
        title="Click and drag to rotate WALL-E"
        style={{ touchAction: 'pan-y' }}
      />

      {/* INTERACTIVE ACTIONS DOCK */}
      <div className="relative z-10 pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={handleTriggerWave}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            isWavingFast || activeAction === 'wave'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <HandMetal className="w-3.5 h-3.5 text-amber-300" />
          <span>Wave Hi!</span>
        </button>

        <button
          onClick={handleTriggerLook}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeAction === 'look'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-cyan-300" />
          <span>Look Around</span>
        </button>

        <button
          onClick={handleTriggerSolarCharge}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeAction === 'charge'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Solar Charge</span>
        </button>

        {/* PLAY BREAK GAME BUTTON */}
        <button
          onClick={() => {
            if (onOpenGame) onOpenGame();
            else setGameOpen(true);
          }}
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Play Game!</span>
        </button>
      </div>
    </div>
  );
};
