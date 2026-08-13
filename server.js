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
    {id:"u_admin", name:"MyMarket Admin", email:"admin@mymarket.ug", password:"admin123", role:"admin"},
    {id:"u_seller", name:"Demo Electronics", email:"seller@mymarket.ug", password:"seller123", role:"seller", shop:"Demo Electronics Uganda"}
  ],
  products: [
    {id:"p1", name:"Samsung Galaxy A15", category:"Phones", price:699000, stock:12, sellerId:"u_seller", image:"📱", active:true},
    {id:"p2", name:"Solar Home Kit 100W", category:"Solar", price:320000, stock:20, sellerId:"u_seller", image:"☀️", active:true},
    {id:"p3", name:"Bluetooth Speaker", category:"Electronics", price:85000, stock:30, sellerId:"u_seller", image:"🔊", active:true},
    {id:"p4", name:"Men's Sneakers", category:"Fashion", price:120000, stock:18, sellerId:"u_seller", image:"👟", active:true}
  ],
  orders: [],
training: {
  startingBalance: 0,
  totalTasks: 40,
  maxDeposit: 30000,
  commissionPerTask: 2500,
  products: [trainingUsers: []
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
}
};

if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify(seed, null, 2));

function readDB(){ return JSON.parse(fs.readFileSync(DB, "utf8")); }
function writeDB(db){ fs.writeFileSync(DB, JSON.stringify(db, null, 2)); }
function id(prefix){ return prefix + "_" + crypto.randomBytes(5).toString("hex"); }
function json(res, code, obj){
  const body = JSON.stringify(obj);
  res.writeHead(code, {"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,PUT,OPTIONS"});
  res.end(body);
}
function body(req){
  return new Promise((resolve,reject)=>{
    let s=""; req.on("data",c=>s+=c); req.on("end",()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}})
  });
}
function safeUser(u){ const {password,...x}=u; return x; }

async function api(req,res,url){
  if(req.method==="OPTIONS"){ res.writeHead(204, {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,PUT,OPTIONS"}); return res.end(); }
  const db=readDB();

  if(req.method==="GET" && url.pathname==="/api/products"){
    let list=db.products.filter(p=>p.active!==false);
    const q=(url.searchParams.get("q")||"").toLowerCase();
    const cat=url.searchParams.get("category");
    if(q) list=list.filter(p=>(p.name+" "+p.category).toLowerCase().includes(q));
    if(cat && cat!=="All") list=list.filter(p=>p.category===cat);
    return json(res,200,{products:list});
  }

  if(req.method==="GET" && url.pathname==="/api/categories"){
    return json(res,200,{categories:["Phones","Electronics","Solar","Fashion","Home","Beauty","Groceries"]});
  }

  if(req.method==="POST" && url.pathname==="/api/login"){
    const b=await body(req);
    const u=db.users.find(x=>x.email.toLowerCase()===String(b.email||"").toLowerCase() && x.password===b.password);
    if(!u) return json(res,401,{error:"Invalid email or password"});
    return json(res,200,{user:safeUser(u)});
  }

  if(req.method==="POST" && url.pathname==="/api/register"){
    const b=await body(req);
    if(!b.name || !b.email || !b.password) return json(res,400,{error:"Name, email and password are required"});
    if(db.users.some(u=>u.email.toLowerCase()===b.email.toLowerCase())) return json(res,409,{error:"Email already exists"});
    const u={id:id("u"),name:b.name,email:b.email,password:b.password,role:b.role==="seller"?"seller":"customer",shop:b.shop||""};
    db.users.push(u); writeDB(db); return json(res,201,{user:safeUser(u)});
  }

  if(req.method==="POST" && url.pathname==="/api/orders"){
    const b=await body(req);
    if(!b.items?.length) return json(res,400,{error:"Cart is empty"});
    const total=b.items.reduce((s,i)=>s+(Number(i.price)*Number(i.qty)),0);
    for(const i of b.items){
      const p=db.products.find(x=>x.id===i.id);
      if(!p || p.stock < i.qty) return json(res,400,{error:`Insufficient stock for ${i.name}`});
    }
    b.items.forEach(i=>{ const p=db.products.find(x=>x.id===i.id); p.stock-=i.qty; });
    const order={id:id("ord"),customerId:b.customerId||"guest",customerName:b.customerName||"Guest",phone:b.phone||"",address:b.address||"",items:b.items,total,status:"Pending",payment:b.payment||"Cash on Delivery",createdAt:new Date().toISOString()};
    db.orders.unshift(order); writeDB(db);
    return json(res,201,{order});
  }

  if(req.method==="GET" && url.pathname==="/api/orders"){
    const role=url.searchParams.get("role"), uid=url.searchParams.get("userId");
    let orders=db.orders;
    if(role==="customer") orders=orders.filter(o=>o.customerId===uid);
    if(role==="seller"){
      const ids=db.products.filter(p=>p.sellerId===uid).map(p=>p.id);
      orders=orders.filter(o=>o.items.some(i=>ids.includes(i.id)));
    }
    return json(res,200,{orders});
  }

  if(req.method==="POST" && url.pathname==="/api/products"){
    const b=await body(req);
    if(!b.name || !b.price || !b.sellerId) return json(res,400,{error:"Product name, price and sellerId are required"});
    const p={id:id("p"),name:b.name,category:b.category||"Other",price:Number(b.price),stock:Number(b.stock||0),sellerId:b.sellerId,image:b.image||"🛍️",active:true};
    db.products.push(p); writeDB(db); return json(res,201,{product:p});
  }

  if(req.method==="PUT" && url.pathname.startsWith("/api/orders/")){
    const oid=url.pathname.split("/").pop(), b=await body(req);
    const o=db.orders.find(x=>x.id===oid);
    if(!o) return json(res,404,{error:"Order not found"});
    if(b.status) o.status=b.status;
    writeDB(db); return json(res,200,{order:o});
  }

  if(req.method==="GET" && url.pathname==="/api/admin/stats"){
    const revenue=db.orders.reduce((s,o)=>s+o.total,0);
    return json(res,200,{customers:db.users.filter(u=>u.role==="customer").length,sellers:db.users.filter(u=>u.role==="seller").length,products:db.products.length,orders:db.orders.length,revenue});
  }
  // TRAINING: get settings
if(req.method==="GET" && url.pathname==="/api/training/settings"){
  return json(res,200,{training:db.training});
}

// TRAINING: update settings
if(req.method==="POST" && url.pathname==="/api/training/settings"){
  const b=await body(req);

  if(!db.training){// TRAINING: trainee state
if(req.method==="GET" && url.pathname==="/api/training/state"){
  const userId=url.searchParams.get("userId");
  if(!userId) return json(res,400,{error:"userId is required"});

  let t=db.trainingUsers.find(x=>x.userId===userId);

  if(!t){
    t={
      userId,
      balance:0,
      commission:0,
      progress:0,
      status:"active",
      negativeAmount:0,
      depositRequired:0,
      depositApproved:false,
      cycle:1,
      completedCycles:0
    };
    db.trainingUsers.push(t);
    writeDB(db);
  }

  return json(res,200,{training:t});
}

// TRAINING: optimize one product
if(req.method==="POST" && url.pathname==="/api/training/optimize"){
  const b=await body(req);
  const userId=String(b.userId||"");
const adminEmail=String(b.adminEmail||"").toLowerCase();

const admin=db.users.find(
  u=>u.email.toLowerCase()===adminEmail && u.role==="admin"
);

if(!admin){
  return json(res,403,{
    error:"Administrator authorization required"
  });
}
  if(!userId)
    return json(res,400,{error:"userId is required"});

  let t=db.trainingUsers.find(x=>x.userId===userId);

  if(!t){
    t={
      userId,
      balance:0,
      commission:0,
      progress:0,
      status:"active",
      negativeAmount:0,
      depositRequired:0,
      depositApproved:false,
      cycle:1,
      completedCycles:0
    };
    db.trainingUsers.push(t);
  }

  if(t.status==="completed")
    return json(res,400,{error:"Cycle completed. Start a new cycle."});

  if(t.status==="waiting_admin")
    return json(res,400,{
      error:"Admin action required",
      depositRequired:t.depositRequired
    });

  if(t.progress>=40)
    return json(res,400,{error:"Optimization already completed"});

  t.progress++;

  // Commission is simulated demo value.
  const commission=Number(db.training.commissionPerTask||2500);
  t.commission+=commission;
  t.balance+=commission;

  // Dynamic simulated negative event.
  // It is never greater than the configured maximum deposit.
  const negativeOptions=[5000,10000,15000,20000,25000,30000];
  const negative=negativeOptions[
    Math.floor(Math.random()*negativeOptions.length)
  ];

  /*
    The negative event is simulated and clearly separated
    from the trainee's commission.
  */
  if(t.progress<40 && Math.random()<0.12){
    t.balance-=negative;
    t.negativeAmount=negative;
    t.depositRequired=negative;
    t.depositApproved=false;
    t.status="waiting_admin";
  }

  if(t.progress===40){
    t.status="completed";
    t.completedCycles++;
  }

  writeDB(db);

  return json(res,200,{
    message:t.status==="waiting_admin"
      ? "Optimization paused. Please contact the administrator."
      : t.progress===40
        ? "Optimization completed 40/40."
        : "Optimization successful.",
    training:t
  });
}// TRAINING: admin clears simulated deposit requirement
if(req.method==="POST" && url.pathname==="/api/training/admin-clear"){
  const b=await body(req);
  const userId=String(b.userId||"");

  if(!userId)
    return json(res,400,{error:"userId is required"});

  const t=db.trainingUsers.find(x=>x.userId===userId);

  if(!t)
    return json(res,404,{error:"Trainee training record not found"});

  if(t.status!=="waiting_admin")
    return json(res,400,{error:"No admin action is currently required"});

  const required=Number(t.depositRequired||0);

  if(required<=0 || required>Number(db.training.maxDeposit||30000))
    return json(res,400,{error:"Invalid deposit requirement"});

  /*
    Demo-only administrative clearance.
    No real payment is processed by this endpoint.
  */
  t.balance=0;
  t.depositApproved=true;
  t.depositRequired=0;
  t.negativeAmount=0;
  t.status="active";

  writeDB(db);

  return json(res,200,{
    message:"Demo deposit cleared by administrator.",
    training:t
  });
}
    return json(res,500,{error:"Training settings not found"});
  }

  if(b.startingBalance !== undefined)
    db.training.startingBalance=Number(b.startingBalance);

  if(b.negativeTask !== undefined)
    db.training.negativeTask=Number(b.negativeTask);

  if(b.negativeBalance !== undefined)
    db.training.negativeBalance=Number(b.negativeBalance);

  if(b.demoDeposit !== undefined)
    db.training.demoDeposit=Number(b.demoDeposit);

  if(b.commissionPerTask !== undefined)
    db.training.commissionPerTask=Number(b.commissionPerTask);

  if(Array.isArray(b.products) && b.products.length===40)
    db.training.products=b.products;

  writeDB(db);

  return json(res,200,{
    message:"Training settings updated",
    training:db.training
  });
}
  return json(res,404,{error:"Not found"});
}

function serve(req,res){
  let file=req.url.split("?")[0];
  if(file==="/") file="/index.html";
  const fp=path.normalize(path.join(ROOT,"public",file));
  if(!fp.startsWith(path.join(ROOT,"public"))) return json(res,403,{error:"Forbidden"});
  fs.readFile(fp,(err,data)=>{
    if(err){ res.writeHead(404); return res.end("Not found"); }
    const ext=path.extname(fp), types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8"};
    res.writeHead(200,{"Content-Type":types[ext]||"application/octet-stream"}); res.end(data);
  });
}

const server=http.createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,`http://${req.headers.host||"localhost"}`);
    if(u.pathname.startsWith("/api/")) await api(req,res,u); else serve(req,res);
  }catch(e){ console.error(e); json(res,500,{error:"Server error"}); }
});
server.listen(PORT,()=>console.log(`MyMarket Uganda running at http://localhost:${PORT}`));
