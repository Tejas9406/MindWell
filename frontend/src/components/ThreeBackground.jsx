import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

const FloatingShape = ({ position, color, speed, rotationSpeed }) => {
    const mesh = useRef();

    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x += delta * rotationSpeed;
            mesh.current.rotation.y += delta * rotationSpeed;
        }
    });

    return (
        <Float speed={speed} rotationIntensity={1} floatIntensity={1}>
            <mesh ref={mesh} position={position}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.1}
                    metalness={0.8}
                    transparent
                    opacity={0.6}
                />
            </mesh>
        </Float>
    );
};

const ThreeBackground = () => {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
            <Canvas camera={{ position: [0, 0, 10], fov: 75 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#ff00ff" />
                {/* Reduced number of shapes to save resources */}
                <FloatingShape position={[-3, 2, -5]} color="#ff0080" speed={2} rotationSpeed={0.2} />
                <FloatingShape position={[4, -2, -2]} color="#00bfff" speed={3} rotationSpeed={0.3} />
            </Canvas>
        </div>
    );
};

export default ThreeBackground;
