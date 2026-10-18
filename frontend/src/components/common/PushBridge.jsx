import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import pushService from '../../services/push.service';

export default function PushBridge() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!userId) return;

    pushService.syncToken();

    let unsubscribe;
    pushService
      .watchForeground((payload) => {
        const notification = payload?.notification || {};
        const data = payload?.data || {};
        toast(notification.title || data.title || 'GatherUp', {
          description: notification.body || data.body || 'You have a new message',
          id: data.messageId || undefined,
        });
      })
      .then((fn) => {
        unsubscribe = fn;
      });

    return () => unsubscribe?.();
  }, [userId]);

  return null;
}
