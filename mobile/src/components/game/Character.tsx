import { forwardRef, useRef, useState, useEffect, useMemo } from "react";
import { useFrame, ThreeElements } from "@react-three/fiber/native";
import * as THREE from "three";
import { useBreathingGame } from "@/lib/stores/useBreathingGame";

// Trail bubble type
interface TrailBubble {
  position: [number, number, number];
  scale: number;
  opacity: number;
  lifetime: number;
  maxLifetime: number;
}

const Character = forwardRef<THREE.Group, ThreeElements["group"]>(
  (props, ref) => {
    const innerRef = useRef<THREE.Group>(null);
    const { gameState, score } = useBreathingGame();
    const [isSmiling, setIsSmiling] = useState(false);
    const [isSad, setIsSad] = useState(false);
    const [lastScore, setLastScore] = useState(0);
    const [trailBubbles, setTrailBubbles] = useState<TrailBubble[]>([]);

    // Create material for the bubble using Three.js built-in features
    const bubbleMaterial = useMemo(() => {
      return new THREE.MeshStandardMaterial({
        color: "#60efff", // Bright electric blue
        roughness: 0.1,
        metalness: 0.7,
        transparent: true,
        opacity: 0.9,
        emissive: "#60efff",
        emissiveIntensity: 0.5,
      });
    }, []);

    // Trail bubble material - much brighter electric blue
    const trailBubbleMaterial = useMemo(() => {
      return new THREE.MeshBasicMaterial({
        color: "#60efff",
        transparent: true,
        opacity: 0.9,
      });
    }, []);

    // Check for coin collection (score change)
    useEffect(() => {
      if (score > lastScore) {
        setIsSmiling(true);
        setTimeout(() => setIsSmiling(false), 500);
        setLastScore(score);
      }
    }, [score, lastScore]);

    // Listen for missed coin events
    useEffect(() => {
      const handleMissedCoin = () => {
        setIsSad(true);
        setTimeout(() => setIsSad(false), 400);
      };

      // Use React Native's event emitter instead of window
      const subscription =
        require("react-native").DeviceEventEmitter.addListener(
          "coinMissed",
          handleMissedCoin
        );

      return () => {
        subscription.remove();
      };
    }, []);

    // Animation for character and trail bubbles
    useFrame((_, delta) => {
      if (!innerRef.current) return;

      if (gameState === "playing") {
        // Add a subtle floating animation
        innerRef.current.rotation.z = Math.sin(Date.now() * 0.003) * 0.1;

        // Small bobbing motion
        innerRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.1;

        // Create trail bubbles occasionally
        if (Math.random() < 0.05) {
          const newBubble: TrailBubble = {
            position: [
              -0.2 - Math.random() * 0.5,
              (Math.random() - 0.5) * 0.8,
              (Math.random() - 0.5) * 0.3,
            ],
            scale: 0.15 + Math.random() * 0.25,
            opacity: 0.9 + Math.random() * 0.1,
            lifetime: 0,
            maxLifetime: 1 + Math.random() * 2,
          };
          setTrailBubbles((prev) => [...prev, newBubble]);
        }

        // Update trail bubbles
        setTrailBubbles((prevBubbles) =>
          prevBubbles
            .map((bubble) => {
              const newPosition: [number, number, number] = [
                bubble.position[0] - delta * 0.5,
                bubble.position[1] + delta * 0.2 * (Math.random() - 0.5),
                bubble.position[2],
              ];

              return {
                ...bubble,
                position: newPosition,
                opacity: bubble.opacity * (1 - delta * 0.5),
                lifetime: bubble.lifetime + delta,
              };
            })
            .filter(
              (bubble) =>
                bubble.lifetime < bubble.maxLifetime && bubble.position[0] > -5
            )
        );
      }
    });

    return (
      <group ref={ref} {...props}>
        <group ref={innerRef}>
          {/* Main bubble body */}
          <mesh castShadow position={[0, 0, 0]}>
            <sphereGeometry args={[0.8, 32, 32]} />
            <primitive object={bubbleMaterial} />
          </mesh>

          {/* Eyes */}
          <mesh position={[0.25, 0.2, 0.8]}>
            <sphereGeometry args={[0.15, 24, 24]} />
            <meshBasicMaterial color="#000000" />
          </mesh>

          <mesh position={[-0.25, 0.2, 0.8]}>
            <sphereGeometry args={[0.15, 24, 24]} />
            <meshBasicMaterial color="#000000" />
          </mesh>

          {/* Mouth */}
          {isSmiling ? (
            <mesh position={[0, -0.1, 0.8]}>
              <sphereGeometry args={[0.18, 24, 24]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          ) : isSad ? (
            <mesh position={[0, -0.2, 0.8]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.25, 0.05, 32, 16, Math.PI]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          ) : (
            <mesh position={[0, -0.1, 0.8]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.25, 0.05, 32, 16, Math.PI]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          )}

          {/* Electric bubble glow */}
          <pointLight
            position={[0, 0, 0]}
            distance={3.5}
            intensity={0.8}
            color="#60efff"
          />
        </group>

        {/* Trail bubbles */}
        {trailBubbles.map((bubble, i) => (
          <group
            key={`bubble-${i}`}
            position={bubble.position}
            scale={[bubble.scale, bubble.scale, bubble.scale]}
          >
            <mesh>
              <sphereGeometry args={[1, 16, 16]} />
              <primitive object={trailBubbleMaterial.clone()} />
            </mesh>
            <pointLight distance={1.5} intensity={0.3} color="#60efff" />
          </group>
        ))}
      </group>
    );
  }
);

Character.displayName = "Character";
export default Character;
