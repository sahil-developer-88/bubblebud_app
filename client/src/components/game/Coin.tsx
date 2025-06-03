import { useRef, useEffect, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CoinProps {
  position: [number, number, number];
  collected: boolean;
}

const Coin = ({ position, collected }: CoinProps) => {
  const ref = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);
  
  // Simple animation
  useFrame((_, delta) => {
    if (ref.current && !collected) {
      // Gentle rotation
      ref.current.rotation.y += delta * 1.5;
      
      // Subtle floating motion
      const floatOffset = Math.sin(Date.now() * 0.002) * 0.1;
      ref.current.position.y = position[1] + floatOffset;
      
      // Simple pulse for the glow
      if (glow.current) {
        glow.current.intensity = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
      }
    }
  });
  
  // Collection animation
  useEffect(() => {
    if (collected && ref.current) {
      // Simple animation for coin collection
      const animateCoin = () => {
        if (!ref.current) return;
        
        ref.current.scale.x -= 0.1;
        ref.current.scale.y -= 0.1;
        ref.current.scale.z -= 0.1;
        
        if (ref.current.scale.x > 0.01) {
          requestAnimationFrame(animateCoin);
        }
      };
      
      animateCoin();
    }
  }, [collected]);

  if (collected) {
    // Return an empty group for collected coins
    return <group position={position} />;
  }

  return (
    <group ref={ref} position={position}>
      {/* Simplified coin - just a disc */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 16]} />
        <meshStandardMaterial 
          color="#fcd34d" 
          metalness={0.6}
          roughness={0.2}
          emissive="#eab308"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Simple glow effect */}
      <pointLight 
        ref={glow}
        position={[0, 0, 0]} 
        distance={2} 
        intensity={0.8} 
        color="#eab308" 
      />
    </group>
  );
};

// Create a memoized version with custom comparison logic
const MemoizedCoin = memo(Coin, (prevProps: CoinProps, nextProps: CoinProps) => {
  // Only re-render if position or collected state has changed
  return (
    prevProps.collected === nextProps.collected &&
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2]
  );
});

export default MemoizedCoin;
