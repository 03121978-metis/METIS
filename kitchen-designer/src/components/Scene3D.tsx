import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import { useProject } from "../store";
import { getCatalogItem } from "../kitchen/catalog";
import { wallDirection, wallInteriorNormal, wallLength } from "../kitchen/validation";
import type { ModulePlacement, Wall } from "../kitchen/types";
import { computeWorktopShapes } from "../lib/worktop";

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
  const h = item.height * MM;
  // Calculamos la altura del borde inferior del módulo (mountBottom) tomando
  // en cuenta dónde va realmente cada cosa en una cocina real:
  //   - Fregaderos: cuelgan de la encimera (borde superior = topHeight).
  //   - Placas inducción/gas: encastradas, asoman ~5 mm sobre la encimera.
  //   - Resto: mountHeight explícito, o 0 (suelo) por defecto.
  const worktopTopMM = (project.worktop?.topHeight ?? 930) * MM;
  let mountBottom: number;
  if (item.mountHeight !== undefined) {
    mountBottom = item.mountHeight * MM;
  } else if (item.family === "sink") {
    mountBottom = worktopTopMM - h;
  } else if (item.sku === "A-IND-60" || item.sku === "A-GAS-60") {
    mountBottom = worktopTopMM - h + 0.005;
  } else {
    mountBottom = 0;
  }

  // Acabado por defecto: perfil J · blanco mate para todo lo modular.
  // Los electrodomésticos quedan más oscuros para distinguirlos a la vista.
  const isMatteWhite =
    item.family === "base" || item.family === "wall" || item.family === "tall";
  const color =
    isMatteWhite ? "#f0ede6"
    : item.family === "appliance" ? "#7a8088"
    : item.family === "sink" ? "#b6d3df"
    : "#d8c9b3";
  const roughness = isMatteWhite ? 0.92 : 0.45;
  const metalness = isMatteWhite ? 0 : (item.family === "appliance" ? 0.4 : 0);

  // Perfil J: garganta oscura horizontal en el canto superior del frente del
  // mueble (sistema de apertura handleless). Sobresale 1 mm por delante del
  // frente para evitar z-fighting.
  const grooveH = 0.03;      // 30 mm de alto
  const grooveD = 0.005;     // 5 mm de profundidad visible
  const grooveOffsetN = (item.depth / 2) * MM + grooveD / 2 + 0.0005;
  const grooveX = wall.start.x * MM + dir.x * off + normal.x * (innerOff + grooveOffsetN);
  const grooveZ = wall.start.y * MM + dir.y * off + normal.y * (innerOff + grooveOffsetN);
  const grooveY = mountBottom + h - grooveH / 2 - 0.002;

  return (
    <group>
      <mesh position={[cx, mountBottom + h / 2, cz]} rotation={[0, -ang, 0]} scale={[placement.mirrored ? -1 : 1, 1, 1]}>
        <boxGeometry args={[item.width * MM, h, item.depth * MM]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      </mesh>
      {isMatteWhite && (
        <mesh position={[grooveX, grooveY, grooveZ]} rotation={[0, -ang, 0]}>
          <boxGeometry args={[item.width * MM - 0.01, grooveH, grooveD]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      )}
      {/* Frigorífico encastrable: bisagras horizontales (separador entre
          frigo y congelador) + rejilla de ventilación en el zócalo. */}
      {item.sku === "T-60-FRI" && (() => {
        const frontX = wall.start.x * MM + dir.x * off + normal.x * (innerOff + item.depth * MM - 0.0015);
        const frontZ = wall.start.y * MM + dir.y * off + normal.y * (innerOff + item.depth * MM - 0.0015);
        const lineW = item.width * MM - 0.02;
        return (
          <>
            {/* Línea horizontal a 2/3 (separación frigo-congelador) */}
            <mesh position={[frontX, mountBottom + h * 0.66, frontZ]} rotation={[0, -ang, 0]}>
              <boxGeometry args={[lineW, 0.008, 0.002]} />
              <meshStandardMaterial color="#888" roughness={0.5} metalness={0.4} />
            </mesh>
            {/* Rejilla inferior (sólo si va a suelo, no si lleva mountHeight) */}
            {(item.mountHeight ?? 0) === 0 && (
              <mesh position={[frontX, 0.08, frontZ]} rotation={[0, -ang, 0]}>
                <boxGeometry args={[lineW, 0.04, 0.002]} />
                <meshStandardMaterial color="#555" roughness={0.7} metalness={0.2} />
              </mesh>
            )}
          </>
        );
      })()}
      {/* Despensa: dos puertas grandes con separación a la altura del
          tirador-J intermedio (parte usable a ~870 mm). */}
      {item.sku === "T-60-DES" && (() => {
        const frontX = wall.start.x * MM + dir.x * off + normal.x * (innerOff + item.depth * MM - 0.0015);
        const frontZ = wall.start.y * MM + dir.y * off + normal.y * (innerOff + item.depth * MM - 0.0015);
        const lineW = item.width * MM - 0.02;
        return (
          <mesh position={[frontX, 0.87, frontZ]} rotation={[0, -ang, 0]}>
            <boxGeometry args={[lineW, 0.018, 0.002]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
        );
      })()}
      {/* Aparatos encastrados dentro de la columna T-60-HOR */}
      {item.sku === "T-60-HOR" && (() => {
        // Centro del aparato a la altura del frente del mueble.
        const baseX = wall.start.x * MM + dir.x * off + normal.x * (innerOff + item.depth * MM - 0.003);
        const baseZ = wall.start.y * MM + dir.y * off + normal.y * (innerOff + item.depth * MM - 0.003);
        const ovenH = 0.595, ovenW = 0.59, ovenD = 0.006;
        const microH = 0.388, microW = 0.59, microD = 0.006;
        const ovenY = 0.87 + ovenH / 2;
        const microY = 1.55 + microH / 2;
        const glassDX = normal.x * 0.001;
        const glassDZ = normal.y * 0.001;
        return (
          <>
            <mesh position={[baseX, ovenY, baseZ]} rotation={[0, -ang, 0]}>
              <boxGeometry args={[ovenW, ovenH, ovenD]} />
              <meshStandardMaterial color="#2c2c2c" roughness={0.35} metalness={0.5} />
            </mesh>
            <mesh position={[baseX + glassDX, ovenY, baseZ + glassDZ]} rotation={[0, -ang, 0]}>
              <boxGeometry args={[ovenW * 0.78, ovenH * 0.6, 0.0012]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.12} metalness={0.25} />
            </mesh>
            <mesh position={[baseX, microY, baseZ]} rotation={[0, -ang, 0]}>
              <boxGeometry args={[microW, microH, microD]} />
              <meshStandardMaterial color="#2c2c2c" roughness={0.35} metalness={0.5} />
            </mesh>
            <mesh position={[baseX + glassDX, microY, baseZ + glassDZ]} rotation={[0, -ang, 0]}>
              <boxGeometry args={[microW * 0.65, microH * 0.55, 0.0012]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.12} metalness={0.25} />
            </mesh>
          </>
        );
      })()}
    </group>
  );
}

interface RoomBbox {
  cx: number; cz: number; sx: number; sz: number; diag: number;
}

function WorktopMeshes() {
  const project = useProject();
  const cfg = project.worktop;
  if (!cfg || cfg.mode === "none") return null;
  const shapes = computeWorktopShapes(project);
  const thickness = cfg.thickness * MM;
  const depthM = cfg.depth * MM;
  const topY = cfg.topHeight * MM;
  const matColor = "#d6cbb0";
  return (
    <>
      {shapes.map((s, i) => {
        if (s.kind === "wall-band") {
          const wall = project.room.walls.find((w) => w.id === s.wallId);
          if (!wall) return null;
          const dir = wallDirection(wall);
          const normal = wallInteriorNormal(wall);
          const innerOff = (wall.thickness / 2) * MM;
          const len = (s.end - s.start) * MM;
          const midOff = ((s.start + s.end) / 2) * MM;
          const cx = wall.start.x * MM + dir.x * midOff + normal.x * (innerOff + depthM / 2);
          const cz = wall.start.y * MM + dir.y * midOff + normal.y * (innerOff + depthM / 2);
          const ang = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
          return (
            <mesh key={`wt_${i}`} position={[cx, topY - thickness / 2, cz]} rotation={[0, -ang, 0]}>
              <boxGeometry args={[len, thickness, depthM]} />
              <meshStandardMaterial color={matColor} roughness={0.4} metalness={0.05} />
            </mesh>
          );
        }
        if (s.kind === "corner-fill") {
          // Cuadrado axis-aligned al plano XZ; rotación irrelevante.
          const sideM = s.size * MM;
          return (
            <mesh
              key={`wt_${i}`}
              position={[s.center.x * MM, topY - thickness / 2, s.center.y * MM]}
              rotation={[0, 0, 0]}
            >
              <boxGeometry args={[sideM, thickness, sideM]} />
              <meshStandardMaterial color={matColor} roughness={0.4} metalness={0.05} />
            </mesh>
          );
        }
        // island
        return (
          <mesh
            key={`wt_${i}`}
            position={[s.centerX * MM, topY - thickness / 2, s.centerY * MM]}
            rotation={[0, -s.rotationRad, 0]}
          >
            <boxGeometry args={[s.width * MM, thickness, s.depth * MM]} />
            <meshStandardMaterial color={matColor} roughness={0.4} metalness={0.05} />
          </mesh>
        );
      })}
    </>
  );
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
        <WorktopMeshes />
        {project.modules.map((m) => <ModuleMesh key={m.id} placement={m} />)}
        <OrbitControls makeDefault target={[bbox.cx, 1.2, bbox.cz]} />
      </Suspense>
    </Canvas>
  );
}
