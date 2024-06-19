import { useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function WarriorModel() {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF("/models/chess_piece_king.glb");

  const model = useMemo(() => {
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        child.material = child.material.clone(); // Clone the material to avoid mutating the original material
        child.material.userData.originalColor = child.material.color.getHex();
      }
    });
    return gltf.scene.clone();
  }, []);

  const handlePointerEnter = () => {
    model.traverse((child: any) => {
      if (child.isMesh) {
        child.material.color.set("yellow"); // Change color to yellow on hover
      }
    });
  };

  const handlePointerOut = () => {
    model.traverse((child: any) => {
      if (child.isMesh) {
        child.material.color.setHex(child.material.userData.originalColor); // Revert to original color
      }
    });
  };

  return (
    <group ref={groupRef} scale={12} onPointerEnter={handlePointerEnter} onPointerOut={handlePointerOut}>
      <primitive castShadow receiveShadow object={model} renderOrder={1} />
    </group>
  );
}
