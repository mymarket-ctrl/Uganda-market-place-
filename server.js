const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const DB = path.join(DATA, "db.json");

const seed = {
  users: [
    {
      id: "u_admin",
      name: "MyMarket Admin",
      email: "admin@mymarket.ug",
      password: "admin123",
      role: "admin"
    },
    {
      id: "u_seller",
      name: "Demo Electronics",
      email: "seller@mymarket.ug",
      password: "seller123",
      role: "seller",
      shop: "Demo Electronics Uganda"
    }
  ],

  products: [
    {
      id: "p1",
      name: "Samsung Galaxy A15",
      category: "Phones",
      price: 699000,
      stock: 12,
      sellerId: "u_seller",
      image: "📱",
      active: true
    },
    {
      id: "p2",
      name: "Solar Home Kit 100W",
      category: "Solar",
      price: 320000,
      stock: 20,
      sellerId: "u_seller",
      image: "☀️",
      active: true
    },
    {
      id: "p3",
      name: "Bluetooth Speaker",
      category: "Electronics",
      price: 85000,
      stock: 30,
      sellerId: "u_seller",
      image: "🔊",
      active: true
    },
    {
      id: "p4",
      name: "Men's Sneakers",
      category: "Fashion",
      price: 120000,
      stock: 18,
      sellerId: "u_seller",
      image: "👟",
      active: true
    }
  ],

  orders: [],

  training: {
    startingBalance: 0,
    totalTasks: 40,
    maxDeposit: 30000,
    commissionPerTask: 2500,

    products: [
      "Bluetooth Speaker",
      "Phone Charger",
      "Solar Lamp",
      "Wireless Earbuds",
      "Smart Watch",
      "LED Bulb",
      "Power Bank",
      "USB Cable",
      "Electric Kettle",
      "Phone Holder",
      "Mini Fan",
      "Smart TV",
      "Laptop Stand",
      "Security Camera",
      "Bluetooth Headphones",
      "Ring Light",
      "Extension Cable",
      "Solar Panel",
      "Table Lamp",
      "Electric Iron",
      "Keyboard",
      "Computer Mouse",
      "Memory Card",
      "WiFi Router",
      "Projector",
      "Smartphone",
      "Microphone",
      "Tripod",
      "Gaming Controller",
      "LED Strip",
      "Hair Dryer",
      "Blender",
      "Electric Cooker",
      "Power Inverter",
      "Rechargeable Fan",
      "Vacuum Cleaner",
      "Digital Scale",
      "Air Cooler",
      "Smart Doorbell",
      "Smart TV Accessory"
    ]
  },

  trainingUsers: []
};

if (!fs.existsSync(DATA)) {
  fs.mkdirSync(DATA, { recursive: true });
}

if (!fs.existsSync(DB)) {
  fs.writeFileSync(DB, JSON.stringify(seed, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB, "utf8"));
}

function writeDB(db) {
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

function id(prefix) {
  return prefix + "_" + crypto.randomBytes(5).toString("hex");
}

function json(res, code, obj) {
  const output = JSON.stringify(obj);

  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS"
  });

  res.end(output);
}

function body(req) {
  return new Promise((resolve, reject) => {
    let s = "";

    req.on("data", chunk => {
      s += chunk;
    });

    req.on("end", () => {
      try {
        resolve(s ? JSON.parse(s) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function safeUser(user) {
  const { password, ...cleanUser } = user;
  return cleanUser;
	    }
