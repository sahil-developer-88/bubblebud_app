import { useRef, useMemo, useEffect, memo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useBreathingGame } from "@/lib/stores/useBreathingGame";
import { GAME_SPEED, COLORS } from "@/lib/constants";

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
        obj.material.forEach(material => material.dispose());
      } else {
        obj.material.dispose();
      }
    }
  }
  
  // Handle children recursively
  if (obj.children && obj.children.length > 0) {
    // Create a copy of the children array to avoid mutation issues during iteration
    const children = [...obj.children];
    children.forEach(child => disposeObject(child));
  }
};

const Background = () => {
  const { gameState } = useBreathingGame();
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
      [cloudsFarRef, cloudsNearRef, hillsFarRef, hillsNearRef].forEach(ref => {
        if (ref.current) {
          disposeObject(ref.current);
        }
      });
    };
  }, []);
  
  // Handle WebGL context restoration
  useEffect(() => {
    // Listen for webglcontextrestored event at the document level
    const handleContextRestored = () => {
      console.log("WebGL context restored - rebuilding background elements");
      
      // Force a re-render of the scene
      if (scene) {
        scene.traverse(child => {
          if (child instanceof THREE.Mesh) {
            // Flag objects for updates
            if (child.geometry?.attributes?.position) {
              child.geometry.attributes.position.needsUpdate = true;
            }
            if (child.material) {
              child.material.needsUpdate = true;
            }
          }
        });
      }
    };
    
    document.addEventListener('webglcontextrestored', handleContextRestored);
    
    return () => {
      document.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [scene]);
  
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
    // Using our new color scheme from constants
    const colors = [
      COLORS.background.sky.top,      // Deep purple
      '#b15cd0',                      // Mid-deep purple (transition color)
      COLORS.background.sky.middle,   // Mid purple 
      '#e2b1f0',                      // Light purple (transition color)
      COLORS.background.sky.bottom,   // Light pink
    ];
    
    // Create reusable geometries and materials to reduce GPU overhead
    const planeGeometry = new THREE.PlaneGeometry(width, height / layers + 0.5);
    const materials = colors.map(color => new THREE.MeshBasicMaterial({ color }));
    
    return (
      <group position={[0, 0, depth]}>
        {Array.from({ length: layers }).map((_, i) => {
          const y = (height / 2) - (i * (height / layers));
          return (
            <mesh key={`sky-layer-${i}`} position={[0, y, 0]} frustumCulled={false}>
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
      
      {/* Sun/Moon - changed to soft pink to match theme */}
      <mesh position={[viewport.width/3, viewport.height/3, -15]} frustumCulled={false}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="#ffb3db" /> {/* Soft pink */}
        <pointLight position={[0, 0, 2]} intensity={0.6} distance={20} color="#ffcfed" />
      </mesh>
      
      {/* Parallax Layers */}
      
      {/* Distant Clouds - Layer 1 (farthest) */}
      <group ref={cloudsFarRef} position={[0, 0, -25]}>
        {/* Cloud 1 */}
        <mesh position={[bgWidth * 0.2, viewport.height/3, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#f1f5f9" transparent opacity={0.3} />
        </mesh>
        <mesh position={[bgWidth * 0.2 + 1, viewport.height/3 + 0.2, 0]}>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshBasicMaterial color="#f1f5f9" transparent opacity={0.3} />
        </mesh>
        <mesh position={[bgWidth * 0.2 - 1, viewport.height/3 - 0.1, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#f1f5f9" transparent opacity={0.3} />
        </mesh>
        
        {/* Cloud 2 */}
        <mesh position={[bgWidth * 0.6, viewport.height/4, 0]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#f1f5f9" transparent opacity={0.3} />
        </mesh>
        <mesh position={[bgWidth * 0.6 + 1.2, viewport.height/4 + 0.3, 0]}>
          <sphereGeometry args={[1.1, 16, 16]} />
          <meshBasicMaterial color="#f1f5f9" transparent opacity={0.3} />
        </mesh>
      </group>
      
      {/* Far Hills - Layer 2 */}
      <group ref={hillsFarRef} position={[0, 0, -20]}>
        {/* Rounded hills in the distance */}
        <mesh position={[bgWidth * 0.3, -viewport.height/4, 0]}>
          <sphereGeometry args={[4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={COLORS.background.mountains.far} />
        </mesh>
        <mesh position={[bgWidth * 0.7, -viewport.height/4 - 1, 0]}>
          <sphereGeometry args={[5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={COLORS.background.mountains.near} />
        </mesh>
      </group>
      
      {/* Near Clouds - Layer 3 */}
      <group ref={cloudsNearRef} position={[0, 0, -15]}>
        {/* Cloud 1 */}
        <mesh position={[bgWidth * 0.3, viewport.height/5, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>
        <mesh position={[bgWidth * 0.3 + 0.6, viewport.height/5 + 0.1, 0]}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>
        
        {/* Cloud 2 */}
        <mesh position={[bgWidth * 0.8, viewport.height/4, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>
        <mesh position={[bgWidth * 0.8 - 0.7, viewport.height/4 + 0.2, 0]}>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>
      </group>
      
      {/* Near Hills - Layer 4 (closest) */}
      <group ref={hillsNearRef} position={[0, 0, -10]}>
        {/* Foreground hills - darker and more defined */}
        <mesh position={[bgWidth * 0.25, -viewport.height/3 - 1, 0]}>
          <sphereGeometry args={[6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#8e2de2" /> {/* Dark purple */}
        </mesh>
        <mesh position={[bgWidth * 0.6, -viewport.height/3 - 0.5, 0]}>
          <sphereGeometry args={[5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#a367dc" /> {/* Medium purple */}
        </mesh>
        <mesh position={[bgWidth * 0.85, -viewport.height/3 - 1.5, 0]}>
          <sphereGeometry args={[7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#7209b7" /> {/* Deep purple */}
        </mesh>
      </group>
      
      {/* Add duplicates of each group for seamless looping */}
      <group position={[bgWidth, 0, -25]}>
        {/* Cloud 1 */}
        <mesh position={[bgWidth * 0.2, viewport.height/3, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#f1f5f9" transparent opacity={0.3} />
        </mesh>
        <mesh position={[bgWidth * 0.2 + 1, viewport.height/3 + 0.2, 0]}>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshBasicMaterial color="#f1f5f9" transparent opacity={0.3} />
        </mesh>
        <mesh position={[bgWidth * 0.2 - 1, viewport.height/3 - 0.1, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#f1f5f9" transparent opacity={0.3} />
        </mesh>
        
        {/* Cloud 2 */}
        <mesh position={[bgWidth * 0.6, viewport.height/4, 0]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#f1f5f9" transparent opacity={0.3} />
        </mesh>
        <mesh position={[bgWidth * 0.6 + 1.2, viewport.height/4 + 0.3, 0]}>
          <sphereGeometry args={[1.1, 16, 16]} />
          <meshBasicMaterial color="#f1f5f9" transparent opacity={0.3} />
        </mesh>
      </group>
      
      <group position={[bgWidth, 0, -20]}>
        {/* Rounded hills in the distance */}
        <mesh position={[bgWidth * 0.3, -viewport.height/4, 0]}>
          <sphereGeometry args={[4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={COLORS.background.mountains.far} />
        </mesh>
        <mesh position={[bgWidth * 0.7, -viewport.height/4 - 1, 0]}>
          <sphereGeometry args={[5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={COLORS.background.mountains.near} />
        </mesh>
      </group>
      
      <group position={[bgWidth, 0, -15]}>
        {/* Cloud 1 */}
        <mesh position={[bgWidth * 0.3, viewport.height/5, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>
        <mesh position={[bgWidth * 0.3 + 0.6, viewport.height/5 + 0.1, 0]}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>
        
        {/* Cloud 2 */}
        <mesh position={[bgWidth * 0.8, viewport.height/4, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>
        <mesh position={[bgWidth * 0.8 - 0.7, viewport.height/4 + 0.2, 0]}>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>
      </group>
      
      <group position={[bgWidth, 0, -10]}>
        {/* Foreground hills - darker and more defined */}
        <mesh position={[bgWidth * 0.25, -viewport.height/3 - 1, 0]}>
          <sphereGeometry args={[6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#8e2de2" /> {/* Dark purple */}
        </mesh>
        <mesh position={[bgWidth * 0.6, -viewport.height/3 - 0.5, 0]}>
          <sphereGeometry args={[5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#a367dc" /> {/* Medium purple */}
        </mesh>
        <mesh position={[bgWidth * 0.85, -viewport.height/3 - 1.5, 0]}>
          <sphereGeometry args={[7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#7209b7" /> {/* Deep purple */}
        </mesh>
      </group>
    </group>
  );
};

// Background component rarely needs to re-render, so we memoize it
// Since it doesn't take any props, we don't need a custom comparison function
export default memo(Background);