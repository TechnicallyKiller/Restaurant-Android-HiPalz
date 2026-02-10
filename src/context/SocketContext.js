import React, { createContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { CONFIG } from '../config/env';
import { triggerStaffAlert } from '../services/NotifService';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const connection = io(CONFIG.SOCKET_URL);
    
    // Listening for kitchen-to-waiter events
    connection.on('order_ready', (data) => {
      triggerStaffAlert('Food Ready! 🍲', `Table ${data.tableNumber} is ready for pickup.`);
    });

    setSocket(connection);
    return () => connection.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};