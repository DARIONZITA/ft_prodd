interface StepCardProps {
  number: string
  title: string
  description: string
}

export default function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="bg-white px-6 py-5 rounded-2xl border border-slate-100 flex items-center gap-6 shadow-sm">
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-display font-bold text-xl shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-display font-bold text-lg text-slate-900 mb-1">{title}</h4>
        <p className="font-body text-sm text-slate-500 font-medium">{description}</p>
      </div>
    </div>
  )
}
