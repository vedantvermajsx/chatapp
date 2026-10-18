import { useCallback, useState } from 'react';
import pushService from '../services/push.service';

export function useNotifications() {
  const [permission, setPermission] = useState(() => pushService.getPermission());
  const [enabled, setEnabled] = useState(() => pushService.isEnabled());
  const [busy, setBusy] = useState(false);

  const supported = pushService.isSupported();
  const configured = pushService.isConfigured();

  const refresh = useCallback(() => {
    setPermission(pushService.getPermission());
    setEnabled(pushService.isEnabled());
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    const result = await pushService.enable();
    refresh();
    setBusy(false);
    return result;
  }, [refresh]);

  const disable = useCallback(async () => {
    setBusy(true);
    await pushService.disable();
    refresh();
    setBusy(false);
  }, [refresh]);

  return { supported, configured, permission, enabled, busy, enable, disable };
}
