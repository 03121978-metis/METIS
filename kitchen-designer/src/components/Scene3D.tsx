import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import type { MeshStandardMaterial } from "three";
import { useProject } from "../store";
import { getCatalogItem } from "../kitchen/catalog";
import { wallDirection, wallInteriorNormal, wallLength } from "../kitchen/validation";
import type { ModulePlacement, Wall } from "../kitchen/types";
import { computeWorktopShapes } from "../lib/worktop";

const MM = 0.001; // 1 mm en metros

// ─── Paleta de materiales ─────────────────────────────────────────────────
const MAT = {
  floor: { color: "#c9a679", roughness: 0.68, metalness: 0.02 },
  wall: { color: "#ece7dc", roughness: 0.88, metalness: 0 },
  ceiling: { color: "#f6f4ef", roughness: 0.95, metalness: 0 },
  cabinetWhite: { color: "#f3f0e9", roughness: 0.78, metalness: 0 },
  worktopStone: { color: "#dccfb4", roughness: 0.35, metalness: 0.05 },
  applianceSteel: { color: "#5a5e62", roughness: 0.32, metalness: 0.78 },
  applianceBlack: { color: "#1a1a1a", roughness: 0.18, metalness: 0.55 },
  sinkCeramic: { color: "#f4f3ef", roughness: 0.18, metalness: 0.04 },
  groove: { color: "#1a1a1a", roughness: 0.85, metalness: 0 },
} as const;

function WallMesh({ wall }: { wall: Wall }) {
  const len = wallLength(wall) * MM;
  const cx = ((wall.start.x + wall.end.x) / 2) * MM;
  const cz = ((wall.start.y + wall.end.y) / 2) * MM;
  const ang = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const thickness = wall.thickness * MM;
  const height = 2.4;
  const normal = wallInteriorNormal(wall);
  const matRef = useRef<MeshStandardMaterial>(null);

  // X-ray: si la cámara está fuera del lado interior del muro, lo atenuamos
  // para no taparle al usuario la vista del interior. Lerp suave.
  useFrame(({ camera }) => {
    const mat = matRef.current;
    if (!mat) return;
    const dx = camera.position.x - cx;
    const dz = camera.position.z - cz;
    const dot = dx * normal.x + dz * normal.y;
    const target = dot > 0 ? 1 : 0.06;
    mat.opacity += (target - mat.opacity) * 0.18;
    mat.transparent = mat.opacity < 0.98;
    mat.depthWrite = mat.opacity > 0.5;
  });

  return (
    <mesh position={[cx, height / 2, cz]} rotation={[0, -ang, 0]} receiveShadow castShadow>
      <boxGeometry args={[len, height, thickness]} />
      <meshStandardMaterial
        ref={matRef}
        color={MAT.wall.color}
        roughness={MAT.wall.roughness}
        metalness={MAT.wall.metalness}
        transparent
        opacity={1}
      />
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
      <mesh position={[placement.position.x * MM, h / 2, placement.position.y * MM]}
            rotation={[0, -placement.rotation, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...MAT.cabinetWhite} />
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

  const isMatteWhite =
    item.family === "base" || item.family === "wall" || item.family === "tall";
  const mat =
    isMatteWhite ? MAT.cabinetWhite
    : item.family === "appliance" ? MAT.applianceSteel
    : item.family === "sink" ? MAT.sinkCeramic
    : MAT.cabinetWhite;

  // Perfil J: hueco visible en el canto superior del frente.
  const grooveH = 0.03;
  const grooveD = 0.006;
  const grooveOffsetN = (item.depth / 2) * MM + grooveD / 2 + 0.0005;
  const grooveX = wall.start.x * MM + dir.x * off + normal.x * (innerOff + grooveOffsetN);
  const grooveZ = wall.start.y * MM + dir.y * off + normal.y * (innerOff + grooveOffsetN);
  const grooveY = mountBottom + h - grooveH / 2 - 0.002;

  // Detalles de partición de puertas (vertical o cajones horizontales).
  const widthMM = item.width * MM;
  const splitFront = (item.depth / 2) * MM + 0.0006;
  const splitX = wall.start.x * MM + dir.x * off + normal.x * (innerOff + splitFront);
  const splitZ = wall.start.y * MM + dir.y * off + normal.y * (innerOff + splitFront);
  const has2P = isMatteWhite && /-2P(-|$)/.test(item.sku);
  const has3C = isMatteWhite && /-3C(-|$)/.test(item.sku);

  return (
    <group>
      <mesh position={[cx, mountBottom + h / 2, cz]} rotation={[0, -ang, 0]}
            scale={[placement.mirrored ? -1 : 1, 1, 1]} castShadow receiveShadow>
        <boxGeometry args={[widthMM, h, item.depth * MM]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* Garganta perfil J */}
      {isMatteWhite && (
        <mesh position={[grooveX, grooveY, grooveZ]} rotation={[0, -ang, 0]}>
          <boxGeometry args={[widthMM - 0.01, grooveH, grooveD]} />
          <meshStandardMaterial {...MAT.groove} />
        </mesh>
      )}
      {/* Vertical split: puertas 2P */}
      {has2P && (
        <mesh position={[splitX, mountBottom + h / 2, splitZ]} rotation={[0, -ang, 0]}>
          <boxGeometry args={[0.002, h - 0.04, 0.003]} />
          <meshStandardMaterial color="#888" roughness={0.7} />
        </mesh>
      )}
      {/* Cajoneras 3C: tres líneas horizontales repartidas */}
      {has3C && [0.25, 0.5, 0.75].map((p, idx) => (
        <mesh key={`c${idx}`} position={[splitX, mountBottom + h * p, splitZ]} rotation={[0, -ang, 0]}>
          <boxGeometry args={[widthMM - 0.02, 0.002, 0.003]} />
          <meshStandardMaterial color="#888" roughness={0.7} />
        </mesh>
      ))}
      {/* Zócalo bajo bases (rellena los 100 mm de patas, recess 30 mm) */}
      {item.family === "base" && (item.mountHeight ?? 0) > 0 && (() => {
        const zocH = (item.mountHeight ?? 0) * MM;
        const zocRecess = 0.03;
        const zocDep = item.depth * MM - 2 * zocRecess;
        const zX = wall.start.x * MM + dir.x * off + normal.x * (innerOff + zocRecess + zocDep / 2);
        const zZ = wall.start.y * MM + dir.y * off + normal.y * (innerOff + zocRecess + zocDep / 2);
        return (
          <mesh position={[zX, zocH / 2, zZ]} rotation={[0, -ang, 0]} castShadow>
            <boxGeometry args={[widthMM - 0.01, zocH, zocDep]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.75} metalness={0.05} />
          </mesh>
        );
      })()}
      {/* Frigorífico: separador horizontal + rejilla */}
      {item.sku === "T-60-FRI" && (() => {
        const frontX = wall.start.x * MM + dir.x * off + normal.x * (innerOff + item.depth * MM - 0.0015);
        const frontZ = wall.start.y * MM + dir.y * off + normal.y * (innerOff + item.depth * MM - 0.0015);
        const lineW = widthMM - 0.02;
        return (
          <>
            <mesh position={[frontX, mountBottom + h * 0.66, frontZ]} rotation={[0, -ang, 0]}>
              <boxGeometry args={[lineW, 0.008, 0.002]} />
              <meshStandardMaterial color="#888" roughness={0.5} metalness={0.4} />
            </mesh>
            {(item.mountHeight ?? 0) === 0 && (
              <mesh position={[frontX, 0.08, frontZ]} rotation={[0, -ang, 0]}>
                <boxGeometry args={[lineW, 0.04, 0.002]} />
                <meshStandardMaterial color="#555" roughness={0.7} metalness={0.2} />
              </mesh>
            )}
          </>
        );
      })()}
      {/* Despensa: partición intermedia */}
      {item.sku === "T-60-DES" && (() => {
        const frontX = wall.start.x * MM + dir.x * off + normal.x * (innerOff + item.depth * MM - 0.0015);
        const frontZ = wall.start.y * MM + dir.y * off + normal.y * (innerOff + item.depth * MM - 0.0015);
        const lineW = widthMM - 0.02;
        return (
          <mesh position={[frontX, 0.87, frontZ]} rotation={[0, -ang, 0]}>
            <boxGeometry args={[lineW, 0.018, 0.002]} />
            <meshStandardMaterial {...MAT.groove} />
          </mesh>
        );
      })()}
      {/* Columna horno + microondas */}
      {item.sku === "T-60-HOR" && (() => {
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
            <mesh position={[baseX, ovenY, baseZ]} rotation={[0, -ang, 0]} castShadow>
              <boxGeometry args={[ovenW, ovenH, ovenD]} />
              <meshStandardMaterial {...MAT.applianceSteel} />
            </mesh>
            <mesh position={[baseX + glassDX, ovenY, baseZ + glassDZ]} rotation={[0, -ang, 0]}>
              <boxGeometry args={[ovenW * 0.78, ovenH * 0.6, 0.0012]} />
              <meshStandardMaterial {...MAT.applianceBlack} />
            </mesh>
            <mesh position={[baseX, microY, baseZ]} rotation={[0, -ang, 0]} castShadow>
              <boxGeometry args={[microW, microH, microD]} />
              <meshStandardMaterial {...MAT.applianceSteel} />
            </mesh>
            <mesh position={[baseX + glassDX, microY, baseZ + glassDZ]} rotation={[0, -ang, 0]}>
              <boxGeometry args={[microW * 0.65, microH * 0.55, 0.0012]} />
              <meshStandardMaterial {...MAT.applianceBlack} />
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
          // Backsplash: salpicadero entre encimera (topY) y altos (1450 mm).
          const splashTopMM = 1.45;
          const splashH = splashTopMM - topY;
          const splashDep = 0.015;
          const splashOff = (wall.thickness / 2) * MM + splashDep / 2;
          const sx = wall.start.x * MM + dir.x * midOff + normal.x * splashOff;
          const sz = wall.start.y * MM + dir.y * midOff + normal.y * splashOff;
          return (
            <group key={`wt_${i}`}>
              <mesh position={[cx, topY - thickness / 2, cz]} rotation={[0, -ang, 0]} castShadow receiveShadow>
                <boxGeometry args={[len, thickness, depthM]} />
                <meshStandardMaterial {...MAT.worktopStone} />
              </mesh>
              {splashH > 0.02 && (
                <mesh position={[sx, topY + splashH / 2, sz]} rotation={[0, -ang, 0]}>
                  <boxGeometry args={[len, splashH, splashDep]} />
                  <meshStandardMaterial {...MAT.worktopStone} />
                </mesh>
              )}
            </group>
          );
        }
        if (s.kind === "corner-fill") {
          const sideM = s.size * MM;
          return (
            <mesh
              key={`wt_${i}`}
              position={[s.center.x * MM, topY - thickness / 2, s.center.y * MM]}
              castShadow receiveShadow
            >
              <boxGeometry args={[sideM, thickness, sideM]} />
              <meshStandardMaterial {...MAT.worktopStone} />
            </mesh>
          );
        }
        return (
          <mesh
            key={`wt_${i}`}
            position={[s.centerX * MM, topY - thickness / 2, s.centerY * MM]}
            rotation={[0, -s.rotationRad, 0]}
            castShadow receiveShadow
          >
            <boxGeometry args={[s.width * MM, thickness, s.depth * MM]} />
            <meshStandardMaterial {...MAT.worktopStone} />
          </mesh>
        );
      })}
    </>
  );
}

function FloorAndCeiling({ bbox }: { bbox: RoomBbox }) {
  // Sin techo: si la cámara orbita por encima de los muros, un techo opaco
  // oculta la escena. Lo dejamos abierto.
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bbox.cx, 0, bbox.cz]} receiveShadow>
      <planeGeometry args={[bbox.sx, bbox.sz]} />
      <meshStandardMaterial {...MAT.floor} />
    </mesh>
  );
}

function CameraRig({ bbox }: { bbox: RoomBbox }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as unknown as
    | { target: { set: (x: number, y: number, z: number) => void }; update: () => void }
    | null;

  useEffect(() => {
    // Cámara dentro de la habitación, en uno de sus cuadrantes, a altura
    // de ojos (~1.6 m), mirando hacia el centro. Posicionándola fuera (que
    // es lo que hacíamos antes) hace que los muros opacos tapen toda la
    // vista del interior.
    const insetX = bbox.sx * 0.18;
    const insetZ = bbox.sz * 0.18;
    camera.position.set(bbox.cx - bbox.sx / 2 + insetX, 1.6, bbox.cz - bbox.sz / 2 + insetZ);
    camera.lookAt(bbox.cx, 0.9, bbox.cz);
    if (controls && typeof controls.target?.set === "function") {
      controls.target.set(bbox.cx, 0.9, bbox.cz);
      controls.update?.();
    }
  }, [bbox.cx, bbox.cz, bbox.sx, bbox.sz, camera, controls]);

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
    <Canvas
      shadows
      camera={{
        position: [bbox.cx - bbox.sx * 0.32, 1.6, bbox.cz - bbox.sz * 0.32],
        fov: 50,
      }}
      gl={{ antialias: true }}
    >
      <Suspense fallback={null}>
        <CameraRig bbox={bbox} />

        {/* Iluminación base: ambiente alto + clave cerca de la cámara + fill. */}
        <ambientLight intensity={0.8} color="#fff5e6" />
        <directionalLight
          position={[bbox.cx + 3, 5, bbox.cz + 3]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <directionalLight
          position={[bbox.cx - 4, 4, bbox.cz - 4]}
          intensity={0.6}
          color="#dde6ee"
        />

        {/* HDRI sólo para reflejos suaves (IBL). En su propio Suspense para
            que un fallo de red no rompa la escena. */}
        <Suspense fallback={null}>
          <Environment preset="apartment" background={false} />
        </Suspense>

        <FloorAndCeiling bbox={bbox} />
        {project.room.walls.map((w) => <WallMesh key={w.id} wall={w} />)}
        <WorktopMeshes />
        {project.modules.map((m) => <ModuleMesh key={m.id} placement={m} />)}

        <OrbitControls
          makeDefault
          target={[bbox.cx, 0.9, bbox.cz]}
          minDistance={0.5}
          maxDistance={Math.max(bbox.diag * 1.5, 6)}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Suspense>
    </Canvas>
  );
}
