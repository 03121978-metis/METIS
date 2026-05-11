import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { Suspense } from "react";
import { useProject } from "../store";
import { getCatalogItem } from "../kitchen/catalog";
import { wallDirection, wallLength } from "../kitchen/validation";
import type { ModulePlacement, Wall } from "../kitchen/types";

const MM = 0.001; // 1 mm en metros (Three.js usa metros por convención)

function WallMesh({ wall }: { wall: Wall }) {
  const len = wallLength(wall) * MM;
  const cx = ((wall.start.x + wall.end.x) / 2) * MM;
  const cz = ((wall.start.y + wall.end.y) / 2) * MM;
  const ang = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const thickness = wall.thickness * MM;
  const height = 2.4;
  return (
    <mesh position={[cx, height / 2, cz]} rotation={[0, -ang, 0]}>
      <boxGeometry args={[len, height, thickness]} />
      <meshStandardMaterial color="#e8e2d3" />
    </mesh>
  );
}

function ModuleMesh({ placement }: { placement: ModulePlacement }) {
  const project = useProject();
  const item = getCatalogItem(placement.sku);
  if (!item) return null;

  if (!placement.wallId || placement.offsetFromStart === undefined) {
    // Placeholder isla: cubo en su posición libre.
    if (!placement.position) return null;
    const w = item.width * MM;
    const d = item.depth * MM;
    const h = item.height * MM;
    return (
      <mesh position={[placement.position.x * MM, h / 2, placement.position.y * MM]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#c5d4e8" />
      </mesh>
    );
  }

  const wall = project.room.walls.find((w) => w.id === placement.wallId);
  if (!wall) return null;
  const dir = wallDirection(wall);
  const normal = { x: dir.y, y: -dir.x }; // hacia el interior (asumiendo polígono horario)
  const off = (placement.offsetFromStart + item.width / 2) * MM;
  const dep = (item.depth / 2) * MM;

  const cx = wall.start.x * MM + dir.x * off + normal.x * dep;
  const cz = wall.start.y * MM + dir.y * off + normal.y * dep;
  const ang = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const mountBottom = (item.mountHeight ?? 0) * MM;
  const h = item.height * MM;

  const color =
    item.family === "wall" ? "#cfe1ce"
    : item.family === "tall" ? "#dac8a8"
    : item.family === "appliance" ? "#aeb6c1"
    : item.family === "sink" ? "#b6d3df"
    : "#d8c9b3";

  return (
    <mesh position={[cx, mountBottom + h / 2, cz]} rotation={[0, -ang, 0]}>
      <boxGeometry args={[item.width * MM, h, item.depth * MM]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function FloorAndCeiling() {
  const project = useProject();
  // Caja envolvente sencilla a partir de los muros.
  const xs = project.room.walls.flatMap((w) => [w.start.x, w.end.x]);
  const ys = project.room.walls.flatMap((w) => [w.start.y, w.end.y]);
  const minX = Math.min(...xs) * MM;
  const maxX = Math.max(...xs) * MM;
  const minY = Math.min(...ys) * MM;
  const maxY = Math.max(...ys) * MM;
  const cx = (minX + maxX) / 2;
  const cz = (minY + maxY) / 2;
  const w = maxX - minX;
  const d = maxY - minY;

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#f5f1e8" />
      </mesh>
    </>
  );
}

export function Scene3D() {
  const project = useProject();

  return (
    <Canvas shadows camera={{ position: [4, 3, 4], fov: 50 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={0.9} castShadow />
        <Grid args={[20, 20]} cellColor="#cdd3da" sectionColor="#9aa3ad" infiniteGrid fadeDistance={20} />
        <FloorAndCeiling />
        {project.room.walls.map((w) => <WallMesh key={w.id} wall={w} />)}
        {project.modules.map((m) => <ModuleMesh key={m.id} placement={m} />)}
        <OrbitControls makeDefault target={[1.5, 1, 1.5]} />
      </Suspense>
    </Canvas>
  );
}
