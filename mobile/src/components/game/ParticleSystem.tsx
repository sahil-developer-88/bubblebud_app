import { useRef, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";

// Particle interface
interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

// Interface for the component ref
interface ParticleSystemRef {
  emitAt: (x: number, y: number) => void;
}

const ParticleSystem = forwardRef<ParticleSystemRef>((_, ref) => {
  const particles = useRef<Particle[]>([]);
  const particlesGeometry = useRef<THREE.BufferGeometry>(
    new THREE.BufferGeometry()
  );
  const particlesMaterial = useRef<THREE.PointsMaterial>(
    new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
  );

  // Expose the emitAt method to parent components
  useImperativeHandle(ref, () => ({
    emitAt: (x: number, y: number) => {
      // Create a smaller burst of particles (reduced for performance)
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.05 + Math.random() * 0.1;

        particles.current.push({
          position: new THREE.Vector3(x, y, 0),
          velocity: new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            (Math.random() - 0.5) * 0.05
          ),
          color: new THREE.Color(
            0.9 + Math.random() * 0.1, // R: golden color
            0.6 + Math.random() * 0.3, // G
            0.1 + Math.random() * 0.1 // B
          ),
          size: 0.3 + Math.random() * 0.5,
          life: 1.0,
          maxLife: 1.0,
        });
      }
    },
  }));

  // Update particles
  useFrame((_, delta) => {
    if (particles.current.length === 0) return;

    // Update particle positions and life
    particles.current.forEach((particle) => {
      particle.position.add(particle.velocity);
      particle.life -= delta;

      // Add gravity effect
      particle.velocity.y -= 0.001;

      // Slow down particles over time
      particle.velocity.multiplyScalar(0.98);
    });

    // Remove dead particles
    particles.current = particles.current.filter((p) => p.life > 0);

    // Update geometry
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    particles.current.forEach((particle) => {
      positions.push(
        particle.position.x,
        particle.position.y,
        particle.position.z
      );

      // Fade out color based on life
      const fadeColor = particle.color
        .clone()
        .multiplyScalar(particle.life / particle.maxLife);
      colors.push(fadeColor.r, fadeColor.g, fadeColor.b);

      // Particle shrinks as it dies
      sizes.push(particle.size * (particle.life / particle.maxLife));
    });

    if (positions.length > 0) {
      particlesGeometry.current.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );
      particlesGeometry.current.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3)
      );
      particlesGeometry.current.setAttribute(
        "size",
        new THREE.Float32BufferAttribute(sizes, 1)
      );

      particlesGeometry.current.attributes.position.needsUpdate = true;
      particlesGeometry.current.attributes.color.needsUpdate = true;
      particlesGeometry.current.attributes.size.needsUpdate = true;
    }
  });

  return (
    <points>
      <primitive object={particlesGeometry.current} />
      <primitive object={particlesMaterial.current} />
    </points>
  );
});

ParticleSystem.displayName = "ParticleSystem";
export default ParticleSystem;
