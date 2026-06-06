const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const ORDERS_FILE = path.join(__dirname, 'db', 'orders.json');
const USERS_FILE = path.join(__dirname, 'db', 'users.json');
// Ensure database files exist
function initDb() {
  const dbPath = path.join(__dirname, 'db');

  // 1. CREATE db folder FIRST (MOST IMPORTANT)
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath);
  }

  // 2. orders.json path
  const ordersFile = path.join(dbPath, 'orders.json');

  if (!fs.existsSync(ordersFile)) {
    const initialOrders = [
      {
        id: "ORD-9482",
        customerName: "Alpha Logistics Ltd",
        packageSize: "16x20",
        quantity: 120,
        status: "Pending",
        productImage: "corrugated_box",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ];
    fs.writeFileSync(ordersFile, JSON.stringify(initialOrders, null, 2), 'utf8');
  }

  // 3. users.json path
  const usersFile = path.join(dbPath, 'users.json');

  if (!fs.existsSync(usersFile)) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('admin123', salt);

    const initialUsers = [
      {
        id: "admin_1",
        username: "admin",
        password: hashedPassword,
        name: "Headquarters Administrator"
      }
    ];

    fs.writeFileSync(usersFile, JSON.stringify(initialUsers, null, 2), 'utf8');
  }
}

// Read and write helpers
function readOrders() {
  initDb();
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading orders file:", error);
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error("Error writing orders file:", error);
    return false;
  }
}

function readUsers() {
  initDb();
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

module.exports = {
  readOrders,
  writeOrders,
  readUsers,
  initDb
};
