import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import { useProject } from "../store";
import { getCatalogItem } from "../kitchen/catalog";
import { wallDirection, wallInteriorNormal, wallLength } from "../kitchen/validation";
import type { ModulePlacement, Wall } from "../kitchen/types";

const MM = 0.001; // 1 mm en metros

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
    if (!placement.position) return null;
    const w = item.width * MM;
    const d = item.depth * MM;
    const h = item.height * MM;
    return (
      <mesh position={[placement.position.x * MM, h / 2, placement.position.y * MM]} rotation={[0, -placement.rotation, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#c5d4e8" />
      </mesh>
    );
  }

  const wall = project.room.walls.find((w) => w.id === placement.wallId);
  if (!wall) return null;
  const dir = wallDirection(wall);
  const normal = wallInteriorNormal(wall);
  const off = (placement.offsetFromStart + item.width / 2) * MM;
  const innerOff = (wall.thickness / 2) * MM;
  const dep = (item.depth / 2) * MM;

  const cx = wall.start.x * MM + dir.x * off + normal.x * (innerOff + dep);
  const cz = wall.start.y * MM + dir.y * off + normal.y * (innerOff + dep);
  const wallAng = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const ang = wallAng + (placement.rotation || 0);
  const mountBottom = (item.mountHeight ?? 0) * MM;
  const h = item.height * MM;

  const color =
    item.family === "wall" ? "#cfe1ce"
    : item.family === "tall" ? "#dac8a8"
    : item.family === "appliance" ? "#aeb6c1"
    : item.family === "sink" ? "#b6d3df"
    : "#d8c9b3";

  return (
    <mesh position={[cx, mountBottom + h / 2, cz]} rotation={[0, -ang, 0]} scale={[placement.mirrored ? -1 : 1, 1, 1]}>
      <boxGeometry args={[item.width * MM, h, item.depth * MM]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

interface RoomBbox {
  cx: number; cz: number; sx: number; sz: number; diag: number;
}

function FloorAndCeiling({ bbox }: { bbox: RoomBbox }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bbox.cx, 0, bbox.cz]} receiveShadow>
      <planeGeometry args={[bbox.sx, bbox.sz]} />
      <meshStandardMaterial color="#f5f1e8" />
    </mesh>
  );
}

/** Re-encuadra la cámara cuando cambian las dimensiones de la habitación. */
function CameraRig({ bbox }: { bbox: RoomBbox }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as unknown as
    | { target: { set: (x: number, y: number, z: number) => void }; update: () => void }
    | null;

  useEffect(() => {
    const eyeY = Math.max(2.5, bbox.diag * 0.55);
    const lateral = Math.max(2.0, bbox.diag * 0.55);
    camera.position.set(bbox.cx + lateral, eyeY, bbox.cz + lateral);
    camera.lookAt(bbox.cx, 1.2, bbox.cz);
    if (controls && typeof controls.target?.set === "function") {
      controls.target.set(bbox.cx, 1.2, bbox.cz);
      controls.update?.();
    }
  }, [bbox.cx, bbox.cz, bbox.sx, bbox.sz, bbox.diag, camera, controls]);

  return null;
}

export function Scene3D() {
  const project = useProject();

  const bbox: RoomBbox = useMemo(() => {
    const xs = project.room.walls.flatMap((w) => [w.start.x, w.end.x]);
    const ys = project.room.walls.flatMap((w) => [w.start.y, w.end.y]);
    const minX = Math.min(...xs) * MM;
    const maxX = Math.max(...xs) * MM;
    const minY = Math.min(...ys) * MM;
    const maxY = Math.max(...ys) * MM;
    const sx = maxX - minX;
    const sz = maxY - minY;
    return {
      cx: (minX + maxX) / 2,
      cz: (minY + maxY) / 2,
      sx,
      sz,
      diag: Math.hypot(sx, sz),
    };
  }, [project.room.walls]);

  return (
    <Canvas shadows camera={{ position: [bbox.cx + 4, 3, bbox.cz + 4], fov: 50 }}>
      <Suspense fallback={null}>
        <CameraRig bbox={bbox} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[bbox.cx + 5, 8, bbox.cz + 5]} intensity={0.9} castShadow />
        <Grid args={[20, 20]} cellColor="#cdd3da" sectionColor="#9aa3ad" infiniteGrid fadeDistance={20} />
        <FloorAndCeiling bbox={bbox} />
        {project.room.walls.map((w) => <WallMesh key={w.id} wall={w} />)}
        {project.modules.map((m) => <ModuleMesh key={m.id} placement={m} />)}
        <OrbitControls makeDefault target={[bbox.cx, 1.2, bbox.cz]} />
      </Suspense>
    </Canvas>
  );
}
