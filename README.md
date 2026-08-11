# MyMarket Uganda

A lightweight marketplace starter for Uganda.

## Included
- Customer storefront
- Product search and categories
- Shopping cart
- Checkout and order creation
- Customer accounts
- Seller registration and Seller Office
- Product creation for sellers
- Admin login and Admin Office
- Order status management
- JSON-file persistence (no database setup required)
- Mobile-friendly responsive UI

## Run on a computer
1. Install Node.js 18+.
2. Open a terminal in this folder.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## Demo accounts
Admin:
- Email: admin@mymarket.ug
- Password: admin123

Seller:
- Email: seller@mymarket.ug
- Password: seller123

## Important
This is a development/MVP foundation, not yet a production payment system. Before going live we should add:
- secure password hashing and sessions/JWT
- real database
- Mobile Money/payment gateway
- SMS/email notifications
- seller verification/KYC
- delivery partner management
- image uploads and cloud storage
- production hosting, HTTPS, backups and monitoring
- connect `mymarket.ug` when the domain is purchased
