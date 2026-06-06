const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const ORDERS_FILE = path.join(__dirname, '..', 'db', 'orders.json');
const USERS_FILE = path.join(__dirname, '..', 'db', 'users.json');

// Ensure database files exist
function initDb() {
  const dbDir = path.join(__dirname, '..', 'db');

  // Create db directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Created db directory');
  }

  // Create orders.json if it doesn't exist
  if (!fs.existsSync(ORDERS_FILE)) {
    const initialOrders = [
      {
        id: "ORD-9482",
        customerName: "Alpha Logistics Ltd",
        packageSize: "16x20",
        quantity: 120,
        status: "Pending",
        productImage: "corrugated_box",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: "ORD-1042",
        customerName: "Swift Packaging Co",
        packageSize: "12x15",
        quantity: 500,
        status: "Pending",
        productImage: "bubble_mailer",
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: "ORD-5521",
        customerName: "E-Commerce Giants Inc",
        packageSize: "14x19",
        quantity: 1500,
        status: "Dispatched",
        productImage: "poly_mailer",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: "ORD-3029",
        customerName: "Apex Heavy Machinery",
        packageSize: "20x28",
        quantity: 50,
        status: "Pending",
        productImage: "heavy_crate",
        createdAt: new Date().toISOString()
      }
    ];

    fs.writeFileSync(
      ORDERS_FILE,
      JSON.stringify(initialOrders, null, 2),
      'utf8'
    );

    console.log('Created orders.json');
  }

  // Create users.json if it doesn't exist
  if (!fs.existsSync(USERS_FILE)) {
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

    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify(initialUsers, null, 2),
      'utf8'
    );

    console.log('Created users.json');
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
