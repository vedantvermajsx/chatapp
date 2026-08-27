import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const F_HEADING = "'Bricolage Grotesque', sans-serif";
const F_BODY = "'Plus Jakarta Sans', sans-serif";

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
    <div className="h-dvh overflow-y-auto bg-[#f7f8fa]">
      <div className="max-w-2xl mx-auto py-12 px-4">

        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
            >
              <img src="/icon.png" alt="GatherUp" className="w-10 h-10 object-contain" />
            </div>
            <span
              className="text-gray-900 font-bold text-[15px]"
              style={{ fontFamily: F_HEADING }}
            >
              GatherUp
            </span>
          </div>

          <Link
            to="/login"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all"
            style={{ fontFamily: F_BODY }}
          >
            <ArrowLeft size={13} />
            Back
          </Link>
        </div>

        <div className="mb-8">
          <p
            className="text-[12px] font-semibold text-[#008080] uppercase tracking-widest mb-3"
            style={{ fontFamily: F_BODY }}
          >
            Legal
          </p>
          <h1
            className="text-[2.1rem] font-bold text-gray-900 tracking-tight leading-tight mb-2"
            style={{ fontFamily: F_HEADING }}
          >
            Terms &amp; Conditions
          </h1>
          <p
            className="text-gray-400 text-[13.5px]"
            style={{ fontFamily: F_BODY }}
          >
            Effective Date: July 3, 2026
          </p>
        </div>

        <p
          className="text-gray-500 leading-relaxed text-[14.5px] mb-8 pb-8 border-b border-gray-100"
          style={{ fontFamily: F_BODY }}
        >
          Welcome to <strong className="text-gray-800 font-semibold">GatherUp</strong>. These Terms and Conditions govern your access to and use of our services. Please read them carefully before using the application.
        </p>

        <div className="flex flex-col">
          {sections.map((item, index) => (
            <div
              key={item.title}
              className="flex items-start gap-5 py-6 border-b border-gray-100 last:border-b-0"
            >
              <span
                className="text-[11.5px] font-bold tabular-nums text-[#008080] shrink-0 mt-0.5 w-6 text-right"
                style={{ fontFamily: F_BODY }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h2
                  className="font-semibold text-[15px] text-gray-900 mb-1.5"
                  style={{ fontFamily: F_HEADING }}
                >
                  {item.title}
                </h2>
                <p
                  className="leading-relaxed text-gray-500 text-[14px]"
                  style={{ fontFamily: F_BODY }}
                >
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>


        <p
          className="text-center text-gray-300 text-[12px] mt-8"
          style={{ fontFamily: F_BODY }}
        >
          © {new Date().getFullYear()} GatherUp. All rights reserved.
        </p>

      </div>
    </div>
  );
}
