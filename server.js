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

  withdrawals: [],

  supportRequests: [],

  referrals: [],

  withdrawalDetails: [],

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

    trainingUsers: [],

  trainingWithdrawalAccounts: [],

  trainingWithdrawals: []
};if (!fs.existsSync(DATA)) {
  fs.mkdirSync(DATA, { recursive: true });
}

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

  if (!Array.isArray(db.withdrawals)) {
    db.withdrawals = [];
  }

  if (!Array.isArray(db.trainingUsers)) {
    db.trainingUsers = [];
  }

  if (!db.training) {
    db.training = seed.training;
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
  const output =
    JSON.stringify(obj);

  res.writeHead(code, {
    "Content-Type":
      "application/json; charset=utf-8",

    "Access-Control-Allow-Origin":
      "*",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Access-Control-Allow-Methods":
      "GET,POST,PUT,OPTIONS"
  });

  res.end(output);
}

function body(req) {
  return new Promise(
    (resolve, reject) => {
      let s = "";

      req.on("data", chunk => {
        s += chunk;
      });

      req.on("end", () => {
        try {
          resolve(
            s
              ? JSON.parse(s)
              : {}
          );
        } catch (e) {
          reject(e);
        }
      });
    }
  );
}

function safeUser(user) {
  const {
    password,
    ...cleanUser
  } = user;

  return cleanUser;
}

function money(n) {
  return Number(n || 0);
}

function findUser(db, userId) {
  return db.users.find(
    u => u.id === userId
  );
}

function isAdmin(
  db,
  adminEmail,
  adminPassword
) {
  const email =
    String(
      adminEmail || ""
    ).toLowerCase();

  const admin =
    db.users.find(
      u =>
        String(
          u.email || ""
        ).toLowerCase() === email &&
        u.role === "admin" &&
        u.password === adminPassword
    );

  return admin || null;
	  }function sellerProductIds(db, sellerId) {
  return db.products
    .filter(
      p => p.sellerId === sellerId
    )
    .map(p => p.id);
}

function sellerOrderAmount(
  db,
  order,
  sellerId
) {
  const productIds =
    sellerProductIds(
      db,
      sellerId
    );

  return order.items
    .filter(
      item =>
        productIds.includes(
          item.id
        )
    )
    .reduce(
      (sum, item) =>
        sum +
        money(item.price) *
        money(item.qty),
      0
    );
}

function sellerPendingEarnings(
  db,
  sellerId
) {
  return db.orders
    .filter(order => {

      const amount =
        sellerOrderAmount(
          db,
          order,
          sellerId
        );

      return (
        amount > 0 &&
        ![
          "Delivered",
          "Completed",
          "Cancelled"
        ].includes(
          String(order.status)
        )
      );
    })
    .reduce(
      (sum, order) =>
        sum +
        sellerOrderAmount(
          db,
          order,
          sellerId
        ),
      0
    );
}

function sellerDeliveredEarnings(
  db,
  sellerId
) {
  return db.orders
    .filter(order =>
      [
        "Delivered",
        "Completed"
      ].includes(
        String(order.status)
      )
    )
    .reduce(
      (sum, order) =>
        sum +
        sellerOrderAmount(
          db,
          order,
          sellerId
        ),
      0
    );
}

function sellerPaidWithdrawals(
  db,
  sellerId
) {
  return db.withdrawals
    .filter(
      w =>
        w.sellerId === sellerId &&
        w.status === "Paid"
    )
    .reduce(
      (sum, w) =>
        sum +
        money(w.amount),
      0
    );
}

function sellerPendingWithdrawals(
  db,
  sellerId
) {
  return db.withdrawals
    .filter(
      w =>
        w.sellerId === sellerId &&
        w.status === "Pending"
    )
    .reduce(
      (sum, w) =>
        sum +
        money(w.amount),
      0
    );
}

function sellerWallet(
  db,
  sellerId
) {
  const delivered =
    sellerDeliveredEarnings(
      db,
      sellerId
    );

  const paid =
    sellerPaidWithdrawals(
      db,
      sellerId
    );

  const pendingWithdrawal =
    sellerPendingWithdrawals(
      db,
      sellerId
    );

  const available =
    Math.max(
      0,
      delivered -
      paid -
      pendingWithdrawal
    );

  const pendingSales =
    sellerPendingEarnings(
      db,
      sellerId
    );

  return {
    totalDeliveredEarnings:
      delivered,

    pendingSales:
      pendingSales,

    totalWithdrawn:
      paid,

    pendingWithdrawals:
      pendingWithdrawal,

    availableBalance:
      available,

    currency:
      "UGX"
  };
}async function api(req, res, url) {

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

  if (!db.trainingUsers) {
    db.trainingUsers = [];
  }

  if (!db.withdrawals) {
    db.withdrawals = [];
  }

  /*
  =====================================================
  PRODUCTS
  =====================================================
  */

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
      url.searchParams.get(
        "category"
      );

    if (q) {
      list =
        list.filter(p =>
          (
            p.name +
            " " +
            p.category
          )
            .toLowerCase()
            .includes(q)
        );
    }

    if (
      cat &&
      cat !== "All"
    ) {
      list =
        list.filter(
          p =>
            p.category === cat
        );
    }

    return json(res, 200, {
      products: list,
      currency: "UGX"
    });
  }

  /*
  =====================================================
  CATEGORIES
  =====================================================
  */

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/categories"
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
  =====================================================
  LOGIN
  =====================================================
  */

  if (
    req.method === "POST" &&
    url.pathname === "/api/login"
  ) {

    const b =
      await body(req);

    const u =
      db.users.find(x =>
        String(
          x.email || ""
        ).toLowerCase() ===
          String(
            b.email || ""
          ).toLowerCase() &&
        x.password ===
          b.password
      );

    if (!u) {
      return json(res, 401, {
        error:
          "Invalid email or password"
      });
    }

    return json(res, 200, {
      user:
        safeUser(u)
    });
  }

  /*
  =====================================================
  REGISTER
  =====================================================
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/register"
  ) {

    const b =
      await body(req);

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
          String(
            u.email || ""
          ).toLowerCase() ===
          String(
            b.email || ""
          ).toLowerCase()
      )
    ) {
      return json(res, 409, {
        error:
          "Email already exists"
      });
    }

    const u = {
      id:
        id("u"),

      name:
        b.name,

      email:
        b.email,

      password:
        b.password,

      role:
        b.role === "seller"
          ? "seller"
          : "customer",

      shop:
        b.shop || "",

      mobileMoney: {
        network: "",
        number: ""
      }
    };

    db.users.push(u);

    writeDB(db);

    return json(res, 201, {
      user:
        safeUser(u)
    });
  }

  /*
  =====================================================
  CREATE ORDER
  =====================================================
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/orders"
  ) {

    const b =
      await body(req);

    if (
      !b.items ||
      !b.items.length
    ) {
      return json(res, 400, {
        error:
          "Cart is empty"
      });
    }

    const total =
      b.items.reduce(
        (sum, item) =>
          sum +
          money(item.price) *
          money(item.qty),
        0
      );

    for (
      const item of b.items
    ) {

      const p =
        db.products.find(
          x =>
            x.id === item.id
        );

      if (
        !p ||
        p.stock <
          item.qty
      ) {
        return json(res, 400, {
          error:
            "Insufficient stock for " +
            item.name
        });
      }
    }

    b.items.forEach(
      item => {

        const p =
          db.products.find(
            x =>
              x.id === item.id
          );

        p.stock -=
          money(item.qty);
      }
    );

    const order = {
      id:
        id("ord"),

      customerId:
        b.customerId ||
        "guest",

      customerName:
        b.customerName ||
        "Guest",

      phone:
        b.phone || "",

      address:
        b.address || "",

      items:
        b.items,

      total:

        total,

      status:
        "Pending",

      payment:
        b.payment ||
        "Cash on Delivery",

      createdAt:
        new Date()
          .toISOString()
    };

    db.orders.unshift(
      order
    );

    writeDB(db);

    return json(res, 201, {
      order,
      currency:
        "UGX"
    });
  }  /*
  =====================================================
  GET ORDERS
  =====================================================
  */

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/orders"
  ) {

    const role =
      url.searchParams.get(
        "role"
      );

    const uid =
      url.searchParams.get(
        "userId"
      );

    let orders =
      db.orders;

    if (
      role === "customer"
    ) {
      orders =
        orders.filter(
          o =>
            o.customerId === uid
        );
    }

    if (
      role === "seller"
    ) {

      const ids =
        sellerProductIds(
          db,
          uid
        );

      orders =
        orders.filter(
          o =>
            o.items.some(
              item =>
                ids.includes(
                  item.id
                )
            )
        );
    }

    return json(res, 200, {
      orders,
      currency:
        "UGX"
    });
  }

  /*
  =====================================================
  CREATE PRODUCT
  =====================================================
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/products"
  ) {

    const b =
      await body(req);

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
      id:
        id("p"),

      name:
        b.name,

      category:
        b.category ||
        "Other",

      price:
        money(b.price),

      stock:
        money(b.stock),

      sellerId:
        b.sellerId,

      image:
        b.image ||
        "🛍️",

      active:
        true
    };

    db.products.push(
      product
    );

    writeDB(db);

    return json(res, 201, {
      product,
      currency:
        "UGX"
    });
  }

  /*
  =====================================================
  UPDATE ORDER
  =====================================================
  */

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

    const b =
      await body(req);

    const order =
      db.orders.find(
        x =>
          x.id === oid
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
      order,
      currency:
        "UGX"
    });
  }

  /*
  =====================================================
  ADMIN STATS
  =====================================================
  */

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/admin/stats"
  ) {

    const revenue =
      db.orders.reduce(
        (sum, order) =>
          sum +
          money(
            order.total
          ),
        0
      );

    const pendingWithdrawals =
      db.withdrawals.filter(
        w =>
          w.status ===
          "Pending"
      );

    const withdrawalAmount =
      pendingWithdrawals.reduce(
        (sum, w) =>
          sum +
          money(
            w.amount
          ),
        0
      );

    return json(res, 200, {

      customers:
        db.users.filter(
          u =>
            u.role ===
            "customer"
        ).length,

      sellers:
        db.users.filter(
          u =>
            u.role ===
            "seller"
        ).length,

      products:
        db.products.length,

      orders:
        db.orders.length,

      revenue,

      pendingWithdrawals:
        pendingWithdrawals.length,

      pendingWithdrawalAmount:
        withdrawalAmount,

      currency:
        "UGX"
    });
  }

  /*
  =====================================================
  SELLER WALLET
  =====================================================
  */

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/seller/wallet"
  ) {

    const sellerId =
      url.searchParams.get(
        "sellerId"
      );

    if (!sellerId) {
      return json(res, 400, {
        error:
          "sellerId is required"
      });
    }

    const seller =
      findUser(
        db,
        sellerId
      );

    if (
      !seller ||
      seller.role !==
        "seller"
    ) {
      return json(res, 403, {
        error:
          "Seller account required"
      });
    }

    return json(res, 200, {
      wallet:
        sellerWallet(
          db,
          sellerId
        ),

      currency:
        "UGX"
    });
				}  /*
  =====================================================
  SAVE SELLER MOBILE MONEY DETAILS
  =====================================================
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/seller/mobile-money"
  ) {

    const b =
      await body(req);

    const sellerId =
      String(
        b.sellerId || ""
      );

    const network =
      String(
        b.network || ""
      ).trim();

    const number =
      String(
        b.number || ""
      ).trim();

    if (!sellerId) {
      return json(res, 400, {
        error:
          "sellerId is required"
      });
    }

    const seller =
      findUser(
        db,
        sellerId
      );

    if (
      !seller ||
      seller.role !==
        "seller"
    ) {
      return json(res, 403, {
        error:
          "Seller account required"
      });
    }

    if (
      ![
        "MTN",
        "Airtel"
      ].includes(network)
    ) {
      return json(res, 400, {
        error:
          "Select MTN or Airtel Mobile Money"
      });
    }

    if (
      !/^07\d{8}$/.test(
        number
      )
    ) {
      return json(res, 400, {
        error:
          "Enter a valid Ugandan Mobile Money number"
      });
    }

    seller.mobileMoney = {
      network,
      number
    };

    writeDB(db);

    return json(res, 200, {
      message:
        "Mobile Money details saved",

      mobileMoney:
        seller.mobileMoney
    });
  }

  /*
  =====================================================
  CREATE SELLER WITHDRAWAL
  =====================================================
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/withdrawals"
  ) {

    const b =
      await body(req);

    const sellerId =
      String(
        b.sellerId || ""
      );

    const amount =
      money(b.amount);

    if (!sellerId) {
      return json(res, 400, {
        error:
          "sellerId is required"
      });
    }

    const seller =
      findUser(
        db,
        sellerId
      );

    if (
      !seller ||
      seller.role !==
        "seller"
    ) {
      return json(res, 403, {
        error:
          "Seller account required"
      });
    }

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      return json(res, 400, {
        error:
          "Enter a valid withdrawal amount"
      });
    }

    const wallet =
      sellerWallet(
        db,
        sellerId
      );

    if (
      amount >
      wallet.availableBalance
    ) {
      return json(res, 400, {
        error:
          "Insufficient available balance",

        availableBalance:
          wallet.availableBalance,

        currency:
          "UGX"
      });
    }

    let network =
      String(
        b.network ||
        (
          seller.mobileMoney &&
          seller.mobileMoney.network
        ) ||
        ""
      ).trim();

    let number =
      String(
        b.number ||
        (
          seller.mobileMoney &&
          seller.mobileMoney.number
        ) ||
        ""
      ).trim();
if (
  ![
    "MTN",
    "Airtel"
  ].includes(network)
) {
  return json(res, 400, {
    error:
      "Select MTN or Airtel Mobile Money"
  });
}





    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return json(res, 400, {
        error: "Enter a valid withdrawal amount"
      });
    }

  

    if (
      amount >
      wallet.availableBalance
    ) {
      return json(res, 400, {
        error: "Insufficient available balance",
        availableBalance:
          wallet.availableBalance
      });
    }

    if (
      !seller.mobileMoney ||
      !seller.mobileMoney.network ||
      !seller.mobileMoney.number
    ) {
      return json(res, 400, {
        error:
          "Please save your Mobile Money withdrawal account first"
      });
    }

    const withdrawal = {
      id: id("wd"),
      sellerId,
      sellerName: seller.name,
      amount,
      currency: "UGX",

      network:
        seller.mobileMoney.network,

      accountNumber:
        seller.mobileMoney.number,

      status: "Pending",

      providerStatus:
        "Not processed",

      providerReference: "",

      createdAt:
        new Date().toISOString(),

      paidAt: null
    };

    db.withdrawals.unshift(
      withdrawal
    );

    writeDB(db);

    return json(res, 201, {
      message:
        "Withdrawal request submitted successfully.",

      withdrawal
    });
  }

  /*
  =====================================================
  SELLER WITHDRAWAL HISTORY
  =====================================================
  */

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/withdrawals"
  ) {

    const sellerId =
      url.searchParams.get(
        "sellerId"
      );

    if (!sellerId) {
      return json(res, 400, {
        error:
          "sellerId is required"
      });
    }

    const withdrawals =
      db.withdrawals.filter(
        w =>
          w.sellerId ===
          sellerId
      );

    return json(res, 200, {
      withdrawals,

      currency:
        "UGX"
    });
	}  /*
  =====================================================
  ADMIN VIEW ALL WITHDRAWALS
  =====================================================
  */

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/admin/withdrawals"
  ) {

    const adminEmail =
      String(
        url.searchParams.get(
          "adminEmail"
        ) || ""
      );

    const adminPassword =
      String(
        url.searchParams.get(
          "adminPassword"
        ) || ""
      );

    const admin =
      isAdmin(
        db,
        adminEmail,
        adminPassword
      );

    if (!admin) {
      return json(res, 403, {
        error:
          "Administrator authorization required"
      });
    }

    return json(res, 200, {

      withdrawals:
        db.withdrawals,

      currency:
        "UGX"
    });
  }

  /*
  =====================================================
  ADMIN PAY OR REJECT WITHDRAWAL
  =====================================================
  */

  if (
    req.method === "PUT" &&
    url.pathname.startsWith(
      "/api/withdrawals/"
    )
  ) {

    const wid =
      url.pathname
        .split("/")
        .pop();

    const b =
      await body(req);

    const adminEmail =
      String(
        b.adminEmail || ""
      );

    const adminPassword =
      String(
        b.adminPassword || ""
      );

    const admin =
      isAdmin(
        db,
        adminEmail,
        adminPassword
      );

    if (!admin) {
      return json(res, 403, {
        error:
          "Administrator authorization required"
      });
    }

    const withdrawal =
      db.withdrawals.find(
        w =>
          w.id === wid
      );

    if (!withdrawal) {
      return json(res, 404, {
        error:
          "Withdrawal not found"
      });
    }

    if (
      withdrawal.status !==
      "Pending"
    ) {
      return json(res, 400, {
        error:
          "This withdrawal has already been processed"
      });
    }

    const action =
      String(
        b.status || ""
      ).trim();

    /*
    =====================================================
    MARK WITHDRAWAL AS PAID
    =====================================================
    */

    if (
      action === "Paid"
    ) {

      const reference =
        String(
          b.transactionReference ||
          ""
        ).trim();

      if (!reference) {
        return json(res, 400, {
          error:
            "Mobile Money transaction reference is required"
        });
      }

      withdrawal.status =
        "Paid";

      withdrawal.transactionReference =
        reference;

      withdrawal.paidAt =
        new Date()
          .toISOString();

      withdrawal.adminNote =
        String(
          b.adminNote ||
          ""
        );

      withdrawal.processedBy =
        admin.id;

      writeDB(db);

      return json(res, 200, {

        message:
          "Withdrawal marked as paid successfully.",

        withdrawal,

        currency:
          "UGX"
      });
    }

    /*
    =====================================================
    REJECT WITHDRAWAL
    =====================================================
    */

    if (
      action === "Rejected"
    ) {

      withdrawal.status =
        "Rejected";

      withdrawal.rejectedAt =
        new Date()
          .toISOString();

      withdrawal.adminNote =
        String(
          b.adminNote ||
          "Withdrawal rejected"
        );

      withdrawal.processedBy =
        admin.id;

      writeDB(db);

      return json(res, 200, {

        message:
          "Withdrawal rejected.",

        withdrawal
      });
    }

    return json(res, 400, {
      error:
        "Status must be Paid or Rejected"
    });
		  }  /*
  =====================================================
  TRAINING SETTINGS - GET
  =====================================================
  */

  if (
    req.method === "GET" &&
    url.pathname ===
      "/api/training/settings"
  ) {

    return json(res, 200, {
      training:
        db.training,

      currency:
        "UGX"
    });
  }

  /*
  =====================================================
  TRAINING SETTINGS - SAVE
  =====================================================
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/settings"
  ) {

    const b =
      await body(req);

    if (
      b.startingBalance !==
      undefined
    ) {
      db.training.startingBalance =
        money(
          b.startingBalance
        );
    }

    if (
      b.maxDeposit !==
      undefined
    ) {
      db.training.maxDeposit =
        money(
          b.maxDeposit
        );
    }

    if (
      b.commissionPerTask !==
      undefined
    ) {
      db.training.commissionPerTask =
        money(
          b.commissionPerTask
        );
    }

    if (
      Array.isArray(
        b.products
      ) &&
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
  =====================================================
  TRAINING STATE
  =====================================================
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

    let t =
      db.trainingUsers.find(
        x =>
          x.userId ===
          userId
      );

    if (!t) {

      t = {

        userId,

        balance:
          money(
            db.training
              .startingBalance
          ),

        commission:
          0,

        progress:
          0,

        status:
          "active",

        negativeAmount:
          0,

        depositRequired:
          0,

        depositApproved:
          false,

        cycle:
          1,

        completedCycles:
          0,

        totalNegative:
          0
      };

      db.trainingUsers.push(
        t
      );

      writeDB(db);
    }

    return json(res, 200, {

      training:
        t,

      currency:
        "UGX"
    });
  }

  /*
  =====================================================
  TRAINING OPTIMIZE
  =====================================================
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/optimize"
  ) {

    const b =
      await body(req);

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

    let t =
      db.trainingUsers.find(
        x =>
          x.userId ===
          userId
      );

    if (!t) {

      t = {

        userId,

        balance: 0,

        commission: 0,

        progress: 0,

        status: "active",

        negativeAmount: 0,

        depositRequired: 0,

        depositApproved:
          false,

        cycle: 1,

        completedCycles: 0,

        totalNegative: 0
      };

      db.trainingUsers.push(
        t
      );
    }

    if (
      t.status ===
      "completed"
    ) {
      return json(res, 400, {
        error:
          "Cycle completed. Start a new cycle."
      });
    }

    if (
      t.status ===
      "waiting_admin"
    ) {
      return json(res, 400, {

        error:
          "Admin action required",

        depositRequired:
          t.depositRequired,

        currency:
          "UGX"
      });
    }

    if (
      t.progress >= 40
    ) {
      return json(res, 400, {
        error:
          "Optimization already completed"
      });
    }

    /*
    -----------------------------------------------
    COMPLETE ONE PRODUCT OPTIMIZATION
    -----------------------------------------------
    */

    t.progress++;

    const commission =
      money(
        db.training
          .commissionPerTask ||
          2500
      );

    t.commission +=
      commission;

    t.balance +=
      commission;

    /*
    -----------------------------------------------
    NEGATIVE EVENT
    -----------------------------------------------
    */

    if (
      t.progress === 39
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

      t.balance -=
        negative;

      t.negativeAmount =
        negative;

      t.depositRequired =
        negative;

      t.totalNegative =
        money(
          t.totalNegative
        ) +
        negative;

      t.depositApproved =
        false;

      t.status =
        "waiting_admin";
    }

    /*
    -----------------------------------------------
    COMPLETE AT 40/40
    -----------------------------------------------
    */

    if (
      t.progress === 40
    ) {

      t.status =
        "completed";

      t.completedCycles++;
    }

    writeDB(db);

    return json(res, 200, {

      message:

        t.status ===
        "waiting_admin"

          ? "Optimization paused. Please contact Admin/Agent Support for negative clearance."

          : t.progress === 40

            ? "Optimization completed 40/40."

            : "Optimization successful.",

      training:
        t,

      currency:
        "UGX"
    });
		  }  /*
  =====================================================
  ADMIN: VIEW TRAINING TRAINEES
  =====================================================
  */

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

    const adminPassword =
      String(
        url.searchParams.get(
          "adminPassword"
        ) || ""
      );

    const admin =
      isAdmin(
        db,
        adminEmail,
        adminPassword
      );

    if (!admin) {
      return json(res, 403, {
        error:
          "Administrator authorization required"
      });
    }

    const trainees =
      db.trainingUsers.map(
        t => {

          const user =
            findUser(
              db,
              t.userId
            );

          return {
            ...t,

            name:
              user
                ? user.name
                : "Unknown",

            email:
              user
                ? user.email
                : "",

            role:
              user
                ? user.role
                : ""
          };
        }
      );

    return json(res, 200, {
      trainees
    });
  }

  /*
  =====================================================
  ADMIN: CLEAR TRAINING NEGATIVE
  =====================================================
  */

  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/admin-clear"
  ) {

    const b =
      await body(req);

    const admin =
      isAdmin(
        db,
        b.adminEmail,
        b.adminPassword
      );

    if (!admin) {
      return json(res, 403, {
        error:
          "Administrator authorization required"
      });
    }

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

    const t =
      db.trainingUsers.find(
        x =>
          x.userId ===
          userId
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
          "No negative clearance is currently required"
      });
    }

    const required =
      money(
        t.depositRequired
      );

    const maxDeposit =
      money(
        db.training.maxDeposit
      );

    if (
      required <= 0 ||
      required > maxDeposit
    ) {
      return json(res, 400, {
        error:
          "Invalid demo deposit requirement"
      });
    }

    /*
    =================================================
    DEMO TRAINING CLEARANCE
    =================================================

    This does NOT move real money.

    The administrator is only clearing the
    simulated training negative so the trainee
    can continue the demonstration.
    */

    t.depositApproved =
      true;

    t.depositRequired =
      0;

    t.negativeAmount =
      0;

    t.balance =
      money(
        t.commission
      ) -
      money(
        t.totalNegative
      );

    t.status =
      "active";

    t.adminClearedAt =
      new Date()
        .toISOString();

    t.adminClearedBy =
      admin.id;

    writeDB(db);

    return json(res, 200, {

      message:
        "Demo negative cleared by administrator.",

      training:
        t,

      currency:
        "UGX"
    });
  }

    // ================================================
  // TRAINING DEMO WITHDRAWAL ACCOUNT - REGISTER
  // ================================================

  if (
    req.method === "POST" &&
    url.pathname === "/api/training/withdrawal-account"
  ) {

    const b = await body(req);

    const userId =
      String(b.userId || "").trim();

    const name =
      String(b.name || "").trim();

    const email =
      String(b.email || "").trim();

    const country =
      String(b.country || "Uganda").trim();

    const currency =
      String(b.currency || "UGX")
        .trim()
        .toUpperCase();

    const method =
      String(b.method || "").trim();

    const destination =
      String(b.destination || "").trim();

    if (
      !userId ||
      !name ||
      !email ||
      !method ||
      !destination
    ) {

      return json(res, 400, {
        error:
          "Name, email, payment method and demo destination are required."
      });

    }

    const trainee =
      db.users.find(
        u =>
          u.id === userId &&
          (
            u.role === "customer" ||
            u.role === "seller"
          )
      );

    if (!trainee) {

      return json(res, 404, {
        error:
          "Training user not found."
      });

    }

    if (!Array.isArray(
      db.trainingWithdrawalAccounts
    )) {

      db.trainingWithdrawalAccounts = [];

    }

    const existing =
      db.trainingWithdrawalAccounts.find(
        x =>
          x.userId === userId
      );

    if (existing) {

      existing.name = name;
      existing.email = email;
      existing.country = country;
      existing.currency = currency;
      existing.method = method;
      existing.destination = destination;
      existing.updatedAt =
        new Date().toISOString();

      writeDB(db);

      return json(res, 200, {
        message:
          "Demo withdrawal account updated.",
        account: existing
      });

    }

    const account = {

      id: id("demoacct"),

      userId,

      name,

      email,

      country,

      currency,

      method,

      destination,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };

    db.trainingWithdrawalAccounts.push(
      account
    );

    writeDB(db);

    return json(res, 201, {

      message:
        "Demo withdrawal account created successfully.",

      account

    });

  }  // ================================================
  // TRAINING DEMO WITHDRAWAL
  // ================================================

  if (
    req.method === "POST" &&
    url.pathname === "/api/training/withdraw"
  ) {

    const b = await body(req);

    const userId =
      String(b.userId || "").trim();

    if (!userId) {

      return json(res, 400, {
        error:
          "userId is required."
      });

    }

    if (!Array.isArray(
      db.trainingWithdrawalAccounts
    )) {

      db.trainingWithdrawalAccounts = [];

    }

    if (!Array.isArray(
      db.trainingWithdrawals
    )) {

      db.trainingWithdrawals = [];

    }

    const account =
      db.trainingWithdrawalAccounts.find(
        x =>
          x.userId === userId
      );

    if (!account) {

      return json(res, 400, {
        error:
          "Please create your demo withdrawal account first."
      });

    }

    let training =
      db.trainingUsers.find(
        x =>
          x.userId === userId
      );

    if (!training) {

      return json(res, 404, {
        error:
          "Training account not found."
      });

    }

    const balance =
      Number(
        training.balance || 0
      );

    if (balance <= 0) {

      return json(res, 400, {
        error:
          "Your demo balance is zero."
      });

    }

    if (
      training.status !== "completed"
    ) {

      return json(res, 400, {
        error:
          "Complete the training cycle before withdrawing."
      });

    }

    /*
      The withdrawal amount is ALWAYS the
      exact demo balance.

      The trainee cannot choose a larger
      or smaller amount.
    */

    const amount =
      balance;

    const withdrawal = {

      id:
        id("demowd"),

      userId,

      traineeName:
        account.name,

      email:
        account.email,

      country:
        account.country,

      currency:
        account.currency,

      method:
        account.method,

      destination:
        account.destination,

      amount,

      balanceBefore:
        balance,

      status:
        "DEMO SUCCESSFUL",

      reference:
        "DEMO-WD-" +
        crypto
          .randomBytes(4)
          .toString("hex")
          .toUpperCase(),

      createdAt:
        new Date().toISOString()

    };

    db.trainingWithdrawals.unshift(
      withdrawal
    );

    /*
      This is a simulation only.

       real money is transferred.

      The demo balance is reset to zero
      after the simulated withdrawal.
    */

    training.balance = 0;

writeDB(db);

return json(res, 200, {

  message:
    "Demo withdrawal successful.",

  warning:
    "DEMO  —  REAL MONEY WAS TRANSFERRED.",

  withdrawal

});

  }
 // ====================================================


  if (
    req.method === "POST" &&
    url.pathname ===
      "/api/training/new-cycle"
  ) {

    const b =
      await body(req);

    const adminEmail =
      String(
        b.adminEmail || ""
      );

    const adminPassword =
      String(
        b.adminPassword || ""
      );

    /*
    The trainee can request a new cycle,
    but the account itself must already have
    completed the previous cycle.
    */

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

    const t =
      db.trainingUsers.find(
        x =>
          x.userId ===
          userId
      );

    if (!t) {
      return json(res, 404, {
        error:
          "Training record not found"
      });
    }

    if (
      t.status !==
      "completed"
    ) {
      return json(res, 400, {
        error:
          "The current cycle has not been completed."
      });
    }

    t.cycle++;

    t.balance =
      money(
        db.training.startingBalance
      );

    t.commission =
      0;

    t.progress =
      0;

    t.status =
      "active";

    t.negativeAmount =
      0;

    t.depositRequired =
      0;

    t.depositApproved =
      false;

    t.totalNegative =
      0;

    writeDB(db);

    return json(res, 200, {

      message:
        "New demo cycle started from UGX 0.",

      training:
        t,

      currency:
        "UGX"
    });
		}  /*
  =====================================================
  UNKNOWN API ROUTE
  =====================================================
  */

  return json(res, 404, {
    error:
      "Not found"
  });
}


/*
=========================================================
SERVE WEBSITE FILES
=========================================================
*/

function serve(req, res) {

  let file =
    req.url.split("?")[0];

  if (
    file === "/" ||
    file === ""
  ) {
    file =
      "/index.html";
  }

  const publicRoot =
    path.join(
      ROOT,
      "public"
    );

  const fp =
    path.normalize(
      path.join(
        publicRoot,
        file
      )
    );

  if (
    !fp.startsWith(
      publicRoot
    )
  ) {
    return json(
      res,
      403,
      {
        error:
          "Forbidden"
      }
    );
  }

  fs.readFile(
    fp,
    (err, data) => {

      if (err) {

        res.writeHead(
          404,
          {
            "Content-Type":
              "text/plain; charset=utf-8"
          }
        );

        return res.end(
          "Not found"
        );
      }

      const ext =
        path.extname(fp);

      const types = {

        ".html":
          "text/html; charset=utf-8",

        ".css":
          "text/css; charset=utf-8",

        ".js":
          "application/javascript; charset=utf-8",

        ".json":
          "application/json; charset=utf-8",

        ".png":
          "image/png",

        ".jpg":
          "image/jpeg",

        ".jpeg":
          "image/jpeg",

        ".svg":
          "image/svg+xml",

        ".ico":
          "image/x-icon"
      };

      res.writeHead(
        200,
        {
          "Content-Type":
            types[ext] ||
            "application/octet-stream"
        }
      );

      res.end(data);
    }
  );
}


/*
=========================================================
START SERVER
=========================================================
*/

const server =
  http.createServer(
    async (
      req,
      res
    ) => {

      try {

        const url =
          new URL(
            req.url,
            `http://${
              req.headers.host ||
              "localhost"
            }`
          );

        if (
          url.pathname.startsWith(
            "/api/"
          )
        ) {

          await api(
            req,
            res,
            url
          );

        } else {

          serve(
            req,
            res
          );
        }

      } catch (error) {

        console.error(
          "SERVER ERROR:",
          error
        );

        json(
          res,
          500,
          {
            error:
              "Server error"
          }
        );
      }
    }
  );


server.listen(
  PORT,
  () => {

    console.log(
      `MyMarket Uganda running on port ${PORT}`
    );

  }
);
