import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { isTauri } from "@tauri-apps/api/core";
import { appDataDir, BaseDirectory, join } from "@tauri-apps/api/path";
import { mkdir, readFile, writeFile } from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";

const DownloadsContext = createContext(null);

const STORAGE_KEY = "gatherup.downloads.v1";
const MAX_ENTRIES = 100;
const DOWNLOADS_SUBDIR = "downloads";

export const formatBytes = (bytes) => {
  if (bytes == null || Number.isNaN(bytes)) return "";
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
};

const sanitizeFilename = (name) =>
  (name || "download").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim() || "download";

const loadStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((d) => d && d.id && d.status !== "downloading")
      .map((d) => ({ ...d, progress: d.status === "completed" ? 100 : d.progress ?? 0 }));
  } catch {
    return [];
  }
};

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

// Browser fallback: let the WebView save the URL directly.
const triggerSave = (href, filename) => {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const DownloadsProvider = ({ children }) => {
  const [downloads, setDownloads] = useState(loadStored);
  const [downloadsDir, setDownloadsDir] = useState(null);
  const blobsRef = useRef(new Map());
  const dirRef = useRef(null);

  const native = useMemo(() => {
    try {
      return isTauri();
    } catch {
      return false;
    }
  }, []);

  const ensureDir = useCallback(async () => {
    if (dirRef.current) return dirRef.current;
    const base = await appDataDir();
    const dir = await join(base, DOWNLOADS_SUBDIR);
    await mkdir(DOWNLOADS_SUBDIR, { baseDir: BaseDirectory.AppData, recursive: true });
    dirRef.current = dir;
    return dir;
  }, []);

  useEffect(() => {
    if (!native) return;
    let alive = true;
    ensureDir()
      .then((dir) => {
        if (alive) setDownloadsDir(dir);
      })
      .catch((err) => {
        if (alive) {
          toast.error("Couldn't prepare the downloads folder", {
            description: err?.message || String(err),
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [native, ensureDir]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
    } catch {
    }
  }, [downloads]);

  useEffect(
    () => () => {
      blobsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobsRef.current.clear();
    },
    []
  );

  const patch = useCallback((id, changes) => {
    setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, ...changes } : d)));
  }, []);

  const revokeEntry = useCallback((id) => {
    const url = blobsRef.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      blobsRef.current.delete(id);
    }
  }, []);

  const startDownload = useCallback(
    async ({ url, filename, mediaType = "file", label = "" }) => {
      if (!url) return;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toastId = `download-${id}`;
      const safeName = sanitizeFilename(filename);

      setDownloads((prev) => {
        const next = [
          {
            id,
            filename: safeName,
            sourceUrl: url,
            mediaType,
            label,
            size: null,
            status: "downloading",
            progress: 0,
            createdAt: Date.now(),
            completedAt: null,
            contentType: null,
            filePath: null,
            error: null,
          },
          ...prev,
        ];
        next.slice(MAX_ENTRIES).forEach((d) => revokeEntry(d.id));
        return next.slice(0, MAX_ENTRIES);
      });

      toast.loading(`Downloading ${safeName}`, { id: toastId, description: "Starting…" });

      let lastReported = 0;
      try {
        const response = await fetch(url, { mode: "cors" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get("content-type") || undefined;
        const total = Number(response.headers.get("content-length")) || 0;
        const reader = response.body?.getReader?.();
        const chunks = [];
        let received = 0;

        if (reader) {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            const percent = total ? Math.min(99, Math.round((received / total) * 100)) : null;
            patch(id, { size: received, progress: percent ?? 0 });
            if (percent != null && percent - lastReported >= 10) {
              lastReported = percent;
              toast.loading(`Downloading ${safeName}`, {
                id: toastId,
                description: `${percent}%`,
              });
            }
          }
        }

        const blob = chunks.length
          ? new Blob(chunks, { type: contentType })
          : await response.blob();

        // Keep an in-memory copy so "View" works instantly this session.
        const blobUrl = URL.createObjectURL(blob);
        blobsRef.current.set(id, blobUrl);

        let filePath = null;
        if (native) {
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const dir = await ensureDir();
          await writeFile(`${DOWNLOADS_SUBDIR}/${safeName}`, bytes, {
            baseDir: BaseDirectory.AppData,
          });
          filePath = await join(dir, safeName);
        } else {
          triggerSave(blobUrl, safeName);
        }

        patch(id, {
          status: "completed",
          progress: 100,
          size: blob.size,
          contentType: contentType || null,
          filePath,
          completedAt: Date.now(),
        });
        toast.success(`Downloaded ${safeName}`, {
          id: toastId,
          description: formatBytes(blob.size) || undefined,
        });
      } catch (err) {
        if (native) {
          patch(id, { status: "failed", error: err?.message || "Download failed" });
          toast.error(`Failed to download ${safeName}`, {
            id: toastId,
            description: err?.message || undefined,
          });
          return;
        }
        try {
          triggerSave(addAttachmentFlag(url, safeName) || url, safeName);
          patch(id, { status: "completed", progress: 100, completedAt: Date.now() });
          toast.success(`Downloaded ${safeName}`, { id: toastId });
        } catch {
          patch(id, { status: "failed", error: err?.message || "Download failed" });
          toast.error(`Failed to download ${safeName}`, { id: toastId });
        }
      }
    },
    [native, patch, revokeEntry, ensureDir]
  );

  const removeDownload = useCallback(
    (id) => {
      revokeEntry(id);
      setDownloads((prev) => prev.filter((d) => d.id !== id));
    },
    [revokeEntry]
  );

  const clearDownloads = useCallback(() => {
    blobsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobsRef.current.clear();
    setDownloads([]);
  }, []);

  const ensureBlobUrl = useCallback(
    async (item) => {
      const cached = blobsRef.current.get(item.id);
      if (cached) return cached;
      if (!native || !item.filePath) return null;
      try {
        const bytes = await readFile(item.filePath);
        const blob = new Blob([bytes], { type: item.contentType || undefined });
        const url = URL.createObjectURL(blob);
        blobsRef.current.set(item.id, url);
        return url;
      } catch {
        return null;
      }
    },
    [native]
  );

  const openFile = useCallback(
    async (item) => {
      if (!native || !item?.filePath) {
        toast.error("File is not available on this device");
        return;
      }
      try {
        await openPath(item.filePath);
      } catch (err) {
        toast.error("Couldn't open the file", {
          description: err?.message || (typeof err === "string" ? err : undefined),
        });
      }
    },
    [native]
  );

  const openDownloadsFolder = useCallback(async () => {
    if (!native) return;
    try {
      await openPath(await ensureDir());
    } catch (err) {
      toast.error("Couldn't open the downloads folder", {
        description: err?.message || (typeof err === "string" ? err : undefined),
      });
    }
  }, [native, ensureDir]);

  const activeCount = useMemo(
    () => downloads.filter((d) => d.status === "downloading").length,
    [downloads]
  );

  const value = useMemo(
    () => ({
      downloads,
      activeCount,
      native,
      downloadsDir,
      startDownload,
      removeDownload,
      clearDownloads,
      ensureBlobUrl,
      openFile,
      openDownloadsFolder,
    }),
    [
      downloads,
      activeCount,
      native,
      downloadsDir,
      startDownload,
      removeDownload,
      clearDownloads,
      ensureBlobUrl,
      openFile,
      openDownloadsFolder,
    ]
  );

  return <DownloadsContext.Provider value={value}>{children}</DownloadsContext.Provider>;
};

export const useDownloads = () => {
  const ctx = useContext(DownloadsContext);
  if (!ctx) throw new Error("useDownloads must be used within a DownloadsProvider");
  return ctx;
};
