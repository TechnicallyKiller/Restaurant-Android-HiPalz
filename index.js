import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';

// This handles events when the app is minimized or killed
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  // Check 
  if (type === EventType.ACTION_PRESS && pressAction.id === 'ack') {
    console.log('Background action handled: Acknowledged Order', notification.id);
    
    // can add a fetch() here to update database
    // await fetch(`https://api.client.com/orders/${notification.id}/ack`, { method: 'POST' });    

    await notifee.cancelNotification(notification.id);
  }
});

AppRegistry.registerComponent(appName, () => App);