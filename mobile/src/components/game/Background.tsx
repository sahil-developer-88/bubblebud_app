import { useRef, useMemo, useEffect, memo } from "react";
import { useFrame, useThree } from "@react-three/fiber/native";
import * as THREE from "three";
import { useBreathingGame } from "@/lib/stores/useBreathingGame";
import { GAME_SPEED, COLORS } from "@/lib/constants";
import { BreathingGameState } from "@/lib/stores/useBreathingGame";

// Helper to dispose of geometries and materials properly
const disposeObject = (obj: THREE.Object3D) => {
  if (!obj) return;

  // Handle mesh objects
  if (obj instanceof THREE.Mesh) {
    if (obj.geometry) {
      obj.geometry.dispose();
    }

    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((material) => material.dispose());
      } else {
        obj.material.dispose();
      }
    }
  }

  // Handle children recursively
  if (obj.children && obj.children.length > 0) {
    // Create a copy of the children array to avoid mutation issues during iteration
    const children = [...obj.children];
    children.forEach((child) => disposeObject(child));
  }
};

const Background = () => {
  const gameState = useBreathingGame(
    (state: BreathingGameState) => state.gameState
  );
  const { viewport, scene } = useThree();

  // Create refs for all parallax layers
  const cloudsFarRef = useRef<THREE.Group>(null);
  const cloudsNearRef = useRef<THREE.Group>(null);
  const hillsFarRef = useRef<THREE.Group>(null);
  const hillsNearRef = useRef<THREE.Group>(null);
  const backgroundRef = useRef<THREE.Group>(new THREE.Group());

  // Set the width wide enough so we can loop the background
  const bgWidth = viewport.width * 3;

  // Properly clean up background elements to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (backgroundRef.current) {
        disposeObject(backgroundRef.current);
      }

      // Clean up group refs
      [cloudsFarRef, cloudsNearRef, hillsFarRef, hillsNearRef].forEach(
        (ref) => {
          if (ref.current) {
            disposeObject(ref.current);
          }
        }
      );
    };
  }, []);

  // Update positions for parallax effect
  useFrame((_, delta) => {
    if (gameState !== "playing") return;

    // Each layer moves at a different speed to create parallax
    // Far elements move slower than near elements

    // Far clouds - slowest
    if (cloudsFarRef.current) {
      cloudsFarRef.current.position.x -= GAME_SPEED * delta * 0.2;

      // Loop when off-screen
      if (cloudsFarRef.current.position.x < -bgWidth) {
        cloudsFarRef.current.position.x = bgWidth;
      }
    }

    // Near clouds - move faster
    if (cloudsNearRef.current) {
      cloudsNearRef.current.position.x -= GAME_SPEED * delta * 0.3;

      // Loop when off-screen
      if (cloudsNearRef.current.position.x < -bgWidth) {
        cloudsNearRef.current.position.x = bgWidth;
      }
    }

    // Far hills - move a bit faster
    if (hillsFarRef.current) {
      hillsFarRef.current.position.x -= GAME_SPEED * delta * 0.5;

      // Loop when off-screen
      if (hillsFarRef.current.position.x < -bgWidth) {
        hillsFarRef.current.position.x = bgWidth;
      }
    }

    // Near hills - fastest but still slower than coins
    if (hillsNearRef.current) {
      hillsNearRef.current.position.x -= GAME_SPEED * delta * 0.7;

      // Loop when off-screen
      if (hillsNearRef.current.position.x < -bgWidth) {
        hillsNearRef.current.position.x = bgWidth;
      }
    }
  });

  // Create a sky gradient background - memoize to prevent recreating on every render
  const SkyGradient = useMemo(() => {
    const layers = 5; // Number of gradient layers
    const depth = -30; // Moved further back
    const width = viewport.width * 4; // Very wide to ensure full coverage
    const height = viewport.height * 4;

    // Colors from top to bottom (from deep purple to light pink)
    const colors = [
      COLORS.background.sky.top,
      "#b15cd0",
      COLORS.background.sky.middle,
      "#e2b1f0",
      COLORS.background.sky.bottom,
    ];

    // Create reusable geometries and materials to reduce GPU overhead
    const planeGeometry = new THREE.PlaneGeometry(width, height / layers + 0.5);
    const materials = colors.map(
      (color) => new THREE.MeshBasicMaterial({ color, transparent: false })
    );

    return (
      <group position={[0, 0, depth]}>
        {Array.from({ length: layers }).map((_, i) => {
          const y = height / 2 - i * (height / layers);
          return (
            <mesh
              key={`sky-layer-${i}`}
              position={[0, y, 0]}
              frustumCulled={false}
            >
              <primitive object={planeGeometry.clone()} />
              <primitive object={materials[i].clone()} />
            </mesh>
          );
        })}
      </group>
    );
  }, [viewport.width, viewport.height]);

  return (
    <group ref={backgroundRef}>
      {/* Static Sky gradient */}
      {SkyGradient}

      {/* Sun/Moon */}
      <mesh
        position={[viewport.width / 3, viewport.height / 3, -15]}
        frustumCulled={false}
      >
        <circleGeometry args={[2, 32]} />
        <meshBasicMaterial color="#ffb3db" />
      </mesh>

      {/* Parallax layers */}
      <group ref={cloudsFarRef} position={[0, 0, -25]}>
        <mesh position={[bgWidth * 0.2, viewport.height / 3, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#f1f5f9" />
        </mesh>
      </group>

      <group ref={hillsFarRef} position={[0, 0, -20]}>
        <mesh position={[bgWidth * 0.3, -viewport.height / 4, 0]}>
          <sphereGeometry args={[4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={COLORS.background.mountains.far} />
        </mesh>
      </group>

      <group ref={cloudsNearRef} position={[0, 0, -15]}>
        <mesh position={[bgWidth * 0.3, viewport.height / 5, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </group>

      <group ref={hillsNearRef} position={[0, 0, -10]}>
        <mesh position={[bgWidth * 0.2, -viewport.height / 3, 0]}>
          <sphereGeometry args={[3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={COLORS.background.mountains.near} />
        </mesh>
      </group>
    </group>
  );
};

export default memo(Background);
