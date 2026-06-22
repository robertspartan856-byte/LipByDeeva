# 🚀 Lip by Deeva Beauty - Paystack Integration Guide

## Overview
Your website is now integrated with **Paystack** for real payment processing. The system includes:
- ✅ Frontend integration with Paystack inline checkout
- ✅ Node.js/Express backend for secure payment verification
- ✅ Support for Card Payment, Bank Transfer, and Cash on Delivery
- ✅ Payment verification and order tracking

---

## 📋 Prerequisites

Before running the payment system, ensure you have:
1. **Node.js** installed (v14+ recommended) - [Download](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **Paystack Account** with API keys (you already have these!)
4. **Backend URL** where your server will run

---

## 🔧 Setup Instructions

### Step 1: Install Backend Dependencies

Open your terminal in the project folder and run:

```bash
npm install
```

This will install all required packages:
- `express` - Web framework
- `cors` - Cross-origin requests
- `axios` - HTTP client for Paystack API
- `dotenv` - Environment variables

### Step 2: Verify Environment Variables

Check that `.env` file has your Paystack keys:

```env
PORT=3000
PAYSTACK_PUBLIC_KEY=pk_live_10a44c173a1d5331fa2243a57c5c493fccc17f06
PAYSTACK_SECRET_KEY=sk_live_22882af0d5c77b56e5b0ad41c67ae9d7a4af9aaf
```

**⚠️ IMPORTANT:** Keep your Secret Key private! Never commit `.env` to git.

### Step 3: Start the Backend Server

```bash
npm start
```

You should see:
```
✅ Lip by Deeva Beauty Payment Server running on http://localhost:3000
📝 Payment API endpoints:
   POST /api/initialize-payment
   POST /api/verify-payment
   GET /api/orders
   GET /api/orders/:reference
```

### Step 4: Open Your Website

1. **Keep the backend running** in one terminal
2. **Open a new terminal** and navigate to your project
3. Run a local server (if you have Python 3):
   ```bash
   python -m http.server 8000
   ```
   Or use Live Server in VS Code (extension)

4. Visit: **http://localhost:8000** (or your local server URL)

---

## 💳 Testing the Payment Flow

### Test Card Details (from Paystack):
- **Card Number:** `4111 1111 1111 1111`
- **Expiry:** Any future date (e.g., 12/27)
- **CVV:** Any 3 digits (e.g., 123)

### Complete Payment Flow:
1. Add products to cart
2. Go to checkout
3. Fill in your details
4. **Select "Card payment"** as payment method
5. Click **"Place Order"**
6. Paystack popup will appear
7. Enter test card details
8. Complete payment
9. Order confirmation shows with Order ID
10. Cart clears and redirects to homepage

---

## 🔌 API Endpoints

### 1. Initialize Payment
```
POST http://localhost:3000/api/initialize-payment

Body:
{
  "email": "customer@example.com",
  "amount": 7000,
  "reference": "ref-1234567890",
  "metadata": {
    "customer_name": "John Doe",
    "cart_items": [...]
  }
}

Response:
{
  "status": true,
  "message": "Authorization URL created",
  "authorization_url": "https://checkout.paystack.com/...",
  "reference": "ref-1234567890"
}
```

### 2. Verify Payment
```
POST http://localhost:3000/api/verify-payment

Body:
{
  "reference": "ref-1234567890"
}

Response:
{
  "status": true,
  "message": "Payment verified successfully",
  "order": {
    "id": "ORD-1234567890",
    "reference": "ref-1234567890",
    "amount": 7000,
    "status": "completed",
    ...
  }
}
```

### 3. Get All Orders
```
GET http://localhost:3000/api/orders

Response:
{
  "status": true,
  "message": "Orders retrieved successfully",
  "data": [...]
}
```

### 4. Get Order by Reference
```
GET http://localhost:3000/api/orders/:reference

Response:
{
  "status": true,
  "data": {
    "id": "ORD-1234567890",
    ...
  }
}
```

---

## 🌐 Deploying to Production

### Frontend Deployment
1. Upload your HTML/CSS/JS files to a hosting service:
   - **Netlify** (recommended for static sites)
   - **Vercel**
   - **GitHub Pages**
   - Traditional web hosting

### Backend Deployment
Deploy your Node.js backend to:

**Option 1: Heroku (free tier available)**
```bash
# Install Heroku CLI, then:
heroku create lipbydeeva-payment
heroku config:set PAYSTACK_PUBLIC_KEY=pk_live_...
heroku config:set PAYSTACK_SECRET_KEY=sk_live_...
git push heroku main
```

**Option 2: Railway (recommended)**
- Sign up at [railway.app](https://railway.app)
- Connect GitHub repo
- Set environment variables
- Deploy automatically

**Option 3: Render**
- Sign up at [render.com](https://render.com)
- Create new Web Service
- Set environment variables
- Deploy

### Update Frontend URL
After deploying backend, update `BACKEND_URL` in `script.js`:

```javascript
// Change this line in script.js
const BACKEND_URL = 'http://localhost:3000/api'; // Local
// To your deployed URL
const BACKEND_URL = 'https://lipbydeeva-payment.herokuapp.com/api'; // Heroku
```

---

## ✅ Features Included

### Payment Methods
- ✅ **Card Payment** - Paystack inline checkout
- ✅ **Bank Transfer** - Manual order placement
- ✅ **Cash on Delivery** - Manual order placement

### Order Management
- ✅ Orders stored with unique IDs
- ✅ Payment status tracking
- ✅ Customer metadata saved
- ✅ Cart clears after payment

### Security
- ✅ Secret key verification on backend
- ✅ CORS enabled for your domain
- ✅ Environment variables for sensitive keys
- ✅ Payment verification before order confirmation

---

## 🔍 Troubleshooting

### Issue: "Cannot connect to backend"
**Solution:** 
- Ensure backend is running: `npm start`
- Check that it's on port 3000
- Verify `BACKEND_URL` in script.js is correct

### Issue: "Payment initialized but modal doesn't appear"
**Solution:**
- Check browser console for errors (F12)
- Ensure Paystack script loaded: check Network tab
- Verify `PAYSTACK_PUBLIC_KEY` in script.js is correct

### Issue: "Payment successful but cart doesn't clear"
**Solution:**
- Check browser's localStorage (DevTools > Storage)
- Verify script.js has the Paystack integration code
- Check that `localStorage.removeItem('lb_cart')` is being called

### Issue: "Backend returns 403 or 401 errors"
**Solution:**
- Verify your Paystack API keys are correct
- Check .env file has correct keys
- Ensure your Paystack account has API access enabled

---

## 📞 Support & Resources

### Paystack Documentation
- [Paystack API Reference](https://paystack.com/docs/api/)
- [Paystack Integration Guide](https://paystack.com/docs/payments/integrate/)
- [Test Card Details](https://paystack.com/docs/testing/)

### Node.js Hosting
- [Heroku Documentation](https://devcenter.heroku.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)

### Your Account
- **Paystack Dashboard:** https://dashboard.paystack.com
- **API Keys:** Settings > API Keys & Webhooks

---

## 🎯 Next Steps (Optional Enhancements)

1. **Add Webhooks** - Real-time payment notifications
2. **Email Notifications** - Send order confirmation emails
3. **Order History** - Customer dashboard to view past orders
4. **Admin Panel** - Manage orders and view analytics
5. **SMS Notifications** - Send payment confirmations via SMS
6. **Multiple Payment Methods** - Add Flutterwave, Stripe, etc.

---

## 📝 File Structure
```
LipByDeeva/
├── index.html                 (Homepage)
├── shop.html                  (Shop page)
├── contact.html               (Contact page)
├── style.css                  (Styling)
├── script.js                  (Frontend logic with Paystack)
├── server.js                  (Backend payment server)
├── package.json               (Dependencies)
├── .env                       (API keys)
├── shop/
│   ├── cart.html
│   ├── checkout.html         (Paystack checkout page)
│   ├── account.html
│   ├── orders.html
│   ├── wishlist.html
│   └── products/
│       └── (9 product pages)
├── images/                    (Product images)
└── PAYSTACK_SETUP.md         (This file)
```

---

## ⚡ Quick Start Summary

1. **Install:** `npm install`
2. **Start Backend:** `npm start`
3. **Start Frontend:** Open in browser or local server
4. **Test Payment:** Use test card `4111 1111 1111 1111`
5. **Deploy:** Follow production deployment steps

---

**Your Lip by Deeva Beauty e-commerce site is now ready for REAL payments! 🎉**

Questions? Check the troubleshooting section or contact Paystack support.
