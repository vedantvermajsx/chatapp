import { X, Download } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

export const ImageZoomModal = ({
  imageUrl,
  media,
  mediaType,
  isOpen,
  onClose,
}) => {
  const { theme } = useTheme();

  const isLight =
    theme.background === "#e6e6e6" ||
    theme.background === "#e0f7fa" ||
    theme.background === "#fff3e0" ||
    theme.background === "#e8f5e9" ||
    theme.background === "#f3e5f5" ||
    theme.background === "#fce4ec";

  if (!isOpen) return null;

  const isVideo = mediaType === "video";

  const displayUrl = isVideo ? imageUrl : media?.mid || imageUrl;

  const addAttachmentFlag = (url, filename) => {
    if (!url || !url.includes("/upload/")) return url;

    const encodedName = encodeURIComponent(filename);

    return url.replace(
      /\/upload\/((?:(?!\/v\d+\/).)*)?(\/v\d+\/)/,
      (_, transformations = "", version) => {
        const prefix = transformations
          ? `fl_attachment:${encodedName},${transformations}`
          : `fl_attachment:${encodedName}`;

        return `/upload/${prefix}${version}`;
      }
    );
  };

  const handleDownload = (url, label) => {
    if (!url) return;

    const filename = `chat-${isVideo ? "video" : "image"}-${label}-${Date.now()}`;
    const downloadUrl = addAttachmentFlag(url, filename);

    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  };

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const qualities = isVideo
    ? [{ label: "Download", url: imageUrl }]
    : [
      { label: "Low", url: media?.low },
      { label: "Medium", url: media?.mid },
      { label: "HD", url: media?.hd || media?.url || imageUrl },
    ].filter((q) => q.url);

  const hasQualities = qualities.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={handleBackgroundClick}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-7 w-7" />
      </button>

      {isVideo ? (
        <video
          src={displayUrl}
          controls
          autoPlay
          className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
        />
      ) : (
        <img
          src={displayUrl}
          alt="Zoomed"
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        />
      )}

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
        {hasQualities ? (
          qualities.map(({ label, url }) => (
            <button
              key={label}
              onClick={() => handleDownload(url, label.toLowerCase())}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-100 active:scale-95"
              style={{
                backgroundColor: isLight
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(30,30,30,0.9)",
                color: isLight ? "#1f2937" : "#f3f4f6",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
              }}
            >
              <Download className="h-4 w-4" />
              {label}
            </button>
          ))
        ) : (
          <button
            onClick={() => handleDownload(imageUrl, "original")}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: isLight
                ? "rgba(255,255,255,0.9)"
                : "rgba(30,30,30,0.9)",
              color: isLight ? "#1f2937" : "#f3f4f6",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        )}
      </div>
    </div>
  );
};