import { Vector3 } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface HexInterface {
  position: Vector3;
  color: number;
}

const Hex = (props: HexInterface) => {
  const { position, color } = props;

  const hexagonGeometry = new THREE.CylinderGeometry(10, 10, 0.1, 6, 10);
  const hexagonMaterial = new THREE.MeshBasicMaterial({ color });

  const handleHover = (event: any) => {
    event.object.material.color.setHex(0xffff00); // Change color to yellow on hover
  };

  const handleHoverOut = (event: any) => {
    event.object.material.color.setHex(0x00ff00); // Change color back to green on hover out
  };

  return (
    <mesh
      geometry={hexagonGeometry}
      material={hexagonMaterial}
      position={position}
      rotation={[Math.PI / 2, 0, 0]}
      onPointerOver={handleHover}
      onPointerOut={handleHoverOut}
    />
  );
};

const HexagonMap = () => {
  const mapSize = 13; // Increased map size to accommodate wilderness tiles
  const hexRadius = 10;

  const hexHeight = Math.sqrt(3) * hexRadius;
  const hexWidth = Math.sqrt(6) * hexRadius;
  const hexVerticalSpacing = hexHeight * 0.91;

  const hexagons = [];

  for (let row = 0; row < mapSize; row++) {
    const cols = mapSize - Math.abs(row - Math.floor(mapSize / 2));

    for (let col = 0; col < cols; col++) {
      const x = (col - (cols - 1) / 2) * hexWidth * 0.75;
      const y = row * hexVerticalSpacing - ((mapSize - 1) / 2) * 1;
      const z = 0;

      // Determine if the current hexagon is part of the original map or wilderness
      const isWilderness =
        row === 0 ||
        row === mapSize - 1 ||
        col === 0 ||
        col === cols - 1 ||
        row === 1 ||
        row === mapSize - 2 ||
        col === 1 ||
        col === cols - 2;

      // Use gray color for wilderness tiles, green for original map tiles
      const hexColor = isWilderness ? 0x808080 : 0x00ff00; // Gray for wilderness, green for original

      hexagons.push(<Hex key={`${row}-${col}`} position={[x, y, z]} color={hexColor} />);
    }
  }

  return <group>{hexagons}</group>;
};

const RealmHexagonScene = () => {
  const mapRef = useRef<any>();

  return (
    <>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <group rotation={[-Math.PI / 2, 0, 0]} ref={mapRef}>
        <HexagonMap />
      </group>
    </>
  );
};

export default RealmHexagonScene;
