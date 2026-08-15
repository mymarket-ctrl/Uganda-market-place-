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
