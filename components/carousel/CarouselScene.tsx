'use client'

import { useRef, useMemo, Suspense, type MutableRefObject } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, useTexture, useVideoTexture, Html } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing'
import * as THREE from 'three'
import {
  CARDS,
  type CarouselCFG,
  type GhostConfig,
  type LightConfig,
  type TiltConfig,
} from '@/lib/carouselConfig'
import { computeCardTransforms, perspAngle } from '@/lib/carouselPhysics'
import { vert, frag } from '@/lib/cardShader'

const N          = CARDS.length
const DEG        = Math.PI / 180
const CARD_MAX_W = 364
const CARD_VW    = 0.92
const CARD_RATIO = 555 / 364   // height / width
const GHOST_P    = 800

function makeUniforms(tex: THREE.Texture, lc: LightConfig) {
  return {
    u_map:       { value: tex },
    u_opacity:   { value: 1.0 },
    u_active:    { value: 0.0 },
    u_tilt:      { value: new THREE.Vector2() },
    u_intensity: { value: lc.intensity },
    u_size:      { value: lc.size },
    u_travel:    { value: lc.travel },
    u_diffuse:   { value: lc.diffuse },
    u_shadow:    { value: lc.shadow },
  }
}

export interface CarouselSceneProps {
  posY:      MutableRefObject<number>
  cfg:       MutableRefObject<CarouselCFG>
  rollBase:  MutableRefObject<number[]>
  tiltRx:    MutableRefObject<number>
  tiltRy:    MutableRefObject<number>
  activeIdx: MutableRefObject<number>
  ghostCfg:  MutableRefObject<GhostConfig>
  lightCfg:  MutableRefObject<LightConfig>
  tiltCfg:   MutableRefObject<TiltConfig>
  caseOpen:  MutableRefObject<boolean>
  onActiveChange: (idx: number) => void
  onCaseSwitch:   (href: string) => void
  onCardClick:    (i: number) => void
}

// ─── Card HTML content ────────────────────────────────────────────────────────
function CardHtml({ card, cardW, cardH }: { card: typeof CARDS[0]; cardW: number; cardH: number }) {
  const pad = 40
  return (
    <Html
      transform
      position={[0, 0, 2]}
      style={{
        width: cardW,
        height: cardH,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: pad,
        gap: 4,
        boxSizing: 'border-box',
      }}
    >
      <p style={{ fontFamily: 'var(--font-brand)', fontSize: 14, lineHeight: 1.43, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)', fontVariationSettings: "'wght' 300", margin: 0 }}>
        {card.role}
      </p>
      <p style={{ fontFamily: 'var(--font-brand)', fontSize: 32, lineHeight: 1.17, color: '#fff', fontVariationSettings: "'wght' 300", margin: 0 }}>
        {card.lines[0]}
      </p>
      <p style={{ fontFamily: 'var(--font-brand)', fontSize: 32, lineHeight: 1.17, color: '#fff', fontVariationSettings: "'wght' 300", margin: 0 }}>
        {card.lines[1]}
      </p>
    </Html>
  )
}

// ─── All cards — loads textures then renders all geometry ─────────────────────
function AllCards({
  cardW, cardH,
  groupRefs, meshRefs, ghostRefArrays,
  lightCfg, ghostCfg, onCardClick,
}: {
  cardW: number; cardH: number
  groupRefs: MutableRefObject<THREE.Group[]>
  meshRefs: MutableRefObject<THREE.Mesh[]>
  ghostRefArrays: MutableRefObject<THREE.Mesh[][]>
  lightCfg: MutableRefObject<LightConfig>
  ghostCfg: MutableRefObject<GhostConfig>
  onCardClick: (i: number) => void
}) {
  // Image textures for cards 1–4
  const imgTextures = useTexture([CARDS[1].img!, CARDS[2].img!, CARDS[3].img!, CARDS[4].img!])
  imgTextures.forEach(t => { t.colorSpace = THREE.SRGBColorSpace })

  // Video texture for card 0
  const videoTex = useVideoTexture(CARDS[0].video!, { start: true, loop: true, muted: true, playsInline: true })
  videoTex.colorSpace = THREE.SRGBColorSpace

  const textures: THREE.Texture[] = [videoTex, ...imgTextures]

  // Create uniforms once per card
  const allUniforms = useMemo(
    () => textures.map(tex => makeUniforms(tex, lightCfg.current)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <>
      {CARDS.map((card, i) => (
        <group
          key={card.id}
          ref={el => { if (el) groupRefs.current[i] = el }}
          onClick={e => { e.stopPropagation(); onCardClick(i) }}
        >
          {/* Card mesh */}
          <mesh
            ref={el => { if (el) meshRefs.current[i] = el }}
            renderOrder={2}
          >
            <planeGeometry args={[cardW, cardH]} />
            <shaderMaterial
              uniforms={allUniforms[i]}
              vertexShader={vert}
              fragmentShader={frag}
              transparent
              depthWrite={false}
            />
          </mesh>

          {/* Ghost meshes (max 16, visibility controlled in useFrame) */}
          {Array.from({ length: 16 }, (_, gi) => (
            <mesh
              key={gi}
              ref={el => {
                if (el) {
                  if (!ghostRefArrays.current[i]) ghostRefArrays.current[i] = []
                  ghostRefArrays.current[i][gi] = el
                }
              }}
              renderOrder={ghostCfg.current.variant === 'front' ? 3 : 1}
              visible={false}
            >
              <planeGeometry args={[cardW, cardH]} />
              <shaderMaterial
                uniforms={makeUniforms(textures[i], lightCfg.current)}
                vertexShader={vert}
                fragmentShader={frag}
                transparent
                depthWrite={false}
              />
            </mesh>
          ))}

          <CardHtml card={card} cardW={cardW} cardH={cardH} />
        </group>
      ))}
    </>
  )
}

// ─── Physics loop (reads refs, writes to Three.js objects every frame) ────────
function Physics({
  posY, cfg, rollBase, tiltRx, tiltRy, activeIdx,
  ghostCfg, lightCfg, tiltCfg, caseOpen,
  onActiveChange, onCaseSwitch,
  groupRefs, meshRefs, ghostRefArrays, cardW, cardH,
}: CarouselSceneProps & {
  groupRefs: MutableRefObject<THREE.Group[]>
  meshRefs: MutableRefObject<THREE.Mesh[]>
  ghostRefArrays: MutableRefObject<THREE.Mesh[][]>
  cardW: number
  cardH: number
}) {
  const { camera, size } = useThree()

  useFrame(() => {
    const P   = cfg.current.PERSPECTIVE
    const cam = camera as THREE.PerspectiveCamera

    // Sync camera with CSS perspective preset
    if (Math.abs(cam.position.z - P) > 1) {
      cam.position.z = P
      cam.fov = 2 * Math.atan(size.height / 2 / P) * (180 / Math.PI)
      cam.updateProjectionMatrix()
    }

    const transforms = computeCardTransforms(posY.current, N, cfg.current, size.width, rollBase.current)
    const lc = lightCfg.current
    const gc = ghostCfg.current
    const tc = tiltCfg.current

    transforms.forEach((t, i) => {
      const group = groupRefs.current[i]
      const mesh  = meshRefs.current[i]
      if (!group || !mesh) return

      // Wrap transform (CSS px → Three.js units, negate ty for Y-up)
      group.position.set(t.tx, -t.ty, t.tz)
      group.rotation.x = t.rx       * DEG
      group.rotation.y = -t.ry      * DEG   // CSS rotateY convention is opposite
      group.rotation.z = t.rollDeg  * DEG
      group.scale.setScalar(t.scale)

      // Card tilt (only on active card, same negation for Y)
      mesh.rotation.x = t.isActive ?  tiltRx.current * DEG : 0
      mesh.rotation.y = t.isActive ? -tiltRy.current * DEG : 0

      // Shader uniforms
      const mat = mesh.material as THREE.ShaderMaterial
      mat.uniforms.u_opacity.value = t.opacity
      mat.uniforms.u_active.value  = t.isActive ? 1.0 : 0.0
      if (t.isActive) {
        const max = tc.max || 16
        mat.uniforms.u_tilt.value.set(tiltRy.current / max, -tiltRx.current / max)
        mat.uniforms.u_intensity.value = lc.intensity
        mat.uniforms.u_size.value      = lc.size
        mat.uniforms.u_travel.value    = lc.travel
        mat.uniforms.u_diffuse.value   = lc.diffuse
        mat.uniforms.u_shadow.value    = lc.shadow
      }

      // Ghost clones for active card
      const ghosts = ghostRefArrays.current[i]
      if (ghosts?.length) {
        const mag = Math.abs(tiltRx.current) + Math.abs(tiltRy.current)
        for (let gi = 0; gi < 16; gi++) {
          const ghost = ghosts[gi]
          if (!ghost) continue
          if (gi >= gc.layers || !t.isActive || mag < 0.3) {
            ghost.visible = false
            continue
          }
          const scalar = (gi + 1) / (gc.layers + 1)
          const gRx = perspAngle(tiltRx.current, scalar, cardH / 2, GHOST_P)
          const gRy = perspAngle(tiltRy.current, scalar, cardW / 2, GHOST_P)
          ghost.visible    = true
          ghost.rotation.x =  gRx * DEG
          ghost.rotation.y = -gRy * DEG
          ghost.renderOrder = gc.variant === 'front' ? 3 : 1;
          (ghost.material as THREE.ShaderMaterial).uniforms.u_opacity.value = gc.opacity * scalar;
          (ghost.material as THREE.ShaderMaterial).uniforms.u_active.value  = 0.0
        }
      }

      // Active card tracking
      if (t.isActive && i !== activeIdx.current) {
        activeIdx.current = i
        onActiveChange(i)
        if (caseOpen.current) onCaseSwitch(CARDS[i].href)
      }
    })
  })

  return null
}

// ─── Scene content (inside Suspense, after texture load) ─────────────────────
function SceneContent(props: CarouselSceneProps) {
  const { size } = useThree()

  const cardW = Math.min(CARD_VW * size.width, CARD_MAX_W)
  const cardH = cardW * CARD_RATIO

  const groupRefs      = useRef<THREE.Group[]>([])
  const meshRefs       = useRef<THREE.Mesh[]>([])
  const ghostRefArrays = useRef<THREE.Mesh[][]>([])

  const P = props.cfg.current.PERSPECTIVE

  return (
    <>
      <color attach="background" args={['#ffffff']} />

      <PerspectiveCamera
        makeDefault
        position={[0, 0, P]}
        fov={2 * Math.atan(size.height / 2 / P) * (180 / Math.PI)}
        near={1}
        far={P * 6}
      />

      <Suspense fallback={null}>
        <AllCards
          cardW={cardW}
          cardH={cardH}
          groupRefs={groupRefs}
          meshRefs={meshRefs}
          ghostRefArrays={ghostRefArrays}
          lightCfg={props.lightCfg}
          ghostCfg={props.ghostCfg}
          onCardClick={props.onCardClick}
        />
      </Suspense>

      <Physics
        {...props}
        groupRefs={groupRefs}
        meshRefs={meshRefs}
        ghostRefArrays={ghostRefArrays}
        cardW={cardW}
        cardH={cardH}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.55}
          luminanceSmoothing={0.9}
          intensity={0.6}
          radius={0.4}
        />
        <DepthOfField
          focusDistance={0}
          focalLength={0.018}
          bokehScale={2.5}
        />
      </EffectComposer>
    </>
  )
}

export default function CarouselScene(props: CarouselSceneProps) {
  return (
    <Suspense fallback={null}>
      <SceneContent {...props} />
    </Suspense>
  )
}
