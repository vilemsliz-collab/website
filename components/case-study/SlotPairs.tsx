import Image from 'next/image'
import HpAnimationCanvas from './HpAnimationCanvas'
import StarAnimationCanvas from './StarAnimationCanvas'
import BioPairCard from './BioPairCard'
import s from './SlotPairs.module.css'

function SlotPairRow({ pair, rowIndex, variant }: { pair: string[]; rowIndex: number; variant?: 'about' }) {
  const slotClass = variant === 'about' ? s.pairSlotAbout : s.pairSlot
  return (
    <div id={`case-pairs-row-${rowIndex}`} data-element={`Pair row ${rowIndex + 1}`} className={s.pairRow} data-slot={`pair-row-${rowIndex}`}>
      {pair.length === 0 ? (
        <>
          <div id={`case-pairs-${rowIndex}-0`} data-element={`Pair ${rowIndex + 1}-1`} className={slotClass} data-slot={`pair-${rowIndex}-0`} />
          <div id={`case-pairs-${rowIndex}-1`} data-element={`Pair ${rowIndex + 1}-2`} className={slotClass} data-slot={`pair-${rowIndex}-1`} />
        </>
      ) : (
        pair.map((url, ii) => (
          <div key={ii} id={`case-pairs-${rowIndex}-${ii}`} data-element={`Pair ${rowIndex + 1}-${ii + 1}`} className={pair.length === 1 ? s.pairSlotWide : slotClass} data-slot={`pair-${rowIndex}-${ii}`}>
            {url === '@bio-card' ? (
              <BioPairCard />
            ) : url === '@hp-animation' ? (
              <HpAnimationCanvas />
            ) : url === '@star-animation' ? (
              <StarAnimationCanvas />
            ) : url.includes('/video/') ? (
              <video src={url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : url.endsWith('.html') ? (
              <iframe src={url} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: 'block' }} />
            ) : url ? (
              <Image src={url} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
            ) : null}
          </div>
        ))
      )}
    </div>
  )
}

export default function SlotPairs({ pairs, variant }: { pairs: string[][]; variant?: 'about' }) {
  return (
    <div className={s.wrap}>
      <div id="case-pairs" data-element="Pairs" className={s.pairsSection}>
        {pairs.map((pair, pi) => (
          <SlotPairRow key={pi} pair={pair} rowIndex={pi} variant={variant} />
        ))}
      </div>
    </div>
  )
}
