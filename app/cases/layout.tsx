export default function CasesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Transparent body so the parent glass panel shows through the iframe */}
      <style>{`html, body { background: transparent !important; }`}</style>
      {children}
    </>
  )
}
