import { X, Download } from 'lucide-react';

export const ImageZoomModal = ({ imageUrl, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `chat-image-${Date.now()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      onClick={handleBackgroundClick}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
      >
        <X className="w-8 h-8" />
      </button>
      
      <button
        onClick={handleDownload}
        className="absolute bottom-4 right-4 flex items-center gap-2 bg-[#008080] text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
      >
        <Download className="w-5 h-5" />
        Download
      </button>

      <img
        src={imageUrl}
        alt="Zoomed"
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
      />
    </div>
  );
};
