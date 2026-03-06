import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import Badge from '../components/land/Badge'
import StepCard from '../components/land/StepCard'
import FeatureCard from '../components/land/FeatureCard'
import { ArrowRight, Target, Users, Zap, Heart } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="bg-white text-slate-900 min-h-screen">

      {/* ── Navbar ── */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <Logo />
        <div className="flex items-center gap-6">
          <Link to="/signin" className="font-body text-sm font-semibold text-slate-500 hover:text-slate-900 no-underline transition-colors duration-150">
            Sign In
          </Link>
          <Link to="/signup" className="font-body bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg text-sm font-bold no-underline transition-colors duration-150">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto text-center pt-20 pb-24 px-6">
        <Badge>Built for 42 Students</Badge>
        <h1 className="font-display font-black text-[clamp(40px,6vw,64px)] tracking-tight leading-[1.1] mb-4 text-slate-900">
          Stop the chaos.<br />
          <span style={{ background: 'linear-gradient(90deg, #0891b2 0%, #3b82f6 50%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ship your projects on time.
          </span>
        </h1>
        <p className="font-body text-slate-500 text-lg font-medium leading-relaxed max-w-2xl mx-auto mb-10">
          ft_prodd( ... ) is a productivity daemon built for 42 students. Organize your project requirements in a kanban board, track tasks from backlog to done, and collaborate seamlessly with your peers—no teachers needed.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link to="/signup" className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3.5 rounded-xl font-display font-bold text-[15px] no-underline shadow-[0_4px_20px_rgba(8,145,178,0.2)] transition-colors duration-150">
            Start Managing Tasks <ArrowRight size={16} />
          </Link>
          <Link to="/signin" className="flex items-center gap-2 px-8 py-3.5 border border-slate-200 rounded-xl font-display font-bold text-[15px] text-slate-500 hover:bg-slate-50 no-underline transition-colors duration-150">
            Sign In
          </Link>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 pb-32">
        <FeatureCard icon={<Target size={24} />} iconBg="#ecfeff" iconColor="#06b6d4" title="Kanban Workflow"       description="Visualize your project with columns for Backlog, To-Do, Doing, To-Test, and Done. Move tasks seamlessly through your workflow." />
        <FeatureCard icon={<Users size={24} />}  iconBg="#f5f3ff" iconColor="#8b5cf6" title="Team Collaboration"   description="Work directly with peers on shared boards. Assign tasks, track progress, and ensure nothing gets duplicated or left behind." />
        <FeatureCard icon={<Zap size={24} />}    iconBg="#f0f9ff" iconColor="#0ea5e9" title="Built for Developers" description="Designed with the 42 methodology in mind. Run in the background like a daemon, keeping your productivity on autopilot." />
      </section>

      {/* ── How It Works ── */}
      <section className="bg-slate-50/50 py-32 px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display font-bold text-3xl text-slate-900 mb-3">How It Works</h2>
          <p className="font-body text-slate-500 font-medium">A simple process to keep your projects organized</p>
        </div>
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <StepCard number="01" title="List Requirements" description="Break down your project into small tasks in the Backlog column" />
          <StepCard number="02" title="Start Working"     description="Move tasks through To-Do, Doing, and To-Test as you progress" />
          <StepCard number="03" title="Ship It"           description="Mark tasks as Done and finish your project on time with your team" />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-6 py-32">
        <div className="rounded-[40px] p-16 text-center text-white relative overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #0891b2 0%, #7c3aed 100%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          <h2 className="font-display font-extrabold text-[clamp(28px,4vw,40px)] mb-6 relative">
            Ready to level up your productivity?
          </h2>
          <p className="font-body text-white/80 font-medium text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Join 42 students who are shipping projects faster with ft_prodd( ... )
          </p>
          <Link to="/signup" className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-cyan-600 px-8 py-3.5 rounded-xl font-display font-bold text-[15px] no-underline shadow-lg transition-colors duration-150">
            Get Started for Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-slate-100 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <img src="/ft_prodd( ... ).svg" alt="logo" className="w-4 h-4 opacity-50" />
          A productivity daemon for 42 students
        </div>
        <div className="flex items-center gap-1 font-body text-[11px] font-medium text-slate-400">
          © 2026 ft_prodd( ... ). Built with <Heart size={12} className="text-blue-500 fill-blue-500 mx-0.5" /> for the 42 community.
        </div>
      </footer>

    </div>
  )
}
