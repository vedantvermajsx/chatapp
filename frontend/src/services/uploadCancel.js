const controllers = new Map();
const cancelled = new Set();

export const registerUpload = (id) => {
  const controller = new AbortController();
  controllers.set(id, controller);
  return controller;
};

export const releaseUpload = (id) => controllers.delete(id);

export const isUploadCancelled = (id) => cancelled.has(id);

// Aborts an in-flight upload (if any) and tells the app to drop the pending message.
export const cancelUpload = (id) => {
  if (!id) return;
  cancelled.add(id);
  controllers.get(id)?.abort();
  controllers.delete(id);
  window.dispatchEvent(new CustomEvent('upload-cancelled', { detail: { tempId: id } }));
};
