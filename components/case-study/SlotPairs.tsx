import Image from 'next/image'
import s from './SlotPairs.module.css'

function SlotPairRow({ pair, rowIndex }: { pair: string[]; rowIndex: number }) {
  return (
    <div id={`case-pairs-row-${rowIndex}`} data-element={`Pair row ${rowIndex + 1}`} className={s.pairRow} data-slot={`pair-row-${rowIndex}`}>
      {pair.length === 0 ? (
        <>
          <div id={`case-pairs-${rowIndex}-0`} data-element={`Pair ${rowIndex + 1}-1`} className={s.pairSlot} data-slot={`pair-${rowIndex}-0`} />
          <div id={`case-pairs-${rowIndex}-1`} data-element={`Pair ${rowIndex + 1}-2`} className={s.pairSlot} data-slot={`pair-${rowIndex}-1`} />
        </>
      ) : (
        pair.map((url, ii) => (
          <div key={ii} id={`case-pairs-${rowIndex}-${ii}`} data-element={`Pair ${rowIndex + 1}-${ii + 1}`} className={s.pairSlot} data-slot={`pair-${rowIndex}-${ii}`}>
            {url.includes('/video/') ? (
              <video src={url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <Image src={url} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default function SlotPairs({ pairs }: { pairs: string[][] }) {
  return (
    <div className={s.wrap}>
      <div id="case-pairs" data-element="Pairs" className={s.pairsSection}>
        {pairs.map((pair, pi) => (
          <SlotPairRow key={pi} pair={pair} rowIndex={pi} />
        ))}
      </div>
    </div>
  )
}
