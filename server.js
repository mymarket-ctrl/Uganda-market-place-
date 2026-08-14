const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const DB = path.join(DATA, "db.json");

if (!fs.existsSync(DATA)) {
  fs.mkdirSync(DATA, { recursive: true });
}

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

if (!fs.existsSync(DB)) {
  fs.writeFileSync(DB, JSON.stringify(seed, null, 2));
}

function readDB() {
  const db = JSON.parse(fs.readFileSync(DB, "utf8"));

  // Repair older database versions automatically
  if (!db.users) db.users = [];
  if (!db.products) db.products = [];
  if (!db.orders) db.orders = [];

  if (!db.training) {
    db.training = seed.training;
  }

  if (!Array.isArray(db.training.products)) {
    db.training.products = seed.training.products;
  }

  if (!db.training.totalTasks) {
    db.training.totalTasks = 40;
  }

  if (!db.training.maxDeposit) {
    db.training.maxDeposit = 30000;
  }

  if (!db.training.commissionPerTask) {
    db.training.commissionPerTask = 2500;
  }

  if (!Array.isArray(db.trainingUsers)) {
    db.trainingUsers = [];
  }

  return db;
}

function writeDB(db) {
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

function id(prefix) {
  return prefix + "_" + crypto.randomBytes(5).toString("hex");
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);

  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS"
  });

  res.end(body);
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
  const { password, ...safe } = user;
  return safe;
}

function getTrainingUser(db, userId) {
  if (!Array.isArray(db.trainingUsers)) {
    db.trainingUsers = [];
  }

  let t = db.trainingUsers.find(x => x.userId === userId);

  if (!t) {
    t = {
      userId,
      balance: 0,
      commission: 0,
      progress: 0,
      status: "active",
      negativeAmount: 0,
      depositRequired: 0,
      depositApproved: false,
      cycle: 1,
      completedCycles: 0
    };

    db.trainingUsers.push(t);
    writeDB(db);
  }

  return t;
}

async function api(req, res, url) {

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS"
    });

    return res.end();
  }

  const db = readDB();

  // =========================
  // PRODUCTS
  // =========================

  if (
    req.method === "GET" &&
    url.pathname === "/api/products"
  ) {
    let list = db.products.filter(
      p => p.active !== false
    );

    const q =
      (url.searchParams.get("q") || "").toLowerCase();

    const cat =
      url.searchParams.get("category");

    if (q) {
      list = list.filter(p =>
        (p.name + " " + p.category)
          .toLowerCase()
          .includes(q)
      );
    }

    if (cat && cat !== "All") {
      list = list.filter(
        p => p.category === cat
      );
    }

    return json(res, 200, {
      products: list
    });
  }

  if (
    req.method === "GET" &&
    url.pathname === "/api/categories"
  ) {
    return json(res, 200, {
      categories: [
        "Phones",
        "Electronics",
        "Solar",
        "Fashion",
        "Home",
        "Beauty",
        "Groceries"
      ]
    });
  }

  // =========================
  // LOGIN
  // =========================

  if (
    req.method === "POST" &&
    url.pathname === "/api/login"
  ) {
    const b = await body(req);

    const email =
      String(b.email || "").toLowerCase();

    const password =
      String(b.password || "");

    const user = db.users.find(
      u =>
        u.email.toLowerCase() === email &&
        u.password === password
    );

    if (!user) {
      return json(res, 401, {
        error: "Invalid email or password"
      });
    }

    return json(res, 200, {
      user: safeUser(user)
    });
  }

  // =========================
  // REGISTER
  // =========================

  if (
    req.method === "POST" &&
    url.pathname === "/api/register"
  ) {
    const b = await body(req);

    if (!b.name || !b.email || !b.password) {
      return json(res, 400, {
        error:
          "Name, email and password are required"
      });
    }

    const email =
      String(b.email).toLowerCase();

    if (
      db.users.some(
        u => u.email.toLowerCase() === email
      )
    ) {
      return json(res, 409, {
        error: "Email already exists"
      });
    }

    const user = {
      id: id("u"),
      name: b.name,
      email: email,
      password: b.password,
      role:
        b.role === "seller"
          ? "seller"
          : "customer",
      shop: b.shop || ""
    };

    db.users.push(user);
    writeDB(db);

    return json(res, 201, {
      user: safeUser(user)
    });
  }

  // =========================
  // ORDERS
  // =========================

  if (
    req.method === "POST" &&
    url.pathname === "/api/orders"
  ) {
    const b = await body(req);

    if (!b.items || !b.items.length) {
      return json(res, 400, {
        error: "Cart is empty"
      });
    }

    const total = b.items.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
        Number(item.qty),
      0
    );

    for (const item of b.items) {
      const product =
        db.products.find(
          p => p.id === item.id
        );

      if (
        !product ||
        product.stock < Number(item.qty)
      ) {
        return json(res, 400, {
          error:
            `Insufficient stock for ${item.name}`
        });
      }
    }

    b.items.forEach(item => {
      const product =
        db.products.find(
          p => p.id === item.id
        );

      product.stock -= Number(item.qty);
    });

    const order = {
      id: id("ord"),
      customerId:
        b.customerId || "guest",
      customerName:
        b.customerName || "Guest",
      phone: b.phone || "",
      address: b.address || "",
      items: b.items,
      total,
      status: "Pending",
      payment:
        b.payment || "Cash on Delivery",
      createdAt:
        new Date().toISOString()
    };

    db.orders.unshift(order);
    writeDB(db);

    return json(res, 201, {
      order
    });
  }

  if (
    req.method === "GET" &&
    url.pathname === "/api/orders"
  ) {
    const role =
      url.searchParams.get("role");

    const uid =
      url.searchParams.get("userId");

    let orders = db.orders;

    if (role === "customer") {
      orders =
        orders.filter(
          o => o.customerId === uid
        );
    }

    if (role === "seller") {
      const productIds =
        db.products
          .filter(
            p => p.sellerId === uid
          )
          .map(p => p.id);

      orders =
        orders.filter(
          o =>
            o.items.some(
              item =>
                productIds.includes(item.id)
            )
        );
    }

    return json(res, 200, {
      orders
    });
  }

  // =========================
  // ADD PRODUCT
  // =========================

  if (
    req.method === "POST" &&
    url.pathname === "/api/products"
  ) {
    const b = await body(req);

    if (
      !b.name ||
      !b.price ||
      !b.sellerId
    ) {
      return json(res, 400, {
        error:
          "Product name, price and sellerId are required"
      });
    }

    const product = {
      id: id("p"),
      name: b.name,
      category: b.category || "Other",
      price: Number(b.price),
      stock: Number(b.stock || 0),
      sellerId: b.sellerId,
      image: b.image || "🛍️",
      active: true
    };

    db.products.push(product);
    writeDB(db);

    return json(res, 201, {
      product
    });
  }

  // =========================
  // UPDATE ORDER
  // =========================

  if (
    req.method === "PUT" &&
    url.pathname.startsWith("/api/orders/")
  ) {
    const oid =
      url.pathname.split("/").pop();

    const b = await body(req);

    const order =
      db.orders.find(
        o => o.id === oid
      );

    if (!order) {
      return json(res, 404, {
        error: "Order not found"
      });
    }

    if (b.status) {
      order.status = b.status;
    }

    writeDB(db);

    return json(res, 200, {
      order
    });
  }

  // =========================
  // ADMIN STATS
  // =========================

  if (
    req.method === "GET" &&
    url.pathname === "/api/admin/stats"
  ) {
    const revenue =
      db.orders.reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      );

    return json(res, 200, {
      customers:
        db.users.filter(
          u => u.role === "customer"
        ).length,

      sellers:
        db.users.filter(
          u => u.role === "seller"
        ).length,

      products:
        db.products.length,

      orders:
        db.orders.length,

      revenue
    });
  }

  // =====================================================
  // TRAINING SETTINGS
  // =====================================================

  if (
    req.method === "GET" &&
    url.pathname === "/api/training/settings"
  ) {
    return json(res, 200, {
      training: db.training
    });
  }

  if (
    req.method === "POST" &&
    url.pathname === "/api/training/settings"
  ) {
    const b = await body(req);

    if (!db.training) {
      db.training = seed.training;
    }

    if (
      b.startingBalance !== undefined
    ) {
      db.training.startingBalance =
        Number(b.startingBalance);
    }

    if (
      b.totalTasks !== undefined
    ) {
      db.training.totalTasks =
        Number(b.totalTasks);
    }

    if (
      b.maxDeposit !== undefined
    ) {
      db.training.maxDeposit =
        Number(b.maxDeposit);
    }

    if (
      b.commissionPerTask !== undefined
    ) {
      db.training.commissionPerTask =
        Number(b.commissionPerTask);
    }

    if (
      Array.isArray(b.products) &&
      b.products.length === 40
    ) {
      db.training.products =
        b.products;
    }

    writeDB(db);

    return json(res, 200, {
      message:
        "Training settings updated",
      training: db.training
    });
  }

  // =====================================================
  // TRAINING STATE
  // =====================================================

  if (
    req.method === "GET" &&
    url.pathname === "/api/training/state"
  ) {
    const userId =
      url.searchParams.get("userId");

    if (!userId) {
      return json(res, 400, {
        error: "userId is required"
      });
    }

    const training =
      getTrainingUser(db, userId);

    return json(res, 200, {
      training
    });
  }

  // =====================================================
  // TRAINING OPTIMIZE
  // =====================================================

  if (
    req.method === "POST" &&
    url.pathname === "/api/training/optimize"
  ) {
    const b = await body(req);

    const userId =
      String(b.userId || "");

    if (!userId) {
      return json(res, 400, {
        error: "userId is required"
      });
    }

    const user =
      db.users.find(
        u => u.id === userId
      );

    if (!user) {
      return json(res, 404, {
        error: "User not found"
      });
    }

    const training =
      getTrainingUser(db, userId);

    if (
      training.status === "completed"
    ) {
      return json(res, 400, {
        error:
          "Cycle completed. Start a new cycle."
      });
    }

    if (
      training.status === "waiting_admin"
    ) {
      return json(res, 400, {
        error:
          "Admin action required.",
        depositRequired:
          training.depositRequired
      });
    }

    if (
      training.progress >= 40
    ) {
      return json(res, 400, {
        error:
          "Optimization already completed."
      });
    }

    // One optimization
    training.progress++;

    // Demo commission
    const commission =
      Number(
        db.training.commissionPerTask ||
        2500
      );

    training.commission +=
      commission;

    training.balance +=
      commission;

    // Negative scenario only at 39/40
    if (
      training.progress === 39
    ) {
      const options = [
        5000,
        10000,
        20000,
        30000
      ];

      const negative =
        options[
          Math.floor(
            Math.random() *
            options.length
          )
        ];

      training.balance -=
        negative;

      training.negativeAmount =
        negative;

      training.depositRequired =
        negative;

      training.depositApproved =
        false;

      training.status =
        "waiting_admin";
    }

    // Complete at 40/40
    if (
      training.progress === 40
    ) {
      training.status =
        "completed";

      training.completedCycles++;
    }

    writeDB(db);

    let message =
      "Optimization successful.";

    if (
      training.status ===
      "waiting_admin"
    ) {
      message =
        "Optimization paused. Please contact the administrator.";
    }

    if (
      training.status ===
      "completed"
    ) {
      message =
        "Optimization completed 40/40.";
    }

    return json(res, 200, {
      message,
      training
    });
  }

  // =====================================================
  // ADMIN: VIEW TRAINEES
  // =====================================================

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/training/admin-trainees"
  ) {
    const adminEmail =
      String(
        url.searchParams.get(
          "adminEmail"
        ) || ""
      ).toLowerCase();

    const admin =
      db.users.find(
        u =>
          u.email.toLowerCase() ===
            adminEmail &&
          u.role === "admin"
      );

    if (!admin) {
      return json(res, 403, {
        error:
          "Administrator authorization required"
      });
    }

    return json(res, 200, {
      trainees:
        db.trainingUsers || []
    });
  }

  // =====================================================
  // ADMIN: CLEAR NEGATIVE SCENARIO
  // =====================================================

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/admin-clear"
  ) {
    const b = await body(req);

    const userId =
      String(b.userId || "");

    const adminEmail =
      String(
        b.adminEmail || ""
      ).toLowerCase();

    if (!userId) {
      return json(res, 400, {
        error: "userId is required"
      });
    }

    const admin =
      db.users.find(
        u =>
          u.email.toLowerCase() ===
            adminEmail &&
          u.role === "admin"
      );

    if (!admin) {
      return json(res, 403, {
        error:
          "Administrator authorization required"
      });
    }

    const training =
      db.trainingUsers.find(
        x => x.userId === userId
      );

    if (!training) {
      return json(res, 404, {
        error:
          "Trainee training record not found"
      });
    }

    if (
      training.status !==
      "waiting_admin"
    ) {
      return json(res, 400, {
        error:
          "No admin action is currently required"
      });
    }

    const required =
      Number(
        training.depositRequired || 0
      );

    if (
      required <= 0 ||
      required >
        Number(
          db.training.maxDeposit ||
          30000
        )
    ) {
      return json(res, 400, {
        error:
          "Invalid demo requirement"
      });
    }

    /*
      DEMO ONLY.

      Admin clearance does not process real money.
      It simply clears the simulated negative event.
    */

    training.balance = 0;
    training.depositApproved =
      true;

    training.depositRequired =
      0;

    training.negativeAmount =
      0;

    training.status =
      "active";

    writeDB(db);

    return json(res, 200, {
      message:
        "Demo requirement cleared by administrator.",
      training
    });
  }

  // =====================================================
  // NEW TRAINING CYCLE
  // =====================================================

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/new-cycle"
  ) {
    const b = await body(req);

    const userId =
      String(b.userId || "");

    if (!userId) {
      return json(res, 400, {
        error: "userId is required"
      });
    }

    const training =
      db.trainingUsers.find(
        x => x.userId === userId
      );

    if (!training) {
      return json(res, 404, {
        error:
          "Training record not found"
      });
    }

    if (
      training.status !==
      "completed"
    ) {
      return json(res, 400, {
        error:
          "The current cycle has not been completed."
      });
    }

    training.cycle++;

    // New cycle starts from zero
    training.balance = 0;
    training.commission = 0;
    training.progress = 0;
    training.status = "active";
    training.negativeAmount = 0;
    training.depositRequired = 0;
    training.depositApproved = false;

    writeDB(db);

    return json(res, 200, {
      message:
        "New demo cycle started from UGX 0.",
      training
    });
  }

  return json(res, 404, {
    error: "Not found"
  });
}

// =====================================
