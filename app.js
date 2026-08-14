let products=[],cart=JSON.parse(localStorage.getItem("mymarket_cart")||"[]"),user=JSON.parse(localStorage.getItem("mymarket_user")||"null");

const money=n=>"UGX "+Number(n).toLocaleString();
async function api(url,opts={}){const r=await fetch(url,opts);const j=await r.json();if(!r.ok)throw Error(j.error||"Request failed");return j}
function showPage(p){["shop","seller","admin"].forEach(x=>document.getElementById(x).classList.toggle("hidden",x!==p));if(p==="seller")renderSeller();if(p==="admin")renderAdmin();window.scrollTo({top:0,behavior:"smooth"})}
async function loadCategories(){let j=await api("/api/categories");document.getElementById("categories").innerHTML=j.categories.map(c=>`<button onclick="filterCat('${c}')">${c}</button>`).join("")}
async function loadProducts(category="All"){let q=document.getElementById("search").value;let j=await api("/api/products?q="+encodeURIComponent(q)+"&category="+encodeURIComponent(category));products=j.products;document.getElementById("products").innerHTML=products.map(p=>`<article class="card"><div class="pic">${p.image}</div><div class="cat">${p.category}</div><h3>${p.name}</h3><div class="price">${money(p.price)}</div><div class="stock">${p.stock>0?p.stock+" in stock":"Out of stock"}</div><button ${p.stock<1?"disabled":""} onclick="addToCart('${p.id}')">Add to Cart</button></article>`).join("")}
function filterCat(c){loadProducts(c)}
function addToCart(id){let p=products.find(x=>x.id===id),i=cart.find(x=>x.id===id);if(i)i.qty++;else cart.push({...p,qty:1});saveCart();toast("Added to cart")}
function saveCart(){localStorage.setItem("mymarket_cart",JSON.stringify(cart));document.getElementById("cartCount").textContent=cart.reduce((s,i)=>s+i.qty,0)}
function toast(t){alert(t)}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
function openLogin(){document.getElementById("modal").innerHTML=`<div class="modalbox"><h2>Login</h2><form onsubmit="login(event)"><div class="field"><label>Email</label><input id="email" type="email" required></div><div class="field"><label>Password</label><input id="password" type="password" required></div><button class="primary">Login</button></form><p>Demo admin: admin@mymarket.ug / admin123</p><p>Demo seller: seller@mymarket.ug / seller123</p><button onclick="registerForm()">Create account</button> <button onclick="closeModal()">Close</button></div>`;document.getElementById("modal").classList.remove("hidden")}
async function login(e){e.preventDefault();try{let j=await api("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.value,password:password.value})});user=j.user;localStorage.setItem("mymarket_user",JSON.stringify(user));closeModal();toast("Welcome "+user.name);if(user.role==="admin")showPage("admin");else if(user.role==="seller")showPage("seller")}catch(err){alert(err.message)}}
function registerForm(){document.getElementById("modal").innerHTML=`<div class="modalbox"><h2>Create account</h2><form onsubmit="register(event)"><div class="field"><label>Name</label><input id="rname" required></div><div class="field"><label>Email</label><input id="remail" type="email" required></div><div class="field"><label>Password</label><input id="rpass" type="password" required></div><div class="field"><label>Account type</label><select id="rrole"><option value="customer">Customer</option><option value="seller">Seller</option></select></div><div class="field"><label>Shop name (seller only)</label><input id="rshop"></div><button class="primary">Register</button></form><button onclick="openLogin()">Back</button></div>`}
async function register(e){e.preventDefault();try{let j=await api("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:rname.value,email:remail.value,password:rpass.value,role:rrole.value,shop:rshop.value})});user=j.user;localStorage.setItem("mymarket_user",JSON.stringify(user));closeModal();toast("Account created")}catch(err){alert(err.message)}}
function openCart(){let total=cart.reduce((s,i)=>s+i.price*i.qty,0);document.getElementById("modal").innerHTML=`<div class="modalbox"><h2>Your Cart</h2>${cart.length?cart.map(i=>`<div class="row" style="align-items:center;margin:10px 0"><span>${i.image} ${i.name}</span><span>${i.qty} × ${money(i.price)}</span><button onclick="removeCart('${i.id}')">×</button></div>`).join(""):`<p>Your cart is empty.</p>`}<hr><h3>Total: ${money(total)}</h3>${cart.length?`<button class="primary" onclick="checkoutForm()">Checkout</button>`:""} <button onclick="closeModal()">Close</button></div>`;document.getElementById("modal").classList.remove("hidden")}
function removeCart(id){cart=cart.filter(i=>i.id!==id);saveCart();openCart()}
function checkoutForm(){document.getElementById("modal").innerHTML=`<div class="modalbox"><h2>Checkout</h2><form onsubmit="checkout(event)"><div class="field"><label>Full name</label><input id="cname" value="${user?.name||""}" required></div><div class="field"><label>Phone number</label><input id="cphone" placeholder="07..." required></div><div class="field"><label>Delivery address</label><textarea id="caddress" placeholder="Town, area, landmark" required></textarea></div><div class="field"><label>Payment</label><select id="payment"><option>Cash on Delivery</option><option>Mobile Money - Coming soon</option></select></div><button class="primary">Place Order</button></form></div>`}
async function checkout(e){e.preventDefault();try{let j=await api("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerId:user?.id||"guest",customerName:cname.value,phone:cphone.value,address:caddress.value,payment:payment.value,items:cart})});cart=[];saveCart();document.getElementById("modal").innerHTML=`<div class="modalbox"><h2>✅ Order placed</h2><p>Order <b>${j.order.id}</b> has been received.</p><p>We will contact you on ${j.order.phone}.</p><button onclick="closeModal()">Done</button></div>`}catch(err){alert(err.message)}}
async function renderSeller(){
  let el=document.getElementById("sellerPanel");

  if(!user || user.role!=="seller"){
    el.innerHTML=`
      <div class="notice">
        Please login with a seller account to access Seller Office.
      </div>`;
    return;
  }

  try{

    let j=await api("/api/products");

    let mine=j.products.filter(
      p=>p.sellerId===user.id
    );

    let o=await api(
      "/api/orders?role=seller&userId="+
      encodeURIComponent(user.id)
    );

    let orders=o.orders||[];

    el.innerHTML=`

      <div class="stats">

        <div class="stat">
          Products
          <b>${mine.length}</b>
        </div>

        <div class="stat">
          Orders
          <b>${orders.length}</b>
        </div>

        <div class="stat">
          Sales
          <b>${money(
            orders.reduce(
              (s,x)=>s+Number(x.total||0),0
            )
          )}</b>
        </div>

      </div>


      <h3>Add product</h3>

      <form onsubmit="addProduct(event)" class="row">

        <input
          id="pn"
          placeholder="Product name"
          required
        >

        <input
          id="pp"
          type="number"
          placeholder="Price UGX"
          required
        >

        <input
          id="ps"
          type="number"
          placeholder="Stock"
          required
        >

        <select id="pc">

          <option>Phones</option>
          <option>Electronics</option>
          <option>Solar</option>
          <option>Fashion</option>
          <option>Home</option>
          <option>Beauty</option>
          <option>Groceries</option>

        </select>

        <button class="primary">
          Add
        </button>

      </form>


      <h3>My products</h3>

      <div style="overflow-x:auto">

      <table class="table">

        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>Stock</th>
        </tr>

        ${mine.map(p=>`

          <tr>

            <td>
              ${p.image||"🛍️"}
              ${p.name}
            </td>

            <td>
              ${money(p.price)}
            </td>

            <td>
              ${p.stock}
            </td>

          </tr>

        `).join("")}

      </table>

      </div>


      <h3>📦 Customer Orders</h3>

      ${
        orders.length
        ? orders.map(order=>`

          <div style="
            border:1px solid #ddd;
            border-radius:10px;
            padding:15px;
            margin:15px 0;
            background:#fff;
          ">

            <h4>
              Order ${order.id}
            </h4>

            <p>
              <b>Buyer:</b>
              ${order.customerName||"Guest"}
            </p>

            <p>
              <b>Phone:</b>
              ${order.phone||"Not provided"}
            </p>

            <p>
              <b>Delivery address:</b>
              ${order.address||"Not provided"}
            </p>

            <p>
              <b>Payment:</b>
              ${order.payment||"Cash on Delivery"}
            </p>

            <p>
              <b>Status:</b>
              ${order.status||"Pending"}
            </p>

            <h4>Products purchased</h4>

            ${
              (order.items||[]).map(item=>`

                <div style="
                  padding:8px 0;
                  border-bottom:1px solid #eee;
                ">

                  ${item.image||"🛍️"}

                  <b>${item.name}</b>

                  × ${item.qty}

                  — ${money(
                    Number(item.price||0) *
                    Number(item.qty||0)
                  )}

                </div>

              `).join("")
            }

            <h4>
              Order Total:
              ${money(order.total)}
            </h4>

            <p style="color:#687386">
              Ordered:
              ${
                order.createdAt
                ? new Date(order.createdAt)
                    .toLocaleString()
                : "Not available"
              }
            </p>

          </div>

        `).join("")
        : `
          <div class="notice">
            No customer orders yet.
          </div>
        `
      }

    `;

  }catch(err){

    console.error(err);

    el.innerHTML=`
      <div class="notice">
        Unable to load Seller Office data.
      </div>
    `;

  }
            }
async function addProduct(e){e.preventDefault();try{await api("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:pn.value,price:pp.value,stock:ps.value,category:pc.value,sellerId:user.id,image:"🛍️"})});renderSeller();loadProducts()}catch(err){alert(err.message)}}
async function renderAdmin(){let el=document.getElementById("adminPanel");if(!user||user.role!=="admin"){el.innerHTML=`<div class="notice">Please login as the administrator.</div>`;return}let s=await api("/api/admin/stats"),o=await api("/api/orders");el.innerHTML=`<div class="stats"><div class="stat">Customers<b>${s.customers}</b></div><div class="stat">Sellers<b>${s.sellers}</b></div><div class="stat">Products<b>${s.products}</b></div><div class="stat">Orders<b>${s.orders}</b></div><div class="stat">Revenue<b>${money(s.revenue)}</b></div></div><h3>Recent orders</h3><table class="table"><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Action</th></tr>${o.orders.map(x=>`<tr><td>${x.id}</td><td>${x.customerName}</td><td>${money(x.total)}</td><td>${x.status}</td><td><select onchange="setStatus('${x.id}',this.value)"><option>Pending</option><option>Confirmed</option><option>Processing</option><option>Out for delivery</option><option>Delivered</option><option>Cancelled</option></select></td></tr>`).join("")}</table>`}
async function setStatus(id,status){await api("/api/orders/"+id,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});renderAdmin()}
loadCategories();loadProducts();saveCart();async function openMyOrders(){
  if(!user){
    openLogin();
    return;
  }

  if(user.role !== "customer"){
    alert("Please login with a customer account to view My Orders.");
    return;
  }

  try{
    let j = await api("/api/orders?role=customer&userId="+encodeURIComponent(user.id));

    document.getElementById("modal").innerHTML = `
      <div class="modalbox">
        <h2>My Orders</h2>
        ${
          j.orders.length
          ? j.orders.map(o => `
            <div class="order-card">
              <h3>Order ${o.id}</h3>
              <p><b>Status:</b> ${o.status}</p>
              <p><b>Total:</b> ${money(o.total)}</p>
              <p><b>Delivery:</b> ${o.address}</p>
              <p><b>Phone:</b> ${o.phone}</p>
              <hr>
              ${o.items.map(i => `
                <div>${i.image} ${i.name} × ${i.qty}</div>
              `).join("")}
            </div>
          `).join("")
          : "<p>You have no orders yet.</p>"
        }
        <button onclick="closeModal()">Close</button>
      </div>
    `;

    document.getElementById("modal").classList.remove("hidden");

  }catch(err){
    alert(err.message);
  }
}
