import { Link }       from 'react-router-dom'
import Logo           from '../../components/Logo'
import { Heart, Mail } from 'lucide-react'

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
        </div>

        <div className="font-body text-[15px] text-slate-600 leading-[1.8] space-y-6">

          <p>
            This Privacy Policy explains how ft_prodd( ... ) ("we," "our," or "us") collects, uses, stores, and
            protects your personal information when you use our task-management platform. By creating an account
            and using the Service, you acknowledge the practices described in this policy.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">1. Information We Collect</h2>

          <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900">1.1 Account Information</h3>
          <p>
            When you register, we collect your <strong>email address</strong>, <strong>username</strong>, and a
            <strong> password</strong> (stored as a bcrypt hash). If you authenticate via 42 Intra OAuth, we also
            collect your <strong>42 Intra ID</strong> and <strong>avatar URL</strong> from the 42 API.
          </p>

          <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900">1.2 Workspace &amp; Task Data</h3>
          <p>
            You may create workspaces, columns, tasks, checklist items, comments, and labels. This content is
            stored and associated with your account. You control who can view and modify it through workspace
            membership roles (admin, member, guest).
          </p>

          <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900">1.3 Friend &amp; Social Data</h3>
          <p>
            You can send and receive friend requests, and create friend connections with other users. These
            relationships are stored to enable collaboration features.
          </p>

          <h3 className="font-display font-semibold text-base sm:text-lg text-slate-900">1.4 Usage Data</h3>
          <p>
            We collect analytics about task completion rates, workspace activity, and login history to help
            improve the Service. This data is aggregated and not personally identifiable.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide, maintain, and improve the Service</li>
            <li>To authenticate your identity and authorize your actions</li>
            <li>To send notifications about workspace activity, friend requests, and mentions</li>
            <li>To display analytics and productivity insights</li>
            <li>To communicate with you about service updates or security issues</li>
          </ul>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">3. Data Storage &amp; Security</h2>
          <p>
            Your data is stored on secured servers. Passwords are hashed using <strong>bcrypt</strong> and are
            never stored in plain text. API keys are stored as SHA-256 hashes. We implement industry-standard
            measures to protect your information against unauthorized access, alteration, or destruction.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">4. Data Sharing</h2>
          <p>
            We do not sell your personal information. Data is shared only with other users as you explicitly
            configure through workspace memberships and friend connections. The 42 Intra API is used solely
            for OAuth authentication when you choose that sign-in method.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">5. Your Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> You can view your account data at any time through your profile page.</li>
            <li><strong>Correction:</strong> You can update your username, email, and avatar from your profile settings.</li>
            <li><strong>Deletion:</strong> You can delete your account, which removes all associated data (workspaces, tasks, comments, etc.).</li>
            <li><strong>Data Portability:</strong> Your data can be exported by contacting us.</li>
          </ul>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">6. Cookies &amp; Local Storage</h2>
          <p>
            We use <strong>localStorage</strong> to persist your authentication token and sidebar preferences.
            No third-party cookies are used. You can clear this data at any time through your browser settings.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an
            updated "Last updated" date. Continued use of the Service after changes constitutes acceptance of
            the revised policy.
          </p>

          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 pt-4">8. Contact</h2>
          <p className="flex items-center gap-2">
            <Mail size={16} className="text-cyan-600 shrink-0" />
            If you have questions about this policy, please reach out at{' '}
            <a href="mailto:efinda@student.42luanda.com" className="text-cyan-600 no-underline hover:underline">privacy@ftprodd.dev</a>.
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
