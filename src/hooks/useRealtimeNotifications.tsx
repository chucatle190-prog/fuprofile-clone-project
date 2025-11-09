import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export const useRealtimeNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          toast({
            title: 'Thông báo mới',
            description: newNotification.content,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );

          // Recalculate unread count
          setNotifications((current) => {
            setUnreadCount(current.filter((n) => !n.is_read).length);
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};
