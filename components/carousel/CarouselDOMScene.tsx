'use client'

import { useRef, useEffect, type MutableRefObject } from 'react'
import Image from 'next/image'
import {
  CARDS,
  type CarouselCFG,
  type GhostConfig,
  type TiltConfig,
  type LightConfig,
} from '@/lib/carouselConfig'
import { computeCardTransforms, perspAngle } from '@/lib/carouselPhysics'
import styles from './CarouselDOMScene.module.css'

const N = CARDS.length

export interface CarouselDOMSceneProps {
  posY:             MutableRefObject<number>
  cfg:              MutableRefObject<CarouselCFG>
  rollBase:         MutableRefObject<number[]>
  tiltRx:           MutableRefObject<number>
  tiltRy:           MutableRefObject<number>
  activeIdx:        MutableRefObject<number>
  ghostCfg:         MutableRefObject<GhostConfig>
  tiltCfg:          MutableRefObject<TiltConfig>
  lightCfg:         MutableRefObject<LightConfig>
  caseOpen:         MutableRefObject<boolean>
  shakeVel:         MutableRefObject<number>
  carouselWidthRef: MutableRefObject<number>
  onActiveChange:   (idx: number) => void
  onCardClick:      (i: number) => void
}

// Same shine formula as TiltCard.tsx — normalised to raw tilt values / max
function applyShine(
  el: HTMLDivElement | null,
  isActive: boolean,
  rawRy: number,
  rawRx: number,
  maxTilt: number,
  L: LightConfig,
) {
  if (!el) return
  if (!isActive || maxTilt === 0) { el.style.background = 'none'; el.style.filter = ''; return }
  const nx  =  rawRy / maxTilt
  const ny  = -rawRx / maxTilt
  const mag = Math.min(Math.hypot(nx, ny), 1)
  if (mag < 0.015) { el.style.background = 'none'; el.style.filter = ''; return }
  const hx  = (50 - nx * L.travel).toFixed(1)
  const hy  = (50 + ny * L.travel).toFixed(1)
  const sp  = (L.intensity * mag).toFixed(3)
  const sm  = (L.intensity * 0.12 * mag).toFixed(3)
  const la  = (Math.atan2(-nx, -ny) * 180 / Math.PI).toFixed(1)
  const da  = (L.diffuse * mag).toFixed(3)
  const sa  = (L.shadow  * mag).toFixed(3)
  el.style.background = [
    `radial-gradient(ellipse ${L.size}% ${L.size}% at ${hx}% ${hy}%, rgba(255,255,255,${sp}) 0%, rgba(255,255,255,${sm}) 45%, transparent 72%)`,
    `linear-gradient(${la}deg, rgba(255,255,255,${da}) 0%, transparent 55%)`,
    `linear-gradient(${(+la + 180).toFixed(1)}deg, rgba(0,0,0,${sa}) 0%, transparent 60%)`,
  ].join(',')
  el.style.filter = L.blur > 0 ? `blur(${L.blur}px)` : ''
}

export default function CarouselDOMScene({
  posY, cfg, rollBase, tiltRx, tiltRy, activeIdx,
  ghostCfg, tiltCfg, lightCfg, caseOpen, shakeVel, carouselWidthRef,
  onActiveChange, onCardClick,
}: CarouselDOMSceneProps) {
  const stageRef  = useRef<HTMLDivElement>(null)
  const groupRefs = useRef<(HTMLDivElement | null)[]>(Array(N).fill(null))
  const meshRefs  = useRef<(HTMLDivElement | null)[]>(Array(N).fill(null))
  const ghostRefs = useRef<(HTMLDivElement | null)[][]>(Array.from({ length: N }, () => []))
  const shineRefs = useRef<(HTMLDivElement | null)[]>(Array(N).fill(null))
  const rafRef    = useRef<number | null>(null)

  // ── rAF loop: replaces R3F useFrame ──────────────────────────────────────────
  useEffect(() => {
    let wPos = window.innerWidth
    let wVel = 0
    let shakePos = 0
    let lastFrameTime = 0

    function frame(now: number) {
      const dt = lastFrameTime ? Math.min((now - lastFrameTime) / 16.667, 4) : 1
      lastFrameTime = now

      const stage = stageRef.current
      if (!stage) { rafRef.current = requestAnimationFrame(frame); return }

      const P = cfg.current.PERSPECTIVE
      const W = window.innerWidth

      // 1. Width spring + camera offset (mirrors CarouselScene.Physics)
      const mobileCase = caseOpen.current && W < 768
      const targetW    = mobileCase ? W : (caseOpen.current ? W * 0.30 : W)
      wVel  += (targetW - wPos) * 0.02 * dt
      wVel  *= Math.pow(0.85, dt)
      wPos  += wVel * dt
      carouselWidthRef.current = wPos
      // camX: subtract from tx so vanishing point stays centred in the carousel strip
      // (equivalent to Three.js cam.position.x = width/2 - wPos/2)
      const camX = mobileCase ? 0 : W / 2 - wPos / 2

      // 2. Update perspective
      stage.style.perspective = `${P}px`

      // 3. Shake spring
      shakeVel.current += -shakePos * 0.12 * dt
      shakeVel.current *= Math.pow(0.80, dt)
      shakePos         += shakeVel.current * dt

      // 4. Card dimensions (match CSS min(92vw,364px) × (555/364))
      const cardW = Math.min(W * 0.92, 364)
      const cardH = cardW * (555 / 364)

      const transforms = computeCardTransforms(posY.current, N, cfg.current, wPos, rollBase.current)
      const tiltScale  = Math.min(1, P / 590)
      const gc         = ghostCfg.current

      transforms.forEach((t, i) => {
        const group = groupRefs.current[i]
        const mesh  = meshRefs.current[i]
        if (!group || !mesh) return

        // ── Sphere 3D position (validated sign table — see plan) ──
        group.style.transform = [
          'translate(-50%,-50%)',
          `translate3d(${(t.tx - camX).toFixed(2)}px,${t.ty.toFixed(2)}px,${t.tz.toFixed(2)}px)`,
          `rotateX(${t.rx.toFixed(3)}deg) rotateY(${(-t.ry).toFixed(3)}deg) rotateZ(${t.rollDeg.toFixed(3)}deg)`,
          `scale(${t.scale.toFixed(4)})`,
        ].join(' ')
        group.style.zIndex     = String(t.zIndex)
        group.dataset.active   = t.isActive ? 'true' : 'false'

        // ── Tilt + shake + opacity (on mesh, NOT group) ──
        // perspective() in the transform gives per-card tilt perspective without
        // needing transform-style: preserve-3d on the parent (which caused ghost z-sort issues)
        mesh.style.opacity = t.opacity.toFixed(3)
        const tRx = t.isActive ? -tiltRx.current * tiltScale : 0  // negated — matches Three.js mesh.rotation.x
        const tRy = t.isActive ?  tiltRy.current * tiltScale : 0
        mesh.style.transform = `perspective(${P}px) rotateX(${tRx.toFixed(3)}deg) rotateY(${tRy.toFixed(3)}deg) rotateZ(${(t.isActive ? shakePos : 0).toFixed(5)}rad)`

        // ── Specular highlight ──
        applyShine(shineRefs.current[i], t.isActive, tiltRy.current, tiltRx.current, tiltCfg.current.max, lightCfg.current)

        // ── Ghost clones ──
        const mag = Math.abs(tiltRx.current) + Math.abs(tiltRy.current)
        const ghosts = ghostRefs.current[i]
        if (ghosts) {
          for (let gi = 0; gi < ghosts.length; gi++) {
            const clone = ghosts[gi]
            if (!clone) continue
            if (gi >= gc.layers || !t.isActive || mag < 0.3) {
              if (clone.style.opacity !== '0') clone.style.opacity = '0'
              continue
            }
            const s   = (gi + 1) / (gc.layers + 1)
            // Ghost rotX is negated — matches Three.js ghost.rotation.x = -gRx * DEG
            const gRx = -perspAngle(tiltRx.current * tiltScale, s, cardH / 2, 800)
            const gRy =  perspAngle(tiltRy.current * tiltScale, s, cardW / 2, 800)
            clone.style.transform = `perspective(${P}px) rotateX(${gRx.toFixed(3)}deg) rotateY(${gRy.toFixed(3)}deg)`
            clone.style.opacity   = (gc.opacity * s).toFixed(3)
          }
        }

        // ── Active tracking ──
        if (t.isActive && i !== activeIdx.current) {
          activeIdx.current = i
          onActiveChange(i)
        }
      })

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={stageRef} className={styles.stage3d}>
      {CARDS.map((card, i) => (
        <div
          key={card.id}
          ref={el => { groupRefs.current[i] = el }}
          className={styles.cardGroup}
          onClick={(e) => { e.stopPropagation(); onCardClick(i) }}
        >
          {/* Ghost clones — behind mesh, same 3D position, different tilt angle */}
          {Array.from({ length: 4 }, (_, gi) => (
            <div
              key={gi}
              ref={el => { ghostRefs.current[i][gi] = el }}
              className={styles.ghostClone}
              style={{ backgroundColor: card.bg }}
              aria-hidden
            >
              {card.video
                ? (
                  <video src={card.video} autoPlay muted loop playsInline className={styles.ghostImg} />
                ) : card.img ? (
                  // Plain img intentional for ghost clones — decorative, always cached from main card
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.img} alt="" className={styles.ghostImg} />
                ) : null
              }
              <div className={styles.ghostGrad} />
            </div>
          ))}

          {/* Main card */}
          <div
            ref={el => { meshRefs.current[i] = el }}
            className={styles.cardMesh}
            style={{ backgroundColor: card.bg }}
          >
            {/* [RESERVED] WebGL shader slot — replace this div with <canvas> to attach a renderer */}
            <div className={styles.cardCanvas} aria-hidden />

            {card.video ? (
              <video
                src={card.video}
                autoPlay
                muted
                loop
                playsInline
                className={styles.cardMedia}
              />
            ) : card.img ? (
              <Image
                src={card.img}
                alt=""
                fill
                sizes="(max-width: 768px) 92vw, 364px"
                style={{ objectFit: 'cover' }}
                className={styles.cardMedia}
                priority={i === 0}
              />
            ) : null}

            <div className={styles.cardOverlay} />

            <div className={styles.cardText}>
              <p className={styles.cardRole}>{card.role}</p>
              <p className={styles.cardLine}>{card.lines[0]}</p>
              <p className={styles.cardLine}>{card.lines[1]}</p>
            </div>

            <div
              ref={el => { shineRefs.current[i] = el }}
              className={styles.cardShine}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
