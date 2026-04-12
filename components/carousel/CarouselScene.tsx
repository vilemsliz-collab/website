'use client'

import { useRef, useMemo, useEffect, Suspense, type MutableRefObject } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, useTexture, useVideoTexture } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import {
  CARDS,
  type CarouselCFG,
  type GhostConfig,
  type TiltConfig,
} from '@/lib/carouselConfig'
import { computeCardTransforms, perspAngle } from '@/lib/carouselPhysics'
import { vert, frag } from '@/lib/cardShader'
import { makeTextCanvas, drawCardText } from '@/lib/cardTextCanvas'

const N          = CARDS.length
const DEG        = Math.PI / 180
const CARD_MAX_W = 364
const CARD_VW    = 0.92
const CARD_RATIO = 555 / 364   // height / width
const GHOST_P    = 800

// ── Cover UV helpers ──────────────────────────────────────────────────────────
function computeCover(iw: number, ih: number) {
  const imgRatio   = iw / ih
  const planeRatio = 1 / CARD_RATIO   // cardW / cardH ≈ 0.656
  const scale  = new THREE.Vector2(1, 1)
  const offset = new THREE.Vector2(0, 0)
  if (!iw || !ih) return { scale, offset }
  if (imgRatio > planeRatio) {
    const s = planeRatio / imgRatio
    scale.set(s, 1)
    offset.set((1 - s) / 2, 0)
  } else {
    const s = imgRatio / planeRatio
    scale.set(1, s)
    offset.set(0, (1 - s) / 2)
  }
  return { scale, offset }
}

function makeUniforms(tex: THREE.Texture, textTex: THREE.Texture) {
  const img = tex.image as HTMLImageElement | null
  const iw  = img?.naturalWidth  ?? img?.width  ?? 0
  const ih  = img?.naturalHeight ?? img?.height ?? 0
  const { scale, offset } = computeCover(iw, ih)
  return {
    u_map:       { value: tex },
    u_text:      { value: textTex },
    u_opacity:   { value: 1.0 },
    u_uvScale:   { value: scale },
    u_uvOffset:  { value: offset },
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
  tiltCfg:   MutableRefObject<TiltConfig>
  caseOpen:  MutableRefObject<boolean>
  carouselWidthRef: MutableRefObject<number>
  onActiveChange: (idx: number) => void
  onCaseSwitch:   (href: string) => void
  onCardClick:    (i: number) => void
}

// ─── All cards — loads textures then renders all geometry ─────────────────────
function AllCards({
  cardW, cardH,
  groupRefs, meshRefs, ghostRefArrays,
  ghostCfg, onCardClick,
}: {
  cardW: number; cardH: number
  groupRefs: MutableRefObject<THREE.Group[]>
  meshRefs: MutableRefObject<THREE.Mesh[]>
  ghostRefArrays: MutableRefObject<THREE.Mesh[][]>
  ghostCfg: MutableRefObject<GhostConfig>
  onCardClick: (i: number) => void
}) {
  const imgTextures = useTexture([CARDS[1].img!, CARDS[2].img!, CARDS[3].img!, CARDS[4].img!])
  imgTextures.forEach(t => { t.colorSpace = THREE.SRGBColorSpace })

  const videoTex = useVideoTexture(CARDS[0].video!, { start: true, loop: true, muted: true, playsInline: true })
  videoTex.colorSpace = THREE.SRGBColorSpace

  const textures: THREE.Texture[] = [videoTex, ...imgTextures]

  // Per-card canvas textures for text overlay
  const textCanvases = useMemo(() => CARDS.map(card => makeTextCanvas(card)), [])
  const textTextures = useMemo(() => textCanvases.map(c => {
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }), [textCanvases])

  // Re-draw with correct fonts once they are loaded
  useEffect(() => {
    document.fonts.ready.then(() => {
      CARDS.forEach((card, i) => {
        drawCardText(textCanvases[i], card)
        textTextures[i].needsUpdate = true
      })
    })
  }, [textCanvases, textTextures])

  const allUniforms = useMemo(
    () => textures.map((tex, i) => makeUniforms(tex, textTextures[i])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Apply cover to video once metadata is available (videoWidth not set immediately)
  useEffect(() => {
    const video = videoTex.image as HTMLVideoElement | null
    if (!video) return
    function apply() {
      const vw = video!.videoWidth
      const vh = video!.videoHeight
      if (!vw || !vh) return
      const { scale, offset } = computeCover(vw, vh)
      const uni = allUniforms[0]
      uni.u_uvScale.value.copy(scale)
      uni.u_uvOffset.value.copy(offset)
    }
    if (video.videoWidth > 0) {
      apply()
    } else {
      video.addEventListener('loadedmetadata', apply, { once: true })
    }
    return () => video.removeEventListener('loadedmetadata', apply)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {CARDS.map((card, i) => (
        <group
          key={card.id}
          ref={el => { if (el) groupRefs.current[i] = el }}
          onClick={e => { e.stopPropagation(); onCardClick(i) }}
        >
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
                uniforms={makeUniforms(textures[i], textTextures[i])}
                vertexShader={vert}
                fragmentShader={frag}
                transparent
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

// ─── Physics loop ─────────────────────────────────────────────────────────────
function Physics({
  posY, cfg, rollBase, tiltRx, tiltRy, activeIdx,
  ghostCfg, tiltCfg, caseOpen, carouselWidthRef,
  onActiveChange, onCaseSwitch,
  groupRefs, meshRefs, ghostRefArrays, cardW, cardH,
}: CarouselSceneProps & {
  groupRefs: MutableRefObject<THREE.Group[]>
  meshRefs: MutableRefObject<THREE.Mesh[]>
  ghostRefArrays: MutableRefObject<THREE.Mesh[][]>
  cardW: number
  cardH: number
}) {
  const { camera } = useThree()

  // Card-spread spring — compresses card arrangement to left 25vw
  const wRef    = useRef(0)
  const wVelRef = useRef(0)

  useFrame((state) => {
    const P   = cfg.current.PERSPECTIVE
    const cam = camera as THREE.PerspectiveCamera
    const { width, height } = state.size  // always-current from R3F store

    // First-frame initialisation
    if (wRef.current === 0) wRef.current = width

    // Sync camera Z + FOV
    if (Math.abs(cam.position.z - P) > 1) {
      cam.position.z = P
      cam.fov = 2 * Math.atan(height / 2 / P) * (180 / Math.PI)
      cam.updateProjectionMatrix()
    }

    // On mobile the case panel is fullscreen — no camera shift or spread compression
    const mobileCase = caseOpen.current && width < 768

    // Card-spread spring (stiffness 0.02 = 3× softer than original)
    const targetW = mobileCase ? width : (caseOpen.current ? width * 0.25 : width)
    wVelRef.current += (targetW - wRef.current) * 0.02
    wVelRef.current *= 0.85
    wRef.current += wVelRef.current
    carouselWidthRef.current = wRef.current

    // Camera X derived directly from card-spread — vanishing point always at carousel strip center
    cam.position.x = mobileCase ? 0 : (width / 2 - wRef.current / 2)

    const transforms = computeCardTransforms(posY.current, N, cfg.current, wRef.current, rollBase.current)
    const gc = ghostCfg.current

    transforms.forEach((t, i) => {
      const group = groupRefs.current[i]
      const mesh  = meshRefs.current[i]
      if (!group || !mesh) return

      group.position.set(t.tx, -t.ty, t.tz)
      group.rotation.x = t.rx      * DEG
      group.rotation.y = -t.ry     * DEG
      group.rotation.z = t.rollDeg * DEG
      group.scale.setScalar(t.scale)

      // Tilt — scale by perspective so the visual effect is consistent across camera distances
      const tiltScale = Math.min(1, P / 590)
      mesh.rotation.x = t.isActive ? -tiltRx.current * tiltScale * DEG : 0
      mesh.rotation.y = t.isActive ?  tiltRy.current * tiltScale * DEG : 0

      const mat = mesh.material as THREE.ShaderMaterial
      mat.uniforms.u_opacity.value = t.opacity

      // Ghost clones
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
          const gRx = perspAngle(tiltRx.current * tiltScale, scalar, cardH / 2, GHOST_P)
          const gRy = perspAngle(tiltRy.current * tiltScale, scalar, cardW / 2, GHOST_P)
          ghost.visible    = true
          ghost.rotation.x = -gRx * DEG
          ghost.rotation.y =  gRy * DEG
          ghost.renderOrder = gc.variant === 'front' ? 3 : 1;
          (ghost.material as THREE.ShaderMaterial).uniforms.u_opacity.value = gc.opacity * scalar
        }
      }

      if (t.isActive && i !== activeIdx.current) {
        activeIdx.current = i
        onActiveChange(i)
        if (caseOpen.current) onCaseSwitch(CARDS[i].href)
      }
    })

  })

  return null
}

// ─── Scene content ────────────────────────────────────────────────────────────
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
