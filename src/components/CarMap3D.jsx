import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  ContactShadows,
  useGLTF
} from '@react-three/drei'
import * as THREE from 'three'
import ResultBadge from './ResultBadge'
import { useTheme } from '../theme.jsx'

const CAR_PALETTE = {
  light: {
    teal: '#2563eb',
    red: '#bd0000',
    amber: '#fbff06'
  },
  dark: {
    teal: '#00a640',
    red: '#c40000',
    amber: '#fbff06'
  }
}

const POINT_3D = {
  A1: { x: 1.9, y: 1, z: -0.96 },
  A2: { x: 1.9, y: 1, z: 0.96 },
  B1: { x: 0.3, y: 0.8, z: -0.96 },
  B2: { x: 0.3, y: 0.8, z: 0.96 },
  C1: { x: -1.5, y: 0.8, z: -0.96 },
  C2: { x: -1.5, y: 0.8, z: 0.96 }
}

export default function CarMap3D({
  points,
  latestByPoint,
  activePointId,
  onSelectPoint
}) {
  const { theme } = useTheme()
  const c = CAR_PALETTE[theme] || CAR_PALETTE.dark

  return (
    <div className="relative w-full">
      <div className="h-80 overflow-hidden rounded-xl surface-inset sm:h-96">
        <Canvas
          camera={{
            position: [4.2, 2.4, 4.2],
            fov: 40
          }}
          dpr={[1, 2]}
          shadows
          onCreated={({ scene }) => {
            scene.background = new THREE.Color('#bab6b6')
          }}
        >
          <Suspense fallback={null}>
            {/* แสงโดยรวม */}
            <ambientLight intensity={0.45} />

            {/* แสงหลักจากด้านขวา */}
            <directionalLight
              position={[6, 4, 2]}
              intensity={2}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />

            {/* แสงเสริมจากด้านซ้าย */}
            <directionalLight
              position={[-4, 2, -3]}
              intensity={0.3}
            />

            {/* แสงด้านหน้าเบา ๆ */}
            <pointLight
              position={[0, 3, 4]}
              intensity={0.35}
              distance={10}
            />

            <TruckModel />

            {points.map((pt) => {
              const pos3d = POINT_3D[pt.id]

              if (!pos3d) {
                return null
              }

              const reading = latestByPoint[pt.id]
              const isActive = activePointId === pt.id

              let color = c.teal

              if (reading?.result === 'modified') {
                color = c.red
              } else if (reading?.result === 'inconclusive') {
                color = c.amber
              }

              return (
                <InspectionMarker
                  key={pt.id}
                  position={[
                    pos3d.x,
                    pos3d.y,
                    pos3d.z
                  ]}
                  color={color}
                  active={isActive}
                  flagged={reading?.result === 'modified'}
                  onClick={() => onSelectPoint?.(pt.id)}
                />
              )
            })}

            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.5}
              scale={10}
              blur={2}
              far={2}
            />

            <Environment preset="city" />

            <OrbitControls
              enablePan={false}
              minDistance={3}
              maxDistance={9}
              maxPolarAngle={Math.PI / 2.05}
              target={[0.2, 0.5, 0]}
            />
          </Suspense>
        </Canvas>
      </div>

      <p className="mt-2 text-center text-xs text-faint">
        ลากเมาส์เพื่อหมุนมุมมอง • เลื่อนล้อเมาส์เพื่อซูม
      </p>

      {activePointId && (
        <PointCallout
          point={points.find((p) => p.id === activePointId)}
          reading={latestByPoint[activePointId]}
        />
      )}
    </div>
  )
}

function TruckModel() {
  const { scene } = useGLTF('/models/chassis.glb')

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh || !child.material) {
        return
      }

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material]

      materials.forEach((material) => {
        // ทำให้โลหะดูเก่าและด้านขึ้น
        if ('metalness' in material) {
          material.metalness = 0.7
        }

        if ('roughness' in material) {
          material.roughness = 0.2
        }

        // ลดความสว่างของสีเดิมเล็กน้อย
        if (material.color) {
          material.color.multiplyScalar(0.994)
        }

        material.needsUpdate = true
      })
    })
  }, [scene])

  return (
    <primitive
      object={scene}
      scale={0.025}
      position={[0, 0.6, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  )
}

useGLTF.preload('/models/chassis.glb')

function InspectionMarker({
  position,
  color,
  active,
  flagged,
  onClick
}) {
  return (
    <group position={position}>
      {active && (
        <mesh>
          <sphereGeometry args={[0.16, 16, 16]} />

          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.22}
          />
        </mesh>
      )}

      <mesh
        onClick={onClick}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[0.075, 20, 20]} />

        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={flagged ? 0.9 : 0.35}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

function PointCallout({
  point,
  reading
}) {
  if (!point) {
    return null
  }

  return (
    <div className="mt-3 flex items-center justify-between rounded-xl panel-glass px-4 py-3">
      <div>
        <p className="text-sm font-medium text-heading">
          {point.label}
        </p>

        <p className="text-xs text-muted">
          {reading
            ? `${reading.iacs} %IACS · เฟส ${reading.phaseDeg}°`
            : 'ยังไม่มีข้อมูลการสแกน'}
        </p>
      </div>

      {reading && (
        <ResultBadge result={reading.result} />
      )}
    </div>
  )
}