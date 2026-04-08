export default function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-cyan-50 border border-cyan-100">
      <span className="font-display text-[10px] font-extrabold text-cyan-600 uppercase tracking-widest">
        {children}
      </span>
    </div>
  )
}
