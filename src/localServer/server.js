const io = require('socket.io')(3000, {
  cors: { origin: "*" }
});

console.log("Restaurant Local Hub running on port 3000...");

io.on('connection', (socket) => {
  console.log("Device connected:", socket.id);

  // 1. Waiter sends order to Kitchen
  socket.on('place_order', (orderData) => {
    console.log("New order received for Table:", orderData.tableNumber);
    // Relay to all kitchen tablets
    io.emit('new_order_for_kitchen', orderData); 
  });

  // 2. Kitchen signals Order is Ready
  socket.on('mark_ready', (data) => {
    console.log("Order ready for Table:", data.tableNumber);
    // Notify the specific waiter's phone
    io.emit('order_ready', data); 
  });
});