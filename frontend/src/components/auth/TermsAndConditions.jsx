import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

const sections = [
  {
    title: "Acceptance of Terms",
    body: "By accessing or using GatherUp, whether through a registered account or guest session, you agree to comply with these Terms and Conditions. If you disagree with any part of these terms, you must discontinue use of the service.",
  },
  {
    title: "Eligibility",
    body: "You must be legally capable of entering into a binding agreement under the laws applicable in your jurisdiction to use GatherUp.",
  },
  {
    title: "Accounts & Guest Access",
    body: "You are responsible for maintaining the confidentiality of your account credentials. Guest accounts are temporary and may be removed after prolonged inactivity without prior notice.",
  },
  {
    title: "Acceptable Use",
    body: "You agree not to misuse GatherUp by transmitting unlawful content, harassing other users, distributing malware, attempting unauthorized access, or interfering with the operation of the platform.",
  },
  {
    title: "User Content",
    body: "You retain ownership of the content you submit. By using GatherUp, you grant us permission to process and store your content solely for providing and improving the service.",
  },
  {
    title: "Privacy",
    body: "We collect only the information necessary to operate GatherUp, including account details you voluntarily provide. We never sell your personal information to third parties.",
  },
  {
    title: "Termination",
    body: "We reserve the right to suspend or terminate accounts that violate these Terms or threaten the security, stability, or integrity of the platform.",
  },
  {
    title: "Service Availability",
    body: "While we strive for uninterrupted service, GatherUp may occasionally become unavailable due to maintenance, upgrades, or unforeseen technical issues.",
  },
  {
    title: "Changes to Terms",
    body: "These Terms may be updated periodically. Continued use of GatherUp after revisions become effective constitutes acceptance of the updated Terms.",
  },
  {
    title: "Limitation of Liability",
    body: "GatherUp is provided on an 'as is' and 'as available' basis. We are not responsible for indirect, incidental, or consequential damages resulting from your use of the platform.",
  },
  {
    title: "Contact",
    body: "Questions regarding these Terms may be directed to support@gatherup.app.",
  },
];

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white py-10 px-4 overflow-auto">
      <div className="max-w-3xl mx-auto">

        <div className="mb-10 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#008080]/10">
              <FileText className="w-4.5 h-4.5 text-[#008080]" />
            </div>
            <div>
              <h1
                className="text-2xl font-semibold text-gray-900 tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Terms & Conditions
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Effective Date: July 3, 2026
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>

        <p className="text-gray-600 leading-7 mb-8">
          Welcome to <strong className="text-gray-900">GatherUp</strong>. These
          Terms and Conditions govern your access to and use of our services.
          Please read them carefully before using the application.
        </p>

        <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
          {sections.map((item, index) => (
            <div key={item.title} className="flex items-start gap-4 py-6">
              <span className="text-xs font-semibold text-[#008080] tabular-nums pt-0.5 w-6 shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 className="font-semibold text-[15px] text-gray-900 mb-1.5">
                  {item.title}
                </h2>
                <p className="leading-7 text-gray-600 text-[14.5px]">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-gray-500 leading-7 text-sm">
            By continuing to use GatherUp, you acknowledge that you have read,
            understood, and agreed to these Terms and Conditions.
          </p>

          <Link
            to="/login"
            className="inline-block mt-6 px-6 py-2.5 rounded-lg font-semibold text-[14.5px] bg-[#008080] text-white hover:bg-[#046d6d] transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
