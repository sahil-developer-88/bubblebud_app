import { forwardRef, useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
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

const Character = forwardRef<THREE.Group, JSX.IntrinsicElements["group"]>(
  (props, ref) => {
    const innerRef = useRef<THREE.Group>(null);
    const { gameState, score } = useBreathingGame();
    const [isSmiling, setIsSmiling] = useState(false);
    const [isSad, setIsSad] = useState(false);
    const [lastScore, setLastScore] = useState(0);
    const [trailBubbles, setTrailBubbles] = useState<TrailBubble[]>([]);
    
    // Create gradient material for the bubble
    const bubbleMaterial = useMemo(() => {
      // Create a canvas for the gradient texture
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create a beautiful gradient with electric blues as requested
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 90);
        
        // Add color stops for the gradient with electric blue colors
        gradient.addColorStop(0, '#60efff'); // Bright electric blue (center)
        gradient.addColorStop(0.3, '#45b3ff'); // Vivid blue
        gradient.addColorStop(0.6, '#0091ff'); // Strong electric blue
        gradient.addColorStop(0.8, '#0077ff'); // Deeper electric blue
        gradient.addColorStop(1, '#0062ff'); // Edge color - intense blue
        
        // Fill the canvas with the gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Create material with the texture
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.1, // Less roughness for shinier look
          metalness: 0.7, // More metalness for vibrant reflections
          transparent: true,
          opacity: 0.9, // Slightly more opaque
          emissive: '#60efff', // Electric blue glow to match color scheme
          emissiveIntensity: 0.5 // Stronger emissive effect for electric look
        });
        
        return material;
      }
      
      // Fallback material if canvas context isn't available
      return new THREE.MeshStandardMaterial({
        color: '#0091ff', // Electric blue as requested
        roughness: 0.1,
        metalness: 0.7,
        transparent: true,
        opacity: 0.9
      });
    }, []);
    
    // Trail bubble material - much brighter electric blue
    const trailBubbleMaterial = useMemo(() => {
      // Use a basic material with emission for maximum brightness
      return new THREE.MeshBasicMaterial({
        color: '#60efff', // Bright vibrant electric blue
        transparent: true,
        opacity: 0.9
      });
    }, []);
    
    // Check for coin collection (score change)
    useEffect(() => {
      if (score > lastScore) {
        // Open mouth smile animation
        setIsSmiling(true);
        setTimeout(() => setIsSmiling(false), 500); // Return to normal after 500ms
        setLastScore(score);
      }
    }, [score, lastScore]);
    
    // Listen for missed coin events
    useEffect(() => {
      const handleMissedCoin = () => {
        // Show sad face animation - now shorter duration for quicker response
        setIsSad(true);
        setTimeout(() => setIsSad(false), 400); // Return to normal after 400ms
      };
      
      // Add event listener
      window.addEventListener('coinMissed', handleMissedCoin);
      
      // Clean up
      return () => {
        window.removeEventListener('coinMissed', handleMissedCoin);
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
        if (Math.random() < 0.05) { // 5% chance each frame to create a bubble
          const newBubble: TrailBubble = {
            position: [
              -0.2 - Math.random() * 0.5, // Behind the character
              (Math.random() - 0.5) * 0.8, // Vary vertical position
              (Math.random() - 0.5) * 0.3  // Vary depth
            ],
            scale: 0.15 + Math.random() * 0.25, // Larger size for more visibility
            opacity: 0.9 + Math.random() * 0.1, // Higher opacity for brightness
            lifetime: 0,
            maxLifetime: 1 + Math.random() * 2 // Live for 1-3 seconds
          };
          setTrailBubbles(prev => [...prev, newBubble]);
        }
        
        // Update trail bubbles
        setTrailBubbles(prevBubbles => 
          prevBubbles
            .map(bubble => {
              // Create new position with correct typing
              const newPosition: [number, number, number] = [
                bubble.position[0] - delta * 0.5, // Move left
                bubble.position[1] + delta * 0.2 * (Math.random() - 0.5), // Float up slightly
                bubble.position[2]
              ];
              
              return {
                ...bubble,
                position: newPosition,
                opacity: bubble.opacity * (1 - delta * 0.5), // Fade out
                lifetime: bubble.lifetime + delta
              };
            })
            // Remove bubbles that are too old or too far
            .filter(bubble => bubble.lifetime < bubble.maxLifetime && bubble.position[0] > -5)
        );
      }
    });

    return (
      <group ref={ref} {...props}>
        <group ref={innerRef}>
          {/* Main bubble body with electric blue gradient */}
          <mesh castShadow position={[0, 0, 0]}>
            <sphereGeometry args={[0.8, 32, 32]} />
            <primitive object={bubbleMaterial} />
          </mesh>
          
          {/* Eyes - moved forward to be clearly visible - larger and no highlights */}
          <mesh position={[0.25, 0.2, 0.8]}>
            <sphereGeometry args={[0.15, 24, 24]} /> {/* Slightly larger */}
            <meshBasicMaterial color="#000000" />
          </mesh>
          
          <mesh position={[-0.25, 0.2, 0.8]}>
            <sphereGeometry args={[0.15, 24, 24]} /> {/* Slightly larger */}
            <meshBasicMaterial color="#000000" />
          </mesh>
          
          {/* Mouth - changes between smile, sad, and normal states */}
          {isSmiling ? (
            // Open smile - appears when collecting coins
            <mesh position={[0, -0.1, 0.8]}>
              <sphereGeometry args={[0.18, 24, 24]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          ) : isSad ? (
            // Sad face - appears when missing coins
            <mesh position={[0, -0.2, 0.8]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.25, 0.05, 32, 16, Math.PI]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          ) : (
            // Normal closed smile
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
            color="#60efff" // Electric blue glow to match character
          />
        </group>
        
        {/* Bright electric blue trail bubbles */}
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
            {/* Small light for each bubble to enhance visibility */}
            <pointLight 
              distance={1.5} 
              intensity={0.3} 
              color="#60efff"
            />
          </group>
        ))}
      </group>
    );
  }
);

Character.displayName = "Character";
export default Character;
