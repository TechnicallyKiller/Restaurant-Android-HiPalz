# Restaurant Billing & Staff Communication System

A real-time React Native application designed to facilitate seamless communication between restaurant staff and a central billing system using a hybrid local-cloud architecture.

## Overview

This mobile application enables restaurant staff to receive real-time alerts from the kitchen, manage customer billing, and access cloud-based loyalty information. The system uses a hybrid architecture that combines local Socket.io connections for low-latency alerts with cloud-based APIs for business operations.

## Features

- **Real-time Staff Alerts**: Receive instant notifications when orders are ready or table service is required
- **Background Notifications**: Handle alerts even when the app is minimized or the device is locked
- **Customer Loyalty Integration**: Check customer loyalty points and status via cloud API
- **Offline-First Design**: Local socket connections ensure reliability independent of internet connectivity
- **Billing Management**: Process payments and update billing records

## Technical Stack

### Core Libraries

| Library | Purpose |
|---------|---------|
| **socket.io-client** | Bi-directional real-time communication with local restaurant server |
| **@notifee/react-native** | High-priority local and background notifications |
| **axios** | HTTP client for cloud API communication |

### Technology Breakdown

#### 1. Socket.io-client
- **Use Case**: Low-latency communication between waiters and kitchen
- **Function**: Maintains persistent connection to local restaurant server for "Order Ready" and "Table Service" events
- **Advantage**: Works independently of external internet stability

#### 2. @notifee/react-native
- **Use Case**: Comprehensive notification management
- **Function**: 
  - Creates high-priority notification channels
  - Wakes device for critical alerts
  - Displays alerts over other applications
  - Handles background events for in-notification interactions

#### 3. Axios
- **Use Case**: Cloud-based business operations
- **Function**:
  - Fetch customer loyalty points
  - Update billing records
  - Process final payments
  - Non-real-time data operations

## Architecture

### Hybrid Architecture Model

```
┌─────────────────────────────────────────────┐
│           Mobile Application                │
├─────────────────────────────────────────────┤
│  Local Communication  │  Cloud Operations   │
│    (Socket.io)        │     (Axios)         │
└──────────┬────────────┴──────────┬──────────┘
           │                       │
           ▼                       ▼
  ┌────────────────┐      ┌───────────────┐
  │ Local Server   │      │  Cloud API    │
  │ (Restaurant)   │      │  (Central DB) │
  └────────────────┘      └───────────────┘
```

## Project Structure

```
restaurant-billing-app/
│
├── src/
│   ├── config/
│   │   └── env.js                    # Environment variables (Socket URLs, API endpoints)
│   │
│   ├── api/
│   │   └── apiClient.js              # Centralized Axios instance for cloud API
│   │
│   ├── context/
│   │   └── SocketContext.js          # Socket.io connection provider
│   │
│   ├── services/
│   │   └── NotifService.js           # Notification logic abstraction
│   │
│   └── screens/
│       └── BillingScreen.js          # Main UI for billing and staff connectivity
│
├── App.tsx                            # Root component with providers
├── index.js                           # Entry point with background event handler
└── android/
    └── app/src/main/
        └── AndroidManifest.xml        # Android configuration
```

### Layer Breakdown

#### Configuration Layer
- **`src/config/env.js`**: Environment variables including:
  - Local Socket URLs
  - Cloud API base URLs
  - Configuration constants

#### Logic & State Layer
- **`src/api/apiClient.js`**: Centralized Axios instance for cloud database operations
- **`src/context/SocketContext.js`**: React Context provider for socket connection and staff alert listeners
- **`src/services/NotifService.js`**: Abstracted notification channel creation and alert display logic

#### UI Layer
- **`src/screens/BillingScreen.js`**: Primary interface featuring:
  - Customer phone number input
  - Loyalty status checking
  - Staff connectivity status display

#### Entry & Native Config
- **`index.js`**: Registers background event handler for notification interactions
- **`AndroidManifest.xml`**: Configured with `usesCleartextTraffic` for local HTTP server communication


## Configuration

### Environment Variables (`src/config/env.js`)

```javascript
export const config = {
  SOCKET_URL: 'http://192.168.1.100:3000',  // Local restaurant server
  API_BASE_URL: 'CONFIGURE IT ACCORDINGLY', // Cloud API endpoint
  // Add other configuration values
};
```

### Android Manifest Configuration

```xml
<application
  android:usesCleartextTraffic="true"
  ...>
  <!-- Allows HTTP communication with local servers -->
</application>
```


