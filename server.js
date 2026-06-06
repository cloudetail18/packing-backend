const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for dev simplicity
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'packing_system_super_secret_key_13579';

// Initialize Database
db.initDb();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
// 1. Auth Route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const users = db.readUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Create JWT Token
  const token = jwt.sign(
    { id: user.id, username: user.username, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name
    }
  });
});

// Verify token route (to persist login on page refresh)
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// 2. Orders REST Endpoints
// GET orders (Public - needed by both Admin and TV display on startup)
app.get('/api/orders', (req, res) => {
  const orders = db.readOrders();
  res.json(orders);
});

// POST order (Private - Admin only)
app.post('/api/orders', authMiddleware, (req, res) => {
  const { customerName, packageSize, quantity, productImage } = req.body;

  if (!customerName || !packageSize || !quantity) {
    return res.status(400).json({ message: 'Customer name, package size, and quantity are required' });
  }

  const orders = db.readOrders();
  const newOrder = {
    id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName,
    packageSize,
    quantity: parseInt(quantity),
    status: 'Pending',
    productImage: productImage || 'corrugated_box',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  db.writeOrders(orders);

  // Emit Socket.IO event to all clients
  io.emit('new-order', newOrder);

  res.status(201).json(newOrder);
});

// PUT order status/details (Private - Admin only)
app.put('/api/orders/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status, customerName, packageSize, quantity, productImage } = req.body;

  const orders = db.readOrders();
  const index = orders.findIndex(o => o.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Update fields if provided
  if (status) orders[index].status = status;
  if (customerName) orders[index].customerName = customerName;
  if (packageSize) orders[index].packageSize = packageSize;
  if (quantity) orders[index].quantity = parseInt(quantity);
  if (productImage) orders[index].productImage = productImage;

  db.writeOrders(orders);

  // Emit Socket.IO event to all clients
  io.emit('update-status', orders[index]);

  res.json(orders[index]);
});

// DELETE order (Private - Admin only)
app.delete('/api/orders/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  const orders = db.readOrders();
  const filtered = orders.filter(o => o.id !== id);

  if (orders.length === filtered.length) {
    return res.status(404).json({ message: 'Order not found' });
  }

  db.writeOrders(filtered);

  // Emit Socket.IO event to all clients
  io.emit('delete-order', id);

  res.json({ message: 'Order deleted successfully', id });
});

// Socket.IO Connection Logic
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Option for admin dashboard to emit directly over socket instead of REST
  socket.on('new-order', (orderData) => {
    console.log('Socket received new-order:', orderData);
    const orders = db.readOrders();
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: orderData.customerName,
      packageSize: orderData.packageSize,
      quantity: parseInt(orderData.quantity),
      status: 'Pending',
      productImage: orderData.productImage || 'corrugated_box',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    db.writeOrders(orders);

    // Broadcast to ALL clients
    io.emit('new-order', newOrder);
  });

  socket.on('update-status', (updateData) => {
    console.log('Socket received update-status:', updateData);
    const { id, status } = updateData;
    const orders = db.readOrders();
    const index = orders.findIndex(o => o.id === id);

    if (index !== -1) {
      orders[index].status = status;
      db.writeOrders(orders);

      // Broadcast to ALL clients
      io.emit('update-status', orders[index]);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
