import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account, using a guest session, or otherwise accessing GatherUp, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the service.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be legally able to enter into these terms in your jurisdiction to use GatherUp, whether as a registered user or as a guest.',
  },
  {
    title: '3. Accounts and Guest Sessions',
    body: 'You are responsible for keeping your password confidential and for all activity under your account. Guest sessions are temporary and may be removed after a period of inactivity.',
  },
  {
    title: '4. Acceptable Use',
    body: 'You agree not to use GatherUp to harass, abuse, or harm others, to send unlawful or infringing content, or to attempt to disrupt or compromise the service.',
  },
  {
    title: '5. Content',
    body: 'You retain ownership of the messages and content you send. You are solely responsible for the content you share and its consequences.',
  },
  {
    title: '6. Privacy',
    body: 'We collect only the information needed to operate the service, such as your username, email, and profile details you choose to provide. We do not sell your personal data.',
  },
  {
    title: '7. Termination',
    body: 'We may suspend or terminate access to accounts or guest sessions that violate these terms or that pose a risk to the service or other users.',
  },
  {
    title: '8. Changes to These Terms',
    body: 'We may update these Terms and Conditions from time to time. Continued use of GatherUp after changes take effect constitutes acceptance of the revised terms.',
  },
  {
    title: '9. Disclaimer',
    body: 'GatherUp is provided "as is" without warranties of any kind. We are not liable for any indirect or consequential damages arising from your use of the service.',
  },
  {
    title: '10. Contact',
    body: 'If you have questions about these Terms and Conditions, please reach out through the support channels listed within the app.',
  },
];

function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#e6e6e6] flex items-center justify-center p-4">
      <div className="bg-[#e6e6e6] rounded-3xl shadow-[10px_10px_20px_#c9c9c9,-10px_-10px_20px_#ffffff] max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-[#e6e6e6] flex items-center justify-center mr-3 shadow-[1px_1px_3px_#c9c9c9,-1px_-1px_3px_#ffffff]">
              <MessageCircle className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">GatherUp</h1>
              <p className="text-sm text-gray-500">Terms and Conditions</p>
            </div>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-1 text-sm font-semibold text-gray-700 bg-[#e6e6e6] px-3 py-2 rounded-xl shadow-[2px_2px_4px_#c9c9c9,-2px_-2px_4px_#ffffff] hover:shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <p className="text-sm text-gray-500 mb-6">Last updated: July 3, 2026</p>

        <div className="flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-bold text-gray-800 mb-1">{section.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-300 text-center">
          <Link
            to="/login"
            className="inline-block py-3 px-6 bg-[#e6e6e6] text-gray-800 font-bold rounded-2xl shadow-[2px_2px_4px_#c9c9c9,-2px_-2px_4px_#ffffff] hover:shadow-[inset_3px_3px_6px_#c9c9c9,inset_-3px_-3px_6px_#ffffff] transition-all"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;
