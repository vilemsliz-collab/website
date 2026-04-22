import Image from 'next/image'
import s from './SlotPairs.module.css'

function SlotPairRow({ pair, rowIndex }: { pair: string[]; rowIndex: number }) {
  return (
    <div className={s.pairRow} data-slot={`pair-row-${rowIndex}`}>
      {pair.length === 0 ? (
        <>
          <div className={s.pairSlot} data-slot={`pair-${rowIndex}-0`} />
          <div className={s.pairSlot} data-slot={`pair-${rowIndex}-1`} />
        </>
      ) : (
        pair.map((img, ii) => (
          <div key={ii} className={s.pairSlot} data-slot={`pair-${rowIndex}-${ii}`}>
            <Image src={img} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
          </div>
        ))
      )}
    </div>
  )
}

export default function SlotPairs({ pairs }: { pairs: string[][] }) {
  return (
    <div className={s.wrap}>
      <div className={s.pairsSection}>
        {pairs.map((pair, pi) => (
          <SlotPairRow key={pi} pair={pair} rowIndex={pi} />
        ))}
      </div>
    </div>
  )
}
