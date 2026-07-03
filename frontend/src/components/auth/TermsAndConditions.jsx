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
    <div className="min-h-screen  py-10 px-4 overflow-auto">
      <div className="max-w-4xl overflow-auto  mx-auto">

        <div className="mb-8 overflow-auto flex justify-between items-center">

          <div className="flex overflow-auto items-center gap-4">

            <div
              className="
              h-10
              w-10
              rounded-xl
              flex
              items-center
              justify-center
              bg-[#ececec]
              shadow-[2px_2px_2px_#c8c8c8,-2px_-2px_2px_#ffffff]
            "
            >
              <FileText className="w-4 h-4 text-gray-700" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Terms & Conditions
              </h1>

              <p className="text-gray-500 mt-1">
                Effective Date: July 3, 2026
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="
            flex
            items-center
            gap-2
            px-5
            py-3
            rounded-xl
            bg-[#ececec]
            shadow-[2px_2px_4px_#c8c8c8,-2px_-2px_4px_#ffffff]
            hover:shadow-[inset_1px_1px_4px_#c8c8c8,inset_-1px_-1px_4px_#ffffff]
            transition
          "
          >
            <ArrowLeft size={18} />
            Back
          </Link>
        </div>

        <div
          className="
          bg-[#ececec]
          rounded-3xl
          p-8
          shadow-[2px_2px_3px_#c8c8c8,-2px_-2px_3px_#ffffff]
        "
        >
          <p className="text-gray-600 leading-7 mb-10">
            Welcome to <strong>GatherUp</strong>. These Terms and Conditions
            govern your access to and use of our services. Please read them
            carefully before using the application.
          </p>

          <div className="space-y-6">

            {sections.map((item, index) => (
              <div
                key={item.title}
                className="
                rounded-2xl
                p-6
                bg-[#ececec]
                shadow-[1px_1px_2px_#d0d0d0,-1px_-1px_2px_#ffffff]
              "
              >
                <div className="flex items-start gap-4">

                  <div
                    className="
                    flex
                    items-center
                    justify-center
                    w-10
                    h-10
                    p-2
                    bg-[#ececec]
                    font-bold
                    text-gray-700
                    shadow-[1px_1px_2px_#c8c8c8,-1px_-1px_2px_#ffffff]
                  "
                  >
                    {index < 9 ? '0' : ''}{index + 1}
                  </div>

                  <div>

                    <h2 className="font-semibold text-lg text-gray-800 mb-2">
                      {item.title}
                    </h2>

                    <p className="leading-7 text-gray-600">
                      {item.body}
                    </p>

                  </div>

                </div>
              </div>
            ))}

          </div>

          <div className="mt-12 border-t border-gray-300 pt-8 text-center">

            <p className="text-gray-500 leading-7">
              By continuing to use GatherUp, you acknowledge that you have read,
              understood, and agreed to these Terms and Conditions.
            </p>

            <Link
              to="/login"
              className="
              inline-block
              mt-8
              px-8
              py-4
              rounded-2xl
              font-semibold
              bg-[#ececec]
              shadow-[1px_1px_2px_#c8c8c8,-1px_-1px_2px_#ffffff]
              hover:shadow-[inset_1px_1px_2px_#c8c8c8,inset_-1px_-1px_2px_#ffffff]
              transition
            "
            >
              Back to Sign In
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}