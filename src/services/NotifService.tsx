import notifee, { AndroidImportance } from '@notifee/react-native';

export const triggerStaffAlert = async (title: string, body: string) => {
  const channelId = await notifee.createChannel({
    id: 'staff_notifications',
    name: 'Staff Alerts',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      pressAction: { id: 'default' },
      actions: [{ title: 'Acknowledge', pressAction: { id: 'ack' } }],
    },
  });
};
