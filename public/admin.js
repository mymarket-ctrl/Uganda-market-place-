let admin = JSON.parse(
  localStorage.getItem("mymarket_admin") || "null"
);

let adminEmail = "";
let adminPassword = "";

function money(n) {
  return "UGX " + Number(n || 0).toLocaleString();
}


/*
====================================================
ADMIN LOGIN
====================================================
*/

async function adminLogin() {

  const email =
    document
      .getElementById("adminEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("adminPassword")
      .value;

  const error =
    document.getElementById(
      "loginError"
    );

  error.textContent = "";

  if (!email || !password) {

    error.textContent =
      "Enter administrator email and password.";

    return;
  }

  try {

    const response =
      await fetch(
        "/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.user
    ) {

      error.textContent =
        data.error ||
        "Login failed.";

      return;
    }

    if (
      data.user.role !==
      "admin"
    ) {

      error.textContent =
        "Administrator account required.";

      return;
    }

    admin =
      data.user;

    adminEmail =
      email;

    adminPassword =
      password;

    localStorage.setItem(
      "mymarket_admin",
      JSON.stringify(admin)
    );

    showDashboard();

  } catch (err) {

    console.error(err);

    error.textContent =
      "Unable to connect to server.";
  }
}


/*
====================================================
SHOW DASHBOARD
====================================================
*/

function showDashboard() {

  document
    .getElementById("adminLogin")
    .style.display = "none";

  document
    .getElementById("dashboard")
    .style.display = "block";

  loadStats();
}


/*
====================================================
LOGOUT
====================================================
*/

function adminLogout() {

  localStorage.removeItem(
    "mymarket_admin"
  );

  admin = null;

  adminEmail = "";
  adminPassword = "";

  location.reload();
}


/*
====================================================
CHECK EXISTING LOGIN
====================================================
*/

if (admin) {

  adminEmail =
    admin.email || "";

  showDashboard();
}


/*
====================================================
ADMIN API HELPER
====================================================
*/

async function adminRequest(
  url,
  options = {}
) {

  const separator =
    url.includes("?")
      ? "&"
      : "?";

  const finalUrl =
    url +
    separator +
    "adminEmail=" +
    encodeURIComponent(
      adminEmail
    ) +
    "&adminPassword=" +
    encodeURIComponent(
      adminPassword
    );

  const response =
    await fetch(
      finalUrl,
      options
    );

  const data =
    await response.json();

  if (
    response.status === 403
  ) {

    adminLogout();

    throw new Error(
      "Administrator authorization required."
    );
  }

  return data;
}


/*
====================================================
LOAD ADMIN STATISTICS
====================================================
*/

async function loadStats() {

  try {

    const data =
      await adminRequest(
        "/api/admin/stats"
      );

    document
      .getElementById(
        "customersCount"
      )
      .textContent =
      data.customers || 0;

    document
      .getElementById(
        "sellersCount"
      )
      .textContent =
      data.sellers || 0;

    document
      .getElementById(
        "productsCount"
      )
      .textContent =
      data.products || 0;

    document
      .getElementById(
        "ordersCount"
      )
      .textContent =
      data.orders || 0;

    document
      .getElementById(
        "revenueCount"
      )
      .textContent =
      money(
        data.revenue
      );

  } catch (err) {

    console.error(err);

  }
}


/*
====================================================
DISPLAY RESULT
====================================================
*/

function displayResult(
  title,
  html
) {

  document
    .getElementById(
      "resultsTitle"
    )
    .textContent =
    title;

  document
    .getElementById(
      "results"
    )
    .innerHTML =
    html;
}
/*
====================================================
LOAD ORDERS
====================================================
*/

async function loadOrders() {

  try {

    const data =
      await adminRequest(
        "/api/orders"
      );

    const orders =
      data.orders || [];

    if (!orders.length) {

      displayResult(
        "🛒 Orders",
        "<p>No orders found.</p>"
      );

      return;
    }

    let html = `
      <div class="table-wrapper">

      <table>

        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
    `;

    orders.forEach(order => {

      html += `
        <tr>

          <td>
            ${escapeHtml(order.id)}
          </td>

          <td>
            ${escapeHtml(order.customerName)}
          </td>

          <td>
            ${escapeHtml(order.phone)}
          </td>

          <td>
            ${money(order.total)}
          </td>

          <td>
            ${escapeHtml(
              order.payment || "-"
            )}
          </td>

          <td>
            <span class="status">
              ${escapeHtml(
                order.status || "Pending"
              )}
            </span>
          </td>

          <td>
            ${formatDate(
              order.createdAt
            )}
          </td>

        </tr>
      `;

    });

    html += `
        </tbody>

      </table>

      </div>
    `;

    displayResult(
      "🛒 Marketplace Orders",
      html
    );

  } catch (err) {

    displayResult(
      "Orders",
      "<p>Unable to load orders.</p>"
    );

  }
}


/*
====================================================
LOAD PRODUCTS
====================================================
*/

async function loadProducts() {

  try {

    const response =
      await fetch(
        "/api/products"
      );

    const data =
      await response.json();

    const products =
      data.products || [];

    if (!products.length) {

      displayResult(
        "📦 Products",
        "<p>No products found.</p>"
      );

      return;
    }

    let html = `
      <div class="table-wrapper">

      <table>

        <thead>

          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Seller ID</th>
            <th>Status</th>
          </tr>

        </thead>

        <tbody>
    `;

    products.forEach(product => {

      html += `
        <tr>

          <td>
            ${escapeHtml(
              product.image || ""
            )}
            ${escapeHtml(
              product.name
            )}
          </td>

          <td>
            ${escapeHtml(
              product.category
            )}
          </td>

          <td>
            ${money(
              product.price
            )}
          </td>

          <td>
            ${Number(
              product.stock || 0
            )}
          </td>

          <td>
            ${escapeHtml(
              product.sellerId
            )}
          </td>

          <td>

            <span class="status">

              ${
                product.active !== false
                  ? "Active"
                  : "Inactive"
              }

            </span>

          </td>

        </tr>
      `;

    });

    html += `
        </tbody>

      </table>

      </div>
    `;

    displayResult(
      "📦 Marketplace Products",
      html
    );

  } catch (err) {

    console.error(err);

    displayResult(
      "Products",
      "<p>Unable to load products.</p>"
    );

  }
}


/*
====================================================
LOAD SELLERS
====================================================
*/

async function loadSellers() {

  try {

    const response =
      await fetch(
        "/api/admin/stats"
      );

    if (!response.ok) {
      throw new Error(
        "Unable to load sellers"
      );
    }

    /*
      Seller details will be connected
      to the dedicated admin-user endpoint
      in the next server update.
    */

    displayResult(
      "🏪 Sellers",
      `
        <p>
          Seller management section
          is ready.
        </p>

        <p>
          Total sellers:
          <strong>
            ${
              document
                .getElementById(
                  "sellersCount"
                )
                .textContent
            }
          </strong>
        </p>
      `
    );

  } catch (err) {

    displayResult(
      "Sellers",
      "<p>Unable to load sellers.</p>"
    );

  }
}


/*
====================================================
LOAD CUSTOMERS
====================================================
*/

async function loadCustomers() {

  try {

    const response =
      await fetch(
        "/api/admin/stats"
      );

    if (!response.ok) {
      throw new Error(
        "Unable to load customers"
      );
    }

    displayResult(
      "👥 Customers",
      `
        <p>
          Customer management section
          is ready.
        </p>

        <p>
          Total customers:
          <strong>
            ${
              document
                .getElementById(
                  "customersCount"
                )
                .textContent
            }
          </strong>
        </p>
      `
    );

  } catch (err) {

    displayResult(
      "Customers",
      "<p>Unable to load customers.</p>"
    );

  }
}


/*
====================================================
ESCAPE HTML
====================================================
*/

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


/*
====================================================
FORMAT DATE
====================================================
*/

function formatDate(value) {

  if (!value) {
    return "-";
  }

  try {

    return new Date(
      value
    ).toLocaleString();

  } catch (e) {

    return "-";

  }
    }
