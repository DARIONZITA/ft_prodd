export default function Divider({ label }: { label: string }) {
    return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="font-body text-[13px] text-slate-400">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
    )
}
