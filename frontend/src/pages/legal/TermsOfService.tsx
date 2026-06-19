import { Link }       from 'react-router-dom'
import Logo           from '../../components/Logo'
import { Heart, Mail } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="bg-white text-slate-900 min-h-screen">

      {/* ── Navbar ── */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex justify-between items-center">
        <Logo />
        <div className="flex flex-row items-center gap-3 sm:gap-6 max-[280px]:flex-col-reverse max-[280px]:items-center max-[280px]:gap-1">
          <Link to="/signin" className="font-body text-sm font-semibold text-slate-500 hover:text-slate-900 no-underline transition-colors duration-150 whitespace-nowrap">
            Sign In
          </Link>
          <Link to="/signup" className="font-body bg-cyan-600 hover:bg-cyan-700 text-white px-3 sm:px-5 py-2 rounded-lg text-sm font-bold no-underline transition-colors duration-150 whitespace-nowrap">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Content ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="mb-10 sm:mb-12">
          <p className="font-mono text-[11px] text-cyan-600 uppercase tracking-widest mb-3">Last updated — June 12, 2026</p>
          <h1 className="font-display font-black text-[clamp(28px,5vw,48px)] tracking-tight leading-[1.1] text-slate-900">
            Terms of Service
          </h1>
        </div>

        <div className="font-body text-[15px] text-slate-600 leading-[1.8] space-y-6">

          <p>
            Welcome to ft_prodd( ... ). By accessing or using our task-management platform (the "Service"),
            you agree to be bound by these Terms of Service ("Terms"). If you do not agree, please do not
            use the Service.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">1. Description of Service</h2>
          <p>
            ft_prodd( ... ) provides a kanban-style project management tool designed for 42 students. Users
            can create workspaces, organize tasks into columns, manage assignments, track progress, and
            collaborate with peers. The Service includes features such as task creation, labeling, checklist
            management, commenting, and notifications.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">2. Eligibility</h2>
          <p>
            You must be at least 18 years old or have the consent of a legal guardian to use the Service.
            By creating an account, you represent that you meet these requirements and that all information
            you provide is accurate and complete.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">3. Account Registration &amp; Security</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for maintaining the confidentiality of your password and API keys.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You must notify us immediately of any unauthorized use of your account.</li>
            <li>You may not create accounts for others without their explicit consent.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
          </ul>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the Service for any illegal or unauthorized purpose</li>
            <li>Attempt to access another user's account without authorization</li>
            <li>Upload or share content that is abusive, harassing, or violates the rights of others</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
            <li>Use automated scripts or bots to interact with the Service unless using our documented API</li>
            <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service</li>
          </ul>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">5. Workspace Roles &amp; Permissions</h2>
          <p>
            Workspaces have three roles: <strong>admin</strong>, <strong>member</strong>, and <strong>guest</strong>.
            Admins have full control over the workspace, including management of members, tasks, and settings.
            Members can create and edit tasks and participate in collaboration. Guests have read-only access
            to assigned content. You are responsible for managing the roles and access permissions within
            your workspaces.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">6. Data Ownership</h2>
          <p>
            You retain ownership of all content and data you create on the Service. By posting content, you
            grant ft_prodd( ... ) a non-exclusive, worldwide, royalty-free license to store, display, and
            process that content solely for the purpose of providing the Service. This license ends when you
            delete your content or terminate your account.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">7. Privacy</h2>
          <p>
            Your privacy is important to us. Our{' '}
            <Link to="/privacy" className="text-cyan-600 no-underline hover:underline">Privacy Policy</Link>{' '}
            explains how we collect, use, and protect your personal data. By using the Service, you agree
            to the practices described in the Privacy Policy.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">8. Limitation of Liability</h2>
          <p>
            ft_prodd( ... ) is provided "as is" without any warranty, express or implied. We are not liable
            for any damages arising from your use of the Service, including but not limited to loss of data,
            loss of productivity, or interruption of service. In no event shall our total liability exceed
            the amount you have paid us in the twelve (12) months preceding the claim.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">9. Termination</h2>
          <p>
            You may delete your account at any time through your profile settings. We may suspend or
            terminate your access to the Service if you violate these Terms. Upon termination, your data
            will be permanently deleted in accordance with our data retention practices.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be effective immediately
            upon posting. Your continued use of the Service after changes constitutes acceptance of the
            new Terms. We will notify you of material changes via email or through the Service.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of France. Any disputes arising from these Terms or the
            Service shall be resolved in the courts of Paris, France.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">12. Contact</h2>
          <p className="flex items-center gap-2">
            <Mail size={16} className="text-cyan-600 shrink-0" />
            For questions about these Terms, contact us at{' '}
            <a href="mailto:efinda@student.42luanda.com" className="text-cyan-600 no-underline hover:underline">legal@ftprodd.dev</a>.
          </p>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <img src="/ft_prodd( ... ).svg" alt="logo" className="w-4 h-4 opacity-50" />
          A productivity daemon for 42 students
        </div>
        <div className="flex items-center flex-wrap justify-center sm:justify-end gap-x-1 font-body text-[11px] font-medium text-slate-400">
          <span className="whitespace-nowrap">&copy; 2026 ft_prodd( ... ). Built with</span>
          <span className="whitespace-nowrap flex items-center gap-x-1">
            <Heart size={12} className="text-blue-500 fill-blue-500" /> for the 42 community.
          </span>
        </div>
      </footer>

    </div>
  )
}
