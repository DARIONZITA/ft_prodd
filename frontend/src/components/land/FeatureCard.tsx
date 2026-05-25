interface FeatureCardProps {
  icon:         React.ReactNode
  iconBg:       string
  iconColor:    string
  title:        string
  description:  string
}

export default function FeatureCard({ icon, iconBg, iconColor, title, description }: FeatureCardProps) {
  return (
    <div className="group h-full w-full p-6 sm:p-10 rounded-[32px] bg-white border border-slate-100 hover:border-slate-200 hover:-translate-y-1 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] transition-all duration-300">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 sm:mb-8" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 mb-3 sm:mb-4">{title}</h3>
      <p className="font-body text-[15px] text-slate-500 leading-relaxed font-medium">{description}</p>
    </div>
  )
}
