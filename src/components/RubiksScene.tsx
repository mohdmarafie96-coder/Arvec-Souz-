import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { FaceColors, FaceName, MoveNotation, MoveQueueItem } from '../types/cube';
import { soundFx } from '../utils/audio';

interface RubiksSceneProps {
  cubeSize: 2 | 3;
  colors: FaceColors;
  animationSpeed: number; // in milliseconds (e.g. 150 to 350)
  onMoveComplete?: (move: MoveNotation, isSolved: boolean) => void;
  onCubeRotated?: () => void;
  externalMoveQueue: MoveQueueItem[];
  clearQueueItem: () => void;
  isInteractive: boolean;
}

export interface RubiksSceneHandle {
  resetCamera: () => void;
  alignToFace: (face: FaceName) => void;
  checkIsSolved: () => boolean;
}

export const RubiksScene: React.FC<RubiksSceneProps> = ({
  cubeSize,
  colors,
  animationSpeed,
  onMoveComplete,
  externalMoveQueue,
  clearQueueItem,
  isInteractive,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);
  const pivotGroupRef = useRef<THREE.Group | null>(null);
  const cubiesRef = useRef<THREE.Group[]>([]);
  const stickersRef = useRef<THREE.Mesh[]>([]);

  // Orbit camera state
  const cameraAnglesRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: cubeSize === 2 ? 6.2 : 7.2 });
  const targetAnglesRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: cubeSize === 2 ? 6.2 : 7.2 });
  const isDraggingOrbitRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Move animation state
  const isAnimatingRef = useRef(false);
  const animStartTimeRef = useRef(0);
  const currentMoveRef = useRef<MoveQueueItem | null>(null);
  const currentAxisRef = useRef<'x' | 'y' | 'z'>('x');
  const startAngleRef = useRef(0);
  const targetAngleRef = useRef(0);
  const activePivotCubiesRef = useRef<THREE.Group[]>([]);

  // Interactive face dragging state
  const isDraggingFaceRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragHitCubieRef = useRef<THREE.Group | null>(null);
  const dragHitNormalRef = useRef<THREE.Vector3 | null>(null);
  const dragAxisRef = useRef<'x' | 'y' | 'z' | null>(null);
  const dragSliceCoordRef = useRef<number>(0);
  const dragStartPivotAngleRef = useRef<number>(0);
  const dragCurrentAngleRef = useRef<number>(0);

  // Raycaster for mouse picking
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVecRef = useRef(new THREE.Vector2());

  // Function to check if the cube is currently solved
  const checkIsSolved = useCallback((): boolean => {
    if (stickersRef.current.length === 0) return true;

    // Normal vectors in world space for each of the 6 faces
    const faceDirs: { normal: THREE.Vector3; name: FaceName }[] = [
      { normal: new THREE.Vector3(0, 1, 0), name: 'U' },
      { normal: new THREE.Vector3(0, -1, 0), name: 'D' },
      { normal: new THREE.Vector3(1, 0, 0), name: 'R' },
      { normal: new THREE.Vector3(-1, 0, 0), name: 'L' },
      { normal: new THREE.Vector3(0, 0, 1), name: 'F' },
      { normal: new THREE.Vector3(0, 0, -1), name: 'B' },
    ];

    const tempVec = new THREE.Vector3();

    for (const { normal, name } of faceDirs) {
      let faceInitialColor: string | null = null;
      let count = 0;

      for (const sticker of stickersRef.current) {
        sticker.getWorldDirection(tempVec);
        // Look at sticker world normal
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(sticker.matrixWorld);
        const worldNormal = new THREE.Vector3(0, 0, 1).applyMatrix3(normalMatrix).normalize();

        // Check if sticker normal matches the face normal
        if (worldNormal.dot(normal) > 0.85) {
          const stickerOrigFace = sticker.userData.originalFace as string;
          if (faceInitialColor === null) {
            faceInitialColor = stickerOrigFace;
          } else if (faceInitialColor !== stickerOrigFace) {
            return false;
          }
          count++;
        }
      }

      const expectedStickersPerFace = cubeSize === 2 ? 4 : 9;
      if (count !== expectedStickersPerFace) {
        return false;
      }
    }

    return true;
  }, [cubeSize]);

  // Clean, snap and normalize cubie transforms after a rotation
  const snapCubies = useCallback(() => {
    if (!cubeGroupRef.current || !pivotGroupRef.current) return;

    pivotGroupRef.current.updateMatrixWorld(true);

    activePivotCubiesRef.current.forEach((cubie) => {
      // Transfer back from pivot to cubeGroup while preserving world transform
      cubeGroupRef.current!.attach(cubie);

      // Snap position to rounded grid coordinates
      if (cubeSize === 3) {
        cubie.position.x = Math.round(cubie.position.x);
        cubie.position.y = Math.round(cubie.position.y);
        cubie.position.z = Math.round(cubie.position.z);
      } else {
        cubie.position.x = Math.round(cubie.position.x * 2) / 2;
        cubie.position.y = Math.round(cubie.position.y * 2) / 2;
        cubie.position.z = Math.round(cubie.position.z * 2) / 2;
      }

      // Snap Euler rotation to closest multiple of 90 degrees (π/2)
      const euler = new THREE.Euler().setFromQuaternion(cubie.quaternion, 'XYZ');
      const snapAngle = (a: number) => Math.round(a / (Math.PI / 2)) * (Math.PI / 2);
      cubie.rotation.set(snapAngle(euler.x), snapAngle(euler.y), snapAngle(euler.z));
      cubie.updateMatrix();
    });

    // Reset pivot
    pivotGroupRef.current.rotation.set(0, 0, 0);
    pivotGroupRef.current.updateMatrixWorld(true);
    activePivotCubiesRef.current = [];
  }, [cubeSize]);

  // Build the 3D Cubies
  const buildCube = useCallback(() => {
    if (!cubeGroupRef.current) return;

    // Clear previous cubies
    while (cubeGroupRef.current.children.length > 0) {
      cubeGroupRef.current.remove(cubeGroupRef.current.children[0]);
    }
    cubiesRef.current = [];
    stickersRef.current = [];

    const n = cubeSize;
    const offset = (n - 1) / 2;
    const cubieSize = 0.96;
    const stickerThickness = 0.02;
    const stickerSize = cubieSize * 0.86;
    const halfSize = cubieSize / 2;

    // Common body material (tactile textured black plastic)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.body),
      roughness: 0.5,
      metalness: 0.12,
    });

    const stickerMaterials: Record<FaceName, THREE.MeshPhysicalMaterial> = {
      U: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colors.U),
        roughness: 0.18,
        metalness: 0.04,
        clearcoat: 0.5,
        clearcoatRoughness: 0.15,
      }),
      D: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colors.D),
        roughness: 0.18,
        metalness: 0.04,
        clearcoat: 0.5,
        clearcoatRoughness: 0.15,
      }),
      L: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colors.L),
        roughness: 0.18,
        metalness: 0.04,
        clearcoat: 0.5,
        clearcoatRoughness: 0.15,
      }),
      R: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colors.R),
        roughness: 0.18,
        metalness: 0.04,
        clearcoat: 0.5,
        clearcoatRoughness: 0.15,
      }),
      F: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colors.F),
        roughness: 0.18,
        metalness: 0.04,
        clearcoat: 0.5,
        clearcoatRoughness: 0.15,
      }),
      B: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colors.B),
        roughness: 0.18,
        metalness: 0.04,
        clearcoat: 0.5,
        clearcoatRoughness: 0.15,
      }),
    };

    const cubieGeo = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
    const stickerGeoX = new THREE.BoxGeometry(stickerThickness, stickerSize, stickerSize);
    const stickerGeoY = new THREE.BoxGeometry(stickerSize, stickerThickness, stickerSize);
    const stickerGeoZ = new THREE.BoxGeometry(stickerSize, stickerSize, stickerThickness);

    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        for (let z = 0; z < n; z++) {
          const cx = x - offset;
          const cy = y - offset;
          const cz = z - offset;

          // Skip completely hidden center cubie on 3x3
          if (n === 3 && cx === 0 && cy === 0 && cz === 0) continue;

          const cubieGroup = new THREE.Group();
          cubieGroup.position.set(cx, cy, cz);
          cubieGroup.userData = { cx, cy, cz };

          // Base black plastic core
          const coreMesh = new THREE.Mesh(cubieGeo, bodyMaterial);
          coreMesh.castShadow = true;
          coreMesh.receiveShadow = true;
          cubieGroup.add(coreMesh);

          // Exterior Stickers
          // Right (+X)
          if (x === n - 1) {
            const sticker = new THREE.Mesh(stickerGeoX, stickerMaterials.R);
            sticker.position.set(halfSize + stickerThickness / 2, 0, 0);
            sticker.userData = { face: 'R', originalFace: 'R', cubie: cubieGroup };
            cubieGroup.add(sticker);
            stickersRef.current.push(sticker);
          }
          // Left (-X)
          if (x === 0) {
            const sticker = new THREE.Mesh(stickerGeoX, stickerMaterials.L);
            sticker.position.set(-halfSize - stickerThickness / 2, 0, 0);
            sticker.userData = { face: 'L', originalFace: 'L', cubie: cubieGroup };
            cubieGroup.add(sticker);
            stickersRef.current.push(sticker);
          }
          // Up (+Y)
          if (y === n - 1) {
            const sticker = new THREE.Mesh(stickerGeoY, stickerMaterials.U);
            sticker.position.set(0, halfSize + stickerThickness / 2, 0);
            sticker.userData = { face: 'U', originalFace: 'U', cubie: cubieGroup };
            cubieGroup.add(sticker);
            stickersRef.current.push(sticker);
          }
          // Down (-Y)
          if (y === 0) {
            const sticker = new THREE.Mesh(stickerGeoY, stickerMaterials.D);
            sticker.position.set(0, -halfSize - stickerThickness / 2, 0);
            sticker.userData = { face: 'D', originalFace: 'D', cubie: cubieGroup };
            cubieGroup.add(sticker);
            stickersRef.current.push(sticker);
          }
          // Front (+Z)
          if (z === n - 1) {
            const sticker = new THREE.Mesh(stickerGeoZ, stickerMaterials.F);
            sticker.position.set(0, 0, halfSize + stickerThickness / 2);
            sticker.userData = { face: 'F', originalFace: 'F', cubie: cubieGroup };
            cubieGroup.add(sticker);
            stickersRef.current.push(sticker);
          }
          // Back (-Z)
          if (z === 0) {
            const sticker = new THREE.Mesh(stickerGeoZ, stickerMaterials.B);
            sticker.position.set(0, 0, -halfSize - stickerThickness / 2);
            sticker.userData = { face: 'B', originalFace: 'B', cubie: cubieGroup };
            cubieGroup.add(sticker);
            stickersRef.current.push(sticker);
          }

          cubeGroupRef.current.add(cubieGroup);
          cubiesRef.current.push(cubieGroup);
        }
      }
    }
  }, [cubeSize, colors]);

  // Execute a Move smoothly
  const startMoveAnimation = useCallback(
    (moveItem: MoveQueueItem) => {
      if (!cubeGroupRef.current || !pivotGroupRef.current || isAnimatingRef.current) return;

      const { face, direction, double } = moveItem;
      const angleMultiplier = double ? 2 : 1;
      const targetDelta = (Math.PI / 2) * angleMultiplier * (direction === 1 ? -1 : 1);

      let axis: 'x' | 'y' | 'z' = 'x';
      let sliceCoord = 0;
      let filterFn: (pos: THREE.Vector3) => boolean;

      const eps = 0.25;
      const maxCoord = (cubeSize - 1) / 2;

      switch (face) {
        case 'R':
          axis = 'x';
          sliceCoord = maxCoord;
          filterFn = (p) => p.x > maxCoord - eps;
          break;
        case 'L':
          axis = 'x';
          sliceCoord = -maxCoord;
          filterFn = (p) => p.x < -maxCoord + eps;
          break;
        case 'U':
          axis = 'y';
          sliceCoord = maxCoord;
          filterFn = (p) => p.y > maxCoord - eps;
          break;
        case 'D':
          axis = 'y';
          sliceCoord = -maxCoord;
          filterFn = (p) => p.y < -maxCoord + eps;
          break;
        case 'F':
          axis = 'z';
          sliceCoord = maxCoord;
          filterFn = (p) => p.z > maxCoord - eps;
          break;
        case 'B':
          axis = 'z';
          sliceCoord = -maxCoord;
          filterFn = (p) => p.z < -maxCoord + eps;
          break;
        case 'M':
          axis = 'x';
          filterFn = (p) => Math.abs(p.x) < eps;
          break;
        case 'E':
          axis = 'y';
          filterFn = (p) => Math.abs(p.y) < eps;
          break;
        case 'S':
          axis = 'z';
          filterFn = (p) => Math.abs(p.z) < eps;
          break;
        case 'x':
        case 'y':
        case 'z':
          axis = face;
          filterFn = () => true; // whole cube
          break;
        default:
          return;
      }

      // In standard notation:
      // U is clockwise from top (negative Y rotation)
      // D is clockwise from bottom (positive Y rotation)
      // R is clockwise from right (negative X rotation)
      // L is clockwise from left (positive X rotation)
      // F is clockwise from front (negative Z rotation)
      // B is clockwise from back (positive Z rotation)
      let sign = -1;
      if (face === 'L' || face === 'D' || face === 'B' || face === 'M' || face === 'E') {
        sign = 1;
      }

      const finalTargetAngle = sign * (Math.PI / 2) * angleMultiplier * direction;

      // Group cubies for this slice
      const affectedCubies: THREE.Group[] = [];
      const tempPos = new THREE.Vector3();

      cubiesRef.current.forEach((cubie) => {
        cubie.getWorldPosition(tempPos);
        // Convert to cubeGroup relative position
        cubeGroupRef.current!.worldToLocal(tempPos);
        if (filterFn(tempPos)) {
          affectedCubies.push(cubie);
        }
      });

      if (affectedCubies.length === 0) {
        clearQueueItem();
        return;
      }

      // Attach to pivot
      pivotGroupRef.current.rotation.set(0, 0, 0);
      pivotGroupRef.current.updateMatrixWorld(true);

      affectedCubies.forEach((c) => {
        pivotGroupRef.current!.attach(c);
      });

      activePivotCubiesRef.current = affectedCubies;
      currentMoveRef.current = moveItem;
      currentAxisRef.current = axis;
      startAngleRef.current = 0;
      targetAngleRef.current = finalTargetAngle;
      animStartTimeRef.current = performance.now();
      isAnimatingRef.current = true;
    },
    [cubeSize, clearQueueItem]
  );

  // Initialize Scene, Camera, Lights, and Animation Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.4);
    keyLight.position.set(8, 12, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Cool fill light
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.7);
    fillLight.position.set(-8, -4, -6);
    scene.add(fillLight);

    // Top rim light
    const rimLight = new THREE.DirectionalLight(0xecfeff, 0.85);
    rimLight.position.set(0, 10, -8);
    scene.add(rimLight);

    // Floor Soft Radial Shadow
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    // Custom soft circular gradient texture for ground contact shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const grad = shadowCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
      grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.25)');
      grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.05)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      shadowCtx.fillStyle = grad;
      shadowCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const floorMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = cubeSize === 2 ? -2.0 : -2.3;
    scene.add(floorMesh);

    // 5. Cube and Pivot Groups
    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);
    cubeGroupRef.current = cubeGroup;

    const pivotGroup = new THREE.Group();
    scene.add(pivotGroup);
    pivotGroupRef.current = pivotGroup;

    buildCube();

    // 6. Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth camera orbit lerping
      const angles = cameraAnglesRef.current;
      const target = targetAnglesRef.current;

      angles.theta += (target.theta - angles.theta) * 0.12;
      angles.phi += (target.phi - angles.phi) * 0.12;
      angles.radius += (target.radius - angles.radius) * 0.12;

      // Keep phi clamped away from gimbal lock
      angles.phi = Math.max(0.1, Math.min(Math.PI - 0.1, angles.phi));

      const x = angles.radius * Math.sin(angles.phi) * Math.sin(angles.theta);
      const y = angles.radius * Math.cos(angles.phi);
      const z = angles.radius * Math.sin(angles.phi) * Math.cos(angles.theta);

      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);

      // Handle ongoing move animation
      if (isAnimatingRef.current && currentMoveRef.current) {
        const elapsed = performance.now() - animStartTimeRef.current;
        const duration = currentMoveRef.current.duration || animationSpeed;
        const progress = Math.min(1, elapsed / duration);

        // Cubic ease out
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentAngle = startAngleRef.current + (targetAngleRef.current - startAngleRef.current) * ease;

        if (currentAxisRef.current === 'x') {
          pivotGroup.rotation.x = currentAngle;
        } else if (currentAxisRef.current === 'y') {
          pivotGroup.rotation.y = currentAngle;
        } else if (currentAxisRef.current === 'z') {
          pivotGroup.rotation.z = currentAngle;
        }

        if (progress >= 1) {
          // Finished move
          isAnimatingRef.current = false;
          snapCubies();
          soundFx.playTurnSound(animationSpeed < 200 ? 1.3 : 1.0);

          const finishedNotation = currentMoveRef.current.notation;
          currentMoveRef.current = null;
          clearQueueItem();

          const solved = checkIsSolved();
          if (onMoveComplete) {
            onMoveComplete(finishedNotation, solved);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cubeSize, colors, buildCube, animationSpeed, clearQueueItem, snapCubies, onMoveComplete, checkIsSolved]);

  // Handle move queue processing
  useEffect(() => {
    if (!isAnimatingRef.current && externalMoveQueue.length > 0) {
      const nextMove = externalMoveQueue[0];
      startMoveAnimation(nextMove);
    }
  }, [externalMoveQueue, startMoveAnimation]);

  // Pointer & Touch Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInteractive || isAnimatingRef.current) return;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect || !cameraRef.current) return;

    mouseVecRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseVecRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseVecRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(stickersRef.current, false);

    // If right click or middle click, or click outside stickers -> Orbit
    if (e.button === 2 || e.button === 1 || intersects.length === 0) {
      isDraggingOrbitRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // Left click on a sticker -> Prepare face drag
    const hit = intersects[0];
    const stickerMesh = hit.object as THREE.Mesh;
    const cubieGroup = stickerMesh.userData.cubie as THREE.Group;
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(stickerMesh.matrixWorld);
    const worldNormal = new THREE.Vector3(0, 0, 1).applyMatrix3(normalMatrix).normalize();

    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragHitCubieRef.current = cubieGroup;
    dragHitNormalRef.current = worldNormal;
    dragAxisRef.current = null;
    isDraggingFaceRef.current = true;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    // 1. Camera Orbit
    if (isDraggingOrbitRef.current) {
      const speed = 0.006;
      targetAnglesRef.current.theta += dx * speed;
      targetAnglesRef.current.phi -= dy * speed;
      return;
    }

    // 2. Interactive Face Drag
    if (isDraggingFaceRef.current && dragHitCubieRef.current && dragHitNormalRef.current && cameraRef.current) {
      const totalDx = e.clientX - dragStartPosRef.current.x;
      const totalDy = e.clientY - dragStartPosRef.current.y;
      const dist = Math.hypot(totalDx, totalDy);

      // Determine rotation axis once dragged past 8px threshold
      if (!dragAxisRef.current && dist > 8) {
        const normal = dragHitNormalRef.current;
        // Determine the two candidate turn axes perpendicular to the clicked face normal
        // E.g., if normal is along Y (U or D face), turns can be around X (R/L slices) or Z (F/B slices)
        const absX = Math.abs(normal.x);
        const absY = Math.abs(normal.y);
        const absZ = Math.abs(normal.z);

        let candidateAxes: ('x' | 'y' | 'z')[] = [];
        if (absY > 0.8) {
          candidateAxes = ['x', 'z'];
        } else if (absX > 0.8) {
          candidateAxes = ['y', 'z'];
        } else {
          candidateAxes = ['x', 'y'];
        }

        // Project candidate slice turn directions onto screen space
        const cubieWorldPos = new THREE.Vector3();
        dragHitCubieRef.current.getWorldPosition(cubieWorldPos);

        let bestAxis = candidateAxes[0];
        let bestDot = -1;

        candidateAxes.forEach((axis) => {
          // Tangent direction is normal x axisVector
          const axisVec = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0);
          const tangent = new THREE.Vector3().crossVectors(normal, axisVec).normalize();

          // Project tangent to screen space
          const p1 = cubieWorldPos.clone().project(cameraRef.current!);
          const p2 = cubieWorldPos.clone().add(tangent).project(cameraRef.current!);

          const screenDir = new THREE.Vector2(p2.x - p1.x, -(p2.y - p1.y)).normalize();
          const dragDir = new THREE.Vector2(totalDx, totalDy).normalize();

          const dot = Math.abs(screenDir.dot(dragDir));
          if (dot > bestDot) {
            bestDot = dot;
            bestAxis = axis;
          }
        });

        dragAxisRef.current = bestAxis;

        // Group cubies on that slice
        const tempPos = new THREE.Vector3();
        dragHitCubieRef.current.getWorldPosition(tempPos);
        cubeGroupRef.current!.worldToLocal(tempPos);

        let sliceCoord = 0;
        if (bestAxis === 'x') sliceCoord = tempPos.x;
        if (bestAxis === 'y') sliceCoord = tempPos.y;
        if (bestAxis === 'z') sliceCoord = tempPos.z;

        const eps = 0.3;
        const affected: THREE.Group[] = [];

        cubiesRef.current.forEach((c) => {
          c.getWorldPosition(tempPos);
          cubeGroupRef.current!.worldToLocal(tempPos);
          const val = bestAxis === 'x' ? tempPos.x : bestAxis === 'y' ? tempPos.y : tempPos.z;
          if (Math.abs(val - sliceCoord) < eps) {
            affected.push(c);
          }
        });

        pivotGroupRef.current!.rotation.set(0, 0, 0);
        pivotGroupRef.current!.updateMatrixWorld(true);
        affected.forEach((c) => pivotGroupRef.current!.attach(c));

        activePivotCubiesRef.current = affected;
        dragStartPivotAngleRef.current = 0;
        dragSliceCoordRef.current = sliceCoord;
      }

      // If axis is determined, dynamically turn the slice
      if (dragAxisRef.current && pivotGroupRef.current) {
        const dragSensitivity = 0.015;
        const angle = (totalDx + totalDy) * dragSensitivity;
        dragCurrentAngleRef.current = angle;

        if (dragAxisRef.current === 'x') pivotGroupRef.current.rotation.x = angle;
        if (dragAxisRef.current === 'y') pivotGroupRef.current.rotation.y = angle;
        if (dragAxisRef.current === 'z') pivotGroupRef.current.rotation.z = angle;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingOrbitRef.current = false;

    if (isDraggingFaceRef.current) {
      isDraggingFaceRef.current = false;

      if (dragAxisRef.current && pivotGroupRef.current) {
        // Snap slice to closest 90-degree step
        const currentAngle = dragCurrentAngleRef.current;
        const snapStep = Math.PI / 2;
        const nearestMultiple = Math.round(currentAngle / snapStep);
        const targetAngle = nearestMultiple * snapStep;

        // Smoothly tween to target angle then snap
        const startTime = performance.now();
        const startA = currentAngle;
        const axis = dragAxisRef.current;

        const animateSnap = () => {
          const now = performance.now();
          const t = Math.min(1, (now - startTime) / 100);
          const val = startA + (targetAngle - startA) * t;

          if (axis === 'x') pivotGroupRef.current!.rotation.x = val;
          if (axis === 'y') pivotGroupRef.current!.rotation.y = val;
          if (axis === 'z') pivotGroupRef.current!.rotation.z = val;

          if (t < 1) {
            requestAnimationFrame(animateSnap);
          } else {
            snapCubies();
            if (nearestMultiple !== 0) {
              soundFx.playTurnSound(1.2);
              const solved = checkIsSolved();
              if (onMoveComplete) {
                onMoveComplete('U', solved); // trigger state update
              }
            }
          }
        };

        requestAnimationFrame(animateSnap);
      }

      dragAxisRef.current = null;
      dragHitCubieRef.current = null;
      dragHitNormalRef.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const minZoom = cubeSize === 2 ? 4.5 : 5.0;
    const maxZoom = 12.0;
    targetAnglesRef.current.radius = Math.max(minZoom, Math.min(maxZoom, targetAnglesRef.current.radius + e.deltaY * 0.005));
  };

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={handleWheel}
    />
  );
};
