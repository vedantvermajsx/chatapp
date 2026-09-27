import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const F_HEADING = "'Manrope', sans-serif";
const F_BODY = "'DM Sans', sans-serif";

const sections = [
  {
    title: "What Cookies Are",
    body: "Cookies are small text files stored on your device that let a site remember information between visits, such as your session and preferences.",
  },
  {
    title: "Essential Cookies",
    body: "These are required for GatherUp to function: keeping you signed in, remembering your active room, and protecting the app against cross-site request forgery. They cannot be switched off.",
  },
  {
    title: "Preference Cookies",
    body: "We remember choices like your selected theme and sidebar layout so the app looks and behaves the way you left it next time you visit.",
  },
  {
    title: "Analytics Cookies",
    body: "Where enabled, we use limited, privacy-respecting analytics to understand aggregate usage patterns and improve reliability. These never contain your message content.",
  },
  {
    title: "Local Storage & IndexedDB",
    body: "In addition to cookies, GatherUp uses your browser's local storage and IndexedDB to cache conversations for faster loading. This data stays on your device.",
  },
  {
    title: "Third-Party Cookies",
    body: "We don't allow third-party advertising cookies. Embedded content (such as call or media features) may set cookies of its own, governed by that provider's policy.",
  },
  {
    title: "Managing Cookies",
    body: "Most browsers let you view, delete, or block cookies through their settings. Blocking essential cookies may prevent GatherUp from working correctly.",
  },
  {
    title: "Changes to This Policy",
    body: "We may update this Cookie Policy from time to time. Continued use of GatherUp after changes take effect constitutes acceptance of the revised policy.",
  },
  {
    title: "Contact",
    body: "Questions about this Cookie Policy may be directed to support@gatherup.app.",
  },
];

export default function CookiePolicy() {
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
            className="text-[12px] font-semibold text-[#16a34a] uppercase tracking-widest mb-3"
            style={{ fontFamily: F_BODY }}
          >
            Legal
          </p>
          <h1
            className="text-[2.1rem] font-bold text-gray-900 tracking-tight leading-tight mb-2"
            style={{ fontFamily: F_HEADING }}
          >
            Cookie Policy
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
          This policy explains how <strong className="text-gray-800 font-semibold">GatherUp</strong> uses cookies and similar technologies, and the choices available to you.
        </p>

        <div className="flex flex-col">
          {sections.map((item, index) => (
            <div
              key={item.title}
              className="flex items-start gap-5 py-6 border-b border-gray-100 last:border-b-0"
            >
              <span
                className="text-[11.5px] font-bold tabular-nums text-[#16a34a] shrink-0 mt-0.5 w-6 text-right"
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
