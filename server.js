const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Paystack credentials from environment
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_live_22882af0d5c77b56e5b0ad41c67ae9d7a4af9aaf';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || 'pk_live_10a44c173a1d5331fa2243a57c5c493fccc17f06';

// In-memory order storage (replace with database for production)
const orders = [];

// 1. Initialize payment endpoint
app.post('/api/initialize-payment', async (req, res) => {
  try {
    const { email, amount, reference, metadata } = req.body;

    if (!email || !amount || !reference) {
      return res.status(400).json({ error: 'Missing required fields: email, amount, reference' });
    }

    // Amount must be in kobo (100 kobo = 1 naira)
    const amountInKobo = Math.round(amount * 100);

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amountInKobo,
        reference,
        metadata: metadata || {}
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      status: true,
      message: 'Authorization URL created',
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference
    });
  } catch (error) {
    console.error('Initialize payment error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to initialize payment',
      details: error.response?.data?.message || error.message
    });
  }
});

// 2. Verify payment endpoint
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const paymentData = response.data.data;

    if (paymentData.status === 'success') {
      // Save order
      const order = {
        id: `ORD-${Date.now()}`,
        reference: paymentData.reference,
        customer_email: paymentData.customer.email,
        amount: paymentData.amount / 100, // Convert back to naira
        status: 'completed',
        payment_method: 'paystack',
        created_at: new Date(),
        metadata: paymentData.metadata
      };

      orders.push(order);

      return res.json({
        status: true,
        message: 'Payment verified successfully',
        order,
        data: paymentData
      });
    } else {
      return res.status(400).json({
        status: false,
        message: 'Payment verification failed',
        data: paymentData
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to verify payment',
      details: error.response?.data?.message || error.message
    });
  }
});

// 3. Get orders endpoint
app.get('/api/orders', (req, res) => {
  res.json({
    status: true,
    message: 'Orders retrieved successfully',
    data: orders
  });
});

// 4. Get order by reference
app.get('/api/orders/:reference', (req, res) => {
  const order = orders.find(o => o.reference === req.params.reference);
  if (order) {
    res.json({ status: true, data: order });
  } else {
    res.status(404).json({ status: false, error: 'Order not found' });
  }
});

// 5. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: true, message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`✅ Lip by Deeva Beauty Payment Server running on http://localhost:${PORT}`);
  console.log(`📝 Payment API endpoints:`);
  console.log(`   POST /api/initialize-payment`);
  console.log(`   POST /api/verify-payment`);
  console.log(`   GET /api/orders`);
  console.log(`   GET /api/orders/:reference`);
});
